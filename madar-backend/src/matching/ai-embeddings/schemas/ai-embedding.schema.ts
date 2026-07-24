import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AiEmbeddingDocument = AiEmbedding & Document;

@Schema({ timestamps: true })
export class AiEmbedding {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: ['student', 'job', 'skill', 'course'],
  })
  entityType: string;

  @Prop({ type: Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({ type: [Number], required: true })
  vector: number[];

  @Prop({ type: Number })
  dimension: number;

  @Prop({ type: String })
  model: string;

  @Prop({ type: String, default: '1' })
  modelVersion: string;

  @Prop({ type: String })
  textHash: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ type: Date })
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const AiEmbeddingSchema = SchemaFactory.createForClass(AiEmbedding);
AiEmbeddingSchema.index(
  { entityType: 1, entityId: 1, model: 1, modelVersion: 1, textHash: 1 },
  { unique: true, sparse: true },
);
AiEmbeddingSchema.index({ entityType: 1, model: 1, modelVersion: 1, updatedAt: -1 });
