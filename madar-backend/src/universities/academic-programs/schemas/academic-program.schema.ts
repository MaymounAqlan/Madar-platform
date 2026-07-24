import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AcademicProgramDocument = AcademicProgram & Document;

@Schema({ timestamps: true, collection: 'academicprograms' })
export class AcademicProgram {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'University', required: true, index: true })
  universityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'College', required: true, index: true })
  collegeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Department', required: true, index: true })
  departmentId: Types.ObjectId;

  @Prop({ required: true }) nameAr: string;
  @Prop() nameEn?: string;
  @Prop({ required: true, trim: true, lowercase: true }) slug: string;
  @Prop() code?: string;
  @Prop() degreeType?: string;
  @Prop() descriptionAr?: string;
  @Prop() descriptionEn?: string;
  @Prop({ type: [String], default: [] }) sourceUrls?: string[];
  @Prop({ enum: ['verified', 'partially_verified', 'unverified'], default: 'unverified' }) verificationStatus: string;
  @Prop({ default: true }) isActive: boolean;
  @Prop() deletedAt?: Date;
}

export const AcademicProgramSchema = SchemaFactory.createForClass(AcademicProgram);
AcademicProgramSchema.index({ departmentId: 1, slug: 1 }, { unique: true });
AcademicProgramSchema.index({ universityId: 1, collegeId: 1, departmentId: 1, isActive: 1 });
