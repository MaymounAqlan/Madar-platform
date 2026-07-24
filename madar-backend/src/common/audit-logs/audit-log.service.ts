import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectModel(AuditLog.name) private readonly model: Model<AuditLogDocument>,
  ) {}

  async create(data: Partial<AuditLog>): Promise<AuditLogDocument> {
    return this.model.create(data);
  }

  async findAll(filter: any = {}): Promise<AuditLogDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<AuditLogDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<AuditLog>): Promise<AuditLogDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<AuditLogDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
