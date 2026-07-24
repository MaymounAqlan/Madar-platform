import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { CollegeCoordinator, CollegeCoordinatorDocument } from './schemas/college-coordinator.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { University, UniversityDocument } from '../schemas/university.schema';
import { College, CollegeDocument } from '../colleges/schemas/college.schema';
import { AuditLog, AuditLogDocument } from '../../common/audit-logs/schemas/audit-log.schema';
import { NotificationService } from '../../common/notifications/notification.service';
import { EmailService } from '../../common/services/email.service';
import { InviteUniversityStaffDto, UniversityStaffRole, UpdateUniversityStaffDto, UpdateMyStaffProfileDto, UNIVERSITY_STAFF_PERMISSIONS } from './dto/staff.dto';

@Injectable()
export class CollegeCoordinatorService {
  private readonly logger = new Logger(CollegeCoordinatorService.name);

  constructor(
    @InjectModel(CollegeCoordinator.name) private readonly model: Model<CollegeCoordinatorDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(University.name) private readonly universityModel: Model<UniversityDocument>,
    @InjectModel(College.name) private readonly collegeModel: Model<CollegeDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
  ) {}

  async getMyProfile(userId: string) {
    const profile: any = await this.model.findOne({ userId: new Types.ObjectId(userId), status: 'active', invitationStatus: 'accepted' })
      .populate('universityId', 'name nameAr status')
      .populate('collegeId', 'name nameAr code')
      .populate('userId', 'firstName lastName firstNameAr lastNameAr email phone avatar status isEmailVerified preferences')
      .lean();
    if (!profile) throw new NotFoundException('Staff profile not found');
    const user = profile.userId || {};
    const university = profile.universityId || {};
    const college = profile.collegeId && typeof profile.collegeId === 'object' ? profile.collegeId : null;
    return {
      id: String(profile._id),
      userId: String(user._id || profile.userId),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      firstNameAr: user.firstNameAr || '',
      lastNameAr: user.lastNameAr || '',
      email: user.email || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      jobTitle: profile.jobTitle || '',
      biography: profile.biography || '',
      language: user.preferences?.language || 'ar',
      role: profile.role,
      university: { id: String(university._id || profile.universityId), name: university.name || '', nameAr: university.nameAr || '', status: university.status || '' },
      college: college ? { id: String(college._id), name: college.name || '', nameAr: college.nameAr || '', code: college.code || '' } : null,
      status: profile.status,
      invitationStatus: profile.invitationStatus,
      permissions: this.normalizePermissions(profile.role, profile.permissions),
      isEmailVerified: user.isEmailVerified ?? false,
      lastLoginAt: user.lastLoginAt || null,
      updatedAt: profile.updatedAt || null,
    };
  }

  async updateMyProfile(userId: string, dto: UpdateMyStaffProfileDto) {
    const profile: any = await this.model.findOne({ userId: new Types.ObjectId(userId), status: 'active', invitationStatus: 'accepted' }).lean();
    if (!profile) throw new NotFoundException('Staff profile not found');

    const userUpdate: any = { updatedAt: new Date() };
    if (dto.firstName !== undefined) userUpdate.firstName = dto.firstName;
    if (dto.lastName !== undefined) userUpdate.lastName = dto.lastName;
    if (dto.firstNameAr !== undefined) userUpdate.firstNameAr = dto.firstNameAr;
    if (dto.lastNameAr !== undefined) userUpdate.lastNameAr = dto.lastNameAr;
    if (dto.phone !== undefined) userUpdate.phone = dto.phone;
    if (dto.avatar !== undefined) userUpdate.avatar = dto.avatar;
    if (dto.language !== undefined) userUpdate['preferences.language'] = dto.language;

    const profileUpdate: any = { updatedAt: new Date() };
    if (dto.jobTitle !== undefined) profileUpdate.jobTitle = dto.jobTitle;
    if (dto.biography !== undefined) profileUpdate.biography = dto.biography;

    await Promise.all([
      this.userModel.updateOne({ _id: new Types.ObjectId(userId) }, { $set: userUpdate }),
      this.model.updateOne({ _id: profile._id }, { $set: profileUpdate }),
    ]);

    await this.audit(userId, 'UPDATE_MY_STAFF_PROFILE', profile._id.toString(), {
      fields: Object.keys(dto),
    });

    return this.getMyProfile(userId);
  }

