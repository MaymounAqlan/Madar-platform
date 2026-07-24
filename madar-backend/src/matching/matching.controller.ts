import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Request } from 'express';

@ApiTags('Matching')
@Controller('api/matching')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  @Get('job/:jobId/student/:studentId')
  @Roles(UserRole.STUDENT, UserRole.COMPANY, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Calculate match score between job and student' })
  @ApiResponse({ status: 200, description: 'Match score calculation' })
  async calculateMatch(
    @Param('jobId') jobId: string,
    @Param('studentId') studentId: string,
    @Req() req: Request,
  ): Promise<any> {
    const user = (req as any).user;
    const scopedStudentId = user.role === UserRole.STUDENT ? user.sub : studentId;
    return this.matchingService.calculateMatchScore(jobId, scopedStudentId);
  }

  @Get('top-jobs/:studentId')
  @Roles(UserRole.STUDENT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiQuery({ name: 'limit', required: false })
  @ApiOperation({ summary: 'Get top matched jobs for a student' })
  @ApiResponse({ status: 200, description: 'Top matched jobs' })
  async getTopJobs(
    @Param('studentId') studentId: string,
    @Query('limit') limit: number,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    return this.matchingService.getTopMatchedJobs(user.role === UserRole.STUDENT ? user.sub : studentId, limit || 10);
  }

  @Post('tasks/recommendations')
  @Roles(UserRole.STUDENT)
  async enqueueMyRecommendations(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    const studentId = await this.matchingService.getStudentDocumentId(userId);
    return this.matchingService.enqueueRecommendationGeneration(studentId, userId);
  }

  @Get('tasks/:taskId')
  @Roles(UserRole.STUDENT, UserRole.COMPANY, UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getTask(@Param('taskId') taskId: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.matchingService.getTaskStatus(taskId, user.sub, user.role);
  }

  @Post('tasks/:taskId/retry')
  @Roles(UserRole.STUDENT, UserRole.COMPANY, UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async retryTask(@Param('taskId') taskId: string, @Req() req: Request) {
    const user = (req as any).user;
    return this.matchingService.retryTask(taskId, user.sub, user.role);
  }

  @Get('top-candidates/:jobId')
  @Roles(UserRole.COMPANY, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiQuery({ name: 'limit', required: false })
  @ApiOperation({ summary: 'Get top matched candidates for a job' })
  @ApiResponse({ status: 200, description: 'Top matched candidates' })
  async getTopCandidates(
    @Param('jobId') jobId: string,
    @Query('limit') limit: number,
  ) {
    return this.matchingService.getTopMatchedCandidates(jobId, limit || 10);
  }
}
