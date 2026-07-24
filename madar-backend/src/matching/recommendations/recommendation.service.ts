import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recommendation, RecommendationDocument } from './schemas/recommendation.schema';

@Injectable()
export class RecommendationService {
  constructor(
    @InjectModel(Recommendation.name) private readonly model: Model<RecommendationDocument>,
  ) {}

  async create(data: Partial<Recommendation>): Promise<RecommendationDocument> {
    return this.model.create(data);
  }

  async findAll(filter: any = {}): Promise<RecommendationDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<RecommendationDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<Recommendation>): Promise<RecommendationDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<RecommendationDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
