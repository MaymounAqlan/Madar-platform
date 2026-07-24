import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({
    type: {
      name: { type: String, required: true },
      legalName: String,
      description: String,
      descriptionAr: String,
      industry: String,
      subIndustries: { type: [String], default: [] },
      companySize: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
      foundedYear: Number,
      website: String,
      logoUrl: String,
      coverImageUrl: String,
      verified: { type: Boolean, default: false },
      verificationStatus: { type: String, enum: ['unverified', 'pending', 'verified', 'rejected'], default: 'unverified' },
    },
    required: true,
  })
  profile: {
    name: string;
    legalName: string;
    description: string;
    descriptionAr: string;
    industry: string;
    subIndustries: string[];
    companySize: string;
    foundedYear: number;
    website: string;
    logoUrl: string;
    coverImageUrl: string;
    verified: boolean;
    verificationStatus: string;
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
  headquarters: {
    city: string;
    country: string;
    address: string;
    coordinates: { lat: number; lng: number };
  };

  @Prop({
    type: [
      {
        city: String,
        country: String,
        isHeadquarters: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  locations: Array<{
    city: string;
    country: string;
    isHeadquarters: boolean;
  }>;

  @Prop({
    type: {
      email: String,
      phone: String,
      hrEmail: String,
      linkedIn: String,
      twitter: String,
      github: String,
      portfolio: String,
      facebook: String,
      instagram: String,
      youtube: String,
      behance: String,
      dribbble: String,
      stackOverflow: String,
      researchGate: String,
      orcid: String,
    },
  })
  contactInfo: {
    email: string;
    phone: string;
    hrEmail: string;
    linkedIn: string;
    twitter: string;
    github: string;
    portfolio: string;
    facebook: string;
    instagram: string;
    youtube: string;
    behance: string;
    dribbble: string;
    stackOverflow: string;
    researchGate: string;
    orcid: string;
  };

  @Prop({
    type: {
      values: { type: [String], default: [] },
      benefits: { type: [String], default: [] },
      workEnvironment: String,
      diversityStatement: String,
    },
  })
  culture: {
    values: string[];
    benefits: string[];
    workEnvironment: string;
    diversityStatement: string;
  };

  @Prop({
    type: {
      targetUniversities: { type: [Types.ObjectId], ref: 'University', default: [] },
      targetMajors: { type: [String], default: [] },
      hiringSeasons: { type: [String], default: [] },
      maxApplicationsPerStudent: { type: Number, default: 5 },
      autoScreenEnabled: { type: Boolean, default: false },
    },
  })
  recruitmentPreferences: {
    targetUniversities: Types.ObjectId[];
    targetMajors: string[];
    hiringSeasons: string[];
    maxApplicationsPerStudent: number;
    autoScreenEnabled: boolean;
  };

  @Prop({
    type: {
      totalJobsPosted: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 },
      averageTimeToHire: { type: Number, default: 0 },
      acceptanceRate: { type: Number, default: 0 },
      topHiredSkills: { type: [String], default: [] },
      candidateQualityScore: { type: Number, default: 0 },
      universityPartnerships: { type: Number, default: 0 },
    },
  })
  analytics: {
    totalJobsPosted: number;
    totalApplications: number;
    averageTimeToHire: number;
    acceptanceRate: number;
    topHiredSkills: string[];
    candidateQualityScore: number;
    universityPartnerships: number;
  };

  @Prop({
    default: 'active',
    enum: ['active', 'inactive', 'suspended', 'pending'],
  })
  status: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
CompanySchema.index({ 'profile.name': 'text', 'profile.description': 'text', 'profile.industry': 'text' });
CompanySchema.index({ 'profile.industry': 1 });
CompanySchema.index({ 'profile.verified': 1 });
CompanySchema.index({ status: 1 });
