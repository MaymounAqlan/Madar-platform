import { Types } from 'mongoose';
import { CurriculumService } from './curriculum.service';

describe('CurriculumService queue', () => {
  const universityId = new Types.ObjectId();
  const departmentId = new Types.ObjectId().toString();

  function createService(queue: any) {
    const universities = {
      findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: universityId, status: 'active' }) }),
    };
    const departments = { exists: jest.fn().mockResolvedValue({ _id: new Types.ObjectId(departmentId) }) };
    return new CurriculumService(
      {} as any,
      {} as any,
      universities as any,
      {} as any,
      departments as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      queue,
      {} as any,
    );
  }

  it('returns an active idempotent task instead of adding a duplicate', async () => {
    const existing = { getState: jest.fn().mockResolvedValue('active') };
    const queue = { getJob: jest.fn().mockResolvedValue(existing), add: jest.fn() };
    const service = createService(queue);

    await expect(service.enqueueAnalysis(new Types.ObjectId().toString(), departmentId)).resolves.toEqual({
      taskId: `curriculum-${departmentId}`,
      status: 'processing',
      type: 'analyze-curriculum',
    });
    expect(queue.add).not.toHaveBeenCalled();
  });
});
