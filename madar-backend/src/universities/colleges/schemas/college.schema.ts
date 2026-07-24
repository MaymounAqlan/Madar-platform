import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CollegeDocument = College & Document;

@Schema({ timestamps: true })
export class College {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'University' })
  universityId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  nameAr: string;

  @Prop({ type: String })
  nameEn?: string;

  @Prop({ type: String, trim: true, lowercase: true })
  slug?: string;

  @Prop({ enum: ['university_college', 'standalone_college', 'community_college'], default: 'university_college' })
  institutionType?: string;

  @Prop() governorate?: string;
  @Prop() city?: string;
  @Prop() addressAr?: string;
  @Prop() website?: string;
  @Prop() officialEmail?: string;
  @Prop({ type: [String], default: [] }) phoneNumbers?: string[];
  @Prop() logoUrl?: string;
  @Prop() logoStorageKey?: string;
  @Prop() descriptionAr?: string;
  @Prop({ type: [String], default: [] }) sourceUrls?: string[];
  @Prop() lastVerifiedAt?: Date;
  @Prop({ enum: ['verified', 'partially_verified', 'unverified'], default: 'unverified' }) verificationStatus?: string;
  @Prop({ default: true }) isActive?: boolean;
  @Prop() deletedAt?: Date;

  @Prop({ type: String })
  code: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number })
  established: number;

  @Prop({ type: String })
  dean: string;

  @Prop({ type: Number, default: 0 })
  studentCount: number;

  @Prop({ type: Number })
  employmentRate: number;

  @Prop({ type: Object })
  analytics: {
    totalStudents: number;
    totalGraduates: number;
    employmentRate: number;
    averageReadinessScore: number;
    averageGpa: number;
    topSkills: Array<{ skillId: string; name: string; proficiency: number }>;
    skillGaps: Array<{ skillId: string; name: string; affectedStudents: number }>;
    skillAlignmentScore: number;
  };

  @Prop({ type: Object })
  coordinator: {
    userId: Types.ObjectId;
    name: string;
    email: string;
    phone: string;
    assignedAt: Date;
  };

  @Prop({ type: Object })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const CollegeSchema = SchemaFactory.createForClass(College);
CollegeSchema.index({ universityId: 1, code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string' } } });
CollegeSchema.index({ universityId: 1, name: 1 }, { unique: true });
CollegeSchema.index({ universityId: 1, 'metadata.status': 1, createdAt: -1 });
CollegeSchema.index({ universityId: 1, slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string' } } });
CollegeSchema.index({ governorate: 1, institutionType: 1, isActive: 1 });
