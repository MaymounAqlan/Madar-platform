import { Controller, Get, Post, Body, Headers, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { EmailService } from '../services/email.service';

@Controller('debug')
export class DebugController {
  private readonly logger = new Logger(DebugController.name);
  // Simple in-memory rate limit: track last test time
  private lastTestTime = 0;

  constructor(private readonly emailService: EmailService) {}

  @Get('email')
  async debugEmailStatus() {
    if (String(process.env.ENABLE_EMAIL_DIAGNOSTICS ?? 'false').trim().toLowerCase() !== 'true') {
      throw new HttpException('Diagnostics disabled', HttpStatus.NOT_FOUND);
    }

    const providerInfo = this.emailService.getProviderInfo();
    const verifyResult = await this.emailService.verifyProvider();

    return {
      emailProvider: process.env.EMAIL_PROVIDER || 'smtp (default)',
      providerName: providerInfo.name,
      providerReady: providerInfo.ready,
      verify: verifyResult,
      envCheck: {
        smtpHost: process.env.SMTP_HOST || 'not set',
        smtpPort: process.env.SMTP_PORT || 'not set',
        smtpSecure: process.env.SMTP_SECURE || 'not set',
        hasSmtpUser: !!process.env.SMTP_USER,
        hasSmtpPass: !!process.env.SMTP_PASS,
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasEmailFrom: !!(process.env.EMAIL_FROM || process.env.SMTP_FROM),
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post('email/test')
  async testEmailSend(
    @Body() body: { to?: string },
    @Headers('x-debug-key') debugKey?: string,
  ) {
    // Gate 1: Feature flag
    if (String(process.env.ENABLE_EMAIL_DIAGNOSTICS ?? 'false').trim().toLowerCase() !== 'true') {
      throw new HttpException('Diagnostics disabled', HttpStatus.NOT_FOUND);
    }

    // Gate 2: Auth via debug key
    const expectedKey = process.env.DEBUG_DIAGNOSTIC_KEY;
    if (!expectedKey || debugKey !== expectedKey) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Gate 3: Simple rate limit (1 per 10 seconds)
    const now = Date.now();
    if (now - this.lastTestTime < 10_000) {
      throw new HttpException('Rate limit: wait 10 seconds', HttpStatus.TOO_MANY_REQUESTS);
    }
    this.lastTestTime = now;

    const to = body?.to;
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      throw new HttpException('Invalid email address', HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`Debug test email requested to: ${to}`);
    const result = await this.emailService.sendTestEmail(to);

    return {
      success: result.success,
      provider: result.provider,
      messageId: result.messageId,
      errorCode: result.errorCode,
      errorMessage: result.errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}
