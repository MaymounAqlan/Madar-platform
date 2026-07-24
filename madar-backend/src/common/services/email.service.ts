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

  private async renderEmail(templateKey: string, variables: Record<string, string>, lang: 'ar' | 'en' = 'ar'): Promise<{ subject: string; html: string }> {
    const template = await this.templateModel.findOne({ key: templateKey }).lean();
    const brandingSetting = await this.settingModel.findOne({ key: 'notifications.emailBranding' }).lean();
    const branding = brandingSetting?.value || {};

    const defaultSubject = lang === 'ar' ? 'تنبيه من منصة مدار' : 'Notification from MADAR';
    const defaultBody = lang === 'ar'
      ? 'مرحباً، رمز التحقق/الرابط الخاص بك هو {{verificationUrl}} {{resetUrl}} {{actionUrl}}'
      : 'Hello, your verification link/code is: {{verificationUrl}} {{resetUrl}} {{actionUrl}}';

    const subjectText = template ? (lang === 'ar' ? template.subjectAr : template.subjectEn) : defaultSubject;
    const bodyText = template ? (lang === 'ar' ? template.bodyAr : template.bodyEn) : defaultBody;
    const preheader = template ? (lang === 'ar' ? template.preheaderAr : template.preheaderEn) : '';

    // Replace variables
    const replaceVars = (str: string) => {
      return str.replace(/\{\{(\w+)\}\}/g, (m, key) => {
        return variables[key] !== undefined ? variables[key] : m;
      });
    };

    const renderedSubject = replaceVars(subjectText);
    const renderedBody = replaceVars(bodyText);

    // Merge styles
    const styles = { ...branding, ...(template?.styles || {}) };
    const logo = styles.logo || '';
    const logoAlt = styles.fallbackLogo || styles.platformName || 'MADAR';
    const primaryColor = styles.primaryColor || '#9fe870';
    const backgroundColor = styles.backgroundColor || '#f4f4f4';
    const cardColor = styles.cardColor || '#ffffff';
    const textColor = styles.textColor || '#333333';
    const titleColor = styles.titleColor || '#0e0f0c';
    const fontFamily = styles.fontFamily || 'Arial, sans-serif';
    const direction = styles.direction || (lang === 'ar' ? 'rtl' : 'ltr');
    const align = direction === 'rtl' ? 'right' : 'left';

    const html = `
      <div dir="${direction}" style="font-family: ${fontFamily}; text-align: ${align}; background-color: ${backgroundColor}; padding: 32px 0; width: 100%; margin: 0;">
        ${preheader ? `<span style="display:none !important; font-size:0; line-height:0; color:${backgroundColor};">${preheader}</span>` : ''}
        <div style="background-color: ${cardColor}; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #dfe1dd; overflow: hidden;">
          <div style="background-color: ${primaryColor}; padding: 24px; text-align: center;">
            ${logo ? `<img src="${logo}" alt="${logoAlt}" style="max-height: 48px;" />` : `<h1 style="color: ${titleColor}; margin: 0; font-size: 24px;">${styles.platformName || 'مدار'}</h1>`}
          </div>
          <div style="padding: 32px; color: ${textColor}; font-size: 15px; line-height: 1.6; min-height: 200px;">
            ${renderedBody}
          </div>
          <div style="background-color: #f0f1ee; padding: 24px; text-align: center; border-top: 1px solid #dfe1dd;">
            <p style="margin: 0; font-size: 12px; color: #828782;">${styles.footerText || ''}</p>
            <p style="margin: 8px 0 0; font-size: 11px; color: #828782;">${styles.copyright || '© 2026 MADAR. All rights reserved.'}</p>
          </div>
        </div>
      </div>
    `;

    return { subject: renderedSubject, html };
  }

  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<EmailResult> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/reset-password?token=${token}`;
    try {
      const { subject, html } = await this.renderEmail('forgot_password', { userName: name, resetUrl }, 'ar');
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

  async sendVerificationEmail(to: string, code: string, name: string): Promise<EmailResult> {
    try {
      const { subject, html } = await this.renderEmail('email_verification', { userName: name, verificationUrl: code }, 'ar');
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
    try {
      const { subject, html } = await this.renderEmail('general_notification', { userName: name, reason: 'مرحباً بك في منصة مدار' }, 'ar');
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
    const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/#/reset-password?token=${encodeURIComponent(token)}`;
    try {
      const { subject, html } = await this.renderEmail('staff_invitation', {
        userName: name,
        institutionName: universityName,
        actionUrl: invitationUrl,
      }, 'ar');
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
    try {
      const { subject, html } = await this.renderEmail(templateKey, variables, lang);
      const transporter = await this.getTransporter();
      const from = await this.getSenderEmail();

      await transporter.sendMail({ from, to, subject, html });
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
