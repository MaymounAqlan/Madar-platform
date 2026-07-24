import { Injectable, BadRequestException, ForbiddenException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlatformSetting, PlatformSettingDocument } from './schemas/platform-setting.schema';
import { EmailTemplate, EmailTemplateDocument } from './schemas/email-template.schema';
import { AiConfig, AiConfigDocument } from './schemas/ai-config.schema';
import { NotificationPolicy, NotificationPolicyDocument } from './schemas/notification-policy.schema';
import { NotificationDeliveryLog, NotificationDeliveryLogDocument } from './schemas/notification-delivery-log.schema';
import { AuditLogService } from '../common/audit-logs/audit-log.service';

export const ALLOWED_SETTING_KEYS = new Set([
  'analysis.matchThreshold',
  'analysis.modelVersion',
  'analysis.embeddingModel',
  'notifications.emailEnabled',
  'notifications.pushEnabled',
  'notifications.smsEnabled',
  'notifications.smtpConfigured',
  'notifications.smtpSettings',
  'notifications.emailBranding',
  'storage.maxCvSize',
  'storage.allowedCvTypes',
  'matching.skillsWeight',
  'matching.experienceWeight',
  'matching.projectsWeight',
  'matching.semanticWeight',
  'security.maxLoginAttempts',
  'security.lockoutDurationMinutes',
  'security.passwordMinLength',
]);

export const READ_ONLY_KEYS = new Set([
  'analysis.modelVersion',
  'analysis.embeddingModel',
]);

export const CONFIGURED_FLAG_KEYS: Record<string, string> = {
  'notifications.smtpConfigured': 'SMTP_HOST',
};

