import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private readonly model: Model<NotificationDocument>,
  ) {}

  private toResponse(doc: NotificationDocument | null): NotificationDocument | null {
    if (!doc) return null;
    const plain = doc.toObject ? doc.toObject() : doc;
    const { data: _unusedData, ...response } = plain as any;
    return response as NotificationDocument;
  }

  async create(data: Partial<Notification>): Promise<NotificationDocument> {
    const doc = await this.model.create(data);
    return this.toResponse(doc) as NotificationDocument;
  }

  async findAll(filter: any = {}): Promise<NotificationDocument[]> {
    return this.model.find(filter).exec();
  }

  async findMine(userId: string, query: any = {}): Promise<{ data: NotificationDocument[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const skip = (page - 1) * limit;

    const filter: any = { userId: new Types.ObjectId(userId) };
    if (query.type) filter.type = query.type;
    if (query.read !== undefined) filter.read = query.read === 'true' || query.read === true;

    const [data, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);

    return { data: data as unknown as NotificationDocument[], total, page, limit };
  }

  async findById(id: string): Promise<NotificationDocument | null> {
    const doc = await this.model.findById(id).exec();
    return this.toResponse(doc);
  }

  async update(id: string, data: Partial<Notification>): Promise<NotificationDocument | null> {
    const doc = await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    return this.toResponse(doc);
  }

  async markRead(id: string, userId: string): Promise<NotificationDocument | null> {
    const doc = await this.model.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
      { $set: { read: true } },
      { new: true },
    ).exec();
    return this.toResponse(doc);
  }

  async markAllRead(userId: string): Promise<{ matchedCount: number }> {
    const result = await this.model.updateMany(
      { userId: new Types.ObjectId(userId), read: { $ne: true } },
      { $set: { read: true } },
    ).exec();
    return { matchedCount: result.matchedCount || 0 };
  }

  async delete(id: string): Promise<NotificationDocument | null> {
    const doc = await this.model.findByIdAndDelete(id).exec();
    return this.toResponse(doc);
  }
}
