import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RecommendationDocument = Recommendation & Document;

@Schema({ timestamps: true })
export class Recommendation {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  student: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job' })
  job: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Course' })
  course: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['job', 'course', 'skill', 'career_path'],
    required: true,
  })
  type: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  titleAr: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  descriptionAr: string;

  @Prop({ type: Number })
  relevanceScore: number;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Boolean, default: false })
  dismissed: boolean;

  @Prop({ type: Date })
  dismissedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const RecommendationSchema =
  SchemaFactory.createForClass(Recommendation);
RecommendationSchema.index({ student: 1, job: 1, type: 1 }, { unique: true, sparse: true });
