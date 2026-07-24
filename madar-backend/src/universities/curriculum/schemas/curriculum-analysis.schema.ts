import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CurriculumAnalysisDocument = CurriculumAnalysis & Document;

@Schema({ timestamps: true })
export class CurriculumAnalysis {
  _id: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'University', required: true }) universityId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'College', required: true }) collegeId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Department', required: true, unique: true }) departmentId: Types.ObjectId;
  @Prop({ type: Number, default: null }) alignmentPercentage: number | null;
  @Prop({ type: [Object], default: [] }) coveredSkills: Record<string, unknown>[];
  @Prop({ type: [Object], default: [] }) partiallyCoveredSkills: Record<string, unknown>[];
  @Prop({ type: [Object], default: [] }) missingSkills: Record<string, unknown>[];
  @Prop({ type: [Object], default: [] }) emergingSkills: Record<string, unknown>[];
  @Prop({ type: [Object], default: [] }) actionableRecommendations: Record<string, unknown>[];
  @Prop({ type: String, required: true }) source: string;
  @Prop({ type: Date, required: true }) analyzedAt: Date;
  @Prop({ type: String, default: 'manual' }) trigger: string;
  @Prop({ type: String, enum: ['completed', 'fallback'], default: 'completed' }) status: string;
  @Prop({ type: String }) warning?: string;
}

export const CurriculumAnalysisSchema = SchemaFactory.createForClass(CurriculumAnalysis);
CurriculumAnalysisSchema.index({ universityId: 1, collegeId: 1, analyzedAt: -1 });
