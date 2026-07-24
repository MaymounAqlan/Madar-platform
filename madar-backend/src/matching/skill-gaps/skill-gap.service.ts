import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SkillGap, SkillGapDocument } from './schemas/skill-gap.schema';

@Injectable()
export class SkillGapService {
  constructor(
    @InjectModel(SkillGap.name) private readonly model: Model<SkillGapDocument>,
  ) {}

  async create(data: Partial<SkillGap>): Promise<SkillGapDocument> {
    return this.model.create(data);
  }

  async findAll(filter: any = {}): Promise<SkillGapDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<SkillGapDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<SkillGap>): Promise<SkillGapDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<SkillGapDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
