import { Controller, Get, Param } from '@nestjs/common';
import { UniversitiesService } from './universities.service';

@Controller('api/public')
export class PublicUniversitiesController {
  constructor(private readonly service: UniversitiesService) {}
  @Get('universities') listUniversities() { return this.service.listPublicUniversities(); }
  @Get('universities/:id/colleges') listColleges(@Param('id') id: string) { return this.service.listPublicColleges(id); }
  @Get('colleges/:id/departments') listDepartments(@Param('id') id: string) { return this.service.listPublicDepartments(id); }
}
