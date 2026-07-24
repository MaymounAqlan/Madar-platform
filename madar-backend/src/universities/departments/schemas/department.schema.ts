import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DepartmentDocument = Department & Document;

@Schema({ timestamps: true })
export class Department {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'University', required: true })
  universityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'College', required: true })
  collegeId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  nameAr: string;

  @Prop({ type: String })
  nameEn?: string;

  @Prop({ type: String, trim: true, lowercase: true })
  slug?: string;

  @Prop({ default: true })
  isActive?: boolean;

  @Prop({ type: [String], default: [] })
  sourceUrls?: string[];

  @Prop({ enum: ['verified', 'partially_verified', 'unverified'], default: 'unverified' })
  verificationStatus?: string;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: String })
  code: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  head: string;

  @Prop({ type: Number, default: 0 })
  studentCount: number;

  @Prop({ type: Object })
  marketAlignment: {
    alignmentScore: number;
    topRelatedJobs: string[];
    marketDemandTrend: string;
    missingSkills: string[];
  };

  @Prop({ type: Object })
  analytics: {
    averageReadinessScore: number;
    employmentRate: number;
    skillGaps: string[];
    curriculumGaps: string[];
  };

  @Prop({ type: Object })
  studentSummary: {
    total: number;
    byLevel: Record<string, number>;
    byStatus: Record<string, number>;
  };

  @Prop({ type: [String] })
  degreeTypes: string[];

  @Prop({ type: [String] })
  specializations: string[];

  @Prop({ type: Object })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
DepartmentSchema.index({ collegeId: 1, code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string' } } });
DepartmentSchema.index({ collegeId: 1, name: 1 }, { unique: true });
DepartmentSchema.index({ universityId: 1, collegeId: 1, 'metadata.status': 1, createdAt: -1 });
DepartmentSchema.index({ collegeId: 1, slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string' } } });
