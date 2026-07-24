import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SkillGap, SkillGapSchema } from './schemas/skill-gap.schema';
import { SkillGapService } from './skill-gap.service';
import { SkillGapController } from './skill-gap.controller';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: SkillGap.name, schema: SkillGapSchema }]),
  ],
  controllers: [SkillGapController],
  providers: [SkillGapService],
  exports: [SkillGapService],
})
export class SkillGapModule {}
