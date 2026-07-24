import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AcademicRecommendationDocument = AcademicRecommendation & Document;

@Schema({ timestamps: true })
export class AcademicRecommendation {
  _id: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'University', required: true }) universityId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'College', required: true }) collegeId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Department', required: true }) departmentId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'StudyPlan' }) studyPlanId?: Types.ObjectId;
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) description: string;
  @Prop({ enum: ['add_course', 'update_course', 'add_lab', 'add_project', 'increase_practical_coverage', 'add_certificate', 'add_technology'], required: true }) type: string;
  @Prop({ type: [Types.ObjectId], ref: 'Course', default: [] }) affectedCourses: Types.ObjectId[];
  @Prop({ type: [Types.ObjectId], ref: 'Skill', default: [] }) affectedSkills: Types.ObjectId[];
  @Prop({ type: [String], default: [] }) evidence: string[];
  @Prop() marketDemand: number;
  @Prop() studentImpact: string;
  @Prop({ enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }) priority: string;
  @Prop({ enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'changes_requested'], default: 'draft' }) status: string;
  @Prop({ enum: ['manual', 'ai'], default: 'manual' }) generatedBy: string;
  @Prop({ type: Types.ObjectId, ref: 'CurriculumAnalysis' }) analysisId?: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) createdBy: Types.ObjectId;
  @Prop() submittedAt?: Date;
  @Prop({ type: Types.ObjectId, ref: 'User' }) reviewedBy?: Types.ObjectId;
  @Prop() reviewedAt?: Date;
  @Prop() reviewReason?: string;
  @Prop({ type: Types.ObjectId, ref: 'StudyPlan' }) createdPlanVersionId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const AcademicRecommendationSchema = SchemaFactory.createForClass(AcademicRecommendation);
AcademicRecommendationSchema.index({ universityId: 1, collegeId: 1, status: 1, createdAt: -1 });
AcademicRecommendationSchema.index({ departmentId: 1, generatedBy: 1, title: 1, status: 1 });
