import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationPolicyDocument = NotificationPolicy & Document;

@Schema({ timestamps: true })
export class NotificationPolicy {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  category: string;

  @Prop({ type: String, required: true })
  nameAr: string;

  @Prop({ type: String, required: true })
  nameEn: string;

  @Prop({ type: [String], default: ['in-app'] })
  channels: string[];

  @Prop({ type: [String], default: [] })
  targetRoles: string[];

  @Prop({ type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' })
  priority: string;

  @Prop({ type: Boolean, default: true })
  useQueue: boolean;

  @Prop({ type: Number, default: 3 })
  maxRetryCount: number;

  @Prop({ type: Number, default: 86400 })
  expirySeconds: number;

  @Prop({ type: Object, default: { enabled: false, start: '22:00', end: '08:00' } })
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };

  @Prop({ type: String })
  actionUrl: string;

  @Prop({ type: String })
  templateKey: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const NotificationPolicySchema = SchemaFactory.createForClass(NotificationPolicy);
