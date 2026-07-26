import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../audit-logs/schemas/audit-log.schema';
import { PlatformSetting, PlatformSettingDocument } from '../../platform-settings/schemas/platform-setting.schema';
import { EmailTemplate, EmailTemplateDocument } from '../../platform-settings/schemas/email-template.schema';
import { EmailProvider, EmailSendResult } from '../email/email-provider.interface';
import { ResendEmailProvider } from '../email/providers/resend-email.provider';
import { SmtpEmailProvider } from '../email/providers/smtp-email.provider';

interface EmailResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private provider!: EmailProvider;

  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectModel(PlatformSetting.name) private readonly settingModel: Model<PlatformSettingDocument>,
    @InjectModel(EmailTemplate.name) private readonly templateModel: Model<EmailTemplateDocument>,
  ) {}

  async onModuleInit() {
    const providerName = String(process.env.EMAIL_PROVIDER ?? 'smtp')
      .trim()
      .toLowerCase();

    this.logger.log('=== Email Service Initializing ===');
    this.logger.log(`EMAIL_PROVIDER: ${providerName}`);

    if (providerName === 'resend') {
      this.provider = new ResendEmailProvider();
      this.logger.log(`resendKeyConfigured: ${!!process.env.RESEND_API_KEY}`);
      this.logger.log(`emailFromConfigured: ${!!(process.env.EMAIL_FROM || process.env.SMTP_FROM)}`);
    } else if (providerName === 'smtp') {
      this.provider = new SmtpEmailProvider();
      this.logger.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'smtp.gmail.com (default)'}`);
      this.logger.log(`SMTP_PORT: ${process.env.SMTP_PORT || '587 (default)'}`);
      this.logger.log(`SMTP_SECURE: ${process.env.SMTP_SECURE || 'false (default)'}`);
      this.logger.log(`SMTP_USER configured: ${!!process.env.SMTP_USER}`);
      this.logger.log(`SMTP_PASS configured: ${!!process.env.SMTP_PASS}`);
    } else {
      this.logger.error(
        `Invalid EMAIL_PROVIDER="${providerName}". Must be "resend" or "smtp". Falling back to smtp.`,
      );
      this.provider = new SmtpEmailProvider();
    }

    // Verify connection — non-blocking; log result only
    try {
      const result = await this.provider.verify();
      if (result.ready) {
        this.logger.log(`${this.provider.name} provider verified successfully.`);
      } else {
        this.logger.warn(`${this.provider.name} verification warning: ${result.error}`);
      }
    } catch (e: any) {
      this.logger.warn(`${this.provider.name} verify check failed: ${e.message}`);
    }

    this.logger.log('=== Email Service Ready ===');
  }

  /**
   * Internal unified send method. All public methods delegate here.
   */
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    templateName: string,
    auditDetails: Record<string, any> = {},
  ): Promise<EmailResult> {
    try {
      const from = await this.getSenderEmail();
      const result: EmailSendResult = await this.provider.send({
        to,
        subject,
        html,
        from,
      });

      if (result.success) {
        this.logger.log(
          `Email sent via ${result.provider} to: ${to} [messageId: ${result.messageId}]`,
        );
        await this.logEmailEvent('EMAIL_SENT', to, templateName, {
          ...auditDetails,
          provider: result.provider,
          messageId: result.messageId,
        });
        return { success: true };
      } else {
        this.logger.error(
          `Email failed via ${result.provider}: ${result.errorCode} - ${result.errorMessage}`,
        );
        await this.logEmailEvent('EMAIL_FAILED', to, templateName, {
          ...auditDetails,
          provider: result.provider,
          errorCode: result.errorCode,
          error: result.errorMessage,
        });
        return { success: false, error: result.errorMessage };
      }
    } catch (error: any) {
      const message = this.sanitizeError(error);
      this.logger.error(`Email send exception to ${to}: ${message}`);
      await this.logEmailEvent('EMAIL_FAILED', to, templateName, {
        ...auditDetails,
        error: message,
      });
      return { success: false, error: message };
    }
  }

  // ─── Sender ───────────────────────────────────────────────────────────

  private async getSenderEmail(): Promise<string> {
    // Try DB setting first
    try {
      const smtpSetting = await this.settingModel
        .findOne({ key: 'notifications.smtpSettings' })
        .lean();
      const config = smtpSetting?.value;
      if (config?.senderEmail) {
        const name = config.senderName ? `${config.senderName} ` : '';
        return `${name}<${config.senderEmail}>`;
      }
    } catch {
      // ignore DB read errors, fall through to env
    }
    return (
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      'MADAR <noreply@madar.sa>'
    );
  }

  // ─── HTML Layout ──────────────────────────────────────────────────────

  private renderEmailLayout(params: {
    title: string;
    preheader: string;
    contentHtml: string;
    buttonText: string;
    buttonUrl: string;
    securityNotice: string;
  }): string {
    const logoUrl =
      process.env.MAIL_LOGO_URL ||
      'https://madarplatform.vercel.app/images/madar-logo.png';
    const supportEmail =
      process.env.SUPPORT_EMAIL || 'support@madarplatform.com';
    const currentYear = new Date().getFullYear();

    return `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <meta name="x-apple-disable-message-reformatting">
  <title>${params.title}</title>
</head>

<body style="margin:0; padding:0; background:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; direction:rtl;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    ${params.preheader}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6; padding:40px 16px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="max-width:600px; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden; text-align:right;">

          <!-- Header -->
          <tr>
            <td style="padding:24px 38px; border-bottom:1px solid #e5e7eb; background:#ffffff;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="48" valign="middle">
                    <a href="https://madarplatform.vercel.app" target="_blank" style="text-decoration:none;">
                      <img
                        src="${logoUrl}"
                        alt="MADAR Logo"
                        width="48"
                        style="display:block; max-width:48px; width:100%; height:auto; border:0;"
                      />
                    </a>
                  </td>
                  <td valign="middle" style="padding-right:16px;">
                    <a href="https://madarplatform.vercel.app" target="_blank" style="text-decoration:none;">
                      <span style="color:#1ba442; font-size:24px; font-weight:800; font-family:Arial, sans-serif; letter-spacing:0.5px;">MADAR</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:32px 38px 0;">
              <h1 style="margin:0; color:#111827; font-size:24px; font-weight:700; line-height:1.4;">
                ${params.title}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:24px 38px; color:#374151; font-size:16px; line-height:1.8;">
              ${params.contentHtml}
            </td>
          </tr>

          <!-- Call to Action -->
          <tr>
            <td style="padding:8px 38px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#1ba442; border-radius:6px; text-align:center;">
                    <a href="${params.buttonUrl}"
                      style="display:inline-block; padding:12px 28px; color:#ffffff; text-decoration:none; font-weight:600; font-size:16px; border-radius:6px;">
                      ${params.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback Link -->
          <tr>
            <td style="padding:0 38px 32px; color:#6b7280; font-size:13px; line-height:1.6;">
              إذا لم يعمل الزر، انسخ الرابط التالي وافتحه في المتصفح:
              <br>
              <a href="${params.buttonUrl}" style="color:#1ba442; word-break:break-all;">
                ${params.buttonUrl}
              </a>
            </td>
          </tr>

          <!-- Footer / Legal Info -->
          <tr>
            <td style="padding:32px 38px; background:#f9fafb; border-top:1px solid #e5e7eb; color:#6b7280; font-size:12px; line-height:1.6;">
              ${params.securityNotice}
              <br><br>
              <strong>لماذا تتلقى هذه الرسالة؟</strong><br>
              لقد تلقيت هذا البريد الإلكتروني لأنه مرتبط بحسابك في <a href="https://madarplatform.vercel.app" style="color:#1ba442; text-decoration:none; font-weight:600;">منصة مدار</a>. يرجى عدم الرد على هذه الرسالة التلقائية.
              <br><br>
              <div style="border-top:1px solid #e5e7eb; padding-top:16px; margin-top:16px;">
                <strong>منصة مدار (MADAR) — ربط التعليم بسوق العمل</strong><br>
                المملكة العربية السعودية<br>
                للدعم والمساعدة: <a href="mailto:${supportEmail}" style="color:#1ba442; text-decoration:none;">${supportEmail}</a>
              </div>
              <br>
              © ${currentYear} MADAR Platform. جميع الحقوق محفوظة.
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  // ─── Public Email Methods (unchanged signatures) ──────────────────────

  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<EmailResult> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://madarplatform.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

    const subject = 'استعادة كلمة المرور';
    const html = this.renderEmailLayout({
      title: subject,
      preheader: 'استخدم الرابط الآمن لإعادة تعيين كلمة مرور حسابك في مدار.',
      contentHtml: `
<p style="margin:0 0 16px;">
  مرحبًا <strong>${name}</strong>،
</p>
<p style="margin:0 0 16px;">
  تلقينا طلبًا لإعادة تعيين كلمة المرور الخاصة بحسابك في منصة مدار.
</p>
<p style="margin:0 0 16px;">
  اضغط على الزر أدناه لإنشاء كلمة مرور جديدة. تنتهي صلاحية الرابط خلال
  <strong>15 دقيقة</strong>.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0;">
  <tr>
    <td style="padding:14px; background:#FFF8E8; border-right:4px solid #E8A317; border-radius:8px; color:#6C5520;">
      لا تشارك هذا الرابط مع أي شخص. فريق مدار لن يطلب منك رمز الاستعادة أو كلمة المرور.
    </td>
  </tr>
</table>`,
      buttonText: 'إعادة تعيين كلمة المرور',
      buttonUrl: resetUrl,
      securityNotice: 'إذا لم تطلب إعادة تعيين كلمة المرور، يمكنك تجاهل هذه الرسالة بأمان، ولن يتم إجراء أي تغيير على حسابك.',
    });

    return this.sendEmail(to, subject, html, 'forgot_password', { resetUrl });
  }

  async sendPasswordChangeSuccessEmail(to: string, name: string): Promise<EmailResult> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://madarplatform.vercel.app';
    const loginUrl = `${frontendUrl}/login`;

    const subject = 'تم تغيير كلمة المرور بنجاح';
    const html = this.renderEmailLayout({
      title: subject,
      preheader: 'تم تحديث كلمة مرور حسابك في منصة مدار.',
      contentHtml: `
<p style="margin:0 0 16px;">
  مرحبًا <strong>${name}</strong>،
</p>
<p style="margin:0 0 16px;">
  تم تغيير كلمة المرور الخاصة بحسابك في منصة مدار بنجاح.
</p>
<p style="margin:0 0 16px;">
  يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0;">
  <tr>
    <td style="padding:14px; background:#EEF9F5; border-right:4px solid #1A9C70; border-radius:8px; color:#285F4E;">
      إذا لم تكن أنت من غيّر كلمة المرور، تواصل مع دعم المنصة فورًا.
    </td>
  </tr>
</table>`,
      buttonText: 'تسجيل الدخول إلى مدار',
      buttonUrl: loginUrl,
      securityNotice: 'هذه رسالة أمان آلية من منصة مدار. لا ترسل كلمة المرور عبر البريد الإلكتروني.',
    });

    return this.sendEmail(to, subject, html, 'password_change_success');
  }

  async sendVerificationEmail(to: string, code: string, name: string): Promise<EmailResult> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://madarplatform.vercel.app';
    const verificationUrl = `${frontendUrl}/verify-email?code=${code}&email=${encodeURIComponent(to)}`;

    const subject = 'تأكيد البريد الإلكتروني - منصة مدار';
    const html = this.renderEmailLayout({
      title: subject,
      preheader: 'يرجى تأكيد بريدك الإلكتروني للبدء في استخدام المنصة.',
      contentHtml: `
<p style="margin:0 0 16px;">
  مرحبًا <strong>${name}</strong>،
</p>
<p style="margin:0 0 16px;">
  شكرًا لتسجيلك في منصة مدار. يرجى تأكيد عنوان بريدك الإلكتروني بالنقر على الزر أدناه لتفعيل حسابك.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0;">
  <tr>
    <td style="padding:14px; background:#F2F9FB; border-right:4px solid #08A9B8; border-radius:8px;">
      <strong style="color:#063B70;">تأكيد البريد</strong>
      <br>
      <span style="color:#526C80;">
        هذه الخطوة ضرورية لتأمين حسابك والتأكد من وصول الإشعارات إليك.
      </span>
    </td>
  </tr>
</table>`,
      buttonText: 'تأكيد البريد الإلكتروني',
      buttonUrl: verificationUrl,
      securityNotice: 'إذا لم تقم بإنشاء هذا الحساب، يرجى تجاهل هذه الرسالة.',
    });

    return this.sendEmail(to, subject, html, 'email_verification', { code });
  }

  async sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://madarplatform.vercel.app';

    const subject = 'مرحبًا بك في منصة مدار';
    const html = this.renderEmailLayout({
      title: subject,
      preheader: 'تم إنشاء حسابك بنجاح، وبدأت رحلتك من التعليم إلى فرص العمل.',
      contentHtml: `
<p style="margin:0 0 16px;">
  مرحبًا <strong>${name}</strong>،
</p>
<p style="margin:0 0 16px;">
  يسعدنا انضمامك إلى منصة <strong>مدار</strong>، منصة الذكاء الأكاديمي والمهني التي تساعد على ربط التعليم بمتطلبات سوق العمل.
</p>
<p style="margin:0 0 16px;">
  من خلال حسابك يمكنك الاستفادة من الأدوات والخدمات المناسبة لدورك، مثل تحليل الملف المهني، اكتشاف المهارات، متابعة مستوى الجاهزية، والوصول إلى الفرص والتوصيات الذكية.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0;">
  <tr>
    <td style="padding:14px; background:#F2F9FB; border-right:4px solid #08A9B8; border-radius:8px;">
      <strong style="color:#063B70;">من التعليم إلى التوظيف</strong>
      <br>
      <span style="color:#526C80;">
        نساعدك على بناء مسار مهني أكثر وضوحًا اعتمادًا على البيانات والتحليل الذكي.
      </span>
    </td>
  </tr>
</table>`,
      buttonText: 'الانتقال إلى منصة مدار',
      buttonUrl: frontendUrl,
      securityNotice: 'إذا لم تقم بإنشاء هذا الحساب، يرجى التواصل مع دعم المنصة.',
    });

    return this.sendEmail(to, subject, html, 'general_notification');
  }

  async sendUniversityStaffInvitation(
    to: string,
    token: string,
    name: string,
    universityName: string,
    message?: string,
  ): Promise<EmailResult> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://madarplatform.vercel.app';
    const invitationUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;

    const subject = 'دعوة للانضمام إلى منصة مدار كمنسق جامعة';
    const html = this.renderEmailLayout({
      title: subject,
      preheader: `تمت دعوتك لإدارة بيانات ${universityName} على منصة مدار.`,
      contentHtml: `
<p style="margin:0 0 16px;">
  مرحبًا <strong>${name}</strong>،
</p>
<p style="margin:0 0 16px;">
  تمت دعوتك بصفتك ممثلاً عن <strong>${universityName}</strong> لاستخدام منصة مدار.
</p>
<p style="margin:0 0 16px;">
  من خلال حسابك، يمكنك إدارة بيانات الجامعة الأكاديمية والمهنية والتواصل مع الخريجين وأصحاب العمل.
  يرجى النقر على الزر أدناه لإعداد كلمة المرور الخاصة بك والبدء.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0;">
  <tr>
    <td style="padding:14px; background:#F2F9FB; border-right:4px solid #08A9B8; border-radius:8px;">
      <strong style="color:#063B70;">إدارة بيانات الجامعة</strong>
      <br>
      <span style="color:#526C80;">
        انضمامك يسهم في تحسين جودة المخرجات الأكاديمية وتعزيز ارتباطها باحتياجات سوق العمل.
      </span>
    </td>
  </tr>
</table>`,
      buttonText: 'تفعيل حسابك',
      buttonUrl: invitationUrl,
      securityNotice: 'إذا لم تكن ممثلاً لهذه الجامعة، يرجى تجاهل هذه الدعوة.',
    });

    return this.sendEmail(to, subject, html, 'staff_invitation', { universityName });
  }

  async sendCustomTemplateEmail(
    to: string,
    templateKey: string,
    variables: Record<string, string>,
    lang: 'ar' | 'en' = 'ar',
  ): Promise<EmailResult> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://madarplatform.vercel.app';

    // For dynamic templates, fetch from DB
    const template = await this.templateModel.findOne({ key: templateKey }).lean();

    const defaultSubject = lang === 'ar' ? 'تنبيه من منصة مدار' : 'Notification from MADAR';
    const defaultBody = lang === 'ar'
      ? 'يوجد إشعار جديد في حسابك.'
      : 'You have a new notification.';

    const subjectText = template
      ? (lang === 'ar' ? template.subjectAr : template.subjectEn)
      : defaultSubject;
    let bodyText = template
      ? (lang === 'ar' ? template.bodyAr : template.bodyEn)
      : defaultBody;
    const preheader = template
      ? (lang === 'ar' ? template.preheaderAr : template.preheaderEn)
      : '';

    // Replace variables
    bodyText = bodyText.replace(/\{\{(\w+)\}\}/g, (m, key) => {
      return variables[key] !== undefined ? variables[key] : m;
    });

    const html = this.renderEmailLayout({
      title: subjectText,
      preheader: preheader,
      contentHtml: `<p style="margin:0 0 16px;">${bodyText}</p>`,
      buttonText: 'عرض الإشعار',
      buttonUrl: frontendUrl,
      securityNotice: 'تنبيه إداري من النظام.',
    });

    return this.sendEmail(to, subjectText, html, templateKey, variables);
  }

  // ─── Public accessor for debug endpoint ───────────────────────────────

  getProviderInfo(): { name: string; ready: boolean } {
    return { name: this.provider?.name || 'none', ready: !!this.provider };
  }

  async verifyProvider(): Promise<{ ready: boolean; error?: string }> {
    if (!this.provider) return { ready: false, error: 'No provider initialized' };
    return this.provider.verify();
  }

  /**
   * Send a simple test email (used by debug endpoint).
   */
  async sendTestEmail(to: string): Promise<EmailSendResult> {
    const from = await this.getSenderEmail();
    return this.provider.send({
      to,
      subject: 'MADAR Email Test',
      html: '<h2 style="color:#1ba442; font-family:Arial, sans-serif;">MADAR email service is working</h2><p>This is a test email from MADAR Platform.</p>',
      from,
    });
  }

  // ─── Audit & Utility ─────────────────────────────────────────────────

  private async logEmailEvent(
    action: 'EMAIL_SENT' | 'EMAIL_FAILED',
    to: string,
    template: string,
    details: Record<string, any>,
  ): Promise<void> {
    try {
      await this.auditLogModel.create({
        action,
        resource: 'email',
        resourceId: to,
        details: {
          to,
          template,
          subject: template,
          ...details,
        },
        severity: action === 'EMAIL_SENT' ? 'info' : 'warning',
        timestamp: new Date(),
      });
    } catch (logError: any) {
      this.logger.warn(`Failed to write email audit log: ${logError?.message || logError}`);
    }
  }

  private sanitizeError(error: any): string {
    const message = error?.message || String(error) || 'Unknown error';
    return message
      .replace(/pass(word)?\s*[:=]\s*\S+/gi, 'password: [redacted]')
      .replace(/re_[a-zA-Z0-9_]+/g, '[REDACTED_KEY]');
  }
}
