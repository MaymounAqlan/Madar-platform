import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AdminService } from './admin.service';
import { AdminOperationsService } from './admin-operations.service';
import { User, UserSchema } from './schemas/user.schema';
import { Role, RoleSchema } from './roles/schemas/role.schema';
import { Permission, PermissionSchema } from './permissions/schemas/permission.schema';
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { University, UniversitySchema } from '../universities/schemas/university.schema';
import { CollegeCoordinator, CollegeCoordinatorSchema } from '../universities/college-coordinators/schemas/college-coordinator.schema';
import { Job, JobSchema } from '../jobs/schemas/job.schema';
import { Application, ApplicationSchema } from '../applications/schemas/application.schema';
import { MatchResult, MatchResultSchema } from '../matching/match-results/schemas/match-result.schema';
import { AuditLog, AuditLogSchema } from '../common/audit-logs/schemas/audit-log.schema';
import { MarketData, MarketDataSchema } from '../skills/market-data/schemas/market-data.schema';
import { SkillGap, SkillGapSchema } from '../matching/skill-gaps/schemas/skill-gap.schema';
import { Recommendation, RecommendationSchema } from '../matching/recommendations/schemas/recommendation.schema';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../common/notifications/notification.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { MatchingModule } from '../matching/matching.module';
import { AdminAiModule } from '../admin-ai/admin-ai.module';
import { College, CollegeSchema } from '../universities/colleges/schemas/college.schema';
import { Department, DepartmentSchema } from '../universities/departments/schemas/department.schema';
import { AcademicProgram, AcademicProgramSchema } from '../universities/academic-programs/schemas/academic-program.schema';
import { UniversitiesModule } from '../universities/universities.module';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    PlatformSettingsModule,
    MatchingModule,
    AdminAiModule,
    UniversitiesModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: Student.name, schema: StudentSchema },
      { name: Company.name, schema: CompanySchema },
      { name: University.name, schema: UniversitySchema },
      { name: College.name, schema: CollegeSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: AcademicProgram.name, schema: AcademicProgramSchema },
      { name: CollegeCoordinator.name, schema: CollegeCoordinatorSchema },
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: MatchResult.name, schema: MatchResultSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: MarketData.name, schema: MarketDataSchema },
      { name: SkillGap.name, schema: SkillGapSchema },
      { name: Recommendation.name, schema: RecommendationSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, AdminService, AdminOperationsService],
  exports: [UsersService, AdminService, AdminOperationsService, MongooseModule],
})
export class UsersModule {}