  async getMyAccess(userId: string) {
    // University owner: return access regardless of university status so pending/suspended
    // managers can still see their status and permissions on the status page.
    const university = await this.universityModel.findOne({ userId: new Types.ObjectId(userId) }).select('_id name status').lean();
    if (university) {
      return {
        role: 'university',
        universityId: String(university._id),
        universityStatus: university.status || 'inactive',
        collegeId: null,
        isOwner: true,
        permissions: ['*'],
        allowedActions: ['*'],
      };
    }
    const profile: any = await this.model.findOne({ userId: new Types.ObjectId(userId), status: 'active', invitationStatus: 'accepted' }).populate('collegeId', 'name code').lean();
    if (!profile) throw new ForbiddenException({ code: 'INSTITUTIONAL_ACCESS_UNAVAILABLE', message: 'Institutional access unavailable' });
    const activeUniversity = await this.universityModel.exists({ _id: profile.universityId, status: 'active' });
    if (!activeUniversity) throw new ForbiddenException({ code: 'UNIVERSITY_INACTIVE', message: 'University inactive' });
    const collegeId = profile.collegeId ? String(profile.collegeId._id || profile.collegeId) : null;
    const college = profile.collegeId && profile.collegeId._id ? { id: String(profile.collegeId._id), name: profile.collegeId.name, code: profile.collegeId.code || '' } : null;
    const rawPermissions = profile.permissions || [];
    const permissions = this.normalizePermissions(profile.role, rawPermissions);
    return { role: profile.role, universityId: String(profile.universityId), collegeId, college, isOwner: false, permissions, allowedActions: permissions };
  }

  async list(ownerUserId: string, query: any = {}) {
    const university = await this.getOwnedUniversity(ownerUserId);
    const profiles = await this.model.find({ universityId: (university as any)._id }).populate('userId', 'firstName lastName email phone status lastLoginAt createdAt').populate('collegeId', 'name code').sort({ createdAt: -1 }).lean();
    const search = String(query.search || '').trim().toLowerCase();
    const filtered = profiles.map((profile: any) => this.toDto(profile)).filter((staff) => {
      if (query.role && staff.role !== query.role) return false;
      if (query.collegeId && staff.college?.id !== query.collegeId) return false;
      if (query.status && staff.status !== query.status && staff.invitationStatus !== query.status) return false;
      return !search || [staff.name, staff.email, staff.phone, staff.role, staff.college?.name].some((value) => String(value || '').toLowerCase().includes(search));
    });
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
    const start = (page - 1) * limit;
    return { items: filtered.slice(start, start + limit), pagination: { page, limit, total: filtered.length, totalPages: Math.ceil(filtered.length / limit) } };
  }

  async invite(ownerUserId: string, dto: InviteUniversityStaffDto) {
    const university = await this.getOwnedUniversity(ownerUserId);
    const email = dto.email.trim().toLowerCase();
    const college = await this.validateCollege(university, dto.role, dto.collegeId);

    const existingUser: any = await this.userModel.findOne({ email }).lean();
    if (existingUser) {
      const existingStaff = await this.model.findOne({ userId: existingUser._id, universityId: (university as any)._id }).lean();
      if (existingStaff) {
        if (existingStaff.invitationStatus === 'pending') {
          const isExpired = !existingStaff.invitationExpiresAt || existingStaff.invitationExpiresAt < new Date();
          if (isExpired) {
            return this.renewInvitation(ownerUserId, existingStaff, existingUser, university, dto, college);
          }
          throw new ConflictException({ code: 'INVITATION_ALREADY_PENDING', message: 'توجد دعوة معلقة لهذا البريد الإلكتروني.' });
        }
        throw new ConflictException({ code: 'STAFF_ALREADY_EXISTS', message: 'هذا المستخدم مضاف بالفعل ضمن فريق الجامعة.' });
      }
      const otherStaff = await this.model.findOne({ userId: existingUser._id }).lean();
      if (otherStaff) {
        throw new ConflictException({ code: 'USER_ASSOCIATED_WITH_OTHER_UNIVERSITY', message: 'هذا المستخدم مرتبط بجهة أخرى.' });
      }
      throw new ConflictException({ code: 'EMAIL_ALREADY_REGISTERED', message: 'البريد الإلكتروني مسجل مسبقًا.' });
    }

    const pendingProfileByEmail: any = await this.model.findOne({
      universityId: (university as any)._id,
      status: 'active',
      invitationStatus: 'pending',
    }).populate({ path: 'userId', match: { email }, select: 'email' }).lean();
    if (pendingProfileByEmail && pendingProfileByEmail.userId) {
      const isExpired = !pendingProfileByEmail.invitationExpiresAt || pendingProfileByEmail.invitationExpiresAt < new Date();
      if (isExpired) {
        return this.renewInvitation(ownerUserId, pendingProfileByEmail, pendingProfileByEmail.userId, university, dto, college);
      }
      throw new ConflictException({ code: 'INVITATION_ALREADY_PENDING', message: 'توجد دعوة معلقة لهذا البريد الإلكتروني.' });
    }

    return this.createInvitation(ownerUserId, university, dto, college, email);
  }

