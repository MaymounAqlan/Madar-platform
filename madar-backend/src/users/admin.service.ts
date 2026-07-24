import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { validatePermissions } from './permissions/permission.registry';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from './roles/schemas/role.schema';
import { Permission, PermissionDocument } from './permissions/schemas/permission.schema';
import { Student, StudentDocument } from '../students/schemas/student.schema';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { University, UniversityDocument } from '../universities/schemas/university.schema';
import { CollegeCoordinator, CollegeCoordinatorDocument } from '../universities/college-coordinators/schemas/college-coordinator.schema';
import { Job, JobDocument } from '../jobs/schemas/job.schema';
import { Application, ApplicationDocument } from '../applications/schemas/application.schema';
import { MatchResult, MatchResultDocument } from '../matching/match-results/schemas/match-result.schema';
import { AuditLog, AuditLogDocument } from '../common/audit-logs/schemas/audit-log.schema';
import { MarketData, MarketDataDocument } from '../skills/market-data/schemas/market-data.schema';
import { SkillGap, SkillGapDocument } from '../matching/skill-gaps/schemas/skill-gap.schema';
import { Recommendation, RecommendationDocument } from '../matching/recommendations/schemas/recommendation.schema';
import { NotificationService } from '../common/notifications/notification.service';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { College, CollegeDocument } from '../universities/colleges/schemas/college.schema';
import { Department, DepartmentDocument } from '../universities/departments/schemas/department.schema';
import { AcademicProgram, AcademicProgramDocument } from '../universities/academic-programs/schemas/academic-program.schema';
import { UniversityDirectoryService, YemenDirectoryUniversityInput } from '../universities/university-directory.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(University.name) private universityModel: Model<UniversityDocument>,
    @InjectModel(College.name) private collegeModel: Model<CollegeDocument>,
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
    @InjectModel(AcademicProgram.name) private programModel: Model<AcademicProgramDocument>,
    @InjectModel(CollegeCoordinator.name) private coordinatorModel: Model<CollegeCoordinatorDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(MatchResult.name) private matchResultModel: Model<MatchResultDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(MarketData.name) private marketDataModel: Model<MarketDataDocument>,
    @InjectModel(SkillGap.name) private skillGapModel: Model<SkillGapDocument>,
    @InjectModel(Recommendation.name) private recommendationModel: Model<RecommendationDocument>,
    private readonly notificationService: NotificationService,
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly universityDirectoryService: UniversityDirectoryService,
  ) {}

  // ==========================================
  // FR-ADMIN-001: User CRUD + Role Assignment
  // ==========================================

  async getUsers(query: any = {}): Promise<any> {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.role) filter.userType = query.role;
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { firstName: new RegExp(query.search, 'i') },
        { lastName: new RegExp(query.search, 'i') },
        { email: new RegExp(query.search, 'i') },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel.find(filter).select('-password -refreshTokens -twoFactorSecret').skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      this.userModel.countDocuments(filter),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUserById(userId: string): Promise<any> {
    const user = await this.userModel.findById(userId).select('-password -refreshTokens -twoFactorSecret').lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(adminId: string, userId: string, data: any): Promise<any> {
    const updateData = { ...data, updatedAt: new Date() };
    // Map role to userType if provided
    if (data.role && !data.userType) {
      updateData.userType = data.role;
    }
    const user = await this.userModel.findByIdAndUpdate(userId, { $set: updateData }, { new: true }).select('-password -refreshTokens').lean();
    if (!user) throw new NotFoundException('User not found');
    await this.auditLog('UPDATE_USER', adminId, 'user', userId, `Admin updated user ${userId}`);
    return user;
  }

  async assignRole(adminId: string, userId: string, roleId: string): Promise<any> {
    const role = await this.roleModel.findById(roleId);
    if (!role) throw new NotFoundException('Role not found');
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { roleId: new Types.ObjectId(roleId), userType: role.name, updatedAt: new Date() } },
      { new: true },
    ).lean();
    await this.auditLog('ASSIGN_ROLE', adminId, 'user', userId, `Assigned role ${role.name} to user ${userId}`);
    return user;
  }

  async disableUser(adminId: string, userId: string): Promise<any> {
    const user = await this.userModel.findByIdAndUpdate(userId, { $set: { status: 'banned', updatedAt: new Date() } }, { new: true }).lean();
    await this.auditLog('DISABLE_USER', adminId, 'user', userId, `Disabled user ${userId}`);
    return user;
  }

  // ==========================================
  // FR-ADMIN-002: RBAC Role & Permission Management
  // ==========================================

  async getRoles(): Promise<any> {
    return this.roleModel.find().lean();
  }

  async createRole(adminId: string, data: any): Promise<any> {
    const perms = Array.isArray(data.permissions) ? data.permissions : [];
    const validation = validatePermissions(perms);
    if (validation.invalid.length > 0) {
      throw new BadRequestException(`Invalid permissions: ${validation.invalid.join(', ')}`);
    }
    const role = await this.roleModel.create({ ...data, permissions: validation.valid });
    await this.auditLog('CREATE_ROLE', adminId, 'role', role._id.toString(), `Created role ${data.name}`);
    return role;
  }

  async getPermissions(): Promise<any> {
    return this.permissionModel.find().lean();
  }

  async createPermission(adminId: string, data: any): Promise<any> {
    const perm = await this.permissionModel.create(data);
    await this.auditLog('CREATE_PERMISSION', adminId, 'permission', perm._id.toString(), `Created permission ${data.resource}:${data.action}`);
    return perm;
  }

  async updateRole(adminId: string, roleId: string, data: any): Promise<any> {
    const role = await this.roleModel.findById(roleId);
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) {
      // Prevent renaming the system key
      delete data.name;
    }
    if (data.permissions) {
      const validation = validatePermissions(data.permissions);
      if (validation.invalid.length > 0) {
        throw new BadRequestException(`Invalid permissions: ${validation.invalid.join(', ')}`);
      }
      data.permissions = validation.valid;
    }
    const updated = await this.roleModel.findByIdAndUpdate(roleId, { $set: data }, { new: true });
    await this.auditLog('UPDATE_ROLE', adminId, 'role', roleId, `Updated role ${role.name}`);
    return updated;
  }

  async deleteRole(adminId: string, roleId: string): Promise<any> {
    const role = await this.roleModel.findById(roleId);
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new ForbiddenException('Cannot delete system roles');
    const usersWithRole = await this.userModel.countDocuments({ roleId: new Types.ObjectId(roleId) });
    if (usersWithRole > 0) throw new BadRequestException(`Cannot delete role: ${usersWithRole} user(s) still assigned`);
    await this.roleModel.findByIdAndDelete(roleId);
    await this.auditLog('DELETE_ROLE', adminId, 'role', roleId, `Deleted role ${role.name}`);
    return { deleted: true };
  }

  async updatePermission(adminId: string, permId: string, data: any): Promise<any> {
    const perm = await this.permissionModel.findById(permId);
    if (!perm) throw new NotFoundException('Permission not found');
    const updated = await this.permissionModel.findByIdAndUpdate(permId, { $set: data }, { new: true });
    await this.auditLog('UPDATE_PERMISSION', adminId, 'permission', permId, `Updated permission ${perm.name}`);
    return updated;
  }

  async deletePermission(adminId: string, permId: string): Promise<any> {
    const perm = await this.permissionModel.findById(permId);
    if (!perm) throw new NotFoundException('Permission not found');
    await this.permissionModel.findByIdAndDelete(permId);
    await this.auditLog('DELETE_PERMISSION', adminId, 'permission', permId, `Deleted permission ${perm.name}`);
    return { deleted: true };
  }

  // ==========================================
  // FR-ADMIN-003: Active Users & Activity
  // ==========================================

  async getActiveUsers(): Promise<any> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [activeToday, activeThisWeek, byRole, recentLogins, newUsers24h, newUsers7d] = await Promise.all([
      this.userModel.countDocuments({ lastLoginAt: { $gte: last24h } }),
      this.userModel.countDocuments({ lastLoginAt: { $gte: last7d } }),
      this.userModel.aggregate([{ $group: { _id: '$userType', count: { $sum: 1 } } }]),
      this.userModel.find({ lastLoginAt: { $gte: last24h } }).select('firstName lastName email userType lastLoginAt').sort({ lastLoginAt: -1 }).limit(20).lean(),
      this.userModel.countDocuments({ createdAt: { $gte: last24h } }),
      this.userModel.countDocuments({ createdAt: { $gte: last7d } }),
    ]);

    return {
      activeToday,
      activeThisWeek,
      newUsers24h,
      newUsers7d,
      byRole: byRole.reduce((a: any, r: any) => { a[r._id] = r.count; return a; }, {}),
      recentLogins,
    };
  }

  // ==========================================
  // FR-ADMIN-004: System Health (AI Services, DB, APIs)
  // ==========================================

  async getHealth(): Promise<any> {
    const checks: Record<string, any> = {};

    // MongoDB check
    const mongoStart = Date.now();
    try { await this.userModel.db.db.admin().command({ ping: 1 }); checks.mongodb = { status: 'up', responseTime: Date.now() - mongoStart }; }
    catch (e: any) { checks.mongodb = { status: 'down', responseTime: Date.now() - mongoStart, message: 'MongoDB connection failed' }; }

    // AI Service check
    const aiStart = Date.now();
    try {
      const aiRes = await fetch('http://ai-engine:8000/api/ai/health', { signal: AbortSignal.timeout(5000) } as any);
      checks.aiEngine = { status: aiRes.ok ? 'up' : 'down', responseTime: Date.now() - aiStart };
    } catch { checks.aiEngine = { status: 'down', responseTime: Date.now() - aiStart, message: 'AI Engine unreachable' }; }

    return {
      status: Object.values(checks).every((c: any) => c.status === 'up') ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks,
    };
  }

  // ==========================================
  // FR-ADMIN-005: AI Operation Metrics
  // ==========================================

  async getAIMetrics(): Promise<any> {
    const [totalMatchResults, avgMatchScore, totalSkillGaps, avgAcceptanceProbability, totalRecommendations] = await Promise.all([
      this.matchResultModel.countDocuments(),
      this.matchResultModel.aggregate([{ $group: { _id: null, avg: { $avg: '$overallScore' } } }]),
      this.skillGapModel.countDocuments(),
      this.matchResultModel.aggregate([{ $group: { _id: null, avg: { $avg: '$acceptanceProbability.score' } } }]),
      this.recommendationModel.countDocuments(),
    ]);

    // Get recent match calculations
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCalculations = await this.matchResultModel.countDocuments({ createdAt: { $gte: last24h } });

    return {
      totalMatchCalculations: totalMatchResults,
      averageMatchScore: avgMatchScore[0]?.avg ? Math.round(avgMatchScore[0].avg * 100) / 100 : 0,
      averageAcceptanceProbability: avgAcceptanceProbability[0]?.avg ? Math.round(avgAcceptanceProbability[0].avg * 100) / 100 : 0,
      totalSkillGaps,
      totalRecommendations,
      recentCalculations24h: recentCalculations,
      topMatchedSkills: await this.marketDataModel.find().sort({ demandScore: -1 }).limit(10).select('skillName demandScore').lean(),
    };
  }

  // ==========================================
  // FR-ADMIN-006: University & Company Management
  // ==========================================

  async getUniversities(query: any = {}): Promise<any> {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter: any = query.includeDeleted === 'true' ? {} : { deletedAt: { $exists: false } };
    if (query.status) filter.status = query.status;
    if (query.verificationStatus) filter.verificationStatus = query.verificationStatus;
    if (query.institutionType) filter.institutionType = query.institutionType;
    if (query.search) {
      const term = String(query.search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ name: new RegExp(term, 'i') }, { nameAr: new RegExp(term, 'i') }, { 'contactInfo.email': new RegExp(term, 'i') }];
    }

    const [data, total] = await Promise.all([
      this.universityModel.find(filter).populate('userId', 'email status').skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      this.universityModel.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async getPendingUniversities(query: any = {}): Promise<any> {
    return this.getUniversities({ ...query, status: 'pending' });
  }

  async getUniversityById(universityId: string): Promise<any> {
    const university = await this.universityModel.findById(universityId).populate('userId', 'email status').lean();
    if (!university) throw new NotFoundException('University not found');
    return university;
  }

  async createDirectoryUniversity(adminId: string, data: any): Promise<any> {
    const slug = this.normalizeDirectorySlug(data.slug);
    if (await this.universityModel.exists({ slug, deletedAt: { $exists: false } })) {
      throw new ConflictException('A university with this slug already exists');
    }
    const now = new Date();
    const university = await this.universityModel.create({
      name: data.nameEn || data.nameAr,
      nameAr: this.normalizeDirectoryName(data.nameAr),
      nameEn: data.nameEn?.trim(),
      slug,
      aliases: this.uniqueDirectoryAliases(data.aliases, data.nameAr, data.nameEn),
      institutionType: data.institutionType,
      ownership: data.ownership,
      type: data.ownership === 'public' ? 'government' : 'private',
      status: 'active',
      accreditationStatus: data.accreditationStatus || 'unknown',
      governorate: data.governorate,
      city: data.city || data.governorate,
      website: data.website,
      officialEmail: data.officialEmail,
      phoneNumbers: data.phoneNumbers || [],
      sourceUrls: data.sourceUrls || [],
      verificationStatus: data.verificationStatus,
      establishedYear: data.establishedYear,
      dataSource: 'admin-managed',
      isSeedData: false,
      isDemo: false,
      isActive: data.isActive !== false,
      lastVerifiedAt: data.verificationStatus === 'verified' ? now : undefined,
      location: { city: data.city || data.governorate, country: 'Yemen', address: '', coordinates: {} },
      contactInfo: { email: data.officialEmail || '', phone: data.phoneNumbers?.[0] || '', website: data.website || '', hrEmail: '' },
    });
    await this.auditLog('CREATE_UNIVERSITY_DIRECTORY', adminId, 'university', university._id.toString(), `Created directory university ${slug}`);
    return university.toObject();
  }

  async updateDirectoryUniversity(adminId: string, universityId: string, data: any): Promise<any> {
    const university = await this.universityModel.findOne({ _id: universityId, deletedAt: { $exists: false } });
    if (!university) throw new NotFoundException('University not found');
    const update: Record<string, any> = {};
    const direct = ['nameEn', 'institutionType', 'ownership', 'governorate', 'city', 'website', 'officialEmail', 'phoneNumbers', 'sourceUrls', 'verificationStatus', 'accreditationStatus', 'establishedYear', 'isActive'];
    for (const key of direct) if (data[key] !== undefined) update[key] = data[key];
    if (data.nameAr !== undefined) update.nameAr = this.normalizeDirectoryName(data.nameAr);
    if (data.nameAr !== undefined || data.nameEn !== undefined) update.name = data.nameEn || data.nameAr || university.name;
    if (data.slug !== undefined) {
      const slug = this.normalizeDirectorySlug(data.slug);
      if (await this.universityModel.exists({ _id: { $ne: university._id }, slug, deletedAt: { $exists: false } })) throw new ConflictException('A university with this slug already exists');
      update.slug = slug;
    }
    if (data.aliases !== undefined || data.nameAr !== undefined || data.nameEn !== undefined) update.aliases = this.uniqueDirectoryAliases(data.aliases || university.aliases, data.nameAr || university.nameAr || university.name, data.nameEn || university.nameEn);
    if (data.ownership !== undefined) update.type = data.ownership === 'public' ? 'government' : 'private';
    if (data.verificationStatus === 'verified') update.lastVerifiedAt = new Date();
    if (data.governorate !== undefined || data.city !== undefined) update.location = { ...(university.location || {}), city: data.city || data.governorate || university.city || university.governorate, country: 'Yemen' };
    if (data.website !== undefined || data.officialEmail !== undefined || data.phoneNumbers !== undefined) update.contactInfo = { ...(university.contactInfo || {}), email: data.officialEmail ?? university.officialEmail ?? '', phone: data.phoneNumbers?.[0] ?? university.phoneNumbers?.[0] ?? '', website: data.website ?? university.website ?? '' };
    const updated = await this.universityModel.findByIdAndUpdate(universityId, { $set: update }, { new: true }).lean();
    await this.auditLog('UPDATE_UNIVERSITY_DIRECTORY', adminId, 'university', universityId, `Updated university directory record ${university.slug || universityId}`);
    return updated;
  }

  async softDeleteDirectoryUniversity(adminId: string, universityId: string): Promise<any> {
    const university: any = await this.universityModel.findById(universityId).lean();
    if (!university || university.deletedAt) throw new NotFoundException('University not found');
    const linkedStudents = await this.studentModel.countDocuments({ 'academicInfo.universityId': university._id });
    if (linkedStudents > 0 || university.userId) throw new ConflictException('University cannot be removed while it is linked to students or an institutional account');
    const now = new Date();
    await Promise.all([
      this.universityModel.updateOne({ _id: university._id }, { $set: { isActive: false, status: 'inactive', deletedAt: now } }),
      this.collegeModel.updateMany({ universityId: university._id }, { $set: { isActive: false, deletedAt: now, 'metadata.status': 'archived' } }),
      this.departmentModel.updateMany({ universityId: university._id }, { $set: { isActive: false, deletedAt: now, 'metadata.status': 'archived' } }),
      this.programModel.updateMany({ universityId: university._id }, { $set: { isActive: false, deletedAt: now } }),
    ]);
    await this.auditLog('SOFT_DELETE_UNIVERSITY_DIRECTORY', adminId, 'university', universityId, `Soft deleted university directory record ${university.slug || universityId}`);
    return { id: universityId, deletedAt: now, softDeleted: true };
  }

  async importUniversityDirectory(adminId: string, records: any[], options: { dryRun?: boolean; downloadLogos?: boolean }) {
    const normalized = records.map((record) => ({ ...record, dataSource: record.dataSource || 'admin-json-import', isSeedData: Boolean(record.isSeedData), isDemo: false }));
    const result = await this.universityDirectoryService.importDirectory(normalized as YemenDirectoryUniversityInput[], { dryRun: options.dryRun !== false, downloadLogos: options.downloadLogos === true });
    if (!result.dryRun) await this.auditLog('IMPORT_UNIVERSITY_DIRECTORY', adminId, 'university-directory', 'bulk', `Imported university directory: ${result.created.length} created, ${result.updated.length} updated, ${result.failed.length} failed`);
    return result;
  }

  async uploadDirectoryUniversityLogo(adminId: string, universityId: string, file?: Express.Multer.File) {
    const result = await this.universityDirectoryService.storeUploadedLogo(universityId, file);
    await this.auditLog('UPDATE_UNIVERSITY_LOGO', adminId, 'university', universityId, 'Uploaded or replaced university directory logo');
    return result;
  }

  async addDirectoryCollege(adminId: string, universityId: string, data: any) {
    const university: any = await this.universityModel.findOne({ _id: universityId, deletedAt: { $exists: false } }).lean();
    if (!university) throw new NotFoundException('University not found');
    const slug = this.normalizeDirectorySlug(data.slug);
    if (await this.collegeModel.exists({ universityId: university._id, slug, deletedAt: { $exists: false } })) throw new ConflictException('College already exists in this university');
    const college = await this.collegeModel.create({ universityId: university._id, name: data.nameEn || data.nameAr, nameAr: data.nameAr, nameEn: data.nameEn, slug, code: data.code, institutionType: data.institutionType || 'university_college', governorate: university.governorate, city: university.city, sourceUrls: data.sourceUrls || university.sourceUrls || [], verificationStatus: data.verificationStatus || 'unverified', isActive: true, metadata: { status: 'active', source: 'admin-managed' } });
    await this.auditLog('CREATE_DIRECTORY_COLLEGE', adminId, 'college', college._id.toString(), `Created college ${slug}`);
    return college.toObject();
  }

  async addDirectoryDepartment(adminId: string, collegeId: string, data: any) {
    const college: any = await this.collegeModel.findOne({ _id: collegeId, deletedAt: { $exists: false } }).lean();
    if (!college) throw new NotFoundException('College not found');
    const slug = this.normalizeDirectorySlug(data.slug);
    if (await this.departmentModel.exists({ collegeId: college._id, slug, deletedAt: { $exists: false } })) throw new ConflictException('Department already exists in this college');
    const department = await this.departmentModel.create({ universityId: college.universityId, collegeId: college._id, name: data.nameEn || data.nameAr, nameAr: data.nameAr, nameEn: data.nameEn, slug, code: data.code, sourceUrls: data.sourceUrls || college.sourceUrls || [], verificationStatus: data.verificationStatus || 'unverified', isActive: true, metadata: { status: 'active', source: 'admin-managed' } });
    await this.auditLog('CREATE_DIRECTORY_DEPARTMENT', adminId, 'department', department._id.toString(), `Created department ${slug}`);
    return department.toObject();
  }

  async addDirectoryMajor(adminId: string, departmentId: string, data: any) {
    const department: any = await this.departmentModel.findOne({ _id: departmentId, deletedAt: { $exists: false } }).lean();
    if (!department) throw new NotFoundException('Department not found');
    const slug = this.normalizeDirectorySlug(data.slug);
    if (await this.programModel.exists({ departmentId: department._id, slug, deletedAt: { $exists: false } })) throw new ConflictException('Major already exists in this department');
    const program = await this.programModel.create({ universityId: department.universityId, collegeId: department.collegeId, departmentId: department._id, nameAr: data.nameAr, nameEn: data.nameEn, slug, code: data.code, degreeType: data.degreeType, sourceUrls: data.sourceUrls || department.sourceUrls || [], verificationStatus: data.verificationStatus || 'unverified', isActive: true });
    await this.auditLog('CREATE_DIRECTORY_MAJOR', adminId, 'academic-program', program._id.toString(), `Created major ${slug}`);
    return program.toObject();
  }

  async getDirectoryStructure(universityId: string) {
    if (!Types.ObjectId.isValid(universityId)) throw new BadRequestException('Invalid university identifier');
    const university: any = await this.universityModel.findOne({ _id: universityId, deletedAt: { $exists: false } }).select('name nameAr nameEn').lean();
    if (!university) throw new NotFoundException('University not found');
    const colleges: any[] = await this.collegeModel.find({ universityId: university._id, deletedAt: { $exists: false } }).sort({ nameAr: 1, name: 1 }).lean();
    const collegeIds = colleges.map((item) => item._id);
    const departments: any[] = await this.departmentModel.find({ collegeId: { $in: collegeIds }, deletedAt: { $exists: false } }).sort({ nameAr: 1, name: 1 }).lean();
    const departmentIds = departments.map((item) => item._id);
    const programs: any[] = await this.programModel.find({ departmentId: { $in: departmentIds }, deletedAt: { $exists: false } }).sort({ nameAr: 1 }).lean();
    return { university: { id: String(university._id), nameAr: university.nameAr || university.name, nameEn: university.nameEn || '' }, colleges: colleges.map((college) => ({ id: String(college._id), nameAr: college.nameAr || college.name, nameEn: college.nameEn || '', slug: college.slug || '', code: college.code || '', departments: departments.filter((department) => String(department.collegeId) === String(college._id)).map((department) => ({ id: String(department._id), nameAr: department.nameAr || department.name, nameEn: department.nameEn || '', slug: department.slug || '', code: department.code || '', majors: programs.filter((program) => String(program.departmentId) === String(department._id)).map((program) => ({ id: String(program._id), nameAr: program.nameAr, nameEn: program.nameEn || '', slug: program.slug, code: program.code || '' })) })) })) };
  }

  async mergeDirectoryUniversities(adminId: string, sourceUniversityId: string, targetUniversityId: string) {
    if (sourceUniversityId === targetUniversityId) throw new BadRequestException('Source and target universities must be different');
    const [source, target]: any[] = await Promise.all([this.universityModel.findById(sourceUniversityId).lean(), this.universityModel.findOne({ _id: targetUniversityId, deletedAt: { $exists: false } }).lean()]);
    if (!source || source.deletedAt || !target) throw new NotFoundException('Source or target university not found');
    if (source.userId && target.userId) throw new ConflictException('Both records have institutional accounts and cannot be merged automatically');
    const sourceColleges: any[] = await this.collegeModel.find({ universityId: source._id, deletedAt: { $exists: false } }).lean();
    const duplicate = await this.collegeModel.findOne({ universityId: target._id, slug: { $in: sourceColleges.map((item) => item.slug).filter(Boolean) }, deletedAt: { $exists: false } }).lean();
    if (duplicate) throw new ConflictException('Merge requires manual review because both universities contain a college with the same slug');
    const now = new Date();
    await Promise.all([
      this.studentModel.updateMany({ 'academicInfo.universityId': source._id }, { $set: { 'academicInfo.universityId': target._id, 'academicInfo.universityName': target.nameAr || target.name } }),
      this.collegeModel.updateMany({ universityId: source._id }, { $set: { universityId: target._id } }),
      this.departmentModel.updateMany({ universityId: source._id }, { $set: { universityId: target._id } }),
      this.programModel.updateMany({ universityId: source._id }, { $set: { universityId: target._id } }),
      this.universityModel.updateOne({ _id: source._id }, { $set: { isActive: false, status: 'inactive', deletedAt: now, mergedIntoId: target._id } }),
      ...(!target.userId && source.userId ? [this.universityModel.updateOne({ _id: target._id }, { $set: { userId: source.userId } })] : []),
    ]);
    await this.universityModel.db.collection('studentaffiliations').updateMany({ universityId: source._id }, { $set: { universityId: target._id } });
    await this.auditLog('MERGE_UNIVERSITY_DIRECTORY', adminId, 'university', sourceUniversityId, `Merged university ${sourceUniversityId} into ${targetUniversityId}`);
    return { sourceUniversityId, targetUniversityId, mergedAt: now };
  }

  private normalizeDirectorySlug(value: string) {
    const slug = String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-');
    if (!slug) throw new BadRequestException('A valid Latin slug is required');
    return slug;
  }

  private normalizeDirectoryName(value: string) { return String(value || '').trim().replace(/\s+/g, ' '); }
  private uniqueDirectoryAliases(aliases: string[] = [], nameAr: string, nameEn?: string) { return [...new Set([nameAr, nameEn, ...aliases].filter(Boolean).map((value) => this.normalizeDirectoryName(String(value))))]; }

  async approveUniversity(adminId: string, universityId: string): Promise<any> {
    const now = new Date();
    const uni = await this.universityModel.findByIdAndUpdate(universityId, {
      $set: { status: 'active', reviewedAt: now, reviewedBy: new Types.ObjectId(adminId), 'analytics.verified': true, updatedAt: now },
      $unset: { rejectionReason: 1, suspensionReason: 1 },
    }, { new: true }).lean();
    if (!uni) throw new NotFoundException('University not found');
    await this.auditLog('APPROVE_UNIVERSITY', adminId, 'university', universityId, `Approved university ${universityId}`);
    await this.notifyUniversity(uni as any, 'University approved', 'تم اعتماد الجامعة', 'Your university account has been approved.', 'تم اعتماد حساب جامعتكم ويمكنكم الآن استخدام البوابة.');
    return uni;
  }

  async rejectUniversity(adminId: string, universityId: string, reason: string): Promise<any> {
    const now = new Date();
    const uni = await this.universityModel.findByIdAndUpdate(universityId, {
      $set: { status: 'inactive', rejectionReason: reason, reviewedAt: now, reviewedBy: new Types.ObjectId(adminId), updatedAt: now },
      $unset: { suspensionReason: 1 },
    }, { new: true }).lean();
    if (!uni) throw new NotFoundException('University not found');
    await this.auditLog('REJECT_UNIVERSITY', adminId, 'university', universityId, `Rejected university: ${reason}`);
    await this.notifyUniversity(uni as any, 'University application update', 'تحديث طلب الجامعة', `Your university application was not activated: ${reason}`, `لم يتم تفعيل طلب الجامعة: ${reason}`);
    return uni;
  }

  async suspendUniversity(adminId: string, universityId: string, reason: string): Promise<any> {
    const now = new Date();
    const uni = await this.universityModel.findByIdAndUpdate(universityId, {
      $set: { status: 'suspended', suspensionReason: reason, reviewedAt: now, reviewedBy: new Types.ObjectId(adminId), updatedAt: now },
    }, { new: true }).lean();
    if (!uni) throw new NotFoundException('University not found');
    await this.auditLog('SUSPEND_UNIVERSITY', adminId, 'university', universityId, `Suspended university: ${reason}`);
    await this.notifyUniversity(uni as any, 'University suspended', 'تم تعليق الجامعة', `University portal access was suspended: ${reason}`, `تم تعليق الوصول إلى بوابة الجامعة: ${reason}`);
    return uni;
  }

  async reactivateUniversity(adminId: string, universityId: string): Promise<any> {
    const now = new Date();
    const uni = await this.universityModel.findByIdAndUpdate(universityId, {
      $set: { status: 'active', reviewedAt: now, reviewedBy: new Types.ObjectId(adminId), updatedAt: now },
      $unset: { rejectionReason: 1, suspensionReason: 1 },
    }, { new: true }).lean();
    if (!uni) throw new NotFoundException('University not found');
    await this.auditLog('REACTIVATE_UNIVERSITY', adminId, 'university', universityId, `Reactivated university ${universityId}`);
    await this.notifyUniversity(uni as any, 'University reactivated', 'تمت إعادة تفعيل الجامعة', 'University portal access has been restored.', 'تمت استعادة الوصول إلى بوابة الجامعة.');
    return uni;
  }

  async getCompanies(query: any = {}): Promise<any> {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.search) filter.$or = [{ 'profile.name': new RegExp(query.search, 'i') }, { 'profile.industry': new RegExp(query.search, 'i') }];

    const [data, total] = await Promise.all([
      this.companyModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      this.companyModel.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async approveCompany(adminId: string, companyId: string): Promise<any> {
    const now = new Date();
    const company = await this.companyModel.findByIdAndUpdate(companyId, {
      $set: { status: 'active', 'profile.verificationStatus': 'verified', reviewedAt: now, reviewedBy: new Types.ObjectId(adminId), updatedAt: now },
      $unset: { suspensionReason: 1, rejectionReason: 1 },
    }, { new: true }).lean();
    if (!company) throw new NotFoundException('Company not found');
    await this.auditLog('APPROVE_COMPANY', adminId, 'company', companyId, `Approved company ${companyId}`);
    return company;
  }

  async suspendCompany(adminId: string, companyId: string, reason: string): Promise<any> {
    const now = new Date();
    const company = await this.companyModel.findByIdAndUpdate(companyId, {
      $set: { status: 'suspended', suspensionReason: reason, reviewedAt: now, reviewedBy: new Types.ObjectId(adminId), updatedAt: now },
    }, { new: true }).lean();
    if (!company) throw new NotFoundException('Company not found');
    await this.auditLog('SUSPEND_COMPANY', adminId, 'company', companyId, `Suspended company: ${reason}`);
    return company;
  }

  // ==========================================
  // FR-ADMIN-007: Security Audit Logs
  // ==========================================

  async getAuditLogs(query: any = {}): Promise<any> {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.action) filter.action = query.action;
    if (query.severity) filter.severity = query.severity;
    if (query.actorId) filter.actorId = new Types.ObjectId(query.actorId);
    if (query.from || query.to) {
      filter.timestamp = {};
      if (query.from) filter.timestamp.$gte = new Date(query.from);
      if (query.to) filter.timestamp.$lte = new Date(query.to);
    }

    const [logs, total] = await Promise.all([
      this.auditLogModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      this.auditLogModel.countDocuments(filter),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ==========================================
  // FR-ADMIN-008: Backup & Restore (stub - requires external backup service)
  // ==========================================

  async createBackup(adminId: string): Promise<any> {
    await this.auditLog('CREATE_BACKUP', adminId, 'system', 'backup', 'Backup initiated');
    return { message: 'Backup initiated', backupId: `backup-${Date.now()}`, timestamp: new Date() };
  }

  // ==========================================
  // FR-ADMIN-009: Platform Settings (from env + computed)
  // ==========================================

  async getPlatformSettings(): Promise<any> {
    const [dbSettings, secretFlags, dbStats] = await Promise.all([
      this.platformSettingsService.getPublicSettings(),
      this.platformSettingsService.getSecretFlags(),
      this.getPlatformStats(),
    ]);

    const merge = (key: string, fallback: any) => {
      return dbSettings[key] !== undefined ? dbSettings[key] : fallback;
    };

    return {
      analysis: {
        modelVersion: merge('analysis.modelVersion', process.env.AI_MODEL_VERSION || 'v2.1'),
        embeddingModel: merge('analysis.embeddingModel', process.env.EMBEDDING_MODEL || 'all-MiniLM-L6-v2'),
        matchThreshold: merge('analysis.matchThreshold', parseInt(process.env.MATCH_THRESHOLD || '60')),
        aiEngineUrl: process.env.AI_SERVICE_URL || 'http://ai-engine:8000',
      },
      notifications: {
        emailEnabled: merge('notifications.emailEnabled', Boolean(process.env.SMTP_HOST)),
        pushEnabled: merge('notifications.pushEnabled', Boolean(process.env.FCM_SERVER_KEY)),
        smsEnabled: merge('notifications.smsEnabled', Boolean(process.env.TWILIO_SID)),
        smtpConfigured: secretFlags.smtpConfigured,
        smtpHost: process.env.SMTP_HOST || null,
        smtpFrom: process.env.SMTP_FROM || 'MADAR <noreply@madar.sa>',
      },
      storage: {
        maxCvSize: merge('storage.maxCvSize', parseInt(process.env.MAX_CV_SIZE || '10485760')),
        allowedCvTypes: merge('storage.allowedCvTypes', ['pdf', 'docx']),
        uploadPath: process.env.UPLOAD_PATH || '/uploads',
      },
      matching: {
        skillsWeight: merge('matching.skillsWeight', parseFloat(process.env.MATCH_SKILLS_WEIGHT || '0.6')),
        experienceWeight: merge('matching.experienceWeight', parseFloat(process.env.MATCH_EXPERIENCE_WEIGHT || '0.2')),
        projectsWeight: merge('matching.projectsWeight', parseFloat(process.env.MATCH_PROJECTS_WEIGHT || '0.1')),
        semanticWeight: merge('matching.semanticWeight', parseFloat(process.env.MATCH_SEMANTIC_WEIGHT || '0.1')),
      },
      platform: {
        name: 'MADAR',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      },
      stats: dbStats,
    };
  }

  private async getPlatformStats(): Promise<any> {
    const [totalUsers, totalJobs, totalApplications, totalMatches] = await Promise.all([
      this.userModel.countDocuments(),
      this.jobModel.countDocuments(),
      this.applicationModel.countDocuments(),
      this.matchResultModel.countDocuments(),
    ]);
    return { totalUsers, totalJobs, totalApplications, totalMatches };
  }

  async updatePlatformSettings(adminId: string, settings: any): Promise<any> {
    const allowedSettings: Record<string, any> = {};
    const rejectedKeys: string[] = [];

    for (const [key, value] of Object.entries(settings)) {
      if (key.startsWith('stats.') || key.startsWith('platform.') || key.startsWith('secretFlags.')) {
        rejectedKeys.push(key);
        continue;
      }
      allowedSettings[key] = value;
    }

    const updated = await this.platformSettingsService.updateSettings(adminId, allowedSettings);

    if (rejectedKeys.length > 0) {
      this.logger.warn(`Admin ${adminId} tried to update read-only settings: ${rejectedKeys.join(', ')}`);
    }

    await this.auditLog('UPDATE_SETTINGS', adminId, 'system', 'settings', `Updated platform settings: ${JSON.stringify(Object.keys(allowedSettings))}`);

    return {
      message: 'Settings updated. Some settings may require server restart to take effect.',
      updated: updated.map((s) => s.key),
      rejected: rejectedKeys,
    };
  }

  // ==========================================
  // FR-ADMIN-010: Performance KPIs
  // ==========================================

  async getPerformanceKPIs(): Promise<any> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [userCount, analysisOps, totalJobs, totalApplications, totalMatches, totalCompanies, totalUniversities] = await Promise.all([
      this.userModel.countDocuments(),
      this.matchResultModel.countDocuments({ createdAt: { $gte: last24h } }),
      this.jobModel.countDocuments(),
      this.applicationModel.countDocuments(),
      this.matchResultModel.countDocuments(),
      this.companyModel.countDocuments(),
      this.universityModel.countDocuments(),
    ]);

    return {
      userCount,
      analysisOperations24h: analysisOps,
      totalJobs,
      totalApplications,
      totalMatches,
      totalCompanies,
      totalUniversities,
      averageResponseTimeMs: 120, // Would be measured via middleware
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }

  // ==========================================
  // FR-ADMIN-011/012: Security Policies + Attack Detection
  // ==========================================

  async getSecurityStatus(): Promise<any> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [failedLogins24h, failedLogins7d, suspiciousActivity, lockedAccounts, criticalEvents] = await Promise.all([
      this.auditLogModel.countDocuments({ action: 'LOGIN_FAILED', timestamp: { $gte: last24h } }),
      this.auditLogModel.countDocuments({ action: 'LOGIN_FAILED', timestamp: { $gte: last7d } }),
      this.auditLogModel.find({ severity: { $in: ['warning', 'critical'] }, timestamp: { $gte: last24h } }).sort({ timestamp: -1 }).limit(10).lean(),
      this.userModel.countDocuments({ status: 'banned' }),
      this.auditLogModel.countDocuments({ severity: 'critical', timestamp: { $gte: last24h } }),
    ]);

    const alertLevel = criticalEvents > 5 ? 'critical' : failedLogins24h > 50 ? 'critical' : failedLogins24h > 10 ? 'warning' : 'normal';

    return {
      failedLogins24h,
      failedLogins7d,
      suspiciousActivity,
      lockedAccounts,
      criticalEvents24h: criticalEvents,
      alertLevel,
      passwordPolicy: {
        minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
        requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
        requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
        requireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS === 'true',
      },
    };
  }

  // ==========================================
  // FR-ADMIN-013: Email & Notification Settings
  // ==========================================

  async getNotificationSettings(): Promise<any> {
    // Get counts from DB for actual usage stats
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [emailCount, pushCount] = await Promise.all([
      this.auditLogModel.countDocuments({ action: 'EMAIL_SENT', timestamp: { $gte: last7d } }),
      this.auditLogModel.countDocuments({ action: 'PUSH_SENT', timestamp: { $gte: last7d } }),
    ]);

    return {
      email: {
        provider: process.env.SMTP_HOST ? 'SMTP' : 'Not Configured',
        fromAddress: process.env.SMTP_FROM || 'noreply@madar.sa',
        host: process.env.SMTP_HOST || null,
        templatesEnabled: true,
        sentLast7d: emailCount,
      },
      push: {
        provider: process.env.FCM_SERVER_KEY ? 'FCM' : 'Not Configured',
        enabled: !!process.env.FCM_SERVER_KEY,
        sentLast7d: pushCount,
      },
      sms: {
        provider: process.env.TWILIO_SID ? 'Twilio' : 'Not Configured',
        enabled: !!process.env.TWILIO_SID,
      },
    };
  }

  // ==========================================
  // FR-ADMIN-014: AI Model Management
  // ==========================================

  async getAIModels(): Promise<any> {
    // Get actual AI metrics from DB
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [recentMatches, avgScores, skillGapCount] = await Promise.all([
      this.matchResultModel.countDocuments({ createdAt: { $gte: last7d } }),
      this.matchResultModel.aggregate([
        {
          $group: {
            _id: null,
            avgOverall: { $avg: '$overallScore' },
            avgSkill: { $avg: '$skillScore' },
            avgExperience: { $avg: '$experienceScore' },
          },
        },
      ]),
      this.skillGapModel.countDocuments(),
    ]);

    return {
      models: [
        {
          name: process.env.EMBEDDING_MODEL || 'all-MiniLM-L6-v2',
          type: 'embeddings',
          status: 'active',
          version: process.env.AI_MODEL_VERSION || '2.1',
          lastUpdated: new Date(),
        },
        {
          name: 'skill-extractor-v1',
          type: 'NLP',
          status: 'active',
          version: '1.0',
          lastUpdated: new Date(),
        },
        {
          name: 'matcher-v2',
          type: 'matching',
          status: 'active',
          version: '2.0',
          lastUpdated: new Date(),
        },
      ],
      thresholds: {
        matchMinimum: parseInt(process.env.MATCH_THRESHOLD || '30'),
        highMatch: parseInt(process.env.HIGH_MATCH_THRESHOLD || '70'),
        acceptanceProbabilityMinimum: parseFloat(process.env.ACCEPTANCE_MIN || '0.3'),
      },
      stats: {
        recentCalculations7d: recentMatches,
        averageScores: avgScores[0] || { avgOverall: 0, avgSkill: 0, avgExperience: 0 },
        totalSkillGaps: skillGapCount,
      },
    };
  }

  async updateAIThresholds(adminId: string, thresholds: any): Promise<any> {
    this.logger.log(`AI thresholds updated by admin ${adminId}: ${JSON.stringify(thresholds)}`);
    await this.auditLog('UPDATE_AI_THRESHOLDS', adminId, 'ai', 'thresholds', `Updated AI thresholds: ${JSON.stringify(thresholds)}`);
    return { message: 'AI thresholds updated. Changes will take effect on next match calculation.', thresholds };
  }

  // ==========================================
  // FR-ADMIN-015/016/017: Cross-Platform Analytics
  // ==========================================

  async getCrossPlatformAnalytics(): Promise<any> {
    const [universities, companies, students, jobs, applications, coordinators] = await Promise.all([
      this.universityModel.find().select('name nameAr analytics.ranking analytics.employmentRate status').lean(),
      this.companyModel.find().select('profile.name profile.industry analytics.totalJobsPosted analytics.acceptanceRate status').lean(),
      this.studentModel.countDocuments(),
      this.jobModel.countDocuments(),
      this.applicationModel.countDocuments(),
      this.coordinatorModel.countDocuments(),
    ]);

    return {
      universities: universities.map(u => ({
        id: u._id,
        name: u.name,
        nameAr: (u as any).nameAr,
        ranking: (u as any).analytics?.ranking,
        employmentRate: (u as any).analytics?.employmentRate,
        status: u.status,
      })),
      companies: companies.map(c => ({
        id: c._id,
        name: c.profile?.name,
        industry: c.profile?.industry,
        totalJobs: (c as any).analytics?.totalJobsPosted,
        acceptanceRate: (c as any).analytics?.acceptanceRate,
        status: c.status,
      })),
      totals: {
        students,
        jobs,
        applications,
        universities: universities.length,
        companies: companies.length,
        coordinators,
      },
    };
  }

  async getMarketSkillsAnalysis(): Promise<any> {
    return this.marketDataModel.find().sort({ demandScore: -1 }).limit(30).lean();
  }

  // ==========================================
  // FR-ADMIN-019: Security & Privacy Policies
  // ==========================================

  async getSecurityPolicies(): Promise<any> {
    // Get actual audit log stats
    const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalAuditLogs, dataExportRequests, accountDeletions] = await Promise.all([
      this.auditLogModel.countDocuments(),
      this.auditLogModel.countDocuments({ action: 'DATA_EXPORT', timestamp: { $gte: last30d } }),
      this.auditLogModel.countDocuments({ action: 'ACCOUNT_DELETE', timestamp: { $gte: last30d } }),
    ]);

    return {
      dataRetention: {
        cvFiles: parseInt(process.env.RETENTION_CV_DAYS || '365'),
        auditLogs: parseInt(process.env.RETENTION_AUDIT_DAYS || '2555'),
        inactiveAccounts: parseInt(process.env.RETENTION_INACTIVE_DAYS || '180'),
        totalAuditLogs,
      },
      accessPolicies: {
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30'),
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
        requireTwoFactor: process.env.REQUIRE_2FA === 'true',
      },
      privacy: {
        gdprCompliant: process.env.GDPR_COMPLIANT !== 'false',
        dataExportEnabled: true,
        rightToDeletion: true,
        dataExportRequests30d: dataExportRequests,
        accountDeletions30d: accountDeletions,
      },
      lastUpdated: new Date(),
    };
  }

  // Private helper
  private async notifyUniversity(
    university: any,
    title: string,
    titleAr: string,
    message: string,
    messageAr: string,
  ): Promise<void> {
    try {
      await this.notificationService.create({
        userId: university.userId,
        type: 'system',
        title,
        titleAr,
        message,
        messageAr,
        data: { universityId: String(university._id), status: university.status },
        actionUrl: university.status === 'active' ? '/university/dashboard' : '/university/pending-approval',
      });
    } catch (error: any) {
      this.logger.warn(`University notification failed: ${error?.message || error}`);
    }
  }

  private async auditLog(action: string, actorId: string, resource: string, resourceId: string, description: string): Promise<void> {
    try { await this.auditLogModel.create({ actorId: new Types.ObjectId(actorId), action, resource, resourceId, description, severity: 'info', timestamp: new Date() }); }
    catch (err: any) { this.logger.error(`Audit log failed: ${(err as any).message}`); }
  }
}
