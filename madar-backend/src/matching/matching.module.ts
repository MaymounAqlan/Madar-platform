import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { MatchingProcessor } from './matching.processor';
import { Student, StudentSchema } from '../students/schemas/student.schema';
import { Job, JobSchema } from '../jobs/schemas/job.schema';
import { Skill, SkillSchema } from '../skills/schemas/skill.schema';
import { Application, ApplicationSchema } from '../applications/schemas/application.schema';
import { MatchResult, MatchResultSchema } from './match-results/schemas/match-result.schema';
import { Recommendation, RecommendationSchema } from './recommendations/schemas/recommendation.schema';
import { SkillGap, SkillGapSchema } from './skill-gaps/schemas/skill-gap.schema';
import { AiEmbedding, AiEmbeddingSchema } from './ai-embeddings/schemas/ai-embedding.schema';
import { AuthModule } from '../auth/auth.module';
import { PlatformSettingsModule } from '../platform-settings/platform-settings.module';
import { MarketDataModule } from '../skills/market-data/market-data.module';

import { getRedisConfig } from '../../config/redis.config';

/**
 * FR-AI-014: Async Message Queue for Real-Time Matching
 * Uses Bull + Redis for background AI processing
 */
@Module({
  imports: [
    AuthModule,
    PlatformSettingsModule,
    MarketDataModule,
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: Job.name, schema: JobSchema },
      { name: Skill.name, schema: SkillSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: MatchResult.name, schema: MatchResultSchema },
      { name: Recommendation.name, schema: RecommendationSchema },
      { name: SkillGap.name, schema: SkillGapSchema },
      { name: AiEmbedding.name, schema: AiEmbeddingSchema },
    ]),
    // FR-AI-014: Bull Queue with Redis
    BullModule.registerQueue({
      name: 'ai-matching',
      redis: getRedisConfig(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
  ],
  controllers: [MatchingController],
  providers: [MatchingService, MatchingProcessor],
  exports: [MatchingService],
})
export class MatchingModule {}
