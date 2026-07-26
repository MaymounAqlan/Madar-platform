import { Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailProvider, EmailSendOptions, EmailSendResult } from '../email-provider.interface';

export class ResendEmailProvider implements EmailProvider {
  readonly name = 'resend' as const;
  private readonly logger = new Logger(ResendEmailProvider.name);
  private resend: Resend | null = null;
  private readonly apiKeyPresent: boolean;
  private readonly defaultFrom: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.apiKeyPresent = !!apiKey;
    if (!apiKey) {
      this.logger.error(
        'RESEND_API_KEY is not configured. Resend provider will fail on send.',
      );
    } else {
      this.resend = new Resend(apiKey);
    }
    this.defaultFrom =
      process.env.EMAIL_FROM ||
      process.env.SMTP_FROM ||
      'MADAR <onboarding@resend.dev>';
    if (!process.env.EMAIL_FROM && !process.env.SMTP_FROM) {
      this.logger.warn(
        'EMAIL_FROM is not set. Using default: MADAR <onboarding@resend.dev>',
      );
    }
  }

  async send(options: EmailSendOptions): Promise<EmailSendResult> {
    const from = options.from || this.defaultFrom;
    const to = Array.isArray(options.to) ? options.to : [options.to];

    try {
      if (!this.resend) {
        return {
          success: false,
          provider: 'resend',
          errorCode: 'NO_API_KEY',
          errorMessage: 'RESEND_API_KEY is not configured',
        };
      }
      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject: options.subject,
        html: options.html,
        ...(options.text ? { text: options.text } : {}),
        ...(options.replyTo ? { replyTo: options.replyTo } : {}),
      });

      if (error) {
        this.logger.error(
          `Resend API error: ${error.name} - ${error.message}`,
        );
        return {
          success: false,
          provider: 'resend',
          errorCode: error.name || 'RESEND_ERROR',
          errorMessage: error.message,
        };
      }

      if (!data?.id) {
        this.logger.error('Resend API returned no data.id');
        return {
          success: false,
          provider: 'resend',
          errorCode: 'NO_MESSAGE_ID',
          errorMessage: 'Resend API returned no message ID',
        };
      }

      return {
        success: true,
        provider: 'resend',
        messageId: data.id,
      };
    } catch (err: any) {
      // Sanitize error to never leak API key
      const message = (err?.message || String(err)).replace(
        /re_[a-zA-Z0-9_]+/g,
        '[REDACTED_KEY]',
      );
      this.logger.error(`Resend send exception: ${message}`);
      return {
        success: false,
        provider: 'resend',
        errorCode: err?.code || err?.name || 'EXCEPTION',
        errorMessage: message,
      };
    }
  }

  async verify(): Promise<{ ready: boolean; error?: string }> {
    if (!process.env.RESEND_API_KEY) {
      return { ready: false, error: 'RESEND_API_KEY is not configured' };
    }
    try {
      if (!this.resend) {
        return { ready: false, error: 'RESEND_API_KEY is not configured (no client)' };
      }
      // Resend doesn't have a dedicated verify endpoint.
      // We attempt to list domains to validate the API key.
      const { error } = await this.resend.domains.list();
      if (error) {
        return { ready: false, error: `${error.name}: ${error.message}` };
      }
      return { ready: true };
    } catch (err: any) {
      const message = (err?.message || String(err)).replace(
        /re_[a-zA-Z0-9_]+/g,
        '[REDACTED_KEY]',
      );
      return { ready: false, error: message };
    }
  }
}
