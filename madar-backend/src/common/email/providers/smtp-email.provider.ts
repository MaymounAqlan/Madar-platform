import { Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailProvider, EmailSendOptions, EmailSendResult } from '../email-provider.interface';

export class SmtpEmailProvider implements EmailProvider {
  readonly name = 'smtp' as const;
  private readonly logger = new Logger(SmtpEmailProvider.name);
  private transporter: Transporter | null = null;
  private readonly defaultFrom: string;

  constructor() {
    this.defaultFrom =
      process.env.SMTP_FROM ||
      process.env.EMAIL_FROM ||
      'MADAR <noreply@madar.sa>';
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure =
      String(process.env.SMTP_SECURE ?? 'false')
        .trim()
        .toLowerCase() === 'true';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: { rejectUnauthorized: false },
    });

    return this.transporter;
  }

  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const from = options.from || this.defaultFrom;
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

    try {
      const info = await this.getTransporter().sendMail({
        from,
        to,
        subject: options.subject,
        html: options.html,
        ...(options.text ? { text: options.text } : {}),
        ...(options.replyTo ? { replyTo: options.replyTo } : {}),
      });

      return {
        success: true,
        provider: 'smtp',
        messageId: info.messageId,
      };
    } catch (err: any) {
      const message = this.sanitizeError(err);
      this.logger.error(`SMTP send error: ${message}`);
      return {
        success: false,
        provider: 'smtp',
        errorCode: err?.code || err?.command || 'SMTP_ERROR',
        errorMessage: message,
      };
    }
  }

  async verify(): Promise<{ ready: boolean; error?: string }> {
    try {
      await this.getTransporter().verify();
      return { ready: true };
    } catch (err: any) {
      const message = this.sanitizeError(err);
      return { ready: false, error: message };
    }
  }

  private sanitizeError(error: any): string {
    const message = error?.message || String(error) || 'Unknown error';
    return message.replace(/pass(word)?\s*[:=]\s*\S+/gi, 'password: [redacted]');
  }
}