  private async createInvitation(ownerUserId: string, university: any, dto: InviteUniversityStaffDto, college: any | null, email: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const temporaryPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
    const [firstName, ...lastParts] = dto.name.trim().split(/\s+/);
    const user = await this.userModel.create({
      firstName, lastName: lastParts.join(' ') || 'Staff', email, phone: dto.phone || '', password: temporaryPassword,
      userType: dto.role, status: 'pending_verification', isEmailVerified: true,
      resetPasswordToken: token, resetPasswordExpiry: expiresAt,
    } as any);
    let profile: any;
    try {
      profile = await this.model.create({
        userId: user._id, universityId: (university as any)._id, collegeId: college?._id,
        role: dto.role, permissions: this.normalizePermissions(dto.role, dto.permissions), status: 'active', invitationStatus: 'pending',
        invitedBy: new Types.ObjectId(ownerUserId), invitedAt: new Date(), lastInvitedAt: new Date(), invitationExpiresAt: expiresAt,
        invitationMessage: dto.message || '',
      } as any);
    } catch (error) {
      await this.userModel.deleteOne({ _id: user._id });
      throw error;
    }
    const emailSent = await this.sendInvitation(email, token, dto.name, university.name, dto.message);
    await this.notificationService.create({ userId: user._id, type: 'system', title: 'University staff invitation', titleAr: 'دعوة موظف جامعة', message: `You were invited to join ${university.name}.`, messageAr: `تمت دعوتك للانضمام إلى ${university.name}.`, actionUrl: '/reset-password' });
    await this.audit(ownerUserId, 'INVITE_UNIVERSITY_STAFF', profile._id.toString(), { role: dto.role, collegeId: dto.collegeId, email, emailSent });
    return { ...this.toDto({ ...profile.toObject(), userId: user.toObject ? user.toObject() : user, collegeId: college }), emailSent };
  }

