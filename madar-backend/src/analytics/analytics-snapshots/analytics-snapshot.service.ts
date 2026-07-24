import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsSnapshot, AnalyticsSnapshotDocument } from './schemas/analytics-snapshot.schema';

@Injectable()
export class AnalyticsSnapshotService {
  constructor(
    @InjectModel(AnalyticsSnapshot.name) private readonly model: Model<AnalyticsSnapshotDocument>,
  ) {}

  async create(data: Partial<AnalyticsSnapshot>): Promise<AnalyticsSnapshotDocument> {
    return this.model.create(data);
  }

  async findAll(filter: any = {}): Promise<AnalyticsSnapshotDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<AnalyticsSnapshotDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<AnalyticsSnapshot>): Promise<AnalyticsSnapshotDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<AnalyticsSnapshotDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
