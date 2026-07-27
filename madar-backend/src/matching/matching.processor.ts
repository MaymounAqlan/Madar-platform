import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job as BullJob } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MatchResult } from './match-results/schemas/match-result.schema';
import { Recommendation } from './recommendations/schemas/recommendation.schema';
import { Application } from '../applications/schemas/application.schema';
import { Student } from '../students/schemas/student.schema';
import { Job } from '../jobs/schemas/job.schema';
import { PlatformSettingsService } from '../platform-settings/platform-settings.service';
import { AiEmbedding } from './ai-embeddings/schemas/ai-embedding.schema';
import { MarketDataService } from '../skills/market-data/market-data.service';

/**
 * FR-AI-014: Async Message Queue Processor
 * Processes AI matching, reindexing, and recalculation jobs asynchronously via Redis/Bull queue
 */
@Processor('ai-matching')
export class MatchingProcessor {
  private readonly logger = new Logger(MatchingProcessor.name);

  constructor(
    @InjectModel(MatchResult.name) private matchResultModel: Model<MatchResult>,
    @InjectModel(Recommendation.name) private recommendationModel: Model<Recommendation>,
    @InjectModel(Application.name) private applicationModel: Model<Application>,
    @InjectModel(Student.name) private studentModel: Model<Student>,
    @InjectModel(Job.name) private jobModel: Model<Job>,
    @InjectModel(AiEmbedding.name) private aiEmbeddingModel: Model<AiEmbedding>,
    private readonly platformSettingsService: PlatformSettingsService,
    private readonly marketDataService: MarketDataService,
  ) {}

