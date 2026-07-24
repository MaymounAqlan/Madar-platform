import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
  Req,
  ForbiddenException,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UsersService } from './users.service';
import { AdminService } from './admin.service';
import { AdminOperationsService } from './admin-operations.service';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ResendVerificationDto,
  SendResetPasswordDto,
  SendTestEmailDto,
  UpdateSecurityAlertDto,
} from './dto/admin-user-action.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { ReviewUniversityDto } from './dto/review-university.dto';
import { AdminPermission } from './permissions/permission.registry';
import { AdminSecurityExceptionFilter } from '../common/filters/admin-security.filter';
import { Role, RoleDocument } from './roles/schemas/role.schema';
import { User, UserDocument } from './schemas/user.schema';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { MatchingService } from '../matching/matching.service';
import { AdminAiService } from '../admin-ai/admin-ai.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateDirectoryCollegeDto, CreateDirectoryDepartmentDto, CreateDirectoryMajorDto, CreateDirectoryUniversityDto, ImportUniversityDirectoryDto, MergeUniversityDirectoryDto, UpdateDirectoryUniversityDto } from './dto/manage-university-directory.dto';

@ApiTags('Admin')
@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseFilters(AdminSecurityExceptionFilter)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminService: AdminService,
    private readonly adminOperationsService: AdminOperationsService,
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly matchingService: MatchingService,
    private readonly adminAiService: AdminAiService,
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  private getAdminId(req: Request): string {
    return (req as any).user?.sub;
  }

  private async resolveUserPermissions(userId?: string, roleId?: string | Types.ObjectId | null): Promise<string[]> {
    let resolvedRoleId = roleId;
    if (!resolvedRoleId && userId) {
      const user = await this.userModel.findById(userId).select('roleId').lean();
      resolvedRoleId = user?.roleId;
    }
    if (!resolvedRoleId) {
      return [];
    }
    const role = await this.roleModel.findById(resolvedRoleId).select('permissions').lean();
    return Array.isArray(role?.permissions) ? role.permissions : [];
  }

  private async getAdminPermissions(req: Request): Promise<string[]> {
    const user = (req as any).user;
    if (!user) return [];
    if (user.role === UserRole.SUPER_ADMIN) return ['*'];
    return this.resolveUserPermissions(user.sub, user.roleId);
  }

  // ==========================================
  // Dashboard & metrics
  // ==========================================

  @Get('dashboard-metrics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get real dashboard metrics from MongoDB' })
  async getDashboardMetrics() {
    return this.adminOperationsService.getDashboardMetrics();
  }

  @Get('metrics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get platform metrics' })
  async getMetrics() {
    return this.adminService.getAIMetrics();
  }

  @Get('health')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get system health status' })
  async getHealth() {
    return this.buildHealthResponse();
  }

  @Get('monitoring')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get system monitoring status (alias for health)' })
  async getMonitoring() {
    return this.buildHealthResponse();
  }

  private async buildHealthResponse() {
    const checks = await this.adminOperationsService.getServiceHealth();
    const allHealthy = Object.values(checks).every((c: any) => c.status === 'healthy');
    const anyDown = Object.values(checks).some((c: any) => c.status === 'down');
    return {
      status: allHealthy ? 'healthy' : anyDown ? 'unhealthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks,
    };
  }

  @Get('performance')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get performance KPIs' })
  async getPerformanceKPIs() {
    return this.adminService.getPerformanceKPIs();
  }

  // ==========================================
  // User management
  // ==========================================

  @Get('users')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.USERS_READ)
  @ApiOperation({ summary: 'List all users' })
  async findAll(@Query() query: any) {
    return this.usersService.findAll(query);
  }

  @Get('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.USERS_READ)
  @ApiOperation({ summary: 'Get user by ID' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('users/:id/admin-view')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.USERS_READ)
  @ApiOperation({ summary: 'Get administrative view of user with activity log' })
  async getAdminUserView(@Param('id') id: string) {
    return this.adminOperationsService.getAdminUserView(id);
  }

  @Post('users')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.USERS_WRITE)
  @ApiOperation({ summary: 'Create a new user' })
  async create(@Body() dto: CreateUserDto, @Req() req: Request) {
    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot create Super Admin accounts');
    }
    return this.usersService.create(dto);
  }

  @Put('users/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.USERS_WRITE)
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() updateData: any, @Req() req: Request) {
    const user = await this.usersService.findById(id);
    if (user.userType === UserRole.SUPER_ADMIN) throw new ForbiddenException('Cannot edit Super Admin');
    if (updateData.role === UserRole.SUPER_ADMIN || updateData.userType === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot assign Super Admin role');
    }
    return this.usersService.update(id, updateData);
  }

  @Put('users/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.USERS_STATUS)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: Request) {
    const adminId = this.getAdminId(req);
    if (adminId === id) throw new ForbiddenException('Cannot change your own status');
    const user = await this.usersService.findById(id);
    if (user.userType === UserRole.SUPER_ADMIN) throw new ForbiddenException('Cannot modify Super Admin status');
    return this.usersService.updateStatus(id, status);
  }

  @Post('users/:id/resend-verification')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.USERS_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email to user' })
  async resendVerification(@Param('id') id: string, @Body() dto: ResendVerificationDto, @Req() req: Request) {
    return this.adminOperationsService.resendVerificationEmail(id, this.getAdminId(req));
  }

  @Post('users/:id/send-reset-password')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.USERS_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send password reset link to user' })
  async sendResetPassword(@Param('id') id: string, @Body() dto: SendResetPasswordDto, @Req() req: Request) {
    return this.adminOperationsService.sendPasswordResetLink(id, this.getAdminId(req));
  }

  @Delete('users/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.USERS_WRITE)
  @ApiOperation({ summary: 'Delete user (super-admin only)' })
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'User deleted successfully' };
  }

  @Post('users/:id/invalidate-sessions')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.USERS_SESSIONS)
  @ApiOperation({ summary: 'Invalidate all user sessions' })
  async invalidateSessions(@Param('id') id: string, @Req() req: Request) {
    return this.adminOperationsService.invalidateUserSessions(id, this.getAdminId(req));
  }

  // ==========================================
  // Administrative accounts
  // ==========================================

  @Get('admin-accounts')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ADMIN_ACCOUNTS_READ)
  @ApiOperation({ summary: 'List administrative accounts' })
  async listAdminAccounts(@Query() query: any) {
    return this.adminOperationsService.listAdminAccounts(query);
  }

  @Post('admin-accounts')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ADMIN_ACCOUNTS_WRITE)
  @ApiOperation({ summary: 'Create administrative account' })
  async createAdminAccount(@Body() data: any, @Req() req: Request) {
    return this.adminOperationsService.createAdminAccount(this.getAdminId(req), data, await this.getAdminPermissions(req));
  }

  @Put('admin-accounts/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ADMIN_ACCOUNTS_WRITE)
  @ApiOperation({ summary: 'Update administrative account' })
  async updateAdminAccount(@Param('id') id: string, @Body() data: any, @Req() req: Request) {
    return this.adminOperationsService.updateAdminAccount(this.getAdminId(req), id, data, await this.getAdminPermissions(req));
  }

  @Patch('admin-accounts/:id/disable')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ADMIN_ACCOUNTS_WRITE)
  @ApiOperation({ summary: 'Disable administrative account' })
  async disableAdminAccount(@Param('id') id: string, @Req() req: Request) {
    return this.adminOperationsService.disableAdminAccount(this.getAdminId(req), id);
  }

  @Patch('admin-accounts/:id/reactivate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ADMIN_ACCOUNTS_WRITE)
  @ApiOperation({ summary: 'Reactivate administrative account' })
  async reactivateAdminAccount(@Param('id') id: string, @Req() req: Request) {
    return this.adminOperationsService.reactivateAdminAccount(this.getAdminId(req), id);
  }

  // ==========================================
  // Roles and permissions
  // ==========================================

  @Get('roles')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ROLES_READ)
  @ApiOperation({ summary: 'List all roles' })
  async getRoles() {
    return this.adminService.getRoles();
  }

  @Post('roles')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ROLES_WRITE)
  @ApiOperation({ summary: 'Create a new operational role template' })
  async createRole(@Body() data: any, @Req() req: Request) {
    if (data.name && ['student', 'company', 'university', 'coordinator', 'admin', 'super_admin'].includes(data.name)) {
      throw new ForbiddenException('Cannot create a new system role');
    }
    return this.adminService.createRole(this.getAdminId(req), data);
  }

  @Get('permissions')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ROLES_READ)
  @ApiOperation({ summary: 'List all permissions' })
  async getPermissions() {
    return this.adminService.getPermissions();
  }

  @Put('roles/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ROLES_WRITE)
  @ApiOperation({ summary: 'Update an operational role template' })
  async updateRole(@Param('id') roleId: string, @Body() data: any, @Req() req: Request) {
    return this.adminService.updateRole(this.getAdminId(req), roleId, data);
  }

  @Delete('roles/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ROLES_WRITE)
  @ApiOperation({ summary: 'Delete an operational role template' })
  async deleteRole(@Param('id') roleId: string, @Req() req: Request) {
    return this.adminService.deleteRole(this.getAdminId(req), roleId);
  }

  @Put('permissions/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ROLES_WRITE)
  @ApiOperation({ summary: 'Update a permission' })
  async updatePermission(@Param('id') permId: string, @Body() data: any, @Req() req: Request) {
    return this.adminService.updatePermission(this.getAdminId(req), permId, data);
  }

  @Delete('permissions/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ROLES_WRITE)
  @ApiOperation({ summary: 'Delete a permission' })
  async deletePermission(@Param('id') permId: string, @Req() req: Request) {
    return this.adminService.deletePermission(this.getAdminId(req), permId);
  }

  @Put('users/:id/role')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.ROLES_WRITE)
  @ApiOperation({ summary: 'Assign role template to user' })
  async assignRole(@Param('id') userId: string, @Body('roleId') roleId: string, @Req() req: Request) {
    const role = await this.adminService.assignRole(this.getAdminId(req), userId, roleId);
    return role;
  }

  // ==========================================
  // Activity & audit logs
  // ==========================================

  @Get('activity-log')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AUDIT_READ)
  @ApiOperation({ summary: 'Get audit trail / activity log' })
  async getActivityLog(@Query() query: any) {
    return this.adminService.getAuditLogs(query);
  }

  @Get('audit-logs')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AUDIT_READ)
  @ApiOperation({ summary: 'Get security audit logs' })
  async getAuditLogs(@Query() query: any) {
    return this.adminService.getAuditLogs(query);
  }

  // ==========================================
  // Service, AI, email monitoring
  // ==========================================

  @Get('ai-operations')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_READ)
  @ApiOperation({ summary: 'Get AI operation metrics' })
  async getAiOperations(@Query() query: any) {
    return this.adminOperationsService.getAiOperations(query);
  }

  @Post('ai-operations/:id/retry')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @ApiOperation({ summary: 'Retry a failed AI operation' })
  async retryAiOperation(@Param('id') id: string, @Req() req: Request) {
    return { message: 'Retry endpoint placeholder', id };
  }

  @Get('email-monitoring')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.EMAIL_READ)
  @ApiOperation({ summary: 'Get email and notification monitoring' })
  async getEmailMonitoring(@Query() query: any) {
    return this.adminOperationsService.getEmailMonitoring(query);
  }

  @Post('email-monitoring/test-smtp')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.EMAIL_TEST)
  @ApiOperation({ summary: 'Test SMTP connection' })
  async testSmtpConnection(@Body() data: any) {
    return this.adminOperationsService.testSmtpConnection(data);
  }

  @Post('email-monitoring/send-test')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.EMAIL_TEST)
  @ApiOperation({ summary: 'Send a test email' })
  async sendTestEmail(@Body() dto: SendTestEmailDto, @Req() req: Request) {
    return this.adminOperationsService.sendTestEmail(dto.to, this.getAdminId(req));
  }

  // ==========================================
  // Email Templates Management (Super Admin)
  // ==========================================

  @Get('email-templates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.EMAIL_READ)
  @ApiOperation({ summary: 'List all email templates' })
  async getEmailTemplates() {
    return this.platformSettingsService.getEmailTemplates();
  }

  @Post('email-templates')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.EMAIL_TEST)
  @ApiOperation({ summary: 'Create a new email template' })
  async createEmailTemplate(@Req() req: Request, @Body() body: any) {
    return this.platformSettingsService.createEmailTemplate(this.getAdminId(req), body);
  }

  @Get('email-templates/:key')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.EMAIL_READ)
  @ApiOperation({ summary: 'Get a single email template by key' })
  async getEmailTemplate(@Param('key') key: string) {
    return this.platformSettingsService.getEmailTemplate(key);
  }

  @Put('email-templates/:key')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.EMAIL_WRITE)
  @ApiOperation({ summary: 'Update email template (creates new version)' })
  async updateEmailTemplate(@Param('key') key: string, @Body() body: any, @Req() req: Request) {
    return this.platformSettingsService.updateEmailTemplate(this.getAdminId(req), key, body);
  }

  @Post('email-templates/:key/send-test')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.EMAIL_TEST)
  @ApiOperation({ summary: 'Send a test email for a specific template' })
  async sendTemplateTestEmail(@Param('key') key: string, @Body('email') email: string, @Req() req: Request) {
    return this.adminOperationsService.sendTemplateTestEmail(email, key, this.getAdminId(req));
  }

  @Post('email-templates/:key/rollback')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.EMAIL_TEST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rollback email template to a previous version' })
  async rollbackEmailTemplate(@Param('key') key: string, @Body('version') version: number, @Req() req: Request) {
    return this.platformSettingsService.rollbackTemplate(this.getAdminId(req), key, version);
  }

  // ==========================================
  // Notification Policies Management
  // ==========================================

  @Get('notification-policies')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.EMAIL_READ)
  @ApiOperation({ summary: 'List all notification policies' })
  async getNotificationPolicies() {
    return this.platformSettingsService.getNotificationPolicies();
  }

  @Put('notification-policies/:category')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.EMAIL_TEST)
  @ApiOperation({ summary: 'Update notification policy' })
  async updateNotificationPolicy(@Param('category') category: string, @Body() body: any, @Req() req: Request) {
    return this.platformSettingsService.updateNotificationPolicy(this.getAdminId(req), category, body);
  }

  // ==========================================
  // Notification Delivery Logs
  // ==========================================

  @Get('notification-delivery-logs')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.EMAIL_READ)
  @ApiOperation({ summary: 'Search notification delivery logs' })
  async getNotificationDeliveryLogs(@Query() query: any) {
    return this.platformSettingsService.getNotificationDeliveryLogs(query);
  }

  // ==========================================
  // AI Configuration Management (Super Admin)
  // ==========================================

  @Get('ai-configs')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_READ)
  @ApiOperation({ summary: 'List all AI configurations' })
  async getAiConfigs() {
    return this.platformSettingsService.getAiConfigs();
  }

  @Get('ai-configs/active')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_READ)
  @ApiOperation({ summary: 'Get the currently active AI configuration' })
  async getActiveAiConfig() {
    return this.platformSettingsService.getActiveAiConfig();
  }

  @Post('ai-configs/draft')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @ApiOperation({ summary: 'Create a new AI configuration draft' })
  async createAiConfigDraft(@Body() body: any, @Req() req: Request) {
    return this.platformSettingsService.createAiConfigDraft(this.getAdminId(req), body);
  }

  @Put('ai-configs/:id/draft')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @ApiOperation({ summary: 'Update AI configuration draft' })
  async updateAiConfigDraft(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    return this.platformSettingsService.updateAiConfigDraft(this.getAdminId(req), id, body);
  }

  @Post('ai-configs/:id/submit')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit AI config draft for approval' })
  async submitAiConfigForApproval(@Param('id') id: string, @Req() req: Request) {
    return this.platformSettingsService.submitAiConfigForApproval(this.getAdminId(req), id);
  }

  @Post('ai-configs/:id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve AI config' })
  async approveAiConfig(@Param('id') id: string, @Req() req: Request) {
    return this.platformSettingsService.approveAiConfig(this.getAdminId(req), id);
  }

  @Post('ai-configs/:id/publish')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish AI config as active' })
  async publishAiConfig(@Param('id') id: string, @Req() req: Request) {
    return this.platformSettingsService.publishAiConfig(this.getAdminId(req), id);
  }

  @Post('ai-configs/rollback')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rollback to a previous AI config version' })
  async rollbackAiConfig(@Body('version') version: number, @Req() req: Request) {
    return this.platformSettingsService.rollbackAiConfig(this.getAdminId(req), version);
  }

  // ==========================================
  // AI Reindex & Recalculate
  // ==========================================

  @Post('ai-reindex')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger background AI reindexing' })
  async triggerReindex(@Req() req: Request) {
    return this.matchingService.triggerReindex();
  }

  @Post('ai-recalculate')
  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger background AI recalculation' })
  async triggerRecalculation(@Req() req: Request) {
    return this.matchingService.triggerRecalculation();
  }

  // ==========================================
  // Backup and restore
  // ==========================================

  @Get('backups')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.BACKUP_CREATE)
  @ApiOperation({ summary: 'List backups' })
  async listBackups(@Query() query: any) {
    return this.adminOperationsService.listBackups(query);
  }

  @Post('backups')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.BACKUP_CREATE)
  @ApiOperation({ summary: 'Create backup' })
  async createBackup(@Req() req: Request) {
    return this.adminOperationsService.createBackup(this.getAdminId(req));
  }

  @Post('backups/:id/verify')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.BACKUP_VERIFY)
  @ApiOperation({ summary: 'Verify backup integrity' })
  async verifyBackup(@Param('id') id: string) {
    return this.adminOperationsService.verifyBackup(id);
  }

  @Post('backups/:id/restore')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.BACKUP_RESTORE)
  @ApiOperation({ summary: 'Restore backup' })
  async restoreBackup(@Param('id') id: string, @Req() req: Request) {
    return this.adminOperationsService.restoreBackup(this.getAdminId(req), id);
  }

  // ==========================================
  // Security alerts
  // ==========================================

  @Get('security-alerts')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.SECURITY_ALERTS_READ)
  @ApiOperation({ summary: 'Get security alerts' })
  async getSecurityAlerts(@Query() query: any) {
    return this.adminOperationsService.getSecurityAlerts(query);
  }

  @Put('security-alerts/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.SECURITY_ALERTS_WRITE)
  @ApiOperation({ summary: 'Update security alert status' })
  async updateSecurityAlert(@Param('id') id: string, @Body() dto: UpdateSecurityAlertDto, @Req() req: Request) {
    return this.adminOperationsService.updateSecurityAlert(id, this.getAdminId(req), dto.status, dto.notes);
  }

  @Get('security-status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.SECURITY_ALERTS_READ)
  @ApiOperation({ summary: 'Get security status' })
  async getSecurityStatus() {
    return this.adminService.getSecurityStatus();
  }

  // ==========================================
  // Platform settings
  // ==========================================

  @Get('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.SETTINGS_READ)
  @ApiOperation({ summary: 'Get platform settings' })
  async getPlatformSettings() {
    return this.adminService.getPlatformSettings();
  }

  @Put('settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.SETTINGS_WRITE)
  @ApiOperation({ summary: 'Update platform settings' })
  async updatePlatformSettings(@Body() settings: any, @Req() req: Request) {
    return this.adminService.updatePlatformSettings(this.getAdminId(req), settings);
  }

  // ==========================================
  // University management (Super Admin only)
  // ==========================================

  @Get('universities')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.UNIVERSITIES_READ)
  @ApiOperation({ summary: 'List all universities' })
  async getUniversities(@Query() query: any) {
    return this.adminService.getUniversities(query);
  }

  @Get('universities/pending')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.UNIVERSITIES_READ)
  @ApiOperation({ summary: 'List universities pending approval' })
  async getPendingUniversities(@Query() query: any) {
    return this.adminService.getPendingUniversities(query);
  }

  @Post('universities/directory')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create an academic directory university' })
  createDirectoryUniversity(@Body() dto: CreateDirectoryUniversityDto, @Req() req: Request) {
    return this.adminService.createDirectoryUniversity(this.getAdminId(req), dto);
  }

  @Post('universities/directory/import')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Validate or import university directory JSON' })
  importDirectory(@Body() dto: ImportUniversityDirectoryDto, @Req() req: Request) {
    return this.adminService.importUniversityDirectory(this.getAdminId(req), dto.records, dto);
  }

  @Post('universities/:id/logo')
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('logo', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload or replace a university directory logo' })
  uploadDirectoryUniversityLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    return this.adminService.uploadDirectoryUniversityLogo(this.getAdminId(req), id, file);
  }

  @Post('universities/:id/colleges/directory')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a college to a directory university' })
  addDirectoryCollege(@Param('id') id: string, @Body() dto: CreateDirectoryCollegeDto, @Req() req: Request) {
    return this.adminService.addDirectoryCollege(this.getAdminId(req), id, dto);
  }

  @Post('colleges/:id/departments/directory')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a department to a directory college' })
  addDirectoryDepartment(@Param('id') id: string, @Body() dto: CreateDirectoryDepartmentDto, @Req() req: Request) {
    return this.adminService.addDirectoryDepartment(this.getAdminId(req), id, dto);
  }

  @Post('departments/:id/majors/directory')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add a major to a directory department' })
  addDirectoryMajor(@Param('id') id: string, @Body() dto: CreateDirectoryMajorDto, @Req() req: Request) {
    return this.adminService.addDirectoryMajor(this.getAdminId(req), id, dto);
  }

  @Get('universities/:id/directory/structure')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.UNIVERSITIES_READ)
  @ApiOperation({ summary: 'Get the academic directory hierarchy for a university' })
  getDirectoryStructure(@Param('id') id: string) {
    return this.adminService.getDirectoryStructure(id);
  }

  @Get('universities/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.UNIVERSITIES_READ)
  @ApiOperation({ summary: 'Get university review details' })
  async getUniversity(@Param('id') id: string) {
    return this.adminService.getUniversityById(id);
  }

  @Patch('universities/:id/directory')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an academic directory university' })
  updateDirectoryUniversity(@Param('id') id: string, @Body() dto: UpdateDirectoryUniversityDto, @Req() req: Request) {
    return this.adminService.updateDirectoryUniversity(this.getAdminId(req), id, dto);
  }

  @Delete('universities/:id/directory')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete an unlinked academic directory university' })
  softDeleteDirectoryUniversity(@Param('id') id: string, @Req() req: Request) {
    return this.adminService.softDeleteDirectoryUniversity(this.getAdminId(req), id);
  }

  @Post('universities/:id/merge')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Merge a duplicate university into a canonical record' })
  mergeDirectoryUniversity(@Param('id') id: string, @Body() dto: MergeUniversityDirectoryDto, @Req() req: Request) {
    return this.adminService.mergeDirectoryUniversities(this.getAdminId(req), id, dto.targetUniversityId);
  }

  @Put('universities/:id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a university' })
  async approveUniversityPut(@Param('id') id: string, @Req() req: Request) {
    return this.adminService.approveUniversity(this.getAdminId(req), id);
  }

  @Patch('universities/:id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a university' })
  async approveUniversityPatch(@Param('id') id: string, @Req() req: Request) {
    return this.adminService.approveUniversity(this.getAdminId(req), id);
  }

  @Patch('universities/:id/reject')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject a university application' })
  async rejectUniversity(@Param('id') id: string, @Body() dto: ReviewUniversityDto, @Req() req: Request) {
    return this.adminService.rejectUniversity(this.getAdminId(req), id, dto.reason);
  }

  @Put('universities/:id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend a university' })
  async suspendUniversityPut(@Param('id') id: string, @Body() dto: ReviewUniversityDto, @Req() req: Request) {
    return this.adminService.suspendUniversity(this.getAdminId(req), id, dto.reason);
  }

  @Patch('universities/:id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend a university' })
  async suspendUniversityPatch(@Param('id') id: string, @Body() dto: ReviewUniversityDto, @Req() req: Request) {
    return this.adminService.suspendUniversity(this.getAdminId(req), id, dto.reason);
  }

  @Patch('universities/:id/reactivate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reactivate a university' })
  async reactivateUniversity(@Param('id') id: string, @Req() req: Request) {
    return this.adminService.reactivateUniversity(this.getAdminId(req), id);
  }

  // ==========================================
  // Company management (view only for Admin)
  // ==========================================

  @Get('companies')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.COMPANIES_READ)
  @ApiOperation({ summary: 'List all companies' })
  async getCompanies(@Query() query: any) {
    return this.adminService.getCompanies(query);
  }

  @Patch('companies/:id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a company' })
  async approveCompanyPatch(@Param('id') id: string, @Req() req: Request) {
    return this.adminService.approveCompany(this.getAdminId(req), id);
  }

  @Patch('companies/:id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend a company' })
  async suspendCompanyPatch(@Param('id') id: string, @Body() dto: ReviewUniversityDto, @Req() req: Request) {
    return this.adminService.suspendCompany(this.getAdminId(req), id, dto.reason);
  }

  // ==========================================
  // Additional analytics
  // ==========================================

  @Get('active-users')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.USERS_READ)
  @ApiOperation({ summary: 'Get active users and activity' })
  async getActiveUsers() {
    return this.adminService.getActiveUsers();
  }

  @Get('ai-metrics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_READ)
  @ApiOperation({ summary: 'Get AI metrics' })
  async getAIMetrics() {
    return this.adminService.getAIMetrics();
  }

  @Get('ai-models')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_READ)
  @ApiOperation({ summary: 'Get AI models and thresholds' })
  async getAIModels() {
    try {
      const models = await this.adminAiService.getAIModels();
      if (models && models.length > 0) return models;
    } catch (e) {}
    return this.adminService.getAIModels();
  }

  @Patch('ai-models/:id/settings')
  @Put('ai-models/:id/settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @ApiOperation({ summary: 'Update parameters and settings of an AI model' })
  async updateModelSettings(
    @Param('id') id: string,
    @Body() settings: any,
    @Req() req: Request
  ) {
    return this.adminAiService.updateSettings(this.getAdminId(req), id, settings);
  }

  @Post('ai-models/start-all')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  async startAllAiServices(@Req() req: Request) {
    return this.adminAiService.startAllAiServices(this.getAdminId(req));
  }

  @Post('ai-models/stop-all')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  async stopAllAiServices(@Req() req: Request) {
    return this.adminAiService.stopAllAiServices(this.getAdminId(req));
  }

  @Post('ai-models/:id/reload')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  async reloadModel(@Param('id') id: string, @Req() req: Request) {
    return this.adminAiService.triggerAction(this.getAdminId(req), id, 'reload');
  }

  @Post('ai-models/:id/reindex')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  async reindexModel(@Param('id') id: string, @Req() req: Request) {
    return this.adminAiService.triggerAction(this.getAdminId(req), id, 'reindex');
  }

  @Post('ai-models/:id/recalculate')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  async recalculateModel(@Param('id') id: string, @Req() req: Request) {
    return this.adminAiService.triggerAction(this.getAdminId(req), id, 'recalculate');
  }

  @Post('ai-models/:id/refresh-taxonomy')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  async refreshTaxonomyModel(@Param('id') id: string, @Req() req: Request) {
    return this.adminAiService.triggerAction(this.getAdminId(req), id, 'refresh-taxonomy');
  }

  @Post('ai-models/:id/train')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @HttpCode(HttpStatus.OK)
  async trainModel(@Param('id') id: string, @Req() req: Request) {
    return this.adminAiService.triggerAction(this.getAdminId(req), id, 'train');
  }

  @Get('ai-models/:id/status')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_READ)
  async getModelStatus(@Param('id') id: string) {
    return this.adminAiService.getModelStatus(id);
  }

  @Put('ai-thresholds')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(AdminPermission.AI_WRITE)
  @ApiOperation({ summary: 'Update AI thresholds' })
  async updateAIThresholds(@Body() thresholds: any, @Req() req: Request) {
    return this.adminService.updateAIThresholds(this.getAdminId(req), thresholds);
  }

  @Get('cross-platform-analytics')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get cross-platform analytics' })
  async getCrossPlatformAnalytics() {
    return this.adminService.getCrossPlatformAnalytics();
  }

  @Get('market-skills')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Analyze market skills' })
  async getMarketSkillsAnalysis() {
    return this.adminService.getMarketSkillsAnalysis();
  }

  @Get('security-policies')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get security policies' })
  async getSecurityPolicies() {
    return this.adminService.getSecurityPolicies();
  }

  @Get('notification-settings')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get notification settings' })
  async getNotificationSettings() {
    return this.adminService.getNotificationSettings();
  }
}
