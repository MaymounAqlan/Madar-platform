import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Department, DepartmentDocument } from './schemas/department.schema';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name) private readonly model: Model<DepartmentDocument>,
  ) {}

  async create(data: Partial<Department>): Promise<DepartmentDocument> {
    return this.model.create(data);
  }

  async findAll(filter: any = {}): Promise<DepartmentDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<DepartmentDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<Department>): Promise<DepartmentDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<DepartmentDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
