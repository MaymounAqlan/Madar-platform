import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDeliveryLogDocument = NotificationDeliveryLog & Document;

@Schema({ timestamps: true })
export class NotificationDeliveryLog {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  recipientId: Types.ObjectId;

  @Prop({ type: String, required: true })
  recipientEmail: string;

  @Prop({ type: String })
  recipientPhone: string;

  @Prop({ type: String, required: true })
  category: string;

  @Prop({ type: String, required: true })
  channel: string; // 'email', 'sms', 'in-app', 'system-alert'

  @Prop({ type: String, required: true })
  subject: string;

  @Prop({ type: String, required: true })
  body: string;

  @Prop({
    type: String,
    enum: ['queued', 'sent', 'provider_accepted', 'delivered', 'failed', 'retrying', 'expired'],
    default: 'queued',
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  retryCount: number;

  @Prop({ type: String })
  errorDetails: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  sentAt: Date;

  @Prop({ type: Date })
  deliveredAt: Date;

  @Prop({ type: Date })
  expiresAt: Date;
}

export const NotificationDeliveryLogSchema = SchemaFactory.createForClass(NotificationDeliveryLog);
