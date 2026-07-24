import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from './schemas/permission.schema';

@Injectable()
export class PermissionService {
  constructor(
    @InjectModel(Permission.name) private readonly model: Model<PermissionDocument>,
  ) {}

  async create(data: Partial<Permission>): Promise<PermissionDocument> {
    return this.model.create(data);
  }

  async findAll(filter: any = {}): Promise<PermissionDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<PermissionDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<Permission>): Promise<PermissionDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<PermissionDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
