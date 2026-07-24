import { CurriculumProcessor } from './curriculum.processor';

describe('CurriculumProcessor', () => {
  it('updates progress and persists a queued curriculum analysis', async () => {
    const result = { id: 'analysis-1', status: 'completed' };
    const service = {
      refreshAnalysisForDepartment: jest.fn().mockResolvedValue(result),
    };
    const processor = new CurriculumProcessor(service as any);
    const task = {
      data: { departmentId: 'department-1', requestedBy: 'user-1' },
      progress: jest.fn().mockResolvedValue(undefined),
    };

    await expect(processor.analyze(task as any)).resolves.toEqual(result);
    expect(service.refreshAnalysisForDepartment).toHaveBeenCalledWith(
      'user-1',
      'department-1',
      'queued_refresh',
    );
    expect(task.progress.mock.calls).toEqual([[10], [100]]);
  });
});
