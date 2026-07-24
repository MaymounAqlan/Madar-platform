import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StudyPlanService } from './study-plan.service';
import { PdfImportService } from './pdf-import.service';
import { JwtAuthGuard } from '../../auth/auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { CreateStudyPlanDto, ReviewStudyPlanDto, UpdateStudyPlanDto } from './dto/study-plan.dto';
import { ConfirmImportDto, UploadPdfQueryDto } from './dto/study-plan-import.dto';

@Controller(['api/universities/study-plans', 'studyplans'])
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudyPlanController {
  constructor(
    private readonly service: StudyPlanService,
    private readonly pdfImportService: PdfImportService,
  ) {}
  @Get() @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER) findAll(@Req() req: any, @Query() query: any) { return this.service.findAll(req.user.sub, query); }
  @Post() @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR) create(@Req() req: any, @Body() dto: CreateStudyPlanDto) { return this.service.create(req.user.sub, dto); }
  @Patch(':id') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR) update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateStudyPlanDto) { return this.service.update(req.user.sub, id, dto); }
  @Post(':id/new-version') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR) newVersion(@Req() req: any, @Param('id') id: string) { return this.service.createNewVersion(req.user.sub, id); }
  @Post(':id/submit') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR) submit(@Req() req: any, @Param('id') id: string) { return this.service.submit(req.user.sub, id); }
  @Patch(':id/review') @Roles(UserRole.UNIVERSITY) review(@Req() req: any, @Param('id') id: string, @Body() dto: ReviewStudyPlanDto) { return this.service.review(req.user.sub, id, dto); }
  @Post(':id/activate') @Roles(UserRole.UNIVERSITY) activate(@Req() req: any, @Param('id') id: string) { return this.service.activate(req.user.sub, id); }
  @Delete(':id') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR) archive(@Req() req: any, @Param('id') id: string) { return this.service.archive(req.user.sub, id); }

  @Post('import-pdf') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  importPdf(@Req() req: any, @Query() query: UploadPdfQueryDto, @UploadedFile() file: Express.Multer.File) {
    return this.pdfImportService.uploadAndParse(req.user.sub, query.departmentId, file);
  }

  @Get('imports/:jobId') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR)
  getImportJob(@Req() req: any, @Param('jobId') jobId: string) {
    return this.pdfImportService.getImportJob(req.user.sub, jobId);
  }

  @Post('imports/:jobId/confirm') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR)
  confirmImport(@Req() req: any, @Param('jobId') jobId: string, @Body() dto: ConfirmImportDto) {
    return this.pdfImportService.confirmImport(req.user.sub, jobId, dto);
  }

  @Delete('imports/:jobId') @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR)
  cancelImport(@Req() req: any, @Param('jobId') jobId: string) {
    return this.pdfImportService.cancelImport(req.user.sub, jobId);
  }
}
