import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CollegeCoordinatorService } from './college-coordinator.service';
import { UniversityStaffRole } from './dto/staff.dto';

const query = (value: any) => {
  const q: any = { lean: jest.fn().mockResolvedValue(value) };
  q.populate = jest.fn().mockReturnValue(q);
  return q;
};

describe('CollegeCoordinatorService', () => {
  const ownerId = new Types.ObjectId();
  const universityId = new Types.ObjectId();
  const collegeId = new Types.ObjectId();
  const university = { _id: universityId, userId: ownerId, name: 'Scoped University', status: 'active' };

  function createService(college: any = { _id: collegeId, universityId, name: 'Engineering' }) {
    const createdUser: any = { _id: new Types.ObjectId(), firstName: 'Sara', lastName: 'Staff', email: 'sara@example.edu', phone: '', toObject() { return { ...this }; } };
    const createdProfile: any = { _id: new Types.ObjectId(), userId: createdUser._id, universityId, collegeId, role: 'coordinator', status: 'active', invitationStatus: 'pending', permissions: [], toObject() { return { ...this }; } };
    const staffModel = { create: jest.fn().mockResolvedValue(createdProfile), deleteOne: jest.fn(), findOne: jest.fn().mockReturnValue(query(null)), findById: jest.fn().mockReturnValue(query(null)) };
    const userModel = { exists: jest.fn().mockResolvedValue(false), findOne: jest.fn().mockReturnValue(query(null)), create: jest.fn().mockResolvedValue(createdUser), deleteOne: jest.fn(), updateOne: jest.fn(), findById: jest.fn() };
    const universityModel = { findOne: jest.fn().mockReturnValue(query(university)) };
    const collegeModel = { collection: { findOne: jest.fn().mockResolvedValue(college) } };
    const auditModel = { create: jest.fn().mockResolvedValue({}) };
    const notifications = { create: jest.fn().mockResolvedValue({}) };
    const email = { sendUniversityStaffInvitation: jest.fn().mockResolvedValue(undefined) };
    return { service: new CollegeCoordinatorService(staffModel as any, userModel as any, universityModel as any, collegeModel as any, auditModel as any, notifications as any, email as any), staffModel, userModel, collegeModel, auditModel, email };
  }

  it('invites a coordinator only with a college owned by the university', async () => {
    const models = createService();
    const result = await models.service.invite(ownerId.toString(), { name: 'Sara Staff', email: 'SARA@example.edu', role: UniversityStaffRole.COORDINATOR, collegeId: collegeId.toString() });
    expect(models.collegeModel.collection.findOne).toHaveBeenCalledWith(expect.objectContaining({ _id: collegeId }));
    expect(models.staffModel.create).toHaveBeenCalledWith(expect.objectContaining({ universityId, collegeId, role: 'coordinator', invitationStatus: 'pending' }));
    expect(models.email.sendUniversityStaffInvitation).toHaveBeenCalled();
    expect(models.auditModel.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'INVITE_UNIVERSITY_STAFF' }));
    expect(result.email).toBe('sara@example.edu');
  });

  it('rejects a coordinator college outside the authenticated university', async () => {
    const models = createService(null);
    await expect(models.service.invite(ownerId.toString(), { name: 'Sara Staff', email: 'sara@example.edu', role: UniversityStaffRole.COORDINATOR, collegeId: collegeId.toString() })).rejects.toBeInstanceOf(ForbiddenException);
    expect(models.userModel.create).not.toHaveBeenCalled();
  });

  it('keeps the invitation when email delivery fails', async () => {
    const models = createService();
    models.email.sendUniversityStaffInvitation.mockRejectedValue(new Error('SMTP unavailable'));
    const result = await models.service.invite(ownerId.toString(), { name: 'Sara Staff', email: 'sara@example.edu', role: UniversityStaffRole.UNIVERSITY_VIEWER });
    expect(result.emailSent).toBe(false);
    expect(models.staffModel.create).toHaveBeenCalled();
  });

  it('scopes staff lookup to the authenticated university', async () => {
    const models = createService();
    const scopedQuery: any = { lean: jest.fn().mockResolvedValue(null) };
    scopedQuery.populate = jest.fn().mockReturnValue(scopedQuery);
    models.staffModel.findOne.mockReturnValue(scopedQuery);

    await expect(models.service.getOne(ownerId.toString(), new Types.ObjectId().toString())).rejects.toThrow('Staff member not found');
    expect(models.staffModel.findOne).toHaveBeenCalledWith(expect.objectContaining({ universityId }));
  });
});
