import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AiEmbedding, AiEmbeddingDocument } from './schemas/ai-embedding.schema';

@Injectable()
export class AiEmbeddingService {
  constructor(
    @InjectModel(AiEmbedding.name) private readonly model: Model<AiEmbeddingDocument>,
  ) {}

  async create(data: Partial<AiEmbedding>): Promise<AiEmbeddingDocument> {
    return this.model.create(data);
  }

  async upsert(data: Partial<AiEmbedding>): Promise<AiEmbeddingDocument> {
    const filter = {
      entityType: data.entityType,
      entityId: data.entityId,
      model: data.model,
      modelVersion: data.modelVersion || '1',
      textHash: data.textHash,
    };
    return this.model.findOneAndUpdate(
      filter,
      { $set: { ...data, dimension: data.vector?.length || data.dimension } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  }

  async search(queryVector: number[], entityType: string, limit = 20, model?: string, modelVersion?: string) {
    if (!queryVector.length) return [];
    const filter: Record<string, any> = { entityType, dimension: queryVector.length };
    if (model) filter.model = model;
    if (modelVersion) filter.modelVersion = modelVersion;
    const candidates = await this.model.find(filter).select('entityId vector metadata model modelVersion updatedAt').limit(2000).lean();
    const queryNorm = Math.sqrt(queryVector.reduce((sum, value) => sum + value * value, 0));
    if (!queryNorm) return [];
    return candidates
      .map((candidate: any) => {
        const vector = candidate.vector || [];
        const norm = Math.sqrt(vector.reduce((sum: number, value: number) => sum + value * value, 0));
        const dot = vector.reduce((sum: number, value: number, index: number) => sum + value * queryVector[index], 0);
        return { entityId: candidate.entityId, similarity: norm ? Math.max(0, Math.min(1, dot / (norm * queryNorm))) : 0, metadata: candidate.metadata || {}, model: candidate.model, modelVersion: candidate.modelVersion, updatedAt: candidate.updatedAt };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, Math.min(Math.max(limit, 1), 100));
  }

  async findAll(filter: any = {}): Promise<AiEmbeddingDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<AiEmbeddingDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<AiEmbedding>): Promise<AiEmbeddingDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<AiEmbeddingDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
