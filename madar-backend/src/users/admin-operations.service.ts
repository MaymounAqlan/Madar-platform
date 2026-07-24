import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { validatePermissions } from './permissions/permission.registry';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { spawn } from 'child_process';
import { User, UserDocument } from './schemas/user.schema';
import { Role, RoleDocument } from './roles/schemas/role.schema';
import { EmailService } from '../common/services/email.service';
import { Student, StudentDocument } from '../students/schemas/student.schema';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { University, UniversityDocument } from '../universities/schemas/university.schema';
import { Job, JobDocument } from '../jobs/schemas/job.schema';
import { Application, ApplicationDocument } from '../applications/schemas/application.schema';
import { MatchResult, MatchResultDocument } from '../matching/match-results/schemas/match-result.schema';
import { Recommendation, RecommendationDocument } from '../matching/recommendations/schemas/recommendation.schema';
import { SkillGap, SkillGapDocument } from '../matching/skill-gaps/schemas/skill-gap.schema';
import { AuditLog, AuditLogDocument } from '../common/audit-logs/schemas/audit-log.schema';
import { UserRole } from '../common/enums/user-role.enum';

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

export interface ServiceHealthCheck {
  status: 'healthy' | 'warning' | 'down' | 'not_configured';
  responseTimeMs?: number;
  lastCheckedAt: string;
  reason?: string;
  meta?: Record<string, any>;
}

