/**
 * Unified email provider interface for MADAR platform.
 * All email providers (Resend, SMTP) must implement this interface.
 */

export interface EmailSendOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: 'resend' | 'smtp';
  messageId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface EmailProvider {
  /**
   * Send an email through this provider.
   */
  send(options: EmailSendOptions): Promise<EmailSendResult>;

  /**
   * Verify the provider connection/configuration.
   * Returns true if the provider is ready to send.
   */
  verify(): Promise<{ ready: boolean; error?: string }>;

  /**
   * The name of the provider for logging.
   */
  readonly name: 'resend' | 'smtp';
}
