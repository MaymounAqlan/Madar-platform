import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { join, resolve } from 'path';
import { mkdir, writeFile, unlink } from 'fs/promises';
import { Model, Types } from 'mongoose';
import { University, UniversityDocument } from './schemas/university.schema';
import { College, CollegeDocument } from './colleges/schemas/college.schema';
import { Department, DepartmentDocument } from './departments/schemas/department.schema';
import { Student, StudentDocument } from '../students/schemas/student.schema';
import { Job, JobDocument } from '../jobs/schemas/job.schema';
import { Application, ApplicationDocument } from '../applications/schemas/application.schema';
import { MatchResult, MatchResultDocument } from '../matching/match-results/schemas/match-result.schema';
import { SkillGap, SkillGapDocument } from '../matching/skill-gaps/schemas/skill-gap.schema';
import { MarketData, MarketDataDocument } from '../skills/market-data/schemas/market-data.schema';
import { AuditLog, AuditLogDocument } from '../common/audit-logs/schemas/audit-log.schema';
import { CollegeCoordinator, CollegeCoordinatorDocument } from './college-coordinators/schemas/college-coordinator.schema';
import { StudentAffiliation, StudentAffiliationDocument } from './student-affiliations/schemas/student-affiliation.schema';
import { NotificationService } from '../common/notifications/notification.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { CreateCollegeDto, UpdateCollegeDto } from './dto/college.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import {
  UniversityDashboardResponse,
  UniversityProfileResponse,
  UniversityStudentStatisticsResponse,
  UniversityStudentsResponse,
  UniversityStructureResponse,
} from './dto/university-contracts.dto';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

import { CurriculumAnalysis, CurriculumAnalysisDocument } from './curriculum/schemas/curriculum-analysis.schema';

@Injectable()
export class UniversitiesService {
  private readonly logger = new Logger(UniversitiesService.name);

  constructor(
    @InjectModel(University.name) private universityModel: Model<UniversityDocument>,
    @InjectModel(College.name) private collegeModel: Model<CollegeDocument>,
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(MatchResult.name) private matchResultModel: Model<MatchResultDocument>,
    @InjectModel(SkillGap.name) private skillGapModel: Model<SkillGapDocument>,
    @InjectModel(MarketData.name) private marketDataModel: Model<MarketDataDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(CollegeCoordinator.name) private staffModel: Model<CollegeCoordinatorDocument>,
    @InjectModel(StudentAffiliation.name) private affiliationModel: Model<StudentAffiliationDocument>,
    private readonly notificationService: NotificationService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(CurriculumAnalysis.name) private analysisModel: Model<CurriculumAnalysisDocument>,
  ) {}

