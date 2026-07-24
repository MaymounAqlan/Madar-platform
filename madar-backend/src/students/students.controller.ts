import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Req,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { StudentsService } from './students.service';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { multerConfig } from '../config/multer.config';
import { avatarUploadConfig } from './avatar-upload.config';

@ApiTags('Students')
@Controller('api/students')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('profile')
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get student profile' })
  @ApiResponse({ status: 200, description: 'Student profile' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.studentsService.findByUserId(userId);
  }

  @Put('profile')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Update student profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Req() req: Request, @Body() dto: UpdateStudentDto) {
    const userId = (req as any).user?.sub;
    return this.studentsService.updateProfile(userId, dto);
  }

  @Post('avatar')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file', avatarUploadConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload and persist the current student avatar' })
  @ApiResponse({ status: 201, description: 'Avatar uploaded and profile updated' })
  async uploadAvatar(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException({ code: 'AVATAR_FILE_REQUIRED', message: 'A non-empty image is required' });
    }
    const userId = (req as any).user?.sub;
    return this.studentsService.updateAvatar(userId, file);
  }

  @Post('cover-image')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file', avatarUploadConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload and persist the current student profile cover image' })
  @ApiResponse({ status: 201, description: 'Cover image uploaded and profile updated' })
  async uploadCoverImage(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    if (!file?.buffer?.length) {
      throw new BadRequestException({ code: 'COVER_IMAGE_FILE_REQUIRED', message: 'A non-empty image is required' });
    }
    const userId = (req as any).user?.sub;
    return this.studentsService.updateCoverImage(userId, file);
  }

  @Post('cv-upload')
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload and parse CV' })
  @ApiResponse({ status: 200, description: 'CV uploaded and parsed' })
  async uploadCv(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file || !file.size) throw new BadRequestException({ code: 'CV_FILE_REQUIRED', message: 'A non-empty CV file is required' });
    const userId = (req as any).user?.sub;
    return this.studentsService.handleCvUploadWithParsing(userId, file);
  }

  @Post('cv-upload/async')
  @HttpCode(202)
  @Roles(UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Queue CV upload and analysis' })
  @ApiResponse({ status: 202, description: 'CV analysis queued' })
  async uploadCvAsync(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    if (!file || !file.size) throw new BadRequestException({ code: 'CV_FILE_REQUIRED', message: 'A non-empty CV file is required' });
    const userId = (req as any).user?.sub;
    return this.studentsService.enqueueCvAnalysis(userId, file);
  }

  @Get('recommended-jobs')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get AI-recommended jobs' })
  @ApiResponse({ status: 200, description: 'Recommended jobs' })
  async getRecommendedJobs(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user?.sub;
    return this.studentsService.getRecommendedJobs(userId, query);
  }

  @Get('skill-gaps')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get skill gap analysis' })
  @ApiResponse({ status: 200, description: 'Skill gap analysis' })
  async getSkillGaps(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user?.sub;
    return this.studentsService.getSkillGaps(userId, query);
  }

  @Get('applications')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get my applications' })
  @ApiResponse({ status: 200, description: 'List of applications' })
  async getApplications(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user?.sub;
    return this.studentsService.getApplications(userId, query);
  }

  @Get('insights')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get AI insights' })
  @ApiResponse({ status: 200, description: 'AI insights for student' })
  async getInsights(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.studentsService.getInsights(userId);
  }

  @Get('recommendation-dashboard')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get recommendation dashboard data' })
  @ApiResponse({ status: 200, description: 'Recommendation dashboard' })
  async getRecommendationDashboard(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.studentsService.getInsights(userId);
  }

  @Get('learning-paths')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get learning paths and resources' })
  @ApiResponse({ status: 200, description: 'Learning paths' })
  async getLearningPaths(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.studentsService.getLearningPaths(userId);
  }

  @Get('career-domains')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get career domain suggestions' })
  @ApiResponse({ status: 200, description: 'Career domains' })
  async getCareerDomains(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.studentsService.getCareerDomains(userId);
  }

  @Get('market-intelligence')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get market intelligence summary' })
  @ApiResponse({ status: 200, description: 'Market intelligence' })
  async getMarketIntelligence(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.studentsService.getMarketIntelligence(userId);
  }

  @Get('future-skills')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get future skill predictions' })
  @ApiResponse({ status: 200, description: 'Future skills' })
  async getFutureSkills(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.studentsService.getFutureSkills(userId);
  }

  @Post('recommendations/refresh')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Refresh recommendation engine results' })
  @ApiResponse({ status: 200, description: 'Recommendations refreshed' })
  async refreshRecommendations(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.studentsService.refreshRecommendations(userId);
  }

  @Get('notifications')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get student notifications' })
  @ApiResponse({ status: 200, description: 'Notifications list' })
  async getNotifications(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user?.sub;
    return this.studentsService.getNotifications(userId, query);
  }
}
