import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, SchemaTypes } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  _id: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: [
      'match',
      'application_update',
      'message',
      'system',
      'reminder',
      'alert',
    ],
    required: true,
  })
  type: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  titleAr: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String })
  messageAr: string;

  @Prop({ type: Boolean, default: false })
  read: boolean;

  @Prop({ type: Object })
  data: Record<string, any>;

  @Prop({ type: Date })
  expiresAt: Date;

  @Prop({ type: String })
  actionUrl: string;

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
