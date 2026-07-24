import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: true })
export class AuditLog {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  actorId: Types.ObjectId;

  @Prop({ type: String })
  actorRole?: string;

  @Prop({ type: Types.ObjectId, ref: 'University' })
  universityId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'College' })
  collegeId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  action: string;

  @Prop({ type: String, required: true })
  resource: string;

  @Prop({ type: String })
  resourceId: string;

  @Prop({ type: Object })
  details: Record<string, any>;

  @Prop({ type: Object })
  before?: Record<string, any>;

  @Prop({ type: Object })
  after?: Record<string, any>;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Date })
  timestamp: Date;

  @Prop({
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info',
  })
  severity: string;

  @Prop({ type: String })
  ipAddress: string;

  @Prop({ type: String })
  userAgent: string;

  createdAt: Date;
  updatedAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ actorId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, resource: 1, createdAt: -1 });
