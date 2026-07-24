import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../../auth/auth.module';
import { NotificationModule } from '../../common/notifications/notification.module';
import { CurriculumController } from './curriculum.controller';
import { CurriculumService } from './curriculum.service';
import { CurriculumProcessor } from './curriculum.processor';
import { AcademicRecommendation, AcademicRecommendationSchema } from './schemas/academic-recommendation.schema';
import { CurriculumAnalysis, CurriculumAnalysisSchema } from './schemas/curriculum-analysis.schema';
import { University, UniversitySchema } from '../schemas/university.schema';
import { CollegeCoordinator, CollegeCoordinatorSchema } from '../college-coordinators/schemas/college-coordinator.schema';
import { Department, DepartmentSchema } from '../departments/schemas/department.schema';
import { StudyPlan, StudyPlanSchema } from '../study-plans/schemas/study-plan.schema';
import { Course, CourseSchema } from '../courses/schemas/course.schema';
import { Skill, SkillSchema } from '../../skills/schemas/skill.schema';
import { MarketData, MarketDataSchema } from '../../skills/market-data/schemas/market-data.schema';
import { AuditLog, AuditLogSchema } from '../../common/audit-logs/schemas/audit-log.schema';
import { getRedisConfig } from '../../config/redis.config';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    BullModule.registerQueue({
      name: 'ai-matching',
      redis: getRedisConfig(),
    }),
    MongooseModule.forFeature([
    { name: AcademicRecommendation.name, schema: AcademicRecommendationSchema },
    { name: CurriculumAnalysis.name, schema: CurriculumAnalysisSchema },
    { name: University.name, schema: UniversitySchema },
    { name: CollegeCoordinator.name, schema: CollegeCoordinatorSchema },
    { name: Department.name, schema: DepartmentSchema },
    { name: StudyPlan.name, schema: StudyPlanSchema },
    { name: Course.name, schema: CourseSchema },
    { name: Skill.name, schema: SkillSchema },
    { name: MarketData.name, schema: MarketDataSchema },
    { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [CurriculumController],
  providers: [CurriculumService, CurriculumProcessor],
  exports: [CurriculumService],
})
export class CurriculumModule {}
