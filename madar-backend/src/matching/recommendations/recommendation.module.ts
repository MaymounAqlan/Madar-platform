import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Recommendation, RecommendationSchema } from './schemas/recommendation.schema';
import { RecommendationService } from './recommendation.service';
import { RecommendationController } from './recommendation.controller';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Recommendation.name, schema: RecommendationSchema }]),
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
