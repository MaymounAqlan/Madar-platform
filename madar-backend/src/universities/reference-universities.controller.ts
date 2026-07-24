import { Controller, Get, Param, Query } from '@nestjs/common';
import { UniversityDirectoryService } from './university-directory.service';

@Controller('api/reference')
export class ReferenceUniversitiesController {
  constructor(private readonly directory: UniversityDirectoryService) {}

  @Get('universities')
  listUniversities(@Query() query: Record<string, string>) {
    return this.directory.listUniversities(query);
  }

  @Get('universities/:universityId')
  getUniversity(@Param('universityId') universityId: string) {
    return this.directory.getUniversity(universityId);
  }

  @Get('universities/:universityId/colleges')
  listColleges(@Param('universityId') universityId: string, @Query() query: Record<string, string>) {
    return this.directory.listColleges(universityId, query);
  }

  @Get('colleges/:collegeId/departments')
  listDepartments(@Param('collegeId') collegeId: string, @Query() query: Record<string, string>) {
    return this.directory.listDepartments(collegeId, query);
  }

  @Get('departments/:departmentId/majors')
  listMajors(@Param('departmentId') departmentId: string, @Query() query: Record<string, string>) {
    return this.directory.listMajors(departmentId, query);
  }
}
