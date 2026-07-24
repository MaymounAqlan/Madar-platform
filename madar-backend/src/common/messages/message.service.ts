import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name) private readonly model: Model<MessageDocument>,
  ) {}

  async create(data: Partial<Message>): Promise<MessageDocument> {
    return this.model.create(data);
  }

  async findAll(filter: any = {}): Promise<MessageDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<MessageDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<Message>): Promise<MessageDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<MessageDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
