import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlatformSetting, PlatformSettingSchema } from './schemas/platform-setting.schema';
import { PlatformSettingsService } from './platform-settings.service';
import { AuditLogModule } from '../common/audit-logs/audit-log.module';
import { EmailTemplate, EmailTemplateSchema } from './schemas/email-template.schema';
import { AiConfig, AiConfigSchema } from './schemas/ai-config.schema';
import { NotificationPolicy, NotificationPolicySchema } from './schemas/notification-policy.schema';
import { NotificationDeliveryLog, NotificationDeliveryLogSchema } from './schemas/notification-delivery-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PlatformSetting.name, schema: PlatformSettingSchema },
      { name: EmailTemplate.name, schema: EmailTemplateSchema },
      { name: AiConfig.name, schema: AiConfigSchema },
      { name: NotificationPolicy.name, schema: NotificationPolicySchema },
      { name: NotificationDeliveryLog.name, schema: NotificationDeliveryLogSchema },
    ]),
    AuditLogModule,
  ],
  providers: [PlatformSettingsService],
  exports: [PlatformSettingsService, MongooseModule],
})
export class PlatformSettingsModule {}

