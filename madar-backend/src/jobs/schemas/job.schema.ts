import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as MongooseSchema } from 'mongoose';

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  postedBy: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  titleAr: string;

  @Prop()
  description: string;

  @Prop()
  descriptionAr: string;

  @Prop()
  summary: string;

  @Prop({
    required: true,
    enum: ['full_time', 'part_time', 'contract', 'internship', 'temporary', 'remote'],
  })
  type: string;

  @Prop({
    required: true,
    enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
  })
  level: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  subcategory: string;

  @Prop({
    type: {
      education: {
        degree: { type: String, enum: ['high_school', 'bachelor', 'master', 'phd', 'any'] },
        fields: { type: [String], default: [] },
        gpaMinimum: { type: Number, min: 0, max: 4 },
      },
      experience: {
        minYears: { type: Number, default: 0 },
        maxYears: Number,
        industries: { type: [String], default: [] },
      },
      requiredSkills: [
        {
          skillId: { type: Types.ObjectId, ref: 'Skill' },
          name: String,
          level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
          weight: { type: Number, default: 1 },
        },
      ],
      preferredSkills: [
        {
          skillId: { type: Types.ObjectId, ref: 'Skill' },
          name: String,
          level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
        },
      ],
      languages: [
        {
          language: String,
          proficiency: { type: String, enum: ['basic', 'conversational', 'fluent', 'native'] },
          required: { type: Boolean, default: false },
        },
      ],
      certifications: { type: [String], default: [] },
    },
  })
  requirements: {
    education: {
      degree: string;
      fields: string[];
      gpaMinimum: number;
    };
    experience: {
      minYears: number;
      maxYears: number;
      industries: string[];
    };
    requiredSkills: Array<{
      skillId: Types.ObjectId;
      name: string;
      level: string;
      weight: number;
    }>;
    preferredSkills: Array<{
      skillId: Types.ObjectId;
      name: string;
      level: string;
    }>;
    languages: Array<{
      language: string;
      proficiency: string;
      required: boolean;
    }>;
    certifications: string[];
  };

  @Prop({
    type: {
      salaryMin: Number,
      salaryMax: Number,
      currency: { type: String, default: 'SAR' },
      period: { type: String, default: 'monthly' },
      negotiable: { type: Boolean, default: false },
      benefits: { type: [String], default: [] },
      otherBenefits: { type: [String], default: [] },
    },
  })
  compensation: {
    salaryMin: number;
    salaryMax: number;
    currency: string;
    period: string;
    negotiable: boolean;
    benefits: string[];
    otherBenefits: string[];
  };

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  location: {
    city: string;
    country: string;
    type: string;
    isRelocatable: boolean;
  };

  @Prop({
    type: {
      skillVector: { type: [Number], default: [] },
      experienceVector: { type: [Number], default: [] },
      cultureVector: { type: [Number], default: [] },
      embedding: { type: [Number], default: [] },
      contentHash: String,
      embeddingModel: String,
      requiredSkills: { type: [Object], default: [] },
      preferredSkills: { type: [Object], default: [] },
      toolsAndTechnologies: { type: [String], default: [] },
      keywords: { type: [String], default: [] },
      domains: { type: [String], default: [] },
      responsibilities: { type: [String], default: [] },
      minimumExperienceYears: Number,
      educationLevel: String,
      lastUpdated: Date,
      version: String,
    },
  })
  aiAnalysis: {
    skillVector: number[];
    experienceVector: number[];
    cultureVector: number[];
    embedding: number[];
    contentHash: string;
    embeddingModel: string;
    requiredSkills: Array<Record<string, any>>;
    preferredSkills: Array<Record<string, any>>;
    toolsAndTechnologies: string[];
    keywords: string[];
    domains: string[];
    responsibilities: string[];
    minimumExperienceYears: number;
    educationLevel: string;
    lastUpdated: Date;
    version: string;
  };

  @Prop({
    type: {
      deadline: Date,
      maxApplications: Number,
      allowMultipleApplications: { type: Boolean, default: false },
      requireCoverLetter: { type: Boolean, default: false },
      autoReplyEnabled: { type: Boolean, default: false },
      screeningQuestions: [
        {
          question: String,
          questionAr: String,
          type: { type: String, enum: ['text', 'single_choice', 'multiple_choice', 'yes_no', 'number'] },
          options: { type: [String], default: [] },
          required: { type: Boolean, default: false },
        },
      ],
    },
  })
  applicationSettings: {
    deadline: Date;
    maxApplications: number;
    allowMultipleApplications: boolean;
    requireCoverLetter: boolean;
    autoReplyEnabled: boolean;
    screeningQuestions: Array<{
      question: string;
      questionAr: string;
      type: string;
      options: string[];
      required: boolean;
    }>;
  };

  @Prop({
    type: [
      {
        universityId: { type: Types.ObjectId, ref: 'University' },
        name: String,
        priority: { type: Number, default: 1 },
      },
    ],
    default: [],
  })
  targetUniversities: Array<{
    universityId: Types.ObjectId;
    name: string;
    priority: number;
  }>;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  applicationsCount: number;

  @Prop({
    default: 'active',
    enum: ['draft', 'active', 'paused', 'closed', 'expired', 'cancelled'],
  })
  status: string;
}

export const JobSchema = SchemaFactory.createForClass(Job);
JobSchema.index({ companyId: 1 });
JobSchema.index({ postedBy: 1 });
JobSchema.index({ title: 'text', description: 'text', summary: 'text' });
JobSchema.index({ status: 1 });
JobSchema.index({ type: 1 });
JobSchema.index({ level: 1 });
JobSchema.index({ category: 1 });
JobSchema.index({ 'requirements.requiredSkills.skillId': 1 });
JobSchema.index({ 'location.city': 1, 'location.country': 1 });
JobSchema.index({ createdAt: -1 });
