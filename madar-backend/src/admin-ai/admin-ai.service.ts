import { Injectable, OnModuleInit, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AiModel, AiModelDocument } from './schemas/ai-model.schema';
import { AiOperationLog, AiOperationLogDocument } from './schemas/ai-operation-log.schema';
import { UpdateModelSettingsDto } from './dto/update-model-settings.dto';
import { AuditLog } from '../common/audit-logs/schemas/audit-log.schema';
import { User } from '../users/schemas/user.schema';
import { exec } from 'child_process';

@Injectable()
export class AdminAiService implements OnModuleInit {
  private readonly logger = new Logger(AdminAiService.name);

  constructor(
    @InjectModel(AiModel.name) private readonly aiModelModel: Model<AiModelDocument>,
    @InjectModel(AiOperationLog.name) private readonly operationLogModel: Model<AiOperationLogDocument>,
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLog>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectQueue('admin-ai-ops') private readonly adminAiOpsQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.seedModels();
  }

  private async seedModels() {
    const defaultModels = [
      {
        modelId: 'embedding-model',
        name: 'Embedding Generator (all-MiniLM-L6-v2)',
        nameAr: 'منشئ ومولد التضمينات (all-MiniLM-L6-v2)',
        type: 'embeddings',
        availabilityStatus: 'active',
        lastOperationStatus: 'idle',
        version: '1.0.0',
        accuracy: null,
        uses: 4520,
        supportedActions: ['reload', 'reindex'],
        settings: {
          embeddingModel: 'all-MiniLM-L6-v2',
        },
      },
      {
        modelId: 'cv-parser',
        name: 'Bilingual CV Parser',
        nameAr: 'محلل ومستخلص السير الذاتية ثنائي اللغة',
        type: 'NLP',
        availabilityStatus: 'active',
        lastOperationStatus: 'idle',
        version: '1.0.0',
        accuracy: null,
        uses: 1250,
        supportedActions: ['reload'],
        settings: {
          timeoutMs: 5000,
        },
      },
      {
        modelId: 'skill-extractor',
        name: 'Bilingual Skill Extractor & Taxonomy',
        nameAr: 'مستخرج المهارات وقاموس التصنيفات',
        type: 'NLP',
        availabilityStatus: 'active',
        lastOperationStatus: 'idle',
        version: '1.0.0',
        accuracy: null,
        uses: 2890,
        supportedActions: ['reload', 'refresh-taxonomy'],
        settings: {
          confidenceThreshold: 0.3,
        },
      },
      {
        modelId: 'job-student-matcher',
        name: 'Job-Student Matcher Engine',
        nameAr: 'محرك مطابقة الطلاب بالفرص الوظيفية',
        type: 'matching',
        availabilityStatus: 'active',
        lastOperationStatus: 'idle',
        version: '2.0.0',
        accuracy: 88.4,
        uses: 9240,
        supportedActions: ['recalculate'],
        settings: {
          matchThreshold: 70,
        },
      },
      {
        modelId: 'curriculum-gap-analyzer',
        name: 'Curriculum Gap Analyzer',
        nameAr: 'محلل فجوة ومواءمة المناهج الأكاديمية',
        type: 'NLP',
        availabilityStatus: 'active',
        lastOperationStatus: 'idle',
        version: '1.0.0',
        accuracy: null,
        uses: 350,
        supportedActions: ['reload'],
        settings: {
          timeoutMs: 5000,
        },
      },
    ];

    for (const m of defaultModels) {
      await this.aiModelModel.findOneAndUpdate(
        { modelId: m.modelId },
        { $setOnInsert: m },
        { upsert: true, new: true }
      );
    }
    this.logger.log('AI models initialized/seeded successfully.');
  }

  async getAIModels(): Promise<AiModel[]> {
    // Check FastAPI health and update availability status accordingly
    const isFastApiHealthy = await this.checkFastApiHealth();
    let models = await this.aiModelModel.find().lean();
    
    if (!models || models.length === 0) {
      await this.seedModels();
      models = await this.aiModelModel.find().lean();
    }

    // Update availability dynamically based on FastAPI status, respecting explicit 'inactive' DB status
    const mappedModels = models.map(m => {
      if (m.availabilityStatus === 'inactive') {
        return m;
      }
      const status = isFastApiHealthy ? 'active' : 'offline';
      return {
        ...m,
        availabilityStatus: status,
      };
    });

    return mappedModels as any;
  }

  async getAIModelById(modelId: string): Promise<AiModel> {
    let model = await this.aiModelModel.findOne({ modelId }).lean();
    if (!model) {
      await this.seedModels();
      model = await this.aiModelModel.findOne({ modelId }).lean();
    }
    if (!model) {
      throw new NotFoundException(`AI model with ID ${modelId} not found`);
    }
    const isFastApiHealthy = await this.checkFastApiHealth();
    return {
      ...model,
      availabilityStatus: isFastApiHealthy ? 'active' : 'offline',
    } as any;
  }

  async updateSettings(adminId: string, modelId: string, settingsDto: UpdateModelSettingsDto): Promise<AiModel> {
    let model = await this.aiModelModel.findOne({ modelId });
    if (!model) {
      await this.seedModels();
      model = await this.aiModelModel.findOne({ modelId });
    }

    if (!model) {
      model = await this.aiModelModel.create({
        modelId,
        name: modelId,
        nameAr: modelId,
        type: 'AI Model',
        availabilityStatus: 'active',
        lastOperationStatus: 'idle',
        version: '1.0.0',
        uses: 0,
        settings: settingsDto,
      });
    } else {
      const before = JSON.parse(JSON.stringify(model.settings || {}));
      model.settings = {
        ...model.settings,
        ...settingsDto,
      };
      model.version = this.incrementPatchVersion(model.version || '1.0.0');
      await model.save();
    }

    const adminUser = await this.userModel.findById(adminId).lean();
    await this.logAudit(
      'UPDATE_MODEL_SETTINGS',
      adminId,
      adminUser?.email || 'admin@madar.sa',
      'ai_model',
      modelId,
      `Updated settings for AI model ${modelId}`,
      {},
      model.settings
    );

    return model;
  }

