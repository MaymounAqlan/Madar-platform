import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true })
export class Course {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'University', required: true })
  universityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'College', required: true })
  collegeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department' })
  departmentId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'StudyPlan', required: true }) studyPlanId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  nameAr: string;

  @Prop({ type: String })
  nameEn: string;

  @Prop({ type: String })
  code: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  descriptionAr: string;

  @Prop({ type: String })
  descriptionEn: string;

  @Prop({ type: Number })
  credits: number;
  @Prop({ type: Number })
  lectureHours: number;
  @Prop({ type: Number })
  tutorialHours: number;
  @Prop({ type: Number })
  practicalHours: number;
  @Prop({ type: Number })
  laboratoryHours: number;
  @Prop({ type: Number, min: 1, max: 20 }) level: number;
  @Prop({ type: Number, min: 1, max: 6 }) semester: number;
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Course' }] }) corequisites: Types.ObjectId[];
  @Prop({ type: [Types.ObjectId], ref: 'Course', default: [] }) prerequisites: Types.ObjectId[];
  @Prop({ type: [String], default: [] }) learningOutcomes: string[];
  @Prop({ type: [String], default: [] }) learningOutcomesAr: string[];
  @Prop({ type: [String], default: [] }) learningOutcomesEn: string[];
  @Prop({ type: [String], default: [] }) eligibilityRules: string[];
  @Prop({ type: String }) electiveGroup: string;

  @Prop({ type: [String] })
  skills: string[];
  @Prop({ type: [{ skillId: { type: Types.ObjectId, ref: 'Skill' }, coverageLevel: { type: Number, min: 1, max: 5 }, coverageType: { type: String, enum: ['theoretical', 'practical', 'mixed'] }, assessmentMethod: String, notes: String }], default: [] })
  skillMappings: Array<{ skillId: Types.ObjectId; coverageLevel: number; coverageType: string; assessmentMethod: string; notes?: string }>;

  @Prop({ type: Number })
  marketRelevance: number;

  @Prop({ type: String, enum: ['required', 'elective', 'practical', 'laboratory', 'project', 'internship'] })
  type: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
  @Prop({ type: String, enum: ['active', 'archived'], default: 'active' }) status: string;

  createdAt: Date;
  updatedAt: Date;
}

export const CourseSchema = SchemaFactory.createForClass(Course);
CourseSchema.index({ studyPlanId: 1, code: 1 }, { unique: true });
CourseSchema.index({ universityId: 1, collegeId: 1, departmentId: 1, status: 1 });
