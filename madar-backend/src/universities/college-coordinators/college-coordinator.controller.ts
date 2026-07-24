import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CollegeCoordinatorService } from './college-coordinator.service';
import { InviteUniversityStaffDto, UpdateUniversityStaffDto, UpdateUniversityStaffStatusDto, UpdateMyStaffProfileDto } from './dto/staff.dto';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { UniversityStatusGuard } from '../university-status.guard';
import { SkipUniversityStatus } from '../university-status.decorator';

@Controller('api/universities/staff')
@UseGuards(JwtAuthGuard, RolesGuard, UniversityStatusGuard)
@Roles(UserRole.UNIVERSITY)
export class CollegeCoordinatorController {
  constructor(private readonly service: CollegeCoordinatorService) {}

  @Get('me/access')
  @SkipUniversityStatus()
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ACADEMIC_DEVELOPMENT_OFFICER)
  myAccess(@Req() req: Request) { return this.service.getMyAccess((req as any).user.sub); }

  @Get('me/profile')
  @SkipUniversityStatus()
  @Roles(UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ACADEMIC_DEVELOPMENT_OFFICER)
  myProfile(@Req() req: Request) { return this.service.getMyProfile((req as any).user.sub); }

  @Put('me/profile')
  @SkipUniversityStatus()
  @Roles(UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ACADEMIC_DEVELOPMENT_OFFICER)
  updateMyProfile(@Req() req: Request, @Body() dto: UpdateMyStaffProfileDto) { return this.service.updateMyProfile((req as any).user.sub, dto); }

  @Get() list(@Req() req: Request, @Query() query: any) { return this.service.list((req as any).user.sub, query); }
  @Post('invite') invite(@Req() req: Request, @Body() dto: InviteUniversityStaffDto) { return this.service.invite((req as any).user.sub, dto); }
  @Patch(':id') update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateUniversityStaffDto) { return this.service.updateStaff((req as any).user.sub, id, dto); }
  @Patch(':id/status') status(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateUniversityStaffStatusDto) { return this.service.setStatus((req as any).user.sub, id, dto.status); }
  @Post(':id/resend-invitation') resend(@Req() req: Request, @Param('id') id: string) { return this.service.resend((req as any).user.sub, id); }
  @Delete(':id/invitation') cancel(@Req() req: Request, @Param('id') id: string) { return this.service.cancelInvitation((req as any).user.sub, id); }
}
