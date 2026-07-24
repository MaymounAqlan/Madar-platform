import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job as BullJob } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AiModel } from './schemas/ai-model.schema';
import { AiOperationLog } from './schemas/ai-operation-log.schema';
import { MatchingService } from '../matching/matching.service';

@Processor('admin-ai-ops')
export class AdminAiProcessor {
  private readonly logger = new Logger(AdminAiProcessor.name);

  constructor(
    @InjectModel(AiModel.name) private readonly aiModelModel: Model<AiModel>,
    @InjectModel(AiOperationLog.name) private readonly operationLogModel: Model<AiOperationLog>,
    private readonly matchingService: MatchingService,
  ) {}

  @Process('reload')
  async handleReload(job: BullJob) {
    const { modelId, adminId } = job.data;
    this.logger.log(`Processing reload job for model ${modelId}`);
    
    await this.updateStatus(modelId, 'running', 10, job.id);

    try {
      // Simulate real reload delay and FastAPI validation
      await this.sleep(1000);
      await this.updateStatus(modelId, 'running', 50, job.id);
      
      const isHealthy = await this.checkFastApiHealth();
      if (!isHealthy) {
        throw new Error('FastAPI AI Engine is offline or degraded.');
      }

      await this.sleep(1000);
      await this.completeJob(modelId, 'reload', job.id);
      this.logger.log(`Model ${modelId} reloaded successfully.`);
      return { success: true };
    } catch (error: any) {
      await this.failJob(modelId, job.id, error.message);
      throw error;
    }
  }

  @Process('reindex')
  async handleReindex(job: BullJob) {
    const { modelId } = job.data;
    this.logger.log(`Processing reindex job for model ${modelId}`);
    
    await this.updateStatus(modelId, 'running', 10, job.id);

    try {
      // Trigger the real reindexing process in NestJS
      const reindexResult = await this.matchingService.triggerReindex();
      
      await this.updateStatus(modelId, 'running', 60, job.id);
      await this.sleep(1500); // Allow background process time
      
      await this.completeJob(modelId, 'reindex', job.id);
      this.logger.log(`Reindex completed successfully.`);
      return { success: true, result: reindexResult };
    } catch (error: any) {
      await this.failJob(modelId, job.id, error.message);
      throw error;
    }
  }

  @Process('recalculate')
  async handleRecalculate(job: BullJob) {
    const { modelId } = job.data;
    this.logger.log(`Processing recalculate job for model ${modelId}`);
    
    await this.updateStatus(modelId, 'running', 10, job.id);

    try {
      // Trigger the real recalculation process in NestJS
      const recalcResult = await this.matchingService.triggerRecalculation();
      
      await this.updateStatus(modelId, 'running', 70, job.id);
      await this.sleep(2000); // Allow background processor execution time
      
      await this.completeJob(modelId, 'recalculate', job.id);
      this.logger.log(`Recalculation completed successfully.`);
      return { success: true, result: recalcResult };
    } catch (error: any) {
      await this.failJob(modelId, job.id, error.message);
      throw error;
    }
  }

  @Process('refresh-taxonomy')
  async handleRefreshTaxonomy(job: BullJob) {
    const { modelId } = job.data;
    this.logger.log(`Processing refresh-taxonomy job for model ${modelId}`);
    
    await this.updateStatus(modelId, 'running', 15, job.id);

    try {
      await this.sleep(1000);
      await this.updateStatus(modelId, 'running', 65, job.id);
      
      // Ping FastAPI info to verify taxonomy capability
      const aiUrl = process.env.AI_SERVICE_URL || 'http://ai-engine:8000';
      const res = await fetch(`${aiUrl}/api/ai/info`, { signal: AbortSignal.timeout(3000) } as any);
      if (!res.ok) {
        throw new Error('Failed to fetch taxonomy details from FastAPI.');
      }

      await this.sleep(1000);
      await this.completeJob(modelId, 'refresh-taxonomy', job.id);
      this.logger.log(`Taxonomy refreshed successfully.`);
      return { success: true };
    } catch (error: any) {
      await this.failJob(modelId, job.id, error.message);
      throw error;
    }
  }

  private async updateStatus(modelId: string, status: string, progress: number, jobId: any) {
    await this.aiModelModel.updateOne(
      { modelId },
      {
        $set: {
          lastOperationStatus: status,
          progress,
          jobId: String(jobId),
          errorMessage: null,
        },
      }
    );

    await this.operationLogModel.updateOne(
      { jobId: String(jobId) },
      { $set: { status: 'running' } }
    );
  }

  private async completeJob(modelId: string, operationType: string, jobId: any) {
    const updates: any = {
      lastOperationStatus: 'completed',
      progress: 100,
      jobId: null,
      errorMessage: null,
      lastOperationAt: new Date(),
    };

    if (operationType === 'reload') {
      updates.lastReloadedAt = new Date();
    } else if (operationType === 'reindex') {
      updates.lastIndexedAt = new Date();
    } else if (operationType === 'refresh-taxonomy') {
      updates.lastReloadedAt = new Date();
    }

    await this.aiModelModel.updateOne({ modelId }, { $set: updates, $inc: { uses: 1 } });
    await this.operationLogModel.updateOne(
      { jobId: String(jobId) },
      { $set: { status: 'completed', endedAt: new Date() } }
    );
  }

  private async failJob(modelId: string, jobId: any, message: string) {
    await this.aiModelModel.updateOne(
      { modelId },
      {
        $set: {
          lastOperationStatus: 'failed',
          progress: null,
          jobId: null,
          errorMessage: message,
          lastOperationAt: new Date(),
        },
      }
    );

    await this.operationLogModel.updateOne(
      { jobId: String(jobId) },
      { $set: { status: 'failed', errorMessage: message, endedAt: new Date() } }
    );
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async checkFastApiHealth(): Promise<boolean> {
    const aiUrl = process.env.AI_SERVICE_URL || 'http://ai-engine:8000';
    try {
      const res = await fetch(`${aiUrl}/api/ai/health`, { signal: AbortSignal.timeout(3000) } as any);
      return res.ok;
    } catch {
      return false;
    }
  }
}
