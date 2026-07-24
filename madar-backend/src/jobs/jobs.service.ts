import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from './schemas/job.schema';
import { Application, ApplicationDocument } from '../applications/schemas/application.schema';
import { ApplyJobDto } from './dto/apply-job.dto';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { Student, StudentDocument } from '../students/schemas/student.schema';
import { MatchResult, MatchResultDocument } from '../matching/match-results/schemas/match-result.schema';
import { NotificationService } from '../common/notifications/notification.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(MatchResult.name) private matchResultModel: Model<MatchResultDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  async findStudentFeed(userId: string, query: any = {}): Promise<any> {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(query.limit, 10) || 12));
    const now = new Date();
    const publishedFilter = {
      status: 'active',
      $or: [
        { 'applicationSettings.deadline': { $exists: false } },
        { 'applicationSettings.deadline': null },
        { 'applicationSettings.deadline': { $gte: now } },
      ],
    };

    const [student, jobs] = await Promise.all([
      this.studentModel.findOne({ userId: new Types.ObjectId(userId) }).lean(),
      this.jobModel.find(publishedFilter).sort({ createdAt: -1 }).lean(),
    ]);
    if (!student) throw new NotFoundException('Student profile not found');

    const jobIds = jobs.map((job: any) => job._id);
    const companyIds = [
      ...new Set(
        jobs
          .map((job: any) => job.companyId ? String(job.companyId) : '')
          .filter((id) => Types.ObjectId.isValid(id)),
      ),
    ];
    const [companies, matchResults, applications] = await Promise.all([
      this.companyModel
        .find({ _id: { $in: companyIds.map((id) => new Types.ObjectId(id)) } })
        .select('profile.name profile.logoUrl profile.industry profile.website headquarters userId')
        .lean(),
      jobIds.length
        ? this.matchResultModel
            .find({
              student: (student as any)._id,
              $or: [{ job: { $in: jobIds } }, { jobId: { $in: jobIds } }],
            })
            .sort({ calculatedAt: -1, updatedAt: -1 })
            .lean()
        : [],
      jobIds.length
        ? this.applicationModel
            .find({
              studentId: { $in: [(student as any)._id, new Types.ObjectId(userId)] },
              jobId: { $in: jobIds },
            })
            .sort({ createdAt: -1 })
            .lean()
        : [],
    ]);

    const companyMap = new Map(companies.map((company: any) => [String(company._id), company]));
    const resultMap = new Map<string, any>();
    for (const result of matchResults as any[]) {
      const resultJobId = String(result.job || result.jobId || '');
      if (resultJobId && !resultMap.has(resultJobId)) resultMap.set(resultJobId, result);
    }
    const applicationMap = new Map<string, any>();
    for (const application of applications as any[]) {
      const applicationJobId = String(application.jobId || '');
      if (applicationJobId && !applicationMap.has(applicationJobId)) {
        applicationMap.set(applicationJobId, application);
      }
    }

    const allItems = jobs.map((job: any) => {
      const company: any = companyMap.get(String(job.companyId));
      const storedResult = resultMap.get(String(job._id));
      const match = storedResult
        ? this.mapStoredMatch(storedResult)
        : this.calculateProfileMatch(student, job);
      return this.toStudentJobItem(job, company, match, applicationMap.get(String(job._id)));
    });

    const filters = this.buildStudentFeedFilters(allItems);
    const requestedTypes = this.listParam(query.jobTypes || query.type);
    const requestedLevels = this.listParam(query.experienceLevels || query.experienceLevel);
    const requestedLocations = this.listParam(query.locations || query.location);
    const requestedLocationTypes = this.listParam(query.locationTypes || query.locationType);
    const requestedCompanies = this.listParam(query.companyIds || query.companyId);
    const search = String(query.search || '').trim().toLocaleLowerCase();
    const minSalary = this.optionalNumber(query.salaryMin);
    const maxSalary = this.optionalNumber(query.salaryMax);
    const minMatchScore = this.optionalNumber(query.minMatchScore);
    const requestedJobId = Types.ObjectId.isValid(String(query.jobId || '')) ? String(query.jobId) : '';

    const filtered = allItems.filter((item: any) => {
      if (requestedJobId && item.id !== requestedJobId) return false;
      const searchable = [
        item.title,
        item.titleAr,
        item.description,
        item.companyName,
        item.category,
        item.location,
        ...(item.skills || []),
      ].filter(Boolean).join(' ').toLocaleLowerCase();
      if (search && !searchable.includes(search)) return false;
      if (requestedTypes.length && !requestedTypes.includes(item.type)) return false;
      if (requestedLevels.length && !requestedLevels.includes(item.experienceLevel)) return false;
      if (requestedLocations.length && !requestedLocations.includes(item.location)) return false;
      if (requestedLocationTypes.length && !requestedLocationTypes.includes(item.locationType)) return false;
      if (requestedCompanies.length && !requestedCompanies.includes(item.companyId)) return false;
      if (minSalary !== null && (item.salaryMax || item.salaryMin || 0) < minSalary) return false;
      if (maxSalary !== null && (item.salaryMin || item.salaryMax || 0) > maxSalary) return false;
      if (minMatchScore !== null && item.matchScore < minMatchScore) return false;
      return true;
    });

    const sortBy = ['match', 'recent', 'salary'].includes(query.sortBy) ? query.sortBy : 'match';
    filtered.sort((left: any, right: any) => {
      if (sortBy === 'recent') return new Date(right.postedDate).getTime() - new Date(left.postedDate).getTime();
      if (sortBy === 'salary') return (right.salaryMax || right.salaryMin || 0) - (left.salaryMax || left.salaryMin || 0);
      return right.matchScore - left.matchScore || new Date(right.postedDate).getTime() - new Date(left.postedDate).getTime();
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const items = filtered.slice((page - 1) * limit, page * limit);
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters,
      totalPublished: allItems.length,
    };
  }

  async findAll(query: any = {}): Promise<{ data: Job[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = { status: 'active' };

    if (query.search) {
      filter.$text = { $search: query.search };
    }
    if (query.location) filter.location = { $regex: query.location, $options: 'i' };
    if (query.locationType) filter.locationType = query.locationType;
    if (query.type) filter.type = query.type;
    if (query.experienceLevel) filter.experienceLevel = query.experienceLevel;
    if (query.department) filter.department = { $regex: query.department, $options: 'i' };
    if (query.companyId) filter.companyId = new Types.ObjectId(query.companyId);
    if (query.minSalary) filter.salaryMin = { $gte: parseInt(query.minSalary) };
    if (query.maxSalary) filter.salaryMax = { $lte: parseInt(query.maxSalary) };
    if (query.skills) {
      const skills = Array.isArray(query.skills) ? query.skills : query.skills.split(',');
      filter['requirements.requiredSkills.name'] = { $in: skills };
    }

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.jobModel
        .find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.jobModel.countDocuments(filter),
    ]);

    const enriched = await Promise.all(
      data.map(async (job) => {
        const company = await this.companyModel
          .findById(job.companyId)
          .select('profile.name profile.logoUrl')
          .lean();
        return { ...job, company: company || null };
      }),
    );

    return { data: enriched as Job[], total, page, limit };
  }

  async findById(id: string): Promise<any> {
    const job = await this.jobModel.findById(new Types.ObjectId(id)).lean();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await this.jobModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $inc: { views: 1 } },
    );

    const company = await this.companyModel
      .findById(job.companyId)
      .select('profile.name profile.description profile.industry profile.logoUrl headquarters')
      .lean();

    return { ...job, company: company || null, views: ((job as any).views || 0) + 1 };
  }

  async apply(id: string, userId: string, dto: ApplyJobDto): Promise<Application> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Job not found');
    const job = await this.jobModel.findById(new Types.ObjectId(id)).lean();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.status !== 'active') {
      throw new ForbiddenException('This job is not accepting applications');
    }

    const deadline = (job as any).applicationSettings?.deadline;
    if (deadline && new Date(deadline).getTime() < Date.now()) {
      throw new ForbiddenException('The application deadline has passed');
    }
    const maxApplications = Number((job as any).applicationSettings?.maxApplications || 0);
    if (maxApplications > 0 && Number((job as any).applicationsCount || 0) >= maxApplications) {
      throw new ForbiddenException('This job is no longer accepting applications');
    }
    if (!job.companyId || !Types.ObjectId.isValid(String(job.companyId))) {
      throw new ForbiddenException('The company linked to this job is unavailable');
    }

    const student = await this.studentModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!student) throw new NotFoundException('Student profile not found');
    const studentObjectId = (student as any)._id;

    const existingApplication = await this.applicationModel.findOne({
      jobId: new Types.ObjectId(id),
      studentId: { $in: [studentObjectId, new Types.ObjectId(userId)] },
    }).lean();

    if (existingApplication) {
      throw new ForbiddenException('You have already applied for this job');
    }

    const storedMatch = await this.matchResultModel.findOne({
      student: studentObjectId,
      $or: [{ job: new Types.ObjectId(id) }, { jobId: new Types.ObjectId(id) }],
    }).sort({ calculatedAt: -1, updatedAt: -1 }).lean();
    const match = storedMatch ? this.mapStoredMatch(storedMatch) : this.calculateProfileMatch(student, job);

    const application = await this.applicationModel.create({
      jobId: new Types.ObjectId(id),
      studentId: studentObjectId,
      companyId: job.companyId,
      status: 'submitted',
      coverLetter: dto.coverLetter,
      screeningAnswers: dto.screeningAnswers || [],
      matchSnapshot: {
        matchScore: match.score,
        skillMatch: match.breakdown?.skills || 0,
        experienceMatch: match.breakdown?.experience || 0,
        educationMatch: (match.breakdown as any)?.education || 0,
        calculatedAt: match.calculatedAt || new Date(),
      },
      statusHistory: [
        { status: 'submitted', note: 'Application submitted', noteAr: 'تم إرسال طلب التقديم', createdAt: new Date(), createdBy: new Types.ObjectId(userId) },
      ],
    });

    await this.jobModel.updateOne(
      { _id: new Types.ObjectId(id) },
      { $inc: { applicationsCount: 1 } },
    );

    const company = await this.companyModel.findById(job.companyId).select('userId').lean();
    if ((company as any)?.userId) {
      try {
        await this.notificationService.create({
          userId: (company as any).userId,
          type: 'application_update',
          title: 'New Job Application',
          titleAr: 'طلب توظيف جديد',
          message: `A student applied for ${this.textValue((job as any).title)}`,
          messageAr: `تقدم طالب إلى وظيفة ${this.textValue((job as any).titleAr, (job as any).title)}`,
          actionUrl: '/company/candidates',
          data: { relatedEntityType: 'application', relatedEntityId: String((application as any)._id), jobId: id },
          read: false,
        });
      } catch (error: any) {
        this.logger.warn(`Application ${String((application as any)._id)} created but company notification failed: ${error?.message || error}`);
      }
    }

    this.logger.log(`Student ${String(studentObjectId)} applied to job ${id}`);
    return application;
  }

  private mapStoredMatch(result: any) {
    return {
      score: this.clampScore(result.overallScore ?? result.scores?.overall),
      source: 'ai_analysis',
      matchedSkills: (result.skillMatches || [])
        .filter((skill: any) => Number(skill.matchPercent ?? skill.score ?? 100) > 0)
        .map((skill: any) => String(skill.skill || skill.name || skill.skillName || '').trim())
        .filter(Boolean),
      missingSkills: (result.missingSkills || [])
        .map((skill: any) => String(skill.skill || skill.name || skill.skillName || skill || '').trim())
        .filter(Boolean),
      breakdown: {
        skills: this.clampScore(result.skillScore ?? result.scores?.skill),
        experience: this.clampScore(result.experienceScore ?? result.scores?.experience),
        education: this.clampScore(result.educationScore ?? result.scores?.education),
        semantic: this.clampScore(result.semanticScore ?? result.scores?.semantic),
      },
      calculatedAt: result.calculatedAt || result.updatedAt || result.createdAt || null,
    };
  }

  private calculateProfileMatch(student: any, job: any) {
    const requiredSkills = this.jobRequiredSkills(job);
    const studentSkills = new Map<string, number>();
    for (const skill of student.skills || []) {
      const name = this.normalizeSkill(skill?.name || skill?.skillName || skill);
      if (!name) continue;
      const rawLevel = Number(skill?.proficiency ?? skill?.level ?? 1);
      const normalizedLevel = rawLevel > 5 ? rawLevel / 100 : rawLevel / 5;
      studentSkills.set(name, Math.max(0, Math.min(1, normalizedLevel || 0.2)));
    }

    let weightedSkillTotal = 0;
    let skillWeightTotal = 0;
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];
    for (const requirement of requiredSkills) {
      const name = this.normalizeSkill(requirement.name);
      if (!name) continue;
      const weight = Math.max(0.1, Number(requirement.weight) || 1);
      const studentLevel = studentSkills.get(name) || 0;
      const requiredLevel = this.requiredSkillLevel(requirement.level);
      weightedSkillTotal += Math.min(1, studentLevel / requiredLevel) * weight;
      skillWeightTotal += weight;
      if (studentLevel > 0) matchedSkills.push(requirement.name);
      else missingSkills.push(requirement.name);
    }
    const skillsScore = skillWeightTotal ? (weightedSkillTotal / skillWeightTotal) * 100 : 0;

    const studentVector = this.numericVector(student.embeddings?.combinedVector || student.embeddings?.skillVector);
    const jobVector = this.numericVector(job.aiAnalysis?.embedding || job.aiAnalysis?.skillVector);
    const semanticScore = studentVector.length && studentVector.length === jobVector.length
      ? Math.max(0, this.cosineSimilarity(studentVector, jobVector) * 100)
      : 0;

    const requiredYears = Number(job.requirements?.experience?.minYears ?? job.aiAnalysis?.minimumExperienceYears ?? 0);
    const studentYears = this.studentExperienceYears(student.experiences || []);
    const experienceScore = requiredYears > 0 ? Math.min(100, (studentYears / requiredYears) * 100) : 0;

    const projectSkills = new Set<string>();
    for (const project of student.projects || []) {
      for (const technology of project.technologies || []) {
        const normalized = this.normalizeSkill(technology);
        if (normalized) projectSkills.add(normalized);
      }
    }
    const projectMatches = requiredSkills.filter((skill) => projectSkills.has(this.normalizeSkill(skill.name))).length;
    const projectsScore = requiredSkills.length ? (projectMatches / requiredSkills.length) * 100 : 0;

    const configuredWeights = {
      skills: Number(process.env.MATCH_SKILLS_WEIGHT || 0.4),
      experience: Number(process.env.MATCH_EXPERIENCE_WEIGHT || 0.2),
      projects: Number(process.env.MATCH_PROJECTS_WEIGHT || 0.15),
      semantic: Number(process.env.MATCH_SEMANTIC_WEIGHT || 0.25),
    };
    const components = [
      { available: requiredSkills.length > 0, score: skillsScore, weight: configuredWeights.skills },
      { available: requiredYears > 0, score: experienceScore, weight: configuredWeights.experience },
      { available: requiredSkills.length > 0 && (student.projects || []).length > 0, score: projectsScore, weight: configuredWeights.projects },
      { available: semanticScore > 0, score: semanticScore, weight: configuredWeights.semantic },
    ].filter((component) => component.available && component.weight > 0);
    const weightTotal = components.reduce((sum, component) => sum + component.weight, 0);
    const baseScore = weightTotal
      ? components.reduce((sum, component) => sum + component.score * component.weight, 0) / weightTotal
      : 0;
    const mandatorySkillsPenalty = requiredSkills.length
      ? Math.min(20, (missingSkills.length / requiredSkills.length) * 20)
      : 0;

    return {
      score: this.clampScore(baseScore - mandatorySkillsPenalty),
      source: components.length ? 'profile_calculation' : 'insufficient_profile',
      matchedSkills: [...new Set(matchedSkills)],
      missingSkills: [...new Set(missingSkills)],
      breakdown: {
        skills: this.clampScore(skillsScore),
        experience: this.clampScore(experienceScore),
        projects: this.clampScore(projectsScore),
        semantic: this.clampScore(semanticScore),
        mandatorySkillsPenalty: Math.round(mandatorySkillsPenalty),
      },
      calculatedAt: new Date(),
    };
  }

  private toStudentJobItem(job: any, company: any, match: any, application?: any) {
    const locationParts = [job.location?.city, job.location?.country].map((value) => this.textValue(value)).filter(Boolean);
    const location = locationParts.join(', ') || (job.location?.type === 'remote' ? 'Remote' : '');
    const skills = this.jobRequiredSkills(job).map((skill) => skill.name).filter(Boolean);
    return {
      id: String(job._id),
      title: this.textValue(job.title),
      titleAr: this.textValue(job.titleAr),
      description: this.textValue(job.description, job.summary),
      descriptionAr: this.textValue(job.descriptionAr),
      companyId: String(job.companyId || ''),
      companyName: this.textValue(company?.profile?.name, job.companyName),
      companyLogo: company?.profile?.logoUrl || null,
      companyIndustry: company?.profile?.industry || null,
      companyWebsite: company?.profile?.website || null,
      location,
      locationType: job.location?.type || null,
      type: job.type || null,
      experienceLevel: job.level || null,
      category: job.category || null,
      skills: [...new Set(skills)],
      salaryMin: Number(job.compensation?.salaryMin) || 0,
      salaryMax: Number(job.compensation?.salaryMax) || 0,
      salaryCurrency: job.compensation?.currency || 'SAR',
      benefits: [...(job.compensation?.benefits || []), ...(job.compensation?.otherBenefits || [])],
      responsibilities: Array.isArray(job.aiAnalysis?.responsibilities) ? job.aiAnalysis.responsibilities : [],
      preferredSkills: (job.requirements?.preferredSkills || []).map((skill: any) => this.textValue(skill?.name, skill)).filter(Boolean),
      educationLevel: job.requirements?.education?.degree || job.aiAnalysis?.educationLevel || null,
      educationFields: (job.requirements?.education?.fields || []).map((field: any) => this.textValue(field)).filter(Boolean),
      requiredExperienceYears: Number(job.requirements?.experience?.minYears ?? job.aiAnalysis?.minimumExperienceYears ?? 0),
      applicationDeadline: job.applicationSettings?.deadline || null,
      requiresCoverLetter: Boolean(job.applicationSettings?.requireCoverLetter),
      postedDate: job.createdAt || null,
      expiresAt: job.applicationSettings?.deadline || null,
      matchScore: match.score,
      matchSource: match.source,
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      matchBreakdown: match.breakdown,
      matchCalculatedAt: match.calculatedAt,
      applicationId: application?._id ? String(application._id) : null,
      applicationStatus: application?.status || null,
      appliedAt: application?.createdAt || null,
      canApply: !application && Types.ObjectId.isValid(String(job.companyId || '')),
    };
  }

  private buildStudentFeedFilters(items: any[]) {
    const optionList = (values: Array<{ value: string; label?: string }>) => {
      const counts = new Map<string, { label: string; count: number }>();
      for (const item of values) {
        if (!item.value) continue;
        const current = counts.get(item.value);
        counts.set(item.value, { label: this.textValue(item.label, item.value), count: (current?.count || 0) + 1 });
      }
      return [...counts.entries()]
        .map(([value, item]) => ({ value, label: item.label, count: item.count }))
        .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
    };
    const salaryValues = items.flatMap((item) => [item.salaryMin, item.salaryMax]).filter((value) => Number(value) > 0);
    return {
      jobTypes: optionList(items.map((item) => ({ value: item.type }))),
      experienceLevels: optionList(items.map((item) => ({ value: item.experienceLevel }))),
      locations: optionList(items.map((item) => ({ value: item.location }))),
      locationTypes: optionList(items.map((item) => ({ value: item.locationType }))),
      companies: optionList(items.map((item) => ({ value: item.companyId, label: item.companyName || item.companyId }))),
      salary: {
        min: salaryValues.length ? Math.min(...salaryValues) : 0,
        max: salaryValues.length ? Math.max(...salaryValues) : 0,
        currency: items.find((item) => item.salaryCurrency)?.salaryCurrency || 'SAR',
      },
    };
  }

  private jobRequiredSkills(job: any): Array<{ name: string; level?: string; weight?: number }> {
    const primary = Array.isArray(job.requirements?.requiredSkills) ? job.requirements.requiredSkills : [];
    const analyzed = Array.isArray(job.aiAnalysis?.requiredSkills) ? job.aiAnalysis.requiredSkills : [];
    const source = primary.length ? primary : analyzed;
    const seen = new Set<string>();
    return source.map((skill: any) => typeof skill === 'string' ? { name: skill } : {
      name: String(skill?.name || skill?.skillName || '').trim(),
      level: skill?.level,
      weight: Number(skill?.weight ?? skill?.importance) || 1,
    }).filter((skill) => {
      const normalized = this.normalizeSkill(skill.name);
      if (!normalized || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  private listParam(value: unknown): string[] {
    const values = Array.isArray(value) ? value : String(value || '').split('|');
    return values.map((item) => String(item).trim()).filter(Boolean);
  }

  private optionalNumber(value: unknown): number | null {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeSkill(value: unknown): string {
    return String(value || '').trim().toLocaleLowerCase().replace(/[^a-z0-9+#.\u0600-\u06ff]/g, '');
  }

  private textValue(...values: unknown[]): string {
    for (const value of values) {
      if (typeof value === 'string' || typeof value === 'number') {
        const text = String(value).trim();
        if (text) return text;
      }
      if (Array.isArray(value)) {
        const text = this.textValue(...value);
        if (text) return text;
      }
      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        const text = this.textValue(record.name, record.label, record.title, record.en, record.ar, record.value);
        if (text) return text;
      }
    }
    return '';
  }

  private requiredSkillLevel(value: unknown): number {
    const levels: Record<string, number> = { beginner: 0.3, intermediate: 0.55, advanced: 0.8, expert: 1 };
    return levels[String(value || '').toLowerCase()] || 0.55;
  }

  private numericVector(value: unknown): number[] {
    if (!Array.isArray(value)) return [];
    const vector = value.map(Number);
    return vector.length && vector.every(Number.isFinite) ? vector : [];
  }

  private cosineSimilarity(left: number[], right: number[]): number {
    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;
    for (let index = 0; index < left.length; index += 1) {
      dot += left[index] * right[index];
      leftNorm += left[index] ** 2;
      rightNorm += right[index] ** 2;
    }
    if (!leftNorm || !rightNorm) return 0;
    return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
  }

  private studentExperienceYears(experiences: any[]): number {
    const milliseconds = experiences.reduce((total, experience) => {
      const start = new Date(experience?.startDate || '').getTime();
      const end = experience?.isCurrent ? Date.now() : new Date(experience?.endDate || '').getTime();
      return total + (Number.isFinite(start) && Number.isFinite(end) && end > start ? end - start : 0);
    }, 0);
    return milliseconds / (365.25 * 24 * 60 * 60 * 1000);
  }

  private clampScore(value: unknown): number {
    const score = Number(value);
    return Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  }

  async getSimilarJobs(id: string): Promise<Job[]> {
    const job = await this.jobModel.findById(new Types.ObjectId(id)).lean();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const skillNames = ((job as any).requirements?.requiredSkills || []).map((s: any) => s.name);

    const similar = await this.jobModel
      .find({
        _id: { $ne: new Types.ObjectId(id) },
        status: 'active',
        $or: [
          { 'requirements.requiredSkills.name': { $in: skillNames } },
          { title: { $regex: job.title.split(' ').slice(0, 2).join(' '), $options: 'i' } },
        ],
      })
      .limit(5)
      .lean();

    return similar as Job[];
  }
}
