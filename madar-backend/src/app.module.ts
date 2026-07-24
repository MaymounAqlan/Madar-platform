import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import databaseConfig from './config/database.config';
import { HealthController } from './common/controllers/health.controller';

// Existing modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { CompaniesModule } from './companies/companies.module';
import { UniversitiesModule } from './universities/universities.module';
import { JobsModule } from './jobs/jobs.module';
import { ApplicationsModule } from './applications/applications.module';
import { SkillsModule } from './skills/skills.module';
import { MatchingModule } from './matching/matching.module';

// New schema modules
import { RoleModule } from './users/roles/role.module';
import { PermissionModule } from './users/permissions/permission.module';
import { CollegeModule } from './universities/colleges/college.module';
import { DepartmentModule } from './universities/departments/department.module';
import { StudyPlanModule } from './universities/study-plans/study-plan.module';
import { CourseModule } from './universities/courses/course.module';
import { CollegeCoordinatorModule } from './universities/college-coordinators/college-coordinator.module';
import { MatchResultModule } from './matching/match-results/match-result.module';
import { SkillGapModule } from './matching/skill-gaps/skill-gap.module';
import { RecommendationModule } from './matching/recommendations/recommendation.module';
import { AiEmbeddingModule } from './matching/ai-embeddings/ai-embedding.module';
import { NotificationModule } from './common/notifications/notification.module';
import { AuditLogModule } from './common/audit-logs/audit-log.module';
import { MessageModule } from './common/messages/message.module';
import { MarketDataModule } from './skills/market-data/market-data.module';
import { TrainingCourseModule } from './skills/training-courses/training-course.module';
import { SessionModule } from './auth/sessions/session.module';
import { AnalyticsSnapshotModule } from './analytics/analytics-snapshots/analytics-snapshot.module';
import { CurriculumModule } from './universities/curriculum/curriculum.module';
import { AdminAiModule } from './admin-ai/admin-ai.module';
import { SupportModule } from './support/support.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
      cache: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        autoIndex: configService.get<boolean>('database.autoIndex'),
        maxPoolSize: configService.get<number>('database.maxPoolSize'),
        serverSelectionTimeoutMS: configService.get<number>('database.serverSelectionTimeoutMS'),
        socketTimeoutMS: configService.get<number>('database.socketTimeoutMS'),
        family: configService.get<number>('database.family'),
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'madar-jwt-secret-change-in-production',
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY') || '15m',
        },
      }),
    }),
    // Existing modules
    AuthModule,
    UsersModule,
    StudentsModule,
    CompaniesModule,
    UniversitiesModule,
    JobsModule,
    ApplicationsModule,
    SkillsModule,
    MatchingModule,
    // New schema modules
    RoleModule,
    PermissionModule,
    CollegeModule,
    DepartmentModule,
    StudyPlanModule,
    CourseModule,
    CollegeCoordinatorModule,
    MatchResultModule,
    SkillGapModule,
    RecommendationModule,
    AiEmbeddingModule,
    NotificationModule,
    AuditLogModule,
    MessageModule,
    MarketDataModule,
    TrainingCourseModule,
    SessionModule,
    AnalyticsSnapshotModule,
    CurriculumModule,
    AdminAiModule,
    SupportModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
