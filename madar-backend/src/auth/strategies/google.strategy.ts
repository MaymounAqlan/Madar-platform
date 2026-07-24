import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL') || '/api/auth/google/callback';

    if (!clientID || !clientSecret) {
      Logger.warn('Google OAuth credentials not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.', 'GoogleStrategy');
    }

    super({
      clientID: clientID || 'placeholder',
      clientSecret: clientSecret || 'placeholder',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      this.logger.error(`Google OAuth profile is missing an email address for profile id: ${id}`);
      return done(new Error('Google profile email is required'), null);
    }

    this.logger.log(`Google OAuth user authenticated: ${email}`);

    const user = {
      provider: 'google',
      providerId: id,
      email,
      firstName: name?.givenName || email.split('@')[0],
      lastName: name.familyName || '',
      picture: photos?.[0]?.value || null,
      accessToken,
    };

    done(null, user);
  }
}
