import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudyPlan, StudyPlanDocument } from './schemas/study-plan.schema';
import { University, UniversityDocument } from '../schemas/university.schema';
import { CollegeCoordinator, CollegeCoordinatorDocument } from '../college-coordinators/schemas/college-coordinator.schema';
import { Department, DepartmentDocument } from '../departments/schemas/department.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { AuditLog, AuditLogDocument } from '../../common/audit-logs/schemas/audit-log.schema';
import { NotificationService } from '../../common/notifications/notification.service';
import { CreateStudyPlanDto, ReviewStudyPlanDto, UpdateStudyPlanDto } from './dto/study-plan.dto';

@Injectable()
export class StudyPlanService {
  constructor(
    @InjectModel(StudyPlan.name) private readonly model: Model<StudyPlanDocument>,
    @InjectModel(University.name) private readonly universities: Model<UniversityDocument>,
    @InjectModel(CollegeCoordinator.name) private readonly staff: Model<CollegeCoordinatorDocument>,
    @InjectModel(Department.name) private readonly departments: Model<DepartmentDocument>,
    @InjectModel(Course.name) private readonly courses: Model<CourseDocument>,
    @InjectModel(AuditLog.name) private readonly audits: Model<AuditLogDocument>,
    private readonly notifications: NotificationService,
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
    if (!access.permissions.includes('study-plans:read') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No read access to study plans');
    }
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const filter: any = { ...this.scope(access) };
    if (!query.includeArchived) filter.status = { $ne: 'archived' };
    if (query.status) filter.status = query.status;
    if (query.departmentId) filter.departmentId = new Types.ObjectId(query.departmentId);
    if (query.search) filter.$or = [{ name: { $regex: query.search, $options: 'i' } }, { nameAr: { $regex: query.search, $options: 'i' } }, { academicYear: { $regex: query.search, $options: 'i' } }];
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), this.model.countDocuments(filter),
    ]);
    return { items: items.map((item: any) => this.dto(item)), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(userId: string, dto: CreateStudyPlanDto) {
    const access = await this.access(userId);
    if (!access.permissions.includes('study-plans:write') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No write access to study plans');
    }
    if (!['university', 'coordinator'].includes(access.role)) throw new ForbiddenException();
    const department: any = await this.departments.findOne({ _id: new Types.ObjectId(dto.departmentId), ...this.scope(access), 'metadata.status': { $ne: 'deleted' } }).lean();
    if (!department) throw new NotFoundException('Department not found in permitted scope');
    const latest: any = await this.model.findOne({ universityId: access.university._id, departmentId: department._id, academicYear: dto.academicYear }).sort({ version: -1 }).lean();
    const levels = dto.levels !== undefined ? dto.levels : this.buildLevels(dto.levelsCount, dto.semestersCount);
    const plan: any = await this.model.create({ universityId: access.university._id, collegeId: department.collegeId, departmentId: department._id, name: dto.name, nameAr: dto.nameAr, description: dto.description, academicYear: dto.academicYear, totalCredits: dto.totalCreditHours, levels: levels || [], version: (latest?.version || 0) + 1, previousVersionId: latest?._id, status: 'draft', courses: [], createdBy: new Types.ObjectId(userId), metadata: {} });
    await this.audit(userId, 'CREATE_STUDY_PLAN', plan._id, { departmentId: department._id, version: plan.version });
    return this.dto(plan.toObject());
  }

  async update(userId: string, id: string, dto: UpdateStudyPlanDto) {
    const access = await this.access(userId);
    if (!access.permissions.includes('study-plans:write') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No write access to study plans');
    }
    const levels = dto.levels !== undefined ? dto.levels : this.buildLevels(dto.levelsCount, dto.semestersCount);
    const plan: any = await this.model.findOneAndUpdate(
      { _id: new Types.ObjectId(id), ...this.scope(access), status: { $in: ['draft', 'changes_requested'] } },
      { $set: { ...(dto.name !== undefined ? { name: dto.name } : {}), ...(dto.nameAr !== undefined ? { nameAr: dto.nameAr } : {}), ...(dto.description !== undefined ? { description: dto.description } : {}), ...(dto.totalCreditHours !== undefined ? { totalCredits: dto.totalCreditHours } : {}), ...(levels !== undefined ? { levels } : {}) } },
      { new: true },
    ).lean();
    if (!plan) throw new NotFoundException('Editable study plan not found');
    await this.audit(userId, 'UPDATE_STUDY_PLAN', plan._id, dto);
    return this.dto(plan);
  }

  async createNewVersion(userId: string, id: string) {
    const access = await this.access(userId);
    if (!access.permissions.includes('study-plans:write') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No write access to study plans');
    }
    const previous: any = await this.model.findOne({ _id: new Types.ObjectId(id), ...this.scope(access), status: { $in: ['approved', 'active'] } }).lean();
    if (!previous) throw new NotFoundException('Approved or active study plan not found in permitted scope');
    const latest: any = await this.model.findOne({ departmentId: previous.departmentId, academicYear: previous.academicYear }).sort({ version: -1 }).lean();
    const clone = { ...previous }; delete clone._id; delete clone.createdAt; delete clone.updatedAt; delete clone.reviewedAt; delete clone.reviewedBy; delete clone.submittedAt; delete clone.reviewReason;
    const next: any = await this.model.create({ ...clone, version: (latest?.version || previous.version) + 1, previousVersionId: previous._id, status: 'draft', courses: [], createdBy: new Types.ObjectId(userId) });
    const oldCourses: any[] = await this.courses.find({ studyPlanId: previous._id }).lean();
    const idMap = new Map<string, Types.ObjectId>();
    oldCourses.forEach((course) => idMap.set(String(course._id), new Types.ObjectId()));
    if (oldCourses.length) {
      const copies = oldCourses.map((course) => {
        const copy = { ...course, _id: idMap.get(String(course._id)), studyPlanId: next._id, prerequisites: (course.prerequisites || []).map((value: any) => idMap.get(String(value))).filter(Boolean) };
        delete copy.createdAt; delete copy.updatedAt; return copy;
      });
      await this.courses.insertMany(copies);
      await this.model.updateOne({ _id: next._id }, { $set: { courses: copies.map((course) => course._id) } });
      next.courses = copies.map((course) => course._id);
    }
    await this.audit(userId, 'CREATE_STUDY_PLAN_VERSION', next._id, { previousVersionId: previous._id, version: next.version });
    return this.dto(next.toObject ? next.toObject() : next);
  }

  async submit(userId: string, id: string) {
    const access = await this.access(userId);
    if (!access.permissions.includes('study-plans:write') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No write access to study plans');
    }
    const plan: any = await this.model.findOne({ _id: new Types.ObjectId(id), ...this.scope(access), status: { $in: ['draft', 'changes_requested'] } }).lean();
    if (!plan) throw new NotFoundException('Submittable study plan not found');
    if (!plan.courses || plan.courses.length === 0) throw new BadRequestException('Cannot submit an empty study plan');

    const updatedPlan: any = await this.model.findByIdAndUpdate(plan._id, { $set: { status: 'submitted', submittedAt: new Date(), reviewReason: '' } }, { new: true }).lean();
    
    await this.audit(userId, 'SUBMIT_STUDY_PLAN', updatedPlan._id, {});
    if (String(access.university.userId) !== userId) await this.notifications.create({ userId: access.university.userId, type: 'system', title: 'Study plan submitted', titleAr: 'تم إرسال خطة دراسية', message: `Study plan "${updatedPlan.name}" was submitted for review.`, messageAr: `تم إرسال الخطة «${updatedPlan.name}» للمراجعة.`, actionUrl: '/university/curriculum', data: { studyPlanId: String(updatedPlan._id) } });
    return this.dto(updatedPlan);
  }

  async review(userId: string, id: string, dto: ReviewStudyPlanDto) {
    const access = await this.access(userId);
    if (access.role !== 'university') throw new ForbiddenException('University administrator review required');
    if (['rejected', 'changes_requested'].includes(dto.status) && !dto.reason?.trim()) throw new BadRequestException('Review reason is required');
    const plan: any = await this.model.findOneAndUpdate({ _id: new Types.ObjectId(id), universityId: access.university._id, status: { $in: ['submitted', 'under_review'] } }, { $set: { status: dto.status, reviewReason: dto.reason || '', reviewedBy: new Types.ObjectId(userId), reviewedAt: new Date() } }, { new: true }).lean();
    if (!plan) throw new NotFoundException('Reviewable study plan not found');
    await this.audit(userId, `REVIEW_STUDY_PLAN_${dto.status.toUpperCase()}`, plan._id, { reason: dto.reason });
    await this.notifications.create({ userId: plan.createdBy, type: 'system', title: 'Study plan reviewed', titleAr: 'تمت مراجعة الخطة الدراسية', message: `Your study plan "${plan.name}" is now ${dto.status}.`, messageAr: `أصبحت حالة الخطة «${plan.name}»: ${this.arabicStatus(dto.status)}.`, actionUrl: '/university/curriculum', data: { studyPlanId: String(plan._id), status: dto.status, reason: dto.reason || null } });
    return this.dto(plan);
  }

  async activate(userId: string, id: string) {
    const access = await this.access(userId);
    if (access.role !== 'university') throw new ForbiddenException('University administrator activation required');
    const plan: any = await this.model.findOne({ _id: new Types.ObjectId(id), universityId: access.university._id, status: 'approved' }).lean();
    if (!plan) throw new NotFoundException('Approved study plan not found');
    
    // Archive previous version
    if (plan.previousVersionId) {
      await this.model.updateOne({ _id: plan.previousVersionId }, { $set: { status: 'archived' } });
    }
    
    const activatedPlan: any = await this.model.findByIdAndUpdate(plan._id, { $set: { status: 'active' } }, { new: true }).lean();
    await this.audit(userId, 'ACTIVATE_STUDY_PLAN', activatedPlan._id, { previousVersionArchived: !!plan.previousVersionId });
    await this.notifications.create({ userId: activatedPlan.createdBy, type: 'system', title: 'Study plan activated', titleAr: 'تم تفعيل الخطة الدراسية', message: `Your study plan "${activatedPlan.name}" is now active.`, messageAr: `أصبحت حالة الخطة «${activatedPlan.name}» نشطة.`, actionUrl: '/university/curriculum', data: { studyPlanId: String(activatedPlan._id), status: 'active' } });
    
    return this.dto(activatedPlan);
  }

  async archive(userId: string, id: string) {
    const access = await this.access(userId);
    if (!access.permissions.includes('study-plans:write') && !access.permissions.includes('*')) {
      throw new ForbiddenException('No write access to study plans');
    }
    const plan: any = await this.model.findOneAndUpdate({ _id: new Types.ObjectId(id), ...this.scope(access) }, { $set: { status: 'archived' } }, { new: true }).lean();
    if (!plan) throw new NotFoundException();
    await this.audit(userId, 'ARCHIVE_STUDY_PLAN', plan._id, {});
    return this.dto(plan);
  }

  private buildLevels(levelsCount?: number, semestersCount?: number): any[] | undefined {
    if (levelsCount === undefined && semestersCount === undefined) return undefined;
    const count = levelsCount ?? 1;
    const semesters = semestersCount ?? 1;
    return Array.from({ length: count }, (_, i) => ({
      level: i + 1,
      semesters: Array.from({ length: semesters }, (_, j) => ({ name: `Semester ${j + 1}`, courseIds: [] })),
    }));
  }

  private dto(item: any) { return { id: String(item._id), universityId: String(item.universityId), collegeId: String(item.collegeId), departmentId: String(item.departmentId), name: item.name, nameAr: item.nameAr || '', description: item.description || '', academicYear: item.academicYear, version: item.version, totalCreditHours: item.totalCredits || 0, levels: item.levels || [], status: item.status, reviewReason: item.reviewReason || null, submittedAt: item.submittedAt || null, reviewedAt: item.reviewedAt || null, previousVersionId: item.previousVersionId ? String(item.previousVersionId) : null, courseIds: (item.courses || []).map(String), createdAt: item.createdAt, updatedAt: item.updatedAt }; }
  private arabicStatus(status: string) { return ({ approved: 'معتمدة', rejected: 'مرفوضة', changes_requested: 'معادة للتعديل', under_review: 'تحت المراجعة' } as Record<string, string>)[status] || status; }
  private audit(actorId: string, action: string, resourceId: any, details: any) { return this.audits.create({ actorId: new Types.ObjectId(actorId), action, resource: 'study_plan', resourceId: String(resourceId), details, severity: 'info', timestamp: new Date() }); }
}
