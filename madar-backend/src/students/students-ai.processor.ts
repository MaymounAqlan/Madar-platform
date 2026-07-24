import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job as BullJob } from 'bull';
import { unlink } from 'fs/promises';
import { StudentsService } from './students.service';

@Processor('ai-matching')
export class StudentsAiProcessor {
  private readonly logger = new Logger(StudentsAiProcessor.name);

  constructor(private readonly studentsService: StudentsService) {}

  @Process('analyze-cv')
  async analyzeCv(task: BullJob) {
    const { userId, file, contentHash } = task.data;
    this.logger.log(`Starting CV analysis task ${task.id} for user ${userId}`);
    await task.progress(10);
    try {
      const result = await this.studentsService.handleCvUploadWithParsing(
        userId,
        file as Express.Multer.File,
        { cleanupOnFailure: false, contentHash },
      );
      await task.progress(100);
      return { ...result, contentHash };
    } catch (error) {
      const maxAttempts = Math.max(1, Number(task.opts.attempts || 1));
      const isFinalAttempt = task.attemptsMade + 1 >= maxAttempts;
      if (isFinalAttempt && file?.path) await unlink(file.path).catch(() => undefined);
      throw error;
    }
  }
}
