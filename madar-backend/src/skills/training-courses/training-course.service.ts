import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TrainingCourse, TrainingCourseDocument } from './schemas/training-course.schema';

@Injectable()
export class TrainingCourseService {
  constructor(
    @InjectModel(TrainingCourse.name) private readonly model: Model<TrainingCourseDocument>,
  ) {}

  async create(data: Partial<TrainingCourse>): Promise<TrainingCourseDocument> {
    return this.model.create(data);
  }

  async findAll(filter: any = {}): Promise<TrainingCourseDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<TrainingCourseDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<TrainingCourse>): Promise<TrainingCourseDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<TrainingCourseDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
