import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiConfigDocument = AiConfig & Document;

@Schema({ timestamps: true })
export class AiConfig {
  _id: Types.ObjectId;

  @Prop({ type: Number, required: true, unique: true })
  version: number;

  @Prop({
    type: String,
    enum: ['draft', 'pending approval', 'approved', 'active', 'archived'],
    required: true,
    default: 'draft',
  })
  status: string;

  // Matching Weights
  @Prop({ type: Number, default: 40 })
  skillsWeight: number;

  @Prop({ type: Number, default: 30 })
  experienceWeight: number;

  @Prop({ type: Number, default: 15 })
  projectsWeight: number;

  @Prop({ type: Number, default: 15 })
  interestsWeight: number; // Stored as semantic match score/interest weight

  // Thresholds
  @Prop({ type: Number, default: 70 })
  highMatchThreshold: number;

  @Prop({ type: Number, default: 30 })
  recommendationThreshold: number;

  @Prop({ type: Number, default: 0.3 })
  skillConfidence: number;

  @Prop({ type: Number, default: 0.7 })
  fuzzyMatchingThreshold: number;

  @Prop({ type: Number, default: 50 })
  skillGapSeverityThreshold: number;

  @Prop({ type: Number, default: 10 })
  numberOfRecommendations: number;

  // Process settings
  @Prop({ type: Number, default: 5000 })
  timeoutMs: number;

  @Prop({ type: Number, default: 3 })
  retryCount: number;

  @Prop({ type: Number, default: 100 })
  batchSize: number;

  @Prop({ type: Number, default: 5 })
  concurrencyLimit: number;

  @Prop({ type: [String], default: ['ar', 'en'] })
  languages: string[];

  @Prop({ type: Boolean, default: true })
  arabicNormalization: boolean;

  @Prop({ type: Object, default: {} })
  skillTaxonomy: Record<string, string[]>;

  @Prop({ type: Object, default: {} })
  curriculumMarketSettings: Record<string, any>;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export const AiConfigSchema = SchemaFactory.createForClass(AiConfig);
