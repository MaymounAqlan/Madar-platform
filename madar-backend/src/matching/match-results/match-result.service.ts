import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MatchResult, MatchResultDocument } from './schemas/match-result.schema';

@Injectable()
export class MatchResultService {
  constructor(
    @InjectModel(MatchResult.name) private readonly model: Model<MatchResultDocument>,
  ) {}

  async create(data: Partial<MatchResult>): Promise<MatchResultDocument> {
    return this.model.create(data);
  }

  async findAll(filter: any = {}): Promise<MatchResultDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<MatchResultDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<MatchResult>): Promise<MatchResultDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<MatchResultDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