@Injectable()
export class PlatformSettingsService implements OnModuleInit {
  constructor(
    @InjectModel(PlatformSetting.name) private settingModel: Model<PlatformSettingDocument>,
    @InjectModel(EmailTemplate.name) private templateModel: Model<EmailTemplateDocument>,
    @InjectModel(AiConfig.name) private aiConfigModel: Model<AiConfigDocument>,
    @InjectModel(NotificationPolicy.name) private policyModel: Model<NotificationPolicyDocument>,
    @InjectModel(NotificationDeliveryLog.name) private deliveryLogModel: Model<NotificationDeliveryLogDocument>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async onModuleInit() {
    await this.seedDefaultData();
  }

  // ==========================================
  // Generic Platform Settings
  // ==========================================

  async getPublicSettings(): Promise<Record<string, any>> {
    const settings = await this.settingModel.find({ isSecret: false }).lean();
    const result: Record<string, any> = {};
    for (const s of settings) {
      if (s.key === 'notifications.smtpSettings') {
        const val = { ...s.value };
        if (val.password) val.password = '*****';
        result[s.key] = val;
      } else {
        result[s.key] = s.value;
      }
    }
    return result;
  }

  async getSettingsByCategory(category?: string): Promise<Record<string, any>> {
    const filter: any = { isSecret: false };
    if (category) filter.category = category;
    const settings = await this.settingModel.find(filter).lean();
    const result: Record<string, any> = {};
    for (const s of settings) {
      if (s.key === 'notifications.smtpSettings') {
        const val = { ...s.value };
        if (val.password) val.password = '*****';
        result[s.key] = val;
      } else {
        result[s.key] = s.value;
      }
    }
    return result;
  }

  async getSetting(key: string): Promise<any> {
    const setting = await this.settingModel.findOne({ key }).lean();
    return setting?.value ?? null;
  }

  async setSetting(
    adminId: string,
    key: string,
    value: any,
    options: { category?: string; description?: string } = {},
  ): Promise<PlatformSettingDocument> {
    if (!ALLOWED_SETTING_KEYS.has(key)) {
      throw new ForbiddenException(`Setting key '${key}' is not allowed to be modified through the admin UI`);
    }

    if (READ_ONLY_KEYS.has(key)) {
      throw new ForbiddenException(`Setting key '${key}' is read-only`);
    }

    const before = await this.settingModel.findOne({ key }).lean();

    let processedValue = value;
    if (key === 'notifications.smtpSettings' && before?.value?.password && value.password === '*****') {
      processedValue = { ...value, password: before.value.password };
    }

    const setting = await this.settingModel.findOneAndUpdate(
      { key },
      {
        $set: {
          value: processedValue,
          category: options.category || this.inferCategory(key),
          description: options.description,
          isSecret: false,
          updatedBy: new Types.ObjectId(adminId),
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    // Redact password from audit logs
    const logBefore = before?.value ? { ...before.value } : undefined;
    if (logBefore?.password) logBefore.password = '[redacted]';
    const logAfter = processedValue ? { ...processedValue } : undefined;
    if (logAfter?.password) logAfter.password = '[redacted]';

    await this.auditLogService.create({
      actorId: new Types.ObjectId(adminId),
      action: 'UPDATE_PLATFORM_SETTING',
      resource: 'platform_setting',
      resourceId: key,
      description: `Updated platform setting ${key}`,
      before: logBefore ? { value: logBefore } : undefined,
      after: { value: logAfter },
      severity: 'info',
      timestamp: new Date(),
    });

    return setting;
  }

  async updateSettings(adminId: string, settings: Record<string, any>): Promise<PlatformSettingDocument[]> {
    const results: PlatformSettingDocument[] = [];
    for (const [key, value] of Object.entries(settings)) {
      results.push(await this.setSetting(adminId, key, value));
    }
    return results;
  }

  getSecretFlags(): Record<string, boolean> {
    return {
      smtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
      oauthGoogleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      oauthLinkedinConfigured: Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET),
      aiServiceConfigured: Boolean(process.env.AI_SERVICE_URL || process.env.GEMINI_API_KEY),
      mongodbConfigured: Boolean(process.env.MONGODB_URI),
      redisConfigured: Boolean(process.env.REDIS_URL),
    };
  }

  private inferCategory(key: string): string {
    return key.split('.')[0] || 'general';
  }

  // ==========================================
  // Email Template Editor
  // ==========================================

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    return this.templateModel.find().sort({ key: 1 }).lean();
  }

  async getEmailTemplate(key: string): Promise<EmailTemplate> {
    const template = await this.templateModel.findOne({ key }).lean();
    if (!template) throw new NotFoundException(`Email template with key ${key} not found`);
    return template;
  }

  async createEmailTemplate(adminId: string, createData: any): Promise<EmailTemplate> {
    const existing = await this.templateModel.findOne({ key: createData.key });
    if (existing) {
      throw new BadRequestException(`Email template with key '${createData.key}' already exists`);
    }

    const template = await this.templateModel.create({
      ...createData,
      isActive: createData.isActive !== undefined ? createData.isActive : true,
      styles: createData.styles || {
        logo: '',
        backgroundColor: '#f4f4f4',
        cardColor: '#ffffff',
        textColor: '#333333',
        buttonColor: '#9fe870',
        buttonTextColor: '#000000',
        fontFamily: 'Arial',
        fontSize: '16px',
        spacing: '20px',
      },
      versions: [],
      currentVersion: 1,
      updatedBy: new Types.ObjectId(adminId),
    });

    await this.auditLogService.create({
      actorId: new Types.ObjectId(adminId),
      action: 'CREATE_EMAIL_TEMPLATE',
      resource: 'email_template',
      resourceId: createData.key,
      description: `Created new email template: ${createData.name} (${createData.key})`,
      severity: 'info',
      timestamp: new Date(),
    });

    return template;
  }

  async updateEmailTemplate(adminId: string, key: string, updateData: any): Promise<EmailTemplate> {
    const template = await this.templateModel.findOne({ key });
    if (!template) throw new NotFoundException(`Email template with key ${key} not found`);

    // Verify safe variables only
    const allowedVars = new Set(['userName', 'institutionName', 'verificationUrl', 'resetUrl', 'actionUrl', 'status', 'reason', 'expiryTime', 'companyName', 'jobTitle', 'studentName', 'applicationStatus', 'code']);
    const extractVars = (str: string) => {
      const matches = str.match(/\{\{([^}]+)\}\}/g) || [];
      return matches.map(m => m.replace(/[{}]/g, '').trim());
    };

    const allText = `${updateData.subjectAr} ${updateData.subjectEn} ${updateData.bodyAr} ${updateData.bodyEn}`;
    const usedVars = extractVars(allText);
    for (const v of usedVars) {
      if (!allowedVars.has(v)) {
        throw new BadRequestException(`Unrecognized placeholder variable: {{${v}}}`);
      }
    }

    // Save previous version in history
    const oldVersion = {
      version: template.currentVersion,
      subjectAr: template.subjectAr,
      subjectEn: template.subjectEn,
      bodyAr: template.bodyAr,
      bodyEn: template.bodyEn,
      preheaderAr: template.preheaderAr,
      preheaderEn: template.preheaderEn,
      styles: template.styles,
      updatedBy: template.updatedBy || new Types.ObjectId(adminId),
      updatedAt: template.updatedAt || new Date(),
      note: updateData.note || `Version ${template.currentVersion} saved before update.`,
    };

    template.versions.push(oldVersion);
    template.currentVersion += 1;
    template.subjectAr = updateData.subjectAr;
    template.subjectEn = updateData.subjectEn;
    template.bodyAr = updateData.bodyAr;
    template.bodyEn = updateData.bodyEn;
    template.preheaderAr = updateData.preheaderAr;
    template.preheaderEn = updateData.preheaderEn;
    template.styles = updateData.styles || template.styles;
    template.isActive = updateData.isActive !== undefined ? updateData.isActive : template.isActive;
    template.updatedBy = new Types.ObjectId(adminId);

    await template.save();

    await this.auditLogService.create({
      actorId: new Types.ObjectId(adminId),
      action: 'UPDATE_EMAIL_TEMPLATE',
      resource: 'email_template',
      resourceId: key,
      description: `Updated email template: ${key} to version ${template.currentVersion}`,
      severity: 'info',
      timestamp: new Date(),
    });

    return template;
  }

  async rollbackTemplate(adminId: string, key: string, versionNumber: number): Promise<EmailTemplate> {
    const template = await this.templateModel.findOne({ key });
    if (!template) throw new NotFoundException(`Email template with key ${key} not found`);

    const targetVersion = template.versions.find(v => v.version === versionNumber);
    if (!targetVersion) throw new BadRequestException(`Version number ${versionNumber} not found in template history`);

    // Add current version to history before rolling back
    const currentHist = {
      version: template.currentVersion,
      subjectAr: template.subjectAr,
      subjectEn: template.subjectEn,
      bodyAr: template.bodyAr,
      bodyEn: template.bodyEn,
      preheaderAr: template.preheaderAr,
      preheaderEn: template.preheaderEn,
      styles: template.styles,
      updatedBy: template.updatedBy || new Types.ObjectId(adminId),
      updatedAt: template.updatedAt || new Date(),
      note: `Version ${template.currentVersion} saved before rolling back to version ${versionNumber}.`,
    };

    template.versions.push(currentHist);
    template.currentVersion = template.currentVersion + 1;
    template.subjectAr = targetVersion.subjectAr;
    template.subjectEn = targetVersion.subjectEn;
    template.bodyAr = targetVersion.bodyAr;
    template.bodyEn = targetVersion.bodyEn;
    template.preheaderAr = targetVersion.preheaderAr;
    template.preheaderEn = targetVersion.preheaderEn;
    template.styles = targetVersion.styles || template.styles;
    template.updatedBy = new Types.ObjectId(adminId);

    await template.save();

    await this.auditLogService.create({
      actorId: new Types.ObjectId(adminId),
      action: 'ROLLBACK_EMAIL_TEMPLATE',
      resource: 'email_template',
      resourceId: key,
      description: `Rolled back email template ${key} to version ${versionNumber}`,
      severity: 'info',
      timestamp: new Date(),
    });

    return template;
  }

  // ==========================================
  // Notification Policies
  // ==========================================

  async getNotificationPolicies(): Promise<NotificationPolicy[]> {
    return this.policyModel.find().lean();
  }

  async updateNotificationPolicy(adminId: string, category: string, updateData: any): Promise<NotificationPolicy> {
    const policy = await this.policyModel.findOneAndUpdate(
      { category },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    await this.auditLogService.create({
      actorId: new Types.ObjectId(adminId),
      action: 'UPDATE_NOTIFICATION_POLICY',
      resource: 'notification_policy',
      resourceId: category,
      description: `Updated notification policy for category: ${category}`,
      severity: 'info',
      timestamp: new Date(),
    });

    return policy;
  }

  // ==========================================
  // Notification Delivery Logs
  // ==========================================

  async getNotificationDeliveryLogs(query: any = {}): Promise<any> {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.channel) filter.channel = query.channel;
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;
    if (query.search) {
      filter.$or = [
        { recipientEmail: new RegExp(query.search, 'i') },
        { subject: new RegExp(query.search, 'i') },
        { body: new RegExp(query.search, 'i') },
      ];
    }

    const [logs, total] = await Promise.all([
      this.deliveryLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.deliveryLogModel.countDocuments(filter),
    ]);

    return {
      items: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==========================================
  // AI Configuration Management
  // ==========================================

  async getAiConfigs(): Promise<AiConfig[]> {
    return this.aiConfigModel.find().sort({ version: -1 }).lean();
  }

  async getActiveAiConfig(): Promise<AiConfig> {
    const active = await this.aiConfigModel.findOne({ status: 'active' }).lean();
    if (!active) {
      // Return a default object if none is in the DB
      return {
        version: 0,
        status: 'active',
        skillsWeight: 40,
        experienceWeight: 30,
        projectsWeight: 15,
        interestsWeight: 15,
        highMatchThreshold: 70,
        recommendationThreshold: 30,
        skillConfidence: 0.3,
        fuzzyMatchingThreshold: 0.7,
        skillGapSeverityThreshold: 50,
        numberOfRecommendations: 10,
        timeoutMs: 5000,
        retryCount: 3,
        batchSize: 100,
        concurrencyLimit: 5,
        languages: ['ar', 'en'],
        arabicNormalization: true,
        skillTaxonomy: {},
        curriculumMarketSettings: {},
      } as any;
    }
    return active;
  }

  async createAiConfigDraft(adminId: string, values: any): Promise<AiConfig> {
    const totalWeight = values.skillsWeight + values.experienceWeight + values.projectsWeight + values.interestsWeight;
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new BadRequestException(`Sum of weights must equal exactly 100%. Got: ${totalWeight}%`);
    }

    const latest = await this.aiConfigModel.findOne().sort({ version: -1 }).lean();
    const nextVersion = (latest?.version || 0) + 1;

    const draft = await this.aiConfigModel.create({
      ...values,
      version: nextVersion,
      status: 'draft',
      createdBy: new Types.ObjectId(adminId),
      updatedBy: new Types.ObjectId(adminId),
    });

    await this.auditLogService.create({
      actorId: new Types.ObjectId(adminId),
      action: 'CREATE_AI_CONFIG_DRAFT',
      resource: 'ai_config',
      resourceId: String(draft.version),
      description: `Created AI configuration draft version ${draft.version}`,
      severity: 'info',
      timestamp: new Date(),
    });

    return draft;
  }

  async updateAiConfigDraft(adminId: string, id: string, values: any): Promise<AiConfig> {
    const config = await this.aiConfigModel.findById(id);
    if (!config) throw new NotFoundException(`AI configuration not found`);
    if (config.status !== 'draft') {
      throw new BadRequestException(`Only draft configurations can be updated`);
    }

    const totalWeight = values.skillsWeight + values.experienceWeight + values.projectsWeight + values.interestsWeight;
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new BadRequestException(`Sum of weights must equal exactly 100%. Got: ${totalWeight}%`);
    }

    Object.assign(config, values, { updatedBy: new Types.ObjectId(adminId) });
    await config.save();
    return config;
  }

  async publishAiConfig(adminId: string, id: string): Promise<AiConfig> {
    const config = await this.aiConfigModel.findById(id);
    if (!config) throw new NotFoundException(`AI configuration not found`);

    // archive previous active configuration
    await this.aiConfigModel.updateMany({ status: 'active' }, { $set: { status: 'archived' } });

    config.status = 'active';
    config.updatedBy = new Types.ObjectId(adminId);
    await config.save();

    await this.auditLogService.create({
      actorId: new Types.ObjectId(adminId),
      action: 'PUBLISH_AI_CONFIG',
      resource: 'ai_config',
      resourceId: String(config.version),
      description: `Published AI configuration version ${config.version} as ACTIVE`,
      severity: 'critical',
      timestamp: new Date(),
    });

    return config;
  }

  async submitAiConfigForApproval(adminId: string, id: string): Promise<AiConfig> {
    const config = await this.aiConfigModel.findById(id);
    if (!config) throw new NotFoundException(`AI config not found`);
    config.status = 'pending approval';
    await config.save();
    return config;
  }

  async approveAiConfig(adminId: string, id: string): Promise<AiConfig> {
    const config = await this.aiConfigModel.findById(id);
    if (!config) throw new NotFoundException(`AI config not found`);
    config.status = 'approved';
    await config.save();
    return config;
  }

  async rollbackAiConfig(adminId: string, versionNumber: number): Promise<AiConfig> {
    const config = await this.aiConfigModel.findOne({ version: versionNumber });
    if (!config) throw new NotFoundException(`AI config version ${versionNumber} not found`);

    await this.aiConfigModel.updateMany({ status: 'active' }, { $set: { status: 'archived' } });
    config.status = 'active';
    config.updatedBy = new Types.ObjectId(adminId);
    await config.save();

    await this.auditLogService.create({
      actorId: new Types.ObjectId(adminId),
      action: 'ROLLBACK_AI_CONFIG',
      resource: 'ai_config',
      resourceId: String(versionNumber),
      description: `Rolled back active AI config to version ${versionNumber}`,
      severity: 'critical',
      timestamp: new Date(),
    });

    return config;
  }

  // ==========================================
  // Private Seeding Logic
  // ==========================================

  private async seedDefaultData() {
    // 1. Seed email templates
    const templatesCount = await this.templateModel.countDocuments();
    if (templatesCount === 0) {
      const defaults = [
        {
          key: 'email_verification',
          name: 'تأكيد الحساب / Account Verification',
          subjectAr: 'رمز التحقق الخاص بك',
          subjectEn: 'Your Account Verification Code',
          bodyAr: 'مرحباً {{userName}}، رمز التحقق الخاص بك هو: {{verificationUrl}}',
          bodyEn: 'Hello {{userName}}, your verification code is: {{verificationUrl}}',
        },
        {
          key: 'forgot_password',
          name: 'استعادة كلمة المرور / Forgot Password',
          subjectAr: 'طلب استعادة كلمة المرور',
          subjectEn: 'Password Reset Request',
          bodyAr: 'مرحباً {{userName}}، يرجى النقر على الرابط التالي لإعادة تعيين كلمة المرور: {{resetUrl}}',
          bodyEn: 'Hello {{userName}}, please use the link to reset your password: {{resetUrl}}',
        },
        {
          key: 'staff_invitation',
          name: 'دعوة موظف جامعة / Staff Invitation',
          subjectAr: 'دعوة للانضمام إلى منصة مدار',
          subjectEn: 'Invitation to join MADAR Platform',
          bodyAr: 'مرحباً {{userName}}، لقد تمت دعوتك للانضمام إلى {{institutionName}}. انقر هنا: {{actionUrl}}',
          bodyEn: 'Hello {{userName}}, you have been invited to join {{institutionName}}. Click here: {{actionUrl}}',
        },
        {
          key: 'university_approval',
          name: 'اعتماد جامعة / University Approved',
          subjectAr: 'تم تفعيل حساب الجامعة',
          subjectEn: 'University Account Activated',
          bodyAr: 'تم تفعيل حساب جامعة {{institutionName}} بنجاح.',
          bodyEn: 'The account for {{institutionName}} has been successfully activated.',
        },
        {
          key: 'company_approval',
          name: 'اعتماد شركة / Company Approved',
          subjectAr: 'تم تفعيل حساب الشركة',
          subjectEn: 'Company Account Activated',
          bodyAr: 'تم تفعيل حساب شركة {{institutionName}} بنجاح.',
          bodyEn: 'The account for {{institutionName}} has been successfully activated.',
        },
        {
          key: 'application_status_change',
          name: 'تغيير حالة الطلب / Application Status Change',
          subjectAr: 'تحديث حالة طلب التوظيف',
          subjectEn: 'Application Status Updated',
          bodyAr: 'مرحباً {{userName}}، تم تغيير حالة طلبك إلى: {{status}}',
          bodyEn: 'Hello {{userName}}, your application status has been updated to: {{status}}',
        },
        {
          key: 'security_alert',
          name: 'تنبيه أمني / Security Alert',
          subjectAr: 'تنبيه أمني هام',
          subjectEn: 'Important Security Alert',
          bodyAr: 'مرحباً {{userName}}، تم رصد نشاط مريب: {{reason}}',
          bodyEn: 'Hello {{userName}}, suspicious activity was detected: {{reason}}',
        },
        {
          key: 'ai_operation_status',
          name: 'اكتمال عملية الذكاء / AI Operation Complete',
          subjectAr: 'اكتملت معالجة البيانات بالذكاء الاصطناعي',
          subjectEn: 'AI processing complete',
          bodyAr: 'اكتملت عملية الذكاء الاصطناعي بنجاح.',
          bodyEn: 'AI process completed successfully.',
        },
        {
          key: 'general_notification',
          name: 'إشعار عام / General Notification',
          subjectAr: 'تنبيه من منصة مدار',
          subjectEn: 'Notification from MADAR Platform',
          bodyAr: 'تنبيه: {{reason}}',
          bodyEn: 'Notification: {{reason}}',
        },
      ];

      for (const t of defaults) {
        await this.templateModel.create({
          ...t,
          isActive: true,
          styles: {
            logo: '',
            backgroundColor: '#f4f4f4',
            cardColor: '#ffffff',
            textColor: '#333333',
            buttonColor: '#9fe870',
            buttonTextColor: '#000000',
            fontFamily: 'Arial',
            fontSize: '16px',
            spacing: '20px',
          },
          versions: [],
          currentVersion: 1,
        });
      }
    }

    // 2. Seed notification policies
    const policiesCount = await this.policyModel.countDocuments();
    if (policiesCount === 0) {
      const defaultPolicies = [
        {
          category: 'auth_verification',
          nameAr: 'التحقق من البريد الإلكتروني',
          nameEn: 'Email Verification',
          channels: ['email'],
          targetRoles: ['student', 'company', 'university', 'admin'],
          priority: 'critical',
          useQueue: false,
          maxRetryCount: 3,
          expirySeconds: 900,
          templateKey: 'email_verification',
          isActive: true,
        },
        {
          category: 'auth_forgot_password',
          nameAr: 'استعادة كلمة المرور',
          nameEn: 'Forgot Password',
          channels: ['email'],
          targetRoles: ['student', 'company', 'university', 'admin'],
          priority: 'critical',
          useQueue: false,
          maxRetryCount: 3,
          expirySeconds: 3600,
          templateKey: 'forgot_password',
          isActive: true,
        },
        {
          category: 'university_review',
          nameAr: 'اعتماد ورفض الجامعات',
          nameEn: 'University Review',
          channels: ['email', 'in-app'],
          targetRoles: ['university'],
          priority: 'high',
          useQueue: true,
          maxRetryCount: 5,
          expirySeconds: 86400 * 7,
          templateKey: 'university_approval',
          isActive: true,
        },
        {
          category: 'company_review',
          nameAr: 'اعتماد ورفض الشركات',
          nameEn: 'Company Review',
          channels: ['email', 'in-app'],
          targetRoles: ['company'],
          priority: 'high',
          useQueue: true,
          maxRetryCount: 5,
          expirySeconds: 86400 * 7,
          templateKey: 'company_approval',
          isActive: true,
        },
        {
          category: 'application_update',
          nameAr: 'تحديث حالة الطلب',
          nameEn: 'Application Status Update',
          channels: ['email', 'in-app'],
          targetRoles: ['student'],
          priority: 'medium',
          useQueue: true,
          maxRetryCount: 3,
          expirySeconds: 86400 * 30,
          templateKey: 'application_status_change',
          isActive: true,
        },
      ];

      for (const p of defaultPolicies) {
        await this.policyModel.create(p);
      }
    }

    // 3. Seed AI Config if empty
    const aiCount = await this.aiConfigModel.countDocuments();
    if (aiCount === 0) {
      await this.aiConfigModel.create({
        version: 1,
        status: 'active',
        skillsWeight: 40,
        experienceWeight: 30,
        projectsWeight: 15,
        interestsWeight: 15,
        highMatchThreshold: 70,
        recommendationThreshold: 30,
        skillConfidence: 0.3,
        fuzzyMatchingThreshold: 0.7,
        skillGapSeverityThreshold: 50,
        numberOfRecommendations: 10,
        timeoutMs: 5000,
        retryCount: 3,
        batchSize: 100,
        concurrencyLimit: 5,
        languages: ['ar', 'en'],
        arabicNormalization: true,
        skillTaxonomy: {},
        curriculumMarketSettings: {},
      });
    }
  }
}