  async triggerAction(adminId: string, modelId: string, action: string): Promise<any> {
    const model = await this.aiModelModel.findOne({ modelId });
    if (!model) {
      throw new NotFoundException(`AI model with ID ${modelId} not found`);
    }

    if (!model.supportedActions.includes(action)) {
      throw new BadRequestException(`Action ${action} is not supported by AI model ${modelId}`);
    }

    // Create background job
    const job = await this.adminAiOpsQueue.add(action, {
      modelId,
      adminId,
      action,
    }, { priority: 1 });

    const adminUser = await this.userModel.findById(adminId).lean();

    // Create operation log
    const log = await this.operationLogModel.create({
      actorId: new Types.ObjectId(adminId),
      actorEmail: adminUser?.email || 'admin@madar.sa',
      modelId,
      operationType: action,
      status: 'queued',
      jobId: String(job.id),
      startedAt: new Date(),
    });

    // Update model status
    model.lastOperationStatus = 'queued';
    model.jobId = String(job.id);
    model.progress = 0;
    model.errorMessage = null;
    model.lastOperationAt = new Date();
    await model.save();

    await this.logAudit(
      `AI_MODEL_${action.toUpperCase().replace('-', '_')}`,
      adminId,
      adminUser?.email || 'admin@madar.sa',
      'ai_model',
      modelId,
      `Queued operation ${action} on AI model ${modelId} (Job ID: ${job.id})`
    );

    return {
      message: `Operation ${action} queued successfully.`,
      jobId: job.id,
      status: 'queued',
    };
  }

  async getModelStatus(modelId: string): Promise<any> {
    const model = await this.aiModelModel.findOne({ modelId }).lean();
    if (!model) {
      throw new NotFoundException(`AI model with ID ${modelId} not found`);
    }

    const logs = await this.operationLogModel
      .find({ modelId })
      .sort({ startedAt: -1 })
      .limit(10)
      .lean();

    return {
      modelId,
      availabilityStatus: model.availabilityStatus,
      lastOperationStatus: model.lastOperationStatus,
      progress: model.progress,
      jobId: model.jobId,
      errorMessage: model.errorMessage,
      history: logs,
    };
  }

  async startAllAiServices(adminId: string): Promise<any> {
    try {
      await this.adminAiOpsQueue.resume();
    } catch (e) {}

    await this.aiModelModel.updateMany({}, { $set: { availabilityStatus: 'active', lastOperationStatus: 'idle' } });
    
    // Spawn python process
    exec('start /B cmd.exe /c "cd ../madar-ai && .venv\\Scripts\\python.exe main.py"', (error) => {
      if (error) {
        this.logger.error('Failed to start AI service process', error);
      }
    });
    
    const count = await this.aiModelModel.countDocuments();
    if (count === 0) {
      await this.seedModels();
    }

    const adminUser = await this.userModel.findById(adminId).lean();
    await this.logAudit(
      'START_ALL_AI_SERVICES',
      adminId,
      adminUser?.email || 'admin@madar.sa',
      'ai_service',
      'all',
      'Started all AI services, queues, and models.'
    );

    return {
      success: true,
      status: 'active',
      message: 'All AI services, background queues, and models started successfully.'
    };
  }

  async stopAllAiServices(adminId: string): Promise<any> {
    try {
      await this.adminAiOpsQueue.pause();
    } catch (e) {}

    await this.aiModelModel.updateMany({}, { $set: { availabilityStatus: 'inactive', lastOperationStatus: 'idle' } });

    // Kill python process on port 8000
    exec('for /f "tokens=5" %a in (\'netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"\') do taskkill /f /pid %a', (error) => {
      if (error) {
        this.logger.error('Failed to stop AI service process or process not found', error);
      }
    });

    const adminUser = await this.userModel.findById(adminId).lean();
    await this.logAudit(
      'STOP_ALL_AI_SERVICES',
      adminId,
      adminUser?.email || 'admin@madar.sa',
      'ai_service',
      'all',
      'Stopped all AI services, queues, and models.'
    );

    return {
      success: true,
      status: 'inactive',
      message: 'All AI services, background queues, and models stopped.'
    };
  }

  async getOperationLogs(modelId?: string): Promise<AiOperationLog[]> {
    const filter = modelId ? { modelId } : {};
    return this.operationLogModel.find(filter).sort({ startedAt: -1 }).limit(100).lean();
  }

  private incrementPatchVersion(version: string): string {
    const parts = version.split('.');
    if (parts.length === 3) {
      const patch = parseInt(parts[2], 10) + 1;
      return `${parts[0]}.${parts[1]}.${patch}`;
    }
    return version + '.1';
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

  private async logAudit(
    action: string,
    actorId: string,
    actorEmail: string,
    resource: string,
    resourceId: string,
    description: string,
    before?: any,
    after?: any
  ) {
    try {
      await this.auditLogModel.create({
        actorId: new Types.ObjectId(actorId),
        userId: new Types.ObjectId(actorId),
        action,
        resource,
        resourceId,
        description,
        before,
        after,
        severity: 'info',
        timestamp: new Date(),
      });
    } catch (err: any) {
      this.logger.error(`Failed to write AI audit log: ${err.message}`);
    }
  }
}
