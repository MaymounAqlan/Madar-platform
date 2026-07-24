import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesController, CompanyAiController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company, CompanySchema } from './schemas/company.schema';
import { Job, JobSchema } from '../jobs/schemas/job.schema';
import { Application, ApplicationSchema } from '../applications/schemas/application.schema';
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { MatchResult, MatchResultSchema } from '../matching/match-results/schemas/match-result.schema';
import { SkillGap, SkillGapSchema } from '../matching/skill-gaps/schemas/skill-gap.schema';
import { Notification, NotificationSchema } from '../common/notifications/schemas/notification.schema';
import { AuditLog, AuditLogSchema } from '../common/audit-logs/schemas/audit-log.schema';
import { MarketData, MarketDataSchema } from '../skills/market-data/schemas/market-data.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AuthModule } from '../auth/auth.module';
import { MatchingModule } from '../matching/matching.module';

@Module({
  imports: [
    AuthModule,
    MatchingModule,
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Student.name, schema: StudentSchema },
      { name: MatchResult.name, schema: MatchResultSchema },
      { name: SkillGap.name, schema: SkillGapSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: MarketData.name, schema: MarketDataSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CompaniesController, CompanyAiController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
