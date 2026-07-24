import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model, Types } from 'mongoose';
import { AcademicRecommendation, AcademicRecommendationDocument } from './schemas/academic-recommendation.schema';
import { CurriculumAnalysis, CurriculumAnalysisDocument } from './schemas/curriculum-analysis.schema';
import { University, UniversityDocument } from '../schemas/university.schema';
import { CollegeCoordinator, CollegeCoordinatorDocument } from '../college-coordinators/schemas/college-coordinator.schema';
import { Department, DepartmentDocument } from '../departments/schemas/department.schema';
import { StudyPlan, StudyPlanDocument } from '../study-plans/schemas/study-plan.schema';
import { Course, CourseDocument } from '../courses/schemas/course.schema';
import { Skill, SkillDocument } from '../../skills/schemas/skill.schema';
import { MarketData, MarketDataDocument } from '../../skills/market-data/schemas/market-data.schema';
import { AuditLog, AuditLogDocument } from '../../common/audit-logs/schemas/audit-log.schema';
import { NotificationService } from '../../common/notifications/notification.service';
import { CreateAcademicRecommendationDto, ReviewAcademicRecommendationDto, UpdateAcademicRecommendationDto } from './dto/curriculum.dto';

@Injectable()
export class CurriculumService {
  private readonly logger = new Logger(CurriculumService.name);

  constructor(
    @InjectModel(AcademicRecommendation.name) private readonly recommendations: Model<AcademicRecommendationDocument>,
    @InjectModel(CurriculumAnalysis.name) private readonly analyses: Model<CurriculumAnalysisDocument>,
    @InjectModel(University.name) private readonly universities: Model<UniversityDocument>,
    @InjectModel(CollegeCoordinator.name) private readonly staff: Model<CollegeCoordinatorDocument>,
    @InjectModel(Department.name) private readonly departments: Model<DepartmentDocument>,
    @InjectModel(StudyPlan.name) private readonly plans: Model<StudyPlanDocument>,
    @InjectModel(Course.name) private readonly courses: Model<CourseDocument>,
    @InjectModel(Skill.name) private readonly skills: Model<SkillDocument>,
    @InjectModel(MarketData.name) private readonly market: Model<MarketDataDocument>,
    @InjectModel(AuditLog.name) private readonly audits: Model<AuditLogDocument>,
    @InjectQueue('ai-matching') private readonly aiQueue: Queue,
    private readonly notifications: NotificationService,
  ) {}

  async enqueueAnalysis(userId: string, departmentId: string) {
    const access = await this.access(userId);
    const department = await this.departments.exists({
      _id: new Types.ObjectId(departmentId),
      ...this.scope(access),
      'metadata.status': { $ne: 'deleted' },
    });
    if (!department) throw new NotFoundException('Department not found in permitted scope');

    const taskId = `curriculum-${departmentId}`;
    const existing = await this.aiQueue.getJob(taskId);
    if (existing) {
      const state = await existing.getState();
      if (['waiting', 'active', 'delayed'].includes(state)) {
        return { taskId, status: state === 'active' ? 'processing' : 'queued', type: 'analyze-curriculum' };
      }
      await existing.remove();
    }

    const task = await this.aiQueue.add(
      'analyze-curriculum',
      { departmentId, requestedBy: userId },
      {
        jobId: taskId,
        attempts: Math.max(1, Number(process.env.AI_MAX_RETRIES || 3)),
        backoff: { type: 'exponential', delay: 5000 },
        timeout: Math.max(5000, Number(process.env.AI_JOB_TIMEOUT || 120000)),
        removeOnComplete: false,
        removeOnFail: false,
      },
    );
    return { taskId: String(task.id), status: 'queued', type: 'analyze-curriculum' };
  }

  private async access(userId: string) {
    const owner: any = await this.universities.findOne({ userId: new Types.ObjectId(userId), status: 'active' }).lean();
    if (owner) return { university: owner, role: 'university', collegeId: null, userId };
    const member: any = await this.staff.findOne({ userId: new Types.ObjectId(userId), status: 'active', invitationStatus: 'accepted' }).lean();
    if (!member) throw new ForbiddenException('Institutional access unavailable');
    const university: any = await this.universities.findOne({ _id: member.universityId, status: 'active' }).lean();
    if (!university) throw new ForbiddenException('University inactive');
    return { university, role: member.role, collegeId: member.role === 'coordinator' ? member.collegeId : null, userId };
  }

