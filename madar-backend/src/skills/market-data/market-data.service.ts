import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { MarketData, MarketDataDocument } from './schemas/market-data.schema';
import { Job, JobDocument } from '../../jobs/schemas/job.schema';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    @InjectModel(MarketData.name) private readonly model: Model<MarketDataDocument>,
    @InjectModel(Job.name) private readonly jobs: Model<JobDocument>,
  ) {}

  async analyzeTrends(months = 12) {
    const normalizedMonths = Math.min(60, Math.max(1, Number(months) || 12));
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd);
    periodStart.setUTCMonth(periodStart.getUTCMonth() - normalizedMonths);
    const jobs: any[] = await this.jobs.find({
      status: { $in: ['active', 'closed', 'expired'] },
      createdAt: { $gte: periodStart, $lte: periodEnd },
    }).select('title status type level category requirements.requiredSkills aiAnalysis.requiredSkills createdAt').limit(10000).lean();
    const payload = jobs.map((job) => ({
      jobId: String(job._id), title: job.title || '', status: job.status,
      jobType: job.type || '', domain: job.category || '', experienceLevel: job.level || '',
      createdAt: job.createdAt,
      skills: Array.from(new Set([
        ...(job.requirements?.requiredSkills || []).map((skill: any) => skill.name),
        ...(job.aiAnalysis?.requiredSkills || []).map((skill: any) => skill.name),
      ].filter(Boolean))),
    }));
    try {
      const response = await axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/api/ai/market/trends`, {
        jobs: payload, periodStart, periodEnd,
      }, { timeout: Number(process.env.AI_REQUEST_TIMEOUT || 30000) });
      const result = response.data;
      if (result.status === 'complete') await this.persistSkillTrends(result);
      return result;
    } catch (error: any) {
      this.logger.error(`Market AI analysis failed: ${error?.message || error}`);
      throw new BadGatewayException({ code: 'AI_SERVICE_UNAVAILABLE', message: 'Market analysis service is unavailable' });
    }
  }

  private async persistSkillTrends(result: any) {
    const rising = new Map((result.risingSkills || []).map((item: any) => [item.name, Number(item.change || 0)]));
    const declining = new Map((result.decliningSkills || []).map((item: any) => [item.name, Number(item.change || 0)]));
    await Promise.all((result.topSkills || []).map((item: any) => {
      const delta = Number(rising.get(item.name) || declining.get(item.name) || 0);
      return this.model.findOneAndUpdate(
        { skillName: item.name, period: `${result.period.start}/${result.period.end}`, region: 'all' },
        { $set: {
          skill: item.name, skillName: item.name, demandScore: Number(item.share || 0),
          jobCount: Number(item.count || 0), growthRate: delta,
          trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
          demandTrend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable',
          metadata: { sampleSize: result.sampleSize, generatedAt: result.generatedAt, source: 'ai_market_analysis' },
        } }, { upsert: true, new: true },
      );
    }));
  }

  async create(data: Partial<MarketData>): Promise<MarketDataDocument> {
    return this.model.create(data);
  }

  async findAll(filter: any = {}): Promise<MarketDataDocument[]> {
    return this.model.find(filter).exec();
  }

  async findById(id: string): Promise<MarketDataDocument | null> {
    return this.model.findById(id).exec();
  }

  async update(id: string, data: Partial<MarketData>): Promise<MarketDataDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<MarketDataDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
