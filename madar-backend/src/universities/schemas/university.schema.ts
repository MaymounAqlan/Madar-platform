import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UniversityDocument = University & Document;

@Schema({ timestamps: true })
export class University {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  nameAr: string;

  @Prop()
  nameEn?: string;

  @Prop({ type: String, trim: true, lowercase: true })
  slug?: string;

  @Prop({ type: [String], default: [] })
  aliases?: string[];

  @Prop({ enum: ['public_university', 'private_university', 'community_college', 'university_college', 'institute', 'academy'] })
  institutionType?: string;

  @Prop({ enum: ['public', 'private', 'mixed'] })
  ownership?: string;

  @Prop({ enum: ['accredited', 'licensed', 'pending', 'unknown'], default: 'unknown' })
  accreditationStatus?: string;

  @Prop()
  governorate?: string;

  @Prop()
  city?: string;

  @Prop()
  addressAr?: string;

  @Prop()
  addressEn?: string;

  @Prop()
  website?: string;

  @Prop()
  officialEmail?: string;

  @Prop({ type: [String], default: [] })
  phoneNumbers?: string[];

  @Prop()
  logoUrl?: string;

  @Prop()
  logoStorageKey?: string;

  @Prop()
  logoAltAr?: string;

  @Prop()
  logoAltEn?: string;

  @Prop({ min: 1800, max: 2100 })
  establishedYear?: number;

  @Prop({ type: [String], default: [] })
  sourceUrls?: string[];

  @Prop()
  lastVerifiedAt?: Date;

  @Prop({ enum: ['verified', 'partially_verified', 'unverified'], default: 'unverified' })
  verificationStatus?: string;

  @Prop()
  dataSource?: string;

  @Prop({ default: false })
  isSeedData?: boolean;

  @Prop({ default: false })
  isDemo?: boolean;

  @Prop({ default: true })
  isActive?: boolean;

  @Prop({ default: 0 })
  sortOrder?: number;

  @Prop()
  deletedAt?: Date;

  @Prop()
  shortName: string;

  @Prop()
  description: string;

  @Prop()
  descriptionAr: string;

  @Prop({ min: 1800, max: 2100 })
  foundedYear: number;

  @Prop({
    enum: ['public', 'government', 'private', 'non_profit', 'research', 'international', 'other'],
    default: 'public',
  })
  type: string;

  @Prop({
    type: [
      {
        body: String,
        grade: String,
      },
    ],
    default: [],
  })
  accreditation: Array<{
    body: string;
    grade: string;
  }>;

  @Prop({
    type: {
      logoUrl: String,
      primaryColor: String,
      secondaryColor: String,
    },
  })
  branding: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
  };

  @Prop({
    type: {
      city: String,
      country: String,
      address: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
  })
  location: {
    city: string;
    country: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };

  @Prop({
    type: {
      email: String,
      phone: String,
      website: String,
      hrEmail: String,
    },
  })
  contactInfo: {
    email: string;
    phone: string;
    website: string;
    hrEmail: string;
  };

  @Prop({
    type: [
      {
        collegeId: { type: Types.ObjectId },
        name: String,
        nameAr: String,
        code: String,
        departments: [
          {
            departmentId: { type: Types.ObjectId },
            name: String,
            nameAr: String,
            code: String,
            degreeTypes: { type: [String], default: [] },
          },
        ],
      },
    ],
    default: [],
  })
  colleges: Array<{
    collegeId: Types.ObjectId;
    name: string;
    nameAr: string;
    code: string;
    departments: Array<{
      departmentId: Types.ObjectId;
      name: string;
      nameAr: string;
      code: string;
      degreeTypes: string[];
    }>;
  }>;

  @Prop({
    type: {
      totalStudents: { type: Number, default: 0 },
      totalGraduates: { type: Number, default: 0 },
      totalFaculty: { type: Number, default: 0 },
      averageGpa: { type: Number, default: 0 },
      employmentRate: { type: Number, default: 0 },
      averageTimeToEmployment: { type: Number, default: 0 },
      topHiredSkills: { type: [String], default: [] },
      industryPartnerships: { type: Number, default: 0 },
    },
  })
  analytics: {
    totalStudents: number;
    totalGraduates: number;
    totalFaculty: number;
    averageGpa: number;
    employmentRate: number;
    averageTimeToEmployment: number;
    topHiredSkills: string[];
    industryPartnerships: number;
  };

  @Prop({
    type: {
      national: Number,
      regional: Number,
      subject: { type: Object, default: {} },
    },
  })
  rankings: {
    national: number;
    regional: number;
    subject: Record<string, number>;
  };

  @Prop({
    type: {
      totalGraduates: { type: Number, default: 0 },
      employedConfirmed: { type: Number, default: 0 },
      acceptanceRate: { type: Number, default: 0 },
    },
  })
  statistics: {
    totalGraduates: number;
    employedConfirmed: number;
    acceptanceRate: number;
  };

  @Prop({
    type: {
      overall: { type: Number, default: 0 },
      curriculumAlignment: { type: Number, default: 70 },
      readinessAverage: { type: Number, default: 65 },
      matchingAverage: { type: Number, default: 60 },
      skillCoverage: { type: Number, default: 65 },
      dataReliability: { type: Number, default: 100 },
    },
  })
  scores: {
    overall: number;
    curriculumAlignment: number;
    readinessAverage: number;
    matchingAverage: number;
    skillCoverage: number;
    dataReliability: number;
  };

  @Prop({
    type: {
      allowPublicProfile: { type: Boolean, default: true },
      allowCompanyAccess: { type: Boolean, default: true },
      dataRetentionMonths: { type: Number, default: 24 },
      customFields: { type: [Object], default: [] },
    },
  })
  settings: {
    allowPublicProfile: boolean;
    allowCompanyAccess: boolean;
    dataRetentionMonths: number;
    customFields: any[];
  };

  @Prop({
    default: 'active',
    enum: ['active', 'inactive', 'pending', 'suspended', 'pending_verification'],
  })
  status: string;

  @Prop({ type: String })
  emailDomain?: string;

  @Prop({ type: String })
  licenseNumber?: string;

  @Prop({ type: String })
  accreditationDocumentUrl?: string;

  @Prop({ type: String })
  registrationNotes?: string;

  @Prop({ type: { fullName: String, jobTitle: String, email: String, phone: String } })
  officialContact?: { fullName: string; jobTitle: string; email: string; phone: string };

  @Prop({ type: Date, default: Date.now })
  submittedAt: Date;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: String })
  rejectionReason?: string;

  @Prop({ type: String })
  suspensionReason?: string;
}

export const UniversitySchema = SchemaFactory.createForClass(University);
UniversitySchema.index({ name: 'text', shortName: 'text', description: 'text' });
UniversitySchema.index({ type: 1 });
UniversitySchema.index({ status: 1 });
UniversitySchema.index({ 'location.country': 1, 'location.city': 1 });
UniversitySchema.index({ emailDomain: 1 }, { unique: true, sparse: true });
UniversitySchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: 'objectId' } } });
UniversitySchema.index({ slug: 1 }, { unique: true, sparse: true });
UniversitySchema.index({ nameAr: 1 });
UniversitySchema.index({ nameEn: 1 });
UniversitySchema.index({ governorate: 1 });
UniversitySchema.index({ institutionType: 1 });
UniversitySchema.index({ isActive: 1, sortOrder: 1, nameAr: 1 });
