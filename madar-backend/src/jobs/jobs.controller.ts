import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { ApplyJobDto } from './dto/apply-job.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Jobs')
@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'List jobs (public, filterable)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'locationType', required: false, enum: ['remote', 'onsite', 'hybrid'] })
  @ApiQuery({ name: 'type', required: false, enum: ['full-time', 'part-time', 'contract', 'internship'] })
  @ApiQuery({ name: 'experienceLevel', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'companyId', required: false })
  @ApiQuery({ name: 'minSalary', required: false })
  @ApiQuery({ name: 'maxSalary', required: false })
  @ApiQuery({ name: 'skills', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiResponse({ status: 200, description: 'List of jobs' })
  async findAll(@Query() query: any) {
    return this.jobsService.findAll(query);
  }

  @Get('student/feed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all published jobs ranked for the authenticated student' })
  @ApiResponse({ status: 200, description: 'Ranked student job feed with database-driven filters' })
  async findStudentFeed(@Req() req: Request, @Query() query: any) {
    return this.jobsService.findStudentFeed((req as any).user?.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get job details' })
  @ApiResponse({ status: 200, description: 'Job details' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async findById(@Param('id') id: string) {
    return this.jobsService.findById(id);
  }

  @Post(':id/apply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply to a job (student only)' })
  @ApiResponse({ status: 201, description: 'Application submitted' })
  @ApiResponse({ status: 403, description: 'Already applied or job closed' })
  async apply(@Param('id') id: string, @Req() req: Request, @Body() dto: ApplyJobDto) {
    const studentId = (req as any).user?.sub;
    return this.jobsService.apply(id, studentId, dto);
  }

  @Get(':id/similar')
  @ApiOperation({ summary: 'Get similar jobs' })
  @ApiResponse({ status: 200, description: 'Similar jobs' })
  async getSimilarJobs(@Param('id') id: string) {
    return this.jobsService.getSimilarJobs(id);
  }
}
