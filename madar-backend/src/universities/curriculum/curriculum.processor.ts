import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { CurriculumService } from './curriculum.service';

@Processor('ai-matching')
export class CurriculumProcessor {
  constructor(private readonly curriculumService: CurriculumService) {}

  @Process('analyze-curriculum')
  async analyze(task: Job<{ departmentId: string; requestedBy: string }>) {
    await task.progress(10);
    const result = await this.curriculumService.refreshAnalysisForDepartment(
      task.data.requestedBy,
      task.data.departmentId,
      'queued_refresh',
    );
    await task.progress(100);
    return result;
  }
}
