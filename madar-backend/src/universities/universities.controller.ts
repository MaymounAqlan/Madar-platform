import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UniversitiesService } from './universities.service';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { CreateCollegeDto, UpdateCollegeDto } from './dto/college.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { UniversityStatusGuard } from './university-status.guard';
import { SkipUniversityStatus } from './university-status.decorator';
import { InstitutionalStaffGuard } from './institutional-staff.guard';
import { AffiliationReasonDto } from './student-affiliations/dto/review-affiliation.dto';

@ApiTags('Universities')
@Controller('api/universities')
@UseGuards(JwtAuthGuard, RolesGuard, UniversityStatusGuard, InstitutionalStaffGuard)
@ApiBearerAuth()
export class UniversitiesController {
  constructor(private readonly universitiesService: UniversitiesService) {}

  @Get('me/status')
  @Roles(UserRole.UNIVERSITY)
  @SkipUniversityStatus()
  @ApiOperation({ summary: 'Get the authenticated university approval status' })
  async getMyStatus(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getMyStatus(userId);
  }

  @Get('profile')
  @Roles(UserRole.UNIVERSITY)
  @ApiOperation({ summary: 'Get the authenticated university profile' })
  @ApiResponse({ status: 200, description: 'University profile' })
  async getProfile(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getProfile(userId);
  }

  @Get('benchmarking')
  @Roles(UserRole.UNIVERSITY)
  @ApiOperation({ summary: 'Get university benchmarking/comparison cards' })
  @ApiResponse({ status: 200, description: 'Benchmarking data' })
  async getBenchmarking(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getBenchmarking(userId);
  }

