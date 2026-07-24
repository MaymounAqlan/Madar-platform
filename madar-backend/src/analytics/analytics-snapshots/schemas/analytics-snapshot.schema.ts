import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnalyticsSnapshotDocument = AnalyticsSnapshot & Document;

@Schema({ timestamps: true })
export class AnalyticsSnapshot {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['student', 'company', 'university', 'admin'],
    required: true,
  })
  userType: string;

  @Prop({ type: Object })
  metrics: Record<string, any>;

  @Prop({ type: Date })
  periodStart: Date;

  @Prop({ type: Date })
  periodEnd: Date;

  @Prop({ type: String })
  period: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const AnalyticsSnapshotSchema =
  SchemaFactory.createForClass(AnalyticsSnapshot);
