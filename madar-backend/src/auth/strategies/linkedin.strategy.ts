import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  private readonly logger = new Logger(LinkedInStrategy.name);

  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('LINKEDIN_CLIENT_ID');
    const clientSecret = configService.get<string>('LINKEDIN_CLIENT_SECRET');
    const callbackURL = configService.get<string>('LINKEDIN_CALLBACK_URL') || '/api/auth/linkedin/callback';

    // Safe diagnostic logging
    Logger.log(JSON.stringify({
      linkedInClientIdConfigured: !!clientID,
      linkedInClientSecretConfigured: !!clientSecret,
      linkedInCallbackConfigured: !!callbackURL,
      sessionSecretConfigured: !!process.env.SESSION_SECRET,
    }), 'LinkedInStrategy');

    if (!clientID || !clientSecret) {
      Logger.warn('LinkedIn OAuth credentials not configured. Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET env vars.', 'LinkedInStrategy');
    }

    super({
      clientID: clientID || 'placeholder',
      clientSecret: clientSecret || 'placeholder',
      callbackURL,
      scope: ['openid', 'profile', 'email'],
      state: true,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      this.logger.error(`LinkedIn OAuth profile is missing an email address for profile id: ${id}`);
      return done(new Error('LinkedIn profile email is required'), null);
    }

    this.logger.log(`LinkedIn OAuth user authenticated: ${email}`);

    const user = {
      provider: 'linkedin',
      providerId: id,
      email,
      firstName: name?.givenName || email.split('@')[0],
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value || null,
      accessToken,
    };

    done(null, user);
  }
}
