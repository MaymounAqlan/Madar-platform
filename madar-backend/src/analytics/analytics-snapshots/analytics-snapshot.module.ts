import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsSnapshot, AnalyticsSnapshotSchema } from './schemas/analytics-snapshot.schema';
import { AnalyticsSnapshotService } from './analytics-snapshot.service';
import { AnalyticsSnapshotController } from './analytics-snapshot.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AnalyticsSnapshot.name, schema: AnalyticsSnapshotSchema }]),
  ],
  controllers: [AnalyticsSnapshotController],
  providers: [AnalyticsSnapshotService],
  exports: [AnalyticsSnapshotService],
})
export class AnalyticsSnapshotModule {}