  @Put('profile')
  @Roles(UserRole.UNIVERSITY)
  @ApiOperation({ summary: 'Update the authenticated university profile' })
  @ApiResponse({ status: 200, description: 'University profile updated' })
  async updateProfile(@Req() req: Request, @Body() body: UpdateUniversityDto) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.updateProfile(userId, body);
  }

  @Post('profile/logo')
  @Roles(UserRole.UNIVERSITY)
  @ApiOperation({ summary: 'Upload university logo' })
  @ApiResponse({ status: 201, description: 'Logo uploaded' })
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(@Req() req: Request, @UploadedFile() file: Express.Multer.File) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.uploadLogo(userId, file);
  }

  @Get('dashboard')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get university dashboard with employment KPIs' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getDashboard(userId);
  }

  @Get('structure')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get academic structure' })
  @ApiResponse({ status: 200, description: 'Academic structure' })
  async getStructure(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getStructure(userId);
  }

  @Get('colleges')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List university colleges with departments' })
  @ApiResponse({ status: 200, description: 'Colleges list' })
  async getColleges(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.listColleges(userId, query);
  }

  @Post('colleges')
  @Roles(UserRole.UNIVERSITY)
  @ApiOperation({ summary: 'Create a college' })
  @ApiResponse({ status: 201, description: 'College created' })
  async createCollege(@Req() req: Request, @Body() body: CreateCollegeDto) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.createCollege(userId, body);
  }

  @Put('colleges/:collegeId')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update a college' })
  @ApiResponse({ status: 200, description: 'College updated' })
  async updateCollege(@Req() req: Request, @Param('collegeId') collegeId: string, @Body() body: UpdateCollegeDto) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.updateCollege(userId, collegeId, body);
  }

  @Put('colleges/:collegeId/archive')
  @Roles(UserRole.UNIVERSITY)
  @ApiOperation({ summary: 'Archive a college' })
  @ApiResponse({ status: 200, description: 'College archived' })
  async archiveCollege(@Req() req: Request, @Param('collegeId') collegeId: string) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.archiveCollege(userId, collegeId, true);
  }

  @Put('colleges/:collegeId/restore')
  @Roles(UserRole.UNIVERSITY)
  @ApiOperation({ summary: 'Restore an archived college' })
  @ApiResponse({ status: 200, description: 'College restored' })
  async restoreCollege(@Req() req: Request, @Param('collegeId') collegeId: string) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.archiveCollege(userId, collegeId, false);
  }

  @Delete('colleges/:collegeId')
  @Roles(UserRole.UNIVERSITY)
  @ApiOperation({ summary: 'Delete a college' })
  @ApiResponse({ status: 200, description: 'College deleted' })
  async deleteCollege(@Req() req: Request, @Param('collegeId') collegeId: string) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.deleteCollege(userId, collegeId);
  }

  @Get('departments')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'List university departments' })
  @ApiResponse({ status: 200, description: 'Departments list' })
  async getDepartments(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.listDepartments(userId, query);
  }

  @Post('colleges/:collegeId/departments')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Create a department inside a college' })
  @ApiResponse({ status: 201, description: 'Department created' })
  async createDepartment(@Req() req: Request, @Param('collegeId') collegeId: string, @Body() body: CreateDepartmentDto) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.createDepartment(userId, collegeId, body);
  }

  @Put('departments/:departmentId')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Update a department' })
  @ApiResponse({ status: 200, description: 'Department updated' })
  async updateDepartment(@Req() req: Request, @Param('departmentId') departmentId: string, @Body() body: UpdateDepartmentDto) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.updateDepartment(userId, departmentId, body);
  }

  @Delete('departments/:departmentId')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Delete a department' })
  @ApiResponse({ status: 200, description: 'Department deleted' })
  async deleteDepartment(@Req() req: Request, @Param('departmentId') departmentId: string) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.deleteDepartment(userId, departmentId);
  }

  @Put('departments/:departmentId/restore')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR)
  async restoreDepartment(@Req() req: Request, @Param('departmentId') departmentId: string) {
    return this.universitiesService.restoreDepartment((req as any).user?.sub, departmentId);
  }

  @Put('structure')
  @Roles(UserRole.UNIVERSITY)
  @ApiOperation({ summary: 'Update academic structure' })
  @ApiResponse({ status: 200, description: 'Structure updated' })
  async updateStructure(@Req() req: Request, @Body() body: { colleges: any[] }) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.updateStructure(userId, body.colleges);
  }

  @Get('students')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER)
  @ApiOperation({ summary: 'Get student directory' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Student directory' })
  async getStudents(@Req() req: Request, @Query() query: any) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getStudents(userId, query);
  }

  @Get('students/statistics')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER)
  @ApiOperation({ summary: 'Get university student statistics' })
  @ApiResponse({ status: 200, description: 'Student statistics' })
  async getStudentStatistics(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getStudentStatistics(userId);
  }

  @Get('students/pending-affiliations')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.DATA_OFFICER, UserRole.UNIVERSITY_VIEWER, UserRole.QUALITY_OFFICER)
  async getPendingAffiliations(@Req() req: Request, @Query() query: any) {
    return this.universitiesService.getStudents((req as any).user.sub, { ...query, affiliationStatus: 'pending' });
  }

  @Get('students/:studentId')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.DATA_OFFICER, UserRole.UNIVERSITY_VIEWER, UserRole.QUALITY_OFFICER)
  async getAffiliationStudent(@Req() req: Request, @Param('studentId') studentId: string) {
    return this.universitiesService.getAffiliationStudent((req as any).user.sub, studentId);
  }

  @Patch('students/:studentId/verify-affiliation')
  @Roles(UserRole.UNIVERSITY, UserRole.DATA_OFFICER, UserRole.COORDINATOR)
  async verifyAffiliation(@Req() req: Request, @Param('studentId') studentId: string) { return this.universitiesService.reviewAffiliation((req as any).user.sub, studentId, 'verified'); }

  @Patch('students/:studentId/reject-affiliation')
  @Roles(UserRole.UNIVERSITY, UserRole.DATA_OFFICER, UserRole.COORDINATOR)
  async rejectAffiliation(@Req() req: Request, @Param('studentId') studentId: string, @Body() dto: AffiliationReasonDto) { return this.universitiesService.reviewAffiliation((req as any).user.sub, studentId, 'rejected', dto.reason); }

  @Patch('students/:studentId/suspend-affiliation')
  @Roles(UserRole.UNIVERSITY, UserRole.DATA_OFFICER, UserRole.COORDINATOR)
  async suspendAffiliation(@Req() req: Request, @Param('studentId') studentId: string, @Body() dto: AffiliationReasonDto) { return this.universitiesService.reviewAffiliation((req as any).user.sub, studentId, 'suspended', dto.reason); }

  @Patch('students/:studentId/mark-graduated')
  @Roles(UserRole.UNIVERSITY, UserRole.DATA_OFFICER, UserRole.COORDINATOR)
  async markGraduated(@Req() req: Request, @Param('studentId') studentId: string) { return this.universitiesService.reviewAffiliation((req as any).user.sub, studentId, 'graduated'); }

  @Post('students/reconcile-affiliations')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Explicitly reconcile legacy student academic affiliations' })
  @ApiResponse({ status: 200, description: 'Student affiliations reconciled' })
  async reconcileStudentAffiliations(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.reconcileStudentAffiliations(userId);
  }

  @Get('analytics')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get university analytics data' })
  @ApiResponse({ status: 200, description: 'Analytics data' })
  async getAnalytics(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getAnalytics(userId);
  }

  // FR-UNI-013: College Comparison
  @Get('college-comparison')
  @Roles(UserRole.UNIVERSITY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Compare colleges by employment, readiness, skill gaps' })
  @ApiResponse({ status: 200, description: 'College comparison data' })
  async getCollegeComparison(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getCollegeComparison(userId);
  }

  // FR-UNI-014: Department Comparison
  @Get('department-comparison')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Compare departments by skills, employment, market alignment' })
  @ApiResponse({ status: 200, description: 'Department comparison data' })
  async getDepartmentComparison(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getDepartmentComparison(userId);
  }

  // FR-UNI-012: Cross-University Comparison
  @Get('cross-university-comparison')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Compare all universities by employment, readiness, alignment' })
  @ApiResponse({ status: 200, description: 'Cross-university comparison' })
  async getCrossUniversityComparison() {
    return this.universitiesService.getCrossUniversityComparison();
  }

  // FR-UNI-015: Market Trends
  @Get('market-trends')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get job market trends linked to academic specializations' })
  @ApiResponse({ status: 200, description: 'Market trends data' })
  async getMarketTrends(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getMarketTrends(userId);
  }

  // FR-UNI-016/017: Curriculum Suggestions + Future Skills
  @Get('curriculum-suggestions')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ACADEMIC_DEVELOPMENT_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get curriculum update suggestions based on market gap analysis' })
  @ApiResponse({ status: 200, description: 'Curriculum suggestions' })
  async getCurriculumSuggestions(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getCurriculumSuggestions(userId);
  }

  // FR-UNI-011: Low Employment Analysis
  @Get('low-employment-analysis')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Analyze reasons for low employment by department' })
  @ApiResponse({ status: 200, description: 'Low employment analysis' })
  async getLowEmploymentAnalysis(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getLowEmploymentAnalysis(userId);
  }

  // FR-UNI-019: KPI Dashboard
  @Get('kpi-dashboard')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get KPI dashboard per college and department' })
  @ApiResponse({ status: 200, description: 'KPI dashboard data' })
  async getKpiDashboard(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getKpiDashboard(userId);
  }

  // FR-UNI-020/021/022: Career Domains + Linked Jobs + Demanded Skills
  @Get('career-domains')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get career domains, linked jobs, and demanded skills per department' })
  @ApiResponse({ status: 200, description: 'Career domains data' })
  async getCareerDomains(@Req() req: Request) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.getCareerDomains(userId);
  }

  // FR-UNI-018: Report Generation
  @Get('reports/:type')
  @Roles(UserRole.UNIVERSITY, UserRole.COORDINATOR, UserRole.UNIVERSITY_VIEWER, UserRole.DATA_OFFICER, UserRole.QUALITY_OFFICER, UserRole.ACADEMIC_DEVELOPMENT_OFFICER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Generate and export reports (academic, employment, skills, college, department)' })
  @ApiResponse({ status: 200, description: 'Report data' })
  async generateReport(@Req() req: Request, @Param('type') type: string, @Query('format') format = 'json', @Res({ passthrough: true }) res: Response) {
    const userId = (req as any).user?.sub;
    const report = await this.universitiesService.generateReport(userId, type, format);
    if (report?.content && report?.contentType) {
      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
      res.send(report.content);
      return;
    }
    return report;
  }

  // FR-UNI-023: Manage Permissions
  @Put('permissions')
  @Roles(UserRole.UNIVERSITY)
  @ApiOperation({ summary: 'Manage permissions for quality officers and academic staff' })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  async managePermissions(
    @Req() req: Request,
    @Body() body: { targetUserId: string; permissions: string[] },
  ) {
    const userId = (req as any).user?.sub;
    return this.universitiesService.managePermissions(userId, body.targetUserId, body.permissions);
  }

}
