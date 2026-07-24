import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContactRequestDocument = HydratedDocument<ContactRequest>;

@Schema({ timestamps: true, collection: 'contact_requests' })
export class ContactRequest {
  @Prop({ required: true, trim: true, maxlength: 100 })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true, maxlength: 160 })
  email: string;

  @Prop({
    required: true,
    enum: ['visitor', 'student', 'university', 'company'],
  })
  requesterType: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  subject: string;

  @Prop({ required: true, trim: true, maxlength: 3000 })
  message: string;

  @Prop({ enum: ['ar', 'en'], default: 'ar' })
  language: string;

  @Prop({
    enum: ['new', 'in_progress', 'resolved', 'closed'],
    default: 'new',
  })
  status: string;

  @Prop({ required: true, select: false })
  ipHash: string;

  @Prop({ required: true, select: false })
  messageHash: string;

  createdAt: Date;
  updatedAt: Date;
}

export const ContactRequestSchema =
  SchemaFactory.createForClass(ContactRequest);

ContactRequestSchema.index({ ipHash: 1, createdAt: -1 });
ContactRequestSchema.index({ email: 1, createdAt: -1 });
ContactRequestSchema.index({ messageHash: 1, createdAt: -1 });
ContactRequestSchema.index({ status: 1, createdAt: -1 });
