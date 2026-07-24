import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchResult, MatchResultSchema } from './schemas/match-result.schema';
import { MatchResultService } from './match-result.service';
import { MatchResultController } from './match-result.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MatchResult.name, schema: MatchResultSchema }]),
  ],
  controllers: [MatchResultController],
  providers: [MatchResultService],
  exports: [MatchResultService],
})
export class MatchResultModule {}
