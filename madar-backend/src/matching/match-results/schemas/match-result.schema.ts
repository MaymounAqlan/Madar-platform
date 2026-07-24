import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MatchResultDocument = MatchResult & Document;

@Schema({ timestamps: true })
export class MatchResult {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  student: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  job: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company' })
  company: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0, max: 100 })
  overallScore: number;

  @Prop({ type: Number })
  skillScore: number;

  @Prop({ type: Number })
  experienceScore: number;

  @Prop({ type: Number })
  educationScore: number;

  @Prop({ type: Number })
  semanticScore: number;

  @Prop({ type: Object })
  factorBreakdown: Record<string, any>;

  @Prop({ type: [Object] })
  skillMatches: Array<Record<string, any>>;

  @Prop({ type: [Object] })
  missingSkills: Array<Record<string, any>>;

  @Prop({ type: [String] })
  recommendations: string[];

  @Prop({ type: Object })
  acceptanceProbability: {
    score: number;
    confidence: string;
    method?: string;
    factors: Array<Record<string, any>>;
  };

  @Prop({ type: Object })
  explanation: Record<string, any>;

  @Prop({ type: Number, default: 0 })
  mandatorySkillsPenalty: number;

  @Prop({ type: String })
  modelVersion: string;

  @Prop({ type: Date })
  calculatedAt: Date;

  @Prop({ type: Object })
  scores: {
    overall: number;
    skill: number;
    experience: number;
    education: number;
    semantic: number;
  };

  @Prop({ type: Object })
  recommendation: {
    reasoning: string;
    actions: string[];
    strengths?: string[];
    weaknesses?: string[];
  };

  @Prop({ type: Types.ObjectId })
  jobId: Types.ObjectId;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: String })
  configurationVersion: string;

  createdAt: Date;
  updatedAt: Date;
}

export const MatchResultSchema = SchemaFactory.createForClass(MatchResult);
