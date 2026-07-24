import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TrainingCourseDocument = TrainingCourse & Document;

@Schema({ timestamps: true })
export class TrainingCourse {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String })
  titleAr: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  descriptionAr: string;

  @Prop({ type: String })
  provider: string;

  @Prop({ type: String })
  url: string;

  @Prop({ type: [String] })
  skills: string[];

  @Prop({ type: String, enum: ['online', 'in-person', 'hybrid'] })
  deliveryMode: string;

  @Prop({ type: String })
  duration: string;

  @Prop({ type: Boolean, default: false })
  isFree: boolean;

  @Prop({ type: Number })
  cost: number;

  @Prop({ type: String })
  currency: string;

  @Prop({ type: String })
  certification: string;

  @Prop({ type: String, enum: ['beginner', 'intermediate', 'advanced'] })
  level: string;

  @Prop({
    type: String,
    enum: ['active', 'inactive', 'draft'],
    default: 'active',
  })
  status: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const TrainingCourseSchema =
  SchemaFactory.createForClass(TrainingCourse);
