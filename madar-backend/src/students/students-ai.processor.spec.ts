import { StudentsAiProcessor } from './students-ai.processor';
import { unlink } from 'fs/promises';

jest.mock('fs/promises', () => ({
  unlink: jest.fn(),
}));

describe('StudentsAiProcessor', () => {
  const unlinkMock = unlink as jest.MockedFunction<typeof unlink>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps the queued file available while retry policy is active', async () => {
    const service = {
      handleCvUploadWithParsing: jest.fn().mockResolvedValue({ cvUrl: '/uploads/cvs/new.pdf' }),
    };
    const processor = new StudentsAiProcessor(service as any);
    const task = {
      id: 'cv-task',
      data: {
        userId: 'user-id',
        contentHash: 'hash',
        file: { path: 'queued.pdf', originalname: 'cv.pdf' },
      },
      opts: { attempts: 3 },
      attemptsMade: 0,
      progress: jest.fn().mockResolvedValue(undefined),
    };

    await expect(processor.analyzeCv(task as any)).resolves.toMatchObject({ cvUrl: '/uploads/cvs/new.pdf', contentHash: 'hash' });
    expect(service.handleCvUploadWithParsing).toHaveBeenCalledWith(
      'user-id',
      task.data.file,
      { cleanupOnFailure: false, contentHash: 'hash' },
    );
    expect(unlinkMock).not.toHaveBeenCalled();
  });

  it('keeps the uploaded file when a non-final analysis attempt fails', async () => {
    const service = {
      handleCvUploadWithParsing: jest.fn().mockRejectedValue(new Error('AI temporarily unavailable')),
    };
    const processor = new StudentsAiProcessor(service as any);
    const task = {
      id: 'cv-retry-task',
      data: {
        userId: 'user-id',
        contentHash: 'hash',
        file: { path: 'queued-retry.pdf', originalname: 'cv.pdf' },
      },
      opts: { attempts: 3 },
      attemptsMade: 0,
      progress: jest.fn().mockResolvedValue(undefined),
    };

    await expect(processor.analyzeCv(task as any)).rejects.toThrow('AI temporarily unavailable');
    expect(unlinkMock).not.toHaveBeenCalled();
  });

  it('removes the queued file after the final failed analysis attempt', async () => {
    unlinkMock.mockResolvedValue(undefined);
    const service = {
      handleCvUploadWithParsing: jest.fn().mockRejectedValue(new Error('CV cannot be analyzed')),
    };
    const processor = new StudentsAiProcessor(service as any);
    const task = {
      id: 'cv-final-task',
      data: {
        userId: 'user-id',
        contentHash: 'hash',
        file: { path: 'queued-final.pdf', originalname: 'cv.pdf' },
      },
      opts: { attempts: 3 },
      attemptsMade: 2,
      progress: jest.fn().mockResolvedValue(undefined),
    };

    await expect(processor.analyzeCv(task as any)).rejects.toThrow('CV cannot be analyzed');
    expect(unlinkMock).toHaveBeenCalledWith('queued-final.pdf');
  });
});
