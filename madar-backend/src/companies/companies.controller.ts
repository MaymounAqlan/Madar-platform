import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { mkdirSync } from 'fs';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

const companyImageUpload = {
  storage: diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, callback: (error: Error | null, destination: string) => void) => {
      const destination = './uploads/companies';
      mkdirSync(destination, { recursive: true });
      callback(null, destination);
    },
    filename: (_req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `company-${uniqueSuffix}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  fileFilter: (_req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
    if (!file.originalname.match(/\.(png|jpe?g|webp|gif)$/i)) {
      return callback(new BadRequestException('Only PNG, JPG, JPEG, WEBP, and GIF images are allowed'), false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};

@ApiTags('Companies')
@Controller('api/companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('dashboard')
  @Roles(UserRole.COMPANY, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get company dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.companiesService.getDashboard(userId);
  }

  @Get('profile')
  @Roles(UserRole.COMPANY, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get company profile' })
  @ApiResponse({ status: 200, description: 'Company profile' })
  async getProfile(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.companiesService.findByUserId(userId);
  }

  @Post('jobs')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Create a new job posting' })
  @ApiResponse({ status: 201, description: 'Job created' })
  async createJob(@Req() req: Request, @Body() dto: CreateJobDto) {
    const userId = (req as any).user?.sub;
    return this.companiesService.createJob(userId, dto);
  }

  @Post('sample-jobs')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Generate realistic sample jobs for testing' })
  @ApiResponse({ status: 201, description: 'Sample jobs generated' })
  async generateSampleJobs(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.companiesService.generateSampleJobs(userId);
  }

  @Post('upload-image')
  @Roles(UserRole.COMPANY)
  @UseInterceptors(FileInterceptor('file', companyImageUpload))
  @ApiOperation({ summary: 'Upload company logo or cover image' })
  async uploadCompanyImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return {
      url: `/uploads/companies/${file.filename}`,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Get('jobs')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'List company jobs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Company jobs' })
  async getCompanyJobs(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user?.sub;
    return this.companiesService.getCompanyJobs(userId, query);
  }

  @Put('jobs/:id')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Update a job posting' })
  @ApiResponse({ status: 200, description: 'Job updated' })
  async updateJob(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: Partial<CreateJobDto>,
  ) {
    const userId = (req as any).user?.sub;
    return this.companiesService.updateJob(userId, id, dto);
  }

  @Delete('jobs/:id')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Delete a job posting' })
  @ApiResponse({ status: 200, description: 'Job deleted' })
  async deleteJob(@Req() req: Request, @Param('id') id: string) {
    const userId = (req as any).user?.sub;
    return this.companiesService.deleteJob(userId, id);
  }

  @Get('candidates')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Search candidates' })
  @ApiQuery({ name: 'skills', required: false })
  @ApiQuery({ name: 'experience', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiResponse({ status: 200, description: 'Candidate list' })
  async searchCandidates(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user?.sub;
    return this.companiesService.searchCandidates(userId, query);
  }

  @Get('applications')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Get applications for company jobs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Applications list' })
  async getApplications(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user?.sub;
    return this.companiesService.getApplications(userId, query);
  }

  @Put('applications/:id')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Update application status' })
  @ApiResponse({ status: 200, description: 'Application status updated' })
  async updateApplicationStatus(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string; note?: string },
  ) {
    const userId = (req as any).user?.sub;
    return this.companiesService.updateApplicationStatus(userId, id, body.status, body.notes ?? body.note);
  }

  @Get('analytics')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Get recruitment analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getAnalytics(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.companiesService.getAnalytics(userId);
  }

  // FR-COMP-015: Market Reports
  @Get('market-report')
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get market skills demand report' })
  @ApiQuery({ name: 'domain', required: false })
  @ApiResponse({ status: 200, description: 'Market report data' })
  async getMarketReport(@Req() req: Request, @Query('domain') domain?: string) {
    const userId = (req as any).user?.sub;
    return this.companiesService.getMarketReport(userId, domain);
  }

  // FR-COMP-003: Profile Update
  @Put('profile')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Update company profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateProfile(@Req() req: Request, @Body() dto: UpdateCompanyProfileDto) {
    const userId = (req as any).user?.sub;
    return this.companiesService.updateProfile(userId, dto);
  }
}

@ApiTags('AI')
@Controller('api/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompanyAiController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post('extract-skills')
  @Roles(UserRole.COMPANY, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Extract skills from job description for company job posting' })
  async extractSkills(@Body() body: { description?: string; text?: string }) {
    return this.companiesService.extractSkillsFromDescription(body.description || body.text || '');
  }
}
