import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CurriculumService } from './curriculum.service';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateAcademicRecommendationDto, ReviewAcademicRecommendationDto, UpdateAcademicRecommendationDto } from './dto/curriculum.dto';

@Controller('api/universities/curriculum')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CurriculumController {
  constructor(private readonly service: CurriculumService) {}

  @Get('analysis/:departmentId')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ACADEMIC_DEVELOPMENT_OFFICER)
  analyze(@Req() req: any, @Param('departmentId') departmentId: string, @Query('refresh') refresh?: string) {
    return this.service.getAnalysis(req.user.sub, departmentId, refresh === 'true');
  }

  @Post('analysis/:departmentId/tasks')
  @HttpCode(202)
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.ACADEMIC_DEVELOPMENT_OFFICER)
  enqueueAnalysis(@Req() req: any, @Param('departmentId') departmentId: string) {
    return this.service.enqueueAnalysis(req.user.sub, departmentId);
  }

  @Get('recommendations')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ACADEMIC_DEVELOPMENT_OFFICER)
  list(@Req() req: any, @Query() query: any) { return this.service.list(req.user.sub, query); }

  @Post('recommendations')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.ACADEMIC_DEVELOPMENT_OFFICER)
  create(@Req() req: any, @Body() dto: CreateAcademicRecommendationDto) { return this.service.create(req.user.sub, dto); }

  @Patch('recommendations/:id')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.ACADEMIC_DEVELOPMENT_OFFICER)
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAcademicRecommendationDto) { return this.service.update(req.user.sub, id, dto); }

  @Post('recommendations/:id/submit')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.ACADEMIC_DEVELOPMENT_OFFICER)
  submit(@Req() req: any, @Param('id') id: string) { return this.service.submit(req.user.sub, id); }

  @Patch('recommendations/:id/review')
  @Roles(UserRole.UNIVERSITY)
  review(@Req() req: any, @Param('id') id: string, @Body() dto: ReviewAcademicRecommendationDto) { return this.service.review(req.user.sub, id, dto); }
}