  @Process('analyze-job')
  async handleAnalyzeJob(task: BullJob) {
    const { jobId, companyId, requestedBy } = task.data;
    const jobDoc: any = await this.jobModel.findById(jobId).lean();
    if (!jobDoc) throw new Error('Job not found');
    await task.progress(10);
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const jobAnalysisText = [
      jobDoc.description,
      jobDoc.summary,
      ...(jobDoc.responsibilities || []),
      ...(jobDoc.requirements?.requiredSkills || []).map((skill: any) => skill.name),
      ...(jobDoc.requirements?.preferredSkills || []).map((skill: any) => skill.name),
    ].filter(Boolean).join('\n');
    const response = await fetch(`${aiServiceUrl}/api/ai/jobs/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: jobDoc.title, description: jobAnalysisText }),
      signal: AbortSignal.timeout(Math.max(5000, Number(process.env.AI_REQUEST_TIMEOUT || 30000))),
    });
    if (!response.ok) throw new Error(`AI job analysis returned ${response.status}`);
    const payload: any = await response.json();
    const analysis = payload.data || payload;
    await task.progress(60);
    await this.jobModel.findByIdAndUpdate(jobId, {
      $set: {
        'aiAnalysis.embedding': analysis.embedding || [],
        'aiAnalysis.skillVector': analysis.embedding || [],
        'aiAnalysis.contentHash': analysis.contentHash,
        'aiAnalysis.embeddingModel': analysis.embeddingModel,
        'aiAnalysis.requiredSkills': analysis.requiredSkills || [],
        'aiAnalysis.preferredSkills': analysis.preferredSkills || [],
        'aiAnalysis.toolsAndTechnologies': analysis.toolsAndTechnologies || [],
        'aiAnalysis.keywords': analysis.keywords || [],
        'aiAnalysis.domains': analysis.domains || [],
        'aiAnalysis.responsibilities': analysis.responsibilities || [],
        'aiAnalysis.minimumExperienceYears': analysis.minimumExperienceYears || 0,
        'aiAnalysis.educationLevel': analysis.educationLevel || null,
        'aiAnalysis.lastUpdated': new Date(),
        'aiAnalysis.version': analysis.modelVersion || '1',
      },
    });
    if (Array.isArray(analysis.embedding) && analysis.embedding.length) {
      await this.aiEmbeddingModel.findOneAndUpdate(
        { entityType: 'job', entityId: new Types.ObjectId(jobId), model: analysis.embeddingModel, modelVersion: analysis.modelVersion || '1', textHash: analysis.contentHash },
        { $set: { vector: analysis.embedding, dimension: analysis.embedding.length, metadata: { companyId, title: jobDoc.title } } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }
    await task.progress(90);
    await task.queue.add('batch-match-job', { jobId, companyId, requestedBy }, {
      jobId: `batch-match-${jobId}-${analysis.contentHash?.slice(0, 12) || 'current'}`,
      attempts: Math.max(1, Number(process.env.AI_MAX_RETRIES || 3)),
      backoff: { type: 'exponential', delay: 5000 },
      timeout: Math.max(5000, Number(process.env.AI_JOB_TIMEOUT || 120000)),
    });
    await task.queue.add('analyze-market', { requestedBy, sourceJobId: jobId }, {
      jobId: `market-${jobId}-${analysis.contentHash?.slice(0, 12) || 'current'}`,
      attempts: Math.max(1, Number(process.env.AI_MAX_RETRIES || 3)),
      backoff: { type: 'exponential', delay: 5000 },
      timeout: Math.max(5000, Number(process.env.AI_JOB_TIMEOUT || 120000)),
    });
    await task.progress(100);
    return { success: true, jobId, contentHash: analysis.contentHash, modelVersion: analysis.modelVersion || '1' };
  }

  @Process('analyze-market')
  async handleAnalyzeMarket(task: BullJob) {
    await task.progress(10);
    const result = await this.marketDataService.analyzeTrends();
    await task.progress(100);
    return { success: true, sourceJobId: task.data.sourceJobId, result };
  }

  @Process('calculate-match')
  async handleCalculateMatch(job: BullJob) {
    const { studentId, jobId, companyId } = job.data;
    this.logger.log(`Processing match calculation: student=${studentId}, job=${jobId}`);

    try {
      const student = await this.studentModel.findById(studentId).lean();
      const jobDoc = await this.jobModel.findById(jobId).lean();

      if (!student || !jobDoc) {
        throw new Error('Student or job not found');
      }

      // Fetch the active AI configuration
      const activeConfig = await this.platformSettingsService.getActiveAiConfig();

      // Call AI service with active weights & thresholds
      const matchResult = await this.callAIService(student, jobDoc, activeConfig);

      // Store result along with configurationVersion
      const mappedResult = this.mapAiMatchResult(matchResult, studentId, jobId, companyId);
      mappedResult.metadata = {
        ...mappedResult.metadata,
        configurationVersion: String(activeConfig.version),
      };

      await this.matchResultModel.findOneAndUpdate(
        { student: new Types.ObjectId(studentId), job: new Types.ObjectId(jobId) },
        { $set: mappedResult },
        { upsert: true, new: true },
      );

      // Update the Application document if it exists, so the frontend sees the new score
      await this.applicationModel.findOneAndUpdate(
        { studentId: new Types.ObjectId(studentId), jobId: new Types.ObjectId(jobId) },
        { 
          $set: { 
            'matchSnapshot.matchScore': matchResult.scores?.overall || matchResult.overallScore,
            'matchSnapshot.skillMatch': matchResult.scores?.skill || matchResult.skillScore,
            'matchSnapshot.experienceMatch': matchResult.scores?.experience || matchResult.experienceScore,
            'matchSnapshot.educationMatch': matchResult.scores?.education || matchResult.educationScore,
            'matchSnapshot.calculatedAt': new Date()
          } 
        }
      );

      this.logger.log(`Match calculation completed: score=${matchResult.scores?.overall || matchResult.overallScore}`);
      return { success: true, matchScore: matchResult.scores?.overall || matchResult.overallScore };
    } catch (error: any) {
      this.logger.error(`Match calculation failed: ${error.message}`);
      throw error;
    }
  }

  @Process('batch-match-job')
  async handleBatchMatchJob(job: BullJob) {
    const { jobId, companyId } = job.data;
    this.logger.log(`Processing batch match for job=${jobId}`);

    try {
      await job.progress(5);
      const jobDoc = await this.jobModel.findById(jobId).lean();
      if (!jobDoc) {
        throw new Error('Job not found');
      }

      const activeConfig = await this.platformSettingsService.getActiveAiConfig();
      const students = await this.studentModel.find({
        'privacySettings.allowCompanySearch': { $ne: false },
      }).limit(500).lean();

      const results = [];
      const batchSize = 50;

      for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        try {
          const batchResult = await this.callAIBatchService(batch, jobDoc, activeConfig);
          
          if (batchResult.results && Array.isArray(batchResult.results)) {
            for (const item of batchResult.results) {
              if (item.match && !item.error) {
                const mapped = this.mapAiMatchResult(item.match, item.studentId, jobId, companyId);
                mapped.metadata = {
                  ...mapped.metadata,
                  configurationVersion: String(activeConfig.version),
                };
                results.push(mapped);
              } else {
                this.logger.warn(`AI matching failed for student ${item.studentId}: ${item.error}`);
              }
            }
          }
        } catch (e: any) {
          this.logger.error(`Batch processing failed for chunk ${i}: ${e.message}`);
        }
        await job.progress(10 + Math.round(((i + batch.length) / Math.max(students.length, 1)) * 75));
      }

      // Bulk upsert
      const bulkOps = results.map(r => ({
        updateOne: {
          filter: { student: r.student, job: r.job },
          update: { $set: r },
          upsert: true,
        },
      }));

      if (bulkOps.length > 0) {
        await this.matchResultModel.bulkWrite(bulkOps);
      }

      await job.progress(100);
      this.logger.log(`Batch match completed: ${results.length} students processed`);
      return { success: true, processedCount: results.length };
    } catch (error: any) {
      this.logger.error(`Batch match failed: ${error.message}`);
      throw error;
    }
  }

  @Process('generate-recommendations')
  async handleGenerateRecommendations(job: BullJob) {
    const { studentId } = job.data;
    this.logger.log(`Generating recommendations for student=${studentId}`);

    try {
      const student: any = await this.studentModel.findOne({
        $or: [{ _id: new Types.ObjectId(studentId) }, { userId: new Types.ObjectId(studentId) }],
      }).lean();
      if (!student) throw new Error('Student not found');
      const topMatches = await this.matchResultModel
        .find({ student: student._id })
        .sort({ overallScore: -1 })
        .limit(10)
        .lean();

      const recommendations = topMatches.filter((match: any) => match.job).map((match: any) => ({
        updateOne: {
          filter: { student: student._id, job: match.job, type: 'job' },
          update: { $set: {
            title: `Job match: ${match.overallScore || 0}% match`,
            titleAr: `تطابق وظيفي: ${match.overallScore || 0}%`,
            description: match.recommendation?.reasoning || 'Based on your profile analysis',
            descriptionAr: 'بناءً على تحليل ملفك الشخصي',
            relevanceScore: match.overallScore || 0,
            metadata: {
              relatedJobId: String(match.job),
              matchingSkills: match.skillMatches || [],
              missingSkills: match.missingSkills || [],
              modelVersion: match.modelVersion || null,
            },
            dismissed: false,
          } },
          upsert: true,
        },
      }));

      if (recommendations.length > 0) {
        await this.recommendationModel.bulkWrite(recommendations as any);
      }

      this.logger.log(`Generated ${recommendations.length} recommendations`);
      return { success: true, count: recommendations.length };
    } catch (error: any) {
      this.logger.error(`Recommendation generation failed: ${error.message}`);
      throw error;
    }
  }

  @Process('reindex')
  async handleReindex(job: BullJob) {
    this.logger.log(`Starting global AI Reindex job`);
    try {
      // Clear cached embeddings for students
      const students = await this.studentModel.find().lean();
      for (const s of students) {
        await this.studentModel.findByIdAndUpdate(s._id, { $unset: { 'embeddings.combinedVector': 1 } });
      }
      // Clear cached embeddings for jobs
      const jobs = await this.jobModel.find().lean();
      for (const j of jobs) {
        await this.jobModel.findByIdAndUpdate(j._id, { $unset: { 'aiAnalysis.skillVector': 1, 'aiAnalysis.embedding': 1 } });
      }
      this.logger.log(`AI Reindex job completed. Cleared embeddings for ${students.length} students and ${jobs.length} jobs.`);
      return { success: true, studentsCount: students.length, jobsCount: jobs.length };
    } catch (e: any) {
      this.logger.error(`Reindex job failed: ${e.message}`);
      throw e;
    }
  }

  @Process('recalculate-all')
  async handleRecalculateAll(job: BullJob) {
    this.logger.log(`Starting global AI Recalculation job`);
    try {
      const activeJobs = await this.jobModel.find({
        status: 'active',
        $or: [
          { 'applicationSettings.deadline': { $exists: false } },
          { 'applicationSettings.deadline': null },
          { 'applicationSettings.deadline': { $gte: new Date() } },
        ],
      }).lean();
      const students = await this.studentModel.find({ 'privacySettings.allowCompanySearch': { $ne: false } }).lean();

      let count = 0;
      for (const j of activeJobs) {
        for (const s of students) {
          try {
            await this.handleCalculateMatch({
              data: { studentId: s._id.toString(), jobId: j._id.toString(), companyId: j.companyId?.toString() }
            } as any);
            count++;
          } catch (err: any) {
            this.logger.warn(`Failed matching student ${s._id} with job ${j._id}: ${err.message}`);
          }
        }
      }
      this.logger.log(`AI Recalculation job completed: processed ${count} matches`);
      return { success: true, matchesCount: count };
    } catch (e: any) {
      this.logger.error(`Recalculation job failed: ${e.message}`);
      throw e;
    }
  }

  private async callAIBatchService(students: any[], job: any, config: any): Promise<any> {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    const matches = students.map(student => ({
      studentId: student._id?.toString(),
      jobId: job._id?.toString(),
      studentSkills: student.skills?.map((s: any) => ({ name: s.name, level: Math.max(0, Math.min(1, Number(s.proficiency || 0) / 100)) })) || [],
      studentEmbedding: student.embeddings?.combinedVector || [],
      jobRequiredSkills: (job as any).requirements?.requiredSkills?.map((s: any) => ({
        name: s.name,
        weight: s.weight || 1.0,
        required: true,
        requiredLevel: ({ beginner: 0.25, intermediate: 0.5, advanced: 0.75, expert: 1 } as any)[s.level] || 0.5,
      })) || [],
      jobEmbedding: (job as any).aiAnalysis?.embedding || (job as any).aiAnalysis?.skillVector || [],
      jobExperienceRequired: Number((job as any).requirements?.experience?.minYears || 0),
      studentExperienceYears: this.calculateExperienceYears(student.experiences || []),
      studentProjects: (student.projects || []).map((project: any) => [project.title, project.description, ...(project.technologies || [])].filter(Boolean).join(' ')),
      jobProjectsHint: (job as any).aiAnalysis?.keywords || [],
    }));

    const response = await fetch(`${aiServiceUrl}/api/ai/matching/batch-calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matches }),
    });

    if (!response.ok) {
      throw new Error(`AI batch service returned ${response.status}`);
    }
    return response.json();
  }

  private async callAIService(student: any, job: any, config: any): Promise<any> {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';

    const response = await fetch(`${aiServiceUrl}/api/ai/matching/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: student._id?.toString(),
        jobId: job._id?.toString(),
        studentSkills: student.skills?.map((s: any) => ({ name: s.name, level: Math.max(0, Math.min(1, Number(s.proficiency || 0) / 100)) })) || [],
        studentEmbedding: student.embeddings?.combinedVector || [],
        jobRequiredSkills: (job as any).requirements?.requiredSkills?.map((s: any) => ({
          name: s.name,
          weight: s.weight || 1.0,
          required: true,
          requiredLevel: ({ beginner: 0.25, intermediate: 0.5, advanced: 0.75, expert: 1 } as any)[s.level] || 0.5,
        })) || [],
        jobEmbedding: (job as any).aiAnalysis?.embedding || (job as any).aiAnalysis?.skillVector || [],
        jobExperienceRequired: Number((job as any).requirements?.experience?.minYears || 0),
        studentExperienceYears: this.calculateExperienceYears(student.experiences || []),
        studentProjects: (student.projects || []).map((project: any) => [project.title, project.description, ...(project.technologies || [])].filter(Boolean).join(' ')),
        jobProjectsHint: (job as any).aiAnalysis?.keywords || [],
        weights: {
          skills: config.skillsWeight,
          experience: config.experienceWeight,
          projects: config.projectsWeight,
          interests: config.interestsWeight,
        },
        thresholds: {
          excellent: config.highMatchThreshold,
          good: 70,
          fair: config.recommendationThreshold,
        }
      }),
      signal: AbortSignal.timeout(Math.max(5000, Number(process.env.AI_REQUEST_TIMEOUT || 30000))),
    });

    if (!response.ok) {
      throw new Error(`AI service returned ${response.status}`);
    }

    const result = await response.json();
    return result.data || result;
  }

  private mapAiMatchResult(result: any, studentId: string, jobId: string, companyId?: string): any {
    const breakdown = result.breakdown || {};
    const skills = breakdown.skillsMatch || {};
    const experience = breakdown.experienceMatch || {};
    const projects = breakdown.projectsMatch || {};
    const semantic = breakdown.semanticMatch || {};
    const overallScore = Math.round(result.overallScore || result.scores?.overall || 0);
    const missingSkills = (result.missingSkills || []).map((skill: any) => ({
      name: skill.name || skill.skillName || String(skill),
      importance: skill.importance || 'medium',
      learningResource: skill.learningResource,
    }));
    const skillMatches = (result.matchingSkills || skills.details || []).map((skill: any) => ({
      name: skill.name || skill.skillName || String(skill),
      studentLevel: skill.studentLevel || 0,
      matchPercentage: skill.matchPercentage || 0,
    }));

    return {
      student: new Types.ObjectId(studentId),
      job: new Types.ObjectId(jobId),
      jobId: new Types.ObjectId(jobId),
      company: companyId ? new Types.ObjectId(companyId) : undefined,
      overallScore,
      skillScore: Math.round(skills.score || result.skillScore || 0),
      experienceScore: Math.round(experience.score || result.experienceScore || 0),
      educationScore: Math.round(result.educationScore || 0),
      semanticScore: Math.round(semantic.score || result.semanticScore || 0),
      factorBreakdown: breakdown,
      skillMatches,
      missingSkills,
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [result.recommendation].filter(Boolean),
      acceptanceProbability: result.acceptanceProbability || { score: 0, confidence: 0, method: 'insufficient_data', factors: [] },
      scores: {
        overall: overallScore,
        skill: Math.round(skills.score || 0),
        experience: Math.round(experience.score || 0),
        education: Math.round(result.educationScore || 0),
        semantic: Math.round(semantic.score || 0),
      },
      recommendation: {
        reasoning: result.explanation?.summary || (typeof result.recommendation === 'string' ? result.recommendation : result.recommendation?.reasoning || ''),
        actions: result.explanation?.improvementActions || missingSkills.map((skill: any) => `Improve ${skill.name}`),
      },
      explanation: result.explanation || {},
      mandatorySkillsPenalty: Number(result.mandatorySkillsPenalty || 0),
      modelVersion: result.modelVersion || 'unknown',
      calculatedAt: new Date(),
    };
  }

  private calculateExperienceYears(experiences: any[]): number {
    const milliseconds = experiences.reduce((total, item) => {
      const start = item.startDate ? new Date(item.startDate).getTime() : NaN;
      const end = item.isCurrent ? Date.now() : item.endDate ? new Date(item.endDate).getTime() : NaN;
      return Number.isFinite(start) && Number.isFinite(end) && end > start ? total + (end - start) : total;
    }, 0);
    return Math.round((milliseconds / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10;
  }
}
