import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiModelDocument = AiModel & Document;

@Schema({ _id: false })
export class AiModelSettings {
  @Prop({ type: Number })
  matchThreshold?: number;

  @Prop({ type: String })
  embeddingModel?: string;

  @Prop({ type: Number })
  confidenceThreshold?: number;

  @Prop({ type: Number })
  batchSize?: number;

  @Prop({ type: Number })
  timeoutMs?: number;
}

@Schema({ timestamps: true })
export class AiModel {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  modelId: string; // e.g., 'embedding-model', 'cv-parser', 'skill-extractor', 'job-student-matcher', 'curriculum-gap-analyzer'

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  nameAr: string;

  @Prop({ type: String, required: true })
  type: string; // e.g., 'embeddings', 'NLP', 'matching', 'prediction'

  @Prop({
    type: String,
    enum: ['active', 'offline', 'degraded'],
    default: 'active',
  })
  availabilityStatus: string;

  @Prop({
    type: String,
    enum: ['idle', 'queued', 'running', 'completed', 'failed'],
    default: 'idle',
  })
  lastOperationStatus: string;

  @Prop({ type: String, required: true, default: '1.0.0' })
  version: string;

  @Prop({ type: Number, default: null })
  accuracy: number | null;

  @Prop({ type: Number, default: 0 })
  uses: number;

  @Prop({ type: [String], default: [] })
  supportedActions: string[]; // e.g., ['reload', 'reindex', 'recalculate', 'refresh-taxonomy']

  @Prop({ type: Date, default: null })
  lastTrainedAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastReloadedAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastIndexedAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastOperationAt?: Date | null;

  @Prop({ type: AiModelSettings, default: {} })
  settings: AiModelSettings;

  @Prop({ type: String, default: null })
  jobId?: string | null;

  @Prop({ type: Number, default: null })
  progress?: number | null;

  @Prop({ type: String, default: null })
  errorMessage?: string | null;
}

export const AiModelSchema = SchemaFactory.createForClass(AiModel);
