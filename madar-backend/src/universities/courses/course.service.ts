import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course, CourseDocument } from './schemas/course.schema';
import { StudyPlan, StudyPlanDocument } from '../study-plans/schemas/study-plan.schema';
import { University, UniversityDocument } from '../schemas/university.schema';
import { CollegeCoordinator, CollegeCoordinatorDocument } from '../college-coordinators/schemas/college-coordinator.schema';
import { Skill, SkillDocument } from '../../skills/schemas/skill.schema';
import { AuditLog, AuditLogDocument } from '../../common/audit-logs/schemas/audit-log.schema';
import { CurriculumService } from '../curriculum/curriculum.service';
import { CreateCourseDto, MapCourseSkillDto, UpdateCourseDto } from './dto/course.dto';

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);
  constructor(
    @InjectModel(Course.name) private readonly model: Model<CourseDocument>,
    @InjectModel(StudyPlan.name) private readonly plans: Model<StudyPlanDocument>,
    @InjectModel(University.name) private readonly universities: Model<UniversityDocument>,
    @InjectModel(CollegeCoordinator.name) private readonly staff: Model<CollegeCoordinatorDocument>,
    @InjectModel(Skill.name) private readonly skills: Model<SkillDocument>,
    @InjectModel(AuditLog.name) private readonly audits: Model<AuditLogDocument>,
    private readonly curriculum: CurriculumService,
  ) {}

  private async access(userId: string) {
    const owner: any = await this.universities.findOne({ userId: new Types.ObjectId(userId), status: 'active' }).lean();
    if (owner) return { university: owner, role: 'university', collegeId: null, permissions: ['*'] };
    const member: any = await this.staff.findOne({ userId: new Types.ObjectId(userId), status: 'active', invitationStatus: 'accepted' }).lean();
    if (!member) throw new ForbiddenException('Institutional access unavailable');
    const university: any = await this.universities.findOne({ _id: member.universityId, status: 'active' }).lean();
    if (!university) throw new ForbiddenException('University inactive');
    return { university, role: member.role, collegeId: member.role === 'coordinator' ? member.collegeId : null, permissions: member.permissions || [] };
  }
  private scope(access: any) { return { universityId: access.university._id, ...(access.collegeId ? { collegeId: access.collegeId } : {}) }; }

  async findAll(userId: string, query: any = {}) {
    const access = await this.access(userId);
    if (!access.permissions.includes('courses:read') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No read access to courses');
    }
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    const filter: any = { ...this.scope(access) };
    if (!query.includeArchived) filter.status = { $ne: 'archived' };
    if (query.status) filter.status = query.status;
    if (query.studyPlanId) filter.studyPlanId = new Types.ObjectId(query.studyPlanId);
    if (query.departmentId) filter.departmentId = new Types.ObjectId(query.departmentId);
    if (query.search) filter.$or = [{ code: { $regex: query.search, $options: 'i' } }, { name: { $regex: query.search, $options: 'i' } }, { nameAr: { $regex: query.search, $options: 'i' } }];
    const [items, total] = await Promise.all([
      this.model.find(filter).populate('skillMappings.skillId', 'name nameAr category').sort({ code: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);
    return { items: items.map((item: any) => this.dto(item)), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(userId: string, dto: CreateCourseDto) {
    const access = await this.access(userId);
    if (!access.permissions.includes('courses:write') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No write access to courses');
    }
    if (!['university', 'coordinator'].includes(access.role)) throw new ForbiddenException();
    const plan: any = await this.editablePlan(access, dto.studyPlanId);
    await this.validateCode(plan._id, dto.code);
    await this.validatePrerequisites(plan._id, dto.prerequisites || []);
    await this.validateCorequisites(plan._id, dto.corequisites || []);
    const course: any = await this.model.create({
      universityId: plan.universityId, collegeId: plan.collegeId, departmentId: plan.departmentId, studyPlanId: plan._id,
      code: dto.code.trim().toUpperCase(), name: dto.name, nameAr: dto.nameAr, nameEn: dto.nameEn,
      description: dto.description, descriptionAr: dto.descriptionAr, descriptionEn: dto.descriptionEn,
      credits: dto.creditHours, lectureHours: dto.lectureHours, tutorialHours: dto.tutorialHours,
      practicalHours: dto.practicalHours, laboratoryHours: dto.laboratoryHours,
      level: dto.level, semester: dto.semester, type: dto.type,
      prerequisites: (dto.prerequisites || []).map((value) => new Types.ObjectId(value)),
      corequisites: (dto.corequisites || []).map((value) => new Types.ObjectId(value)),
      learningOutcomes: dto.learningOutcomes || [],
      learningOutcomesAr: dto.learningOutcomesAr || [],
      learningOutcomesEn: dto.learningOutcomesEn || [],
      eligibilityRules: dto.eligibilityRules || [], electiveGroup: dto.electiveGroup,
      skills: [], skillMappings: [], status: 'active', metadata: {},
    });
    await this.plans.updateOne({ _id: plan._id }, { $addToSet: { courses: course._id } });
    await this.audit(userId, 'CREATE_COURSE', course._id, { planId: plan._id });
    this.scheduleAnalysis(userId, String(plan.departmentId), 'course_created');
    return this.dto(course.toObject());
  }

  async update(userId: string, id: string, dto: UpdateCourseDto) {
    const access = await this.access(userId);
    if (!access.permissions.includes('courses:write') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No write access to courses');
    }
    const course: any = await this.model.findOne({ _id: new Types.ObjectId(id), ...this.scope(access) }).lean();
    if (!course) throw new NotFoundException('Course not found in permitted scope');
    await this.editablePlan(access, String(course.studyPlanId));
    if (dto.code) await this.validateCode(course.studyPlanId, dto.code, course._id);
    if (dto.prerequisites) {
      await this.validatePrerequisites(course.studyPlanId, dto.prerequisites, course._id);
      await this.ensureAcyclic(course.studyPlanId, course._id, dto.prerequisites);
    }
    if (dto.corequisites) {
      await this.validateCorequisites(course.studyPlanId, dto.corequisites, course._id);
    }
    const update: any = {};
    for (const [source, target] of Object.entries({
      code: 'code', name: 'name', nameAr: 'nameAr', nameEn: 'nameEn', description: 'description',
      descriptionAr: 'descriptionAr', descriptionEn: 'descriptionEn',
      creditHours: 'credits', lectureHours: 'lectureHours', tutorialHours: 'tutorialHours',
      practicalHours: 'practicalHours', laboratoryHours: 'laboratoryHours',
      level: 'level', semester: 'semester', type: 'type',
      learningOutcomes: 'learningOutcomes', learningOutcomesAr: 'learningOutcomesAr',
      learningOutcomesEn: 'learningOutcomesEn', eligibilityRules: 'eligibilityRules', electiveGroup: 'electiveGroup'
    })) {
      if ((dto as any)[source] !== undefined) update[target] = source === 'code' ? String((dto as any)[source]).trim().toUpperCase() : (dto as any)[source];
    }
    if (dto.prerequisites) update.prerequisites = dto.prerequisites.map((value) => new Types.ObjectId(value));
    if (dto.corequisites) update.corequisites = dto.corequisites.map((value) => new Types.ObjectId(value));
    const saved: any = await this.model.findByIdAndUpdate(course._id, { $set: update }, { new: true }).populate('skillMappings.skillId', 'name nameAr category').lean();
    await this.audit(userId, 'UPDATE_COURSE', id, dto);
    this.scheduleAnalysis(userId, String(course.departmentId), 'course_updated');
    return this.dto(saved);
  }

  async mapSkill(userId: string, id: string, dto: MapCourseSkillDto) {
    const access = await this.access(userId);
    if (!access.permissions.includes('course-skills:manage') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No access to manage course skills');
    }
    const course: any = await this.model.findOne({ _id: new Types.ObjectId(id), ...this.scope(access), status: 'active' }).lean();
    if (!course) throw new NotFoundException('Course not found in permitted scope');
    await this.editablePlan(access, String(course.studyPlanId));
    if (!await this.skills.exists({ _id: new Types.ObjectId(dto.skillId) })) throw new NotFoundException('Skill not found');
    await this.model.updateOne({ _id: course._id }, { $pull: { skillMappings: { skillId: new Types.ObjectId(dto.skillId) } } });
    const saved: any = await this.model.findByIdAndUpdate(course._id, { $push: { skillMappings: { ...dto, skillId: new Types.ObjectId(dto.skillId) } } }, { new: true }).populate('skillMappings.skillId', 'name nameAr category').lean();
    await this.audit(userId, 'MAP_COURSE_SKILL', id, dto);
    this.scheduleAnalysis(userId, String(course.departmentId), 'skill_mapping_updated');
    return this.dto(saved);
  }

  async unmapSkill(userId: string, id: string, skillId: string) {
    const access = await this.access(userId);
    if (!access.permissions.includes('course-skills:manage') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No access to manage course skills');
    }
    const course: any = await this.model.findOne({ _id: new Types.ObjectId(id), ...this.scope(access), status: 'active' }).lean();
    if (!course) throw new NotFoundException('Course not found in permitted scope');
    await this.editablePlan(access, String(course.studyPlanId));
    const saved: any = await this.model.findByIdAndUpdate(course._id, { $pull: { skillMappings: { skillId: new Types.ObjectId(skillId) } } }, { new: true }).populate('skillMappings.skillId', 'name nameAr category').lean();
    await this.audit(userId, 'UNMAP_COURSE_SKILL', id, { skillId });
    this.scheduleAnalysis(userId, String(course.departmentId), 'skill_unmapping_updated');
    return this.dto(saved);
  }

  async setArchived(userId: string, id: string, archived: boolean) {
    const access = await this.access(userId);
    if (!access.permissions.includes('courses:write') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No write access to courses');
    }
    const course: any = await this.model.findOne({ _id: new Types.ObjectId(id), ...this.scope(access) }).lean();
    if (!course) throw new NotFoundException('Course not found in permitted scope');
    await this.editablePlan(access, String(course.studyPlanId));
    const saved: any = await this.model.findByIdAndUpdate(course._id, { $set: { status: archived ? 'archived' : 'active' } }, { new: true }).lean();
    await this.audit(userId, archived ? 'ARCHIVE_COURSE' : 'RESTORE_COURSE', id, {});
    this.scheduleAnalysis(userId, String(course.departmentId), archived ? 'course_archived' : 'course_restored');
    return this.dto(saved);
  }

  private async editablePlan(access: any, planId: string) {
    const plan: any = await this.plans.findOne({ _id: new Types.ObjectId(planId), ...this.scope(access), status: { $in: ['draft', 'changes_requested'] } }).lean();
    if (!plan) throw new NotFoundException('Editable study plan not found');
    return plan;
  }

  private async validateCode(planId: any, code: string, excludeId?: any) {
    const filter: any = { studyPlanId: planId, code: new RegExp(`^${code.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
    if (excludeId) filter._id = { $ne: excludeId };
    if (await this.model.exists(filter)) throw new ConflictException('Course code already exists in this plan');
  }

  private async validatePrerequisites(planId: any, prerequisiteIds: string[], currentId?: any) {
    if (currentId && prerequisiteIds.includes(String(currentId))) throw new BadRequestException('A course cannot be its own prerequisite');
    if (!prerequisiteIds.length) return;
    const unique = [...new Set(prerequisiteIds)];
    if (unique.length !== prerequisiteIds.length) throw new BadRequestException('Duplicate prerequisites are not allowed');
    const count = await this.model.countDocuments({ _id: { $in: unique.map((value) => new Types.ObjectId(value)) }, studyPlanId: planId, status: { $ne: 'archived' } });
    if (count !== unique.length) throw new BadRequestException('Every prerequisite must belong to the same study plan');
  }

  private async validateCorequisites(planId: any, corequisiteIds: string[], currentId?: any) {
    if (currentId && corequisiteIds.includes(String(currentId))) throw new BadRequestException('A course cannot be its own corequisite');
    if (!corequisiteIds.length) return;
    const unique = [...new Set(corequisiteIds)];
    if (unique.length !== corequisiteIds.length) throw new BadRequestException('Duplicate corequisites are not allowed');
    const count = await this.model.countDocuments({ _id: { $in: unique.map((value) => new Types.ObjectId(value)) }, studyPlanId: planId, status: { $ne: 'archived' } });
    if (count !== unique.length) throw new BadRequestException('Every corequisite must belong to the same study plan');
  }

  private async ensureAcyclic(planId: any, courseId: any, prerequisiteIds: string[]) {
    const courses: any[] = await this.model.find({ studyPlanId: planId }).select('_id prerequisites').lean();
    const graph = new Map(courses.map((course) => [String(course._id), (course.prerequisites || []).map(String)]));
    graph.set(String(courseId), prerequisiteIds);
    const visiting = new Set<string>(); const visited = new Set<string>();
    const visit = (node: string): boolean => {
      if (visiting.has(node)) return true;
      if (visited.has(node)) return false;
      visiting.add(node);
      for (const dependency of graph.get(node) || []) if (visit(dependency)) return true;
      visiting.delete(node); visited.add(node); return false;
    };
    for (const node of graph.keys()) if (visit(node)) throw new BadRequestException('Circular course prerequisites are not allowed');
  }

  private scheduleAnalysis(userId: string, departmentId: string, trigger: string) {
    void this.curriculum.refreshAnalysisForDepartment(userId, departmentId, trigger).catch((error) => this.logger.error(`Automatic curriculum analysis failed for ${departmentId}`, error?.stack || error));
  }

  private dto(item: any) {
    return {
      id: String(item._id), studyPlanId: String(item.studyPlanId), departmentId: String(item.departmentId),
      code: item.code, name: item.name, nameAr: item.nameAr || '', nameEn: item.nameEn || '',
      description: item.description || '', descriptionAr: item.descriptionAr || '', descriptionEn: item.descriptionEn || '',
      creditHours: item.credits || 0, lectureHours: item.lectureHours ?? null, tutorialHours: item.tutorialHours ?? null,
      practicalHours: item.practicalHours ?? null, laboratoryHours: item.laboratoryHours ?? null,
      level: item.level, semester: item.semester, type: item.type, status: item.status,
      eligibilityRules: item.eligibilityRules || [], electiveGroup: item.electiveGroup || '',
      learningOutcomes: item.learningOutcomes || [],
      learningOutcomesAr: item.learningOutcomesAr || [],
      learningOutcomesEn: item.learningOutcomesEn || [],
      prerequisites: (item.prerequisites || []).map(String),
      corequisites: (item.corequisites || []).map(String),
      skillMappings: (item.skillMappings || []).map((mapping: any) => ({
        ...mapping,
        skillId: mapping.skillId?._id ? String(mapping.skillId._id) : String(mapping.skillId),
        skill: mapping.skillId?._id ? { id: String(mapping.skillId._id), name: mapping.skillId.name, nameAr: mapping.skillId.nameAr || '', category: mapping.skillId.category } : undefined
      }))
    };
  }
  private audit(actorId: string, action: string, resourceId: any, details: any) { return this.audits.create({ actorId: new Types.ObjectId(actorId), action, resource: 'course', resourceId: String(resourceId), details, severity: 'info', timestamp: new Date() }); }
}
