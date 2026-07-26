import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { AuditLog, AuditLogDocument } from '../audit-logs/schemas/audit-log.schema';
import { PlatformSetting, PlatformSettingDocument } from '../../platform-settings/schemas/platform-setting.schema';
import { EmailTemplate, EmailTemplateDocument } from '../../platform-settings/schemas/email-template.schema';

interface EmailResult {
  success: boolean;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectModel(PlatformSetting.name) private readonly settingModel: Model<PlatformSettingDocument>,
    @InjectModel(EmailTemplate.name) private readonly templateModel: Model<EmailTemplateDocument>,
  ) {}

  private async getTransporter(): Promise<Transporter> {
    try {
      const smtpSetting = await this.settingModel.findOne({ key: 'notifications.smtpSettings' }).lean();
      const config = smtpSetting?.value;
      if (config && config.enabled && config.host) {
        return nodemailer.createTransport({
          host: config.host,
          port: config.port || 587,
          secure: config.secure || false,
          auth: {
            user: config.user || '',
            pass: config.password || '',
          },
          connectionTimeout: config.timeout || 5000,
          tls: { rejectUnauthorized: false },
        });
      }
    } catch (e: any) {
      this.logger.warn(`Failed to build custom SMTP transporter, using env fallback: ${e.message}`);
    }

    // Default Fallback
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 5000,
    });
  }

  private async getSenderEmail(): Promise<string> {
    const smtpSetting = await this.settingModel.findOne({ key: 'notifications.smtpSettings' }).lean();
    const config = smtpSetting?.value;
    if (config?.senderEmail) {
      const name = config.senderName ? `${config.senderName} ` : '';
      return `${name}<${config.senderEmail}>`;
    }
    return process.env.SMTP_FROM || 'MADAR <noreply@madar.sa>';
  }

  private renderEmailLayout(params: {
    title: string;
    preheader: string;
    contentHtml: string;
    buttonText: string;
    buttonUrl: string;
    securityNotice: string;
  }): string {
    const logoUrl = process.env.MAIL_LOGO_URL || 'https://madarplatform.vercel.app/images/madar-logo.png';
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@madarplatform.com';
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

<body style="margin:0; padding:0; background:#F4F8FB; font-family:Tahoma, Arial, sans-serif; direction:rtl;">

  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
    ${params.preheader}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F4F8FB;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
          style="max-width:620px; background:#FFFFFF; border:1px solid #DCE8F1; border-radius:18px; overflow:hidden;">

          <tr>
            <td align="center" style="padding:30px 24px 18px;">
              <a href="https://madarplatform.vercel.app" target="_blank">
                <img
                  src="${logoUrl}"
                  alt="MADAR Platform"
                  width="150"
                  style="display:block; max-width:150px; width:100%; height:auto; border:0;"
                />
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 38px 0; text-align:right;">
              <h1 style="margin:0; color:#063B70; font-size:26px; line-height:1.5;">
                ${params.title}
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 38px; color:#18364D; font-size:16px; line-height:1.9; text-align:right;">
              ${params.contentHtml}
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:8px 38px 28px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td bgcolor="#07538C" style="border-radius:10px;">
                    <a href="${params.buttonUrl}"
                      style="display:inline-block; padding:14px 30px; color:#FFFFFF; text-decoration:none; font-weight:bold; font-size:16px;">
                      ${params.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 38px 24px; color:#5E768A; font-size:13px; line-height:1.7; text-align:right;">
              إذا لم يعمل الزر، انسخ الرابط التالي وافتحه في المتصفح:
              <br>
              <a href="${params.buttonUrl}" style="color:#08A9B8; word-break:break-all;">
                ${params.buttonUrl}
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 38px; background:#F8FBFD; border-top:1px solid #E3EDF4; color:#6C8192; font-size:12px; line-height:1.8; text-align:center;">
              ${params.securityNotice}
              <br><br>
              منصة مدار — ربط التعليم بسوق العمل
              <br>
              <a href="https://madarplatform.vercel.app" style="color:#07538C; text-decoration:none;">
                madarplatform.vercel.app
              </a>
              <br>
              للدعم:
              <a href="mailto:${supportEmail}" style="color:#07538C;">
                ${supportEmail}
              </a>
              <br><br>
              © ${currentYear} MADAR Platform
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

  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<EmailResult> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://madarplatform.vercel.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;
    
    try {
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

      const transporter = await this.getTransporter();
      const from = await this.getSenderEmail();

      await transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Password reset email sent to: ${to}`);
      await this.logEmailEvent('EMAIL_SENT', to, 'forgot_password', { resetUrl });
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to send password reset email to ${to}:`, error);
      await this.logEmailEvent('EMAIL_FAILED', to, 'forgot_password', { error: this.sanitizeError(error) });
      return { success: false, error: this.sanitizeError(error) };
    }
  }

  async sendPasswordChangeSuccessEmail(to: string, name: string): Promise<EmailResult> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://madarplatform.vercel.app';
    const loginUrl = `${frontendUrl}/login`;
    
    try {
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

      const transporter = await this.getTransporter();
      const from = await this.getSenderEmail();

      await transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Password change success email sent to: ${to}`);
      await this.logEmailEvent('EMAIL_SENT', to, 'password_change_success', {});
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to send password change success email to ${to}:`, error);
      await this.logEmailEvent('EMAIL_FAILED', to, 'password_change_success', { error: this.sanitizeError(error) });
      return { success: false, error: this.sanitizeError(error) };
    }
  }

  async sendVerificationEmail(to: string, code: string, name: string): Promise<EmailResult> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://madarplatform.vercel.app';
    const verificationUrl = `${frontendUrl}/verify-email?code=${code}&email=${encodeURIComponent(to)}`;
    
    try {
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

      const transporter = await this.getTransporter();
      const from = await this.getSenderEmail();

      await transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Verification email sent to: ${to}`);
      await this.logEmailEvent('EMAIL_SENT', to, 'email_verification', { code });
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to send verification email to ${to}:`, error);
      await this.logEmailEvent('EMAIL_FAILED', to, 'email_verification', { error: this.sanitizeError(error) });
      return { success: false, error: this.sanitizeError(error) };
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<EmailResult> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://madarplatform.vercel.app';
    try {
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

      const transporter = await this.getTransporter();
      const from = await this.getSenderEmail();

      await transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Welcome email sent to: ${to}`);
      await this.logEmailEvent('EMAIL_SENT', to, 'general_notification', {});
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to send welcome email to ${to}:`, error);
      await this.logEmailEvent('EMAIL_FAILED', to, 'general_notification', { error: this.sanitizeError(error) });
      return { success: false, error: this.sanitizeError(error) };
    }
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
    
    try {
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

      const transporter = await this.getTransporter();
      const from = await this.getSenderEmail();

      await transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Staff invitation email sent to: ${to}`);
      await this.logEmailEvent('EMAIL_SENT', to, 'staff_invitation', { universityName });
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to send staff invitation email to ${to}:`, error);
      await this.logEmailEvent('EMAIL_FAILED', to, 'staff_invitation', { universityName, error: this.sanitizeError(error) });
      return { success: false, error: this.sanitizeError(error) };
    }
  }

  async sendCustomTemplateEmail(to: string, templateKey: string, variables: Record<string, string>, lang: 'ar' | 'en' = 'ar'): Promise<EmailResult> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://madarplatform.vercel.app';
    try {
      // For dynamic templates, fetch from DB
      const template = await this.templateModel.findOne({ key: templateKey }).lean();
      
      const defaultSubject = lang === 'ar' ? 'تنبيه من منصة مدار' : 'Notification from MADAR';
      const defaultBody = lang === 'ar'
        ? 'يوجد إشعار جديد في حسابك.'
        : 'You have a new notification.';

      const subjectText = template ? (lang === 'ar' ? template.subjectAr : template.subjectEn) : defaultSubject;
      let bodyText = template ? (lang === 'ar' ? template.bodyAr : template.bodyEn) : defaultBody;
      const preheader = template ? (lang === 'ar' ? template.preheaderAr : template.preheaderEn) : '';

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

      const transporter = await this.getTransporter();
      const from = await this.getSenderEmail();

      await transporter.sendMail({ from, to, subject: subjectText, html });
      await this.logEmailEvent('EMAIL_SENT', to, templateKey, variables);
      return { success: true };
    } catch (error: any) {
      this.logger.error(`Failed to send email template ${templateKey} to ${to}:`, error);
      await this.logEmailEvent('EMAIL_FAILED', to, templateKey, { error: this.sanitizeError(error) });
      return { success: false, error: this.sanitizeError(error) };
    }
  }

  private async logEmailEvent(action: 'EMAIL_SENT' | 'EMAIL_FAILED', to: string, template: string, details: Record<string, any>): Promise<void> {
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
    return message.replace(/pass(word)?\s*[:=]\s*\S+/gi, 'password: [redacted]');
  }
}
