import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CourseService } from './course.service';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateCourseDto, MapCourseSkillDto, UpdateCourseDto } from './dto/course.dto';

@Controller(['api/universities/courses', 'courses'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseController {
  constructor(private readonly service: CourseService) {}
  @Get() @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER) find(@Req() req: any, @Query() query: any) { return this.service.findAll(req.user.sub, query); }
  @Post() @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR) create(@Req() req: any, @Body() dto: CreateCourseDto) { return this.service.create(req.user.sub, dto); }
  @Patch(':id') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR) update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCourseDto) { return this.service.update(req.user.sub, id, dto); }
  @Post(':id/skills') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR) mapSkill(@Req() req: any, @Param('id') id: string, @Body() dto: MapCourseSkillDto) { return this.service.mapSkill(req.user.sub, id, dto); }
  @Delete(':id/skills/:skillId') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR) unmapSkill(@Req() req: any, @Param('id') id: string, @Param('skillId') skillId: string) { return this.service.unmapSkill(req.user.sub, id, skillId); }
  @Delete(':id') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR) archive(@Req() req: any, @Param('id') id: string) { return this.service.setArchived(req.user.sub, id, true); }
  @Post(':id/restore') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR) restore(@Req() req: any, @Param('id') id: string) { return this.service.setArchived(req.user.sub, id, false); }
}
