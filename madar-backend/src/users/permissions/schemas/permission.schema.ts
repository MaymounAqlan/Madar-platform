import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PermissionDocument = Permission & Document;

@Schema({ timestamps: true })
export class Permission {
  _id: string;

  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  module: string;

  @Prop({ type: [String] })
  actions: string[];

  @Prop({ type: Object })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
