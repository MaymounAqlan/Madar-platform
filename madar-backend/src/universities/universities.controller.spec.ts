import { UniversitiesController } from './universities.controller';
import { ROLES_KEY } from '../auth/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

const request = { user: { sub: 'university-user-id' } } as any;

describe('UniversitiesController Phase 3 contracts', () => {
  it('returns dashboard, students and structure service contracts unchanged', async () => {
    const dashboard = { university: {}, summary: {}, collegePerformance: [], trends: {}, topSkills: [], topEmployers: [], recentActivities: [] };
    const students = { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }, filters: { colleges: [], departments: [] } };
    const structure = { university: {}, colleges: [], totalColleges: 0, totalDepartments: 0 };
    const service = {
      getDashboard: jest.fn().mockResolvedValue(dashboard),
      getStudents: jest.fn().mockResolvedValue(students),
      getStructure: jest.fn().mockResolvedValue(structure),
    };
    const controller = new UniversitiesController(service as any);

    await expect(controller.getDashboard(request)).resolves.toBe(dashboard);
    await expect(controller.getStudents(request, { page: 1 })).resolves.toBe(students);
    await expect(controller.getStructure(request)).resolves.toBe(structure);
    expect(service.getDashboard).toHaveBeenCalledWith('university-user-id');
    expect(service.getStudents).toHaveBeenCalledWith('university-user-id', { page: 1 });
    expect(service.getStructure).toHaveBeenCalledWith('university-user-id');
  });

  it('restricts explicit affiliation reconciliation to administrators', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, UniversitiesController.prototype.reconcileStudentAffiliations);
    expect(roles).toEqual([UserRole.ADMIN, UserRole.SUPER_ADMIN]);
    expect(roles).not.toContain(UserRole.UNIVERSITY);
  });

  it('gets and updates the authenticated university profile without accepting an owner id', async () => {
    const profile = { id: 'university-id', name: 'Test University' };
    const service = {
      getProfile: jest.fn().mockResolvedValue(profile),
      updateProfile: jest.fn().mockResolvedValue(profile),
    };
    const controller = new UniversitiesController(service as any);

    await expect(controller.getProfile(request)).resolves.toBe(profile);
    await expect(controller.updateProfile(request, { name: 'Test University' })).resolves.toBe(profile);
    expect(service.getProfile).toHaveBeenCalledWith('university-user-id');
    expect(service.updateProfile).toHaveBeenCalledWith('university-user-id', { name: 'Test University' });
  });

  it('returns status using only the authenticated user id', async () => {
    const status = { universityId: 'id', status: 'pending', canAccessPortal: false };
    const service = { getMyStatus: jest.fn().mockResolvedValue(status) };
    const controller = new UniversitiesController(service as any);
    await expect(controller.getMyStatus(request)).resolves.toBe(status);
    expect(service.getMyStatus).toHaveBeenCalledWith('university-user-id');
  });
});
