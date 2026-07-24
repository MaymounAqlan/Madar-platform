import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Student, StudentSchema } from './schemas/student.schema';
import { Job, JobSchema } from '../jobs/schemas/job.schema';
import { Application, ApplicationSchema } from '../applications/schemas/application.schema';
import { MatchResult, MatchResultSchema } from '../matching/match-results/schemas/match-result.schema';
import { Company, CompanySchema } from '../companies/schemas/company.schema';
import { SkillGap, SkillGapSchema } from '../matching/skill-gaps/schemas/skill-gap.schema';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Skill, SkillSchema } from '../skills/schemas/skill.schema';
import { Notification, NotificationSchema } from '../common/notifications/schemas/notification.schema';
import { BullModule } from '@nestjs/bull';
import { StudentsAiProcessor } from './students-ai.processor';
import { AiEmbedding, AiEmbeddingSchema } from '../matching/ai-embeddings/schemas/ai-embedding.schema';
import { University, UniversitySchema } from '../universities/schemas/university.schema';
import { College, CollegeSchema } from '../universities/colleges/schemas/college.schema';
import { Department, DepartmentSchema } from '../universities/departments/schemas/department.schema';
import { AcademicProgram, AcademicProgramSchema } from '../universities/academic-programs/schemas/academic-program.schema';
import { getRedisConfig } from '../config/redis.config';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({
      name: 'ai-matching',
      redis: getRedisConfig(),
    }),
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: MatchResult.name, schema: MatchResultSchema },
      { name: Company.name, schema: CompanySchema },
      { name: SkillGap.name, schema: SkillGapSchema },
      { name: User.name, schema: UserSchema },
      { name: Skill.name, schema: SkillSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: AiEmbedding.name, schema: AiEmbeddingSchema },
      { name: University.name, schema: UniversitySchema },
      { name: College.name, schema: CollegeSchema },
      { name: Department.name, schema: DepartmentSchema },
      { name: AcademicProgram.name, schema: AcademicProgramSchema },
    ]),
  ],
  controllers: [StudentsController],
  providers: [StudentsService, StudentsAiProcessor],
  exports: [StudentsService],
})
export class StudentsModule {}
