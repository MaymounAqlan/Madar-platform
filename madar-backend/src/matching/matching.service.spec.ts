import { BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { MatchingService } from './matching.service';

describe('MatchingService AI queue', () => {
  const queue: any = { add: jest.fn(), getJob: jest.fn() };
  let service: MatchingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MatchingService({} as any, {} as any, {} as any, {} as any, queue);
  });

  it('uses a stable idempotency key and retry policy for recommendation tasks', async () => {
    queue.add.mockResolvedValue({ id: 'task-1' });

    await service.enqueueRecommendationGeneration('student-1', 'user-1');

    expect(queue.add).toHaveBeenCalledWith(
      'generate-recommendations',
      { studentId: 'student-1', requestedBy: 'user-1' },
      expect.objectContaining({
        jobId: 'recommend-student-1',
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        timeout: 120000,
      }),
    );
  });

  it('prevents another user from reading a task', async () => {
    queue.getJob.mockResolvedValue({ data: { requestedBy: 'owner' } });

    await expect(service.getTaskStatus('task-1', 'other-user', 'student')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('maps Redis enqueue failures to a service unavailable error', async () => {
    queue.add.mockRejectedValue(new Error('Redis unavailable'));

    await expect(service.enqueueRecommendationGeneration('student-1', 'user-1'))
      .rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps active Bull jobs to processing and returns completed results only', async () => {
    queue.getJob.mockResolvedValue({
      id: 'task-1', name: 'analyze-cv', data: { requestedBy: 'owner' }, attemptsMade: 0,
      opts: { attempts: 3 }, timestamp: Date.now(), processedOn: Date.now(), finishedOn: null,
      failedReason: null, returnvalue: { private: 'not-ready' }, getState: jest.fn().mockResolvedValue('active'),
      progress: jest.fn().mockResolvedValue(45),
    });

    const result = await service.getTaskStatus('task-1', 'owner', 'student');

    expect(result.status).toBe('processing');
    expect(result.progress).toBe(45);
    expect(result.result).toBeNull();
  });

  it('retries only failed tasks owned by the requester', async () => {
    const task: any = {
      data: { requestedBy: 'owner' }, getState: jest.fn().mockResolvedValue('completed'), retry: jest.fn(),
    };
    queue.getJob.mockResolvedValue(task);

    await expect(service.retryTask('task-1', 'owner', 'student')).rejects.toBeInstanceOf(BadRequestException);
    expect(task.retry).not.toHaveBeenCalled();
  });
});
