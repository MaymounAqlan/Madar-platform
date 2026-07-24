import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class LinkedInAuthGuard extends AuthGuard('linkedin') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: any) {
    const clientId = this.configService.get<string>('LINKEDIN_CLIENT_ID');
    const clientSecret = this.configService.get<string>('LINKEDIN_CLIENT_SECRET');
    if (!clientId || !clientSecret) {
      throw new ServiceUnavailableException({
        code: 'LINKEDIN_NOT_CONFIGURED',
        message: 'LinkedIn OAuth is not configured on this server.',
      });
    }
    return super.canActivate(context);
  }
}