  private async renewInvitation(ownerUserId: string, profile: any, user: any, university: any, dto: InviteUniversityStaffDto, college: any | null) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    const [firstName, ...lastParts] = dto.name.trim().split(/\s+/);
    const userName = [firstName, lastParts.join(' ') || 'Staff'].join(' ');
    await Promise.all([
      this.userModel.updateOne({ _id: user._id }, { $set: { firstName, lastName: lastParts.join(' ') || 'Staff', resetPasswordToken: token, resetPasswordExpiry: expiresAt, updatedAt: new Date() } }),
      this.model.updateOne({ _id: profile._id, universityId: (university as any)._id }, { $set: { role: dto.role, collegeId: college?._id, permissions: this.normalizePermissions(dto.role, dto.permissions), lastInvitedAt: new Date(), invitationExpiresAt: expiresAt, invitationMessage: dto.message || '', updatedAt: new Date() } }),
    ]);
    const emailSent = await this.sendInvitation(user.email || dto.email, token, userName, university.name, dto.message);
    await this.notificationService.create({ userId: user._id, type: 'system', title: 'University staff invitation renewed', titleAr: 'تجديد دعوة موظف جامعة', message: `Your invitation to join ${university.name} has been renewed.`, messageAr: `تم تجديد دعوتك للانضمام إلى ${university.name}.`, actionUrl: '/reset-password' });
    await this.audit(ownerUserId, 'RENEW_UNIVERSITY_STAFF_INVITATION', profile._id.toString(), { role: dto.role, collegeId: dto.collegeId, email: dto.email, emailSent });
    const updatedProfile = await this.model.findById(profile._id).populate('userId', 'firstName lastName email phone status lastLoginAt createdAt').populate('collegeId', 'name code').lean();
    return { ...this.toDto({ ...updatedProfile, collegeId: college }), emailSent };
  }

  async updateStaff(ownerUserId: string, staffId: string, dto: UpdateUniversityStaffDto) {
    const { university, profile, user } = await this.getOwnedStaff(ownerUserId, staffId);
    if (String(user._id) === ownerUserId || ['admin', 'super_admin', 'university'].includes(user.userType)) throw new ForbiddenException('This account cannot be managed as university staff');
    const role = dto.role || profile.role;
    const college = await this.validateCollege(university, role, dto.collegeId ?? profile.collegeId?.toString());
    const profileUpdate: any = { role, permissions: this.normalizePermissions(role, dto.permissions ?? profile.permissions), updatedAt: new Date() };
    if (role === UniversityStaffRole.COORDINATOR) profileUpdate.collegeId = college!._id;
    const profileOperation: any = { $set: profileUpdate };
    if (role !== UniversityStaffRole.COORDINATOR) profileOperation.$unset = { collegeId: 1 };
    const userUpdate: any = { userType: role, updatedAt: new Date() };
    if (dto.phone !== undefined) userUpdate.phone = dto.phone;
    if (dto.status !== undefined) {
      profileUpdate.status = dto.status;
      userUpdate.status = dto.status === 'inactive' ? 'suspended' : profile.invitationStatus === 'accepted' ? 'active' : 'pending_verification';
    }
    if (dto.name) { const [firstName, ...last] = dto.name.split(/\s+/); userUpdate.firstName = firstName; userUpdate.lastName = last.join(' ') || 'Staff'; }
    await Promise.all([
      this.model.updateOne({ _id: profile._id, universityId: (university as any)._id }, profileOperation),
      this.userModel.updateOne({ _id: user._id }, { $set: userUpdate }),
    ]);
    await this.audit(ownerUserId, 'UPDATE_UNIVERSITY_STAFF', staffId, { fromRole: profile.role, role, fromCollegeId: profile.collegeId, collegeId: college?._id, status: dto.status });
    return this.getOne(ownerUserId, staffId);
  }

  async setStatus(ownerUserId: string, staffId: string, status: 'active' | 'inactive') {
    const { university, profile, user } = await this.getOwnedStaff(ownerUserId, staffId);
    if (String(user._id) === ownerUserId) throw new ForbiddenException('You cannot change your own access');
    const userStatus = status === 'inactive' ? 'suspended' : profile.invitationStatus === 'accepted' ? 'active' : 'pending_verification';
    await Promise.all([
      this.model.updateOne({ _id: profile._id, universityId: (university as any)._id }, { $set: { status, updatedAt: new Date() } }),
      this.userModel.updateOne({ _id: user._id }, { $set: { status: userStatus, updatedAt: new Date() } }),
    ]);
    await this.audit(ownerUserId, status === 'active' ? 'ACTIVATE_UNIVERSITY_STAFF' : 'DEACTIVATE_UNIVERSITY_STAFF', staffId, { userId: user._id });
    return this.getOne(ownerUserId, staffId);
  }

  async resend(ownerUserId: string, staffId: string) {
    const { university, profile, user } = await this.getOwnedStaff(ownerUserId, staffId);
    if (profile.invitationStatus !== 'pending') throw new BadRequestException('Only pending invitations can be resent');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await Promise.all([
      this.userModel.updateOne({ _id: user._id }, { $set: { resetPasswordToken: token, resetPasswordExpiry: expiresAt } }),
      this.model.updateOne({ _id: profile._id }, { $set: { lastInvitedAt: new Date(), invitationExpiresAt: expiresAt } }),
    ]);
    const emailSent = await this.sendInvitation(user.email, token, `${user.firstName} ${user.lastName}`, university.name, profile.invitationMessage);
    await this.audit(ownerUserId, 'RESEND_UNIVERSITY_STAFF_INVITATION', staffId, { emailSent });
    return { message: 'Invitation resent', emailSent };
  }

  async cancelInvitation(ownerUserId: string, staffId: string) {
    const { university, profile, user } = await this.getOwnedStaff(ownerUserId, staffId);
    if (profile.invitationStatus !== 'pending') throw new BadRequestException('Only unused invitations can be cancelled');
    await this.model.deleteOne({ _id: profile._id, universityId: (university as any)._id });
    await this.userModel.deleteOne({ _id: user._id, status: 'pending_verification' });
    await this.audit(ownerUserId, 'CANCEL_UNIVERSITY_STAFF_INVITATION', staffId, { email: user.email });
    return { message: 'Invitation cancelled' };
  }

  async getOne(ownerUserId: string, staffId: string) {
    const university = await this.getOwnedUniversity(ownerUserId);
    const profile = await this.model.findOne({ _id: new Types.ObjectId(staffId), universityId: (university as any)._id }).populate('userId', 'firstName lastName email phone status lastLoginAt createdAt').populate('collegeId', 'name code').lean();
    if (!profile) throw new NotFoundException('Staff member not found');
    return this.toDto(profile as any);
  }

  private async getOwnedUniversity(userId: string): Promise<any> {
    const university = await this.universityModel.findOne({ userId: new Types.ObjectId(userId), status: 'active' }).lean();
    if (!university) throw new NotFoundException('Active university profile not found');
    return university;
  }

  private async getOwnedStaff(ownerUserId: string, staffId: string) {
    const university = await this.getOwnedUniversity(ownerUserId);
    const profile = await this.model.findOne({ _id: new Types.ObjectId(staffId), universityId: (university as any)._id }).lean();
    if (!profile) throw new NotFoundException('Staff member not found');
    const user = await this.userModel.findById(profile.userId).lean();
    if (!user) throw new NotFoundException('Staff user not found');
    return { university, profile: profile as any, user: user as any };
  }

  private async validateCollege(university: any, role: string, collegeId?: string): Promise<any | null> {
    if (role !== UniversityStaffRole.COORDINATOR) return null;
    if (!collegeId) throw new BadRequestException('collegeId is required for coordinators');
    const objectId = new Types.ObjectId(collegeId);
    const college = await this.collegeModel.collection.findOne({ _id: objectId, $or: [{ universityId: university._id }, { university: { $in: [university._id, university.userId] } }], 'metadata.status': { $ne: 'deleted' } } as any);
    if (!college) throw new ForbiddenException('College is outside this university');
    return college;
  }

  private permissionsFor(role: string): string[] {
    const read = ['dashboard:read', 'structure:read', 'students:read', 'analytics:read'];
    switch (role) {
      case UniversityStaffRole.COORDINATOR:
        return [
          ...read,
          'departments:read', 'departments:write',
          'study-plans:read', 'study-plans:write',
          'courses:read', 'courses:write',
          'course-skills:manage', 'curriculum-analysis:run', 'college-reports:read',
        ];
      case UniversityStaffRole.ACADEMIC_DEVELOPMENT_OFFICER:
        return [
          ...read,
          'curriculum-analysis:run',
          'study-plans:read', 'study-plans:write',
          'courses:read', 'courses:write',
          'course-skills:manage', 'college-reports:read',
        ];
      case UniversityStaffRole.DATA_OFFICER:
        return [...read, 'reports:read', 'audit:read', 'affiliations:write'];
      case UniversityStaffRole.QUALITY_OFFICER:
        return [...read, 'college-reports:read', 'audit:read', 'reports:read'];
      case UniversityStaffRole.UNIVERSITY_VIEWER:
      default:
        return read;
    }
  }

  private normalizePermissions(role: string, requested?: string[]): string[] {
    const defaults = this.permissionsFor(role);
    if (!requested) return defaults;
    const valid = (requested || [])
      .filter((permission): permission is string => typeof permission === 'string' && permission.trim().length > 0)
      .map((permission) => permission.trim())
      .filter((permission) => UNIVERSITY_STAFF_PERMISSIONS.includes(permission as any));
    return [...new Set(valid)];
  }

  private async sendInvitation(email: string, token: string, name: string, universityName: string, message?: string): Promise<boolean> {
    try { await this.emailService.sendUniversityStaffInvitation(email, token, name, universityName, message); return true; }
    catch (error: any) { this.logger.warn(`Staff invitation email failed for ${email}: ${error?.message || error}`); return false; }
  }

  private async audit(actorId: string, action: string, resourceId: string, details: Record<string, unknown>) {
    await this.auditLogModel.create({ actorId: new Types.ObjectId(actorId), action, resource: 'university_staff', resourceId, details, severity: 'info', timestamp: new Date() });
  }

  private toDto(profile: any) {
    const user = profile.userId || {};
    const college = profile.collegeId && typeof profile.collegeId === 'object' ? profile.collegeId : null;
    return {
      id: String(profile._id), userId: String(user._id || profile.userId), name: [user.firstName, user.lastName].filter(Boolean).join(' '),
      email: user.email || '', phone: user.phone || '', role: profile.role || 'coordinator', permissions: profile.permissions || [],
      college: college ? { id: String(college._id), name: college.name, code: college.code || '' } : null,
      status: profile.status || 'active', invitationStatus: profile.invitationStatus || 'accepted', lastLoginAt: user.lastLoginAt || null,
      createdAt: profile.createdAt || user.createdAt || null, lastInvitedAt: profile.lastInvitedAt || profile.invitedAt || null,
    };
  }
}
