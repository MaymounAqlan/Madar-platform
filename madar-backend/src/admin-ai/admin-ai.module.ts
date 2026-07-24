import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { AdminAiController } from './admin-ai.controller';
import { AdminAiService } from './admin-ai.service';
import { AdminAiProcessor } from './admin-ai.processor';
import { AiModel, AiModelSchema } from './schemas/ai-model.schema';
import { AiOperationLog, AiOperationLogSchema } from './schemas/ai-operation-log.schema';
import { AuditLog, AuditLogSchema } from '../common/audit-logs/schemas/audit-log.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Role, RoleSchema } from '../users/roles/schemas/role.schema';
import { MatchingModule } from '../matching/matching.module';
import { AuthModule } from '../auth/auth.module';
import { getRedisConfig } from '../config/redis.config';

@Module({
  imports: [
    AuthModule,
    MatchingModule,
    MongooseModule.forFeature([
      { name: AiModel.name, schema: AiModelSchema },
      { name: AiOperationLog.name, schema: AiOperationLogSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    BullModule.registerQueue({
      name: 'admin-ai-ops',
      redis: getRedisConfig(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
  ],
  controllers: [AdminAiController],
  providers: [AdminAiService, AdminAiProcessor],
  exports: [AdminAiService],
})
export class AdminAiModule {}
