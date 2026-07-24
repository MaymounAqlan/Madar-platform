import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Role, RoleDocument } from '../users/roles/schemas/role.schema';
import { Student, StudentDocument } from '../students/schemas/student.schema';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { University, UniversityDocument } from '../universities/schemas/university.schema';
import { AuditLog, AuditLogDocument } from '../common/audit-logs/schemas/audit-log.schema';
import { EmailService } from '../common/services/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { CompleteGoogleRegistrationDto } from './dto/complete-google-registration.dto';
import { CollegeCoordinator, CollegeCoordinatorDocument } from '../universities/college-coordinators/schemas/college-coordinator.schema';
import { College, CollegeDocument } from '../universities/colleges/schemas/college.schema';
import { Department, DepartmentDocument } from '../universities/departments/schemas/department.schema';
import { StudentAffiliation, StudentAffiliationDocument } from '../universities/student-affiliations/schemas/student-affiliation.schema';
import { AcademicProgram, AcademicProgramDocument } from '../universities/academic-programs/schemas/academic-program.schema';

type OAuthStatus = 'AUTH_SUCCESS' | 'USER_NOT_FOUND' | 'USER_EXISTS' | 'PROFILE_INCOMPLETE';

interface OAuthResult {
  status: OAuthStatus;
  message: string;
  user?: any;
  tokens?: { accessToken: string; refreshToken: string };
  provider?: string;
  oauthData?: {
    googleId?: string;
    linkedinId?: string;
    provider?: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string | null;
    role?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly emailService: EmailService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(University.name) private universityModel: Model<UniversityDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    @InjectModel(CollegeCoordinator.name) private coordinatorModel: Model<CollegeCoordinatorDocument>,
    @InjectModel(College.name) private collegeModel: Model<CollegeDocument>,
    @InjectModel(Department.name) private departmentModel: Model<DepartmentDocument>,
    @InjectModel(StudentAffiliation.name) private affiliationModel: Model<StudentAffiliationDocument>,
    @InjectModel(AcademicProgram.name) private programModel: Model<AcademicProgramDocument>,
  ) {}

