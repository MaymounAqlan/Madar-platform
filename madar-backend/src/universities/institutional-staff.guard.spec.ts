import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { InstitutionalStaffGuard } from './institutional-staff.guard';

const query = (value: any) => {
  const chain: any = { lean: jest.fn().mockResolvedValue(value) };
  chain.select = jest.fn().mockReturnValue(chain);
  return chain;
};

const context = (user: any) => ({ switchToHttp: () => ({ getRequest: () => ({ user }) }) }) as any;

describe('InstitutionalStaffGuard', () => {
  const userId = new Types.ObjectId();
  const universityId = new Types.ObjectId();
  const collegeId = new Types.ObjectId();

  function createGuard(userStatus = 'active', staffStatus = 'active', invitationStatus = 'accepted', universityStatus = 'active') {
    const userModel = { findById: jest.fn().mockReturnValue(query({ _id: userId, status: userStatus, userType: 'coordinator' })) };
    const staff = staffStatus === 'active' && invitationStatus === 'accepted'
      ? { userId, universityId, collegeId, role: 'coordinator', status: staffStatus, invitationStatus, permissions: ['departments:write'] }
      : null;
    const staffModel = { findOne: jest.fn().mockReturnValue(query(staff)) };
    const universityModel = { findOne: jest.fn().mockReturnValue(query(universityStatus === 'active' ? { _id: universityId, status: universityStatus } : null)) };
    return { guard: new InstitutionalStaffGuard(userModel as any, universityModel as any, staffModel as any), staffModel, universityModel };
  }

  it('loads active coordinator scope from the database', async () => {
    const models = createGuard();
    await expect(models.guard.canActivate(context({ sub: userId.toString(), role: 'coordinator' }))).resolves.toBe(true);
    expect(models.staffModel.findOne).toHaveBeenCalledWith(expect.objectContaining({ userId, status: 'active', invitationStatus: 'accepted' }));
    expect(models.universityModel.findOne).toHaveBeenCalledWith({ _id: universityId, status: 'active' });
  });

  it('rejects an old token after the staff user is disabled', async () => {
    const models = createGuard('suspended');
    await expect(models.guard.canActivate(context({ sub: userId.toString(), role: 'coordinator' }))).rejects.toBeInstanceOf(ForbiddenException);
    expect(models.staffModel.findOne).not.toHaveBeenCalled();
  });

  it('rejects revoked or unaccepted institutional access', async () => {
    const models = createGuard('active', 'inactive', 'accepted');
    await expect(models.guard.canActivate(context({ sub: userId.toString(), role: 'coordinator' }))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects staff when the university is no longer active', async () => {
    const models = createGuard('active', 'active', 'accepted', 'suspended');
    await expect(models.guard.canActivate(context({ sub: userId.toString(), role: 'coordinator' }))).rejects.toBeInstanceOf(ForbiddenException);
  });
});
