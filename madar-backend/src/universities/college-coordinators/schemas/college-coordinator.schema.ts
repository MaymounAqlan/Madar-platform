import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UNIVERSITY_STAFF_PERMISSIONS } from '../dto/staff.dto';

export type CollegeCoordinatorDocument = CollegeCoordinator & Document;

@Schema({ timestamps: true })
export class CollegeCoordinator {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'University', required: true })
  universityId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'College' })
  collegeId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer'],
    default: 'coordinator',
  })
  role: string;

  @Prop({ type: String })
  department: string;

  @Prop({ type: String })
  jobTitle: string;

  @Prop({ type: String })
  biography: string;

  @Prop({ type: [String], enum: UNIVERSITY_STAFF_PERMISSIONS })
  permissions: string[];

  @Prop({ type: String, enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({ type: String, enum: ['pending', 'accepted', 'cancelled'], default: 'pending' })
  invitationStatus: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  invitedAt: Date;

  @Prop({ type: Date })
  lastInvitedAt: Date;

  @Prop({ type: Date })
  invitationExpiresAt: Date;

  @Prop({ type: String })
  invitationMessage: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const CollegeCoordinatorSchema =
  SchemaFactory.createForClass(CollegeCoordinator);
CollegeCoordinatorSchema.index({ userId: 1 }, { unique: true });
CollegeCoordinatorSchema.index({ universityId: 1, role: 1, status: 1 });
CollegeCoordinatorSchema.index({ universityId: 1, collegeId: 1 });
