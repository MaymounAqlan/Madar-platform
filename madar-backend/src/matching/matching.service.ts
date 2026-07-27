import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Model, Types } from 'mongoose';
import { Student, StudentDocument } from '../students/schemas/student.schema';
import { Job, JobDocument } from '../jobs/schemas/job.schema';
import { Skill, SkillDocument } from '../skills/schemas/skill.schema';
import { Application, ApplicationDocument } from '../applications/schemas/application.schema';
import { MatchResult as MatchResultModel, MatchResultDocument } from './match-results/schemas/match-result.schema';

interface MatchCalculationResult {
  score: number;
  skillMatches: Array<{
    skill: string;
    studentLevel: number;
    requiredLevel: number;
    matchPercent: number;
  }>;
  missingSkills: string[];
  recommendations: string[];
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectModel(Student.name) private studentModel: Model<StudentDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Skill.name) private skillModel: Model<SkillDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(MatchResultModel.name) private matchResultModel: Model<MatchResultDocument>,
    @InjectQueue('ai-matching') private readonly matchingQueue: Queue,
  ) {}

  /**
   * FR-AI-014: Enqueue async match calculation
   */
  async enqueueMatchCalculation(studentId: string, jobId: string, companyId?: string, requestedBy?: string): Promise<any> {
    const job = await this.addQueueJob('calculate-match', {
      studentId,
      jobId,
      companyId: companyId || null,
      requestedBy: requestedBy || studentId,
    }, this.taskOptions(`match-${studentId}-${jobId}`, 1));
    return { jobId: job.id, status: 'queued', message: 'Match calculation queued' };
  }

  /**
   * FR-AI-014: Enqueue batch match for new job posting
   */
  async enqueueBatchMatchForJob(jobId: string, companyId: string, requestedBy?: string): Promise<any> {
    const job = await this.addQueueJob('batch-match-job', {
      jobId,
      companyId,
      requestedBy: requestedBy || companyId,
    }, { ...this.taskOptions(`batch-match-${jobId}`, 2), delay: 1000 });
    return { jobId: job.id, status: 'queued', message: 'Batch match queued for all students' };
  }

  async enqueueJobAnalysis(jobId: string, companyId: string, requestedBy: string): Promise<any> {
    const job = await this.addQueueJob(
      'analyze-job',
      { jobId, companyId, requestedBy },
      this.taskOptions(`analyze-job-${jobId}`, 1),
    );
    return { jobId: job.id, status: 'queued', message: 'Job analysis queued' };
  }

  /**
   * FR-AI-014: Enqueue recommendation generation
   */
  async enqueueRecommendationGeneration(studentId: string, requestedBy?: string): Promise<any> {
    const job = await this.addQueueJob('generate-recommendations', {
      studentId,
      requestedBy: requestedBy || studentId,
    }, this.taskOptions(`recommend-${studentId}`, 3));
    return { jobId: job.id, status: 'queued', message: 'Recommendation generation queued' };
  }

  async triggerReindex(): Promise<any> {
    const job = await this.addQueueJob('reindex', {}, { priority: 1 });
    return { jobId: job.id, status: 'queued', message: 'Reindexing background job queued' };
  }

  async triggerRecalculation(): Promise<any> {
    const job = await this.addQueueJob('recalculate-all', {}, { priority: 2 });
    return { jobId: job.id, status: 'queued', message: 'Recalculation background job queued' };
  }

  async getTaskStatus(taskId: string, requesterId: string, role: string): Promise<any> {
    const task = await this.matchingQueue.getJob(taskId);
    if (!task) throw new NotFoundException('AI task not found');
    if (!['admin', 'super_admin'].includes(role) && task.data?.requestedBy !== requesterId) {
      throw new ForbiddenException('You cannot access this AI task');
    }
    const state = await task.getState();
    const mappedState = state === 'active' ? 'processing' : state === 'completed' ? 'completed' : state === 'failed' ? 'failed' : task.attemptsMade > 0 ? 'retrying' : 'queued';
    return {
      jobId: String(task.id),
      type: task.name,
      status: mappedState,
      progress: await task.progress(),
      attemptsMade: task.attemptsMade,
      maxAttempts: task.opts.attempts || 1,
      createdAt: task.timestamp ? new Date(task.timestamp) : null,
      processedAt: task.processedOn ? new Date(task.processedOn) : null,
      finishedAt: task.finishedOn ? new Date(task.finishedOn) : null,
      failedReason: task.failedReason || null,
      result: mappedState === 'completed' ? task.returnvalue : null,
    };
  }

  async retryTask(taskId: string, requesterId: string, role: string): Promise<any> {
    const task = await this.matchingQueue.getJob(taskId);
    if (!task) throw new NotFoundException('AI task not found');
    if (!['admin', 'super_admin'].includes(role) && task.data?.requestedBy !== requesterId) {
      throw new ForbiddenException('You cannot retry this AI task');
    }
    if ((await task.getState()) !== 'failed') throw new BadRequestException('Only failed AI tasks can be retried');
    await task.retry();
    return this.getTaskStatus(taskId, requesterId, role);
  }

  private taskOptions(jobId: string, priority: number) {
    return {
      jobId,
      priority,
      attempts: Math.max(1, Number(process.env.AI_MAX_RETRIES || 3)),
      backoff: { type: 'exponential' as const, delay: 5000 },
      timeout: Math.max(5000, Number(process.env.AI_JOB_TIMEOUT || 120000)),
      removeOnComplete: 100,
      removeOnFail: 100,
    };
  }

  private async addQueueJob(name: string, data: Record<string, any>, options: Record<string, any>) {
    try {
      return await this.matchingQueue.add(name, data, options);
    } catch (error: any) {
      this.logger.error(`Unable to enqueue AI task ${name}: ${error?.message || error}`);
      throw new ServiceUnavailableException({ code: 'AI_QUEUE_UNAVAILABLE', message: 'AI task queue is unavailable' });
    }
  }

  async calculateMatchScore(jobId: string, studentId: string): Promise<MatchCalculationResult> {
    const [job, student] = await Promise.all([
      this.jobModel.findById(new Types.ObjectId(jobId)).lean(),
      this.studentModel.findOne({ $or: [{ _id: new Types.ObjectId(studentId) }, { userId: new Types.ObjectId(studentId) }] }).lean(),
    ]);

    if (!job) throw new NotFoundException('Job not found');
    if (!student) throw new NotFoundException('Student not found');

    const studentSkills = new Map(
      (student.skills || []).map((s: any) => [s.name.toLowerCase(), s.proficiency || 1])
    );
    const requiredSkills = (job as any).requirements?.requiredSkills || [];

    const skillMatches: MatchCalculationResult['skillMatches'] = [];
    const missingSkills: string[] = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const req of requiredSkills) {
      const skillName = req.name.toLowerCase();
      const weight = req.weight || 1;
      totalWeight += weight;

      const studentLevel = studentSkills.get(skillName) || 0;
      const requiredLevel = 3;

      const matchPercent = Math.min(100, (studentLevel / requiredLevel) * 100);
      totalWeightedScore += matchPercent * weight;

      skillMatches.push({
        skill: req.name,
        studentLevel,
        requiredLevel,
        matchPercent: Math.round(matchPercent),
      });

      if (studentLevel < requiredLevel) {
        missingSkills.push(req.name);
      }
    }

    const baseScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    const bonusPoints = this.calculateBonusPoints(job, student);
    const finalScore = Math.min(100, Math.round(baseScore + bonusPoints));

    return {
      score: finalScore,
      skillMatches,
      missingSkills,
      recommendations: this.generateRecommendations(missingSkills),
    };
  }

  async getTopMatchedJobs(studentId: string, limit: number = 10): Promise<any[]> {
    const student = await this.studentModel
      .findOne({ $or: [{ _id: new Types.ObjectId(studentId) }, { userId: new Types.ObjectId(studentId) }] })
      .lean();

    if (!student) throw new NotFoundException('Student not found');

    const studentSkills = new Set(
      (student.skills || []).map(s => s.name.toLowerCase())
    );

    const jobs = await this.jobModel
      .find({ status: 'active' })
      .limit(100)
      .lean();

    const scoredJobs = jobs.map(job => {
      const requiredSkills = ((job as any).requirements?.requiredSkills || []).map((s: any) => s.name.toLowerCase());
      const matches = requiredSkills.filter((s: string) => studentSkills.has(s));
      const score = requiredSkills.length > 0
        ? Math.round((matches.length / requiredSkills.length) * 100)
        : 0;

      return { job, matchScore: score, matchedSkills: matches.length, totalRequired: requiredSkills.length };
    });

    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);
    return scoredJobs.slice(0, limit);
  }

  async getStudentDocumentId(userId: string): Promise<string> {
    const student = await this.studentModel.findOne({ userId: new Types.ObjectId(userId) }).select('_id').lean();
    if (!student) throw new NotFoundException('Student profile not found');
    return String(student._id);
  }

  async getTopMatchedCandidates(jobId: string, limit: number = 10): Promise<any[]> {
    const job = await this.jobModel.findById(new Types.ObjectId(jobId)).lean();
    if (!job) throw new NotFoundException('Job not found');

    // First try to get actual AI match results
    const aiResults = await this.matchResultModel
      .find({ job: new Types.ObjectId(jobId) })
      .sort({ overallScore: -1 })
      .limit(limit)
      .populate('student')
      .lean();

    if (aiResults && aiResults.length > 0) {
      return aiResults.map(r => ({
        student: r.student,
        matchScore: r.overallScore,
        skillMatches: r.skillMatches?.length || 0,
        factorBreakdown: r.factorBreakdown,
        explanation: r.explanation,
      }));
    }

    // Fallback to naive calculation if AI matching hasn't completed yet
    const requiredSkillNames = ((job as any).requirements?.requiredSkills || []).map((s: any) => s.name.toLowerCase());

    const students = await this.studentModel
      .find()
      .limit(100)
      .lean();

    const scoredStudents = students.map(student => {
      const studentSkills = new Map(
        (student.skills || []).map((s: any) => [s.name.toLowerCase(), s.proficiency || 1])
      );

      let totalScore = 0;
      let matches = 0;
      for (const skillName of requiredSkillNames) {
        if (studentSkills.has(skillName)) {
          totalScore += studentSkills.get(skillName) || 0;
          matches++;
        }
      }

      const score = requiredSkillNames.length > 0
        ? Math.round((matches / requiredSkillNames.length) * 100)
        : 0;

      return { student, matchScore: score, skillMatches: matches };
    });

    scoredStudents.sort((a, b) => b.matchScore - a.matchScore);
    return scoredStudents.slice(0, limit);
  }

  private calculateBonusPoints(job: any, student: any): number {
    let bonus = 0;

    if (student.gpa && student.gpa >= 3.5) bonus += 5;
    if ((student.certifications || []).length > 0) bonus += 3;
    if ((student.projects || []).length >= 2) bonus += 2;
    if (student.cvUrl) bonus += 2;

    return bonus;
  }

  private generateRecommendations(missingSkills: string[]): string[] {
    if (missingSkills.length === 0) return ['Great match! Your skills align well with this position.'];

    return missingSkills.map(skill =>
      `Consider improving your ${skill} skills to better match this role.`
    );
  }
}
