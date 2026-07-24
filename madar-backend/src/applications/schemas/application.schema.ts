import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApplicationDocument = Application & Document;

@Schema({ timestamps: true })
export class Application {
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  studentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job', required: true })
  jobId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop()
  coverLetter: string;

  @Prop({
    type: [
      {
        name: String,
        url: String,
        type: { type: String, enum: ['resume', 'transcript', 'portfolio', 'certificate', 'other'] },
      },
    ],
    default: [],
  })
  additionalDocuments: Array<{
    name: string;
    url: string;
    type: string;
  }>;

  @Prop({
    type: {
      matchScore: { type: Number, min: 0, max: 100 },
      skillMatch: { type: Number, min: 0, max: 100 },
      experienceMatch: { type: Number, min: 0, max: 100 },
      educationMatch: { type: Number, min: 0, max: 100 },
      calculatedAt: Date,
    },
  })
  matchSnapshot: {
    matchScore: number;
    skillMatch: number;
    experienceMatch: number;
    educationMatch: number;
    calculatedAt: Date;
  };

  @Prop({
    required: true,
    enum: ['submitted', 'applied', 'screening', 'under_review', 'shortlisted', 'interview_scheduled', 'interviewed', 'offer_pending', 'offered', 'accepted', 'confirmed_employed', 'rejected', 'withdrawn', 'expired'],
    default: 'submitted',
  })
  status: string;

  @Prop({
    type: [
      {
        status: String,
        note: String,
        noteAr: String,
        createdAt: { type: Date, default: Date.now },
        createdBy: { type: Types.ObjectId, ref: 'User' },
      },
    ],
    default: [],
  })
  statusHistory: Array<{
    status: string;
    note: string;
    noteAr: string;
    createdAt: Date;
    createdBy: Types.ObjectId;
  }>;

  @Prop({
    type: {
      scheduledAt: Date,
      completedAt: Date,
      type: { type: String, enum: ['phone', 'video', 'in_person', 'technical', 'panel'] },
      duration: Number,
      location: String,
      meetingLink: String,
      feedback: {
        rating: { type: Number, min: 1, max: 5 },
        strengths: { type: [String], default: [] },
        weaknesses: { type: [String], default: [] },
        notes: String,
        recommendation: { type: String, enum: ['strong_hire', 'hire', 'consider', 'reject'] },
        evaluatedBy: { type: Types.ObjectId, ref: 'User' },
        evaluatedAt: Date,
      },
      stages: [
        {
          stage: String,
          status: { type: String, enum: ['pending', 'completed', 'cancelled'] },
          scheduledAt: Date,
          completedAt: Date,
          feedback: String,
        },
      ],
    },
  })
  interview: {
    scheduledAt: Date;
    completedAt: Date;
    type: string;
    duration: number;
    location: string;
    meetingLink: string;
    feedback: {
      rating: number;
      strengths: string[];
      weaknesses: string[];
      notes: string;
      recommendation: string;
      evaluatedBy: Types.ObjectId;
      evaluatedAt: Date;
    };
    stages: Array<{
      stage: string;
      status: string;
      scheduledAt: Date;
      completedAt: Date;
      feedback: string;
    }>;
  };

  @Prop({
    type: {
      salary: {
        offered: Number,
        currency: { type: String, default: 'SAR' },
        period: { type: String, default: 'monthly' },
      },
      startDate: Date,
      responseDeadline: Date,
      respondedAt: Date,
      response: { type: String, enum: ['pending', 'accepted', 'declined', 'negotiating'] },
    },
  })
  companyReview: {
    salary: {
      offered: number;
      currency: string;
      period: string;
    };
    startDate: Date;
    responseDeadline: Date;
    respondedAt: Date;
    response: string;
  };

  @Prop({
    type: {
      submitted: { type: Boolean, default: false },
      screeningPassed: { type: Boolean, default: false },
      interviewScheduled: { type: Boolean, default: false },
      decisionMade: { type: Boolean, default: false },
      offerExtended: { type: Boolean, default: false },
    },
    default: {},
  })
  notificationsSent: {
    submitted: boolean;
    screeningPassed: boolean;
    interviewScheduled: boolean;
    decisionMade: boolean;
    offerExtended: boolean;
  };
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
ApplicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
ApplicationSchema.index({ studentId: 1, createdAt: -1 });
ApplicationSchema.index({ jobId: 1, status: 1 });
ApplicationSchema.index({ companyId: 1, status: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ createdAt: -1 });
