import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EmailTemplateDocument = EmailTemplate & Document;

@Schema({ timestamps: true })
export class EmailTemplate {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  key: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  subjectAr: string;

  @Prop({ type: String, required: true })
  subjectEn: string;

  @Prop({ type: String })
  preheaderAr: string;

  @Prop({ type: String })
  preheaderEn: string;

  @Prop({ type: String, required: true })
  bodyAr: string;

  @Prop({ type: String, required: true })
  bodyEn: string;

  @Prop({ type: String, default: 'ar' })
  defaultLang: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Object, default: {} })
  styles: {
    logo?: string;
    backgroundColor?: string;
    cardColor?: string;
    textColor?: string;
    titleColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    buttonStyle?: string;
    fontFamily?: string;
    fontSize?: string;
    spacing?: string;
    headerHtml?: string;
    footerHtml?: string;
    direction?: 'rtl' | 'ltr';
  };

  @Prop({ type: [Object], default: [] })
  versions: Array<{
    version: number;
    subjectAr: string;
    subjectEn: string;
    bodyAr: string;
    bodyEn: string;
    preheaderAr?: string;
    preheaderEn?: string;
    styles?: Record<string, any>;
    updatedBy: Types.ObjectId;
    updatedAt: Date;
    note?: string;
  }>;

  @Prop({ type: Number, default: 1 })
  currentVersion: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const EmailTemplateSchema = SchemaFactory.createForClass(EmailTemplate);
