import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlatformSettingDocument = PlatformSetting & Document;

@Schema({ timestamps: true })
export class PlatformSetting {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  key: string;

  @Prop({ type: Object, required: true })
  value: any;

  @Prop({ type: String })
  category: string;

  @Prop({ type: Boolean, default: false })
  isSecret: boolean;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ type: Date })
  updatedAt: Date;

  @Prop({ type: Date })
  createdAt: Date;
}

export const PlatformSettingSchema = SchemaFactory.createForClass(PlatformSetting);
