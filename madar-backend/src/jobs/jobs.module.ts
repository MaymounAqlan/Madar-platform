import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Job, JobSchema } from './schemas/job.schema';
import { Application, ApplicationSchema } from '../applications/schemas/application.schema';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { AuthModule } from '../auth/auth.module';
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { MatchResult, MatchResultSchema } from '../matching/match-results/schemas/match-result.schema';
import { NotificationModule } from '../common/notifications/notification.module';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Student.name, schema: StudentSchema },
      { name: MatchResult.name, schema: MatchResultSchema },
    ]),
  ],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
