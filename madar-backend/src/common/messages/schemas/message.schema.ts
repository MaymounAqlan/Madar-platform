import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiver: Types.ObjectId;

  @Prop({ type: String, required: true })
  content: string;

  @Prop({ type: String })
  contentAr: string;

  @Prop({ type: Boolean, default: false })
  read: boolean;

  @Prop({ type: Date })
  readAt: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Message' }] })
  thread: Types.ObjectId[];

  @Prop({ type: Object })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
