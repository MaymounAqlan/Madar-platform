import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './auth.guard';
import { LinkedInAuthGuard } from './guards/linkedin-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { CompleteGoogleRegistrationDto } from './dto/complete-google-registration.dto';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: 900,
        },
      },
      message: 'User registered successfully',
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      success: true,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: 900,
        },
      },
      message: 'Login successful',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = dto.refreshToken || req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException({ code: 'REFRESH_TOKEN_REQUIRED', message: 'Refresh token required' });
    }
    const tokens = await this.authService.refreshToken(refreshToken);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return {
      success: true,
      data: {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: 900,
        },
      },
      message: 'Token refreshed',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate tokens' })
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = (req as any).user?.sub;
    await this.authService.logout(userId);
    this.clearAuthCookies(res);
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent if account exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    this.logger.debug(`Reset password request received. Has token: ${Boolean(dto.token)}. Password length: ${dto.newPassword?.length || 0}`);
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('google/register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Complete Google registration and create account' })
  @ApiResponse({ status: 200, description: 'Google registration completed successfully' })
  async completeGoogleRegistration(@Body() dto: CompleteGoogleRegistrationDto, @Res({ passthrough: true }) res: Response) {
    this.logger.debug(`Google registration request received: email=${dto.email}, role=${dto.role}, hasGoogleId=${!!dto.googleId}, hasLinkedinId=${!!dto.linkedinId}, profileKeys=${Object.keys(dto.profile || {}).join(',')}`);
    const result = await this.authService.completeGoogleRegistration(dto);
    this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
    return {
      success: true,
      code: result.status,
      data: {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          refreshToken: result.tokens.refreshToken,
          expiresIn: 900,
        },
      },
      message: result.message,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    const user = await this.authService.getMe(userId);
    return {
      success: true,
      data: user,
      message: 'User profile retrieved',
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMe(@Req() req: Request, @Body() dto: UpdateMeDto) {
    const userId = (req as any).user?.sub;

    // Prevent self-modification of role, permissions, or sensitive fields.
    const safeDto: any = { ...dto };
    delete safeDto.role;
    delete safeDto.userType;
    delete safeDto.roleId;
    delete safeDto.status;
    delete safeDto.permissions;
    delete safeDto.password;
    delete safeDto.email;

    if (safeDto.language) {
      safeDto.preferences = { language: safeDto.language };
      delete safeDto.language;
    }

    const user = await this.authService.updateMe(userId, safeDto);
    return {
      success: true,
      data: user,
      message: 'Profile updated successfully',
    };
  }

  // ─── Google OAuth ───

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      this.logger.log(`Google OAuth callback received. Has user payload: ${!!req.user}`);
      this.logger.debug(`Google OAuth callback payload keys: ${Object.keys(req.user || {}).join(', ')}`);

      const result = await this.authService.handleOAuthLogin(req.user, 'google');
      const redirectUrl = this.buildOAuthRedirectUrl(result);
      if (result.tokens?.accessToken && result.tokens?.refreshToken) {
        this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
      }
      this.logger.log(`Google OAuth callback completed with status=${result.status}. Redirecting to frontend.`);
      return res.redirect(redirectUrl);
    } catch (error: any) {
      this.logger.error(
        `Google OAuth callback failed: ${error?.message || error}`,
        error?.stack,
      );
      return res.redirect(this.buildOAuthErrorRedirect('GOOGLE_AUTH_FAILED', 'حدث خطأ أثناء تسجيل الدخول باستخدام Google، حاول مرة أخرى.'));
    }
  }

  // ─── LinkedIn OAuth ───

  @Get('linkedin')
  @UseGuards(LinkedInAuthGuard)
  @ApiOperation({ summary: 'Initiate LinkedIn OAuth login' })
  linkedinAuth() {
    // Guard redirects to LinkedIn
  }

  @Get('linkedin/callback')
  @UseGuards(LinkedInAuthGuard)
  @ApiOperation({ summary: 'LinkedIn OAuth callback' })
  async linkedinAuthCallback(@Req() req: any, @Res() res: Response) {
    try {
      this.logger.log(`LinkedIn OAuth callback received. Has user payload: ${!!req.user}`);
      this.logger.debug(`LinkedIn OAuth callback payload keys: ${Object.keys(req.user || {}).join(', ')}`);

      const result = await this.authService.handleOAuthLogin(req.user, 'linkedin');
      const redirectUrl = this.buildOAuthRedirectUrl(result);
      if (result.tokens?.accessToken && result.tokens?.refreshToken) {
        this.setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
      }
      this.logger.log(`LinkedIn OAuth callback completed with status=${result.status}. Redirecting to frontend.`);
      return res.redirect(redirectUrl);
    } catch (error: any) {
      this.logger.error(
        `LinkedIn OAuth callback failed: ${error?.message || error}`,
        error?.stack,
      );
      return res.redirect(this.buildOAuthErrorRedirect('LINKEDIN_AUTH_FAILED', 'حدث خطأ أثناء تسجيل الدخول باستخدام LinkedIn، حاول مرة أخرى.'));
    }
  }

  // ─── Cookie Helpers ───

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }

  private buildOAuthRedirectUrl(result: { status: string; message: string; provider?: string; tokens?: { accessToken: string; refreshToken: string }; oauthData?: Record<string, any>; user?: any }) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const provider = result.provider || result.oauthData?.provider || 'OAuth';

    if (result.status === 'AUTH_SUCCESS' && result.tokens) {
      return `${frontendUrl}/#/auth/google/success?status=${encodeURIComponent(result.status)}&message=${encodeURIComponent(result.message)}&provider=${encodeURIComponent(provider)}&token=${encodeURIComponent(result.tokens.accessToken)}&refreshToken=${encodeURIComponent(result.tokens.refreshToken)}`;
    }

    if (result.status === 'USER_NOT_FOUND' || result.status === 'PROFILE_INCOMPLETE') {
      const payload = encodeURIComponent(Buffer.from(JSON.stringify(result.oauthData || {})).toString('base64'));
      return `${frontendUrl}/#/complete-profile?status=${encodeURIComponent(result.status)}&message=${encodeURIComponent(result.message)}&provider=${encodeURIComponent(provider)}&payload=${payload}`;
    }

    return `${frontendUrl}/#/login?oauthStatus=${encodeURIComponent(result.status)}&message=${encodeURIComponent(result.message)}`;
  }

  private buildOAuthErrorRedirect(status: string, message: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${frontendUrl}/#/login?oauthStatus=${encodeURIComponent(status)}&message=${encodeURIComponent(message)}`;
  }
}
