import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  token: string;

  @Prop({ type: String })
  refreshToken: string;

  @Prop({
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active',
  })
  status: string;

  @Prop({ type: Date })
  expiresAt: Date;

  @Prop({ type: String })
  ipAddress: string;

  @Prop({ type: String })
  userAgent: string;

  @Prop({ type: String })
  device: string;

  @Prop({ type: Date })
  lastActivity: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
