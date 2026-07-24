import { Types } from 'mongoose';
import { UniversityStatusGuard } from './university-status.guard';

const query = (value: unknown) => {
  const chain: any = { lean: jest.fn().mockResolvedValue(value) };
  chain.select = jest.fn().mockReturnValue(chain);
  return chain;
};

describe('UniversityStatusGuard', () => {
  const userId = new Types.ObjectId();
  let universityStatus = 'active';
  const userModel = { findById: jest.fn(() => query({ _id: userId, userType: 'university', status: 'active' })) };
  const universityModel = { findOne: jest.fn(() => query({ status: universityStatus })) };
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
  const request = { user: { sub: userId.toString(), role: 'university' } };
  const context = {
    getHandler: jest.fn(), getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
  const guard = new UniversityStatusGuard(reflector as any, userModel as any, universityModel as any);

  beforeEach(() => { universityStatus = 'active'; jest.clearAllMocks(); });

  it('allows an active university and reads current database state', async () => {
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(userModel.findById).toHaveBeenCalledWith(userId);
    expect(universityModel.findOne).toHaveBeenCalledWith({ userId });
  });

  it.each([
    ['pending', 'UNIVERSITY_PENDING_APPROVAL'],
    ['inactive', 'UNIVERSITY_INACTIVE'],
    ['suspended', 'UNIVERSITY_SUSPENDED'],
  ])('denies %s universities with a stable code', async (status, code) => {
    universityStatus = status;
    await expect(guard.canActivate(context)).rejects.toMatchObject({ response: { code } });
  });

  it('prevents an old token from bypassing a later suspension', async () => {
    await expect(guard.canActivate(context)).resolves.toBe(true);
    universityStatus = 'suspended';
    await expect(guard.canActivate(context)).rejects.toMatchObject({ response: { code: 'UNIVERSITY_SUSPENDED' } });
  });

  it.each([
    ['inactive', 'USER_INACTIVE'],
    ['suspended', 'USER_SUSPENDED'],
  ])('denies a %s user from database state', async (status, code) => {
    userModel.findById.mockReturnValueOnce(query({ _id: userId, userType: 'university', status }) as any);
    await expect(guard.canActivate(context)).rejects.toMatchObject({ response: { code } });
  });

  it('skips university approval only after validating the current user', async () => {
    reflector.getAllAndOverride.mockReturnValueOnce(true);
    universityStatus = 'pending';
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(userModel.findById).toHaveBeenCalled();
    expect(universityModel.findOne).not.toHaveBeenCalled();
  });
});
