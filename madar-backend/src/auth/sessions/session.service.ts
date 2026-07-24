import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(Session.name) private readonly model: Model<SessionDocument>,
  ) {}

  async create(data: Partial<Session>): Promise<SessionDocument> {
    return this.model.create(data);
  }

  async findAll(filter: any = {}): Promise<SessionDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<SessionDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<Session>): Promise<SessionDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<SessionDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
