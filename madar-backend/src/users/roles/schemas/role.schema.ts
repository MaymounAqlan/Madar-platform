import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  _id: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: String })
  nameAr: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Boolean, default: false })
  isSystem: boolean;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
