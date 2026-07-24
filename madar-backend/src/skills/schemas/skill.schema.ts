import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SkillDocument = Skill & Document;

@Schema({ timestamps: true })
export class Skill {
  @Prop({ required: true })
  name: string;

  @Prop()
  nameAr: string;

  @Prop({ required: true })
  normalizedName: string;

  @Prop({ type: [String], default: [] })
  aliases: string[];

  @Prop({
    required: true,
    enum: ['technical', 'soft', 'language', 'domain', 'tool', 'framework'],
  })
  category: string;

  @Prop()
  subcategory: string;

  @Prop({ type: Types.ObjectId, ref: 'Skill' })
  parentSkillId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Skill' }], default: [] })
  relatedSkills: Types.ObjectId[];

  @Prop({
    type: {
      demandScore: { type: Number, min: 0, max: 100 },
      growthRate: Number,
      averageSalaryImpact: Number,
      topCompanies: { type: [String], default: [] },
      topJobTitles: { type: [String], default: [] },
      trend: { type: String, enum: ['rising', 'stable', 'declining'], default: 'stable' },
      lastUpdated: Date,
    },
  })
  marketData: {
    demandScore: number;
    growthRate: number;
    averageSalaryImpact: number;
    topCompanies: string[];
    topJobTitles: string[];
    trend: string;
    lastUpdated: Date;
  };

  @Prop({
    type: [
      {
        title: String,
        url: String,
        provider: String,
        type: { type: String, enum: ['course', 'tutorial', 'documentation', 'book', 'video', 'practice'] },
        isFree: { type: Boolean, default: true },
      },
    ],
    default: [],
  })
  learningResources: Array<{
    title: string;
    url: string;
    provider: string;
    type: string;
    isFree: boolean;
  }>;

  @Prop({
    type: {
      vector: { type: [Number], default: [] },
      model: String,
      lastUpdated: Date,
    },
  })
  embedding: {
    vector: number[];
    model: string;
    lastUpdated: Date;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const SkillSchema = SchemaFactory.createForClass(Skill);
SkillSchema.index({ name: 1 });
SkillSchema.index({ normalizedName: 1 }, { unique: true });
SkillSchema.index({ category: 1 });
SkillSchema.index({ subcategory: 1 });
SkillSchema.index({ parentSkillId: 1 });
SkillSchema.index({ name: 'text', nameAr: 'text', aliases: 'text' });
SkillSchema.index({ isActive: 1 });
