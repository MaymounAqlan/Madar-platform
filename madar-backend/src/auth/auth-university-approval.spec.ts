import { Types } from 'mongoose';
import { AuthService } from './auth.service';

const query = (value: unknown) => {
  const chain: any = { lean: jest.fn().mockResolvedValue(value) };
  chain.select = jest.fn().mockReturnValue(chain);
  return chain;
};

function createService() {
  const id = new Types.ObjectId();
  const jwtService = {
    signAsync: jest.fn().mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token'),
    verifyAsync: jest.fn().mockResolvedValue({ sub: id.toString() }),
  };
  const configService = { get: jest.fn((key: string) => key) };
  const emailService = { sendWelcomeEmail: jest.fn().mockResolvedValue({ success: true }) };
  const userModel = {
    findOne: jest.fn().mockReturnValue(query(null)),
    create: jest.fn().mockImplementation((data) => Promise.resolve({ _id: id, ...data })),
    findById: jest.fn().mockReturnValue(query({ _id: id, email: 'university@example.edu', userType: 'university', status: 'active' })),
    updateOne: jest.fn().mockResolvedValue({}),
  };
  const studentModel = { create: jest.fn(), findOne: jest.fn() };
  const companyModel = { create: jest.fn(), findOne: jest.fn() };
  const universityModel = { create: jest.fn(), exists: jest.fn().mockResolvedValue(null), findOne: jest.fn().mockReturnValue(query({ status: 'pending' })) };
  const auditLogModel = { create: jest.fn() };
  const coordinatorModel = { updateOne: jest.fn() };
  const roleModel = { findById: jest.fn().mockReturnValue(query({ permissions: [] })) };
  const service = new AuthService(jwtService as any, configService as any, emailService as any, userModel as any, roleModel as any, studentModel as any, companyModel as any, universityModel as any, auditLogModel as any, coordinatorModel as any, {} as any, {} as any, {} as any, {} as any);
  return { service, id, jwtService, userModel, studentModel, companyModel, universityModel };
}

const base = {
  password: 'SecurePass123!', firstName: 'Test', firstNameAr: 'اختبار', lastName: 'Account', lastNameAr: 'حساب',
};

describe('AuthService university approval behavior', () => {
  it('registers a university profile as pending while keeping its user active', async () => {
    const models = createService();
    await models.service.register({ ...base, email: 'university@example.edu', role: 'university', profile: { universityName: 'Approval University', description: 'Test' } } as any);
    expect(models.userModel.create).toHaveBeenCalledWith(expect.objectContaining({ userType: 'university', status: 'active' }));
    expect(models.universityModel.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Approval University', status: 'pending', submittedAt: expect.any(Date) }));
  });

  it('does not change student registration behavior', async () => {
    const models = createService();
    await models.service.register({ ...base, email: 'student@example.edu', role: 'student', profile: { university: 'U', college: 'C', department: 'D', academicLevel: 'senior' } } as any);
    expect(models.userModel.create).toHaveBeenCalledWith(expect.objectContaining({ userType: 'student', status: 'active' }));
    expect(models.studentModel.create).toHaveBeenCalled();
  });

  it('does not change company registration behavior', async () => {
    const models = createService();
    await models.service.register({ ...base, email: 'company@example.com', role: 'company', profile: { companyName: 'Company', industry: 'Technology', description: 'Test' } } as any);
    expect(models.userModel.create).toHaveBeenCalledWith(expect.objectContaining({ userType: 'company', status: 'active' }));
    expect(models.companyModel.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'active' }));
  });

  it('prevents public registration from creating an institutional staff role', async () => {
    const models = createService();
    await expect(models.service.register({ ...base, email: 'staff@example.edu', role: 'coordinator' } as any))
      .rejects.toThrow('Institutional staff accounts can only be created by a university invitation');
    expect(models.userModel.create).not.toHaveBeenCalled();
  });

  it('refreshes a university token only after re-reading user and university state', async () => {
    const models = createService();
    models.jwtService.signAsync.mockReset().mockResolvedValueOnce('new-access').mockResolvedValueOnce('new-refresh');
    await expect(models.service.refreshToken('refresh-token')).resolves.toEqual({ accessToken: 'new-access', refreshToken: 'new-refresh' });
    expect(models.userModel.findById).toHaveBeenCalledWith(models.id.toString());
    expect(models.universityModel.findOne).toHaveBeenCalledWith({ userId: models.id });
  });

  it('rejects refresh for a currently suspended user with a stable code', async () => {
    const models = createService();
    models.userModel.findById.mockReturnValue(query({ _id: models.id, email: 'u@example.edu', userType: 'university', status: 'suspended' }));
    await expect(models.service.refreshToken('refresh-token')).rejects.toMatchObject({ response: { code: 'USER_SUSPENDED' } });
  });

  it.each([
    ['inactive', 'USER_INACTIVE'],
    ['banned', 'USER_INACTIVE'],
    ['suspended', 'USER_SUSPENDED'],
  ])('rejects login for a currently %s user', async (status, code) => {
    const models = createService();
    models.userModel.findOne.mockReturnValue(query({ _id: models.id, email: 'blocked@example.edu', password: 'unused', userType: 'university', status }));
    await expect(models.service.login({ email: 'blocked@example.edu', password: 'anything' })).rejects.toMatchObject({ response: { code } });
  });
});