  private scope(access: any) {
    return { universityId: access.university._id, ...(access.collegeId ? { collegeId: access.collegeId } : {}) };
  }

  async getAnalysis(userId: string, departmentId: string, forceRefresh = false) {
    const access = await this.access(userId);
    const department: any = await this.departments.findOne({ _id: new Types.ObjectId(departmentId), ...this.scope(access), 'metadata.status': { $ne: 'deleted' } }).lean();
    if (!department) throw new NotFoundException('Department not found in permitted scope');
    const stored: any = await this.analyses.findOne({ departmentId: department._id }).lean();
    if (stored && !forceRefresh) return this.analysisDto(stored, department);
    return this.refreshAnalysisForDepartment(userId, departmentId, forceRefresh ? 'manual_refresh' : 'manual');
  }

  async refreshAnalysisForDepartment(userId: string, departmentId: string, trigger = 'automatic') {
    const access = await this.access(userId);
    const department: any = await this.departments.findOne({ _id: new Types.ObjectId(departmentId), ...this.scope(access), 'metadata.status': { $ne: 'deleted' } }).lean();
    if (!department) throw new NotFoundException('Department not found in permitted scope');
    const courses: any[] = await this.courses.find({ departmentId: department._id, status: 'active' }).populate('skillMappings.skillId', 'name nameAr category').lean();
    const marketRows: any[] = await this.market.find({}).sort({ demandScore: -1 }).limit(100).lean();

    const curriculumSkills = new Map<string, any>();
    for (const course of courses) {
      for (const mapping of course.skillMappings || []) {
        const skill: any = mapping.skillId;
        if (!skill?._id || !skill.name) continue;
        const key = String(skill.name).toLowerCase();
        const existing = curriculumSkills.get(key) || { name: skill.name, level: 0, courses: [] };
        existing.level = Math.max(existing.level, Number(mapping.coverageLevel || 0) / 5);
        existing.courses.push({ id: String(course._id), code: course.code, name: course.name });
        curriculumSkills.set(key, existing);
      }
    }
    const marketSkills = marketRows.map((row: any) => ({
      name: String(row.skillName || row.name || '').trim(),
      demandScore: Number(row.demandScore || 0),
      level: Math.min(1, Math.max(0.2, Number(row.requiredLevel || 0.7))),
    })).filter((item) => item.name);

    let result: any;
    let status = 'completed';
    let warning: string | undefined;
    try {
      const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.post(`${aiUrl}/api/ai/curriculum/analyze`, {
        departmentId: String(department._id),
        curriculumSkills: Array.from(curriculumSkills.values()),
        marketSkills,
      }, { timeout: 20000 });
      result = response.data;
    } catch (error: any) {
      status = 'fallback';
      warning = 'AI service unavailable; deterministic market comparison was used';
      this.logger.warn(`Curriculum AI analysis fallback for ${departmentId}: ${error?.message || error}`);
      result = this.localAnalysis(Array.from(curriculumSkills.values()), marketSkills);
    }

    const analyzedAt = result.analyzedAt ? new Date(result.analyzedAt) : new Date();
    const saved: any = await this.analyses.findOneAndUpdate(
      { departmentId: department._id },
      { $set: {
        universityId: access.university._id,
        collegeId: department.collegeId,
        departmentId: department._id,
        alignmentPercentage: result.alignmentPercentage ?? null,
        coveredSkills: result.coveredSkills || [],
        partiallyCoveredSkills: result.partiallyCoveredSkills || [],
        missingSkills: result.missingSkills || [],
        emergingSkills: result.emergingSkills || [],
        actionableRecommendations: result.actionableRecommendations || [],
        source: result.source || 'MADAR market data comparison',
        analyzedAt,
        trigger,
        status,
        warning,
      } },
      { upsert: true, new: true },
    ).lean();
    await this.audit(userId, 'ANALYZE_CURRICULUM', saved._id, { departmentId, trigger, status });
    if (trigger !== 'manual') {
      await this.notifications.create({
        userId: new Types.ObjectId(userId), type: 'system',
        title: 'Curriculum analysis updated', titleAr: 'تم تحديث تحليل المنهج',
        message: `Market alignment analysis for ${department.name} is ready.`,
        messageAr: `أصبح تحليل مواءمة قسم ${department.name} مع سوق العمل جاهزًا.`,
        actionUrl: '/university/curriculum', data: { departmentId, trigger },
      });
    }
    return this.analysisDto(saved, department, courses.length, marketSkills.length);
  }