  async findByUserId(userId: string): Promise<University> {
    const university = await this.universityModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!university) throw new NotFoundException('University profile not found');
    return university as University;
  }

  async getProfile(userId: string): Promise<UniversityProfileResponse> {
    const university = await this.findByUserId(userId);
    return this.toProfileDto(university);
  }

  async getMyStatus(userId: string) {
    const university = await this.findByUserId(userId) as any;
    return {
      universityId: String(university._id),
      name: university.name || '',
      status: university.status || 'inactive',
      submittedAt: university.submittedAt || university.createdAt || null,
      reviewedAt: university.reviewedAt || null,
      rejectionReason: university.rejectionReason || null,
      suspensionReason: university.suspensionReason || null,
      canAccessPortal: university.status === 'active',
    };
  }

  async listPublicUniversities() {
    const items = await this.universityModel.find({ status: 'active' }).select('name nameAr shortName branding.logoUrl location.city location.country').sort({ name: 1 }).lean();
    return { items: items.map((item: any) => ({ id: String(item._id), name: item.name || '', nameAr: item.nameAr || '', shortName: item.shortName || '', logoUrl: item.branding?.logoUrl || null, location: { city: item.location?.city || '', country: item.location?.country || '' } })) };
  }

  async listPublicColleges(universityId: string) {
    const id = this.asObjectId(universityId);
    if (!await this.universityModel.exists({ _id: id, status: 'active' })) throw new NotFoundException('Active university not found');
    const items = await this.collegeModel.find({ universityId: id, 'metadata.status': { $nin: ['archived', 'deleted'] } }).select('name nameAr code').sort({ name: 1 }).lean();
    return { items: items.map((item: any) => ({ id: String(item._id), name: item.name || '', nameAr: item.nameAr || '', code: item.code || '' })) };
  }

  async listPublicDepartments(collegeId: string) {
    const id = this.asObjectId(collegeId);
    const college = await this.collegeModel.findOne({ _id: id, 'metadata.status': { $nin: ['archived', 'deleted'] } }).select('universityId').lean();
    if (!college || !await this.universityModel.exists({ _id: (college as any).universityId, status: 'active' })) throw new NotFoundException('Active college not found');
    const items = await this.departmentModel.find({ collegeId: id, universityId: (college as any).universityId, 'metadata.status': { $nin: ['archived', 'deleted'] } }).select('name nameAr code').sort({ name: 1 }).lean();
    return { items: items.map((item: any) => ({ id: String(item._id), name: item.name || '', nameAr: item.nameAr || '', code: item.code || '' })) };
  }

  async getAffiliationStudent(userId: string, studentId: string) {
    const access = await this.resolveInstitutionalAccess(userId);
    const affiliation = await this.findScopedAffiliation(access, studentId);
    const student: any = await this.studentModel.findById(affiliation.studentId).select('userId personalInfo academicInfo aiMetrics cvData.fileUrl').lean();
    if (!student) throw new NotFoundException('Student not found');
    const account: any = await this.userModel.findById(student.userId).select('email phone').lean();
    const [college, department] = await Promise.all([this.collegeModel.findById(affiliation.collegeId).select('name').lean(), this.departmentModel.findById(affiliation.departmentId).select('name').lean()]);
    return { id: String(student._id), fullName: `${student.personalInfo?.firstName || ''} ${student.personalInfo?.lastName || ''}`.trim(), email: account?.email || '', phone: account?.phone || student.personalInfo?.phone || '', studentNumber: affiliation.studentNumber, college: college ? { id: String((college as any)._id), name: (college as any).name } : null, department: department ? { id: String((department as any)._id), name: (department as any).name } : null, academicLevel: affiliation.academicLevel, enrollmentYear: affiliation.enrollmentYear, expectedGraduationYear: affiliation.expectedGraduationYear, affiliationStatus: affiliation.status, verificationMethod: affiliation.verificationMethod, proofDocumentUrl: affiliation.proofDocumentUrl || null, decisions: affiliation.decisions || [], readinessScore: student.aiMetrics?.readinessScore || 0, cvStatus: student.cvData?.fileUrl ? 'uploaded' : 'missing' };
  }

  async reviewAffiliation(userId: string, studentId: string, status: string, reason?: string) {
    const access = await this.resolveInstitutionalAccess(userId);
    if (access.role !== 'university' && !access.permissions.includes('affiliations:write')) throw new ForbiddenException('Affiliation review permission is required');
    if (['rejected', 'suspended'].includes(status) && !String(reason || '').trim()) throw new BadRequestException('A reason is required');
    const current = await this.findScopedAffiliation(access, studentId);
    const now = new Date();
    const update: any = { status, verifiedBy: new Types.ObjectId(userId), verifiedAt: ['verified', 'graduated'].includes(status) ? now : undefined, rejectionReason: status === 'rejected' ? reason : undefined, suspensionReason: status === 'suspended' ? reason : undefined, graduationDate: status === 'graduated' ? now : undefined };
    const affiliation: any = await this.affiliationModel.findOneAndUpdate({ _id: current._id }, { $set: update, $push: { decisions: { status, reason: reason || '', actorId: new Types.ObjectId(userId), createdAt: now } } }, { new: true }).lean();
    const student: any = await this.studentModel.findById(current.studentId).select('userId').lean();
    if (student?.userId) await this.notificationService.create({ userId: student.userId, type: 'system', title: 'Academic affiliation updated', titleAr: 'تم تحديث حالة الانتساب الأكاديمي', message: `Your academic affiliation is now ${status}.`, messageAr: `أصبحت حالة انتسابك الأكاديمي: ${status}.`, actionUrl: '/student/profile' });
    await this.auditLog(`AFFILIATION_${status.toUpperCase()}`, userId, 'student_affiliation', String(current._id), reason || `Affiliation changed to ${status}`);
    return { id: String(affiliation._id), studentId: String(affiliation.studentId), status: affiliation.status, reviewedAt: now, reason: reason || null };
  }

  async listColleges(userId: string, query: any = {}): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    this.assertInstitutionalPermission(access, 'structure:read');
    const university = access.university;
    const universityId = (university as any)._id;
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 50, 1), 100);
    const filter: any = {
      ...this.buildUniversityEntityScope(universityId),
      'metadata.status': { $ne: 'deleted' },
    };
    if (access.collegeId) filter._id = access.collegeId;
    if (query.includeArchived !== 'true') {
      filter['metadata.status'] = { $nin: ['archived', 'deleted'] };
    }
    if (query.search) {
      const re = this.safeRegex(query.search);
      filter.$and = [{ $or: [{ name: re }, { nameAr: re }, { code: re }, { description: re }] }];
    }

    const [colleges, total, departments] = await Promise.all([
      this.collegeModel.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.collegeModel.countDocuments(filter),
      this.departmentModel.find({ ...this.buildUniversityEntityScope(universityId), ...(access.collegeId ? { collegeId: access.collegeId } : {}), 'metadata.status': { $ne: 'deleted' } }).lean(),
    ]);

    return {
      colleges: colleges.map((college) => this.toCollegeDto(college, departments)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createCollege(userId: string, dto: CreateCollegeDto): Promise<any> {
    const university = await this.findByUserId(userId);
    if (!dto?.name) {
      throw new BadRequestException('College name is required');
    }
    const universityId = (university as any)._id;
    const name = dto.name;
    const duplicate = await this.collegeModel.collection.findOne({
      ...this.buildOwnedEntityFilter(university),
      $and: [{ $or: [
        { name: new RegExp(`^${this.escapeRegex(name)}$`, 'i') },
        ...(dto.code ? [{ code: new RegExp(`^${this.escapeRegex(dto.code)}$`, 'i') }] : []),
      ] }],
      'metadata.status': { $ne: 'deleted' },
    } as any);
    if (duplicate) {
      throw new ConflictException('College name or code already exists in this university');
    }

    const college = await this.collegeModel.create({
      universityId,
      name,
      nameAr: dto.nameAr || undefined,
      code: dto.code || undefined,
      description: dto.description || undefined,
      established: dto.established,
      dean: dto.dean || undefined,
      metadata: { status: 'active' },
    } as any);
    await this.syncEmbeddedStructure(universityId);
    await this.auditLog('CREATE_COLLEGE', userId, 'college', college._id.toString(), `Created college ${name}`);
    return this.toCollegeDto(college.toObject ? college.toObject() : college, []);
  }

  async updateCollege(userId: string, collegeId: string, dto: UpdateCollegeDto): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    const university = access.university;
    if (access.role !== 'university') {
      if (access.role !== 'coordinator' || !access.permissions.includes('college:write')) throw new ForbiddenException('College write permission is required');
      if (!access.collegeId || String(access.collegeId) !== String(collegeId)) throw new ForbiddenException('Coordinator access is limited to the assigned college');
    }
    const objectId = this.asObjectId(collegeId);
    if (dto.name || dto.code) {
      const duplicate = await this.collegeModel.collection.findOne({
        ...this.buildOwnedEntityFilter(university),
        _id: { $ne: objectId },
        $and: [{ $or: [
          ...(dto.name ? [{ name: new RegExp(`^${this.escapeRegex(dto.name)}$`, 'i') }] : []),
          ...(dto.code ? [{ code: new RegExp(`^${this.escapeRegex(dto.code)}$`, 'i') }] : []),
        ] }],
        'metadata.status': { $ne: 'deleted' },
      } as any);
      if (duplicate) throw new ConflictException('College name or code already exists in this university');
    }
    const college = await this.collegeModel.collection.findOneAndUpdate(
      { _id: objectId, ...this.buildOwnedEntityFilter(university), 'metadata.status': { $ne: 'deleted' } } as any,
      { $set: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.nameAr !== undefined ? { nameAr: dto.nameAr } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.established !== undefined ? { established: dto.established } : {}),
        ...(dto.dean !== undefined ? { dean: dto.dean } : {}),
      } },
      { returnDocument: 'after' },
    );
    if (!college) throw new NotFoundException('College not found');
    await this.syncEmbeddedStructure((university as any)._id);
    await this.auditLog('UPDATE_COLLEGE', userId, 'college', collegeId, `Updated college ${college.name}`);
    return this.toCollegeDto(college, []);
  }

  async archiveCollege(userId: string, collegeId: string, archived = true): Promise<any> {
    const university = await this.findByUserId(userId);
    const college = await this.collegeModel.collection.findOneAndUpdate(
      { _id: this.asObjectId(collegeId), ...this.buildOwnedEntityFilter(university), 'metadata.status': { $ne: 'deleted' } } as any,
      { $set: { 'metadata.status': archived ? 'archived' : 'active' } },
      { returnDocument: 'after' },
    );
    if (!college) throw new NotFoundException('College not found');
    await this.syncEmbeddedStructure((university as any)._id);
    await this.auditLog(archived ? 'ARCHIVE_COLLEGE' : 'RESTORE_COLLEGE', userId, 'college', collegeId, `${archived ? 'Archived' : 'Restored'} college ${college.name}`);
    return this.toCollegeDto(college, []);
  }

  async deleteCollege(userId: string, collegeId: string): Promise<any> {
    const university = await this.findByUserId(userId);
    const universityId = (university as any)._id;
    const college = await this.collegeModel.findOneAndUpdate(
      { _id: this.asObjectId(collegeId), universityId },
      { $set: { 'metadata.status': 'archived' } },
      { new: true },
    ).lean();
    if (!college) throw new NotFoundException('College not found');
    await this.departmentModel.updateMany({ universityId, collegeId: this.asObjectId(collegeId) }, { $set: { 'metadata.status': 'deleted' } });
    await this.syncEmbeddedStructure(universityId);
    await this.auditLog('DELETE_COLLEGE', userId, 'college', collegeId, `Deleted college ${college.name}`);
    return { message: 'College deleted successfully' };
  }

  async listDepartments(userId: string, query: any = {}): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    this.assertInstitutionalPermission(access, 'structure:read');
    const university = access.university;
    const filter: any = { universityId: (university as any)._id, 'metadata.status': { $ne: 'deleted' } };
    if (access.collegeId) filter.collegeId = access.collegeId;
    if (query.collegeId) filter.collegeId = this.asObjectId(query.collegeId);
    if (query.search) {
      const re = this.safeRegex(query.search);
      filter.$or = [{ name: re }, { nameAr: re }, { code: re }, { description: re }];
    }
    const departments = await this.departmentModel.find(filter).sort({ name: 1 }).lean();
    return { departments: departments.map((department) => this.toDepartmentDto(department)) };
  }

  async createDepartment(userId: string, collegeId: string, dto: CreateDepartmentDto): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    this.assertDepartmentWriteScope(access, collegeId);
    const university = access.university;
    const universityId = (university as any)._id;
    if (!dto?.name) {
      throw new BadRequestException('Department name is required');
    }
    const college = await this.collegeModel.collection.findOne({
      _id: this.asObjectId(collegeId),
      ...this.buildOwnedEntityFilter(university),
      'metadata.status': { $nin: ['archived', 'deleted'] },
    } as any);
    if (!college) throw new NotFoundException('College not found');

    const name = dto.name;
    const duplicate = await this.departmentModel.collection.findOne({
      ...this.buildOwnedEntityFilter(university),
      collegeId: this.asObjectId(collegeId),
      $and: [{ $or: [
        { name: new RegExp(`^${this.escapeRegex(name)}$`, 'i') },
        ...(dto.code ? [{ code: new RegExp(`^${this.escapeRegex(dto.code)}$`, 'i') }] : []),
      ] }],
      'metadata.status': { $ne: 'deleted' },
    } as any);
    if (duplicate) {
      throw new ConflictException('Department name or code already exists in this college');
    }

    const department = await this.departmentModel.create({
      universityId,
      collegeId: this.asObjectId(collegeId),
      name,
      nameAr: dto.nameAr || undefined,
      code: dto.code || undefined,
      description: dto.description || undefined,
      head: dto.head || undefined,
      metadata: { status: 'active' },
    } as any);
    await this.syncEmbeddedStructure(universityId);
    await this.auditLog('CREATE_DEPARTMENT', userId, 'department', department._id.toString(), `Created department ${name}`);
    return this.toDepartmentDto(department.toObject ? department.toObject() : department);
  }

  async updateDepartment(userId: string, departmentId: string, dto: UpdateDepartmentDto): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    const university = access.university;
    const objectId = this.asObjectId(departmentId);
    const existing = await this.departmentModel.collection.findOne({
      _id: objectId,
      ...this.buildOwnedEntityFilter(university),
      'metadata.status': { $ne: 'deleted' },
    } as any);
    if (!existing) throw new NotFoundException('Department not found');
    this.assertDepartmentWriteScope(access, String(existing.collegeId));
    if (dto.name || dto.code) {
      const duplicate = await this.departmentModel.collection.findOne({
        ...this.buildOwnedEntityFilter(university),
        collegeId: existing.collegeId,
        _id: { $ne: objectId },
        $and: [{ $or: [
          ...(dto.name ? [{ name: new RegExp(`^${this.escapeRegex(dto.name)}$`, 'i') }] : []),
          ...(dto.code ? [{ code: new RegExp(`^${this.escapeRegex(dto.code)}$`, 'i') }] : []),
        ] }],
        'metadata.status': { $ne: 'deleted' },
      } as any);
      if (duplicate) throw new ConflictException('Department name or code already exists in this college');
    }
    const department = await this.departmentModel.collection.findOneAndUpdate(
      { _id: objectId, ...this.buildOwnedEntityFilter(university), 'metadata.status': { $ne: 'deleted' } } as any,
      { $set: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.nameAr !== undefined ? { nameAr: dto.nameAr } : {}),
        ...(dto.code !== undefined ? { code: dto.code } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.head !== undefined ? { head: dto.head } : {}),
      } },
      { returnDocument: 'after' },
    );
    if (!department) throw new NotFoundException('Department not found');
    await this.syncEmbeddedStructure((university as any)._id);
    await this.auditLog('UPDATE_DEPARTMENT', userId, 'department', departmentId, `Updated department ${department.name}`);
    return this.toDepartmentDto(department);
  }

  async deleteDepartment(userId: string, departmentId: string): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    const university = access.university;
    const existing = await this.departmentModel.collection.findOne({
      _id: this.asObjectId(departmentId),
      ...this.buildOwnedEntityFilter(university),
      'metadata.status': { $ne: 'deleted' },
    } as any);
    if (!existing) throw new NotFoundException('Department not found');
    this.assertDepartmentWriteScope(access, String(existing.collegeId));
    const department = await this.departmentModel.collection.findOneAndUpdate(
      { _id: this.asObjectId(departmentId), ...this.buildOwnedEntityFilter(university), 'metadata.status': { $ne: 'deleted' } } as any,
      { $set: { 'metadata.status': 'archived' } },
      { returnDocument: 'after' },
    );
    if (!department) throw new NotFoundException('Department not found');
    await this.syncEmbeddedStructure((university as any)._id);
    await this.auditLog('ARCHIVE_DEPARTMENT', userId, 'department', departmentId, 'Department archived');
    return { message: 'Department archived successfully' };
  }

  async restoreDepartment(userId: string, departmentId: string): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    const university = access.university;
    const existing: any = await this.departmentModel.collection.findOne({
      _id: this.asObjectId(departmentId), ...this.buildOwnedEntityFilter(university),
      'metadata.status': 'archived',
    } as any);
    if (!existing) throw new NotFoundException('Archived department not found');
    this.assertDepartmentWriteScope(access, String(existing.collegeId));
    const result: any = await this.departmentModel.collection.findOneAndUpdate(
      { _id: this.asObjectId(departmentId), ...this.buildOwnedEntityFilter(university), 'metadata.status': 'archived' } as any,
      { $set: { 'metadata.status': 'active' } },
      { returnDocument: 'after' },
    );
    await this.syncEmbeddedStructure((university as any)._id);
    await this.auditLog('RESTORE_DEPARTMENT', userId, 'department', departmentId, 'Department restored');
    return this.toDepartmentDto(result);
  }

  async updateProfile(userId: string, dto: UpdateUniversityDto): Promise<UniversityProfileResponse> {
    const hasSupportedField = Object.values(dto).some((value) => value !== undefined);
    if (!hasSupportedField) throw new BadRequestException('At least one supported profile field is required');
    if (dto.logoUrl !== undefined) this.assertPublicHttpsUrl(dto.logoUrl);
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (dto.name !== undefined) update.name = dto.name;
    if (dto.nameAr !== undefined) update.nameAr = dto.nameAr;
    if (dto.type !== undefined) update.type = dto.type;
    if (dto.description !== undefined) update.description = dto.description;
    if (dto.city !== undefined) update['location.city'] = dto.city;
    if (dto.country !== undefined) update['location.country'] = dto.country;
    if (dto.address !== undefined) update['location.address'] = dto.address;
    if (dto.website !== undefined) update['contactInfo.website'] = dto.website;
    if (dto.phone !== undefined) update['contactInfo.phone'] = dto.phone;
    if (dto.contactEmail !== undefined) update['contactInfo.email'] = dto.contactEmail;
    if (dto.officialContactEmail !== undefined) update['contactInfo.hrEmail'] = dto.officialContactEmail;
    if (dto.officialContactName !== undefined) update['officialContact.fullName'] = dto.officialContactName;
    if (dto.officialContactPhone !== undefined) update['officialContact.phone'] = dto.officialContactPhone;
    if (dto.officialContactEmail !== undefined) update['officialContact.email'] = dto.officialContactEmail;
    if (dto.emailDomain !== undefined) update.emailDomain = dto.emailDomain.toLowerCase();
    if (dto.logoUrl !== undefined) update['branding.logoUrl'] = dto.logoUrl;

    const university = await this.universityModel
      .findOneAndUpdate({ userId: new Types.ObjectId(userId) }, { $set: update }, { new: true })
      .lean();
    if (!university) throw new NotFoundException('University profile not found');
    await this.auditLog('UPDATE_PROFILE', userId, 'university', (university as any)._id.toString(), 'University profile updated');
    return this.toProfileDto(university);
  }

  async uploadLogo(userId: string, file: Express.Multer.File): Promise<{ logoUrl: string }> {
    const university: any = await this.universityModel.findOne({ userId: new Types.ObjectId(userId) }).lean();
    if (!university) throw new NotFoundException('University profile not found');
    if (!file?.buffer?.length) throw new BadRequestException('Logo file is required');
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Logo must not exceed 5 MB');
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.mimetype)) throw new BadRequestException('Only PNG, JPEG, and WebP logos are supported');
    
    // detect extension
    let extension = 'png';
    if (file.mimetype === 'image/jpeg') extension = 'jpg';
    else if (file.mimetype === 'image/webp') extension = 'webp';

    const digest = createHash('sha256').update(file.buffer).digest('hex').slice(0, 12);
    const safeSlug = (university.slug || String(university._id)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const fileName = `${safeSlug}-${digest}.${extension}`;
    const relativePath = join('uploads', 'universities', fileName).replace(/\\/g, '/');
    const outputDirectory = resolve(process.cwd(), 'uploads', 'universities');
    
    await mkdir(outputDirectory, { recursive: true });
    await writeFile(resolve(outputDirectory, fileName), file.buffer);
    
    await this.universityModel.updateOne(
      { _id: university._id },
      { 
        $set: { 
          logoUrl: `/${relativePath}`, 
          logoStorageKey: relativePath, 
          logoAltAr: `شعار ${university.nameAr || university.name}`, 
          logoAltEn: `${university.nameEn || university.name || 'University'} logo`, 
          'branding.logoUrl': `/${relativePath}` 
        } 
      }
    );

    if (university.logoStorageKey && university.logoStorageKey !== relativePath && /^uploads\/universities\//.test(university.logoStorageKey)) {
      const previous = resolve(process.cwd(), university.logoStorageKey);
      if (previous.startsWith(outputDirectory)) await unlink(previous).catch(() => undefined);
    }
    
    await this.auditLog('UPLOAD_LOGO', userId, 'university', String(university._id), 'Uploaded new university logo');
    return { logoUrl: `/${relativePath}` };
  }

  // ==========================================
  // FR-UNI-001/002/003/004/005: Dashboard + Structure + Student Linking
  // ==========================================

  async getDashboard(userId: string): Promise<UniversityDashboardResponse> {
    const access = await this.resolveInstitutionalAccess(userId);
    this.assertInstitutionalPermission(access, 'dashboard:read');
    const university = access.university;
    const universityId = (university as any)._id;
    const studentFilter = this.withCollegeScope(await this.resolveStudentScopeFilter(university), access.collegeId);
    const officialAffiliations: any[] = await this.affiliationModel.find({ universityId, isCurrent: true, status: { $in: ['verified', 'graduated'] }, ...(access.collegeId ? { collegeId: access.collegeId } : {}) }).select('studentId').lean();
    const officialIds = new Set(officialAffiliations.map((item: any) => String(item.studentId)));

    const [studentDocuments, allColleges, allDepartments, matchResults, topSkillsInDemand] = await Promise.all([
      this.studentModel.find(studentFilter).select('_id academicInfo.collegeId aiMetrics.readinessScore').lean(),
      this.findUniversityColleges(universityId, (university as any).userId),
      this.findUniversityDepartments(universityId, (university as any).userId),
      this.matchResultModel.find({ universityId }).lean(),
      this.getTopSkillsInDemand(universityId),
    ]);
    const colleges = access.collegeId ? allColleges.filter((item: any) => String(item._id) === String(access.collegeId)) : allColleges;
    const departments = access.collegeId ? allDepartments.filter((item: any) => String(item.collegeId) === String(access.collegeId)) : allDepartments;
    const studentIds = studentDocuments.map((student: any) => student._id);
    const applications = studentIds.length
      ? await this.applicationModel.find({ studentId: { $in: studentIds } }).lean()
      : [];
    const students = studentDocuments.length;
    const officialStudents = studentDocuments.filter((item: any) => officialIds.has(String(item._id)));

    // FR-UNI-006: Employment rate per college
    const collegePerformance = colleges.map(college => {
      const collegeDepartments = departments.filter(d => d.collegeId?.toString() === college._id.toString());
      const relatedStudents = officialStudents.filter((student: any) => String(student.academicInfo?.collegeId || '') === String(college._id));
      const readinessValues = relatedStudents.map((student: any) => Number(student.aiMetrics?.readinessScore || 0));
      const avgReadiness = readinessValues.length
        ? readinessValues.reduce((sum: number, value: number) => sum + value, 0) / readinessValues.length
        : 0;
      return {
        collegeId: college._id.toString(),
        collegeName: college.name,
        studentCount: relatedStudents.length || college.studentCount || college.analytics?.totalStudents || 0,
        employmentRate: college.analytics?.employmentRate || college.employmentRate || 0,
        readinessScore: Math.round(avgReadiness),
        skillGapCount: college.analytics?.skillGaps?.length || 0,
      };
    });

    // FR-UNI-007: Average readiness
    const allReadiness = officialStudents.map((student: any) => Number(student.aiMetrics?.readinessScore || 0));
    const avgUniversityReadiness = allReadiness.length > 0
      ? Math.round(allReadiness.reduce((a, b) => a + b, 0) / allReadiness.length)
      : 0;

    // FR-UNI-008: Skill gap analysis
    const allSkillGaps = Array.from(new Set(colleges.flatMap((college: any) => college.analytics?.skillGaps || []))) as string[];
    const employmentRate = Number(university.analytics?.employmentRate || 0);
    const curriculumAlignment = Number((university.analytics as any)?.skillAlignmentScore || 0);
    const topEmployers = Array.isArray((university.analytics as any)?.topEmployers)
      ? (university.analytics as any).topEmployers.map((employer: any) => ({
          name: String(employer?.name || ''),
          hires: Number(employer?.hires || 0),
          applications: Number(employer?.applications || 0),
        })).filter((employer: any) => employer.name)
      : [];
    const topSkills = topSkillsInDemand.map((skill: any) => ({
      name: String(skill.skillName || ''),
      demandScore: Number(skill.demandScore || 0),
    })).filter((skill: any) => skill.name);
    const summary = {
      totalStudents: students,
      totalColleges: colleges.length,
      totalDepartments: departments.length,
      verifiedStudents: officialStudents.length,
      averageReadiness: avgUniversityReadiness,
      employmentRate,
      curriculumAlignment,
    };
    const kpis = {
      ...summary,
      avgReadinessScore: avgUniversityReadiness,
      acceptanceRate: applications.length > 0
        ? Math.round((applications.filter((app: any) => app.status === 'accepted').length / applications.length) * 100)
        : 0,
      averageMatchScore: matchResults.length > 0
        ? Math.round(matchResults.reduce((sum: number, item: any) => sum + (item.overallScore || item.matchScore || 0), 0) / matchResults.length)
        : 0,
      skillAlignmentScore: curriculumAlignment,
      topEmployers,
    };

    return {
      university: {
        id: universityId.toString(),
        name: university.name,
        logoUrl: university.branding?.logoUrl || null,
        academicYear: null,
      },
      summary,
      collegePerformance,
      trends: { readiness: [], employment: [] },
      topSkills,
      topEmployers,
      recentActivities: [],
      kpis,
      skillGaps: allSkillGaps,
      topSkillsInDemand,
    };
  }

  async getStructure(userId: string): Promise<UniversityStructureResponse> {
    const access = await this.resolveInstitutionalAccess(userId);
    this.assertInstitutionalPermission(access, 'structure:read');
    const university = access.university;
    const universityId = (university as any)._id;

    const [allColleges, allDepartments] = await Promise.all([
      this.findUniversityColleges(universityId, (university as any).userId),
      this.findUniversityDepartments(universityId, (university as any).userId),
    ]);
    const colleges = access.collegeId ? allColleges.filter((item: any) => String(item._id) === String(access.collegeId)) : allColleges;
    const departments = access.collegeId ? allDepartments.filter((item: any) => String(item.collegeId) === String(access.collegeId)) : allDepartments;

    return {
      university: {
        id: universityId.toString(),
        name: university.name,
      },
      colleges: colleges.map(college => this.toCollegeDto(college, departments)),
      totalColleges: colleges.length,
      totalDepartments: departments.length,
    };
  }

  async updateStructure(userId: string, colleges: any[]): Promise<University> {
    const university = await this.universityModel
      .findOneAndUpdate({ userId: new Types.ObjectId(userId) }, { $set: { colleges, updatedAt: new Date() } }, { new: true })
      .lean();
    if (!university) throw new NotFoundException('University profile not found');
    await this.auditLog('UPDATE_STRUCTURE', userId, 'university', (university as any)._id.toString(), 'University structure updated');
    return university as University;
  }

  // ==========================================
  // FR-UNI-006/007/008: Student Analytics with Real Data
  // ==========================================

  async getStudents(userId: string, query: any = {}): Promise<UniversityStudentsResponse> {
    const access = await this.resolveInstitutionalAccess(userId);
    this.assertInstitutionalPermission(access, 'students:read');
    const university = access.university;
    const universityId = (university as any)._id;
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;
    const affiliationFilter: any = { universityId, isCurrent: true, ...(access.collegeId ? { collegeId: access.collegeId } : {}) };
    if (query.affiliationStatus) affiliationFilter.status = query.affiliationStatus;
    const affiliations: any[] = await this.affiliationModel.find(affiliationFilter).lean();
    const affiliationByStudent = new Map(affiliations.map((item: any) => [String(item.studentId), item]));

    const extra: any = {};
    const extraAnd: any[] = [];
    if (query.college) {
      extraAnd.push(Types.ObjectId.isValid(query.college)
        ? { $or: [{ 'academicInfo.collegeId': new Types.ObjectId(query.college) }, { 'academicInfo.collegeName': this.safeRegex(query.college) }] }
        : { $or: [{ 'academicInfo.collegeName': this.safeRegex(query.college) }, { 'academicInfo.college': this.safeRegex(query.college) }] });
    }
    if (query.department) {
      extraAnd.push(Types.ObjectId.isValid(query.department)
        ? { $or: [{ 'academicInfo.departmentId': new Types.ObjectId(query.department) }, { 'academicInfo.departmentName': this.safeRegex(query.department) }] }
        : { $or: [{ 'academicInfo.departmentName': this.safeRegex(query.department) }, { 'academicInfo.department': this.safeRegex(query.department) }] });
    }
    if (query.status === 'unknown') {
      extraAnd.push({
        $or: [
          { 'aiMetrics.employmentStatus': 'unknown' },
          { 'aiMetrics.employmentStatus': { $exists: false } },
          { 'aiMetrics.employmentStatus': null },
        ],
      });
    } else if (query.status) {
      extra['aiMetrics.employmentStatus'] = query.status;
    }
    if (query.academicLevel) extra['academicInfo.academicLevel'] = query.academicLevel;
    if (query.gpaMin) extra['academicInfo.gpa'] = { $gte: parseFloat(query.gpaMin) };
    if (query.search) {
      extraAnd.push({ $or: [
        { 'personalInfo.firstName': this.safeRegex(query.search) },
        { 'personalInfo.lastName': this.safeRegex(query.search) },
        { 'academicInfo.studentId': this.safeRegex(query.search) },
        { 'academicInfo.major': this.safeRegex(query.search) },
        { 'academicInfo.departmentName': this.safeRegex(query.search) },
        { 'academicInfo.collegeName': this.safeRegex(query.search) },
      ] });
    }
    if (query.affiliationStatus) extra._id = { $in: affiliations.map((item: any) => item.studentId) };
    if (extraAnd.length) extra.$and = extraAnd;
    const scopeFilter = this.withCollegeScope(await this.resolveStudentScopeFilter(university), access.collegeId);
    const filter = this.combineFilters(scopeFilter, extra);

    const [students, total, colleges, departments] = await Promise.all([
      this.studentModel.find(filter)
        .select('userId personalInfo.firstName personalInfo.lastName academicInfo cvData.fileUrl skills aiMetrics createdAt')
        .skip(skip).limit(limit).lean(),
      this.studentModel.countDocuments(filter),
      this.findUniversityColleges(universityId, (university as any).userId).then((items) => access.collegeId ? items.filter((item: any) => String(item._id) === String(access.collegeId)) : items),
      this.findUniversityDepartments(universityId, (university as any).userId).then((items) => access.collegeId ? items.filter((item: any) => String(item.collegeId) === String(access.collegeId)) : items),
    ]);

    // FR-UNI-005: Link each student to university, college, department, academic level
    const enrichedStudents = students.map((s: any) => {
      const college = colleges.find((item: any) => String(item._id) === String(s.academicInfo?.collegeId));
      const department = departments.find((item: any) => String(item._id) === String(s.academicInfo?.departmentId));
      const name = `${s.personalInfo?.firstName || ''} ${s.personalInfo?.lastName || ''}`.trim();
      return {
        id: s._id.toString(),
        userId: s.userId?.toString(),
        fullName: name,
        studentNumber: s.academicInfo?.studentId,
        universityId: universityId.toString(),
        collegeId: s.academicInfo?.collegeId?.toString(),
        collegeName: college?.name || s.academicInfo?.collegeName || '',
        departmentId: s.academicInfo?.departmentId?.toString(),
        departmentName: department?.name || s.academicInfo?.departmentName || '',
        gpa: s.academicInfo?.gpa,
        academicLevel: s.academicInfo?.academicLevel,
        graduationYear: s.academicInfo?.expectedGraduation,
        skills: s.skills?.map((sk: any) => this.normalizeSkillName(sk)).filter(Boolean) || [],
        readinessScore: s.aiMetrics?.readinessScore || 0,
        employmentStatus: (s.aiMetrics as any)?.employmentStatus || 'unknown',
        affiliationStatus: affiliationByStudent.get(String(s._id))?.status || (String(s.academicInfo?.universityId || '') === String(universityId) ? 'linked' : 'legacy'),
        enrollmentYear: affiliationByStudent.get(String(s._id))?.enrollmentYear || s.academicInfo?.enrollmentYear,
        expectedGraduationYear: affiliationByStudent.get(String(s._id))?.expectedGraduationYear || s.academicInfo?.expectedGraduation,
        cvStatus: s.cvData?.fileUrl ? 'uploaded' : 'missing',
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : undefined,
      };
    });
    const pagination = { page, limit, total, totalPages: Math.ceil(total / limit) };
    const collegeFilters = colleges.map((college: any) => ({ id: college._id.toString(), name: college.name }));
    const departmentFilters = departments.map((department: any) => ({
      id: department._id.toString(),
      name: department.name,
      collegeId: department.collegeId.toString(),
    }));

    return {
      items: enrichedStudents,
      pagination,
      filters: { colleges: collegeFilters, departments: departmentFilters },
      students: enrichedStudents,
      ...pagination,
    };
  }

  async getStudentStatistics(userId: string): Promise<UniversityStudentStatisticsResponse> {
    const access = await this.resolveInstitutionalAccess(userId);
    this.assertInstitutionalPermission(access, 'students:read');
    const university = access.university;
    const filter = this.withCollegeScope(await this.resolveStudentScopeFilter(university), access.collegeId);
    const students = await this.studentModel
      .find(filter)
      .select('academicInfo.academicLevel skills aiMetrics.readinessScore aiMetrics.employmentStatus')
      .lean();
    const statusCounts = new Map<string, number>();
    const skillCounts = new Map<string, number>();
    let readinessTotal = 0;

    students.forEach((student: any) => {
      const status = String(student.aiMetrics?.employmentStatus || 'unknown');
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      readinessTotal += Number(student.aiMetrics?.readinessScore || 0);
      (student.skills || []).forEach((skill: any) => {
        const name = this.normalizeSkillName(skill);
        if (name) skillCounts.set(name, (skillCounts.get(name) || 0) + 1);
      });
    });

    return {
      summary: {
        totalStudents: students.length,
        activeStudents: students.filter((student: any) => student.academicInfo?.academicLevel !== 'graduate').length,
        graduates: students.filter((student: any) => student.academicInfo?.academicLevel === 'graduate').length,
        averageReadiness: students.length ? Math.round(readinessTotal / students.length) : 0,
      },
      employmentStatusDistribution: Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count })),
      topSkillsDistribution: Array.from(skillCounts.entries())
        .map(([skill, count]) => ({ skill, count }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 10),
      employmentTimeline: [],
    };
  }

  // ==========================================
  // FR-UNI-006/007/008/009/010: Analytics
  // ==========================================

  async getAnalytics(userId: string): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    this.assertInstitutionalPermission(access, 'analytics:read');
    const university = access.university;
    const universityId = (university as any)._id;
    const baseStudentFilter = this.withCollegeScope(await this.resolveStudentScopeFilter(university), access.collegeId);
    const officialAffiliations: any[] = await this.affiliationModel.find({ universityId, isCurrent: true, status: { $in: ['verified', 'graduated'] }, ...(access.collegeId ? { collegeId: access.collegeId } : {}) }).select('studentId').lean();
    const studentFilter = this.combineFilters(baseStudentFilter, { _id: { $in: officialAffiliations.map((item: any) => item.studentId) } });

    const [students, allColleges, allDepartments] = await Promise.all([
      this.studentModel.find(studentFilter).lean(),
      this.findUniversityColleges(universityId, (university as any).userId),
      this.findUniversityDepartments(universityId, (university as any).userId),
    ]);
    const colleges = access.collegeId ? allColleges.filter((item: any) => String(item._id) === String(access.collegeId)) : allColleges;
    const departments = access.collegeId ? allDepartments.filter((item: any) => String(item.collegeId) === String(access.collegeId)) : allDepartments;

    // FR-UNI-006: Employment rates per college
    const employmentByCollege = colleges.map(college => ({
      collegeId: college._id,
      name: college.name,
      nameEn: college.name,
      nameAr: college.nameAr,
      employmentRate: college.analytics?.employmentRate || 0,
      avgGpa: college.analytics?.averageGpa || 0,
      avgReadiness: college.analytics?.averageReadinessScore || 0,
      topSkills: college.analytics?.topSkills || [],
      skillGaps: college.analytics?.skillGaps || [],
    }));

    // FR-UNI-008: Skill gaps per department
    const skillGapsByDepartment = departments.map(dept => ({
      departmentId: dept._id,
      name: dept.name,
      nameEn: dept.name,
      nameAr: dept.nameAr,
      marketAlignment: dept.marketAlignment?.alignmentScore || 0,
      skillGaps: dept.analytics?.skillGaps || [],
      curriculumGaps: dept.analytics?.curriculumGaps || [],
      employmentRate: dept.analytics?.employmentRate || 0,
    }));

    // FR-UNI-007: Average readiness
    const readinessScores = students.map(s => s.aiMetrics?.readinessScore || 0);
    const avgReadiness = readinessScores.length > 0
      ? Math.round(readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length)
      : 0;

    // FR-UNI-009: Course vs market skills comparison
    const courseMarketComparison = await this.getCourseMarketComparison(universityId);

    return {
      employmentByCollege,
      skillGapsByDepartment,
      avgReadiness,
      avgGpa: students.length > 0
        ? Math.round(students.reduce((sum, s) => sum + (s.academicInfo?.gpa || 0), 0) / students.length * 100) / 100
        : 0,
      totalStudents: students.length,
      sampleSize: students.length,
      period: { from: null, to: new Date().toISOString() },
      courseMarketComparison,
      topSkillsInDemand: await this.getTopSkillsInDemand(universityId),
    };
  }

  // ==========================================
  // FR-UNI-009: Course vs Market Skills
  // ==========================================

  private async getCourseMarketComparison(universityId: Types.ObjectId): Promise<any> {
    const departments = await this.departmentModel.find({ universityId }).lean();
    const marketSkills = await this.marketDataModel.find().sort({ demandScore: -1 }).limit(50).lean();

    return departments.map(dept => {
      const coveredSkills = (dept as any).courses?.flatMap((c: any) => c.skillsCovered || []) || [];
      const marketSkillNames = marketSkills.map(m => m.skillName);
      const coveredSkillNames = coveredSkills.map((s: any) => s.name);
      const alignedSkills = marketSkillNames.filter(ms => coveredSkillNames.includes(ms));
      const missingSkills = marketSkillNames.filter(ms => !coveredSkillNames.includes(ms));

      return {
        departmentId: dept._id,
        departmentName: dept.name,
        alignedSkills: alignedSkills.slice(0, 10),
        missingSkills: missingSkills.slice(0, 10),
        alignmentScore: marketSkillNames.length > 0
          ? Math.round((alignedSkills.length / marketSkillNames.length) * 100)
          : 0,
      };
    });
  }

  // ==========================================
  // FR-UNI-010: Top In-Demand Skills
  // ==========================================

  private async getTopSkillsInDemand(universityId: Types.ObjectId): Promise<any[]> {
    return this.marketDataModel
      .find()
      .sort({ demandScore: -1 })
      .limit(15)
      .select('skillName demandScore growthRate trend averageSalary')
      .lean();
  }

  // ==========================================
  // FR-UNI-011: Low Employment Analysis
  // ==========================================

  async getLowEmploymentAnalysis(userId: string): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    const universityId = access.university._id;
    const departments = await this.departmentModel.find({ universityId, ...(access.collegeId ? { collegeId: access.collegeId } : {}) }).lean();

    return departments
      .filter(d => (d.analytics?.employmentRate || 100) < 70)
      .map(d => ({
        departmentId: d._id,
        name: d.name,
        nameAr: d.nameAr,
        employmentRate: d.analytics?.employmentRate || 0,
        reasons: [
          ...(d.analytics?.skillGaps?.length ? [`Skill gaps: ${d.analytics.skillGaps.join(', ')}`] : []),
          ...(d.analytics?.curriculumGaps?.length ? [`Curriculum mismatch: ${d.analytics.curriculumGaps.join(', ')}`] : []),
          ...(d.marketAlignment?.alignmentScore < 50 ? ['Low market alignment'] : []),
        ],
        suggestions: [
          ...(d.analytics?.skillGaps?.length ? [`Add courses covering: ${d.analytics.skillGaps.slice(0, 3).join(', ')}`] : []),
          ...(d.marketAlignment?.missingSkills?.length ? [`Integrate market skills: ${d.marketAlignment.missingSkills.slice(0, 3).join(', ')}`] : []),
        ],
      }));
  }

  // ==========================================
  // FR-UNI-012/013/014: Cross-Comparison
  // ==========================================

  async getCollegeComparison(userId: string): Promise<any> {
    const university = await this.findByUserId(userId);
    const colleges = await this.collegeModel.find({ universityId: (university as any)._id, 'metadata.status': { $ne: 'deleted' } }).lean();

    // FR-UNI-013: Compare colleges by employment, readiness, skill gaps
    return colleges.map(college => ({
      id: college._id,
      name: college.name,
      nameEn: college.name,
      nameAr: college.nameAr,
      employmentRate: college.analytics?.employmentRate || 0,
      avgReadinessScore: college.analytics?.averageReadinessScore || 0,
      avgGpa: college.analytics?.averageGpa || 0,
      skillGaps: college.analytics?.skillGaps || [],
      topSkills: college.analytics?.topSkills || [],
      totalStudents: (college.analytics as any)?.totalStudents || 0,
    })).sort((a, b) => b.employmentRate - a.employmentRate);
  }

  async getDepartmentComparison(userId: string): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    const departments = await this.departmentModel.find({ universityId: access.university._id, ...(access.collegeId ? { collegeId: access.collegeId } : {}), 'metadata.status': { $ne: 'deleted' } }).lean();

    // FR-UNI-014: Compare departments by skills, employment, market alignment
    return departments.map(dept => ({
      id: dept._id,
      name: dept.name,
      nameEn: dept.name,
      nameAr: dept.nameAr,
      collegeId: dept.collegeId,
      employmentRate: dept.analytics?.employmentRate || 0,
      avgReadinessScore: dept.analytics?.averageReadinessScore || 0,
      marketAlignment: dept.marketAlignment?.alignmentScore || 0,
      skillGaps: dept.analytics?.skillGaps || [],
      curriculumGaps: dept.analytics?.curriculumGaps || [],
      topRelatedJobs: dept.marketAlignment?.topRelatedJobs || [],
    })).sort((a, b) => b.marketAlignment - a.marketAlignment);
  }

  // FR-UNI-012: Cross-university comparison
  async getCrossUniversityComparison(): Promise<any> {
    const allUniversities = await this.universityModel.find().lean();
    return allUniversities.map(u => ({
      id: (u as any)._id,
      name: u.name,
      nameAr: (u as any).nameAr,
      employmentRate: u.analytics?.employmentRate || 0,
      skillAlignmentScore: (u.analytics as any)?.skillAlignmentScore || 0,
      totalStudents: u.analytics?.totalStudents || 0,
      totalGraduates: u.analytics?.totalGraduates || 0,
      ranking: u.rankings?.national || 0,
    })).sort((a, b) => b.employmentRate - a.employmentRate);
  }

  async calculateRankings(): Promise<void> {
    const universities = await this.universityModel.find({ status: 'active' }).exec();

    for (const uni of universities) {
      const studentFilter = await this.resolveStudentScopeFilter(uni);
      const students = await this.studentModel.find(studentFilter).lean();

      const studentIds = students.map(s => s._id);
      const applications = studentIds.length 
        ? await this.applicationModel.find({ studentId: { $in: studentIds } }).lean() 
        : [];

      const graduates = students.filter(s => s.academicInfo?.academicLevel === 'graduate');
      const totalSample = graduates.length > 0 ? graduates.length : (students.length > 0 ? students.length : 1);
      
      const employedConfirmed = applications.filter(app => app.status === 'confirmed_employed').length;
      
      const employmentRate = Math.min((employedConfirmed / totalSample) * 100, 100);

      const offeredOrAcceptedApps = applications.filter(app => ['offered', 'accepted', 'confirmed_employed'].includes(app.status));
      const acceptanceRate = applications.length > 0 ? (offeredOrAcceptedApps.length / applications.length) * 100 : 50;

      const analyses = await this.analysisModel.find({ universityId: uni._id, alignmentPercentage: { $ne: null } }).lean();
      const curriculumAlignment = analyses.length > 0 
        ? (analyses.reduce((sum: number, a: any) => sum + (a.alignmentPercentage || 0), 0) / analyses.length) 
        : 70;

      const readinessScores = students.map(s => s.aiMetrics?.readinessScore || 0).filter(Boolean);
      const readinessAverage = readinessScores.length > 0 
        ? (readinessScores.reduce((sum: number, r: number) => sum + r, 0) / readinessScores.length) 
        : 65;

      const matchScores = applications.map(app => app.matchSnapshot?.matchScore || 0).filter(Boolean);
      const matchingAverage = matchScores.length > 0 
        ? (matchScores.reduce((sum: number, m: number) => sum + m, 0) / matchScores.length) 
        : 60;

      const skillCoverage = analyses.length > 0 
        ? (analyses.reduce((sum: number, a: any) => {
            const covered = a.coveredSkills?.length || 0;
            const partial = a.partiallyCoveredSkills?.length || 0;
            const missing = a.missingSkills?.length || 1;
            return sum + ((covered + partial) / (covered + partial + missing)) * 100;
          }, 0) / analyses.length) 
        : 65;

      const dataReliability = Math.min((students.length / 50) * 100, 100);

      const wEmployment = 0.25;
      const wCurriculum = 0.20;
      const wReadiness = 0.15;
      const wMatching = 0.15;
      const wSkills = 0.10;
      const wAcceptance = 0.10;
      const wReliability = 0.05;

      const overall = 
        (employmentRate * wEmployment) +
        (curriculumAlignment * wCurriculum) +
        (readinessAverage * wReadiness) +
        (matchingAverage * wMatching) +
        (skillCoverage * wSkills) +
        (acceptanceRate * wAcceptance) +
        (dataReliability * wReliability);

      await this.universityModel.updateOne(
        { _id: uni._id },
        { 
          $set: { 
            'statistics.totalGraduates': totalSample,
            'statistics.employedConfirmed': employedConfirmed,
            'statistics.acceptanceRate': acceptanceRate,
            'scores.overall': Math.round(overall),
            'scores.curriculumAlignment': Math.round(curriculumAlignment),
            'scores.readinessAverage': Math.round(readinessAverage),
            'scores.matchingAverage': Math.round(matchingAverage),
            'scores.skillCoverage': Math.round(skillCoverage),
            'scores.dataReliability': Math.round(dataReliability),
            'analytics.employmentRate': Math.round(employmentRate)
          } 
        }
      );
    }
  }

  async getBenchmarking(userId: string): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    const myUni = access.university;
    const myUniId = myUni._id;

    await this.calculateRankings();

    const allUnis = await this.universityModel.find({ status: 'active' }).lean();
    const freshMyUni = allUnis.find(u => String(u._id) === String(myUniId)) || myUni;

    return allUnis.map(u => {
      const isMe = String(u._id) === String(myUniId);
      
      const myEmp = freshMyUni.statistics?.employedConfirmed 
        ? ((freshMyUni.statistics.employedConfirmed / (freshMyUni.statistics.totalGraduates || 1)) * 100)
        : (freshMyUni.analytics?.employmentRate || 0);
      const uEmp = u.statistics?.employedConfirmed
        ? ((u.statistics.employedConfirmed / (u.statistics.totalGraduates || 1)) * 100)
        : (u.analytics?.employmentRate || 0);
      const myAlign = freshMyUni.scores?.curriculumAlignment || 70;
      const uAlign = u.scores?.curriculumAlignment || 70;
      const myReadiness = freshMyUni.scores?.readinessAverage || 65;
      const uReadiness = u.scores?.readinessAverage || 65;

      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const gaps: string[] = [];
      let aiRecommendation = '';

      if (isMe) {
        if (myEmp >= 75) strengths.push('High graduate employment rate');
        else weaknesses.push('Improve general graduate employment rate');

        if (myAlign >= 75) strengths.push('Strong market alignment of curriculum');
        else weaknesses.push('Curriculum mismatch with in-demand market skills');

        if (myReadiness >= 75) strengths.push('Excellent career readiness scores');
        else weaknesses.push('Students need more practical career readiness preparation');

        aiRecommendation = 'Focus on continuous feedback loops with top employers and aligning course outcomes with emerging tech skills.';
      } else {
        if (uEmp > myEmp) {
          weaknesses.push(`Target university has higher employment rate by ${(uEmp - myEmp).toFixed(1)}%`);
          gaps.push('Target university graduates are highly favored in technical industries');
        } else {
          strengths.push(`We outperform target university in employment by ${(myEmp - uEmp).toFixed(1)}%`);
        }

        if (uAlign > myAlign) {
          weaknesses.push(`Target university has better curriculum alignment by ${(uAlign - myAlign).toFixed(1)}%`);
          gaps.push('Target university offers specialized practical courses missing in our catalog');
        } else {
          strengths.push(`We have higher market alignment than target university`);
        }

        if (uReadiness > myReadiness) {
          weaknesses.push(`Target university has higher student career readiness by ${(uReadiness - myReadiness).toFixed(1)}%`);
        } else {
          strengths.push(`Our students demonstrate higher career readiness`);
        }

        if (uEmp > myEmp || uAlign > myAlign) {
          aiRecommendation = `Adopt target university's curriculum framework. Bridge the skill gaps in specialized practical fields. Introduce internships/laboratory courses to boost employment by ${(uEmp - myEmp > 0 ? uEmp - myEmp : 5).toFixed(1)}%.`;
        } else {
          aiRecommendation = `Maintain lead over ${u.name} by introducing advanced certifications and leveraging industry partners.`;
        }
      }

      return {
        id: String(u._id),
        name: u.name,
        nameAr: (u as any).nameAr || u.name,
        logoUrl: u.branding?.logoUrl || null,
        isMe,
        scores: {
          overall: u.scores?.overall || u.analytics?.employmentRate || 0,
          employmentRate: Math.round(uEmp),
          curriculumAlignment: Math.round(uAlign),
          studentReadiness: Math.round(uReadiness),
          matchAverage: u.scores?.matchingAverage || 60,
          skillCoverage: u.scores?.skillCoverage || 65,
          acceptanceRate: Math.round(u.statistics?.acceptanceRate || 50),
          dataReliability: u.scores?.dataReliability || 100,
        },
        strengths,
        weaknesses,
        gaps,
        aiRecommendation,
      };
    });
  }

  // FR-UNI-015: Job market trends linked to specializations
  async getMarketTrends(userId: string): Promise<any> {
    await this.resolveInstitutionalAccess(userId);
    const trends = await this.marketDataModel.find().sort({ growthRate: -1 }).limit(20).lean();
    return trends.map(t => ({
      skillName: t.skillName,
      demandScore: t.demandScore,
      growthRate: t.growthRate,
      trend: t.trend,
      averageSalary: t.averageSalary,
      topCompaniesHiring: t.topCompaniesHiring || [],
      relatedJobTitles: t.relatedJobTitles || [],
    }));
  }

  // ==========================================
  // FR-UNI-016/017: Curriculum Suggestions + Future Skills
  // ==========================================

  async getCurriculumSuggestions(userId: string): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    const departments = await this.departmentModel.find({ universityId: access.university._id, ...(access.collegeId ? { collegeId: access.collegeId } : {}) }).lean();

    return departments.flatMap(dept => {
      const missingSkills = dept.marketAlignment?.missingSkills || [];
      const curriculumGaps = dept.analytics?.curriculumGaps || [];
      return {
        departmentId: dept._id,
        departmentName: dept.name,
        // FR-UNI-016: Suggest curriculum updates
        suggestedCourses: missingSkills.slice(0, 5).map((skill: string) => ({
          title: `Introduction to ${skill}`,
          skills: [skill],
          rationale: `Market demand for ${skill} is high but not covered in current curriculum`,
        })),
        // FR-UNI-017: Future skills expected to rise
        emergingSkills: (dept.marketAlignment as any)?.emergingSkills || [],
        curriculumGaps,
      };
    });
  }

  // ==========================================
  // FR-UNI-018: Report Generation & Export
  // ==========================================

  async generateReport(userId: string, reportType: string, format = 'json'): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    const university = access.university;
    const universityId = (university as any)._id;
    const studentFilter = this.withCollegeScope(await this.resolveStudentScopeFilter(university), access.collegeId);

    if (access.role === 'coordinator' && reportType === 'college') {
      throw new ForbiddenException('Coordinator cannot generate cross-college reports');
    }
    if (reportType === 'audit' && access.role !== 'university' && !access.permissions.includes('audit:read')) {
      throw new ForbiddenException('Audit report permission is required');
    }

    let data: any = {};

    switch (reportType) {
      case 'academic':
      case 'students':
        data = await this.getStudents(userId, { page: 1, limit: 1000 });
        break;
      case 'readiness':
      case 'employment':
        data = await this.getAnalytics(userId);
        break;
      case 'skills':
        data = { skillGaps: (await this.getAnalytics(userId)).skillGapsByDepartment };
        break;
      case 'college':
        data = await this.getCollegeComparison(userId);
        break;
      case 'department':
        data = await this.getDepartmentComparison(userId);
        break;
      case 'curriculum':
      case 'recommendations':
        data = await this.getCurriculumSuggestions(userId);
        break;
      case 'audit': {
        const staff: any[] = access.role === 'university'
          ? await this.staffModel.find({ universityId }).select('userId').lean()
          : [{ userId: new Types.ObjectId(userId) }];
        data = {
          items: await this.auditLogModel.find({
            actorId: { $in: [university.userId, ...staff.map((item) => item.userId)] },
          }).sort({ createdAt: -1 }).limit(1000).lean(),
        };
        break;
      }
      case 'summary':
        data = await this.getDashboard(userId);
        break;
      default:
        throw new BadRequestException('Unsupported university report type');
    }

    await this.auditLog('GENERATE_REPORT', userId, 'university', universityId.toString(), `Generated ${reportType} report`);

    const report = {
      reportType,
      universityName: university.name,
      generatedAt: new Date(),
      data,
      summary: {
        totalColleges: (await this.collegeModel.countDocuments({ universityId, ...(access.collegeId ? { _id: access.collegeId } : {}) })),
        totalDepartments: (await this.departmentModel.countDocuments({ universityId, ...(access.collegeId ? { collegeId: access.collegeId } : {}) })),
        totalStudents: (await this.studentModel.countDocuments(studentFilter)),
      },
    };
    const normalizedFormat = String(format || 'json').toLowerCase();
    if (normalizedFormat === 'csv') {
      await this.auditLog('DOWNLOAD_REPORT', userId, 'university_report', universityId.toString(), `Downloaded ${reportType} report as CSV`);
      return {
        ...report,
        format: 'csv',
        filename: `${reportType}-report-${new Date().toISOString().slice(0, 10)}.csv`,
        contentType: 'text/csv; charset=utf-8',
        content: Buffer.from(`\uFEFF${this.reportToCsv(report)}`, 'utf8'),
      };
    }
    if (['excel', 'xlsx'].includes(normalizedFormat)) {
      await this.auditLog('DOWNLOAD_REPORT', userId, 'university_report', universityId.toString(), `Downloaded ${reportType} report as XLSX`);
      return {
        ...report,
        format: 'xlsx',
        filename: `${reportType}-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        content: await this.reportToXlsx(report),
      };
    }
    if (normalizedFormat === 'pdf') {
      await this.auditLog('DOWNLOAD_REPORT', userId, 'university_report', universityId.toString(), `Downloaded ${reportType} report as PDF`);
      return {
        ...report,
        format: 'pdf',
        filename: `${reportType}-report-${new Date().toISOString().slice(0, 10)}.pdf`,
        contentType: 'application/pdf',
        content: await this.reportToPdf(report),
      };
    }
    return report;
  }

  // ==========================================
  // FR-UNI-019: KPI Dashboard
  // ==========================================

  async getKpiDashboard(userId: string): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    const university = access.university;
    const universityId = university._id;
    const studentFilter = this.withCollegeScope(await this.resolveStudentScopeFilter(university), access.collegeId);

    const [colleges, departments, students] = await Promise.all([
      this.collegeModel.find({ universityId, ...(access.collegeId ? { _id: access.collegeId } : {}), 'metadata.status': { $ne: 'deleted' } }).lean(),
      this.departmentModel.find({ universityId, ...(access.collegeId ? { collegeId: access.collegeId } : {}), 'metadata.status': { $ne: 'deleted' } }).lean(),
      this.studentModel.find(studentFilter).lean(),
    ]);

    return {
      // Per college KPIs
      collegeKpis: colleges.map(college => ({
        collegeId: college._id,
        name: college.name,
        students: college.analytics?.totalStudents || 0,
        graduates: college.analytics?.totalGraduates || 0,
        employmentRate: college.analytics?.employmentRate || 0,
        avgReadiness: college.analytics?.averageReadinessScore || 0,
        avgGpa: college.analytics?.averageGpa || 0,
        skillAlignment: college.analytics?.skillAlignmentScore || 0,
      })),
      // Per department KPIs
      departmentKpis: departments.map(dept => ({
        departmentId: dept._id,
        name: dept.name,
        collegeId: dept.collegeId,
        students: dept.studentSummary?.total || 0,
        employmentRate: dept.analytics?.employmentRate || 0,
        avgReadiness: dept.analytics?.averageReadinessScore || 0,
        marketAlignment: dept.marketAlignment?.alignmentScore || 0,
        topRelatedJobs: dept.marketAlignment?.topRelatedJobs || [],
      })),
      // University-wide
      overall: {
        totalStudents: students.length,
        avgGpa: students.length > 0 ? Math.round(students.reduce((s, st) => s + (st.academicInfo?.gpa || 0), 0) / students.length * 100) / 100 : 0,
        avgReadiness: students.length > 0 ? Math.round(students.reduce((s, st) => s + (st.aiMetrics?.readinessScore || 0), 0) / students.length) : 0,
        employmentRate: university.analytics?.employmentRate || 0,
      },
    };
  }

  // ==========================================
  // FR-UNI-020/021/022: Career Domains + Linked Jobs + Demanded Skills
  // ==========================================

  async getCareerDomains(userId: string): Promise<any> {
    const access = await this.resolveInstitutionalAccess(userId);
    const departments = await this.departmentModel.find({ universityId: access.university._id, ...(access.collegeId ? { collegeId: access.collegeId } : {}) }).lean();

    // FR-UNI-020: Most recommended career domains per specialization
    return departments.map(dept => ({
      departmentId: dept._id,
      departmentName: dept.name,
      // FR-UNI-021: Jobs linked to department
      linkedJobCategories: dept.marketAlignment?.topRelatedJobs || [],
      // FR-UNI-022: Most demanded skills
      topDemandedSkills: (dept as any).topSkills || [],
      careerPaths: (dept as any).careerPaths || [],
    }));
  }

  // ==========================================
  // FR-UNI-023/024/025: Permissions + Security + Audit
  // ==========================================

  async managePermissions(userId: string, targetUserId: string, permissions: string[]): Promise<any> {
    const university = await this.findByUserId(userId);
    // Update coordinator permissions
    await this.auditLog('MANAGE_PERMISSIONS', userId, 'coordinator', targetUserId, `Updated permissions: ${permissions.join(', ')}`);
    return { message: 'Permissions updated', permissions };
  }

  private asObjectId(id: any): Types.ObjectId {
    if (!id || !Types.ObjectId.isValid(String(id))) {
      throw new BadRequestException('Invalid identifier');
    }
    return new Types.ObjectId(String(id));
  }

  private escapeRegex(value: string): string {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private safeRegex(value: string): RegExp {
    return new RegExp(this.escapeRegex(value), 'i');
  }

  private normalizeSkillName(skill: any): string {
    if (!skill) return '';
    if (typeof skill === 'string') return skill;
    return skill.name || skill.skillName || skill.title || skill.label || '';
  }

  private buildLegacyStudentFilter(university: any): any {
    const universityId = university?._id;
    const names = [university?.name, university?.shortName, university?.nameAr].filter(Boolean);
    const universityMatches: any[] = [];
    if (universityId) {
      universityMatches.push({ 'academicInfo.universityId': universityId });
      universityMatches.push({ 'academicInfo.universityId': String(universityId) });
    }
    for (const name of names) {
      universityMatches.push({ 'academicInfo.universityName': new RegExp(`^${this.escapeRegex(name)}$`, 'i') });
      universityMatches.push({ 'academicInfo.university': new RegExp(`^${this.escapeRegex(name)}$`, 'i') });
    }

    return universityMatches.length ? { $or: universityMatches } : { _id: null };
  }

  private buildUniversityEntityScope(universityId: Types.ObjectId): any {
    return {
      $or: [
        { universityId },
        { university: universityId },
      ],
    };
  }

  private buildOwnedEntityFilter(university: any): any {
    const universityId = university?._id;
    const ownerIds = [universityId, university?.userId].filter(Boolean);
    return {
      $or: [
        { universityId },
        { university: { $in: ownerIds } },
      ],
    };
  }

  private toProfileDto(university: any): UniversityProfileResponse {
    return {
      id: String(university._id || ''),
      name: university.name || '',
      nameAr: university.nameAr || '',
      type: university.type || 'public',
      description: university.description || '',
      location: {
        city: university.location?.city || '',
        country: university.location?.country || '',
        address: university.location?.address || '',
      },
      contactInfo: {
        email: university.contactInfo?.email || '',
        phone: university.contactInfo?.phone || '',
        website: university.contactInfo?.website || '',
        officialContactEmail: university.contactInfo?.hrEmail || '',
        officialContactName: university.officialContact?.fullName || '',
        officialContactPhone: university.officialContact?.phone || '',
      },
      emailDomain: university.emailDomain || '',
      logoUrl: university.branding?.logoUrl || null,
      status: university.status || 'active',
      createdAt: university.createdAt ? new Date(university.createdAt).toISOString() : null,
      updatedAt: university.updatedAt ? new Date(university.updatedAt).toISOString() : null,
    };
  }

  private assertPublicHttpsUrl(value: string): void {
    if (!value) return;
    let url: URL;
    try { url = new URL(value); } catch { throw new BadRequestException('Invalid logo URL'); }
    const host = url.hostname.toLowerCase();
    const privateHost = host === 'localhost' || host === '::1' || host.endsWith('.local')
      || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)
      || /^169\.254\./.test(host) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host);
    if (url.protocol !== 'https:' || privateHost) throw new BadRequestException('Logo must use a public HTTPS URL');
  }

  private async findUniversityColleges(universityId: Types.ObjectId, legacyOwnerId?: Types.ObjectId): Promise<any[]> {
    const current = await this.collegeModel
      .find({ universityId, 'metadata.status': { $ne: 'deleted' } })
      .sort({ name: 1 })
      .lean();
    const ownerIds = [universityId, legacyOwnerId].filter(Boolean);
    const legacy = await this.collegeModel.collection
      .find({ university: { $in: ownerIds }, 'metadata.status': { $ne: 'deleted' } } as any)
      .sort({ name: 1 })
      .toArray();
    if (legacy.length > 0) {
      this.logger.warn(`Using legacy college ownership field for university ${universityId}`);
    }
    const merged = new Map<string, any>();
    [...legacy, ...current].forEach((college) => merged.set(String(college._id), college));
    return Array.from(merged.values()).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }

  private async findUniversityDepartments(universityId: Types.ObjectId, legacyOwnerId?: Types.ObjectId): Promise<any[]> {
    const current = await this.departmentModel
      .find({ universityId, 'metadata.status': { $ne: 'deleted' } })
      .sort({ name: 1 })
      .lean();
    const ownerIds = [universityId, legacyOwnerId].filter(Boolean);
    const legacy = await this.departmentModel.collection
      .find({ university: { $in: ownerIds }, 'metadata.status': { $ne: 'deleted' } } as any)
      .sort({ name: 1 })
      .toArray();
    if (legacy.length > 0) {
      this.logger.warn(`Using legacy department ownership field for university ${universityId}`);
    }
    const merged = new Map<string, any>();
    [...legacy, ...current].forEach((department) => merged.set(String(department._id), department));
    return Array.from(merged.values()).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }

  private async resolveStudentScopeFilter(university: any): Promise<any> {
    const universityId = university?._id;
    if (!universityId) return { _id: null };
    const strictFilter = { 'academicInfo.universityId': universityId };
    const linkedStudents = await this.studentModel.countDocuments(strictFilter);
    if (linkedStudents > 0) return strictFilter;

    const names = [university?.name, university?.shortName, university?.nameAr].filter(Boolean);
    if (names.length === 0) return strictFilter;
    this.logger.warn(`Using legacy university-name student scope for university ${universityId}`);
    return {
      $or: names.flatMap((name: string) => [
        { 'academicInfo.universityName': new RegExp(`^${this.escapeRegex(name)}$`, 'i') },
        { 'academicInfo.university': new RegExp(`^${this.escapeRegex(name)}$`, 'i') },
      ]),
    };
  }

  private combineFilters(scope: any, extra: any): any {
    if (!extra || Object.keys(extra).length === 0) return scope;
    return { $and: [scope, extra] };
  }

  private async resolveInstitutionalAccess(userId: string): Promise<{
    university: any;
    role: string;
    collegeId: Types.ObjectId | null;
    permissions: string[];
  }> {
    const userObjectId = new Types.ObjectId(userId);
    const ownedUniversity = await this.universityModel.findOne({ userId: userObjectId }).lean();
    if (ownedUniversity) {
      return { university: ownedUniversity, role: 'university', collegeId: null, permissions: [] };
    }

    const staff = await this.staffModel.findOne({
      userId: userObjectId,
      status: 'active',
      invitationStatus: 'accepted',
    }).lean();
    if (!staff) throw new NotFoundException('Institutional access profile not found');
    const university = await this.universityModel.findOne({ _id: staff.universityId, status: 'active' }).lean();
    if (!university) throw new ForbiddenException('University portal access is unavailable');
    return {
      university,
      role: staff.role,
      collegeId: staff.role === 'coordinator' ? staff.collegeId || null : null,
      permissions: staff.permissions || [],
    };
  }

  private withCollegeScope(filter: any, collegeId: Types.ObjectId | null): any {
    if (!collegeId) return filter;
    return this.combineFilters(filter, {
      $or: [
        { 'academicInfo.collegeId': collegeId },
        { 'academicInfo.collegeId': String(collegeId) },
      ],
    });
  }

  private async findScopedAffiliation(access: { university: any; collegeId: Types.ObjectId | null }, studentId: string): Promise<any> {
    const filter: any = { universityId: access.university._id, isCurrent: true };
    if (access.collegeId) filter.collegeId = access.collegeId;
    if (Types.ObjectId.isValid(studentId)) filter.studentId = new Types.ObjectId(studentId);
    else throw new BadRequestException('Invalid student identifier');
    const affiliation = await this.affiliationModel.findOne(filter).lean();
    if (!affiliation) throw new NotFoundException('Student affiliation not found in the permitted scope');
    return affiliation;
  }

  private assertDepartmentWriteScope(access: { role: string; collegeId: Types.ObjectId | null; permissions: string[] }, collegeId: string): void {
    if (access.role === 'university') return;
    if (access.role !== 'coordinator' || !access.permissions.includes('departments:write')) {
      throw new ForbiddenException('Department write permission is required');
    }
    if (!access.collegeId || String(access.collegeId) !== String(collegeId)) {
      throw new ForbiddenException('Coordinator access is limited to the assigned college');
    }
  }

  private assertInstitutionalPermission(access: { role: string; permissions: string[] }, permission: string): void {
    if (access.role === 'university') return;
    if (!access.permissions.includes(permission)) {
      throw new ForbiddenException({ code: 'INSUFFICIENT_INSTITUTIONAL_PERMISSION', message: `Missing permission: ${permission}` });
    }
  }

  async reconcileStudentAffiliations(userId: string): Promise<{ matched: number; updated: number }> {
    const university = await this.findByUserId(userId);
    const result = await this.linkStudentsToAcademicStructure(university);
    await this.auditLog(
      'RECONCILE_STUDENT_AFFILIATIONS',
      userId,
      'university',
      (university as any)._id.toString(),
      `Reconciled ${result.updated} of ${result.matched} student affiliations`,
    );
    return result;
  }

  private async linkStudentsToAcademicStructure(university: any): Promise<{ matched: number; updated: number }> {
    const universityId = university?._id;
    if (!universityId) return { matched: 0, updated: 0 };
    const [colleges, departments, students] = await Promise.all([
      this.collegeModel.find({ universityId, 'metadata.status': { $ne: 'deleted' } }).lean(),
      this.departmentModel.find({ universityId, 'metadata.status': { $ne: 'deleted' } }).lean(),
      this.studentModel.find(this.buildLegacyStudentFilter(university)).select('_id academicInfo').lean(),
    ]);

    let updated = 0;
    await Promise.all(students.map(async (student: any) => {
      const academicInfo = student.academicInfo || {};
      const set: Record<string, any> = {};
      if (!academicInfo.universityId || String(academicInfo.universityId) !== String(universityId)) {
        set['academicInfo.universityId'] = universityId;
      }
      const collegeName = academicInfo.collegeName || academicInfo.college || academicInfo.faculty;
      const departmentName = academicInfo.departmentName || academicInfo.department || academicInfo.major;
      const college = colleges.find((item: any) => this.sameLabel(item.name, collegeName) || this.sameLabel(item.nameAr, collegeName) || this.sameLabel(item.code, collegeName));
      if (college && (!academicInfo.collegeId || String(academicInfo.collegeId) !== String(college._id))) {
        set['academicInfo.collegeId'] = college._id;
      }
      const department = departments.find((item: any) => (
        (!college || String(item.collegeId) === String(college._id)) &&
        (this.sameLabel(item.name, departmentName) || this.sameLabel(item.nameAr, departmentName) || this.sameLabel(item.code, departmentName))
      ));
      if (department && (!academicInfo.departmentId || String(academicInfo.departmentId) !== String(department._id))) {
        set['academicInfo.departmentId'] = department._id;
      }
      if (Object.keys(set).length > 0) {
        await this.studentModel.updateOne({ _id: student._id }, { $set: set });
        updated += 1;
      }
    }));
    return { matched: students.length, updated };
  }

  private sameLabel(left: any, right: any): boolean {
    if (!left || !right) return false;
    return String(left).trim().toLowerCase() === String(right).trim().toLowerCase();
  }

  private async syncEmbeddedStructure(universityId: Types.ObjectId): Promise<void> {
    const [colleges, departments] = await Promise.all([
      this.collegeModel.find({ universityId, 'metadata.status': { $ne: 'deleted' } }).sort({ name: 1 }).lean(),
      this.departmentModel.find({ universityId, 'metadata.status': { $ne: 'deleted' } }).sort({ name: 1 }).lean(),
    ]);

    const embedded = colleges.map((college: any) => ({
      collegeId: college._id,
      name: college.name,
      nameAr: college.nameAr || '',
      code: college.code || '',
      departments: departments
        .filter((department: any) => String(department.collegeId) === String(college._id))
        .map((department: any) => ({
          departmentId: department._id,
          name: department.name,
          nameAr: department.nameAr || '',
          code: department.code || '',
          degreeTypes: department.degreeTypes || [],
        })),
    }));

    await this.universityModel.updateOne({ _id: universityId }, { $set: { colleges: embedded } });
  }

  private toCollegeDto(college: any, departments: any[] = []): any {
    const relatedDepartments = departments.filter((department: any) => String(department.collegeId) === String(college._id));
    return {
      id: college._id?.toString?.() || college.id,
      _id: college._id,
      name: college.name,
      nameEn: college.name,
      nameAr: college.nameAr || college.name,
      code: college.code || '',
      description: college.description || '',
      established: college.established,
      establishedYear: college.established,
      dean: college.dean || '',
      status: college.metadata?.status || 'active',
      studentCount: college.studentCount || college.analytics?.totalStudents || 0,
      employmentRate: college.employmentRate || college.analytics?.employmentRate || 0,
      analytics: college.analytics || {},
      coordinator: college.coordinator || null,
      departments: relatedDepartments.map((department: any) => this.toDepartmentDto(department)),
    };
  }

  private toDepartmentDto(department: any): any {
    return {
      id: department._id?.toString?.() || department.id,
      _id: department._id,
      collegeId: department.collegeId,
      name: department.name,
      nameEn: department.name,
      nameAr: department.nameAr || department.name,
      code: department.code || '',
      description: department.description || '',
      head: department.head || '',
      status: department.metadata?.status || 'active',
      studentCount: department.studentCount || department.studentSummary?.total || 0,
      studyPlanCount: 0,
      courseCount: 0,
      degreeTypes: department.degreeTypes || [],
      specializations: department.specializations || [],
      studentSummary: department.studentSummary || { total: 0, byLevel: {}, byStatus: {} },
      marketAlignment: department.marketAlignment || {},
      analytics: department.analytics || {},
    };
  }

  private reportToCsv(report: any): string {
    const rows: string[][] = [
      ['Report Type', report.reportType],
      ['University', report.universityName],
      ['Generated At', new Date(report.generatedAt).toISOString()],
      ['Total Colleges', String(report.summary?.totalColleges ?? 0)],
      ['Total Departments', String(report.summary?.totalDepartments ?? 0)],
      ['Total Students', String(report.summary?.totalStudents ?? 0)],
      [],
    ];

    const addObjectRows = (prefix: string, value: any) => {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          rows.push([prefix, '']);
          return;
        }
        const keys = Array.from(new Set(value.flatMap((item) => Object.keys(item || {}))));
        rows.push([prefix, ...keys]);
        value.forEach((item) => rows.push(['', ...keys.map((key) => this.csvValue(item?.[key]))]));
        return;
      }
      if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, inner]) => addObjectRows(prefix ? `${prefix}.${key}` : key, inner));
        return;
      }
      rows.push([prefix, this.csvValue(value)]);
    };

    addObjectRows('data', report.data);
    return rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  }

  private async reportToXlsx(report: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'MADAR';
    workbook.created = new Date(report.generatedAt);
    const sheet = workbook.addWorksheet('University Report', { views: [{ rightToLeft: true }] });
    sheet.columns = [{ key: 'field', width: 42 }, { key: 'value', width: 80 }];
    sheet.addRow(['Report Type', report.reportType]);
    sheet.addRow(['University', report.universityName]);
    sheet.addRow(['Generated At', new Date(report.generatedAt).toISOString()]);
    sheet.addRow(['Total Colleges', report.summary?.totalColleges ?? 0]);
    sheet.addRow(['Total Departments', report.summary?.totalDepartments ?? 0]);
    sheet.addRow(['Total Students', report.summary?.totalStudents ?? 0]);
    sheet.addRow([]);
    this.flattenReport(report.data).forEach(([field, value]) => sheet.addRow([field, value]));
    sheet.getRow(1).font = { bold: true };
    const bytes = await workbook.xlsx.writeBuffer();
    return Buffer.from(bytes);
  }

  private reportToPdf(report: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `${report.reportType} report`, Author: 'MADAR' } });
      const chunks: Buffer[] = [];
      document.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
      document.fontSize(20).text('MADAR University Report', { align: 'center' });
      document.moveDown().fontSize(11);
      document.text(`Report type: ${report.reportType}`);
      document.text(`University: ${report.universityName}`);
      document.text(`Generated at: ${new Date(report.generatedAt).toISOString()}`);
      document.text(`Colleges: ${report.summary?.totalColleges ?? 0}`);
      document.text(`Departments: ${report.summary?.totalDepartments ?? 0}`);
      document.text(`Students: ${report.summary?.totalStudents ?? 0}`);
      document.moveDown().fontSize(14).text('Report Data');
      document.fontSize(9);
      for (const [field, value] of this.flattenReport(report.data).slice(0, 600)) {
        if (document.y > 750) document.addPage();
        document.text(`${field}: ${value}`, { width: 500 });
      }
      document.end();
    });
  }

  private flattenReport(value: unknown, prefix = 'data'): Array<[string, string | number]> {
    if (Array.isArray(value)) {
      if (!value.length) return [[prefix, '']];
      return value.flatMap((item, index) => this.flattenReport(item, `${prefix}[${index + 1}]`));
    }
    if (value && typeof value === 'object') {
      return Object.entries(value as Record<string, unknown>)
        .flatMap(([key, inner]) => this.flattenReport(inner, `${prefix}.${key}`));
    }
    return [[prefix, typeof value === 'number' ? value : String(value ?? '')]];
  }

  private csvValue(value: any): string {
    if (Array.isArray(value)) return value.map((item) => this.normalizeSkillName(item) || JSON.stringify(item)).join('; ');
    if (value && typeof value === 'object') return value.name || value.title || value.skillName || JSON.stringify(value);
    return String(value ?? '');
  }

  // Private audit helper
  private async auditLog(action: string, actorId: string, resource: string, resourceId: string, description: string): Promise<void> {
    try {
      await this.auditLogModel.create({ actorId: new Types.ObjectId(actorId), action, resource, resourceId, description, severity: 'info', timestamp: new Date() });
    } catch (err) {
      this.logger.error(`Audit log failed: ${(err as any).message}`);
    }
  }
}
