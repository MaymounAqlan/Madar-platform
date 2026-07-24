import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiOperationLogDocument = AiOperationLog & Document;

@Schema({ timestamps: true })
export class AiOperationLog {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  actorId: Types.ObjectId;

  @Prop({ type: String, required: true })
  actorEmail: string;

  @Prop({ type: String, required: true })
  modelId: string;

  @Prop({ type: String, required: true })
  operationType: string; // 'reload' | 'reindex' | 'recalculate' | 'refresh-taxonomy'

  @Prop({ type: Date, required: true, default: Date.now })
  startedAt: Date;

  @Prop({ type: Date, default: null })
  endedAt?: Date | null;

  @Prop({
    type: String,
    enum: ['queued', 'running', 'completed', 'failed'],
    required: true,
  })
  status: string;

  @Prop({ type: String, default: null })
  errorMessage?: string | null;

  @Prop({ type: String, required: true })
  jobId: string;
}

export const AiOperationLogSchema = SchemaFactory.createForClass(AiOperationLog);
