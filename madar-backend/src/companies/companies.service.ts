import {
  Injectable,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from './schemas/company.schema';
import { Job, JobDocument } from '../jobs/schemas/job.schema';
import { Application, ApplicationDocument } from '../applications/schemas/application.schema';
import { Student, StudentDocument } from '../students/schemas/student.schema';
import { MatchResult, MatchResultDocument } from '../matching/match-results/schemas/match-result.schema';
import { SkillGap, SkillGapDocument } from '../matching/skill-gaps/schemas/skill-gap.schema';
import { Notification, NotificationDocument } from '../common/notifications/schemas/notification.schema';
import { AuditLog, AuditLogDocument } from '../common/audit-logs/schemas/audit-log.schema';
import { MarketData, MarketDataDocument } from '../skills/market-data/schemas/market-data.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(MatchResult.name) private matchResultModel: Model<MatchResultDocument>,
    @InjectModel(SkillGap.name) private skillGapModel: Model<SkillGapDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(MarketData.name) private marketDataModel: Model<MarketDataDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly matchingService: MatchingService,
  ) {}

  // ==========================================
  // FR-COMP-001/003: Company Profile
  // ==========================================

  async findByUserId(userId: string): Promise<Company> {
    const company = await this.companyModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .lean();
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }
    return company as Company;
  }

  async updateProfile(userId: string, dto: UpdateCompanyProfileDto): Promise<Company> {
    const update = this.mapCompanyProfileUpdate(dto);
    const company = await this.companyModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: { ...update, updatedAt: new Date() } },
        { new: true },
      )
      .lean();
    if (!company) {
      throw new NotFoundException('Company profile not found');
    }
    await this.auditLog('COMPANY_PROFILE_UPDATED', userId, 'company', (company as any)._id.toString(), 'Company profile updated', {
      companyId: (company as any)._id.toString(),
      changedFields: Object.keys(update),
    });
    return company as Company;
  }

  // ==========================================
  // FR-COMP-004/005/006: Job Management + AI Analysis + Matching
  // ==========================================

  async getDashboard(userId: string): Promise<any> {
    const company = await this.findByUserId(userId);
    const companyObjectId = (company as any)._id;

    const jobs = await this.jobModel
      .find({ companyId: companyObjectId })
      .select('_id status title titleAr applicationsCount views createdAt type location')
      .sort({ createdAt: -1 })
      .lean();

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const pausedJobs = jobs.filter(j => j.status === 'paused').length;
    const closedJobs = jobs.filter(j => j.status === 'closed').length;
    const totalApplications = jobs.reduce((sum, j) => sum + ((j as any).applicationsCount || 0), 0);
    const totalViews = jobs.reduce((sum, j) => sum + ((j as any).views || 0), 0);

    // Get recent applicants
    const recentApplications = await this.applicationModel
      .find({ companyId: companyObjectId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('studentId', 'personalInfo.firstName personalInfo.lastName academicInfo.university academicInfo.college academicInfo.department')
      .populate('jobId', 'title titleAr')
      .lean();

    const reviewCount = recentApplications.filter((a: any) => ['screening', 'under_review', 'shortlisted'].includes(a.status)).length;
    const interviewCount = recentApplications.filter((a: any) => ['interview_scheduled', 'interviewed'].includes(a.status)).length;
    const acceptedCount = recentApplications.filter((a: any) => a.status === 'accepted').length;
    const funnel = [
      { name: 'Applied', nameAr: 'المتقدمون', count: totalApplications },
      { name: 'Reviewed', nameAr: 'قيد المراجعة', count: reviewCount },
      { name: 'Interviewed', nameAr: 'المقابلات', count: interviewCount },
      { name: 'Offered', nameAr: 'العروض', count: recentApplications.filter((a: any) => ['offer_pending', 'offered'].includes(a.status)).length },
      { name: 'Hired', nameAr: 'المقبولون', count: acceptedCount },
    ];

    const frontendJobs = jobs.filter(j => j.status === 'active').map(j => ({
      id: (j as any)._id?.toString(),
      title: j.title,
      titleAr: j.titleAr || j.title,
      type: j.type,
      location: this.formatJobLocation(j.location),
      status: j.status,
      applicants: (j as any).applicationsCount || 0,
      inReview: reviewCount,
      interviews: interviewCount,
      accepted: acceptedCount,
      views: (j as any).views || 0,
    }));

    const frontendCandidates = recentApplications.map(a => ({
      id: (a as any)._id?.toString(),
      name: this.firstText(
        `${(a.studentId as any)?.personalInfo?.firstName || ''} ${(a.studentId as any)?.personalInfo?.lastName || ''}`.trim(),
      ),
      university: this.firstText((a.studentId as any)?.academicInfo?.universityName, (a.studentId as any)?.academicInfo?.university),
      major: this.firstText((a.studentId as any)?.academicInfo?.departmentName, (a.studentId as any)?.academicInfo?.collegeName),
      appliedJob: this.firstText((a.jobId as any)?.title),
      status: this.toFrontendStatus(a.status),
      matchScore: (a as any).matchSnapshot?.matchScore || 0,
      appliedAt: (a as any).createdAt,
    }));

    return {
      company: {
        id: companyObjectId,
        name: company.profile?.name || (company as any).name,
        nameAr: (company as any).nameAr || (company.profile?.name || ''),
        industry: company.profile?.industry || (company as any).industry,
        verified: company.profile?.verified || false,
      },
      metrics: [
        { label: 'Active Jobs', labelAr: 'الوظائف النشطة', value: activeJobs, trend: totalJobs ? Math.round((activeJobs / totalJobs) * 100) : 0, iconBg: '#E7FDD8' },
        { label: 'Applicants', labelAr: 'المتقدمون', value: totalApplications, trend: totalApplications, iconBg: '#DBEAFE' },
        { label: 'Accepted', labelAr: 'المقبولون', value: acceptedCount, trend: totalApplications ? Math.round((acceptedCount / totalApplications) * 100) : 0, iconBg: '#D1FAE5' },
        { label: 'Conversion', labelAr: 'معدل التحويل', value: `${totalViews > 0 ? Math.round((totalApplications / totalViews) * 100) : 0}%`, trend: totalViews, iconBg: '#F3E8FF' },
      ],
      jobs: frontendJobs,
      candidates: frontendCandidates,
      upcomingInterviews: [],
      funnel,
      newApplicants: recentApplications.length,
      welcomeTitle: `Welcome back, ${company.profile?.name || 'Recruitment Team'}!`,
      welcomeTitleAr: `أهلاً، ${company.profile?.name || 'فريق التوظيف'}!`,
      welcomeSubtitle: `${recentApplications.length} recent applicants`,
      welcomeSubtitleAr: `${recentApplications.length} متقدم حديث`,
      rawMetrics: {
        totalJobs,
        activeJobs,
        pausedJobs,
        closedJobs,
        totalApplications,
        totalViews,
      },
    };
  }

  // ==========================================
  // FR-COMP-004: Create Job
  // ==========================================

  async createJob(userId: string, dto: CreateJobDto): Promise<Job> {
    const company = await this.findByUserId(userId);
    const companyObjectId = (company as any)._id;
    const mappedJob = this.mapCreateJobDto(dto);

    const job = await this.jobModel.create({
      ...mappedJob,
      companyId: companyObjectId,
      postedBy: new Types.ObjectId(userId),
      status: 'active',
      views: 0,
      applicationsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.logger.log(`Job created: ${(job as any)._id} by company ${companyObjectId}`);
    await this.auditLog('JOB_POSTED', userId, 'job', (job as any)._id.toString(), `Job "${dto.title}" posted`, {
      companyId: companyObjectId.toString(),
      jobId: (job as any)._id.toString(),
      title: dto.title,
      status: 'active',
    });
    this.matchingService
      .enqueueJobAnalysis((job as any)._id.toString(), companyObjectId.toString(), userId)
      .catch((error: any) => {
        this.logger.warn(`Unable to enqueue AI job analysis for ${(job as any)._id}: ${error.message}`);
        this.generateDirectMatchesForJob(job.toObject ? job.toObject() : job, companyObjectId)
          .catch((fallbackError: any) => this.logger.warn(`Direct matching fallback failed for job ${(job as any)._id}: ${fallbackError.message}`));
      });
    return job;
  }

  async generateSampleJobs(userId: string): Promise<{ created: number; jobs: Job[] }> {
    const samples = this.getSampleJobDtos();
    const jobs: Job[] = [];

    for (const sample of samples) {
      const job = await this.createJob(userId, sample);
      jobs.push(job);
    }

    await this.auditLog('SAMPLE_JOBS_GENERATED', userId, 'company', userId, `${jobs.length} sample jobs generated`, {
      count: jobs.length,
      titles: samples.map((job) => job.title),
    });

    return { created: jobs.length, jobs };
  }

  // ==========================================
  // FR-COMP-004: Delete Job
  // ==========================================

  async deleteJob(userId: string, jobId: string): Promise<any> {
    const company = await this.findByUserId(userId);
    const companyObjectId = (company as any)._id;

    // Find and delete the job, ensuring it belongs to this company
    const job = await this.jobModel.findOneAndDelete({
      _id: new Types.ObjectId(jobId),
      companyId: companyObjectId,
    }).lean();

    if (!job) {
      throw new NotFoundException('Job not found or does not belong to your company');
    }

    // Also delete related applications
    const deletedApplications = await this.applicationModel.deleteMany({
      jobId: new Types.ObjectId(jobId),
      companyId: companyObjectId,
    });

    // Delete related match results
    const deletedMatchResults = await this.matchResultModel.deleteMany({
      job: new Types.ObjectId(jobId),
    });

    // Delete related skill gaps
    const deletedSkillGaps = await this.skillGapModel.deleteMany({
      jobId: new Types.ObjectId(jobId),
    });

    this.logger.log(
      `Job deleted: ${jobId} by company ${companyObjectId}. ` +
      `Deleted ${deletedApplications.deletedCount} applications, ` +
      `${deletedMatchResults.deletedCount} match results, ` +
      `${deletedSkillGaps.deletedCount} skill gaps.`,
    );

    await this.auditLog('JOB_DELETED', userId, 'job', jobId, `Job "${(job as any).title || jobId}" deleted`, {
      companyId: companyObjectId.toString(),
      jobId,
      title: (job as any).title || '',
      deletedApplications: deletedApplications.deletedCount || 0,
      deletedMatchResults: deletedMatchResults.deletedCount || 0,
      deletedSkillGaps: deletedSkillGaps.deletedCount || 0,
    });

    return {
      message: 'Job deleted successfully',
      jobId,
      deletedApplications: deletedApplications.deletedCount || 0,
      deletedMatchResults: deletedMatchResults.deletedCount || 0,
      deletedSkillGaps: deletedSkillGaps.deletedCount || 0,
    };
  }

  async getCompanyJobs(userId: string, query: any = {}): Promise<any> {
    const company = await this.findByUserId(userId);
    const companyObjectId = (company as any)._id;

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { companyId: companyObjectId };
    if (query.status) filter.status = query.status;

    const [data, total] = await Promise.all([
      this.jobModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.jobModel.countDocuments(filter),
    ]);

    return {
      data: data.map((job: any) => this.serializeCompanyJob(job)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async updateJob(userId: string, jobId: string, dto: Partial<CreateJobDto>): Promise<Job> {
    const company = await this.findByUserId(userId);
    const companyObjectId = (company as any)._id;

    const job = await this.jobModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(jobId), companyId: companyObjectId },
        { $set: { ...this.mapCreateJobDto(dto), updatedAt: new Date() } },
        { new: true },
      )
      .lean();

    if (!job) throw new NotFoundException('Job not found');
    await this.auditLog('JOB_UPDATED', userId, 'job', jobId, 'Job updated', {
      companyId: companyObjectId.toString(),
      jobId,
      changedFields: Object.keys(dto || {}),
    });
    if ((job as any).status === 'active') {
      try {
        await this.matchingService.enqueueBatchMatchForJob(jobId, companyObjectId.toString());
      } catch (error: any) {
        this.logger.warn(`Unable to enqueue batch matching for job ${jobId}: ${error.message}`);
      }
    }
    return job as Job;
  }

  // ==========================================
  // FR-COMP-007/008/009/010/011/012: Candidate Search + Matching + Skill Gaps + Acceptance Probability
  // ==========================================

  async searchCandidates(userId: string, query: any = {}): Promise<any> {
    const company = await this.findByUserId(userId);
    const companyObjectId = (company as any)._id;

    // Build filter for students
    const studentFilter: any = { 'privacySettings.allowCompanySearch': { $ne: false } };

    if (query.skills) {
      const skillsArray = Array.isArray(query.skills) ? query.skills : query.skills.split(',');
      studentFilter['skills.name'] = { $in: skillsArray };
    }
    if (query.university) {
      studentFilter['academicInfo.universityName'] = new RegExp(query.university, 'i');
    }
    if (query.college) {
      studentFilter['academicInfo.collegeName'] = new RegExp(query.college, 'i');
    }
    if (query.department) {
      studentFilter['academicInfo.departmentName'] = new RegExp(query.department, 'i');
    }
    if (query.academicLevel) {
      studentFilter['academicInfo.academicLevel'] = query.academicLevel;
    }
    if (query.gpaMin) {
      studentFilter['academicInfo.gpa'] = { $gte: parseFloat(query.gpaMin) };
    }
    if (query.location) {
      studentFilter['professionalProfile.preferredLocations'] = new RegExp(query.location, 'i');
    }
    if (query.search) {
      studentFilter.$or = [
        { 'personalInfo.firstName': new RegExp(query.search, 'i') },
        { 'personalInfo.lastName': new RegExp(query.search, 'i') },
        { 'academicInfo.departmentName': new RegExp(query.search, 'i') },
        { 'academicInfo.collegeName': new RegExp(query.search, 'i') },
        { 'academicInfo.universityName': new RegExp(query.search, 'i') },
        { 'skills.name': new RegExp(query.search, 'i') },
        { 'projects.title': new RegExp(query.search, 'i') },
        { 'certifications.name': new RegExp(query.search, 'i') },
      ];
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      this.studentModel.find(studentFilter)
        .select('userId personalInfo academicInfo skills aiMetrics projects certifications professionalProfile privacySettings experiences cvData')
        .skip(skip)
        .limit(limit)
        .lean(),
      this.studentModel.countDocuments(studentFilter),
    ]);

    // Get match results for these students against company jobs
    const studentIds = students.map(s => s._id.toString());
    const matchResults = await this.matchResultModel.find({
      student: { $in: studentIds.map((id: string) => new Types.ObjectId(id)) },
      company: companyObjectId,
    }).lean();
    const applications = await this.applicationModel.find({
      studentId: { $in: studentIds.map((id: string) => new Types.ObjectId(id)) },
      companyId: companyObjectId,
    })
      .populate('jobId', 'title titleAr')
      .lean();
    const applicationByStudent = new Map<string, any>();
    for (const application of applications) {
      const key = (application as any).studentId?.toString();
      const existing = applicationByStudent.get(key);
      if (!existing || new Date((application as any).createdAt || 0) > new Date(existing.createdAt || 0)) {
        applicationByStudent.set(key, application);
      }
    }
    const userIds = students.map((student: any) => student.userId).filter(Boolean);
    const users = await this.userModel.find({ _id: { $in: userIds } })
      .select('firstName lastName firstNameAr lastNameAr email phone avatar')
      .lean();
    const userById = new Map(users.map((user: any) => [user._id.toString(), user]));

    const enrichedStudents = students.map(student => {
      const studentMatchResults = matchResults.filter(
        (mr: any) => mr.student?.toString() === student._id.toString(),
      );
      const bestMatch = studentMatchResults.sort((a: any, b: any) => (b.overallScore || 0) - (a.overallScore || 0))[0];
      const application = applicationByStudent.get(student._id.toString());
      const user = student.userId ? userById.get(student.userId.toString()) : null;
      const name = this.firstText(
        `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim(),
        `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        user?.email,
      );
      const nameAr = this.firstText(
        `${(student as any).personalInfo?.firstNameAr || ''} ${(student as any).personalInfo?.lastNameAr || ''}`.trim(),
        `${user?.firstNameAr || ''} ${user?.lastNameAr || ''}`.trim(),
        name,
      );

      return {
        id: student._id,
        applicationId: application?._id,
        name,
        nameAr,
        email: user?.email || '',
        phone: user?.phone || student.personalInfo?.phone || '',
        avatarUrl: user?.avatar || student.personalInfo?.avatarUrl || '',
        location: this.firstText(
          [student.personalInfo?.address?.city, student.personalInfo?.address?.country].filter(Boolean).join(', '),
          (student.professionalProfile?.preferredLocations || [])[0],
        ),
        linkedIn: this.firstText(
          (student as any).cvData?.parsedData?.personalInfo?.linkedin,
          (student as any).cvData?.parsedData?.personalInfo?.linkedIn,
          (student as any).professionalProfile?.linkedIn,
        ),
        github: this.firstText(
          (student as any).cvData?.parsedData?.personalInfo?.github,
          (student as any).professionalProfile?.github,
        ),
        portfolio: this.firstText(
          (student as any).cvData?.parsedData?.personalInfo?.portfolio,
          (student as any).cvData?.parsedData?.personalInfo?.website,
          (student as any).professionalProfile?.portfolio,
        ),
        website: this.firstText(
          (student as any).cvData?.parsedData?.personalInfo?.website,
          (student as any).professionalProfile?.website,
        ),
        university: student.academicInfo?.universityName || '',
        universityAr: (student.academicInfo as any)?.universityNameAr || student.academicInfo?.universityName || '',
        college: student.academicInfo?.collegeName || '',
        department: student.academicInfo?.departmentName || '',
        major: student.academicInfo?.departmentName || '',
        gpa: student.academicInfo?.gpa,
        academicLevel: student.academicInfo?.academicLevel,
        graduationYear: student.academicInfo?.expectedGraduation,
        skills: this.toDisplayNames(student.skills || []),
        skillDetails: (student.skills || []).map((s: any) => ({ name: s.name, proficiency: s.proficiency })),
        matchScore: bestMatch?.overallScore || (application as any)?.matchSnapshot?.matchScore || 0,
        acceptanceProbability: bestMatch?.acceptanceProbability?.score || 0,
        readinessScore: student.aiMetrics?.readinessScore || 0,
        headline: student.professionalProfile?.headline,
        careerInterests: student.professionalProfile?.careerInterests || [],
        preferredLocations: student.professionalProfile?.preferredLocations || [],
        experience: (student as any).experiences?.length || 0,
        projects: student.projects?.length || 0,
        certifications: student.certifications?.length || 0,
        status: application ? this.toFrontendStatus(application.status) : 'new',
        appliedJob: this.firstText((application?.jobId as any)?.title),
        appliedFor: this.firstText((application?.jobId as any)?.title),
        // FR-COMP-008: Recommendation reasons
        matchReasons: bestMatch ? {
          matchedSkills: this.toDisplayNames(bestMatch.skillMatches || []),
          missingSkills: this.toDisplayNames(bestMatch.missingSkills || []),
          recommendations: bestMatch.recommendations || [],
          overallScore: bestMatch.overallScore,
          skillScore: bestMatch.skillScore,
          experienceScore: bestMatch.experienceScore,
          educationScore: bestMatch.educationScore,
        } : null,
      };
    });

    // Sort by match score if requested
    if (query.sortBy === 'matchScore') {
      enrichedStudents.sort((a, b) => b.matchScore - a.matchScore);
    }

    return { candidates: enrichedStudents, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ==========================================
  // FR-COMP-012/013: Application Review + Status Transitions
  // ==========================================

  async getApplications(userId: string, query: any = {}): Promise<any> {
    const company = await this.findByUserId(userId);
    const companyObjectId = (company as any)._id;

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { companyId: companyObjectId };
    if (query.status) filter.status = query.status;
    if (query.jobId) filter.jobId = new Types.ObjectId(query.jobId);

    const [applications, total] = await Promise.all([
      this.applicationModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('studentId', 'personalInfo.firstName personalInfo.lastName academicInfo.universityName academicInfo.collegeName academicInfo.departmentName academicInfo.gpa skills aiMetrics projects certifications experiences')
        .populate('jobId', 'title titleAr location type')
        .lean(),
      this.applicationModel.countDocuments(filter),
    ]);

    const enrichedApplications = await Promise.all(applications.map(async (app) => {
      // FR-COMP-009: Get skill gaps for this applicant
      const skillGap = await this.skillGapModel.findOne({
        student: (app as any).studentId?._id || (app as any).studentId,
        jobId: app.jobId,
      }).lean();
      const studentDoc = app.studentId as any;
      const jobDoc = app.jobId as any;
      const studentName = this.firstText(`${studentDoc?.personalInfo?.firstName || ''} ${studentDoc?.personalInfo?.lastName || ''}`.trim());

      return {
        id: app._id,
        student: {
          id: studentDoc?._id,
          name: studentName,
          university: studentDoc?.academicInfo?.universityName || '',
          college: studentDoc?.academicInfo?.collegeName || '',
          department: studentDoc?.academicInfo?.departmentName || '',
          gpa: studentDoc?.academicInfo?.gpa,
          skills: this.toDisplayNames(studentDoc?.skills || []),
          readinessScore: studentDoc?.aiMetrics?.readinessScore || 0,
        },
        job: {
          id: jobDoc?._id,
          title: jobDoc?.title || '',
          titleAr: jobDoc?.titleAr || jobDoc?.title || '',
          location: this.formatJobLocation(jobDoc?.location),
          type: jobDoc?.type || '',
        },
        status: app.status,
        matchScore: (app as any).matchSnapshot?.matchScore || 0,
        // FR-COMP-010: Acceptance probability
        acceptanceProbability: (app as any).matchSnapshot?.acceptanceProbability?.score || 0,
        coverLetter: app.coverLetter,
        appliedAt: (app as any).createdAt,
        statusHistory: app.statusHistory || [],
        // FR-COMP-009: Skill gaps
        skillGaps: skillGap ? {
          overallGapScore: (skillGap as any).overallGapScore || 0,
          missingSkills: (skillGap as any).missingSkills?.map((s: any) => ({
            name: s.name,
            importance: s.importance,
            estimatedLearningHours: s.estimatedLearningHours,
            recommendedResources: s.recommendedResources,
          })) || [],
          learningPath: (skillGap as any).learningPath || [],
        } : null,
        interview: app.interview || null,
      };
    }));

    return { applications: enrichedApplications, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ==========================================
  // FR-COMP-012: Update Application Status
  // ==========================================

  async updateApplicationStatus(userId: string, applicationId: string, status: string, notes?: string): Promise<any> {
    const company = await this.findByUserId(userId);
    const companyObjectId = (company as any)._id;

    const validStatuses = ['submitted', 'screening', 'under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_pending', 'offered', 'accepted', 'rejected', 'withdrawn'];
    const statusAliases: Record<string, string> = {
      pending: 'submitted',
      'under-review': 'under_review',
      underReview: 'under_review',
      interview: 'interview_scheduled',
      interviewScheduled: 'interview_scheduled',
    };
    status = statusAliases[status] || status;
    if (!validStatuses.includes(status)) {
      throw new ForbiddenException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const existingApplication = await this.applicationModel.findOne({
      _id: new Types.ObjectId(applicationId),
      companyId: companyObjectId,
    }).lean();

    if (!existingApplication) throw new NotFoundException('Application not found');

    const previousStatus = (existingApplication as any).status;

    const application = await this.applicationModel.findOneAndUpdate(
      { _id: new Types.ObjectId(applicationId), companyId: companyObjectId },
      {
        $set: { status, updatedAt: new Date() },
        $push: {
          statusHistory: {
            status,
            createdAt: new Date(),
            createdBy: new Types.ObjectId(userId),
            note: notes || '',
          },
        },
      },
      { new: true },
    ).lean();

    if (!application) throw new NotFoundException('Application not found');

    // FR-COMP-014: Notify the User that owns the Student profile.
    const student = await this.studentModel
      .findById((application as any).studentId)
      .select('userId')
      .lean();
    if ((student as any)?.userId) {
      try {
        await this.notificationModel.create({
          userId: (student as any).userId,
          type: 'application_update',
          title: 'Application Status Updated',
          titleAr: 'تم تحديث حالة طلب التوظيف',
          message: `Your application status has been changed to: ${status}`,
          messageAr: `تم تغيير حالة طلب التوظيف إلى: ${status}`,
          actionUrl: '/student/applications',
          data: {
            relatedEntityType: 'application',
            relatedEntityId: applicationId,
          },
          read: false,
        });
      } catch (error: any) {
        this.logger.warn(`Application ${applicationId} updated but student notification failed: ${error?.message || error}`);
      }
    }

    await this.auditLog(
      this.getApplicationAuditAction(status),
      userId,
      'application',
      applicationId,
      `Application status changed from ${previousStatus || 'unknown'} to ${status}`,
      {
        companyId: companyObjectId.toString(),
        applicationId,
        jobId: (application as any).jobId?.toString?.() || String((application as any).jobId || ''),
        studentId: (application as any).studentId?.toString?.() || String((application as any).studentId || ''),
        previousStatus,
        newStatus: status,
        notes: notes || '',
      },
    );

    return { message: 'Application status updated', applicationId, status, notes };
  }

  // ==========================================
  // FR-COMP-015/016/017/018: Analytics + Market Reports + University Alignment + Historical Data
  // ==========================================

  async getAnalytics(userId: string): Promise<any> {
    const company = await this.findByUserId(userId);
    const companyObjectId = (company as any)._id;

    const [jobs, applications, matchResults] = await Promise.all([
      this.jobModel.find({ companyId: companyObjectId }).lean(),
      this.applicationModel.find({ companyId: companyObjectId }).lean(),
      this.matchResultModel.find({ company: companyObjectId }).lean(),
    ]);

    // FR-COMP-017: Recruitment metrics
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const totalApplications = applications.length;
    const acceptedApplications = applications.filter(a => a.status === 'accepted').length;
    const rejectedApplications = applications.filter(a => a.status === 'rejected').length;
    const acceptanceRate = totalApplications > 0 ? Math.round((acceptedApplications / totalApplications) * 100) : 0;
    const rejectionRate = totalApplications > 0 ? Math.round((rejectedApplications / totalApplications) * 100) : 0;

    // Average match scores
    const avgMatchScore = matchResults.length > 0
      ? Math.round(matchResults.reduce((sum, m) => sum + ((m as any).overallScore || 0), 0) / matchResults.length)
      : 0;

    // Application funnel
    const funnel = {
      submitted: applications.filter(a => a.status === 'submitted').length,
      underReview: applications.filter(a => a.status === 'under_review' || a.status === 'screening').length,
      shortlisted: applications.filter(a => a.status === 'shortlisted').length,
      interviewed: applications.filter(a => a.status === 'interviewed' || a.status === 'interview_scheduled').length,
      offered: applications.filter(a => a.status === 'offered' || a.status === 'offer_pending').length,
      accepted: acceptedApplications,
      rejected: rejectedApplications,
    };

    // Top skills sought
    const allRequiredSkills: Record<string, number> = {};
    jobs.forEach(job => {
      ((job as any).requirements?.requiredSkills || []).forEach((s: any) => {
        const skillName = s.name || s;
        allRequiredSkills[skillName] = (allRequiredSkills[skillName] || 0) + 1;
      });
    });
    const topSkillsSought = Object.entries(allRequiredSkills)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Time-to-hire calculation
    const acceptedApps = applications.filter(a => a.status === 'accepted' && (a as any).statusHistory);
    let avgTimeToHire = 0;
    if (acceptedApps.length > 0) {
      const totalDays = acceptedApps.reduce((sum, a) => {
        const firstStatus = (a as any).statusHistory[0];
        const acceptedStatus = (a as any).statusHistory.find((h: any) => h.status === 'accepted');
        if (firstStatus && acceptedStatus) {
          const days = (new Date(acceptedStatus.changedAt || acceptedStatus.createdAt).getTime() - new Date(firstStatus.changedAt || firstStatus.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }
        return sum;
      }, 0);
      avgTimeToHire = Math.round(totalDays / acceptedApps.length);
    }

    // FR-COMP-018: Historical data - monthly trends
    const monthlyTrends: Record<string, { applications: number; accepted: number; rejected: number }> = {};
    applications.forEach(app => {
      const month = new Date((app as any).createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyTrends[month]) monthlyTrends[month] = { applications: 0, accepted: 0, rejected: 0 };
      monthlyTrends[month].applications++;
      if (app.status === 'accepted') monthlyTrends[month].accepted++;
      if (app.status === 'rejected') monthlyTrends[month].rejected++;
    });

    // FR-COMP-016: Top universities of applicants
    const universityCounts: Record<string, number> = {};
    applications.forEach(app => {
      const uni = this.firstText((app as any).studentUniversity);
      if (!uni) return;
      universityCounts[uni] = (universityCounts[uni] || 0) + 1;
    });
    const topUniversities = Object.entries(universityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const monthlyApplications = Object.entries(monthlyTrends).map(([month, data]) => ({
      month,
      monthAr: month,
      total: data.applications,
      qualified: data.accepted + data.rejected,
      interviews: applications.filter((a: any) => {
        const appMonth = new Date(a.createdAt).toISOString().slice(0, 7);
        return appMonth === month && ['interview_scheduled', 'interviewed'].includes(a.status);
      }).length,
    }));

    const frontendFunnel = [
      { name: 'Applicants', nameAr: 'المتقدمون', count: totalApplications },
      { name: 'Screening', nameAr: 'الفرز', count: funnel.underReview },
      { name: 'Interviews', nameAr: 'المقابلات', count: funnel.interviewed },
      { name: 'Offers', nameAr: 'العروض', count: funnel.offered },
      { name: 'Hired', nameAr: 'المعينون', count: acceptedApplications },
    ];

    const qualityDistribution = [
      { range: '0-20%', count: matchResults.filter((m: any) => (m.overallScore || 0) <= 20).length, color: '#dc2626' },
      { range: '21-40%', count: matchResults.filter((m: any) => (m.overallScore || 0) > 20 && (m.overallScore || 0) <= 40).length, color: '#f59e0b' },
      { range: '41-60%', count: matchResults.filter((m: any) => (m.overallScore || 0) > 40 && (m.overallScore || 0) <= 60).length, color: '#f59e0b' },
      { range: '61-80%', count: matchResults.filter((m: any) => (m.overallScore || 0) > 60 && (m.overallScore || 0) <= 80).length, color: '#3b82f6' },
      { range: '81-100%', count: matchResults.filter((m: any) => (m.overallScore || 0) > 80).length, color: '#9fe870' },
    ];

    return {
      metrics: {
        totalJobs: { value: totalJobs, label: 'Published Jobs', labelAr: 'الوظائف المنشورة', trend: activeJobs },
        totalApplicants: { value: totalApplications, label: 'Applicants', labelAr: 'المتقدمون', trend: totalApplications },
        hires: { value: acceptedApplications, label: 'Hires', labelAr: 'المعينون', trend: acceptanceRate },
        avgTimeToFill: { value: avgTimeToHire, label: 'Avg. Time', labelAr: 'متوسط المدة', trend: avgTimeToHire ? -avgTimeToHire : 0 },
        avgMatchScore: { value: `${avgMatchScore}%`, label: 'Avg. Match', labelAr: 'متوسط التطابق', trend: avgMatchScore },
        offerAcceptanceRate: { value: `${acceptanceRate}%`, label: 'Acceptance Rate', labelAr: 'معدل القبول', trend: acceptanceRate },
      },
      monthlyApplications,
      trends: monthlyApplications,
      topSkills: topSkillsSought.map((skill) => ({ skill: skill.name, demand: skill.count })),
      candidateSources: topUniversities.length
        ? topUniversities.map((uni, index) => ({ name: uni.name, nameAr: uni.name, value: uni.count, color: ['#9fe870', '#3b82f6', '#a855f7', '#f59e0b'][index % 4] }))
        : [{ name: 'Direct', nameAr: 'مباشر', value: totalApplications, color: '#9fe870' }],
      timeToFill: jobs.slice(0, 8).map((job: any) => ({ jobTitle: job.title, days: avgTimeToHire, industryAvg: 18 })),
      funnel: frontendFunnel,
      qualityDistribution,
      topSkillsSought,
      topUniversities,
      monthlyTrends: monthlyApplications,
      rawMetrics: {
        totalJobs,
        activeJobs,
        totalApplications,
        acceptedApplications,
        rejectedApplications,
        acceptanceRate,
        rejectionRate,
        avgMatchScore,
        avgTimeToHire,
      },
    };
  }

  // FR-COMP-015: Market reports
  async getMarketReport(userId: string, domain?: string): Promise<any> {
    await this.findByUserId(userId);

    const filter: any = {};
    if (domain) filter['category'] = domain;

    const skills = await this.marketDataModel.find(filter)
      .sort({ demandScore: -1 })
      .limit(20)
      .lean();

    return {
      topSkillsInDemand: skills.map(s => ({
        name: (s as any).skillName,
        demandScore: s.demandScore,
        growthRate: s.growthRate,
        averageSalary: (s as any).averageSalary,
        trend: (s as any).trend,
      })),
      fastestGrowing: skills
        .filter(s => s.growthRate > 0)
        .sort((a, b) => (b.growthRate || 0) - (a.growthRate || 0))
        .slice(0, 10)
        .map(s => ({ name: (s as any).skillName, growthRate: s.growthRate })),
      generatedAt: new Date(),
    };
  }

  async extractSkillsFromDescription(description: string): Promise<any> {
    const text = String(description || '').trim();
    if (!text) {
      return { skills: [], technologies: [], keywords: [], domains: [], matchEstimate: 0 };
    }

    try {
      const axios = (await import('axios')).default;
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.post(`${aiServiceUrl}/api/ai/skills/extract`, { text }, { timeout: 20000 });
      const skills = this.toDisplayNames(response.data?.skills || response.data?.data?.skills || []);
      return {
        skills,
        technologies: skills,
        keywords: skills,
        domains: this.inferDomains(text, skills),
        matchEstimate: Math.min(95, Math.max(40, skills.length * 8)),
      };
    } catch (error: any) {
      this.logger.warn(`AI skill extraction unavailable, using local extraction: ${error.message}`);
      const skills = this.extractSkillsLocally(text);
      return {
        skills,
        technologies: skills,
        keywords: skills,
        domains: this.inferDomains(text, skills),
        matchEstimate: Math.min(90, Math.max(35, skills.length * 8)),
      };
    }
  }

  private mapCompanyProfileUpdate(dto: UpdateCompanyProfileDto): Record<string, any> {
    const update: Record<string, any> = {};
    if (dto.name !== undefined) update['profile.name'] = dto.name;
    if ((dto as any).legalName !== undefined) update['profile.legalName'] = (dto as any).legalName;
    if (dto.description !== undefined) update['profile.description'] = dto.description;
    if (dto.descriptionAr !== undefined) update['profile.descriptionAr'] = dto.descriptionAr;
    if (dto.industry !== undefined) update['profile.industry'] = dto.industry;
    if ((dto as any).industryDomains !== undefined) update['profile.subIndustries'] = (dto as any).industryDomains;
    if (dto.size !== undefined) update['profile.companySize'] = this.normalizeCompanySize(dto.size);
    if (dto.website !== undefined) update['profile.website'] = dto.website;
    if ((dto as any).logo !== undefined) update['profile.logoUrl'] = (dto as any).logo;
    if ((dto as any).logoUrl !== undefined) update['profile.logoUrl'] = (dto as any).logoUrl;
    if ((dto as any).banner !== undefined) update['profile.coverImageUrl'] = (dto as any).banner;
    if ((dto as any).bannerUrl !== undefined) update['profile.coverImageUrl'] = (dto as any).bannerUrl;
    if (dto.location !== undefined) {
      const location = this.parseLocation(dto.location);
      update.headquarters = {
        city: location.city,
        country: location.country,
        address: dto.formattedAddress || dto.location,
        coordinates: {
          lat: dto.latitude,
          lng: dto.longitude,
        },
      };
    }
    if (dto.formattedAddress !== undefined || dto.latitude !== undefined || dto.longitude !== undefined) {
      const address = dto.formattedAddress || dto.location || '';
      const location = this.parseLocation(address);
      update.headquarters = {
        city: location.city,
        country: location.country,
        address,
        coordinates: {
          lat: dto.latitude,
          lng: dto.longitude,
        },
      };
    }
    if ((dto as any).phone !== undefined) update['contactInfo.phone'] = (dto as any).phone;
    if ((dto as any).email !== undefined) update['contactInfo.email'] = (dto as any).email;
    if ((dto as any).socialLinks?.linkedIn !== undefined) update['contactInfo.linkedIn'] = (dto as any).socialLinks.linkedIn;
    if ((dto as any).socialLinks?.twitter !== undefined) update['contactInfo.twitter'] = (dto as any).socialLinks.twitter;
    for (const key of ['github', 'portfolio', 'facebook', 'instagram', 'youtube', 'behance', 'dribbble', 'stackOverflow', 'researchGate', 'orcid']) {
      if ((dto as any).socialLinks?.[key] !== undefined) update[`contactInfo.${key}`] = (dto as any).socialLinks[key];
    }
    if (dto.benefits !== undefined) update['culture.benefits'] = dto.benefits;
    if ((dto as any).mission !== undefined) update['culture.workEnvironment'] = (dto as any).mission;
    if ((dto as any).vision !== undefined) update['culture.diversityStatement'] = (dto as any).vision;
    if ((dto as any).values !== undefined) update['culture.values'] = (dto as any).values;
    if ((dto as any).technologies !== undefined) update['recruitmentPreferences.targetMajors'] = (dto as any).technologies;
    return update;
  }

  private mapCreateJobDto(dto: Partial<CreateJobDto>): Record<string, any> {
    const location = this.parseLocation((dto as any).city || dto.location || '');
    const type = this.normalizeJobType(dto.type);
    const level = this.normalizeJobLevel(dto.experienceLevel);
    const requiredSkills = this.toDisplayNames((dto as any).skills || dto.requiredSkills || [])
      .map((name) => ({ name, weight: 1, level: 'intermediate' }));
    const preferredSkills = this.toDisplayNames(dto.niceToHaveSkills || [])
      .map((name) => ({ name, level: 'beginner' }));
    const responsibilities = Array.isArray((dto as any).responsibilities)
      ? (dto as any).responsibilities.join('\n')
      : (dto as any).responsibilities;
    const requirementsText = Array.isArray((dto as any).requirements)
      ? (dto as any).requirements.join('\n')
      : (dto as any).requirements;
    const deadline = dto.expiresAt || (dto as any).deadline;
    const educationRequired = dto.educationRequired || (dto as any).educationLevel;
    const description = [dto.description, responsibilities, requirementsText]
      .filter(Boolean)
      .join('\n\n');

    const mapped: Record<string, any> = {};
    if (dto.title !== undefined) mapped.title = dto.title;
    mapped.titleAr = dto.titleAr || dto.title || '';
    if (description) mapped.description = description;
    if (dto.descriptionAr !== undefined) mapped.descriptionAr = dto.descriptionAr;
    mapped.summary = String(dto.description || '').slice(0, 280);
    mapped.type = type;
    mapped.level = level;
    mapped.category = dto.department || (dto as any).category || this.inferDomains(description, requiredSkills.map((s) => s.name))[0] || 'General';
    mapped.subcategory = dto.experienceLevel || level;
    mapped.requirements = {
      education: {
        degree: this.normalizeEducationLevel(educationRequired),
        fields: dto.department ? [dto.department] : [],
      },
      experience: {
        minYears: this.inferMinYears(dto.experienceLevel),
        industries: [],
      },
      requiredSkills,
      preferredSkills,
      certifications: [],
      languages: [],
    };
    mapped.compensation = {
      salaryMin: dto.salaryMin || 0,
      salaryMax: dto.salaryMax || 0,
      currency: dto.salaryCurrency || 'SAR',
      benefits: dto.benefits || [],
      negotiable: Boolean((dto as any).hideSalary),
    };
    mapped.location = {
      city: location.city,
      country: location.country,
      type: dto.locationType || 'onsite',
      isRelocatable: false,
    };
    mapped.applicationSettings = {
      deadline: deadline ? new Date(deadline) : undefined,
      screeningQuestions: (dto.screeningQuestions || []).map((question: any) => ({
        question: typeof question === 'string' ? question : question.q || question.question || '',
        type: question.type === 'yesno' ? 'yes_no' : question.type || 'text',
        required: true,
      })),
    };
    return mapped;
  }

  private getSampleJobDtos(): CreateJobDto[] {
    const base = {
      locationType: 'hybrid',
      type: 'full-time',
      educationLevel: 'bachelor',
      salaryCurrency: 'SAR',
      benefits: ['Health Insurance', 'Training Budget', 'Flexible Work', 'Career Growth'],
    };
    const samples: Array<Partial<CreateJobDto> & { title: string; skills: string[]; department: string; city: string; salaryMin: number; salaryMax: number }> = [
      { title: 'Software Engineer', department: 'Engineering', city: 'Riyadh', salaryMin: 9000, salaryMax: 15000, skills: ['JavaScript', 'TypeScript', 'REST API', 'Git'] },
      { title: 'Backend Developer', department: 'Engineering', city: 'Riyadh', salaryMin: 10000, salaryMax: 16000, skills: ['Node.js', 'NestJS', 'MongoDB', 'Docker'] },
      { title: 'Frontend Developer', department: 'Engineering', city: 'Jeddah', salaryMin: 8500, salaryMax: 14000, skills: ['React', 'TypeScript', 'HTML', 'CSS'] },
      { title: 'AI Engineer', department: 'AI', city: 'Riyadh', salaryMin: 14000, salaryMax: 22000, skills: ['Python', 'Machine Learning', 'NLP', 'Embeddings'] },
      { title: 'Data Scientist', department: 'Data', city: 'Dhahran', salaryMin: 12000, salaryMax: 20000, skills: ['Python', 'SQL', 'Data Analysis', 'Machine Learning'] },
      { title: 'Network Engineer', department: 'IT', city: 'Dammam', salaryMin: 9000, salaryMax: 15000, skills: ['Networking', 'Cisco', 'Security', 'Troubleshooting'] },
      { title: 'Cyber Security Engineer', department: 'Security', city: 'Riyadh', salaryMin: 13000, salaryMax: 21000, skills: ['Cybersecurity', 'SIEM', 'Penetration Testing', 'Cloud Security'] },
      { title: 'Cloud Engineer', department: 'Cloud', city: 'Riyadh', salaryMin: 13000, salaryMax: 21000, skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD'] },
      { title: 'Electrical Engineer', department: 'Engineering', city: 'Dammam', salaryMin: 9000, salaryMax: 15000, skills: ['Power Systems', 'AutoCAD', 'PLC', 'Safety'] },
      { title: 'Mechanical Engineer', department: 'Engineering', city: 'Jubail', salaryMin: 9000, salaryMax: 15000, skills: ['CAD', 'Manufacturing', 'Maintenance', 'Problem Solving'] },
      { title: 'Chemical Engineer', department: 'Engineering', city: 'Jubail', salaryMin: 9500, salaryMax: 16000, skills: ['Process Engineering', 'Quality Control', 'Safety', 'Data Analysis'] },
      { title: 'Civil Engineer', department: 'Engineering', city: 'Riyadh', salaryMin: 8500, salaryMax: 14500, skills: ['AutoCAD', 'Project Planning', 'Construction', 'Quality Control'] },
      { title: 'Business Analyst', department: 'Operations', city: 'Riyadh', salaryMin: 8500, salaryMax: 14500, skills: ['Requirements Analysis', 'SQL', 'Dashboards', 'Communication'] },
      { title: 'Project Manager', department: 'Operations', city: 'Riyadh', salaryMin: 14000, salaryMax: 24000, skills: ['Project Management', 'Agile', 'Leadership', 'Risk Management'] },
    ];

    return samples.map((sample) => ({
      ...base,
      ...sample,
      description: `${sample.title} role focused on delivering high quality work in ${sample.department}. The candidate will collaborate with cross-functional teams, solve practical business challenges, and contribute to measurable outcomes.`,
      responsibilities: [
        `Deliver ${sample.title.toLowerCase()} tasks with clear ownership.`,
        'Collaborate with product, engineering, and business stakeholders.',
        'Document decisions, risks, and implementation progress.',
        'Improve quality, reliability, and team knowledge sharing.',
      ],
      requirements: [
        `Strong foundation in ${sample.skills.slice(0, 3).join(', ')}.`,
        'Good communication and problem-solving skills.',
        'Ability to work in agile teams and learn quickly.',
      ],
      requiredSkills: sample.skills.map((name, index) => ({ name, weight: Math.max(1, 5 - index) })),
      experienceLevel: sample.title === 'Project Manager' ? 'senior' : sample.title.includes('AI') || sample.title.includes('Cyber') ? 'mid' : 'entry',
      location: sample.city,
      city: sample.city,
    })) as CreateJobDto[];
  }

  private serializeCompanyJob(job: any): any {
    return {
      ...job,
      id: job._id?.toString(),
      titleAr: job.titleAr || job.title,
      location: this.formatJobLocation(job.location),
      locationType: job.location?.type || '',
      type: job.type,
      applicants: job.applicationsCount || 0,
      postedDate: job.createdAt,
      salaryMin: job.compensation?.salaryMin || 0,
      salaryMax: job.compensation?.salaryMax || 0,
      requiredSkills: this.toDisplayNames(job.requirements?.requiredSkills || []),
    };
  }

  private toDisplayNames(values: any): string[] {
    if (!Array.isArray(values)) {
      const single = this.valueToDisplayText(values);
      return single ? [single] : [];
    }
    const seen = new Set<string>();
    const result: string[] = [];
    for (const value of values) {
      const text = this.valueToDisplayText(value);
      if (!text) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(text);
    }
    return result;
  }

  private valueToDisplayText(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const text = String(value).trim();
      return text === '[object Object]' ? '' : text;
    }
    if (Array.isArray(value)) return this.toDisplayNames(value).join(', ');
    if (typeof value === 'object') {
      return this.firstText(value.name, value.skillName, value.title, value.label, value.value, value.text, value.description);
    }
    return '';
  }

  private firstText(...values: any[]): string {
    for (const value of values) {
      const text = this.valueToDisplayText(value);
      if (text) return text;
    }
    return '';
  }

  private formatJobLocation(location: any): string {
    if (!location) return '';
    if (typeof location === 'string') return location;
    return [location.city, location.country].filter(Boolean).join(', ');
  }

  private parseLocation(location: string): { city: string; country: string } {
    const parts = String(location || '').split(/[,،|-]/).map((part) => part.trim()).filter(Boolean);
    return { city: parts[0] || '', country: parts[1] || 'Saudi Arabia' };
  }

  private normalizeJobType(type?: string): string {
    const map: Record<string, string> = {
      'full-time': 'full_time',
      fullTime: 'full_time',
      'part-time': 'part_time',
      partTime: 'part_time',
    };
    return map[String(type || '')] || type || 'full_time';
  }

  private normalizeJobLevel(level?: string): string {
    const map: Record<string, string> = { junior: 'entry', manager: 'lead' };
    return map[String(level || '')] || level || 'entry';
  }

  private normalizeEducationLevel(level?: string): string {
    const normalized = String(level || 'any').toLowerCase();
    if (['high_school', 'bachelor', 'master', 'phd', 'any'].includes(normalized)) return normalized;
    return 'any';
  }

  private normalizeCompanySize(size?: string): string {
    const map: Record<string, string> = { '1-50': '11-50', '201-1000': '201-500' };
    return map[String(size || '')] || size || '11-50';
  }

  private inferMinYears(level?: string): number {
    if (level === 'mid') return 3;
    if (level === 'senior') return 5;
    if (level === 'lead' || level === 'manager') return 7;
    return 0;
  }

  private inferDomains(text: string, skills: string[]): string[] {
    const combined = `${text} ${skills.join(' ')}`.toLowerCase();
    if (/ai|machine learning|data|python|tensorflow|pytorch/.test(combined)) return ['Artificial Intelligence', 'Data'];
    if (/security|cyber|network/.test(combined)) return ['Cybersecurity'];
    if (/react|frontend|backend|node|api|software/.test(combined)) return ['Software Engineering'];
    if (/cloud|aws|azure|docker|kubernetes|devops/.test(combined)) return ['Cloud & DevOps'];
    return ['General'];
  }

  private extractSkillsLocally(text: string): string[] {
    const known = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'NestJS', 'Python', 'Java',
      'C#', 'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS',
      'Azure', 'Git', 'CI/CD', 'Machine Learning', 'Data Analysis', 'REST API',
      'Problem Solving', 'Communication', 'Leadership',
    ];
    return known.filter((skill) => new RegExp(skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(text));
  }

  private async generateDirectMatchesForJob(job: any, companyObjectId: Types.ObjectId): Promise<void> {
    const jobText = [
      job.title,
      job.description,
      job.summary,
      this.toDisplayNames(job.requirements?.requiredSkills || []).join(' '),
    ].filter(Boolean).join(' ');
    const requiredSkills = this.toDisplayNames(job.requirements?.requiredSkills || []);
    const skillVector = await this.generateTextVector(jobText);

    await this.jobModel.updateOne(
      { _id: job._id },
      {
        $set: {
          'aiAnalysis.skillVector': skillVector,
          'aiAnalysis.experienceVector': this.generateLocalVector(String(job.requirements?.experience?.minYears || 0)),
          'aiAnalysis.cultureVector': this.generateLocalVector(`${job.category || ''} ${job.type || ''}`),
          'aiAnalysis.lastUpdated': new Date(),
          'aiAnalysis.version': 'company-direct-v1',
        },
      },
    );

    const students = await this.studentModel
      .find({ 'privacySettings.allowCompanySearch': { $ne: false } })
      .select('skills academicInfo projects certifications experiences aiMetrics professionalProfile')
      .limit(500)
      .lean();

    if (students.length === 0) return;

    const matchOps: any[] = [];
    const gapOps: any[] = [];

    for (const student of students) {
      const studentSkills = this.toDisplayNames((student as any).skills || []);
      const studentSkillSet = new Set(studentSkills.map((skill) => skill.toLowerCase()));
      const matchedSkills = requiredSkills.filter((skill) => studentSkillSet.has(skill.toLowerCase()));
      const missingSkills = requiredSkills.filter((skill) => !studentSkillSet.has(skill.toLowerCase()));

      const skillScore = requiredSkills.length ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 60;
      const experienceScore = this.scoreExperience((student as any).experiences?.length || 0, job.requirements?.experience?.minYears || 0);
      const educationScore = this.scoreEducation((student as any).academicInfo?.academicLevel, job.requirements?.education?.degree);
      const projectBonus = Math.min(10, ((student as any).projects?.length || 0) * 2);
      const certificateBonus = Math.min(10, ((student as any).certifications?.length || 0) * 2);
      const overallScore = Math.min(100, Math.round((skillScore * 0.55) + (experienceScore * 0.2) + (educationScore * 0.15) + projectBonus + certificateBonus));
      const acceptanceScore = Math.min(100, Math.round((overallScore * 0.75) + (((student as any).aiMetrics?.readinessScore || 50) * 0.25)));

      matchOps.push({
        updateOne: {
          filter: { student: student._id, job: job._id },
          update: {
            $set: {
              student: student._id,
              job: job._id,
              jobId: job._id,
              company: companyObjectId,
              overallScore,
              skillScore,
              experienceScore,
              educationScore,
              semanticScore: skillScore,
              factorBreakdown: {
                skills: skillScore,
                experience: experienceScore,
                education: educationScore,
                projects: projectBonus,
                certificates: certificateBonus,
              },
              skillMatches: matchedSkills.map((name) => ({ name, matchPercentage: 100 })),
              missingSkills: missingSkills.map((name) => ({ name, importance: 'high', gap: 100 })),
              recommendations: missingSkills.map((name) => `Improve ${name} to increase compatibility with ${job.title}.`),
              acceptanceProbability: {
                score: acceptanceScore,
                confidence: requiredSkills.length ? 'medium' : 'low',
                factors: [
                  { name: 'Skill match', value: skillScore },
                  { name: 'Experience match', value: experienceScore },
                  { name: 'Education match', value: educationScore },
                ],
              },
              scores: {
                overall: overallScore,
                skill: skillScore,
                experience: experienceScore,
                education: educationScore,
                semantic: skillScore,
              },
              recommendation: {
                reasoning: matchedSkills.length
                  ? `Candidate matches ${matchedSkills.join(', ')}.`
                  : 'Candidate has limited direct skill overlap with this job.',
                actions: missingSkills.map((name) => `Develop ${name}`),
              },
              calculatedAt: new Date(),
            },
          },
          upsert: true,
        },
      });

      for (const skillName of missingSkills) {
        gapOps.push({
          updateOne: {
            filter: { student: student._id, jobId: job._id, skillName },
            update: {
              $set: {
                student: student._id,
                jobId: job._id,
                skillName,
                currentLevel: 0,
                requiredLevel: 100,
                gap: 100,
                priority: 'high',
                overallGapScore: 100 - skillScore,
                missingSkills: missingSkills.map((name) => ({ name, importance: 90, gap: 100 })),
                learningPath: missingSkills.map((name, index) => ({
                  step: index + 1,
                  resource: `Learn ${name}`,
                  url: `https://www.google.com/search?q=${encodeURIComponent(`${name} official documentation`)}`,
                })),
                metadata: {
                  jobTitle: job.title,
                  companyId: companyObjectId,
                },
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (matchOps.length) await this.matchResultModel.bulkWrite(matchOps);
    if (gapOps.length) await this.skillGapModel.bulkWrite(gapOps);
    this.logger.log(`Direct matching completed for job ${job._id}: ${matchOps.length} students`);
  }

  private async generateTextVector(text: string): Promise<number[]> {
    try {
      const axios = (await import('axios')).default;
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const response = await axios.post(`${aiServiceUrl}/api/ai/skills/embed`, { text }, { timeout: 15000 });
      const embedding = response.data?.embedding || response.data?.data?.embedding;
      if (Array.isArray(embedding) && embedding.length > 0) {
        return embedding.slice(0, 384).map((value: any) => Number(value) || 0);
      }
    } catch (error: any) {
      this.logger.warn(`AI embedding unavailable, using local vector: ${error.message}`);
    }
    return this.generateLocalVector(text);
  }

  private generateLocalVector(text: string): number[] {
    const vector = new Array(64).fill(0);
    const tokens = String(text || '').toLowerCase().match(/[\p{L}\p{N}+#.]+/gu) || [];
    for (const token of tokens) {
      let hash = 0;
      for (let i = 0; i < token.length; i += 1) {
        hash = ((hash << 5) - hash) + token.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % vector.length;
      vector[index] += 1;
    }
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + (value * value), 0)) || 1;
    return vector.map((value) => Number((value / magnitude).toFixed(6)));
  }

  private scoreExperience(studentYears: number, requiredYears: number): number {
    if (!requiredYears) return 80;
    return Math.min(100, Math.round((studentYears / requiredYears) * 100));
  }

  private scoreEducation(studentLevel?: string, requiredDegree?: string): number {
    if (!requiredDegree || requiredDegree === 'any') return 80;
    const order = ['freshman', 'sophomore', 'junior', 'senior', 'graduate', 'bachelor', 'master', 'phd'];
    const studentIndex = order.indexOf(String(studentLevel || '').toLowerCase());
    const requiredIndex = order.indexOf(String(requiredDegree || '').toLowerCase());
    if (studentIndex < 0 || requiredIndex < 0) return 60;
    return studentIndex >= requiredIndex ? 100 : 60;
  }

  private toFrontendStatus(status?: string): string {
    const map: Record<string, string> = {
      submitted: 'new',
      screening: 'in-review',
      under_review: 'in-review',
      shortlisted: 'in-review',
      interview_scheduled: 'interview',
      interviewed: 'interview',
      offer_pending: 'interview',
      offered: 'accepted',
      accepted: 'accepted',
      rejected: 'rejected',
      withdrawn: 'rejected',
    };
    return map[String(status || '')] || 'new';
  }

  private getApplicationAuditAction(status: string): string {
    const reviewStatuses = new Set([
      'screening',
      'under_review',
      'shortlisted',
      'interview_scheduled',
      'interviewed',
      'offer_pending',
      'offered',
    ]);

    if (status === 'accepted') return 'APPLICATION_ACCEPTED';
    if (status === 'rejected') return 'APPLICATION_REJECTED';
    if (status === 'withdrawn') return 'APPLICATION_WITHDRAWN';
    if (reviewStatuses.has(status)) return 'APPLICATION_REVIEWED';
    return 'APPLICATION_STATUS_UPDATED';
  }

  // ==========================================
  // FR-COMP-020: Audit Logging Helper
  // ==========================================

  private async auditLog(
    action: string,
    actorId: string,
    resource: string,
    resourceId: string,
    description: string,
    details: Record<string, any> = {},
  ): Promise<void> {
    try {
      const actorObjectId = new Types.ObjectId(actorId);
      await this.auditLogModel.create({
        userId: actorObjectId,
        actorId: actorObjectId,
        action,
        resource,
        resourceId,
        details,
        description,
        severity: 'info',
        timestamp: new Date(),
      });
    } catch (err: any) {
      this.logger.error(`Audit log failed: ${err.message}`);
    }
  }
}


