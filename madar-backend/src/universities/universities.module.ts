import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UniversitiesController } from './universities.controller';
import { UniversitiesService } from './universities.service';
import { University, UniversitySchema } from './schemas/university.schema';
import { College, CollegeSchema } from './colleges/schemas/college.schema';
import { Department, DepartmentSchema } from './departments/schemas/department.schema';
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { Job, JobSchema } from '../jobs/schemas/job.schema';
import { Application, ApplicationSchema } from '../applications/schemas/application.schema';
import { MatchResult, MatchResultSchema } from '../matching/match-results/schemas/match-result.schema';
import { SkillGap, SkillGapSchema } from '../matching/skill-gaps/schemas/skill-gap.schema';
import { MarketData, MarketDataSchema } from '../skills/market-data/schemas/market-data.schema';
import { AuditLog, AuditLogSchema } from '../common/audit-logs/schemas/audit-log.schema';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UniversityStatusGuard } from './university-status.guard';
import { InstitutionalStaffGuard } from './institutional-staff.guard';
import { PublicUniversitiesController } from './public-universities.controller';
import { StudentAffiliation, StudentAffiliationSchema } from './student-affiliations/schemas/student-affiliation.schema';
import { NotificationModule } from '../common/notifications/notification.module';
import { CollegeCoordinator, CollegeCoordinatorSchema } from './college-coordinators/schemas/college-coordinator.schema';
import { CollegeCoordinatorController } from './college-coordinators/college-coordinator.controller';
import { CollegeCoordinatorService } from './college-coordinators/college-coordinator.service';
import { CurriculumAnalysis, CurriculumAnalysisSchema } from './curriculum/schemas/curriculum-analysis.schema';
import { AcademicProgram, AcademicProgramSchema } from './academic-programs/schemas/academic-program.schema';
import { UniversityDirectoryService } from './university-directory.service';
import { ReferenceUniversitiesController } from './reference-universities.controller';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    MongooseModule.forFeature([
      { name: University.name, schema: UniversitySchema },
      { name: College.name, schema: CollegeSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: Student.name, schema: StudentSchema },
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: MatchResult.name, schema: MatchResultSchema },
      { name: SkillGap.name, schema: SkillGapSchema },
      { name: MarketData.name, schema: MarketDataSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: User.name, schema: UserSchema },
      { name: CollegeCoordinator.name, schema: CollegeCoordinatorSchema },
      { name: StudentAffiliation.name, schema: StudentAffiliationSchema },
      { name: CurriculumAnalysis.name, schema: CurriculumAnalysisSchema },
      { name: AcademicProgram.name, schema: AcademicProgramSchema },
    ]),
  ],
  controllers: [UniversitiesController, PublicUniversitiesController, ReferenceUniversitiesController, CollegeCoordinatorController],
  providers: [UniversitiesService, UniversityDirectoryService, UniversityStatusGuard, InstitutionalStaffGuard, CollegeCoordinatorService],
  exports: [UniversitiesService, UniversityDirectoryService, UniversityStatusGuard, InstitutionalStaffGuard, CollegeCoordinatorService],
})
export class UniversitiesModule {}