  async list(userId: string, query: any = {}) {
    const access = await this.access(userId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const filter: any = this.scope(access);
    if (query.status) filter.status = query.status;
    if (query.departmentId) filter.departmentId = new Types.ObjectId(query.departmentId);
    if (query.search) filter.$or = [{ title: { $regex: query.search, $options: 'i' } }, { description: { $regex: query.search, $options: 'i' } }];
    const [items, total] = await Promise.all([
      this.recommendations.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.recommendations.countDocuments(filter),
    ]);
    return { items: items.map((item: any) => this.recommendationDto(item)), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async create(userId: string, dto: CreateAcademicRecommendationDto) {
    const access = await this.access(userId);
    if (!['university', 'coordinator', 'academic_development_officer'].includes(access.role)) throw new ForbiddenException();
    const department: any = await this.departments.findOne({ _id: new Types.ObjectId(dto.departmentId), ...this.scope(access) }).lean();
    if (!department) throw new NotFoundException('Department not found in permitted scope');
    await this.validateRecommendationReferences(access, department, dto);
    const recommendation: any = await this.recommendations.create({
      ...dto, universityId: access.university._id, collegeId: department.collegeId, departmentId: department._id,
      studyPlanId: dto.studyPlanId ? new Types.ObjectId(dto.studyPlanId) : undefined,
      affectedCourses: (dto.affectedCourses || []).map((id) => new Types.ObjectId(id)),
      affectedSkills: (dto.affectedSkills || []).map((id) => new Types.ObjectId(id)),
      status: 'draft', createdBy: new Types.ObjectId(userId),
    });
    await this.audit(userId, 'CREATE_ACADEMIC_RECOMMENDATION', recommendation._id, {});
    return this.recommendationDto(recommendation.toObject());
  }

  async update(userId: string, id: string, dto: UpdateAcademicRecommendationDto) {
    const access = await this.access(userId);
    const ownership = access.role === 'university' ? {} : { createdBy: new Types.ObjectId(userId) };
    const current: any = await this.recommendations.findOne({ _id: new Types.ObjectId(id), ...this.scope(access), ...ownership, status: { $in: ['draft', 'changes_requested'] } }).lean();
    if (!current) throw new NotFoundException('Editable recommendation not found');
    const department: any = await this.departments.findOne({ _id: current.departmentId, ...this.scope(access) }).lean();
    await this.validateRecommendationReferences(access, department, dto);
    const update: any = { ...dto };
    if (dto.studyPlanId) update.studyPlanId = new Types.ObjectId(dto.studyPlanId);
    if (dto.affectedCourses) update.affectedCourses = dto.affectedCourses.map((value) => new Types.ObjectId(value));
    if (dto.affectedSkills) update.affectedSkills = dto.affectedSkills.map((value) => new Types.ObjectId(value));
    const saved: any = await this.recommendations.findByIdAndUpdate(current._id, { $set: update }, { new: true }).lean();
    await this.audit(userId, 'UPDATE_ACADEMIC_RECOMMENDATION', current._id, dto);
    return this.recommendationDto(saved);
  }

  async submit(userId: string, id: string) {
    const access = await this.access(userId);
    const ownership = access.role === 'university' ? {} : { createdBy: new Types.ObjectId(userId) };
    const recommendation: any = await this.recommendations.findOneAndUpdate(
      { _id: new Types.ObjectId(id), ...this.scope(access), ...ownership, status: { $in: ['draft', 'changes_requested'] } },
      { $set: { status: 'submitted', submittedAt: new Date(), reviewReason: '' } }, { new: true },
    ).lean();
    if (!recommendation) throw new NotFoundException('Submittable recommendation not found');
    await this.audit(userId, 'SUBMIT_ACADEMIC_RECOMMENDATION', id, {});
    if (String(access.university.userId) !== userId) await this.notifyUniversity(access.university, 'Academic recommendation submitted', 'تم إرسال توصية أكاديمية', recommendation.title, `تم إرسال التوصية «${recommendation.title}» للمراجعة.`);
    return this.recommendationDto(recommendation);
  }

  async review(userId: string, id: string, dto: ReviewAcademicRecommendationDto) {
    const access = await this.access(userId);
    if (access.role !== 'university') throw new ForbiddenException('University administrator review required');
    if (['rejected', 'changes_requested'].includes(dto.status) && !dto.reason?.trim()) throw new BadRequestException('Review reason required');
    let recommendation: any = await this.recommendations.findOneAndUpdate(
      { _id: new Types.ObjectId(id), universityId: access.university._id, status: { $in: ['submitted', 'under_review'] } },
      { $set: { status: dto.status, reviewReason: dto.reason || '', reviewedBy: new Types.ObjectId(userId), reviewedAt: new Date() } }, { new: true },
    ).lean();
    if (!recommendation) throw new NotFoundException('Reviewable recommendation not found');
    if (dto.status === 'approved' && recommendation.studyPlanId) {
      const previous: any = await this.plans.findOne({ _id: recommendation.studyPlanId, universityId: access.university._id }).lean();
      if (previous) {
        const latest: any = await this.plans.findOne({ departmentId: previous.departmentId, academicYear: previous.academicYear }).sort({ version: -1 }).lean();
        const clone = { ...previous };
        delete clone._id; delete clone.createdAt; delete clone.updatedAt; delete clone.reviewedAt; delete clone.reviewedBy; delete clone.submittedAt; delete clone.reviewReason;
        const next: any = await this.plans.create({ ...clone, version: (latest?.version || previous.version || 1) + 1, previousVersionId: previous._id, status: 'draft', createdBy: new Types.ObjectId(userId) });
        recommendation = await this.recommendations.findByIdAndUpdate(recommendation._id, { $set: { createdPlanVersionId: next._id } }, { new: true }).lean();
        await this.audit(userId, 'CREATE_STUDY_PLAN_VERSION', next._id, { previousVersionId: previous._id, recommendationId: recommendation._id });
      }
    }
    await this.audit(userId, `REVIEW_ACADEMIC_RECOMMENDATION_${dto.status.toUpperCase()}`, id, { reason: dto.reason });
    await this.notifications.create({
      userId: recommendation.createdBy, type: 'system',
      title: 'Academic recommendation reviewed', titleAr: 'تمت مراجعة التوصية الأكاديمية',
      message: `Your recommendation "${recommendation.title}" is now ${dto.status}.`,
      messageAr: `أصبحت حالة التوصية «${recommendation.title}»: ${this.arabicStatus(dto.status)}.`,
      actionUrl: '/university/curriculum', data: { recommendationId: id, status: dto.status, reason: dto.reason || null },
    });
    return this.recommendationDto(recommendation);
  }

  private async validateRecommendationReferences(access: any, department: any, dto: Partial<CreateAcademicRecommendationDto>) {
    if (dto.studyPlanId && !await this.plans.exists({ _id: new Types.ObjectId(dto.studyPlanId), ...this.scope(access), departmentId: department._id })) throw new BadRequestException('Study plan is outside the permitted department');
    if (dto.affectedCourses?.length) {
      const count = await this.courses.countDocuments({ _id: { $in: dto.affectedCourses.map((id) => new Types.ObjectId(id)) }, ...this.scope(access), departmentId: department._id });
      if (count !== dto.affectedCourses.length) throw new BadRequestException('One or more affected courses are outside the permitted department');
    }
    if (dto.affectedSkills?.length) {
      const count = await this.skills.countDocuments({ _id: { $in: dto.affectedSkills.map((id) => new Types.ObjectId(id)) } });
      if (count !== dto.affectedSkills.length) throw new BadRequestException('One or more skills are invalid');
    }
  }

  private localAnalysis(curriculumSkills: any[], marketSkills: any[]) {
    const current = new Map(curriculumSkills.map((item) => [String(item.name).toLowerCase(), item]));
    const covered: any[] = []; const partial: any[] = []; const missing: any[] = [];
    let weighted = 0; let total = 0;
    for (const market of marketSkills) {
      const item = current.get(String(market.name).toLowerCase());
      const ratio = item ? Math.min(Number(item.level || 0) / Number(market.level || 0.7), 1) : 0;
      const row = { name: market.name, demandScore: market.demandScore, coverageLevel: Number(item?.level || 0) * 5, courses: item?.courses || [] };
      total += Math.max(1, market.demandScore); weighted += ratio * Math.max(1, market.demandScore);
      if (ratio >= 0.8) covered.push(row); else if (ratio > 0) partial.push(row); else missing.push(row);
    }
    const actionableRecommendations = [...missing, ...partial]
      .sort((a, b) => b.demandScore - a.demandScore)
      .slice(0, 5)
      .map((item) => ({
        title: `Strengthen curriculum coverage for ${item.name}`,
        description: `Add assessed practical coverage for ${item.name}.`,
        type: 'update_course',
        evidence: [`Market demand score: ${item.demandScore}/100`],
        priority: item.demandScore >= 90 ? 'critical' : item.demandScore >= 75 ? 'high' : 'medium',
      }));
    return { alignmentPercentage: total ? Math.round(weighted / total * 100) : null, coveredSkills: covered, partiallyCoveredSkills: partial, missingSkills: missing, emergingSkills: marketSkills.filter((item) => item.demandScore >= 80).slice(0, 10), actionableRecommendations, source: 'MADAR market data deterministic comparison', analyzedAt: new Date().toISOString() };
  }

  private analysisDto(item: any, department: any, courses = 0, marketSkills = 0) {
    return { id: String(item._id), department: { id: String(department._id), name: department.name }, sample: { courses, marketSkills }, alignmentPercentage: item.alignmentPercentage ?? null, coveredSkills: item.coveredSkills || [], partiallyCoveredSkills: item.partiallyCoveredSkills || [], missingSkills: item.missingSkills || [], emergingSkills: item.emergingSkills || [], actionableRecommendations: item.actionableRecommendations || [], source: item.source, analyzedAt: item.analyzedAt, trigger: item.trigger, status: item.status, warning: item.warning || null };
  }

  private recommendationDto(item: any) {
    return { id: String(item._id), _id: String(item._id), universityId: String(item.universityId), collegeId: String(item.collegeId), departmentId: String(item.departmentId), studyPlanId: item.studyPlanId ? String(item.studyPlanId) : null, title: item.title, description: item.description, type: item.type, affectedCourses: (item.affectedCourses || []).map(String), affectedSkills: (item.affectedSkills || []).map(String), evidence: item.evidence || [], marketDemand: item.marketDemand || 0, studentImpact: item.studentImpact || '', priority: item.priority, status: item.status, reviewReason: item.reviewReason || null, submittedAt: item.submittedAt || null, reviewedAt: item.reviewedAt || null, createdPlanVersionId: item.createdPlanVersionId ? String(item.createdPlanVersionId) : null, createdAt: item.createdAt, updatedAt: item.updatedAt };
  }

  private notifyUniversity(university: any, title: string, titleAr: string, message: string, messageAr: string) {
    return this.notifications.create({ userId: university.userId, type: 'system', title, titleAr, message, messageAr, actionUrl: '/university/curriculum' });
  }

  private arabicStatus(status: string) { return ({ approved: 'معتمدة', rejected: 'مرفوضة', changes_requested: 'معادة للتعديل', under_review: 'تحت المراجعة' } as Record<string, string>)[status] || status; }
  private audit(actorId: string, action: string, resourceId: any, details: any) { return this.audits.create({ actorId: new Types.ObjectId(actorId), action, resource: 'academic_recommendation', resourceId: String(resourceId), details, severity: 'info', timestamp: new Date() }); }
}
