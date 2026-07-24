import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SkillGapDocument = SkillGap & Document;

@Schema({ timestamps: true })
export class SkillGap {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  student: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job' })
  jobId: Types.ObjectId;

  @Prop({ type: String, required: true })
  skillName: string;

  @Prop({ type: Number, min: 0, max: 100 })
  currentLevel: number;

  @Prop({ type: Number, min: 0, max: 100 })
  requiredLevel: number;

  @Prop({ type: Number })
  gap: number;

  @Prop({ type: String, enum: ['critical', 'high', 'medium', 'low'] })
  priority: string;

  @Prop({ type: [Object] })
  learningResources: Array<{
    title: string;
    url: string;
    provider: string;
    type: string;
    isFree: boolean;
  }>;

  @Prop({ type: Object })
  marketData: Record<string, any>;

  @Prop({ type: Number })
  overallGapScore: number;

  @Prop({ type: [Object] })
  missingSkills: Array<{ name: string; importance: number; gap: number }>;

  @Prop({ type: [Object] })
  learningPath: Array<{ step: number; resource: string; url: string }>;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const SkillGapSchema = SchemaFactory.createForClass(SkillGap);
