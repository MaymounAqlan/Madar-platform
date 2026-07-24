import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudyPlanDocument = StudyPlan & Document;

@Schema({ timestamps: true })
export class StudyPlan {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'University', required: true })
  universityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'College', required: true })
  collegeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true })
  departmentId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  nameAr: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number })
  totalCredits: number;

  @Prop({ type: Number })
  durationYears: number;

  @Prop({ required: true, default: '2026-2027' }) academicYear: string;
  @Prop({ type: Number, default: 1, min: 1 }) version: number;
  @Prop({ type: Types.ObjectId, ref: 'StudyPlan' }) previousVersionId?: Types.ObjectId;
  @Prop({ type: [Object], default: [] }) levels: Array<{ level: number; semesters: Array<{ name: string; courseIds: Types.ObjectId[] }> }>;

  @Prop({
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'approved', 'active', 'archived', 'changes_requested', 'rejected'],
    default: 'draft',
  })
  status: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Course' }] })
  courses: Types.ObjectId[];

  @Prop({ type: Object })
  metadata: Record<string, any>;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) createdBy: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' }) reviewedBy?: Types.ObjectId;
  @Prop() submittedAt?: Date;
  @Prop() reviewedAt?: Date;
  @Prop() reviewReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const StudyPlanSchema = SchemaFactory.createForClass(StudyPlan);
StudyPlanSchema.index({ universityId: 1, departmentId: 1, academicYear: 1, version: 1 }, { unique: true });
StudyPlanSchema.index({ universityId: 1, collegeId: 1, status: 1, createdAt: -1 });
