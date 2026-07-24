import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
  ServiceUnavailableException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Model, Types } from 'mongoose';
import { basename, extname, join } from 'path';
import { createHash, randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { Student, StudentDocument } from './schemas/student.schema';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Job, JobDocument } from '../jobs/schemas/job.schema';
import { Application, ApplicationDocument } from '../applications/schemas/application.schema';
import { MatchResult, MatchResultDocument } from '../matching/match-results/schemas/match-result.schema';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { SkillGap, SkillGapDocument } from '../matching/skill-gaps/schemas/skill-gap.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Skill, SkillDocument } from '../skills/schemas/skill.schema';
import { Notification, NotificationDocument } from '../common/notifications/schemas/notification.schema';
import { AiEmbedding, AiEmbeddingDocument } from '../matching/ai-embeddings/schemas/ai-embedding.schema';
import { University, UniversityDocument } from '../universities/schemas/university.schema';
import { College, CollegeDocument } from '../universities/colleges/schemas/college.schema';
import { Department, DepartmentDocument } from '../universities/departments/schemas/department.schema';
import { AcademicProgram, AcademicProgramDocument } from '../universities/academic-programs/schemas/academic-program.schema';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(MatchResult.name) private matchResultModel: Model<MatchResultDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(SkillGap.name) private skillGapModel: Model<SkillGapDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Skill.name) private skillModel: Model<SkillDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(AiEmbedding.name) private aiEmbeddingModel: Model<AiEmbeddingDocument>,
    @InjectModel(University.name) private universityModel: Model<UniversityDocument>,
    @InjectModel(College.name) private collegeModel: Model<CollegeDocument>,
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
    @InjectModel(AcademicProgram.name) private programModel: Model<AcademicProgramDocument>,
    @InjectQueue('ai-matching') private readonly aiQueue: Queue,
  ) {}

  async enqueueCvAnalysis(userId: string, file: Express.Multer.File) {
    const fs = await import('fs/promises');
    const contentHash = createHash('sha256').update(await fs.readFile(file.path)).digest('hex');
    const jobId = `cv-${userId}-${contentHash.slice(0, 20)}`;
    const student = await this.studentModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .select('cvData.contentHash')
      .lean();
    if (!student) {
      await unlink(file.path).catch(() => undefined);
      throw new NotFoundException('Student profile not found');
    }
    if ((student as any).cvData?.contentHash === contentHash) {
      await unlink(file.path).catch(() => undefined);
      throw new ConflictException({
        code: 'CV_DUPLICATE_FILE',
        message: 'This CV file is already uploaded',
      });
    }

    let task;
    try {
      const existingTask = await this.aiQueue.getJob(jobId);
      if (existingTask) {
        const existingState = await existingTask.getState();
        if (['waiting', 'active', 'delayed'].includes(existingState)) {
          await unlink(file.path).catch(() => undefined);
          throw new ConflictException({
            code: 'CV_ANALYSIS_ALREADY_QUEUED',
            message: 'This CV file is already being analyzed',
          });
        }
        if (['completed', 'failed'].includes(existingState)) await existingTask.remove();
      }
      task = await this.aiQueue.add('analyze-cv', {
        userId,
        file: { path: file.path, filename: file.filename, originalname: file.originalname, mimetype: file.mimetype, size: file.size },
        contentHash,
        requestedBy: userId,
      }, {
        jobId,
        attempts: Math.max(1, Number(process.env.AI_MAX_RETRIES || 3)),
        backoff: { type: 'exponential', delay: 5000 },
        timeout: Math.max(5000, Number(process.env.AI_JOB_TIMEOUT || 120000)),
        removeOnComplete: 100,
        removeOnFail: 100,
      });
    } catch (error: any) {
      if (file.path) await unlink(file.path).catch(() => undefined);
      if (error instanceof ConflictException || error instanceof NotFoundException) throw error;
      this.logger.error(`Unable to enqueue CV analysis for user ${userId}: ${error?.message || error}`);
      throw new ServiceUnavailableException({ code: 'AI_QUEUE_UNAVAILABLE', message: 'CV analysis queue is unavailable' });
    }
    return { taskId: String(task.id), status: 'queued', contentHash };
  }

  async findByUserId(userId: string): Promise<any> {
    const [student, user] = await Promise.all([
      this.studentModel.findOne({ userId: new Types.ObjectId(userId) }).lean(),
      this.userModel.findById(new Types.ObjectId(userId)).lean(),
    ]);

    if (!student || !user) {
      throw new NotFoundException('Student profile not found');
    }

    const academicRelations = await this.loadAcademicRelations(student as any);
    return this.serializeStudentProfile(student as any, user as any, academicRelations);
  }

  async updateAvatar(userId: string, file: Express.Multer.File): Promise<any> {
    const [student, user] = await Promise.all([
      this.studentModel.findOne({ userId: new Types.ObjectId(userId) }).lean(),
      this.userModel.findById(new Types.ObjectId(userId)).lean(),
    ]);
    if (!student || !user) throw new NotFoundException('Student profile not found');

    const extension = this.detectImageExtension(file.buffer, file.mimetype);
    const directory = join(process.cwd(), 'uploads', 'avatars');
    const filename = `student-${userId}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const outputPath = join(directory, filename);
    const avatarUrl = `/uploads/avatars/${filename}`;
    await mkdir(directory, { recursive: true });
    await writeFile(outputPath, file.buffer);

    try {
      await Promise.all([
        this.userModel.findByIdAndUpdate(user._id, { $set: { avatar: avatarUrl } }),
        this.studentModel.findByIdAndUpdate((student as any)._id, { $set: { 'personalInfo.avatarUrl': avatarUrl } }),
      ]);
    } catch (error) {
      await unlink(outputPath).catch(() => undefined);
      throw error;
    }

    const previousAvatar = String((user as any).avatar || (student as any).personalInfo?.avatarUrl || '');
    if (previousAvatar.startsWith('/uploads/avatars/')) {
      const previousPath = join(directory, basename(previousAvatar));
      if (previousPath !== outputPath) await unlink(previousPath).catch(() => undefined);
    }

    const [updatedStudent, updatedUser] = await Promise.all([
      this.studentModel.findById((student as any)._id).lean(),
      this.userModel.findById(user._id).lean(),
    ]);
    const academicRelations = await this.loadAcademicRelations(updatedStudent as any);
    this.logger.log(`Student avatar updated: ${userId}`);
    return this.serializeStudentProfile(updatedStudent as any, updatedUser as any, academicRelations);
  }

  async updateCoverImage(userId: string, file: Express.Multer.File): Promise<any> {
    const [student, user] = await Promise.all([
      this.studentModel.findOne({ userId: new Types.ObjectId(userId) }).lean(),
      this.userModel.findById(new Types.ObjectId(userId)).lean(),
    ]);
    if (!student || !user) throw new NotFoundException('Student profile not found');

    const extension = this.detectImageExtension(file.buffer, file.mimetype, 'INVALID_COVER_IMAGE_CONTENT');
    const directory = join(process.cwd(), 'uploads', 'student-covers');
    const filename = `student-${userId}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const outputPath = join(directory, filename);
    const coverImageUrl = `/uploads/student-covers/${filename}`;
    await mkdir(directory, { recursive: true });
    await writeFile(outputPath, file.buffer);

    let updatedStudent: any;
    try {
      updatedStudent = await this.studentModel.findByIdAndUpdate(
        (student as any)._id,
        { $set: { 'personalInfo.coverImageUrl': coverImageUrl } },
        { new: true },
      ).lean();
    } catch (error) {
      await unlink(outputPath).catch(() => undefined);
      throw error;
    }

    const previousCover = String((student as any).personalInfo?.coverImageUrl || '');
    if (previousCover.startsWith('/uploads/student-covers/')) {
      const previousPath = join(directory, basename(previousCover));
      if (previousPath !== outputPath) await unlink(previousPath).catch(() => undefined);
    }

    const academicRelations = await this.loadAcademicRelations(updatedStudent as any);
    this.logger.log(`Student cover image updated: ${userId}`);
    return this.serializeStudentProfile(updatedStudent as any, user as any, academicRelations);
  }

  async updateProfile(userId: string, dto: UpdateStudentDto): Promise<any> {
    const [student, user] = await Promise.all([
      this.studentModel.findOne({ userId: new Types.ObjectId(userId) }),
      this.userModel.findById(new Types.ObjectId(userId)),
    ]);

    if (!student || !user) {
      throw new NotFoundException('Student profile not found');
    }

    if ((dto.latitude === undefined) !== (dto.longitude === undefined)) {
      throw new BadRequestException({
        code: 'INCOMPLETE_LOCATION_COORDINATES',
        message: 'Latitude and longitude must be provided together',
      });
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existingUser = await this.userModel.findOne({ email: dto.email.toLowerCase() }).lean();
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }
    }

    const userUpdates: any = {};
    if (dto.firstName) userUpdates.firstName = dto.firstName;
    if (dto.lastName) userUpdates.lastName = dto.lastName;
    if (dto.email) userUpdates.email = dto.email.toLowerCase();
    if (dto.phone !== undefined) userUpdates.phone = dto.phone;
    if (dto.avatar !== undefined) userUpdates.avatar = dto.avatar;

    if (Object.keys(userUpdates).length > 0) {
      await this.userModel.findByIdAndUpdate(user._id, { $set: userUpdates });
    }

    const studentUpdates: any = {};
    const hasAcademicIds = Boolean(dto.universityId || dto.collegeId || dto.departmentId || dto.majorId);
    if (hasAcademicIds) {
      const selection = await this.validateAcademicSelection(dto);
      studentUpdates['academicInfo.universityId'] = selection.university._id;
      studentUpdates['academicInfo.collegeId'] = selection.college._id;
      studentUpdates['academicInfo.departmentId'] = selection.department._id;
      studentUpdates['academicInfo.universityName'] = selection.university.nameAr || selection.university.name;
      studentUpdates['academicInfo.collegeName'] = selection.college.nameAr || selection.college.name;
      studentUpdates['academicInfo.departmentName'] = selection.department.nameAr || selection.department.name;
      studentUpdates['academicInfo.requiresAcademicUpdate'] = false;
      if (selection.major) {
        studentUpdates['academicInfo.majorId'] = selection.major._id;
        studentUpdates['academicInfo.majorName'] = selection.major.nameAr || selection.major.nameEn;
      } else {
        studentUpdates.$unset = { 'academicInfo.majorId': 1, 'academicInfo.majorName': 1 };
      }
    } else {
      if (dto.university !== undefined) studentUpdates['academicInfo.universityName'] = dto.university;
      if (dto.college !== undefined) studentUpdates['academicInfo.collegeName'] = dto.college;
      if (dto.department !== undefined) studentUpdates['academicInfo.departmentName'] = dto.department;
    }
    if (dto.academicLevel !== undefined) studentUpdates['academicInfo.academicLevel'] = dto.academicLevel;
    if (dto.gpa !== undefined) studentUpdates['academicInfo.gpa'] = dto.gpa;
    if (dto.graduationYear !== undefined) studentUpdates['academicInfo.expectedGraduation'] = dto.graduationYear;
    if (dto.firstName !== undefined) studentUpdates['personalInfo.firstName'] = dto.firstName;
    if (dto.lastName !== undefined) studentUpdates['personalInfo.lastName'] = dto.lastName;
    if (dto.phone !== undefined) studentUpdates['personalInfo.phone'] = dto.phone;
    if (dto.whatsapp !== undefined) studentUpdates['personalInfo.whatsapp'] = dto.whatsapp;
    if (dto.address !== undefined) studentUpdates['personalInfo.address.formattedAddress'] = dto.address.trim();
    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      studentUpdates['personalInfo.address.coordinates.lat'] = dto.latitude;
      studentUpdates['personalInfo.address.coordinates.lng'] = dto.longitude;
    }
    if (dto.avatar !== undefined) studentUpdates['personalInfo.avatarUrl'] = dto.avatar;
    if (dto.socialLinks !== undefined) {
      for (const [key, value] of Object.entries(dto.socialLinks)) {
        studentUpdates[`personalInfo.socialLinks.${key}`] = value;
      }
    }
    if (dto.interests !== undefined) studentUpdates['professionalProfile.careerInterests'] = dto.interests;
    if (dto.skills !== undefined) {
      studentUpdates.skills = dto.skills.map((skill) => ({
        name: skill.name,
        category: skill.category || 'General',
        proficiency: skill.level ?? 50,
        source: 'self_assessed',
        verified: false,
      }));
    }
    if (dto.projects !== undefined) {
      studentUpdates.projects = dto.projects.map((project) => ({
        title: project.title,
        description: project.description || '',
        technologies: project.technologies || [],
        liveUrl: project.link || '',
      }));
    }
    if (dto.certifications !== undefined) {
      studentUpdates.certifications = dto.certifications.map((certification) => ({
        name: certification.name,
        issuer: certification.issuer || '',
        credentialId: certification.credentialId || '',
        issueDate: certification.date ? new Date(certification.date) : undefined,
      }));
    }
    if (dto.courses !== undefined) {
      studentUpdates.courses = dto.courses.map((course) => ({
        name: course.name,
        provider: course.provider || '',
        completionDate: course.completionDate ? new Date(course.completionDate) : undefined,
      }));
    }

    const updatedStudent = await this.studentModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: Object.fromEntries(Object.entries(studentUpdates).filter(([key]) => key !== '$unset')), ...(studentUpdates.$unset ? { $unset: studentUpdates.$unset } : {}) },
        { new: true },
      )
      .lean();

    const updatedUser = await this.userModel.findById(new Types.ObjectId(userId)).lean();

    if (!updatedStudent || !updatedUser) {
      throw new NotFoundException('Student profile not found');
    }

    this.logger.log(`Student profile updated: ${userId}`);
    const academicRelations = await this.loadAcademicRelations(updatedStudent as any);
    return this.serializeStudentProfile(updatedStudent as any, updatedUser as any, academicRelations);
  }

  async getRecommendedJobs(userId: string, query: any = {}): Promise<any> {
    const student = await this.studentModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }
    const studentObjectId = (student as any)._id;

    let matchResults = await this.matchResultModel
      .find({ student: studentObjectId })
      .sort({ overallScore: -1 })
      .limit(50)
      .lean();

    if (!matchResults.length) {
      matchResults = await this.refreshStudentRecommendations(student as any);
    }

    const jobIds = matchResults.map((mr: any) => mr.job).filter(Boolean);
    const applications = await this.applicationModel
      .find({ studentId: studentObjectId })
      .select('jobId')
      .lean();
    const appliedJobIds = new Set(applications.map((application: any) => String(application.jobId)));
    const eligibleJobIds = jobIds.filter((jobId: any) => !appliedJobIds.has(String(jobId)));
    const jobs = await this.jobModel.find({
      _id: { $in: eligibleJobIds },
      status: 'active',
      $or: [
        { 'applicationSettings.deadline': { $exists: false } },
        { 'applicationSettings.deadline': null },
        { 'applicationSettings.deadline': { $gte: new Date() } },
      ],
    }).lean();
    const jobMap = new Map(jobs.map((j: any) => [j._id.toString(), j]));
    const companyIds = Array.from(
      new Set(
        jobs
          .map((job: any) => job.companyId?.toString())
          .filter(Boolean),
      ),
    );
    const companies = companyIds.length
      ? await this.companyModel.find({ _id: { $in: companyIds.map((id) => new Types.ObjectId(id)) } }).lean()
      : [];
    const companyMap = new Map(companies.map((company: any) => [company._id.toString(), company]));

    let data = matchResults
      .map((mr: any) => {
        const job = jobMap.get(mr.job?.toString());
        if (!job) return null;
        const company = job.companyId ? companyMap.get(job.companyId.toString()) : null;
        const matchingSkills = this.toDisplayNames(mr.skillMatches);
        const missingSkills = this.toDisplayNames(mr.missingSkills);
        const requiredSkills = this.toDisplayNames(job.requirements?.requiredSkills);
        const preferredSkills = this.toDisplayNames(job.requirements?.preferredSkills);
        const strengthFactors = this.toDisplayNames(
          mr.factorBreakdown?.strengths
          || mr.recommendation?.strengths
          || mr.metadata?.strengthFactors
          || matchingSkills,
        );
        const weaknessFactors = this.toDisplayNames(
          mr.factorBreakdown?.weaknesses
          || mr.recommendation?.weaknesses
          || mr.metadata?.weaknessFactors
          || missingSkills,
        );

        return {
          id: job._id?.toString(),
          title: this.firstText(job.title, mr.metadata?.jobTitle),
          titleAr: this.firstText(job.titleAr, job.title),
          company: this.firstText(
            company?.profile?.name,
            mr.metadata?.companyName,
            job.companyName,
          ),
          companyName: this.firstText(
            company?.profile?.name,
            mr.metadata?.companyName,
            job.companyName,
          ),
          companyNameAr: this.firstText(
            company?.profile?.nameAr,
            company?.profile?.name,
            mr.metadata?.companyName,
            job.companyName,
          ),
          companyLogo: this.firstText(company?.profile?.logoUrl, mr.metadata?.companyLogo, job.companyLogo),
          companyIndustry: this.firstText(company?.profile?.industry, job.industry),
          location: this.formatJobLocation(job.location),
          locationType: this.firstText(job.location?.type, mr.metadata?.locationType),
          type: job.type,
          level: job.level,
          salaryMin: job.compensation?.salaryMin,
          salaryMax: job.compensation?.salaryMax,
          salaryCurrency: job.compensation?.currency || 'SAR',
          professionalDomain: this.firstText(job.category, mr.metadata?.category),
          academicDomain: this.firstText(job.requirements?.education?.fields?.[0], student.academicInfo?.departmentName),
          careerPath: this.firstText(job.subcategory, job.category, mr.metadata?.category),
          category: this.firstText(job.category, mr.metadata?.category),
          matchScore: Math.round(mr.overallScore || mr.scores?.overall || 0),
          acceptanceProbability: Math.round(mr.acceptanceProbability?.score || mr.metadata?.acceptanceProbability || 0),
          semanticSimilarity: Math.round(mr.semanticScore || mr.scores?.semantic || 0),
          strengthFactors,
          weaknessFactors,
          matchingSkills,
          matchedSkills: matchingSkills,
          missingSkills,
          requiredSkills,
          preferredSkills,
          recommendation: this.firstText(mr.recommendation?.reasoning, ...(mr.recommendations || [])),
          recommendationExplanation: this.firstText(mr.recommendation?.reasoning, ...(mr.recommendations || [])),
          postedDate: job.createdAt,
        };
      })
      .filter((job): job is NonNullable<typeof job> => job !== null);

    if (query.search) {
      const term = String(query.search).toLowerCase();
      data = data.filter((job: any) =>
        String(job.title || '').toLowerCase().includes(term)
        || String(job.company || '').toLowerCase().includes(term)
        || String(job.location || '').toLowerCase().includes(term),
      );
    }
    if (query.jobId) {
      data = data.filter((job: any) => String(job.id) === String(query.jobId));
    }
    if (query.type) {
      data = data.filter((job: any) => String(job.type || '').toLowerCase() === String(query.type).toLowerCase());
    }
    if (query.location) {
      const term = String(query.location).toLowerCase();
      data = data.filter((job: any) => String(job.location || '').toLowerCase().includes(term));
    }
    if (query.minScore !== undefined) {
      const minScore = Number(query.minScore) || 0;
      data = data.filter((job: any) => (job.matchScore ?? 0) >= minScore);
    }

    const sortBy = String(query.sortBy || 'match').toLowerCase();
    data.sort((a: any, b: any) => {
      if (sortBy === 'recent') {
        return new Date(b.postedDate || b.createdAt || 0).getTime() - new Date(a.postedDate || a.createdAt || 0).getTime();
      }
      if (sortBy === 'salary') {
        return (b.salaryMax || b.salary || 0) - (a.salaryMax || a.salary || 0);
      }
      return (b.matchScore || 0) - (a.matchScore || 0);
    });

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(query.limit, 10) || 10), 50);
    const total = data.length;
    const paged = data.slice((page - 1) * limit, page * limit);

    return {
      data: paged,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getSkillGaps(userId: string, query: any = {}): Promise<any> {
    const student = await this.studentModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }
    const studentObjectId = (student as any)._id;

    if (await this.skillGapModel.countDocuments({ student: studentObjectId }) === 0) {
      await this.refreshStudentRecommendations(student as any);
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(query.limit, 10) || 20), 50);
    const filter: any = { student: studentObjectId };
    if (query.search) {
      const term = String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { skillName: { $regex: term, $options: 'i' } },
        { 'metadata.category': { $regex: term, $options: 'i' } },
      ];
    }
    if (query.priority) filter.priority = String(query.priority).toLowerCase();

    const [skillGaps, total] = await Promise.all([
      this.skillGapModel.find(filter).sort({ overallGapScore: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.skillGapModel.countDocuments(filter),
    ]);

    const data = skillGaps.map((sg: any) => ({
      id: sg._id?.toString(),
      skill: sg.skillName,
      currentLevel: sg.currentLevel ?? 0,
      requiredLevel: sg.requiredLevel ?? 0,
      marketLevel: sg.requiredLevel ?? 0,
      studentLevel: sg.currentLevel ?? 0,
      gap: sg.gap ?? 0,
      priority: sg.priority,
      category: sg.metadata?.category || 'technical',
      recommendation: sg.metadata?.recommendation || '',
      learningResources: sg.learningResources || [],
      overallGapScore: sg.overallGapScore ?? 0,
    }));

    return {
      skillGaps: data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      readinessScore: (student as any).aiMetrics?.readinessScore ?? 0,
    };
  }

  async getApplications(userId: string, query: any = {}): Promise<any> {
    const student = await this.studentModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }
    const studentObjectId = (student as any)._id;

    const studentIds = [studentObjectId, new Types.ObjectId(userId)];
    let applications = await this.applicationModel
      .find({ studentId: { $in: studentIds } })
      .sort({ createdAt: -1 })
      .populate('jobId', 'title titleAr description location type level compensation applicationSettings')
      .populate('companyId', 'profile.name profile.logoUrl')
      .lean();

    if (query.status) {
      const requestedStatus = String(query.status).toLowerCase();
      applications = applications.filter((app: any) => this.toStudentApplicationStatus(app.status) === requestedStatus);
    }
    if (query.search) {
      const term = String(query.search).toLowerCase();
      applications = applications.filter((app: any) =>
        this.firstText((app.jobId as any)?.titleAr, (app.jobId as any)?.title, app.jobTitle, app.jobSnapshot?.title).toLowerCase().includes(term)
        || this.firstText((app.companyId as any)?.profile?.name, app.companyName, app.companySnapshot?.name).toLowerCase().includes(term),
      );
    }

    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(query.limit, 10) || 20), 50);
    const total = applications.length;
    const paged = applications.slice((page - 1) * limit, page * limit);

    const data = paged.map((app: any) => {
      const job = app.jobId as any;
      const company = app.companyId as any;
      const status = this.toStudentApplicationStatus(app.status);
      const statusHistory = (app.statusHistory || []).map((entry: any) => ({
        status: this.toStudentApplicationStatus(entry.status),
        rawStatus: entry.status,
        note: entry.note || '',
        noteAr: entry.noteAr || '',
        createdAt: entry.createdAt || app.createdAt,
      }));
      const completedStatuses = new Set(statusHistory.map((entry: any) => entry.status));
      completedStatuses.add('submitted');
      if (['in-review', 'interview', 'accepted', 'rejected'].includes(status)) completedStatuses.add('in-review');
      if (['interview', 'accepted'].includes(status)) completedStatuses.add('interview');
      if (status === 'accepted') completedStatuses.add('accepted');

      return {
        id: app._id?.toString(),
        jobId: job?._id?.toString?.() || String(app.jobId || ''),
        status,
        rawStatus: app.status,
        jobTitle: this.firstText(job?.title, app.jobTitle, app.jobSnapshot?.title, 'Job'),
        jobTitleAr: this.firstText(job?.titleAr, job?.title, app.jobTitle, app.jobSnapshot?.title, 'وظيفة'),
        companyName: this.firstText(company?.profile?.name, app.companyName, app.companySnapshot?.name, 'Company'),
        companyLogo: company?.profile?.logoUrl || null,
        location: this.formatJobLocation(job?.location),
        jobType: job?.type || null,
        matchScore: Number(app.matchSnapshot?.matchScore || 0),
        coverLetter: app.coverLetter || '',
        appliedDate: app.createdAt,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        statusHistory,
        timeline: [
          { stage: 'Submitted', completed: completedStatuses.has('submitted') },
          { stage: 'In Review', completed: completedStatuses.has('in-review') },
          { stage: 'Interview', completed: completedStatuses.has('interview') },
          { stage: 'Accepted', completed: completedStatuses.has('accepted') },
        ],
        interview: app.interview || null,
        rejectionReason: status === 'rejected' ? this.firstText(statusHistory[statusHistory.length - 1]?.noteAr, statusHistory[statusHistory.length - 1]?.note) : '',
      };
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  private toStudentApplicationStatus(status: any): string {
    const normalized = String(status || 'submitted').toLowerCase();
    if (['screening', 'under_review', 'shortlisted', 'offer_pending'].includes(normalized)) return 'in-review';
    if (['interview_scheduled', 'interviewed'].includes(normalized)) return 'interview';
    if (['offered', 'accepted', 'confirmed_employed'].includes(normalized)) return 'accepted';
    if (['rejected', 'withdrawn', 'expired'].includes(normalized)) return 'rejected';
    return 'submitted';
  }

  async getInsights(userId: string): Promise<any> {
    const [profile, student] = await Promise.all([
      this.findByUserId(userId),
      this.studentModel.findOne({ userId: new Types.ObjectId(userId) }).lean(),
    ]);

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const recommendedJobsResult = await this.getRecommendedJobs(userId);
    const skillGapResult = await this.getSkillGaps(userId);
    const recommendedJobs = recommendedJobsResult?.data || [];
    const skillGaps = skillGapResult?.skillGaps || [];

    const marketPeriodStart = new Date();
    marketPeriodStart.setUTCDate(1);
    marketPeriodStart.setUTCHours(0, 0, 0, 0);
    marketPeriodStart.setUTCMonth(marketPeriodStart.getUTCMonth() - 5);
    const marketPeriodEnd = new Date();
    const marketJobs = await this.jobModel
      .find({
        status: { $in: ['active', 'paused', 'closed', 'expired'] },
        createdAt: { $gte: marketPeriodStart, $lte: marketPeriodEnd },
      })
      .select('createdAt requirements.requiredSkills aiAnalysis.requiredSkills')
      .lean();

    const studentSkillNames = new Set(
      (profile.skills || []).map((skill: any) => this.normalizeSkillName(skill.name)).filter(Boolean),
    );
    const proficiencyValue: Record<string, number> = {
      beginner: 25,
      intermediate: 50,
      advanced: 75,
      expert: 100,
    };
    const getRequiredSkills = (job: any): any[] => {
      const analyzed = Array.isArray(job.aiAnalysis?.requiredSkills) ? job.aiAnalysis.requiredSkills : [];
      const declared = Array.isArray(job.requirements?.requiredSkills) ? job.requirements.requiredSkills : [];
      return declared.length ? declared : analyzed;
    };

    const requirementLevels = new Map<string, { name: string; levels: number[] }>();
    for (const requirement of marketJobs.flatMap((job: any) => getRequiredSkills(job))) {
      const name = this.firstText(requirement?.name, requirement);
      const key = this.normalizeSkillName(name);
      if (!key) continue;
      const rawLevel = requirement?.level;
      const level = typeof rawLevel === 'number'
        ? rawLevel
        : proficiencyValue[String(rawLevel || '').toLowerCase()] ?? 0;
      const entry = requirementLevels.get(key) || { name, levels: [] };
      if (level > 0) entry.levels.push(level);
      requirementLevels.set(key, entry);
    }

    const gapBySkill = new Map<string, any>();
    for (const gap of skillGaps) {
      const key = this.normalizeSkillName(gap.skill);
      if (!key) continue;
      const previous = gapBySkill.get(key);
      if (!previous || Number(gap.requiredLevel || 0) > Number(previous.requiredLevel || 0)) {
        gapBySkill.set(key, gap);
      }
    }

    const radarCandidates = new Map<string, { subject: string; yourSkills: number; marketDemand: number; fullMark: number }>();
    for (const skill of profile.skills || []) {
      const key = this.normalizeSkillName(skill.name);
      if (!key) continue;
      const relatedGap = gapBySkill.get(key);
      const observed = requirementLevels.get(key);
      const observedRequiredLevel = observed?.levels.length
        ? observed.levels.reduce((sum, level) => sum + level, 0) / observed.levels.length
        : 0;
      radarCandidates.set(key, {
        subject: skill.name,
        yourSkills: this.clampScore(skill.level),
        marketDemand: this.clampScore(relatedGap?.requiredLevel ?? observedRequiredLevel),
        fullMark: 100,
      });
    }
    for (const [key, gap] of gapBySkill) {
      const existing = radarCandidates.get(key);
      radarCandidates.set(key, {
        subject: existing?.subject || gap.skill,
        yourSkills: existing?.yourSkills ?? this.clampScore(gap.currentLevel),
        marketDemand: Math.max(existing?.marketDemand ?? 0, this.clampScore(gap.requiredLevel)),
        fullMark: 100,
      });
    }

    const radarSkills = [...radarCandidates.values()]
      .sort((left, right) => {
        const leftComparison = left.yourSkills > 0 && left.marketDemand > 0 ? 2 : left.marketDemand > 0 ? 1 : 0;
        const rightComparison = right.yourSkills > 0 && right.marketDemand > 0 ? 2 : right.marketDemand > 0 ? 1 : 0;
        return rightComparison - leftComparison
          || Math.abs(right.marketDemand - right.yourSkills) - Math.abs(left.marketDemand - left.yourSkills)
          || right.marketDemand - left.marketDemand;
      })
      .slice(0, 6);

    const careerPaths = recommendedJobs.slice(0, 5).map((job: any, index: number) => ({
      id: job.id,
      title: job.title,
      titleAr: job.titleAr || job.title,
      description: job.recommendation || `Strong alignment with your current profile for ${job.title}.`,
      descriptionAr: this.toArabicRecommendation(
        job.recommendation || `Strong alignment with your current profile for ${job.title}.`,
        job.titleAr || job.title,
      ),
      readiness: job.matchScore,
      skillsNeeded: this.toDisplayNames(job.missingSkills).slice(0, 4),
      rank: index + 1,
      professionalDomain: job.professionalDomain || job.category || '',
      academicDomain: job.academicDomain || '',
    }));

    const learningResources = skillGaps
      .flatMap((gap: any) => (gap.learningResources || [])
        .filter((resource: any) => this.isSafeLearningUrl(resource?.url))
        .map((resource: any, index: number) => ({
          id: `${gap.id}-${index}`,
          name: resource.title || resource.name || gap.skill,
          nameAr: resource.titleAr || resource.nameAr || resource.title || resource.name || gap.skill,
          provider: resource.provider || 'Learning Resource',
          type: resource.type || 'learning_resource',
          duration: resource.duration || '',
          level: resource.level || 'mixed',
          language: resource.language || 'en',
          isFree: typeof resource.isFree === 'boolean' ? resource.isFree : null,
          skills: [gap.skill],
          url: resource.url,
          reason: resource.reason || `Recommended to close the ${gap.skill} gap (${gap.currentLevel}% current versus ${gap.requiredLevel}% required).`,
          priority: resource.priority || gap.priority || 'medium',
          currentLevel: gap.currentLevel ?? 0,
          requiredLevel: gap.requiredLevel ?? 0,
          gap: gap.gap ?? Math.max(0, (gap.requiredLevel ?? 0) - (gap.currentLevel ?? 0)),
        })))
      .filter((resource: any, index: number, resources: any[]) => resources.findIndex((item: any) => item.url === resource.url && item.skills[0] === resource.skills[0]) === index)
      .slice(0, 12);

    const aiInsights = [
      {
        id: 'readiness',
        type: 'skill',
        title: `Readiness score: ${(student as any).aiMetrics?.readinessScore ?? 0}%`,
        titleAr: `درجة الجاهزية: ${(student as any).aiMetrics?.readinessScore ?? 0}%`,
        description: profile.profileCompletion < 100
          ? 'Complete the remaining profile fields to strengthen your recommendations.'
          : 'Your profile is complete and ready for matching.',
        descriptionAr: profile.profileCompletion < 100
          ? 'أكمل الحقول المتبقية في ملفك لتحسين دقة التوصيات.'
          : 'ملفك مكتمل وجاهز للمطابقة مع الفرص.',
      },
      {
        id: 'gaps',
        type: 'learning',
        title: `Top skill gaps: ${skillGaps.slice(0, 3).map((gap: any) => gap.skill).join(', ') || 'None'}`,
        titleAr: `أهم فجوات المهارات: ${skillGaps.slice(0, 3).map((gap: any) => gap.skill).join('، ') || 'لا توجد'}`,
        description: 'The system ranked these from your actual CV, profile, and live job requirements.',
        descriptionAr: 'رتب النظام هذه الفجوات اعتمادًا على سيرتك وملفك ومتطلبات الوظائف المنشورة.',
      },
    ];

    const marketTrendMap = new Map<string, { period: string; jobCount: number; relevantJobs: number; skillMentions: number }>();
    for (let offset = 0; offset < 6; offset += 1) {
      const date = new Date(Date.UTC(marketPeriodStart.getUTCFullYear(), marketPeriodStart.getUTCMonth() + offset, 1));
      const period = date.toISOString().slice(0, 7);
      marketTrendMap.set(period, { period, jobCount: 0, relevantJobs: 0, skillMentions: 0 });
    }
    marketJobs.forEach((job: any) => {
      const period = new Date(job.createdAt).toISOString().slice(0, 7);
      const bucket = marketTrendMap.get(period);
      if (!bucket) return;
      const requiredSkills = getRequiredSkills(job);
      const normalizedRequiredSkills = requiredSkills
        .map((skill: any) => this.normalizeSkillName(skill?.name ?? skill))
        .filter(Boolean);
      bucket.jobCount += 1;
      bucket.skillMentions += normalizedRequiredSkills.length;
      if (normalizedRequiredSkills.some((skill: string) => studentSkillNames.has(skill))) {
        bucket.relevantJobs += 1;
      }
    });
    const marketTrends = Array.from(marketTrendMap.values());

    return {
      profileCompletion: profile.profileCompletion,
      readinessScore: (student as any).aiMetrics?.readinessScore ?? 0,
      recommendationCount: recommendedJobs.length,
      topMatchScore: recommendedJobs[0]?.matchScore ?? 0,
      skillCount: profile.skills.length,
      projectCount: profile.projects.length,
      certificationCount: profile.certifications.length,
      courseCount: profile.courses.length,
      generatedAt: new Date().toISOString(),
      summaryTitle: recommendedJobs.length
        ? `Your profile currently aligns best with ${recommendedJobs[0].title} roles.`
        : 'Complete your CV and profile to unlock personalized insights.',
      summaryTitleAr: recommendedJobs.length
        ? `يتوافق ملفك حاليًا بصورة أفضل مع فرص ${recommendedJobs[0].titleAr || recommendedJobs[0].title}.`
        : 'أكمل سيرتك وملفك للحصول على توصيات مخصصة.',
      summaryDescription: recommendedJobs.length
        ? `Top recommendation score is ${recommendedJobs[0].matchScore}%. Focus on ${skillGaps.slice(0, 2).map((gap: any) => gap.skill).join(', ') || 'strengthening your current profile'} to improve further.`
        : 'Upload your CV and add skills, projects, and certifications so the AI engine can generate stronger recommendations.',
      summaryDescriptionAr: recommendedJobs.length
        ? `أعلى نسبة توصية هي ${recommendedJobs[0].matchScore}%. ركز على ${skillGaps.slice(0, 2).map((gap: any) => gap.skill).join('، ') || 'تعزيز بيانات ملفك'} لرفع فرصك.`
        : 'ارفع سيرتك وأضف المهارات والمشاريع والشهادات ليتمكن المحرك من إنشاء توصيات أدق.',
      radarSkills,
      skillGaps,
      marketTrends,
      marketSample: {
        jobCount: marketJobs.length,
        periodStart: marketPeriodStart.toISOString(),
        periodEnd: marketPeriodEnd.toISOString(),
        sufficientData: marketJobs.length >= 3,
      },
      careerPaths,
      learningResources,
      aiInsights,
    };
  }

  private isSafeLearningUrl(value: unknown): boolean {
    try {
      const url = new URL(String(value || ''));
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private toArabicRecommendation(value: string, title: string): string {
    if (/Excellent match/i.test(value)) return `توافق ممتاز مع مسار ${title}، ويوصى بالتقديم والاستعداد للمقابلة.`;
    if (/Strong match/i.test(value)) return `توافق قوي مع مسار ${title} مع الحاجة إلى معالجة فجوات المهارات الأساسية.`;
    if (/Good match/i.test(value)) return `توافق جيد مع مسار ${title}، ويمكن رفع فرص القبول باستكمال المهارات الناقصة.`;
    if (/Fair match/i.test(value)) return `توافق متوسط مع مسار ${title}، ويفضل تنفيذ خطة تطوير قبل التقديم المكثف.`;
    if (/Weak match/i.test(value)) return `التوافق الحالي مع مسار ${title} منخفض ويتطلب تطويرًا ملموسًا للمهارات والخبرة.`;
    if (/Evidence-based match score/i.test(value)) return `تم احتساب التوافق مع مسار ${title} من المهارات والخبرة والمشاريع والتشابه الدلالي.`;
    return `اقتُرح مسار ${title} بناءً على الوظائف المنشورة ومدى توافقها مع مهاراتك وخبراتك الحالية.`;
  }

  async getLearningPaths(userId: string): Promise<any> {
    const insights = await this.getInsights(userId);
    return {
      learningPaths: insights.careerPaths || [],
      resources: insights.learningResources || [],
      skillsToImprove: (insights.skillGaps || []).slice(0, 10),
    };
  }

  async getCareerDomains(userId: string): Promise<any> {
    const insights = await this.getInsights(userId);
    const domains = (insights.careerPaths || []).map((path: any) => ({
      id: path.id,
      name: path.title,
      matchScore: path.readiness ?? path.matchScore ?? 0,
      explanation: path.description || '',
      matchingSkills: path.skillsNeeded || [],
      category: this.categorizeCareerDomain(path.title || ''),
    }));

    return {
      domains,
      total: domains.length,
      topDomain: domains[0] || null,
    };
  }

  async getMarketIntelligence(userId: string): Promise<any> {
    const [skillDocs, insights] = await Promise.all([
      this.skillModel.find({ isActive: true }).sort({ 'marketData.demandScore': -1, popularityScore: -1 }).limit(20).lean(),
      this.getInsights(userId),
    ]);

    const topSkills = skillDocs.slice(0, 10).map((skill: any) => ({
      name: skill.name,
      category: skill.category,
      demandScore: skill.marketData?.demandScore ?? skill.popularityScore ?? 0,
      growthRate: skill.marketData?.growthRate ?? 0,
      trend: skill.marketData?.trend ?? 'stable',
      learningResources: skill.learningResources || [],
    }));

    return {
      topSkills,
      marketTrends: insights.marketTrends || [],
      hotDomains: (insights.careerPaths || []).map((path: any) => ({
        name: path.title,
        matchScore: path.readiness ?? 0,
      })),
    };
  }

  async getFutureSkills(userId: string): Promise<any> {
    const skillDocs = await this.skillModel
      .find({ isActive: true })
      .sort({ 'marketData.growthRate': -1, 'marketData.demandScore': -1 })
      .limit(12)
      .lean();

    return {
      predictedSkills: skillDocs.map((skill: any) => ({
        name: skill.name,
        category: skill.category,
        trend: skill.marketData?.trend || 'stable',
        growthRate: skill.marketData?.growthRate || 0,
        demandScore: skill.marketData?.demandScore || skill.popularityScore || 0,
        reason: this.buildFutureSkillReason(skill),
        learningResources: skill.learningResources || [],
      })),
    };
  }

  async refreshRecommendations(userId: string): Promise<any> {
    const student = await this.studentModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const refreshed = await this.refreshStudentRecommendations(student as any);
    const topRecommendation = refreshed[0] || null;

    return {
      refreshedAt: new Date(),
      recommendationsCount: refreshed.length,
      skillGapCount: await this.skillGapModel.countDocuments({ student: (student as any)._id }),
      topRecommendation: topRecommendation
        ? {
            jobId: topRecommendation.job?.toString(),
            title: topRecommendation.metadata?.jobTitle || '',
            matchScore: topRecommendation.overallScore || topRecommendation.scores?.overall || 0,
            explanation: topRecommendation.recommendation?.reasoning || '',
          }
        : null,
    };
  }

  async getNotifications(userId: string, query: any = {}): Promise<any> {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(query.limit, 10) || 20), 50);
    const skip = (page - 1) * limit;
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query.type) filter.type = query.type;
    if (query.read !== undefined) filter.read = query.read === 'true' || query.read === true;

    const [data, total] = await Promise.all([
      this.notificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.notificationModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async handleCvUpload(userId: string, cvUrl: string): Promise<Student> {
    const student = await this.studentModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: { cvUrl } },
        { new: true },
      )
      .lean();

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    this.logger.log(`CV uploaded for student: ${userId}`);
    return student as Student;
  }

  async handleCvUploadWithParsing(
    userId: string,
    file: Express.Multer.File,
    options: { cleanupOnFailure?: boolean; contentHash?: string } = {},
  ): Promise<any> {
    const cvUrl = `/uploads/cvs/${file.filename}`;
    const contentHash = options.contentHash
      || createHash('sha256').update(await (await import('fs/promises')).readFile(file.path)).digest('hex');
    const previousStudent = await this.studentModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .select('cvData.fileUrl cvData.contentHash')
      .lean();
    if (!previousStudent) throw new NotFoundException('Student profile not found');
    const previousCvUrl = String((previousStudent as any).cvData?.fileUrl || '');
    if ((previousStudent as any).cvData?.contentHash === contentHash) {
      if (options.cleanupOnFailure !== false && file.path) {
        await unlink(file.path).catch(() => undefined);
      }
      throw new ConflictException({
        code: 'CV_DUPLICATE_FILE',
        message: 'This CV file is already uploaded',
      });
    }
    let replacementCommitted = false;

    try {
      const fs = await import('fs');
      const FormData = (await import('form-data')).default;
      const axios = (await import('axios')).default;

      const form = new FormData();
      form.append('file', fs.createReadStream(file.path), {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
      const configuredTimeout = Number(process.env.AI_REQUEST_TIMEOUT);
      const aiRequestTimeout = Number.isFinite(configuredTimeout)
        ? Math.max(30000, configuredTimeout)
        : 90000;
      const aiResponse = await axios.post(
        `${aiServiceUrl}/api/ai/cv/parse`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Accept: 'application/json',
          },
          timeout: aiRequestTimeout,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      );

      const parsedData = aiResponse.data;
      const [student, user] = await Promise.all([
        this.studentModel.findOne({ userId: new Types.ObjectId(userId) }),
        this.userModel.findById(new Types.ObjectId(userId)).lean(),
      ]);

      if (!student || !user) {
        throw new NotFoundException('Student profile not found');
      }

      const mappedSkills = await this.mapParsedSkillsToStudentSkills(parsedData.skills || [], student.skills || []);
      const mappedProjects = this.mergeProjects(student.projects || [], parsedData.projects || []);
      const mappedCertifications = this.mergeCertifications(student.certifications || [], parsedData.certifications || []);
      const mappedExperiences = this.mergeExperiences(student.experiences || [], parsedData.experience || []);
      const mappedCourses = this.mergeCourses(student.courses || [], parsedData.courses || []);
      const parsedPersonalInfo = parsedData.personalInfo || {};
      const parsedName = this.firstText(parsedPersonalInfo.name);
      const parsedNameParts = parsedName.split(/\s+/).filter(Boolean);
      const inferredFirstName = parsedNameParts[0] || '';
      const inferredLastName = parsedNameParts.slice(1).join(' ');
      const userUpdates: any = {};
      if (inferredFirstName) userUpdates.firstName = inferredFirstName;
      if (inferredLastName) userUpdates.lastName = inferredLastName;
      if (parsedPersonalInfo.phone) userUpdates.phone = parsedPersonalInfo.phone;
      if (!user.avatar && parsedPersonalInfo.profileImage) userUpdates.avatar = parsedPersonalInfo.profileImage;
      if (Object.keys(userUpdates).length > 0) {
        await this.userModel.findByIdAndUpdate(user._id, { $set: userUpdates });
      }

      const personalInfoUpdates: any = {};
      if (inferredFirstName) personalInfoUpdates['personalInfo.firstName'] = inferredFirstName;
      if (inferredLastName) personalInfoUpdates['personalInfo.lastName'] = inferredLastName;
      if (parsedPersonalInfo.phone) personalInfoUpdates['personalInfo.phone'] = parsedPersonalInfo.phone;
      if (parsedPersonalInfo.whatsapp) personalInfoUpdates['personalInfo.whatsapp'] = parsedPersonalInfo.whatsapp;
      if (parsedPersonalInfo.city) personalInfoUpdates['personalInfo.address.city'] = parsedPersonalInfo.city;
      if (parsedPersonalInfo.country) personalInfoUpdates['personalInfo.address.country'] = parsedPersonalInfo.country;
      const extractedAddress = this.firstText(parsedPersonalInfo.address, parsedPersonalInfo.location);
      if (extractedAddress) personalInfoUpdates['personalInfo.address.formattedAddress'] = extractedAddress;
      if (parsedData.languages?.length) {
        personalInfoUpdates['personalInfo.languages'] = parsedData.languages;
      }
      if (parsedData.summary) personalInfoUpdates['personalInfo.bio'] = parsedData.summary;
      const extractedSocialLinks = {
        linkedin: this.firstText(parsedPersonalInfo.linkedin, parsedPersonalInfo.linkedIn),
        github: this.firstText(parsedPersonalInfo.github),
        portfolio: this.firstText(parsedPersonalInfo.portfolio),
        website: this.firstText(parsedPersonalInfo.website),
        facebook: this.firstText(parsedPersonalInfo.facebook),
        twitter: this.firstText(parsedPersonalInfo.twitter, parsedPersonalInfo.x),
        instagram: this.firstText(parsedPersonalInfo.instagram),
        youtube: this.firstText(parsedPersonalInfo.youtube),
        behance: this.firstText(parsedPersonalInfo.behance),
        dribbble: this.firstText(parsedPersonalInfo.dribbble),
        stackOverflow: this.firstText(parsedPersonalInfo.stackOverflow),
        researchGate: this.firstText(parsedPersonalInfo.researchGate),
        orcid: this.firstText(parsedPersonalInfo.orcid),
      };
      for (const [key, value] of Object.entries(extractedSocialLinks)) {
        if (value) {
          personalInfoUpdates[`personalInfo.socialLinks.${key}`] = value;
        }
      }
      if (parsedPersonalInfo.professionalTitle) {
        personalInfoUpdates['professionalProfile.headline'] = parsedPersonalInfo.professionalTitle;
      }
      const embedding = this.ensureEmbeddingVector(parsedData.embedding);
      const readinessMetrics = this.calculateReadinessMetrics({
        student,
        user,
        parsedData,
        mappedSkills,
        mappedProjects,
        mappedCertifications,
        mappedExperiences,
      });

      const updatedStudent = await this.studentModel
        .findOneAndUpdate(
          { userId: new Types.ObjectId(userId) },
          {
            $set: {
              ...personalInfoUpdates,
              'cvData.fileUrl': cvUrl,
              'cvData.fileName': file.originalname,
              'cvData.fileSize': file.size,
              'cvData.fileType': extname(file.originalname),
              'cvData.contentHash': contentHash,
              'cvData.uploadedAt': new Date(),
              skills: mappedSkills,
              projects: mappedProjects,
              certifications: mappedCertifications,
              experiences: mappedExperiences,
              courses: mappedCourses,
              'cvData.parsedData': {
                rawText: '',
                rawTextHash: createHash('sha256').update(String(parsedData.raw_text || '')).digest('hex'),
                personalInfo: parsedPersonalInfo,
                extractedSkills: this.toDisplayNames(parsedData.skills || []),
                extractedSoftSkills: this.toDisplayNames(parsedData.softSkills || []),
                extractedTools: this.toDisplayNames(parsedData.tools || []),
                extractedExperience: this.stringifyCvEntries(parsedData.experience || []),
                extractedEducation: this.stringifyCvEntries(parsedData.education || []),
                extractedProjects: this.stringifyCvEntries(parsedData.projects || []),
                extractedCertifications: this.stringifyCvEntries(parsedData.certifications || []),
                extractedCourses: this.stringifyCvEntries(parsedData.courses || []),
                extractedLanguages: this.toDisplayNames(parsedData.languages || []),
                extractedVolunteerWork: this.stringifyCvEntries(parsedData.volunteerWork || []),
                extractedAwards: this.stringifyCvEntries(parsedData.awards || []),
                extractedAchievements: this.stringifyCvEntries(parsedData.achievements || []),
                extractedPublications: this.stringifyCvEntries(parsedData.publications || []),
                references: this.toDisplayNames(parsedData.references || []),
                additionalSections: parsedData.additionalSections || {},
                parsingConfidence: parsedData.confidence || 0,
              },
              'cvData.aiAnalysis': {
                summary: parsedData.summary || '',
                strengths: parsedData.strengths || [],
                weaknesses: parsedData.weaknesses || [],
                suggestedImprovements: parsedData.suggestions || [],
                analyzedAt: new Date(),
              },
              'embeddings.combinedVector': embedding,
              'embeddings.skillVector': embedding,
              'embeddings.lastUpdated': new Date(),
              aiMetrics: readinessMetrics,
            },
          },
          { new: true },
        )
        .lean();

      if (!updatedStudent) throw new NotFoundException('Student profile not found');
      replacementCommitted = true;

      if (updatedStudent && embedding.length) {
        try {
          await this.aiEmbeddingModel.findOneAndUpdate(
            {
              entityType: 'student',
              entityId: (updatedStudent as any)._id,
              model: parsedData.embeddingModel || process.env.EMBEDDING_MODEL || 'all-MiniLM-L6-v2',
              modelVersion: parsedData.embeddingModelVersion || '1',
              textHash: parsedData.textHash || createHash('sha256').update(String(parsedData.raw_text || '')).digest('hex'),
            },
            { $set: {
              vector: embedding,
              dimension: embedding.length,
              metadata: { userId, source: 'cv', cvFileName: file.originalname },
            } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );
        } catch (error: any) {
          this.logger.warn(`CV replacement completed, but embedding storage failed for ${userId}: ${error?.message || error}`);
        }
      }

      try {
        await this.refreshStudentRecommendations(updatedStudent as any);
      } catch (error: any) {
        this.logger.warn(`CV was analyzed, but recommendations could not be refreshed for ${userId}: ${error?.message || error}`);
      }

      if (previousCvUrl.startsWith('/uploads/cvs/') && previousCvUrl !== cvUrl) {
        const previousCvPath = join(process.cwd(), 'uploads', 'cvs', basename(previousCvUrl));
        await unlink(previousCvPath).catch(() => undefined);
      }

      return {
        cvUrl,
        parsedData: updatedStudent?.cvData?.parsedData,
        aiAnalysis: updatedStudent?.cvData?.aiAnalysis,
        readinessScore: updatedStudent?.aiMetrics?.readinessScore || 0,
      };
    } catch (error: any) {
      this.logger.error(`CV parsing failed for user ${userId}: ${error?.message || 'unknown error'}`);
      if (!replacementCommitted && options.cleanupOnFailure !== false && file.path) {
        await unlink(file.path).catch(() => undefined);
      }
      if (error instanceof NotFoundException || error instanceof ConflictException) throw error;
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        throw new UnprocessableEntityException({ code: 'CV_ANALYSIS_FAILED', message: error.response?.data?.detail || 'CV content could not be analyzed' });
      }
      throw new ServiceUnavailableException({ code: 'AI_SERVICE_UNAVAILABLE', message: 'CV analysis service is unavailable' });
    }
  }

  private serializeStudentProfile(student: any, user: any, relations: any = {}) {
    const profileCompletion = this.calculateProfileCompletion(student, user);
    const firstName = user.firstName || student.personalInfo?.firstName || '';
    const lastName = user.lastName || student.personalInfo?.lastName || '';

    return {
      id: student._id?.toString(),
      userId: user._id?.toString(),
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: user.email,
      phone: user.phone || student.personalInfo?.phone || '',
      whatsapp: student.personalInfo?.whatsapp || this.firstText(student.cvData?.parsedData?.personalInfo?.whatsapp),
      socialLinks: {
        linkedin: student.personalInfo?.socialLinks?.linkedin || this.firstText(student.cvData?.parsedData?.personalInfo?.linkedin, student.cvData?.parsedData?.personalInfo?.linkedIn),
        github: student.personalInfo?.socialLinks?.github || this.firstText(student.cvData?.parsedData?.personalInfo?.github),
        portfolio: student.personalInfo?.socialLinks?.portfolio || this.firstText(student.cvData?.parsedData?.personalInfo?.portfolio),
        website: student.personalInfo?.socialLinks?.website || this.firstText(student.cvData?.parsedData?.personalInfo?.website),
        facebook: student.personalInfo?.socialLinks?.facebook || this.firstText(student.cvData?.parsedData?.personalInfo?.facebook),
        twitter: student.personalInfo?.socialLinks?.twitter || this.firstText(student.cvData?.parsedData?.personalInfo?.twitter, student.cvData?.parsedData?.personalInfo?.x),
        instagram: student.personalInfo?.socialLinks?.instagram || this.firstText(student.cvData?.parsedData?.personalInfo?.instagram),
        youtube: student.personalInfo?.socialLinks?.youtube || this.firstText(student.cvData?.parsedData?.personalInfo?.youtube),
        behance: student.personalInfo?.socialLinks?.behance || this.firstText(student.cvData?.parsedData?.personalInfo?.behance),
        dribbble: student.personalInfo?.socialLinks?.dribbble || this.firstText(student.cvData?.parsedData?.personalInfo?.dribbble),
        stackOverflow: student.personalInfo?.socialLinks?.stackOverflow || this.firstText(student.cvData?.parsedData?.personalInfo?.stackOverflow),
        researchGate: student.personalInfo?.socialLinks?.researchGate || this.firstText(student.cvData?.parsedData?.personalInfo?.researchGate),
        orcid: student.personalInfo?.socialLinks?.orcid || this.firstText(student.cvData?.parsedData?.personalInfo?.orcid),
      },
      avatar: user.avatar || student.personalInfo?.avatarUrl || '',
      coverImage: student.personalInfo?.coverImageUrl || '',
      professionalTitle: student.professionalProfile?.headline || '',
      address: student.personalInfo?.address?.formattedAddress || '',
      location: student.personalInfo?.address?.formattedAddress || [student.personalInfo?.address?.city, student.personalInfo?.address?.country].filter(Boolean).join(', '),
      coordinates: Number.isFinite(student.personalInfo?.address?.coordinates?.lat) && Number.isFinite(student.personalInfo?.address?.coordinates?.lng) ? {
        lat: student.personalInfo.address.coordinates.lat,
        lng: student.personalInfo.address.coordinates.lng,
      } : null,
      university: relations.university?.name || student.academicInfo?.universityName || '',
      universityAr: relations.university?.nameAr || '',
      college: relations.college?.name || student.academicInfo?.collegeName || '',
      collegeAr: relations.college?.nameAr || '',
      department: relations.department?.name || student.academicInfo?.departmentName || '',
      departmentAr: relations.department?.nameAr || '',
      major: relations.major?.nameAr || relations.major?.nameEn || student.academicInfo?.majorName || '',
      universityInfo: relations.university ? {
        id: String(relations.university._id),
        name: relations.university.name || '',
        nameAr: relations.university.nameAr || '',
        nameEn: relations.university.nameEn || relations.university.name || '',
        logoUrl: relations.university.logoUrl || relations.university.branding?.logoUrl || null,
        governorate: relations.university.governorate || relations.university.location?.city || '',
      } : null,
      collegeInfo: relations.college ? {
        id: String(relations.college._id),
        name: relations.college.name || '',
        nameAr: relations.college.nameAr || '',
      } : null,
      departmentInfo: relations.department ? {
        id: String(relations.department._id),
        name: relations.department.name || '',
        nameAr: relations.department.nameAr || '',
      } : null,
      majorInfo: relations.major ? {
        id: String(relations.major._id),
        name: relations.major.nameAr || relations.major.nameEn || '',
        nameAr: relations.major.nameAr || '',
        nameEn: relations.major.nameEn || '',
      } : null,
      academicAffiliationNeedsUpdate: Boolean(student.academicInfo?.requiresAcademicUpdate),
      academicLevel: student.academicInfo?.academicLevel || '',
      academicStanding: student.academicInfo?.academicStanding || '',
      gpa: student.academicInfo?.gpa,
      graduationYear: student.academicInfo?.expectedGraduation,
      profileCompletion,
      aiMetrics: student.aiMetrics || {},
      skills: (student.skills || []).map((skill: any) => ({
        name: skill.name,
        level: skill.proficiency ?? 50,
        category: skill.category || 'General',
      })),
      interests: student.professionalProfile?.careerInterests || [],
      projects: (student.projects || []).map((project: any) => ({
        title: project.title,
        description: project.description || '',
        technologies: project.technologies || [],
        link: project.liveUrl || project.githubUrl || '',
      })),
      certifications: (student.certifications || []).map((certification: any) => ({
        name: certification.name,
        issuer: certification.issuer || '',
        date: certification.issueDate ? new Date(certification.issueDate).toISOString() : '',
        credentialId: certification.credentialId || '',
      })),
      courses: (student.courses || []).map((course: any) => ({
        name: course.name,
        provider: course.provider || '',
        completionDate: course.completionDate ? new Date(course.completionDate).toISOString() : '',
      })),
      experiences: (student.experiences || []).map((experience: any) => ({
        title: experience.title,
        company: experience.company || '',
        description: experience.description || '',
        years: experience.years || 0,
      })),
      cvData: student.cvData,
    };
  }

  private async loadAcademicRelations(student: any) {
    const universityId = student?.academicInfo?.universityId;
    const collegeId = student?.academicInfo?.collegeId;
    const departmentId = student?.academicInfo?.departmentId;
    const majorId = student?.academicInfo?.majorId;
    const [university, college, department, major] = await Promise.all([
      universityId && Types.ObjectId.isValid(String(universityId))
        ? this.universityModel.findById(universityId).select('name nameAr nameEn logoUrl branding governorate location').lean()
        : null,
      collegeId && Types.ObjectId.isValid(String(collegeId))
        ? this.collegeModel.findById(collegeId).select('name nameAr').lean()
        : null,
      departmentId && Types.ObjectId.isValid(String(departmentId))
        ? this.departmentModel.findById(departmentId).select('name nameAr').lean()
        : null,
      majorId && Types.ObjectId.isValid(String(majorId))
        ? this.programModel.findById(majorId).select('nameAr nameEn code degreeType').lean()
        : null,
    ]);
    return { university, college, department, major };
  }

  private async validateAcademicSelection(dto: Pick<UpdateStudentDto, 'universityId' | 'collegeId' | 'departmentId' | 'majorId'>) {
    if (!dto.universityId || !dto.collegeId || !dto.departmentId) throw new UnprocessableEntityException({ code: 'ACADEMIC_SELECTION_INCOMPLETE', message: 'University, college, and department are required together' });
    const universityId = new Types.ObjectId(dto.universityId);
    const collegeId = new Types.ObjectId(dto.collegeId);
    const departmentId = new Types.ObjectId(dto.departmentId);
    const university: any = await this.universityModel.findOne({ _id: universityId, status: 'active', isActive: true, deletedAt: { $exists: false } }).lean();
    if (!university) throw new UnprocessableEntityException({ code: 'UNIVERSITY_NOT_AVAILABLE', message: 'Selected university is unavailable' });
    const college: any = await this.collegeModel.findOne({ _id: collegeId, universityId, isActive: true, deletedAt: { $exists: false }, 'metadata.status': { $nin: ['archived', 'deleted'] } }).lean();
    if (!college) throw new UnprocessableEntityException({ code: 'COLLEGE_NOT_AVAILABLE', message: 'Selected college does not belong to the university' });
    const department: any = await this.departmentModel.findOne({ _id: departmentId, universityId, collegeId, isActive: true, deletedAt: { $exists: false }, 'metadata.status': { $nin: ['archived', 'deleted'] } }).lean();
    if (!department) throw new UnprocessableEntityException({ code: 'DEPARTMENT_NOT_AVAILABLE', message: 'Selected department does not belong to the college' });
    const major: any = dto.majorId ? await this.programModel.findOne({ _id: new Types.ObjectId(dto.majorId), universityId, collegeId, departmentId, isActive: true, deletedAt: { $exists: false } }).lean() : null;
    if (dto.majorId && !major) throw new UnprocessableEntityException({ code: 'MAJOR_NOT_AVAILABLE', message: 'Selected major does not belong to the department' });
    return { university, college, department, major };
  }

  private detectImageExtension(
    buffer: Buffer,
    mimetype: string,
    errorCode = 'INVALID_AVATAR_CONTENT',
  ): 'jpg' | 'png' | 'webp' {
    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp = buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    if (mimetype === 'image/jpeg' && isJpeg) return 'jpg';
    if (mimetype === 'image/png' && isPng) return 'png';
    if (mimetype === 'image/webp' && isWebp) return 'webp';
    throw new UnsupportedMediaTypeException({
      code: errorCode,
      message: 'The selected file is not a valid JPEG, PNG, or WebP image',
    });
  }

  private calculateProfileCompletion(student: any, user: any): number {
    const checks = [
      Boolean(user?.firstName),
      Boolean(user?.lastName),
      Boolean(user?.email),
      Boolean(user?.phone),
      Boolean(student?.academicInfo?.universityName),
      Boolean(student?.academicInfo?.collegeName),
      Boolean(student?.academicInfo?.departmentName),
      Boolean(student?.academicInfo?.academicLevel),
      Array.isArray(student?.skills) && student.skills.length > 0,
      Boolean(student?.cvData?.fileUrl),
      Array.isArray(student?.projects) && student.projects.length > 0,
      Array.isArray(student?.experiences) && student.experiences.length > 0,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  private async refreshStudentRecommendations(student: any): Promise<any[]> {
    const applications = await this.applicationModel.find({ studentId: student._id }).select('jobId').lean();
    const appliedJobIds = applications.map((application: any) => application.jobId).filter(Boolean);
    const jobs = await this.jobModel.find({
      _id: { $nin: appliedJobIds },
      status: 'active',
      $or: [
        { 'applicationSettings.deadline': { $exists: false } },
        { 'applicationSettings.deadline': null },
        { 'applicationSettings.deadline': { $gte: new Date() } },
      ],
    }).limit(50).lean();
    if (!jobs.length) {
      return [];
    }
    const companyIds = Array.from(
      new Set(jobs.map((job: any) => job.companyId?.toString()).filter(Boolean)),
    );
    const companies = companyIds.length
      ? await this.companyModel.find({ _id: { $in: companyIds.map((id) => new Types.ObjectId(id)) } }).lean()
      : [];
    const companyMap = new Map(companies.map((company: any) => [company._id.toString(), company]));

    const studentEmbedding = await this.ensureStudentEmbedding(student);
    const jobsForAi = await Promise.all(
      jobs.map(async (job: any) => {
        const company = job.companyId ? companyMap.get(job.companyId.toString()) : null;
        return {
          jobId: job._id.toString(),
          title: job.title,
          company: this.firstText(company?.profile?.name, job.companyName),
          embedding: await this.ensureJobEmbedding(job),
          requiredSkills: this.extractJobSkills(job).map((skill: any) => ({
            name: skill.name,
            weight: this.normalizeJobSkillWeight(skill.weight),
            required: true,
            requiredLevel: this.normalizeStudentSkillLevel(skill.level || 80),
          })),
          experienceRequired: job.requirements?.experience?.minYears || 0,
          location: this.formatJobLocation(job.location),
          jobType: job.type,
        };
      }),
    );

    const recommendationsResponse = await this.postToAi('/api/ai/recommendations/jobs', {
      studentId: student._id.toString(),
      studentEmbedding,
      studentSkills: (student.skills || []).map((skill: any) => ({
        name: skill.name,
        level: this.normalizeStudentSkillLevel(skill.proficiency),
      })),
      studentExperienceYears: this.calculateStudentExperienceYears(student.experiences || []),
      studentProjects: (student.projects || []).map((project: any) => project.title || project.description || '').filter(Boolean),
      jobs: jobsForAi,
      limit: 20,
      minScore: 0,
    });

    const recommendations = recommendationsResponse?.recommendations || [];

    await this.matchResultModel.deleteMany({ student: student._id });
    await this.skillGapModel.deleteMany({ student: student._id });

    for (const recommendation of recommendations) {
      const job = jobs.find((item: any) => item._id.toString() === recommendation.jobId);
      if (!job) continue;
      const company = job.companyId ? companyMap.get(job.companyId.toString()) : null;
      const fallbackMissingSkills = this.calculateFallbackMissingSkills(student.skills || [], job);
      const missingSkills = (recommendation.missingSkills || []).length
        ? recommendation.missingSkills
        : fallbackMissingSkills;
      const matchingSkills = (recommendation.matchingSkills || []).length
        ? recommendation.matchingSkills
        : this.extractMatchingSkills(student.skills || [], job);

      await this.matchResultModel.create({
        student: student._id,
        job: job._id,
        company: job.companyId,
        overallScore: recommendation.matchScore,
        skillScore: recommendation.breakdown?.skillsMatch?.score || 0,
        experienceScore: recommendation.breakdown?.experienceMatch?.score || 0,
        semanticScore: recommendation.semanticSimilarity || recommendation.breakdown?.semanticMatch?.score || 0,
        factorBreakdown: recommendation.breakdown || {},
        skillMatches: matchingSkills.map((skillName: string) => ({ name: skillName })),
        missingSkills: missingSkills.map((skillName: string) => ({ name: skillName })),
        recommendations: recommendation.recommendation ? [recommendation.recommendation] : [],
        recommendation: {
          reasoning: recommendation.explanation?.summary || recommendation.recommendation || '',
          actions: recommendation.explanation?.improvementActions || missingSkills,
          strengths: recommendation.explanation?.strengths || recommendation.matchReasons || [],
          weaknesses: recommendation.explanation?.weaknesses || recommendation.riskFactors || [],
        },
        acceptanceProbability: recommendation.acceptanceProbability || { score: 0, method: 'insufficient_data' },
        mandatorySkillsPenalty: recommendation.breakdown?.mandatorySkillsPenalty || 0,
        modelVersion: recommendation.modelVersion || null,
        scores: {
          overall: recommendation.matchScore || 0,
          skill: recommendation.breakdown?.skillsMatch?.score || 0,
          experience: recommendation.breakdown?.experienceMatch?.score || 0,
          education: recommendation.breakdown?.educationMatch?.score || 0,
          semantic: recommendation.semanticSimilarity || recommendation.breakdown?.semanticMatch?.score || 0,
        },
        metadata: {
          companyName: this.firstText(company?.profile?.name, recommendation.company, (job as any).companyName),
          companyLogo: this.firstText(company?.profile?.logoUrl, (job as any).companyLogo),
          jobTitle: job.title,
          location: recommendation.location,
          jobType: recommendation.jobType,
          category: job.category,
          professionalDomain: job.category,
          academicDomain: job.requirements?.education?.fields?.[0] || student.academicInfo?.departmentName,
          careerPath: job.subcategory || job.category,
        },
        calculatedAt: new Date(),
      });

      for (const missingSkillName of missingSkills) {
        const existingStudentSkill = (student.skills || []).find(
          (skill: any) => this.normalizeSkillName(skill.name) === this.normalizeSkillName(missingSkillName),
        );
        const skillDoc = await this.skillModel.findOne({ normalizedName: this.normalizeSkillName(missingSkillName) }).lean();
        const aiSkillDetail = (recommendation.missingSkillDetails || []).find(
          (detail: any) => this.normalizeSkillName(detail.name) === this.normalizeSkillName(missingSkillName),
        );

        await this.skillGapModel.create({
          student: student._id,
          skillName: missingSkillName,
          currentLevel: existingStudentSkill?.proficiency || 0,
          requiredLevel: 80,
          gap: Math.max(0, 80 - (existingStudentSkill?.proficiency || 0)),
          priority: this.deriveGapPriority(80 - (existingStudentSkill?.proficiency || 0)),
          learningResources: (skillDoc?.learningResources || []).length
            ? skillDoc?.learningResources
            : (aiSkillDetail?.learningResources || []),
          marketData: skillDoc?.marketData || {},
          overallGapScore: Math.max(0, 80 - (existingStudentSkill?.proficiency || 0)),
          missingSkills: [{ name: missingSkillName, importance: 80, gap: Math.max(0, 80 - (existingStudentSkill?.proficiency || 0)) }],
          metadata: {
            category: skillDoc?.category || 'technical',
            recommendation: recommendation.recommendation || '',
            jobId: recommendation.jobId,
            jobTitle: recommendation.title,
          },
        });
      }
    }

    if (recommendations.length > 0) {
      const topRecommendation = recommendations[0];
      await this.notificationModel.create({
        userId: student.userId,
        type: 'match',
        title: 'New recommendation generated',
        titleAr: 'تم إنشاء توصية جديدة',
        message: `Your top match is ${topRecommendation.title} with a score of ${topRecommendation.matchScore}%.`,
        messageAr: `أعلى تطابق لديك هو ${topRecommendation.title} بنسبة ${topRecommendation.matchScore}%.`,
        actionUrl: `/student/recommendations?jobId=${encodeURIComponent(String(topRecommendation.jobId))}`,
        data: {
          topJobId: topRecommendation.jobId,
          score: topRecommendation.matchScore,
        },
        read: false,
      });
    }

    return this.matchResultModel.find({ student: student._id }).sort({ overallScore: -1 }).lean();
  }

  private async ensureStudentEmbedding(student: any): Promise<number[]> {
    const existing = this.ensureEmbeddingVector(student?.embeddings?.combinedVector);
    if (existing.length) {
      return existing;
    }

    const text = this.buildStudentProfileText(student);
    const embedding = await this.generateEmbedding(text);
    await this.studentModel.updateOne(
      { _id: student._id },
      {
        $set: {
          'embeddings.combinedVector': embedding,
          'embeddings.skillVector': embedding,
          'embeddings.lastUpdated': new Date(),
        },
      },
    );
    return embedding;
  }

  private async ensureJobEmbedding(job: any): Promise<number[]> {
    const existing = this.ensureEmbeddingVector(job?.aiAnalysis?.skillVector);
    if (existing.length) {
      return existing;
    }

    const embedding = await this.generateEmbedding(this.buildJobText(job));
    await this.jobModel.updateOne(
      { _id: job._id },
      {
        $set: {
          'aiAnalysis.skillVector': embedding,
          'aiAnalysis.lastUpdated': new Date(),
          'aiAnalysis.version': 'madar-ai',
        },
      },
    );
    return embedding;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.postToAi('/api/ai/skills/embed', { text });
    return this.ensureEmbeddingVector(response?.embedding);
  }

  private async postToAi(path: string, payload: any): Promise<any> {
    const axios = (await import('axios')).default;
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const response = await axios.post(`${aiServiceUrl}${path}`, payload, { timeout: 45000 });
    return response.data;
  }

  private async mapParsedSkillsToStudentSkills(parsedSkills: any[], existingSkills: any[]): Promise<any[]> {
    const merged = new Map<string, any>();

    for (const skill of existingSkills || []) {
      if (skill.source === 'cv_parsed') continue;
      const normalized = this.normalizeSkillName(skill.name);
      if (!normalized) continue;
      merged.set(normalized, skill.toObject ? skill.toObject() : { ...skill });
    }

    for (const skill of parsedSkills || []) {
      const name = typeof skill === 'string' ? skill : skill.name;
      const normalized = this.normalizeSkillName(name);
      if (!normalized) continue;

      const skillDoc = await this.skillModel.findOneAndUpdate(
        { normalizedName: normalized },
        {
          $setOnInsert: {
            name,
            normalizedName: normalized,
            category: this.inferSkillCategory(skill),
            aliases: [],
            isActive: true,
          },
        },
        { new: true, upsert: true },
      ).lean();

      const proficiency = this.inferSkillProficiency(skill);
      const existing = merged.get(normalized);

      merged.set(normalized, {
        skillId: skillDoc?._id || existing?.skillId,
        name,
        category: skillDoc?.category || existing?.category || this.inferSkillCategory(skill),
        proficiency: Math.max(existing?.proficiency || 0, proficiency),
        source: 'cv_parsed',
        verified: false,
      });
    }

    return Array.from(merged.values());
  }

  private mergeProjects(existingProjects: any[], parsedProjects: any[]): any[] {
    const existingMap = new Map(
      (existingProjects || []).filter((project: any) => project.source !== 'cv_parsed').map((project: any) => [
        this.normalizeSkillName(project.title || project.description || ''),
        project.toObject ? project.toObject() : { ...project },
      ]),
    );

    for (const project of parsedProjects || []) {
      const title = typeof project === 'string' ? project : project.title || project.name || 'Project';
      const key = this.normalizeSkillName(title);
      if (!key || existingMap.has(key)) continue;
      existingMap.set(key, {
        title,
        description: typeof project === 'string' ? project : project.description || '',
        technologies: typeof project === 'string' ? [] : this.toDisplayNames(project.technologies || []),
        role: typeof project === 'string' ? '' : project.role || '',
        source: 'cv_parsed',
      });
    }

    return Array.from(existingMap.values());
  }

  private mergeCertifications(existingCertifications: any[], parsedCertifications: any[]): any[] {
    const existingMap = new Map(
      (existingCertifications || []).filter((certification: any) => certification.source !== 'cv_parsed').map((certification: any) => [
        this.normalizeSkillName(certification.name || ''),
        certification.toObject ? certification.toObject() : { ...certification },
      ]),
    );

    for (const certification of parsedCertifications || []) {
      const name = typeof certification === 'string' ? certification : certification.name;
      const key = this.normalizeSkillName(name);
      if (!key || existingMap.has(key)) continue;
      existingMap.set(key, {
        name,
        issuer: typeof certification === 'string' ? '' : certification.issuer || certification.provider || '',
        issueDate: typeof certification === 'string' ? undefined : this.parseOptionalDate(certification.date),
        skills: [],
        source: 'cv_parsed',
      });
    }

    return Array.from(existingMap.values());
  }

  private mergeCourses(existingCourses: any[], parsedCourses: any[]): any[] {
    const existingMap = new Map(
      (existingCourses || []).filter((course: any) => course.source !== 'cv_parsed').map((course: any) => [
        this.normalizeSkillName(course.name || ''),
        course.toObject ? course.toObject() : { ...course },
      ]),
    );

    for (const course of parsedCourses || []) {
      const name = typeof course === 'string' ? course : course.name;
      const key = this.normalizeSkillName(name);
      if (!key || existingMap.has(key)) continue;
      existingMap.set(key, {
        name,
        provider: typeof course === 'string' ? '' : course.provider || course.issuer || '',
        completionDate: typeof course === 'string' ? undefined : this.parseOptionalDate(course.date),
        source: 'cv_parsed',
      });
    }

    return Array.from(existingMap.values());
  }

  private mergeExperiences(existingExperiences: any[], parsedExperiences: any[]): any[] {
    const existingMap = new Map(
      (existingExperiences || []).filter((experience: any) => experience.source !== 'cv_parsed').map((experience: any) => [
        this.normalizeSkillName(`${experience.title || ''}-${experience.company || ''}`),
        experience.toObject ? experience.toObject() : { ...experience },
      ]),
    );

    for (const experience of parsedExperiences || []) {
      const title = typeof experience === 'string' ? experience : experience.title || 'Experience';
      const company = typeof experience === 'string' ? '' : experience.company || '';
      const key = this.normalizeSkillName(`${title}-${company}`);
      if (!key || existingMap.has(key)) continue;
      existingMap.set(key, {
        title,
        company,
        description: typeof experience === 'string' ? experience : experience.description || '',
        years: typeof experience === 'string' ? 0 : experience.years || 0,
        skillsUsed: typeof experience === 'string' ? [] : experience.skills || [],
        source: 'cv_parsed',
      });
    }

    return Array.from(existingMap.values());
  }

  private stringifyCvEntries(entries: any[]): string[] {
    return (entries || [])
      .map((entry) => {
        if (typeof entry === 'string') {
          return entry.trim();
        }
        if (!entry || typeof entry !== 'object') {
          return '';
        }
        return Object.values(entry)
          .filter((value) => value !== null && value !== undefined && `${value}`.trim() !== '')
          .join(' - ')
          .trim();
      })
      .filter(Boolean);
  }

  private calculateReadinessMetrics(params: {
    student: any;
    user: any;
    parsedData: any;
    mappedSkills: any[];
    mappedProjects: any[];
    mappedCertifications: any[];
    mappedExperiences: any[];
  }) {
    const profileCompletion = this.calculateProfileCompletion(
      {
        ...params.student.toObject?.(),
        skills: params.mappedSkills,
        projects: params.mappedProjects,
        certifications: params.mappedCertifications,
        experiences: params.mappedExperiences,
        cvData: { fileUrl: '/uploaded' },
      },
      params.user,
    );

    const skillDiversityScore = Math.min(100, params.mappedSkills.length * 8);
    const experienceYears = this.calculateStudentExperienceYears(params.mappedExperiences);
    const experienceScore = Math.min(100, Math.round(experienceYears * 20));
    const projectQualityScore = Math.min(100, params.mappedProjects.length * 20);
    const certificationScore = Math.min(100, params.mappedCertifications.length * 20);
    const parsingConfidence = Math.round((params.parsedData?.confidence || 0) * 100);

    const readinessScore = Math.round(
      (profileCompletion * 0.25)
      + (skillDiversityScore * 0.25)
      + (experienceScore * 0.2)
      + (projectQualityScore * 0.15)
      + (certificationScore * 0.05)
      + (parsingConfidence * 0.1),
    );

    return {
      readinessScore,
      employabilityIndex: Math.round((readinessScore + skillDiversityScore + experienceScore) / 3),
      skillDiversityScore,
      experienceScore,
      projectQualityScore,
      lastCalculatedAt: new Date(),
    };
  }

  private buildStudentProfileText(student: any): string {
    return [
      student.personalInfo?.firstName,
      student.personalInfo?.lastName,
      student.professionalProfile?.headline,
      student.academicInfo?.universityName,
      student.academicInfo?.collegeName,
      student.academicInfo?.departmentName,
      (student.skills || []).map((skill: any) => skill.name).join(', '),
      (student.projects || []).map((project: any) => `${project.title || ''} ${project.description || ''}`).join('. '),
      student.cvData?.parsedData?.rawText,
    ]
      .filter(Boolean)
      .join(' | ');
  }

  private buildJobText(job: any): string {
    return [
      job.title,
      job.description,
      job.summary,
      job.category,
      (job.requirements?.requiredSkills || []).map((skill: any) => skill.name).join(', '),
      (job.requirements?.preferredSkills || []).map((skill: any) => skill.name).join(', '),
      (job.skills || []).join(', '),
      job.location?.city,
      job.location?.country,
    ]
      .filter(Boolean)
      .join(' | ');
  }

  private ensureEmbeddingVector(vector: any): number[] {
    return Array.isArray(vector) ? vector.filter((value) => typeof value === 'number') : [];
  }

  private extractJobSkills(job: any): Array<{ name: string; weight: number }> {
    if (Array.isArray(job?.requirements?.requiredSkills) && job.requirements.requiredSkills.length) {
      return job.requirements.requiredSkills
        .map((skill: any) => ({ name: skill.name, weight: skill.weight ?? 1 }))
        .filter((skill: any) => Boolean(skill.name));
    }

    return (job?.skills || [])
      .map((skill: any) => ({ name: typeof skill === 'string' ? skill : skill?.name, weight: 1 }))
      .filter((skill: any) => Boolean(skill.name));
  }

  private calculateFallbackMissingSkills(studentSkills: any[], job: any): string[] {
    const studentSkillNames = new Set((studentSkills || []).map((skill: any) => this.normalizeSkillName(skill.name)));
    return this.extractJobSkills(job)
      .map((skill) => skill.name)
      .filter((skillName) => !studentSkillNames.has(this.normalizeSkillName(skillName)))
      .slice(0, 5);
  }

  private extractMatchingSkills(studentSkills: any[], job: any): string[] {
    const jobSkillNames = new Set(this.extractJobSkills(job).map((skill) => this.normalizeSkillName(skill.name)));
    return (studentSkills || [])
      .map((skill: any) => skill.name)
      .filter((skillName) => jobSkillNames.has(this.normalizeSkillName(skillName)))
      .slice(0, 5);
  }

  private normalizeSkillName(value: string): string {
    return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private clampScore(value: unknown): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? Math.round(Math.min(100, Math.max(0, numeric))) : 0;
  }

  private categorizeCareerDomain(title: string): string {
    const normalized = this.normalizeSkillName(title);
    if (normalized.includes('data') || normalized.includes('analytics')) return 'Data';
    if (normalized.includes('ai') || normalized.includes('ml') || normalized.includes('machine')) return 'AI';
    if (normalized.includes('devops') || normalized.includes('cloud')) return 'Cloud';
    if (normalized.includes('security')) return 'Cybersecurity';
    if (normalized.includes('mobile')) return 'Mobile';
    return 'Software';
  }

  private buildFutureSkillReason(skill: any): string {
    const trend = skill.marketData?.trend || 'stable';
    const growth = skill.marketData?.growthRate || 0;
    if (trend === 'rising' || growth >= 20) {
      return `Demand for ${skill.name} is rising in current market data.`;
    }
    return `This skill remains relevant across current job postings and market data.`;
  }

  private inferSkillCategory(skill: any): string {
    const rawCategory = typeof skill === 'string' ? '' : skill.category || '';
    if (['technical', 'soft', 'language', 'domain', 'tool', 'framework'].includes(rawCategory)) {
      return rawCategory;
    }
    return 'technical';
  }

  private inferSkillProficiency(skill: any): number {
    if (typeof skill === 'string') return 65;
    const confidence = typeof skill.confidence === 'number' ? skill.confidence : 0.65;
    return Math.max(35, Math.min(95, Math.round(confidence * 100)));
  }

  private normalizeStudentSkillLevel(proficiency: number): number {
    const normalized = (proficiency || 0) / 100;
    return Math.max(0, Math.min(1, Number(normalized.toFixed(2))));
  }

  private normalizeJobSkillWeight(weight: number): number {
    if (typeof weight !== 'number') return 0.5;
    if (weight <= 1) return weight;
    return Math.max(0.1, Math.min(1, weight / 10));
  }

  private calculateStudentExperienceYears(experiences: any[]): number {
    return Math.round(
      (experiences || []).reduce((total: number, experience: any) => total + (experience.years || 0), 0),
    );
  }

  private formatJobLocation(location: any): string {
    if (!location) return '';
    if (typeof location === 'string') return location;
    return [location.city, location.country].filter(Boolean).join(', ');
  }

  private firstText(...values: any[]): string {
    for (const value of values) {
      const text = this.valueToDisplayText(value);
      if (text) {
        return text;
      }
    }
    return '';
  }

  private toDisplayNames(values: any): string[] {
    if (!Array.isArray(values)) {
      const single = this.valueToDisplayText(values);
      return single ? [single] : [];
    }

    const seen = new Set<string>();
    const names: string[] = [];

    for (const value of values) {
      const text = this.valueToDisplayText(value);
      if (!text) continue;
      const key = this.normalizeSkillName(text);
      if (seen.has(key)) continue;
      seen.add(key);
      names.push(text);
    }

    return names;
  }

  private valueToDisplayText(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      const text = String(value).trim();
      return text && text !== '[object Object]' ? text : '';
    }
    if (Array.isArray(value)) {
      return this.toDisplayNames(value).join(', ');
    }
    if (typeof value === 'object') {
      return this.firstText(
        value.name,
        value.skillName,
        value.title,
        value.label,
        value.value,
        value.text,
        value.reason,
        value.description,
        value.recommendation,
      );
    }
    return '';
  }

  private parseOptionalDate(value: any): Date | undefined {
    if (!value) return undefined;
    const text = String(value).trim();
    if (/^\d{4}$/.test(text)) {
      return new Date(`${text}-01-01T00:00:00.000Z`);
    }
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private deriveGapPriority(gap: number): string {
    if (gap >= 60) return 'critical';
    if (gap >= 40) return 'high';
    if (gap >= 20) return 'medium';
    return 'low';
  }
}
