import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentAffiliationDocument = StudentAffiliation & Document;

@Schema({ timestamps: true })
export class StudentAffiliation {
  _id: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true, index: true }) studentId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'University', required: true, index: true }) universityId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'College', required: true }) collegeId: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'Department', required: true }) departmentId: Types.ObjectId;
  @Prop({ required: true, trim: true }) studentNumber: string;
  @Prop({ required: true, enum: ['freshman', 'sophomore', 'junior', 'senior', 'graduate'] }) academicLevel: string;
  @Prop({ required: true, min: 1900, max: 2200 }) enrollmentYear: number;
  @Prop({ required: true, min: 1900, max: 2200 }) expectedGraduationYear: number;
  @Prop({ enum: ['pending', 'verified', 'rejected', 'suspended', 'graduated'], default: 'pending', index: true }) status: string;
  @Prop({ enum: ['self_reported', 'document', 'institutional'], default: 'self_reported' }) verificationMethod: string;
  @Prop({ type: Types.ObjectId, ref: 'User' }) verifiedBy?: Types.ObjectId;
  @Prop() verifiedAt?: Date;
  @Prop() rejectionReason?: string;
  @Prop() suspensionReason?: string;
  @Prop() graduationDate?: Date;
  @Prop({ default: true }) isCurrent: boolean;
  @Prop() proofDocumentUrl?: string;
  @Prop({ type: [{ status: String, reason: String, actorId: { type: Types.ObjectId, ref: 'User' }, createdAt: Date }], default: [] }) decisions: Array<{ status: string; reason?: string; actorId: Types.ObjectId; createdAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

export const StudentAffiliationSchema = SchemaFactory.createForClass(StudentAffiliation);
StudentAffiliationSchema.index({ universityId: 1, studentNumber: 1 }, { unique: true });
StudentAffiliationSchema.index({ studentId: 1, isCurrent: 1 }, { unique: true, partialFilterExpression: { isCurrent: true } });
StudentAffiliationSchema.index({ universityId: 1, collegeId: 1, departmentId: 1, status: 1, createdAt: -1 });
