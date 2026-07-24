import { Types } from 'mongoose';
import { AdminService } from './admin.service';

const query = (value: unknown) => ({ lean: jest.fn().mockResolvedValue(value) });

describe('AdminService university approval transitions', () => {
  const adminId = new Types.ObjectId().toString();
  const universityId = new Types.ObjectId().toString();
  const universityUserId = new Types.ObjectId();
  const universityModel = {
    findByIdAndUpdate: jest.fn((id: string, update: any) => query({ _id: id, userId: universityUserId, name: 'Review University', status: update.$set.status })),
  };
  const auditLogModel = { create: jest.fn().mockResolvedValue({}) };
  const notificationService = { create: jest.fn().mockResolvedValue({}) };
  const platformSettingsService = {} as any;
  const service = new AdminService(
    {} as any, {} as any, {} as any, {} as any, {} as any, universityModel as any,
    {} as any, {} as any, {} as any,
    {} as any, {} as any, {} as any, {} as any, auditLogModel as any, {} as any,
    {} as any, {} as any, notificationService as any, platformSettingsService, {} as any,
  );

  beforeEach(() => jest.clearAllMocks());

  it('approves and records reviewer, audit log, and notification', async () => {
    await service.approveUniversity(adminId, universityId);
    expect(universityModel.findByIdAndUpdate).toHaveBeenCalledWith(universityId, expect.objectContaining({
      $set: expect.objectContaining({ status: 'active', reviewedBy: new Types.ObjectId(adminId), reviewedAt: expect.any(Date) }),
      $unset: { rejectionReason: 1, suspensionReason: 1 },
    }), { new: true });
    expect(auditLogModel.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'APPROVE_UNIVERSITY' }));
    expect(notificationService.create).toHaveBeenCalledWith(expect.objectContaining({ userId: universityUserId }));
  });

  it('rejects with the supplied reason', async () => {
    await service.rejectUniversity(adminId, universityId, 'Incomplete official records');
    expect(universityModel.findByIdAndUpdate).toHaveBeenCalledWith(universityId, expect.objectContaining({
      $set: expect.objectContaining({ status: 'inactive', rejectionReason: 'Incomplete official records' }),
    }), { new: true });
    expect(auditLogModel.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'REJECT_UNIVERSITY' }));
  });

  it('suspends immediately with a reason', async () => {
    await service.suspendUniversity(adminId, universityId, 'Policy review');
    expect(universityModel.findByIdAndUpdate).toHaveBeenCalledWith(universityId, expect.objectContaining({
      $set: expect.objectContaining({ status: 'suspended', suspensionReason: 'Policy review' }),
    }), { new: true });
  });

  it('reactivates and clears previous reasons', async () => {
    await service.reactivateUniversity(adminId, universityId);
    expect(universityModel.findByIdAndUpdate).toHaveBeenCalledWith(universityId, expect.objectContaining({
      $set: expect.objectContaining({ status: 'active' }),
      $unset: { rejectionReason: 1, suspensionReason: 1 },
    }), { new: true });
  });
});
