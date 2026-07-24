import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MarketDataDocument = MarketData & Document;

@Schema({ timestamps: true })
export class MarketData {
  _id: string;

  @Prop({ type: String, required: true })
  skill: string;

  @Prop({ type: String, enum: ['up', 'down', 'stable'] })
  demandTrend: string;

  @Prop({ type: Number })
  demandScore: number;

  @Prop({ type: Number })
  supplyScore: number;

  @Prop({ type: Object })
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };

  @Prop({ type: Number })
  jobCount: number;

  @Prop({ type: Number })
  growthRate: number;

  @Prop({ type: String })
  region: string;

  @Prop({ type: String })
  period: string;

  @Prop({ type: String })
  skillName: string;

  @Prop({ type: Number })
  averageSalary: number;

  @Prop({ type: String })
  trend: string;

  @Prop({ type: [String] })
  topCompaniesHiring: string[];

  @Prop({ type: [String] })
  relatedJobTitles: string[];

  @Prop({ type: Object })
  metadata: Record<string, any>;

  createdAt: Date;
  updatedAt: Date;
}

export const MarketDataSchema = SchemaFactory.createForClass(MarketData);
MarketDataSchema.index({ skillName: 1, period: 1, region: 1 }, { unique: true, sparse: true });
MarketDataSchema.index({ demandScore: -1, growthRate: -1 });