  async register(dto: RegisterDto) {
    if (![UserRole.STUDENT, UserRole.COMPANY, UserRole.UNIVERSITY].includes(dto.role)) {
      throw new BadRequestException('Institutional staff accounts can only be created by a university invitation');
    }
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.userModel.findOne({ email }).lean();
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    if (dto.role === UserRole.STUDENT) {
      const profile = (dto.profile || {}) as Record<string, any>;
      const usesIds = Boolean(profile.universityId || profile.collegeId || profile.departmentId);
      const required = usesIds
        ? ['universityId', 'collegeId', 'departmentId', 'studentNumber', 'academicLevel', 'enrollmentYear', 'expectedGraduationYear']
        : ['university', 'college', 'department', 'academicLevel'];
      const missingFields = required.filter((field) => !profile[field]);
      if (missingFields.length > 0) {
        throw new BadRequestException(`Missing required student fields: ${missingFields.join(', ')}`);
      }
      if (usesIds) await this.validateAcademicSelection(profile);
    }
    if (dto.role === UserRole.COMPANY) {
      const profile = (dto.profile || {}) as Record<string, any>;
      const missingFields = ['companyName', 'industry', 'description']
        .filter((field) => !profile[field]);
      if (missingFields.length > 0) {
        throw new BadRequestException(`Missing required company fields: ${missingFields.join(', ')}`);
      }
    }
    if (dto.role === UserRole.UNIVERSITY) {
      const profile = (dto.profile || {}) as Record<string, any>;
      if (profile.logo || profile.logoUrl) this.assertPublicHttpsImageUrl(profile.logo || profile.logoUrl);
      const duplicateConditions: any[] = [
        { name: new RegExp('^' + this.escapeRegex(profile.universityName || profile.name) + '$', 'i') },
      ];
      if (profile.nameAr) duplicateConditions.push({ nameAr: new RegExp('^' + this.escapeRegex(profile.nameAr) + '$', 'i') });
      if (profile.emailDomain) duplicateConditions.push({ emailDomain: String(profile.emailDomain).toLowerCase() });
      if (await this.universityModel.exists({ $or: duplicateConditions })) {
        throw new ConflictException('University name or email domain is already registered');
      }
      const missingFields = ['universityName', 'description']
        .filter((field) => !profile[field]);
      if (missingFields.length > 0) {
        throw new BadRequestException(`Missing required university fields: ${missingFields.join(', ')}`);
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const userData: any = {
      firstName: dto.firstName,
      firstNameAr: dto.firstNameAr,
      lastName: dto.lastName,
      lastNameAr: dto.lastNameAr,
      email,
      password: hashedPassword,
      phone: dto.phone,
      userType: dto.role,
      status: 'active',
      isEmailVerified: false,
      profileCompleted: true,
      sessions: [],
    };

    // Only add role field if the schema supports it (for backward compat)
    // Use 'as any' to bypass strict schema checking
    const user = await this.userModel.create(userData);

    await this.createRoleSpecificProfile(user._id as Types.ObjectId, dto);

    const tokens = await this.generateTokens(user._id as Types.ObjectId, user.email, (dto.role as any));

    // Send welcome email
    const welcomeResult = await this.emailService.sendWelcomeEmail(user.email, `${user.firstName} ${user.lastName}`);
    if (!welcomeResult.success) {
      this.logger.warn(`Failed to send welcome email: ${welcomeResult.error || 'Unknown error'}`);
    }

    this.logger.log(`User registered: ${user.email} (${dto.role})`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  private normalizeEmail(value: string): string {
    if (!value) return '';
    return value
      .replace(/\uFEFF/g, '')
      .trim()
      .toLowerCase();
  }

  private normalizePhone(value: string): string {
    if (!value) return '';
    // Remove spaces, dashes, parentheses, dots, Arabic-Indic numerals, and BOM.
    const arabicToWestern: Record<string, string> = {
      '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
      '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    };
    return value
      .replace(/\uFEFF/g, '')
      .trim()
      .replace(/[\s\-\(\)\.]/g, '')
      .replace(/[٠-٩]/g, (c) => arabicToWestern[c] || c);
  }

  async login(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);
    const password = dto.password ? dto.password.replace(/\uFEFF/g, '') : '';
    const user = await this.userModel.findOne({ email }).lean();
    if (!user) {
      await this.writeAuditLog(
        new Types.ObjectId('000000000000000000000000'),
        'LOGIN_FAILED',
        'auth',
        'unknown',
        { email, reason: 'user_not_found' },
        'warning',
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    try {
      this.assertUserCanAuthenticate(user);
    } catch (authError: any) {
      await this.writeAuditLog(
        user._id as Types.ObjectId,
        'LOGIN_FAILED',
        'auth',
        user._id.toString(),
        { email: user.email, reason: authError?.response?.code || authError?.message || 'account_restricted' },
        'warning',
      );
      throw authError;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.writeAuditLog(
        user._id as Types.ObjectId,
        'LOGIN_FAILED',
        'auth',
        user._id.toString(),
        { email: user.email, reason: 'invalid_password' },
        'warning',
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.userModel.updateOne(
      { _id: user._id },
      { lastLoginAt: new Date() },
    );

    const role = (user as any).userType || (user as any).role || 'student';
    const tokens = await this.generateTokens(user._id as Types.ObjectId, user.email, role);
    await this.writeAuditLog(user._id as Types.ObjectId, 'LOGIN', 'auth', user._id.toString(), {
      email: user.email,
      role,
    });

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
        clockTolerance: 60,
      });

      const user = await this.userModel.findById(payload.sub).lean();
      if (!user) throw new UnauthorizedException({ code: 'USER_INACTIVE', message: 'User not found or inactive' });
      this.assertUserCanAuthenticate(user);

      const role = (user as any).userType || (user as any).role || 'student';
      if (role === UserRole.UNIVERSITY) {
        await this.universityModel.findOne({ userId: user._id }).select('status').lean();
      }
      const tokens = await this.generateTokens(user._id as Types.ObjectId, user.email, role);

      return tokens;
    } catch (error: any) {
      const actorId = error?.response?.sub ? new Types.ObjectId(error.response.sub) : new Types.ObjectId('000000000000000000000000');
      await this.writeAuditLog(
        actorId,
        'INVALID_REFRESH_TOKEN',
        'auth',
        'token',
        { reason: error?.message || 'invalid_or_expired' },
        'warning',
      );
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $set: { sessions: [] } },
    );
    await this.writeAuditLog(new Types.ObjectId(userId), 'LOGOUT', 'auth', userId, {});
    this.logger.log(`User logged out: ${userId}`);
    return { message: 'Logged out successfully' };
  }

  async updateMe(userId: string, dto: Record<string, any>) {
    const data: any = { ...dto };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const user = await this.userModel
      .findByIdAndUpdate(new Types.ObjectId(userId), data, { new: true })
      .select('-password -refreshTokens -twoFactorSecret')
      .lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.logger.log(`User ${userId} updated their profile`);
    return this.sanitizeUser(user);
  }

  async getMe(userId: string) {
    const user = await this.userModel.findById(new Types.ObjectId(userId)).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.assertUserCanAuthenticate(user);
    const permissions = await this.resolveUserPermissions(user._id as Types.ObjectId);
    const scope = await this.resolveUserScope(user);
    return { ...this.sanitizeUser(user), permissions, ...scope };
  }

  private async resolveUserScope(user: any): Promise<Record<string, any>> {
    const role = user.userType || user.role;
    try {
      if (role === UserRole.UNIVERSITY) {
        const university = await this.universityModel.findOne({ userId: user._id }).select('_id status').lean();
        if (university) {
          return { universityId: String(university._id), universityStatus: university.status };
        }
      }
      if (role === UserRole.COORDINATOR || ['university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer'].includes(role)) {
        const staff = await this.coordinatorModel.findOne({ userId: user._id, status: 'active', invitationStatus: 'accepted' }).lean();
        if (staff) {
          return {
            universityId: staff.universityId ? String(staff.universityId) : null,
            collegeId: staff.collegeId ? String(staff.collegeId) : null,
            staffRole: staff.role,
            allowedActions: staff.permissions || [],
          };
        }
      }
      if (role === UserRole.STUDENT) {
        const student = await this.studentModel.findOne({ userId: user._id }).select('academicInfo').lean();
        if (student?.academicInfo) {
          return {
            universityId: student.academicInfo.universityId ? String(student.academicInfo.universityId) : null,
            collegeId: student.academicInfo.collegeId ? String(student.academicInfo.collegeId) : null,
          };
        }
      }
      if (role === UserRole.COMPANY) {
        const company = await this.companyModel.findOne({ userId: user._id }).select('_id').lean();
        if (company) return { companyId: String(company._id) };
      }
    } catch (err: any) {
      this.logger.warn(`Failed to resolve user scope for ${user.email}: ${err.message}`);
    }
    return {};
  }

  async verifyEmail(email: string, code: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userModel.findOne({ email: normalizedEmail }).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }
    await this.userModel.updateOne({ _id: user._id }, { isEmailVerified: true });
    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
    this.logger.debug(`Forgot password requested for email: ${normalizedEmail}`);
    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) {
      this.logger.warn(`Forgot password requested for unknown email: ${email}`);
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link will be sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save to user document - use $set to avoid schema issues
    await this.userModel.findByIdAndUpdate(user._id, {
      $set: {
        resetPasswordToken: resetToken,
        resetPasswordExpiry: resetTokenExpiry,
      },
    } as any);

    const updatedUser = await this.userModel.findById(user._id).select('email resetPasswordToken resetPasswordExpiry').lean();
    this.logger.debug(`Reset token stored for ${email}: ${Boolean((updatedUser as any)?.resetPasswordToken)}. Expires at: ${(updatedUser as any)?.resetPasswordExpiry || 'missing'}`);

    // Send email
    const emailResult = await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.firstName || 'مستخدم',
    );
    if (emailResult.success) {
      this.logger.log(`Password reset email sent to: ${email}`);
    } else {
      this.logger.error(`Failed to send password reset email: ${emailResult.error || 'Unknown error'}`);
    }

    return { message: 'If the email exists, a reset link will be sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      this.logger.debug(`Reset password attempt. Has token: ${Boolean(token)}. Password length: ${newPassword?.length || 0}`);

      // Find user by reset token
      const user = await this.userModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpiry: { $gt: new Date() },
      } as any);

      if (!user) {
        const expiredOrMissingToken = await this.userModel.findOne({
          resetPasswordToken: token,
        } as any).select('email resetPasswordExpiry').lean();
        this.logger.warn(
          `Reset password failed. Token lookup result: ${
            expiredOrMissingToken
              ? `found user ${expiredOrMissingToken.email} but token expired at ${(expiredOrMissingToken as any).resetPasswordExpiry}`
              : 'no matching user for token'
          }`,
        );
        throw new BadRequestException('Invalid or expired reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userModel.updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedPassword,
            ...(user.status === 'pending_verification' ? { status: 'active' } : {}),
          },
          $unset: {
            resetPasswordToken: 1,
            resetPasswordExpiry: 1,
          },
        } as any,
      );

      if (['coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer'].includes((user as any).userType)) {
        await this.coordinatorModel.updateOne(
          { userId: user._id },
          { $set: { invitationStatus: 'accepted', status: 'active', updatedAt: new Date() } },
        );
      }

      this.logger.log(`Password reset successful for user: ${user.email}`);
      return { message: 'Password reset successfully' };
    } catch (error: any) {
      this.logger.error(
        `Reset password failed: ${error?.message || error}`,
        error?.stack,
      );
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  /**
   * Handle OAuth login (Google, LinkedIn)
   */
  async handleOAuthLogin(oauthUser: any, provider: string): Promise<OAuthResult> {
    try {
      if (!oauthUser?.email) {
        this.logger.error(`OAuth login missing email for provider=${provider}`);
        throw new BadRequestException({
          code: 'GOOGLE_AUTH_FAILED',
          message: 'OAuth profile must include an email address',
        });
      }

      oauthUser.email = this.normalizeEmail(oauthUser.email);

      this.logger.log(`OAuth login attempt: ${provider} - ${oauthUser.email}`);
      this.logger.debug(`OAuth payload received: ${JSON.stringify({
        provider,
        providerId: oauthUser.providerId,
        email: oauthUser.email,
        hasPicture: !!oauthUser.picture,
      })}`);

      if (!oauthUser.providerId) {
        this.logger.error(`OAuth login missing providerId for provider=${provider}`);
        throw new BadRequestException({
          code: 'OAUTH_PROFILE_INCOMPLETE',
          message: 'OAuth profile must include a provider identifier',
        });
      }

      const userIdField = provider === 'google' ? 'googleId' : 'linkedinId';
      const providerId = oauthUser.providerId;
      let user = await this.userModel.findOne({ [userIdField]: providerId } as any);

      if (!user) {
        // Normalize and search case-insensitively to repair legacy emails with different casing.
        const normalizedEmail = this.normalizeEmail(oauthUser.email);
        user = await this.userModel.findOne({
          $or: [
            { email: normalizedEmail },
            { email: { $regex: '^' + this.escapeRegex(normalizedEmail) + '$', $options: 'i' } },
          ],
        });
      }

      this.logger.debug(`OAuth user lookup result: ${user ? 'existing user found' : 'no user found'}`);

      if (!user) {
        return {
          status: 'USER_NOT_FOUND',
          message: 'لم يتم العثور على حساب، سيتم تحويلك لإنشاء حساب.',
          oauthData: {
            [userIdField]: providerId,
            provider,
            email: oauthUser.email,
            firstName: oauthUser.firstName || oauthUser.email.split('@')[0],
            lastName: oauthUser.lastName || 'User',
            avatar: oauthUser.picture || null,
            role: UserRole.STUDENT,
          },
          provider,
        };
      }

      this.assertUserCanAuthenticate(user);

      const existingRole = (user as any).userType || (user as any).role || UserRole.STUDENT;
      const isStaffRole = ['coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer'].includes(existingRole);
      const updateData: any = {
        [userIdField]: providerId,
        provider,
        // Mark OAuth-linked accounts as email verified.
        isEmailVerified: true,
      };
      if (!user.avatar && oauthUser.picture) {
        updateData.avatar = oauthUser.picture;
      }
      // Never overwrite existing names with OAuth data; only fill missing fields.
      if (!user.firstName) updateData.firstName = oauthUser.firstName || oauthUser.email.split('@')[0];
      if (!user.lastName) updateData.lastName = oauthUser.lastName || 'User';
      if (!(user as any).firstNameAr && !isStaffRole) updateData.firstNameAr = oauthUser.firstName || user.firstName;
      if (!(user as any).lastNameAr && !isStaffRole) updateData.lastNameAr = oauthUser.lastName || user.lastName;

      await this.userModel.findByIdAndUpdate(user._id, { $set: updateData });
      user = await this.userModel.findById(user._id);
      this.logger.log(`Existing user logged in via OAuth: ${user.email} (${provider}), role=${existingRole}`);

      // Staff/institutional roles are never sent to the OAuth completion page;
      // their access is governed by the institutional staff guard and invitation flow.
      if (isStaffRole) {
        const tokens = await this.generateTokens(user._id as Types.ObjectId, user.email, existingRole);
        return {
          status: 'AUTH_SUCCESS',
          message: 'تم تسجيل الدخول بنجاح.',
          tokens,
          user: this.sanitizeUser(user),
          provider,
        };
      }

      const profileComplete = (user as any).profileCompleted || (await this.isUserProfileComplete(user));
      if (!profileComplete) {
        return {
          status: 'PROFILE_INCOMPLETE',
          message: 'بيانات الحساب غير مكتملة، يرجى إكمال الملف الشخصي.',
          oauthData: {
            [userIdField]: providerId,
            provider,
            email: user.email,
            firstName: user.firstName || oauthUser.firstName || oauthUser.email.split('@')[0],
            lastName: user.lastName || oauthUser.lastName || 'User',
            avatar: user.avatar || oauthUser.picture || null,
            role: existingRole,
          },
          provider,
        };
      }

      // Generate tokens
      const role = (user as any).userType || (user as any).role || 'student';
      this.logger.debug(`Generating OAuth tokens for user=${user.email}, role=${role}`);
      const tokens = await this.generateTokens(
        user._id as Types.ObjectId,
        user.email,
        role,
      );

      return {
        status: 'AUTH_SUCCESS',
        message: 'تم تسجيل الدخول بنجاح.',
        tokens,
        user: this.sanitizeUser(user),
        provider,
      };
    } catch (error: any) {
      this.logger.error(
        `OAuth login failed for provider=${provider}, email=${oauthUser?.email || 'unknown'}: ${error?.message || error}`,
        error?.stack,
      );
      throw error;
    }
  }

  async completeGoogleRegistration(dto: CompleteGoogleRegistrationDto) {
    const provider = dto.googleId ? 'google' : dto.linkedinId ? 'linkedin' : null;
    const providerId = dto.googleId || dto.linkedinId;
    const userIdField = dto.googleId ? 'googleId' : 'linkedinId';

    if (!provider || !providerId) {
      this.logger.warn(`Complete OAuth registration rejected: missing provider id for email=${dto?.email || 'unknown'}`);
      throw new BadRequestException({
        code: 'OAUTH_PROVIDER_ID_REQUIRED',
        message: 'بيانات Google غير مكتملة، أعد المحاولة.',
      });
    }

    if (dto.role && ![UserRole.STUDENT, UserRole.COMPANY, UserRole.UNIVERSITY].includes(dto.role as UserRole)) {
      this.logger.warn(`Complete OAuth registration rejected: disallowed role=${dto.role} for email=${dto?.email || 'unknown'}`);
      throw new BadRequestException({
        code: 'OAUTH_ROLE_NOT_ALLOWED',
        message: 'لا يمكن إنشاء حسابات الإداريين أو المنسقين عبر Google.',
      });
    }

    try {
      const email = this.normalizeEmail(dto.email);
      const phone = this.normalizePhone(dto.phone);

      if (!phone || !/^\+?[0-9]{7,15}$/.test(phone)) {
        throw new BadRequestException({
          code: 'PHONE_REQUIRED',
          message: 'صيغة رقم الهاتف غير صالحة',
        });
      }

      this.validateGoogleProfileByRole(dto.role || UserRole.STUDENT, dto.profile || {});

      let user = await this.userModel.findOne({
        $or: [
          { [userIdField]: providerId },
          { email },
        ],
      } as any);

      if (user) {
        // Existing account found: preserve role/status/institutional links and safely link provider.
        this.assertUserCanAuthenticate(user);
        const existingRole = (user as any).userType || (user as any).role;
        const existingStatus = (user as any).status;
        // Reject OAuth completion for staff roles; they must be managed through invitations.
        if (['coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer'].includes(existingRole)) {
          throw new BadRequestException({
            code: 'OAUTH_STAFF_ROLE_NOT_ALLOWED',
            message: 'لا يمكن إكمال التسجيل عبر OAuth لحسابات الموظفين المؤسسيين.',
          });
        }
        const updatePayload: any = {
          provider,
          [userIdField]: providerId,
          isEmailVerified: true,
          profileCompleted: true,
        };
        // Preserve existing names; only fill missing fields and avoid overwriting Arabic names
        // with ASCII OAuth names.
        if (dto.firstName && !user.firstName) updatePayload.firstName = dto.firstName;
        if (dto.lastName && !user.lastName) updatePayload.lastName = dto.lastName;
        if (dto.firstName && !(user as any).firstNameAr) updatePayload.firstNameAr = dto.firstName;
        if (dto.lastName && !(user as any).lastNameAr) updatePayload.lastNameAr = dto.lastName;
        if (dto.avatar && !user.avatar) updatePayload.avatar = dto.avatar;
        if (phone && !user.phone) updatePayload.phone = phone;
        // Preserve existing role and status; do not downgrade an existing account to student.
        if (!existingRole && dto.role) updatePayload.userType = dto.role;
        if (!existingStatus) updatePayload.status = 'active';

        user = await this.userModel.findByIdAndUpdate(
          user._id,
          { $set: updatePayload },
          { new: true },
        );
        this.logger.log(`Existing ${provider} user linked/completed profile: ${user.email}, role=${existingRole || dto.role}`);
      } else {
        const generatedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
        user = await this.userModel.create({
          firstName: dto.firstName,
          lastName: dto.lastName,
          firstNameAr: dto.firstName,
          lastNameAr: dto.lastName,
          email,
          phone,
          password: generatedPassword,
          provider,
          [userIdField]: providerId,
          avatar: dto.avatar || null,
          userType: dto.role || UserRole.STUDENT,
          status: 'active',
          isEmailVerified: true,
          profileCompleted: true,
        } as any);
        this.logger.log(`New ${provider} registration created: ${user.email}`);
      }

      const resolvedRole = (user as any).userType || dto.role || UserRole.STUDENT;
      await this.ensureRoleSpecificProfile(
        user._id as Types.ObjectId,
        resolvedRole,
        {
          firstName: dto.firstName,
          phone,
          profile: dto.profile,
        },
      );

      // For students, store affiliation and academic info when IDs are provided.
      if (resolvedRole === UserRole.STUDENT && dto.profile) {
        await this.populateStudentOAuthProfile(user._id as Types.ObjectId, dto.profile);
      }

      const tokens = await this.generateTokens(user._id as Types.ObjectId, user.email, resolvedRole);

      return {
        status: 'AUTH_SUCCESS' as const,
        message: 'تم تسجيل الدخول بنجاح.',
        user: this.sanitizeUser(user),
        tokens,
      };
    } catch (error: any) {
      this.logger.error(
        `Complete ${provider} registration failed for email=${dto?.email || 'unknown'}: ${error?.message || error}`,
        error?.stack,
      );
      throw error;
    }
  }

  private validateGoogleProfileByRole(role: UserRole, profile: Record<string, any>): void {
    const missing: string[] = [];
    if (role === UserRole.STUDENT) {
      if (!profile.universityId) missing.push('universityId');
      if (!profile.collegeId) missing.push('collegeId');
      if (!profile.departmentId) missing.push('departmentId');
      if (!profile.academicLevel) missing.push('academicLevel');
      if (missing.length > 0) {
        this.logger.warn(`Google student registration rejected: missing ${missing.join(', ')}`);
        throw new BadRequestException({
          code: 'OAUTH_PROFILE_INCOMPLETE',
          message: `بيانات الطالب غير مكتملة: ${missing.includes('universityId') ? 'اختر الجامعة' : ''} ${missing.includes('collegeId') ? 'اختر الكلية' : ''} ${missing.includes('departmentId') ? 'اختر القسم' : ''} ${missing.includes('academicLevel') ? 'المستوى الأكاديمي مطلوب' : ''}`.trim(),
          details: { missing },
        });
      }
      if (![profile.universityId, profile.collegeId, profile.departmentId].every((value) => Types.ObjectId.isValid(value))) {
        throw new BadRequestException({
          code: 'INVALID_ACADEMIC_SELECTION',
          message: 'معرف الجامعة أو الكلية أو القسم غير صالح',
        });
      }
    }
    if (role === UserRole.COMPANY) {
      if (!profile.companyName) missing.push('companyName');
      if (!profile.industry) missing.push('industry');
      if (missing.length > 0) {
        this.logger.warn(`Google company registration rejected: missing ${missing.join(', ')}`);
        throw new BadRequestException({
          code: 'OAUTH_PROFILE_INCOMPLETE',
          message: 'بيانات الشركة غير مكتملة',
          details: { missing },
        });
      }
    }
    if (role === UserRole.UNIVERSITY) {
      if (!profile.universityName) missing.push('universityName');
      if (missing.length > 0) {
        this.logger.warn(`Google university registration rejected: missing ${missing.join(', ')}`);
        throw new BadRequestException({
          code: 'OAUTH_PROFILE_INCOMPLETE',
          message: 'بيانات الجامعة غير مكتملة',
          details: { missing },
        });
      }
    }
  }

  private async populateStudentOAuthProfile(userId: Types.ObjectId, profile: Record<string, any>): Promise<void> {
    try {
      const selection = await this.validateAcademicSelection(profile);
      const existingStudent = await this.studentModel.findOne({ userId }).lean();
      if (existingStudent) {
        await this.studentModel.updateOne(
          { userId },
          {
            $set: {
              'academicInfo.universityId': selection.university._id,
              'academicInfo.collegeId': selection.college._id,
              'academicInfo.departmentId': selection.department._id,
              'academicInfo.majorId': selection.major?._id,
              'academicInfo.universityName': selection.university.name,
              'academicInfo.collegeName': selection.college.name,
              'academicInfo.departmentName': selection.department.name,
              'academicInfo.majorName': selection.major?.nameAr || selection.major?.nameEn || '',
              'academicInfo.studentId': profile.studentNumber || '',
              'academicInfo.academicLevel': profile.academicLevel || 'freshman',
              'academicInfo.enrollmentYear': profile.enrollmentYear ? Number(profile.enrollmentYear) : undefined,
              'academicInfo.expectedGraduation': profile.expectedGraduationYear ? Number(profile.expectedGraduationYear) : undefined,
            },
          },
        );
      }
      const existingAffiliation = await this.affiliationModel.findOne({ studentId: existingStudent?._id, universityId: selection.university._id }).lean();
      if (!existingAffiliation) {
        await this.affiliationModel.create({
          studentId: existingStudent?._id,
          universityId: selection.university._id,
          collegeId: selection.college._id,
          departmentId: selection.department._id,
          studentNumber: profile.studentNumber || '',
          academicLevel: profile.academicLevel,
          enrollmentYear: profile.enrollmentYear ? Number(profile.enrollmentYear) : undefined,
          expectedGraduationYear: profile.expectedGraduationYear ? Number(profile.expectedGraduationYear) : undefined,
          status: profile.studentStatus === 'graduate' ? 'graduated' : 'pending',
          verificationMethod: 'self_reported',
          graduationDate: profile.studentStatus === 'graduate' ? new Date() : undefined,
          isCurrent: true,
          proofDocumentUrl: profile.proofDocumentUrl || undefined,
          decisions: [],
        } as any);
      }
    } catch (err: any) {
      // Validation errors from validateAcademicSelection already have proper codes; rethrow.
      if (err instanceof BadRequestException || err instanceof ConflictException) throw err;
      this.logger.warn(`Failed to populate student OAuth profile for userId=${userId}: ${err.message}`);
    }
  }

  private async generateTokens(userId: Types.ObjectId, email: string, role: string) {
    // JWT intentionally limited to user identity and system role only.
    // Permissions are resolved independently from MongoDB role templates; they are never embedded in the token.
    const payload = { sub: userId.toString(), email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async resolveUserPermissions(userId: Types.ObjectId): Promise<string[]> {
    try {
      const user = await this.userModel.findById(userId).select('roleId userType').lean();
      if (!user || !user.roleId) return [];
      const role = await this.roleModel.findById(user.roleId).select('permissions').lean();
      return Array.isArray(role?.permissions) ? role.permissions : [];
    } catch {
      return [];
    }
  }

  private async createRoleSpecificProfile(userId: Types.ObjectId, dto: RegisterDto) {
    const { role, profile } = dto as any;

    if (role === UserRole.STUDENT) {
      const selection = profile?.universityId ? await this.validateAcademicSelection(profile) : null;
      const student = await this.studentModel.create({
        userId,
        academicInfo: {
          universityId: selection?.university._id || null,
          collegeId: selection?.college._id || null,
          departmentId: selection?.department._id || null,
          majorId: selection?.major?._id || null,
          universityName: selection?.university.name || profile?.university || '',
          collegeName: selection?.college.name || profile?.college || '',
          departmentName: selection?.department.name || profile?.department || '',
          majorName: selection?.major?.nameAr || selection?.major?.nameEn || profile?.major || '',
          studentId: profile?.studentNumber || '',
          enrollmentYear: profile?.enrollmentYear,
          academicLevel: profile?.academicLevel || 'freshman',
          expectedGraduation: profile?.expectedGraduationYear || profile?.graduationYear,
          gpa: profile?.gpa || 0,
        },
        personalInfo: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone || '',
          avatarUrl: '',
        },
        professionalProfile: {
          careerInterests: [],
        },
        skills: [],
        projects: [],
        certifications: [],
        courses: [],
      } as any);
      if (selection) {
        await this.affiliationModel.create({
          studentId: student._id,
          universityId: selection.university._id,
          collegeId: selection.college._id,
          departmentId: selection.department._id,
          studentNumber: profile.studentNumber,
          academicLevel: profile.academicLevel,
          enrollmentYear: Number(profile.enrollmentYear),
          expectedGraduationYear: Number(profile.expectedGraduationYear),
          status: profile.studentStatus === 'graduate' ? 'graduated' : 'pending',
          verificationMethod: 'self_reported',
          graduationDate: profile.studentStatus === 'graduate' ? new Date() : undefined,
          isCurrent: true,
          proofDocumentUrl: profile.proofDocumentUrl || undefined,
          decisions: [],
        } as any);
      }
    } else if (role === UserRole.COMPANY) {
      await this.companyModel.create({
        userId,
        profile: {
          name: profile?.companyName || profile?.name || dto.firstName,
          legalName: profile?.legalName || profile?.companyName || profile?.name || dto.firstName,
          description: profile?.description || '',
          industry: profile?.industry || '',
          subIndustries: profile?.industryDomains || [],
          companySize: this.normalizeCompanySize(profile?.size),
          website: profile?.website || '',
          logoUrl: profile?.logo || profile?.logoUrl || '',
          coverImageUrl: profile?.banner || profile?.bannerUrl || '',
        },
        headquarters: this.parseCompanyLocation(profile?.location || ''),
        locations: profile?.location ? [{ ...this.parseCompanyLocation(profile.location), isHeadquarters: true }] : [],
        contactInfo: {
          email: dto.email.toLowerCase(),
          phone: dto.phone || profile?.phone || '',
          hrEmail: profile?.hrEmail || dto.email.toLowerCase(),
          linkedIn: profile?.socialLinks?.linkedIn || '',
          twitter: profile?.socialLinks?.twitter || '',
        },
        culture: {
          values: profile?.values || [],
          benefits: profile?.benefits || [],
          workEnvironment: profile?.mission || '',
          diversityStatement: profile?.vision || '',
        },
        recruitmentPreferences: {
          targetMajors: profile?.technologies || [],
        },
        status: 'active',
      } as any);
    } else if (role === UserRole.UNIVERSITY) {
      await this.universityModel.create({
        userId,
        name: profile?.universityName || profile?.name || dto.firstName,
        nameAr: profile?.nameAr || '',
        shortName: profile?.shortName || '',
        description: profile?.description || '',
        descriptionAr: profile?.descriptionAr || '',
        branding: {
          logoUrl: profile?.logo || profile?.logoUrl || '',
          primaryColor: profile?.primaryColor || '',
          secondaryColor: profile?.secondaryColor || '',
        },
        type: profile?.type || 'public',
        location: {
          city: profile?.city || this.parseCompanyLocation(profile?.location || '').city,
          country: profile?.country || this.parseCompanyLocation(profile?.location || '').country,
          address: profile?.address || profile?.location || '',
        },
        contactInfo: {
          email: dto.email.toLowerCase(),
          phone: dto.phone || profile?.phone || '',
          website: profile?.website || '',
          hrEmail: profile?.officialContact || profile?.officialEmail || dto.email.toLowerCase(),
        },
        emailDomain: profile?.emailDomain ? String(profile.emailDomain).toLowerCase() : undefined,
        licenseNumber: profile?.licenseNumber || '',
        accreditationDocumentUrl: profile?.accreditationDocumentUrl || '',
        registrationNotes: profile?.registrationNotes || '',
        officialContact: {
          fullName: profile?.officialContactName || (dto.firstName + ' ' + dto.lastName).trim(),
          jobTitle: profile?.jobTitle || '',
          email: profile?.officialContact || profile?.officialEmail || dto.email.toLowerCase(),
          phone: profile?.officialPhone || dto.phone || '',
        },
        colleges: [],
        status: 'pending',
        submittedAt: new Date(),
      } as any);
    }
  }

  private async ensureRoleSpecificProfile(userId: Types.ObjectId, role: string, dto: { firstName?: string; phone?: string; profile?: Record<string, any> }) {
    if (role === UserRole.STUDENT) {
      const existing = await this.studentModel.findOne({ userId }).lean();
      if (!existing) {
        await this.studentModel.create({
          userId,
          academicInfo: {
            universityId: dto.profile?.universityId ? new Types.ObjectId(dto.profile.universityId) : null,
            collegeId: dto.profile?.collegeId ? new Types.ObjectId(dto.profile.collegeId) : null,
            departmentId: dto.profile?.departmentId ? new Types.ObjectId(dto.profile.departmentId) : null,
            universityName: dto.profile?.universityName || '',
            collegeName: dto.profile?.collegeName || '',
            departmentName: dto.profile?.departmentName || '',
            studentId: dto.profile?.studentNumber || '',
            academicLevel: dto.profile?.academicLevel || 'freshman',
            enrollmentYear: dto.profile?.enrollmentYear ? Number(dto.profile.enrollmentYear) : undefined,
            expectedGraduation: dto.profile?.expectedGraduationYear ? Number(dto.profile.expectedGraduationYear) : undefined,
            gpa: dto.profile?.gpa || 0,
          },
          personalInfo: {
            firstName: dto.firstName || '',
            lastName: dto.profile?.lastName || '',
            phone: dto.phone || '',
            avatarUrl: dto.profile?.avatar || '',
          },
          skills: [],
          projects: [],
          certifications: [],
          courses: [],
        } as any);
      }
      return;
    }

    if (role === UserRole.COMPANY) {
      const existing = await this.companyModel.findOne({ userId }).lean();
      if (!existing) {
        await this.companyModel.create({
          userId,
          profile: {
            name: dto.profile?.companyName || dto.profile?.name || dto.firstName || 'Company',
            legalName: dto.profile?.legalName || dto.profile?.companyName || dto.profile?.name || dto.firstName,
            description: dto.profile?.description || '',
            industry: dto.profile?.industry || '',
            subIndustries: dto.profile?.industryDomains || [],
            companySize: this.normalizeCompanySize(dto.profile?.size),
            website: dto.profile?.website || '',
            logoUrl: dto.profile?.logo || dto.profile?.logoUrl || '',
            coverImageUrl: dto.profile?.banner || dto.profile?.bannerUrl || '',
          },
          headquarters: this.parseCompanyLocation(dto.profile?.location || ''),
          locations: dto.profile?.location ? [{ ...this.parseCompanyLocation(dto.profile.location), isHeadquarters: true }] : [],
          contactInfo: {
            email: dto.profile?.email || '',
            phone: dto.phone || dto.profile?.phone || '',
            hrEmail: dto.profile?.hrEmail || dto.profile?.email || '',
            linkedIn: dto.profile?.socialLinks?.linkedIn || '',
            twitter: dto.profile?.socialLinks?.twitter || '',
          },
          culture: {
            values: dto.profile?.values || [],
            benefits: dto.profile?.benefits || [],
            workEnvironment: dto.profile?.mission || '',
            diversityStatement: dto.profile?.vision || '',
          },
          recruitmentPreferences: {
            targetMajors: dto.profile?.technologies || [],
          },
          status: 'active',
        } as any);
      }
      return;
    }

    if (role === UserRole.UNIVERSITY) {
      const existing = await this.universityModel.findOne({ userId }).lean();
      if (!existing) {
        await this.universityModel.create({
          userId,
          name: dto.profile?.universityName || dto.profile?.name || dto.firstName || 'University',
          nameAr: dto.profile?.nameAr || '',
          shortName: dto.profile?.shortName || '',
          description: dto.profile?.description || '',
          descriptionAr: dto.profile?.descriptionAr || '',
          branding: {
            logoUrl: dto.profile?.logo || dto.profile?.logoUrl || '',
            primaryColor: dto.profile?.primaryColor || '',
            secondaryColor: dto.profile?.secondaryColor || '',
          },
          type: dto.profile?.type || 'public',
          location: {
            city: dto.profile?.city || this.parseCompanyLocation(dto.profile?.location || '').city,
            country: dto.profile?.country || this.parseCompanyLocation(dto.profile?.location || '').country,
            address: dto.profile?.address || dto.profile?.location || '',
          },
          contactInfo: {
            email: dto.profile?.email || '',
            phone: dto.phone || dto.profile?.phone || '',
            website: dto.profile?.website || '',
            hrEmail: dto.profile?.officialContact || dto.profile?.officialEmail || dto.profile?.email || '',
          },
          emailDomain: dto.profile?.emailDomain ? String(dto.profile.emailDomain).toLowerCase() : undefined,
          licenseNumber: dto.profile?.licenseNumber || '',
          accreditationDocumentUrl: dto.profile?.accreditationDocumentUrl || '',
          registrationNotes: dto.profile?.registrationNotes || '',
          officialContact: {
            fullName: dto.profile?.officialContactName || (dto.firstName || '') + ' ' + (dto.profile?.lastName || '').trim(),
            jobTitle: dto.profile?.jobTitle || '',
            email: dto.profile?.officialContact || dto.profile?.officialEmail || dto.profile?.email || '',
            phone: dto.profile?.officialPhone || dto.phone || '',
          },
          colleges: [],
          status: 'pending',
          submittedAt: new Date(),
        } as any);
      }
    }
  }

  private async isUserProfileComplete(user: any): Promise<boolean> {
    if (!user) return false;
    if (user.profileCompleted) return true;

    const role = user?.userType || user?.role;
    if (!role) return false;

    // Staff/coordinator roles are not considered incomplete for OAuth purposes;
    // their access is controlled by the institutional staff guard.
    if (
      ['coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer'].includes(role)
    ) {
      return true;
    }

    // University accounts require a university profile.
    if (role === UserRole.UNIVERSITY) {
      const university = await this.universityModel.findOne({ userId: user._id }).lean();
      return Boolean(university);
    }

    // Company accounts require a company profile.
    if (role === UserRole.COMPANY) {
      const company = await this.companyModel.findOne({ userId: user._id }).lean();
      return Boolean(company);
    }

    // Student accounts require both a phone and a student profile.
    if (role === UserRole.STUDENT) {
      const student = await this.studentModel.findOne({ userId: user._id }).lean();
      return Boolean(user.phone && student);
    }

    // Admins only need a phone number.
    return Boolean(user.phone);
  }

  private assertUserCanAuthenticate(user: any): void {
    if (user?.status === 'suspended') {
      throw new UnauthorizedException({ code: 'USER_SUSPENDED', message: 'Account is suspended' });
    }
    if (!user || ['banned', 'inactive', 'deleted'].includes(user.status)) {
      throw new UnauthorizedException({ code: 'USER_INACTIVE', message: 'Account is inactive' });
    }
  }

  private sanitizeUser(user: any) {
    const obj = user.toObject ? user.toObject() : user;
    const { password, resetPasswordToken, resetPasswordExpiry, twoFactorSecret, ...sanitized } = obj;
    return {
      ...sanitized,
      id: sanitized.id || sanitized._id?.toString?.() || sanitized._id,
      role: sanitized.role || sanitized.userType || 'student',
      userType: sanitized.userType || sanitized.role || 'student',
      isEmailVerified: sanitized.isEmailVerified ?? sanitized.emailVerified ?? false,
      profileCompleted: sanitized.profileCompleted ?? false,
    };
  }

  private async validateAcademicSelection(profile: Record<string, any>): Promise<{ university: any; college: any; department: any; major: any | null }> {
    if (![profile.universityId, profile.collegeId, profile.departmentId].every((value) => Types.ObjectId.isValid(value))) {
      throw new BadRequestException({ code: 'INVALID_ACADEMIC_SELECTION', message: 'University, college, and department identifiers are invalid' });
    }
    const university = await this.universityModel.findOne({ _id: new Types.ObjectId(profile.universityId), status: 'active', isActive: true, deletedAt: { $exists: false } }).lean();
    if (!university) throw new BadRequestException({ code: 'UNIVERSITY_NOT_AVAILABLE', message: 'Selected university is not active' });
    const college = await this.collegeModel.findOne({ _id: new Types.ObjectId(profile.collegeId), universityId: (university as any)._id, isActive: true, deletedAt: { $exists: false }, 'metadata.status': { $nin: ['archived', 'deleted'] } }).lean();
    if (!college) throw new BadRequestException({ code: 'COLLEGE_NOT_AVAILABLE', message: 'Selected college does not belong to the university' });
    const department = await this.departmentModel.findOne({ _id: new Types.ObjectId(profile.departmentId), collegeId: (college as any)._id, universityId: (university as any)._id, isActive: true, deletedAt: { $exists: false }, 'metadata.status': { $nin: ['archived', 'deleted'] } }).lean();
    if (!department) throw new BadRequestException({ code: 'DEPARTMENT_NOT_AVAILABLE', message: 'Selected department does not belong to the college' });
    if (await this.affiliationModel.exists({ universityId: (university as any)._id, studentNumber: profile.studentNumber })) {
      throw new ConflictException({ code: 'STUDENT_NUMBER_EXISTS', message: 'Student number is already registered at this university' });
    }
    const major = profile.majorId
      ? await this.programModel.findOne({ _id: new Types.ObjectId(profile.majorId), universityId: (university as any)._id, collegeId: (college as any)._id, departmentId: (department as any)._id, isActive: true, deletedAt: { $exists: false } }).lean()
      : null;
    if (profile.majorId && !major) throw new BadRequestException({ code: 'MAJOR_NOT_AVAILABLE', message: 'Selected major does not belong to the department' });
    return { university, college, department, major };
  }

  private normalizeCompanySize(size?: string): string {
    const map: Record<string, string> = { '1-50': '11-50', '201-1000': '201-500' };
    return map[String(size || '')] || size || '11-50';
  }

  private async writeAuditLog(
    userId: Types.ObjectId,
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
  ): Promise<void> {
    try {
      await this.auditLogModel.create({
        userId,
        actorId: userId,
        action,
        resource,
        resourceId,
        details,
        severity,
        timestamp: new Date(),
      });
    } catch (error: any) {
      this.logger.warn(`Audit log write failed for ${action}: ${error?.message || error}`);
    }
  }

  private escapeRegex(value: string): string {
    return String(value || '').replace(/[.*+?^$()|[\]\\]/g, '\\$&');
  }

  private assertPublicHttpsImageUrl(value: string): void {
    let url: URL;
    try { url = new URL(value); } catch { throw new BadRequestException('Invalid university logo URL'); }
    const host = url.hostname.toLowerCase();
    const privateHost = host === 'localhost' || host === '::1' || host.endsWith('.local')
      || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)
      || /^169\.254\./.test(host) || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(host);
    if (url.protocol !== 'https:' || privateHost) throw new BadRequestException('University logo must use a public HTTPS URL');
  }

  private parseCompanyLocation(location: string) {
    const parts = String(location || '').split(/[,،|-]/).map((part) => part.trim()).filter(Boolean);
    return {
      city: parts[0] || '',
      country: parts[1] || 'Saudi Arabia',
      address: location || '',
    };
  }
}