@Injectable()
export class AdminOperationsService {
  private readonly logger = new Logger(AdminOperationsService.name);
  private readonly backupDir: string;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Role.name) private roleModel: Model<RoleDocument>,
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(University.name) private universityModel: Model<UniversityDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(MatchResult.name) private matchResultModel: Model<MatchResultDocument>,
    @InjectModel(Recommendation.name) private recommendationModel: Model<RecommendationDocument>,
    @InjectModel(SkillGap.name) private skillGapModel: Model<SkillGapDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
    private readonly emailService: EmailService,
  ) {
    this.backupDir = process.env.BACKUP_PATH || path.join(process.cwd(), 'backups');
  }

  // ==========================================
  // Dashboard metrics with real MongoDB data
  // ==========================================

  async getDashboardMetrics(): Promise<any> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers24h,
      recentLogins,
      cvAnalysisOps,
      jobAnalysisOps,
      matchingOps,
      recommendationOps,
      curriculumAnalysisOps,
      emailSuccess,
      emailFailure,
      criticalErrors,
      securityAlerts,
      storageUsage,
      lastBackup,
    ] = await Promise.all([
      this.userModel.countDocuments(),
      this.userModel.countDocuments({ lastLoginAt: { $gte: last24h } }),
      this.userModel.find({ lastLoginAt: { $exists: true } }).select('firstName lastName email userType lastLoginAt').sort({ lastLoginAt: -1 }).limit(10).lean(),
      this.auditLogModel.countDocuments({ action: 'CV_ANALYSIS', timestamp: { $gte: last24h } }),
      this.auditLogModel.countDocuments({ action: 'JOB_ANALYSIS', timestamp: { $gte: last24h } }),
      this.matchResultModel.countDocuments({ createdAt: { $gte: last24h } }),
      this.recommendationModel.countDocuments({ createdAt: { $gte: last24h } }),
      this.auditLogModel.countDocuments({ action: 'CURRICULUM_ANALYSIS', timestamp: { $gte: last24h } }),
      this.auditLogModel.countDocuments({ action: 'EMAIL_SENT', timestamp: { $gte: last24h } }),
      this.auditLogModel.countDocuments({ action: 'EMAIL_FAILED', timestamp: { $gte: last24h } }),
      this.auditLogModel.countDocuments({ severity: { $in: ['error', 'critical'] }, timestamp: { $gte: last24h } }),
      this.computeOpenSecurityAlerts(),
      this.getStorageUsage(),
      this.getLastBackup(),
    ]);

    return {
      totalUsers,
      activeUsers24h,
      recentLogins: recentLogins.map((u: any) => ({
        id: u._id.toString(),
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        email: u.email,
        role: u.userType,
        lastLoginAt: u.lastLoginAt,
      })),
      aiOperations: {
        cvAnalysis24h: cvAnalysisOps,
        jobAnalysis24h: jobAnalysisOps,
        matching24h: matchingOps,
        recommendations24h: recommendationOps,
        curriculumAnalysis24h: curriculumAnalysisOps,
      },
      email: { success24h: emailSuccess, failure24h: emailFailure },
      criticalErrors24h: criticalErrors,
      openSecurityAlerts: securityAlerts,
      storage: storageUsage,
      lastBackup,
      generatedAt: new Date().toISOString(),
    };
  }

  // ==========================================
  // Service health checks
  // ==========================================

  async getServiceHealth(): Promise<Record<string, ServiceHealthCheck>> {
    const checks: Record<string, ServiceHealthCheck> = {};

    // Backend API
    checks.backend = {
      status: 'healthy',
      responseTimeMs: 0,
      lastCheckedAt: new Date().toISOString(),
    };

    // MongoDB
    const mongoStart = Date.now();
    try {
      await this.userModel.db.db.admin().command({ ping: 1 });
      checks.mongodb = {
        status: 'healthy',
        responseTimeMs: Date.now() - mongoStart,
        lastCheckedAt: new Date().toISOString(),
      };
    } catch (e: any) {
      checks.mongodb = {
        status: 'down',
        responseTimeMs: Date.now() - mongoStart,
        lastCheckedAt: new Date().toISOString(),
        reason: 'MongoDB ping failed',
      };
    }

    // AI service
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const aiStart = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${aiUrl}/api/ai/health`, { signal: controller.signal } as any);
      clearTimeout(timeout);
      checks.ai = {
        status: res.ok ? 'healthy' : 'warning',
        responseTimeMs: Date.now() - aiStart,
        lastCheckedAt: new Date().toISOString(),
        reason: res.ok ? undefined : `AI health returned ${res.status}`,
      };
    } catch (e: any) {
      checks.ai = {
        status: 'down',
        responseTimeMs: Date.now() - aiStart,
        lastCheckedAt: new Date().toISOString(),
        reason: 'AI service unreachable',
      };
    }

    // Redis / Memurai
    const redisUrl = process.env.REDIS_URL;
    const redisStart = Date.now();
    if (!redisUrl) {
      checks.redis = {
        status: 'not_configured',
        lastCheckedAt: new Date().toISOString(),
        reason: 'REDIS_URL not configured',
      };
    } else {
      try {
        const redis = await this.loadRedisClient();
        if (redis) {
          await redis.ping();
          checks.redis = {
            status: 'healthy',
            responseTimeMs: Date.now() - redisStart,
            lastCheckedAt: new Date().toISOString(),
          };
          await redis.quit();
        } else {
          checks.redis = {
            status: 'not_configured',
            lastCheckedAt: new Date().toISOString(),
            reason: 'Redis client not available',
          };
        }
      } catch (e: any) {
        checks.redis = {
          status: 'down',
          responseTimeMs: Date.now() - redisStart,
          lastCheckedAt: new Date().toISOString(),
          reason: 'Redis ping failed',
        };
      }
    }

    // SMTP / Email
    const smtpHost = process.env.SMTP_HOST;
    const smtpStart = Date.now();
    if (!smtpHost) {
      checks.smtp = {
        status: 'not_configured',
        lastCheckedAt: new Date().toISOString(),
        reason: 'SMTP_HOST not configured',
      };
    } else {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
          tls: { rejectUnauthorized: false },
        });
        await transporter.verify();
        checks.smtp = {
          status: 'healthy',
          responseTimeMs: Date.now() - smtpStart,
          lastCheckedAt: new Date().toISOString(),
        };
      } catch (e: any) {
        checks.smtp = {
          status: 'warning',
          responseTimeMs: Date.now() - smtpStart,
          lastCheckedAt: new Date().toISOString(),
          reason: 'SMTP verification failed',
        };
      }
    }

    // File storage
    const storageStart = Date.now();
    try {
      const uploadPath = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
      await mkdir(uploadPath, { recursive: true });
      await access(uploadPath, fs.constants.W_OK);
      const stats = await stat(uploadPath);
      checks.storage = {
        status: 'healthy',
        responseTimeMs: Date.now() - storageStart,
        lastCheckedAt: new Date().toISOString(),
      };
      checks.storage.meta = { path: uploadPath, usable: stats.isDirectory() };
    } catch (e: any) {
      checks.storage = {
        status: 'down',
        responseTimeMs: Date.now() - storageStart,
        lastCheckedAt: new Date().toISOString(),
        reason: 'Storage path not writable',
      };
    }

    return checks;
  }

  private async loadRedisClient(): Promise<any | null> {
    try {
      let redisModule: any;
      try {
        redisModule = require('ioredis');
      } catch (e: any) {
        this.logger.warn(`ioredis not available: ${e?.message}`);
        redisModule = require('redis');
      }
      // ioredis exposes Redis constructor; node-redis exposes createClient.
      if (redisModule?.Redis) {
        const client = new redisModule.Redis(process.env.REDIS_URL);
        await client.ping();
        return client;
      }
      if (redisModule?.createClient) {
        const client = redisModule.createClient({ url: process.env.REDIS_URL });
        await client.connect?.();
        return client;
      }
      this.logger.warn('No compatible Redis constructor found');
      return null;
    } catch (e: any) {
      this.logger.warn(`Redis client load failed: ${e?.message}`);
      return null;
    }
  }

  // ==========================================
  // AI operation monitoring
  // ==========================================

  async getAiOperations(query: any = {}): Promise<any> {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);

    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalCvAnalysis,
      totalJobAnalysis,
      totalMatching,
      totalRecommendations,
      totalCurriculum,
      recentMatches,
      recentRecommendations,
      recentSkillGaps,
    ] = await Promise.all([
      this.auditLogModel.countDocuments({ action: 'CV_ANALYSIS' }),
      this.auditLogModel.countDocuments({ action: 'JOB_ANALYSIS' }),
      this.matchResultModel.countDocuments(),
      this.recommendationModel.countDocuments(),
      this.auditLogModel.countDocuments({ action: 'CURRICULUM_ANALYSIS' }),
      this.matchResultModel.find().sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).lean(),
      this.recommendationModel.find().sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).lean(),
      this.skillGapModel.find().sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit).lean(),
    ]);

    const operations: any[] = [];

    recentMatches.forEach((m: any) => {
      operations.push({
        id: m._id.toString(),
        type: 'matching',
        status: 'completed',
        startedAt: m.createdAt,
        completedAt: m.updatedAt || m.createdAt,
        durationMs: m.processingTimeMs || 0,
        reference: { studentId: m.studentId?.toString?.(), jobId: m.jobId?.toString?.() },
        score: m.overallScore,
      });
    });

    recentRecommendations.forEach((r: any) => {
      operations.push({
        id: r._id.toString(),
        type: 'recommendation',
        status: 'completed',
        startedAt: r.createdAt,
        completedAt: r.updatedAt || r.createdAt,
        durationMs: null,
        reference: { studentId: r.studentId?.toString?.(), jobId: r.jobId?.toString?.() },
      });
    });

    recentSkillGaps.forEach((s: any) => {
      operations.push({
        id: s._id.toString(),
        type: 'skill_gap_analysis',
        status: 'completed',
        startedAt: s.createdAt,
        completedAt: s.updatedAt || s.createdAt,
        durationMs: null,
        reference: { studentId: s.studentId?.toString?.() },
      });
    });

    operations.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return {
      summary: {
        totalCvAnalysis,
        totalJobAnalysis,
        totalMatching,
        totalRecommendations,
        totalCurriculumAnalysis: totalCurriculum,
        last24h: {
          cvAnalysis: await this.auditLogModel.countDocuments({ action: 'CV_ANALYSIS', timestamp: { $gte: last24h } }),
          jobAnalysis: await this.auditLogModel.countDocuments({ action: 'JOB_ANALYSIS', timestamp: { $gte: last24h } }),
          matching: await this.matchResultModel.countDocuments({ createdAt: { $gte: last24h } }),
          recommendations: await this.recommendationModel.countDocuments({ createdAt: { $gte: last24h } }),
          curriculumAnalysis: await this.auditLogModel.countDocuments({ action: 'CURRICULUM_ANALYSIS', timestamp: { $gte: last24h } }),
        },
        last7d: {
          cvAnalysis: await this.auditLogModel.countDocuments({ action: 'CV_ANALYSIS', timestamp: { $gte: last7d } }),
          jobAnalysis: await this.auditLogModel.countDocuments({ action: 'JOB_ANALYSIS', timestamp: { $gte: last7d } }),
          matching: await this.matchResultModel.countDocuments({ createdAt: { $gte: last7d } }),
          recommendations: await this.recommendationModel.countDocuments({ createdAt: { $gte: last7d } }),
          curriculumAnalysis: await this.auditLogModel.countDocuments({ action: 'CURRICULUM_ANALYSIS', timestamp: { $gte: last7d } }),
        },
      },
      operations: operations.slice(0, limit),
    };
  }

  // ==========================================
  // Email and notification monitoring
  // ==========================================

  async getEmailMonitoring(query: any = {}): Promise<any> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [success24h, failure24h, success7d, failure7d, recentLogs] = await Promise.all([
      this.auditLogModel.countDocuments({ action: 'EMAIL_SENT', timestamp: { $gte: last24h } }),
      this.auditLogModel.countDocuments({ action: 'EMAIL_FAILED', timestamp: { $gte: last24h } }),
      this.auditLogModel.countDocuments({ action: 'EMAIL_SENT', timestamp: { $gte: last7d } }),
      this.auditLogModel.countDocuments({ action: 'EMAIL_FAILED', timestamp: { $gte: last7d } }),
      this.auditLogModel.find({ action: { $in: ['EMAIL_SENT', 'EMAIL_FAILED'] } })
        .sort({ timestamp: -1 })
        .limit(Math.min(parseInt(query.limit, 10) || 50, 100))
        .lean(),
    ]);

    const templates = [
      { key: 'account_verification', name: 'Account Verification', nameAr: 'تأكيد الحساب' },
      { key: 'resend_verification', name: 'Resend Verification', nameAr: 'إعادة إرسال التأكيد' },
      { key: 'forgot_password', name: 'Forgot Password', nameAr: 'نسيت كلمة المرور' },
      { key: 'reset_password', name: 'Reset Password', nameAr: 'إعادة تعيين كلمة المرور' },
      { key: 'staff_invitation', name: 'Staff Invitation', nameAr: 'دعوة موظف' },
      { key: 'application_notification', name: 'Application Notification', nameAr: 'إشعار طلب توظيف' },
    ];

    return {
      smtp: {
        host: process.env.SMTP_HOST || null,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        from: process.env.SMTP_FROM || 'MADAR <noreply@madar.sa>',
        configured: Boolean(process.env.SMTP_HOST),
      },
      counts24h: { success: success24h, failure: failure24h },
      counts7d: { success: success7d, failure: failure7d },
      templates,
      recentMessages: recentLogs.map((log: any) => ({
        id: log._id.toString(),
        type: log.details?.template || log.details?.type || 'unknown',
        status: log.action === 'EMAIL_SENT' ? 'success' : 'failed',
        sentAt: log.timestamp,
        recipient: log.details?.to || log.details?.email || null,
        subject: log.details?.subject || null,
        failureReason: log.action === 'EMAIL_FAILED' ? log.details?.error : null,
      })),
    };
  }


  async testSmtpConnection(data?: any): Promise<{ success: boolean; message: string }> {
    const smtpHost = data?.host || process.env.SMTP_HOST;
    if (!smtpHost) {
      return { success: false, message: 'SMTP not configured' };
    }
    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(data?.port || process.env.SMTP_PORT || '587', 10),
        secure: data?.secure !== undefined ? data.secure : process.env.SMTP_SECURE === 'true',
        auth: {
          user: data?.user || process.env.SMTP_USER || '',
          pass: data?.pass || process.env.SMTP_PASS || '',
        },
        tls: { rejectUnauthorized: false },
      });
      await transporter.verify();
      return { success: true, message: 'SMTP connection verified' };
    } catch (e: any) {
      return { success: false, message: `SMTP verification failed: ${e.message}` };
    }
  }

  // ==========================================
  // Backup and restore
  // ==========================================

  async createBackup(adminId: string): Promise<any> {
    await mkdir(this.backupDir, { recursive: true });
    const backupId = `backup-${Date.now()}`;
    const backupPath = path.join(this.backupDir, `${backupId}.json`);
    const startedAt = new Date();

    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';
      const collections = await this.listMongoCollections();
      const backupData: Record<string, any[]> = {};

      for (const collection of collections) {
        backupData[collection] = await this.userModel.db.db.collection(collection).find({}).toArray();
      }

      await writeFile(backupPath, JSON.stringify({ backupId, createdAt: startedAt.toISOString(), collections: backupData }, null, 2));
      const stats = await stat(backupPath);

      await this.auditLog('CREATE_BACKUP', adminId, 'system', backupId, `Backup created: ${backupId}`);

      return {
        id: backupId,
        status: 'completed',
        sizeBytes: stats.size,
        createdAt: startedAt.toISOString(),
        path: backupPath,
        verified: true,
      };
    } catch (e: any) {
      this.logger.error(`Backup creation failed: ${e.message}`);
      await this.auditLog('CREATE_BACKUP_FAILED', adminId, 'system', backupId, `Backup failed: ${e.message}`, 'error');
      throw new BadRequestException(`Backup failed: ${e.message}`);
    }
  }

  async listBackups(query: any = {}): Promise<any> {
    await mkdir(this.backupDir, { recursive: true });
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);

    const files = (await readdir(this.backupDir)).filter((f) => f.endsWith('.json'));
    const backups = [];
    for (const file of files) {
      try {
        const filePath = path.join(this.backupDir, file);
        const stats = await stat(filePath);
        const content = JSON.parse(await readFile(filePath, 'utf-8'));
        backups.push({
          id: content.backupId || file.replace('.json', ''),
          status: content.status || 'completed',
          sizeBytes: stats.size,
          createdAt: content.createdAt || stats.birthtime.toISOString(),
          verified: content.verified ?? null,
        });
      } catch {
        // skip corrupted backup metadata files
      }
    }

    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = backups.length;
    const paginated = backups.slice((page - 1) * limit, page * limit);

    return { backups: paginated, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async verifyBackup(backupId: string): Promise<any> {
    const backupPath = path.join(this.backupDir, `${backupId}.json`);
    try {
      await access(backupPath, fs.constants.R_OK);
      const content = JSON.parse(await readFile(backupPath, 'utf-8'));
      const isValid = Boolean(content.backupId && content.createdAt && content.collections);
      return { id: backupId, valid: isValid, status: isValid ? 'verified' : 'corrupted' };
    } catch (e: any) {
      return { id: backupId, valid: false, status: 'missing', reason: e.message };
    }
  }

  async restoreBackup(adminId: string, backupId: string): Promise<any> {
    const backupPath = path.join(this.backupDir, `${backupId}.json`);
    try {
      await access(backupPath, fs.constants.R_OK);
      const content = JSON.parse(await readFile(backupPath, 'utf-8'));
      if (!content.collections) {
        throw new BadRequestException('Invalid backup file');
      }

      // Restoration is intentionally limited to non-user critical collections in this version
      // to avoid accidental lockouts. Full restore can be performed manually by an operator.
      const allowedCollections = ['auditlogs', 'notifications', 'recommendations', 'matchresults', 'skillgaps'];
      let restoredCount = 0;
      for (const collection of allowedCollections) {
        if (Array.isArray(content.collections[collection])) {
          await this.userModel.db.db.collection(collection).deleteMany({});
          if (content.collections[collection].length > 0) {
            await this.userModel.db.db.collection(collection).insertMany(content.collections[collection]);
          }
          restoredCount += content.collections[collection].length;
        }
      }

      await this.auditLog('RESTORE_BACKUP', adminId, 'system', backupId, `Backup restored: ${backupId}, records=${restoredCount}`);
      return { id: backupId, status: 'completed', restoredCount };
    } catch (e: any) {
      this.logger.error(`Backup restore failed: ${e.message}`);
      await this.auditLog('RESTORE_BACKUP_FAILED', adminId, 'system', backupId, `Restore failed: ${e.message}`, 'error');
      throw new BadRequestException(`Restore failed: ${e.message}`);
    }
  }

  private async listMongoCollections(): Promise<string[]> {
    const collections = await this.userModel.db.db.listCollections().toArray();
    return collections.map((c: any) => c.name);
  }

  private async getLastBackup(): Promise<any> {
    try {
      const backups = await this.listBackups({ limit: 1 });
      return backups.backups[0] || null;
    } catch {
      return null;
    }
  }

  private async getStorageUsage(): Promise<any> {
    try {
      const uploadPath = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
      await mkdir(uploadPath, { recursive: true });
      const stats = await stat(uploadPath);
      // Best-effort size calculation
      let usedBytes = 0;
      try {
        const files = await readdir(uploadPath, { withFileTypes: true, recursive: true });
        for (const file of files) {
          if (file.isFile()) {
            const s = await stat(path.join(uploadPath, file.name));
            usedBytes += s.size;
          }
        }
      } catch {
        usedBytes = 0;
      }
      return { path: uploadPath, usedBytes, isDirectory: stats.isDirectory() };
    } catch (e: any) {
      return { path: process.env.UPLOAD_PATH || 'uploads', usedBytes: 0, error: e.message };
    }
  }

  // ==========================================
  // Security alerts
  // ==========================================

  async getSecurityAlerts(query: any = {}): Promise<any> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [failedLogins, invalidRefreshTokens, forbiddenAttempts, privilegeEscalations, suspiciousUploads, apiFailures] = await Promise.all([
      this.aggregateRepeatedEvents('LOGIN_FAILED', 'actorId', 3, last24h),
      this.aggregateRepeatedEvents('INVALID_REFRESH_TOKEN', 'actorId', 3, last24h),
      this.aggregateRepeatedEvents('FORBIDDEN', 'actorId', 3, last24h),
      this.auditLogModel.find({ action: 'PRIVILEGE_ESCALATION_ATTEMPT', timestamp: { $gte: last7d } }).sort({ timestamp: -1 }).limit(50).lean(),
      this.auditLogModel.find({ action: 'SUSPICIOUS_FILE_UPLOAD', timestamp: { $gte: last7d } }).sort({ timestamp: -1 }).limit(50).lean(),
      this.aggregateApiFailures(last24h),
    ]);

    const alerts: any[] = [];

    failedLogins.forEach((item: any) => {
      alerts.push({
        id: `failed-login-${item._id}-${Date.now()}`,
        type: 'repeated_failed_logins',
        severity: item.count > 10 ? 'critical' : 'warning',
        actorId: item._id,
        count: item.count,
        firstAt: item.firstAt,
        lastAt: item.lastAt,
        status: 'open',
        message: `Repeated failed login attempts (${item.count})`,
      });
    });

    invalidRefreshTokens.forEach((item: any) => {
      alerts.push({
        id: `invalid-refresh-${item._id}-${Date.now()}`,
        type: 'repeated_invalid_refresh_tokens',
        severity: 'warning',
        actorId: item._id,
        count: item.count,
        firstAt: item.firstAt,
        lastAt: item.lastAt,
        status: 'open',
        message: `Repeated invalid refresh token usage (${item.count})`,
      });
    });

    forbiddenAttempts.forEach((item: any) => {
      alerts.push({
        id: `forbidden-${item._id}-${Date.now()}`,
        type: 'repeated_403_attempts',
        severity: item.count > 10 ? 'critical' : 'warning',
        actorId: item._id,
        count: item.count,
        firstAt: item.firstAt,
        lastAt: item.lastAt,
        status: 'open',
        message: `Repeated forbidden access attempts (${item.count})`,
      });
    });

    privilegeEscalations.forEach((log: any) => {
      alerts.push({
        id: `privilege-${log._id.toString()}`,
        type: 'privilege_escalation_attempt',
        severity: 'critical',
        actorId: log.actorId?.toString?.(),
        status: 'open',
        message: log.description,
        createdAt: log.timestamp,
      });
    });

    suspiciousUploads.forEach((log: any) => {
      alerts.push({
        id: `upload-${log._id.toString()}`,
        type: 'suspicious_file_upload',
        severity: 'warning',
        actorId: log.actorId?.toString?.(),
        status: 'open',
        message: log.description,
        createdAt: log.timestamp,
      });
    });

    if (apiFailures.abnormal) {
      alerts.push({
        id: `api-failures-${Date.now()}`,
        type: 'abnormal_api_failure_rate',
        severity: 'warning',
        count: apiFailures.count,
        status: 'open',
        message: `Abnormal API failure rate detected (${apiFailures.count} errors in 24h)`,
        createdAt: new Date().toISOString(),
      });
    }

    alerts.sort((a, b) => new Date(b.createdAt || b.lastAt).getTime() - new Date(a.createdAt || a.lastAt).getTime());

    return { alerts, total: alerts.length };
  }

  private async aggregateRepeatedEvents(action: string, groupField: string, minCount: number, since: Date): Promise<any[]> {
    return this.auditLogModel.aggregate([
      { $match: { action, timestamp: { $gte: since } } },
      { $group: { _id: `$${groupField}`, count: { $sum: 1 }, firstAt: { $min: '$timestamp' }, lastAt: { $max: '$timestamp' } } },
      { $match: { count: { $gte: minCount } } },
      { $sort: { count: -1 } },
    ]);
  }

  private async aggregateApiFailures(since: Date): Promise<{ count: number; abnormal: boolean }> {
    const count = await this.auditLogModel.countDocuments({ severity: { $in: ['error', 'critical'] }, timestamp: { $gte: since } });
    return { count, abnormal: count > 50 };
  }

  private async computeOpenSecurityAlerts(): Promise<number> {
    const alerts = await this.getSecurityAlerts({ limit: 1000 });
    return alerts.alerts.filter((a: any) => a.status === 'open').length;
  }

  // ==========================================
  // Administrative account management
  // ==========================================

  async createAdminAccount(actorId: string, data: any, actorPermissions: string[]): Promise<any> {
    this.assertNotProductionTestOnly();
    if (data.userType === UserRole.SUPER_ADMIN || data.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot create Super Admin accounts');
    }
    if ((data.userType || data.role) !== UserRole.ADMIN) {
      throw new BadRequestException('This endpoint is reserved for administrative accounts');
    }

    const email = data.email.toLowerCase();
    const existing = await this.userModel.findOne({ email }).lean();
    if (existing) throw new ConflictException('Email already registered');

    const requestedPermissions = Array.isArray(data.permissions) ? data.permissions : [];
    this.assertOwnsPermissions(actorPermissions, requestedPermissions);

    const role = await this.ensureAdminRole(requestedPermissions);
    const passwordHash = await bcrypt.hash(data.password, 10);

    const actor = await this.userModel.findById(actorId).lean();
    const actorName = actor ? ([actor.firstNameAr || actor.firstName, actor.lastNameAr || actor.lastName].filter(Boolean).join(' ') || actor.email) : 'النظام';

    const user = await this.userModel.create({
      firstName: data.firstName,
      lastName: data.lastName,
      firstNameAr: data.firstNameAr || data.firstName,
      lastNameAr: data.lastNameAr || data.lastName,
      email,
      phone: data.phone || '',
      password: passwordHash,
      userType: UserRole.ADMIN,
      roleId: role._id,
      status: data.status || 'active',
      isVerified: true,
      isEmailVerified: true,
      createdBy: actorName,
    });

    if (data.sendInvitation) {
      try {
        const name = [user.firstNameAr, user.lastNameAr].filter(Boolean).join(' ') || user.firstName || 'مستخدم مدار';
        await this.emailService.sendCustomTemplateEmail(
          user.email,
          'general_notification',
          {
            userName: name,
            reason: `تم إنشاء حساب إداري جديد لك في منصة مدار بنجاح. البريد الإلكتروني الخاص بك هو: ${user.email} وكلمة المرور المؤقتة للدخول هي: ${data.password}`,
          },
          'ar',
        );
      } catch (mailError: any) {
        this.logger.warn(`Failed to send invitation email to ${user.email}: ${mailError.message}`);
      }
    }

    await this.auditLog('CREATE_ADMIN_ACCOUNT', actorId, 'user', user._id.toString(), `Created admin account ${email}`);
    return this.sanitizeAdminUser(user);
  }

  async updateAdminAccount(actorId: string, targetUserId: string, data: any, actorPermissions: string[]): Promise<any> {
    const target = await this.userModel.findById(targetUserId).lean();
    if (!target) throw new NotFoundException('User not found');
    if (target.userType === UserRole.SUPER_ADMIN) throw new ForbiddenException('Cannot edit Super Admin');
    if (target.userType !== UserRole.ADMIN) throw new BadRequestException('Target is not an administrative account');

    const updateData: any = { updatedAt: new Date() };
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.firstNameAr) updateData.firstNameAr = data.firstNameAr;
    if (data.lastNameAr) updateData.lastNameAr = data.lastNameAr;
    if (data.phone !== undefined) updateData.phone = data.phone;

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (Array.isArray(data.permissions)) {
      this.assertOwnsPermissions(actorPermissions, data.permissions);
      const role = await this.ensureAdminRole(data.permissions);
      updateData.roleId = role._id;
    }

    const user = await this.userModel.findByIdAndUpdate(targetUserId, { $set: updateData }, { new: true }).lean();
    await this.auditLog('UPDATE_ADMIN_ACCOUNT', actorId, 'user', targetUserId, `Updated admin account ${targetUserId}`);
    return this.sanitizeAdminUser(user);
  }

  async disableAdminAccount(actorId: string, targetUserId: string): Promise<any> {
    if (actorId === targetUserId) throw new ForbiddenException('Cannot disable your own account');
    const target = await this.userModel.findById(targetUserId).lean();
    if (!target) throw new NotFoundException('User not found');
    if (target.userType === UserRole.SUPER_ADMIN) throw new ForbiddenException('Cannot disable Super Admin');
    if (target.userType !== UserRole.ADMIN) throw new BadRequestException('Target is not an administrative account');

    const user = await this.userModel.findByIdAndUpdate(
      targetUserId,
      { $set: { status: 'banned', updatedAt: new Date() } },
      { new: true },
    ).lean();
    await this.auditLog('DISABLE_ADMIN_ACCOUNT', actorId, 'user', targetUserId, `Disabled admin account ${targetUserId}`);
    return this.sanitizeAdminUser(user);
  }

  async reactivateAdminAccount(actorId: string, targetUserId: string): Promise<any> {
    const target = await this.userModel.findById(targetUserId).lean();
    if (!target) throw new NotFoundException('User not found');
    if (target.userType === UserRole.SUPER_ADMIN) throw new ForbiddenException('Cannot modify Super Admin');
    if (target.userType !== UserRole.ADMIN) throw new BadRequestException('Target is not an administrative account');

    const user = await this.userModel.findByIdAndUpdate(
      targetUserId,
      { $set: { status: 'active', updatedAt: new Date() } },
      { new: true },
    ).lean();
    await this.auditLog('REACTIVATE_ADMIN_ACCOUNT', actorId, 'user', targetUserId, `Reactivated admin account ${targetUserId}`);
    return this.sanitizeAdminUser(user);
  }

  async listAdminAccounts(query: any = {}): Promise<any> {
    const filter: any = { userType: UserRole.ADMIN };
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.$or = [
        { firstName: new RegExp(query.search, 'i') },
        { lastName: new RegExp(query.search, 'i') },
        { email: new RegExp(query.search, 'i') },
      ];
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel.find(filter).populate('roleId', 'name permissions').skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      users: users.map((u: any) => this.sanitizeAdminUser(u)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async invalidateUserSessions(targetUserId: string, actorId: string): Promise<any> {
    const user = await this.userModel.findById(targetUserId);
    if (!user) throw new NotFoundException('User not found');

    await this.userModel.updateOne(
      { _id: new Types.ObjectId(targetUserId) },
      { $set: { refreshTokens: [], updatedAt: new Date() } },
    );

    await this.auditLog('INVALIDATE_SESSIONS', actorId, 'user', targetUserId, `Invalidated sessions for user ${targetUserId}`);
    return { message: 'Sessions invalidated' };
  }

  async resendVerificationEmail(targetUserId: string, actorId: string): Promise<any> {
    const user = await this.userModel.findById(targetUserId).lean();
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) throw new BadRequestException('Email is already verified');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.userModel.findByIdAndUpdate(targetUserId, { $set: { emailVerificationCode: code, updatedAt: new Date() } });

    const result = await this.emailService.sendVerificationEmail(
      user.email,
      code,
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'مستخدم',
    );

    await this.auditLog('RESEND_VERIFICATION', actorId, 'user', targetUserId, `Resent verification email to ${user.email}. Success: ${result.success}`);

    return { message: 'Verification email sent', success: result.success };
  }

  async sendPasswordResetLink(targetUserId: string, actorId: string): Promise<any> {
    const user = await this.userModel.findById(targetUserId);
    if (!user) throw new NotFoundException('User not found');

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.userModel.findByIdAndUpdate(targetUserId, {
      $set: { resetPasswordToken: resetToken, resetPasswordExpiry: resetTokenExpiry, updatedAt: new Date() },
    } as any);

    const result = await this.emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.firstName || 'مستخدم',
    );

    await this.auditLog('SEND_RESET_PASSWORD', actorId, 'user', targetUserId, `Sent password reset link to ${user.email}. Success: ${result.success}`);

    return { message: 'Password reset link sent', success: result.success };
  }

  async getAdminUserView(targetUserId: string): Promise<any> {
    const user = await this.userModel.findById(targetUserId)
      .select('-password -refreshTokens -twoFactorSecret')
      .populate('roleId', 'name nameAr permissions')
      .lean();
    if (!user) throw new NotFoundException('User not found');

    const recentActivity = await this.auditLogModel
      .find({ $or: [{ actorId: new Types.ObjectId(targetUserId) }, { resourceId: targetUserId }] })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    return { user, recentActivity };
  }

  async sendTestEmail(to: string, actorId: string): Promise<any> {
    const result = await this.emailService.sendWelcomeEmail(to, 'Admin Test Recipient');
    await this.auditLog('SEND_TEST_EMAIL', actorId, 'email', to, `Sent test email to ${to}. Success: ${result.success}`);
    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to send test email. Check SMTP settings.');
    }
    return { message: 'Test email sent successfully', success: true };
  }

  async sendTemplateTestEmail(to: string, templateKey: string, actorId: string): Promise<any> {
    const variables = {
      userName: 'مستخدم تجريبي',
      institutionName: 'مؤسسة تجريبية',
      verificationUrl: 'https://example.com/verify?code=123456',
      resetUrl: 'https://example.com/reset?token=abc',
      actionUrl: 'https://example.com/action',
      status: 'مقبول',
      reason: 'تجربة النظام',
      expiryTime: '24 ساعة'
    };
    const result = await this.emailService.sendCustomTemplateEmail(to, templateKey, variables, 'ar');
    await this.auditLog('SEND_TEST_EMAIL', actorId, 'email', to, `Sent test email using template ${templateKey} to ${to}. Success: ${result.success}`);
    if (!result.success) {
      throw new BadRequestException(result.error || 'Failed to send test email. Check SMTP settings.');
    }
    return { message: 'Test email sent successfully', success: true };
  }

  async updateSecurityAlert(alertId: string, actorId: string, status: string, notes?: string): Promise<any> {
    // Security alerts are derived from audit logs in this implementation.
    // Alert IDs are prefixed (e.g., privilege-<auditLogId>, upload-<auditLogId>);
    // extract the underlying audit log ID when present.
    let auditLogId = alertId;
    const firstDash = alertId.indexOf('-');
    if (firstDash > 0) {
      const prefix = alertId.substring(0, firstDash);
      if (prefix === 'privilege' || prefix === 'upload') {
        auditLogId = alertId.substring(firstDash + 1);
      }
    }

    const alert = await this.auditLogModel.findById(auditLogId).lean();
    if (!alert) throw new NotFoundException('Alert not found');

    await this.auditLogModel.findByIdAndUpdate(auditLogId, {
      $set: {
        'details.resolution': { status, notes, resolvedBy: actorId, resolvedAt: new Date() },
        updatedAt: new Date(),
      },
    });

    await this.auditLog('UPDATE_SECURITY_ALERT', actorId, 'security_alert', alertId, `Updated security alert ${alertId} to ${status}`);
    return { message: 'Security alert updated', status, notes };
  }

  private async ensureAdminRole(permissions: string[]): Promise<any> {
    const validation = validatePermissions(permissions);
    if (validation.invalid.length > 0) {
      throw new BadRequestException(`Invalid permissions: ${validation.invalid.join(', ')}`);
    }
    const sortedPermissions = [...validation.valid].sort();
    const roleName = `admin-${Buffer.from(sortedPermissions.join(',')).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)}`;
    const existing = await this.roleModel.findOne({ name: roleName }).lean();
    if (existing) return existing;
    return this.roleModel.create({
      name: roleName,
      nameAr: 'دور إداري مخصص',
      description: 'Auto-generated admin role',
      permissions: sortedPermissions,
      isSystem: true,
    });
  }

  private assertOwnsPermissions(actorPermissions: string[], requestedPermissions: string[]): void {
    if (!actorPermissions || actorPermissions.length === 0) {
      throw new ForbiddenException('Actor has no assignable permissions');
    }
    const missing = requestedPermissions.filter((p) => !actorPermissions.includes(p));
    if (missing.length > 0) {
      throw new ForbiddenException(`Cannot grant permissions you do not own: ${missing.join(', ')}`);
    }
  }

  private sanitizeAdminUser(user: any): any {
    const obj = user.toObject ? user.toObject() : user;
    const { password, refreshTokens, twoFactorSecret, ...sanitized } = obj;
    return {
      ...sanitized,
      id: sanitized._id?.toString?.() || sanitized._id,
      role: sanitized.userType,
      permissions: sanitized.roleId?.permissions || sanitized.permissions || [],
    };
  }

  private assertNotProductionTestOnly(): void {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_CREATION !== 'true') {
      throw new ForbiddenException('Admin account creation is restricted in production');
    }
  }

  private async auditLog(action: string, actorId: string, resource: string, resourceId: string, description: string, severity: 'info' | 'warning' | 'error' | 'critical' = 'info'): Promise<void> {
    try {
      await this.auditLogModel.create({
        actorId: new Types.ObjectId(actorId),
        action,
        resource,
        resourceId,
        description,
        severity,
        timestamp: new Date(),
      });
    } catch (err: any) {
      this.logger.error(`Audit log failed: ${err.message}`);
    }
  }
}
