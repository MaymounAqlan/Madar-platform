import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { College, CollegeDocument } from './schemas/college.schema';

@Injectable()
export class CollegeService {
  constructor(
    @InjectModel(College.name) private readonly model: Model<CollegeDocument>,
  ) {}

  async create(data: Partial<College>): Promise<CollegeDocument> {
    return this.model.create(data);
  }

  async findAll(filter: any = {}): Promise<CollegeDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<CollegeDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<College>): Promise<CollegeDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<CollegeDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
