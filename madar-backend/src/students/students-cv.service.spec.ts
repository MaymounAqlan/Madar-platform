import { ConflictException } from '@nestjs/common';
import { createHash } from 'crypto';
import { readFile, unlink } from 'fs/promises';
import { StudentsService } from './students.service';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  unlink: jest.fn(),
  mkdir: jest.fn(),
  writeFile: jest.fn(),
}));

describe('StudentsService CV duplicate protection', () => {
  const readFileMock = readFile as jest.MockedFunction<typeof readFile>;
  const unlinkMock = unlink as jest.MockedFunction<typeof unlink>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects the current CV by content hash and removes the duplicate upload', async () => {
    const contents = Buffer.from('identical-cv-contents');
    const contentHash = createHash('sha256').update(contents).digest('hex');
    readFileMock.mockResolvedValue(contents);
    unlinkMock.mockResolvedValue(undefined);

    const studentModel = {
      findOne: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ cvData: { contentHash } }),
        }),
      }),
    };
    const queue = { getJob: jest.fn(), add: jest.fn() };
    const service = new StudentsService(
      studentModel as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      queue as any,
    );
    const file = {
      path: 'uploads/cvs/duplicate.pdf',
      filename: 'duplicate.pdf',
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      size: contents.length,
    } as Express.Multer.File;

    await expect(service.enqueueCvAnalysis('507f1f77bcf86cd799439011', file))
      .rejects.toBeInstanceOf(ConflictException);
    expect(unlinkMock).toHaveBeenCalledWith(file.path);
    expect(queue.getJob).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });
});
