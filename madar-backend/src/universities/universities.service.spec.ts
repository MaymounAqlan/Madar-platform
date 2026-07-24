import { Types } from 'mongoose';
import { UniversitiesService } from './universities.service';

const query = <T>(value: T) => {
  const chain: any = {
    lean: jest.fn().mockResolvedValue(value),
  };
  ['select', 'sort', 'skip', 'limit'].forEach((method) => {
    chain[method] = jest.fn().mockReturnValue(chain);
  });
  return chain;
};

const collectionCursor = <T>(value: T) => {
  const cursor: any = { toArray: jest.fn().mockResolvedValue(value) };
  cursor.sort = jest.fn().mockReturnValue(cursor);
  return cursor;
};

const universityId = new Types.ObjectId();
const userId = new Types.ObjectId().toString();
const collegeId = new Types.ObjectId();
const departmentId = new Types.ObjectId();
const studentId = new Types.ObjectId();

const university = {
  _id: universityId,
  userId: new Types.ObjectId(userId),
  name: 'Contract Test University',
  branding: {},
  description: 'Current description',
  location: { city: 'Riyadh', country: 'Saudi Arabia', address: 'University Road' },
  contactInfo: { email: 'contact@example.edu', phone: '0110000000', website: 'https://example.edu', hrEmail: 'office@example.edu' },
  analytics: { employmentRate: 62 },
};

function createService() {
  const universityModel = {
    findOne: jest.fn().mockReturnValue(query(university)),
    findOneAndUpdate: jest.fn().mockReturnValue(query(university)),
    updateOne: jest.fn(),
  };
  const collegeModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    updateOne: jest.fn(),
    collection: {
      find: jest.fn().mockReturnValue(collectionCursor([])),
      findOne: jest.fn().mockResolvedValue(null),
      findOneAndUpdate: jest.fn(),
    },
  };
  const departmentModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    updateOne: jest.fn(),
    collection: {
      find: jest.fn().mockReturnValue(collectionCursor([])),
      findOne: jest.fn().mockResolvedValue(null),
      findOneAndUpdate: jest.fn(),
    },
  };
  const studentModel = {
    find: jest.fn(),
    countDocuments: jest.fn(),
    distinct: jest.fn(),
    updateOne: jest.fn(),
  };
  const applicationModel = { find: jest.fn() };
  const matchResultModel = { find: jest.fn() };
  const marketDataModel = { find: jest.fn() };
  const auditLogModel = { create: jest.fn() };
  const staffModel = { findOne: jest.fn() };
  const affiliationModel = {
    find: jest.fn().mockReturnValue(query([{ studentId, universityId, collegeId, departmentId, status: 'verified' }])),
    findOne: jest.fn().mockReturnValue(query(null)),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  };
  const service = new UniversitiesService(
    universityModel as any,
    collegeModel as any,
    departmentModel as any,
    studentModel as any,
    {} as any,
    applicationModel as any,
    matchResultModel as any,
    {} as any,
    marketDataModel as any,
    auditLogModel as any,
    staffModel as any,
    affiliationModel as any,
    { create: jest.fn() } as any,
    { findById: jest.fn() } as any,
    {} as any,
  );
  return {
    service,
    universityModel,
    collegeModel,
    departmentModel,
    studentModel,
    applicationModel,
    matchResultModel,
    marketDataModel,
    staffModel,
  };
}

describe('UniversitiesService Phase 3 contracts', () => {
  it('returns the current approval status for the authenticated university', async () => {
    const models = createService();
    const result = await models.service.getMyStatus(userId);
    expect(result).toMatchObject({ universityId: universityId.toString(), name: university.name, status: 'inactive', canAccessPortal: false });
  });
  it('returns a normalized profile for the authenticated university', async () => {
    const models = createService();

    const result = await models.service.getProfile(userId);

    expect(result).toMatchObject({
      id: universityId.toString(),
      name: 'Contract Test University',
      description: 'Current description',
      location: { city: 'Riyadh', country: 'Saudi Arabia', address: 'University Road' },
      contactInfo: { email: 'contact@example.edu', officialContactEmail: 'office@example.edu' },
    });
    expect(models.universityModel.findOne).toHaveBeenCalledWith({ userId: new Types.ObjectId(userId) });
  });

  it('updates only supported profile fields inside the authenticated university record', async () => {
    const models = createService();

    await models.service.updateProfile(userId, {
      name: 'Updated University', city: 'Jeddah', website: 'https://updated.example.edu',
      officialContactEmail: 'official@updated.example.edu',
    });

    expect(models.universityModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: new Types.ObjectId(userId) },
      { $set: expect.objectContaining({
        name: 'Updated University',
        'location.city': 'Jeddah',
        'contactInfo.website': 'https://updated.example.edu',
        'contactInfo.hrEmail': 'official@updated.example.edu',
      }) },
      { new: true },
    );
  });

  it('rejects an empty profile update after unsupported fields are stripped', async () => {
    const models = createService();
    await expect(models.service.updateProfile(userId, {})).rejects.toThrow('At least one supported profile field is required');
    expect(models.universityModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('returns the dashboard contract with real empty defaults and no student writes', async () => {
    const models = createService();
    models.studentModel.countDocuments.mockResolvedValue(1);
    models.studentModel.find.mockReturnValue(query([{
      _id: studentId,
      academicInfo: { universityId, collegeId },
      aiMetrics: { readinessScore: 80 },
    }]));
    models.collegeModel.find.mockReturnValue(query([{
      _id: collegeId,
      name: 'Engineering',
      analytics: { employmentRate: 70, skillGaps: ['Cloud'] },
    }]));
    models.departmentModel.find.mockReturnValue(query([{ _id: departmentId, collegeId }]));
    models.matchResultModel.find.mockReturnValue(query([]));
    models.applicationModel.find.mockReturnValue(query([]));
    models.marketDataModel.find.mockReturnValue(query([]));

    const result = await models.service.getDashboard(userId);

    expect(result).toMatchObject({
      university: { id: universityId.toString(), name: university.name, logoUrl: null, academicYear: null },
      summary: { totalStudents: 1, totalColleges: 1, totalDepartments: 1, averageReadiness: 80, employmentRate: 62 },
      trends: { readiness: [], employment: [] },
      topSkills: [],
      topEmployers: [],
      recentActivities: [],
    });
    expect(result.collegePerformance[0]).toMatchObject({
      collegeId: collegeId.toString(),
      collegeName: 'Engineering',
      studentCount: 1,
      readinessScore: 80,
      employmentRate: 70,
      skillGapCount: 1,
    });
    expect(models.studentModel.updateOne).not.toHaveBeenCalled();
  });

  it('returns items, pagination and filters scoped by the authenticated university id', async () => {
    const models = createService();
    models.studentModel.countDocuments
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(1);
    models.studentModel.find.mockReturnValue(query([{
      _id: studentId,
      userId: new Types.ObjectId(),
      personalInfo: { firstName: 'Nora', lastName: 'Ali' },
      academicInfo: {
        universityId,
        collegeId,
        departmentId,
        studentId: 'ST-1',
        academicLevel: 'senior',
        gpa: 3.7,
      },
      skills: [{ name: 'TypeScript' }],
      aiMetrics: { readinessScore: 75 },
    }]));
    models.collegeModel.find.mockReturnValue(query([{ _id: collegeId, name: 'Engineering' }]));
    models.departmentModel.find.mockReturnValue(query([{ _id: departmentId, collegeId, name: 'Software' }]));

    const result = await models.service.getStudents(userId, { page: '1', limit: '20' });

    expect(models.studentModel.countDocuments).toHaveBeenNthCalledWith(1, { 'academicInfo.universityId': universityId });
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
    expect(result.items[0]).toMatchObject({
      id: studentId.toString(),
      fullName: 'Nora Ali',
      universityId: universityId.toString(),
      collegeName: 'Engineering',
      departmentName: 'Software',
      skills: ['TypeScript'],
    });
    expect(result.filters.colleges).toEqual([{ id: collegeId.toString(), name: 'Engineering' }]);
    expect(result.filters.departments).toEqual([{ id: departmentId.toString(), name: 'Software', collegeId: collegeId.toString() }]);
    expect(models.studentModel.updateOne).not.toHaveBeenCalled();
  });

  it('returns structure with explicit zero course and study-plan counts', async () => {
    const models = createService();
    models.collegeModel.find.mockReturnValue(query([{ _id: collegeId, name: 'Engineering', metadata: { status: 'active' } }]));
    models.departmentModel.find.mockReturnValue(query([{ _id: departmentId, collegeId, name: 'Software', metadata: { status: 'active' } }]));

    const result = await models.service.getStructure(userId);

    expect(result.university).toEqual({ id: universityId.toString(), name: university.name });
    expect(result.colleges[0].departments[0]).toMatchObject({ courseCount: 0, studyPlanCount: 0 });
    expect(result).not.toHaveProperty('courses');
    expect(models.studentModel.updateOne).not.toHaveBeenCalled();
  });

  it('reads legacy colleges linked by the university user id without migrating them', async () => {
    const models = createService();
    const legacyCollege = { _id: collegeId, university: university.userId, name: 'Legacy Engineering', studentCount: 120 };
    models.collegeModel.find.mockReturnValue(query([]));
    models.collegeModel.collection.find.mockReturnValue(collectionCursor([legacyCollege]));
    models.departmentModel.find.mockReturnValue(query([]));

    const result = await models.service.getStructure(userId);

    expect(result.colleges).toHaveLength(1);
    expect(result.colleges[0]).toMatchObject({ name: 'Legacy Engineering', studentCount: 120 });
    expect(models.collegeModel.collection.find).toHaveBeenCalledWith(expect.objectContaining({
      university: { $in: [universityId, university.userId] },
    }));
    expect(models.universityModel.updateOne).not.toHaveBeenCalled();
  });

  it('merges current and legacy colleges without hiding either ownership format', async () => {
    const models = createService();
    const currentCollege = { _id: new Types.ObjectId(), universityId, name: 'Current College' };
    const legacyCollege = { _id: collegeId, university: university.userId, name: 'Legacy College' };
    models.collegeModel.find.mockReturnValue(query([currentCollege]));
    models.collegeModel.collection.find.mockReturnValue(collectionCursor([legacyCollege]));
    models.departmentModel.find.mockReturnValue(query([]));

    const result = await models.service.getStructure(userId);

    expect(result.colleges.map((college) => college.name)).toEqual(['Current College', 'Legacy College']);
    expect(models.universityModel.updateOne).not.toHaveBeenCalled();
  });

  it('computes student statistics without mutating affiliations', async () => {
    const models = createService();
    models.studentModel.countDocuments.mockResolvedValue(2);
    models.studentModel.find.mockReturnValue(query([
      { academicInfo: { academicLevel: 'senior' }, skills: [{ name: 'React' }], aiMetrics: { readinessScore: 70, employmentStatus: 'seeking' } },
      { academicInfo: { academicLevel: 'graduate' }, skills: [{ name: 'React' }, { name: 'Docker' }], aiMetrics: { readinessScore: 90, employmentStatus: 'employed' } },
    ]));

    const result = await models.service.getStudentStatistics(userId);

    expect(result.summary).toEqual({ totalStudents: 2, activeStudents: 1, graduates: 1, averageReadiness: 80 });
    expect(result.topSkillsDistribution[0]).toEqual({ skill: 'React', count: 2 });
    expect(result.employmentTimeline).toEqual([]);
    expect(models.studentModel.updateOne).not.toHaveBeenCalled();
  });

  it('keeps analytics reads free of affiliation writes', async () => {
    const models = createService();
    models.studentModel.countDocuments.mockResolvedValue(1);
    models.studentModel.find.mockReturnValue(query([{
      academicInfo: { universityId, gpa: 3.4 },
      aiMetrics: { readinessScore: 70 },
    }]));
    models.collegeModel.find.mockReturnValue(query([]));
    models.departmentModel.find
      .mockReturnValueOnce(query([]))
      .mockReturnValueOnce(query([]));
    models.marketDataModel.find
      .mockReturnValueOnce(query([]))
      .mockReturnValueOnce(query([]));

    const result = await models.service.getAnalytics(userId);

    expect(result).toMatchObject({ totalStudents: 1, avgReadiness: 70, employmentByCollege: [], skillGapsByDepartment: [] });
    expect(models.studentModel.updateOne).not.toHaveBeenCalled();
    expect(models.universityModel.updateOne).not.toHaveBeenCalled();
  });

  it('creates a college only inside the authenticated university ownership scope', async () => {
    const models = createService();
    const created = {
      _id: collegeId,
      name: 'New College',
      code: 'NC',
      metadata: { status: 'active' },
      toObject: () => ({ _id: collegeId, name: 'New College', code: 'NC', metadata: { status: 'active' } }),
    };
    models.collegeModel.create.mockResolvedValue(created);
    jest.spyOn(models.service as any, 'syncEmbeddedStructure').mockResolvedValue(undefined);

    const result = await models.service.createCollege(userId, { name: 'New College', code: 'NC' });

    expect(models.collegeModel.collection.findOne).toHaveBeenCalledWith(expect.objectContaining({
      $or: [
        { universityId },
        { university: { $in: [universityId, university.userId] } },
      ],
    }));
    expect(models.collegeModel.create).toHaveBeenCalledWith(expect.objectContaining({ universityId, name: 'New College', code: 'NC' }));
    expect(result).toMatchObject({ name: 'New College', code: 'NC' });
  });

  it('rejects department creation when the college is outside the authenticated university', async () => {
    const models = createService();
    models.collegeModel.collection.findOne.mockResolvedValue(null);

    await expect(models.service.createDepartment(userId, collegeId.toString(), { name: 'Software' }))
      .rejects.toThrow('College not found');
    expect(models.departmentModel.create).not.toHaveBeenCalled();
  });

  it('limits a coordinator structure response to the assigned college', async () => {
    const models = createService();
    const coordinatorId = new Types.ObjectId();
    const otherCollegeId = new Types.ObjectId();
    models.universityModel.findOne
      .mockReturnValueOnce(query(null))
      .mockReturnValueOnce(query(university));
    models.staffModel.findOne.mockReturnValue(query({
      userId: coordinatorId,
      universityId,
      collegeId,
      role: 'coordinator',
      status: 'active',
      invitationStatus: 'accepted',
      permissions: ['structure:read', 'departments:write'],
    }));
    models.collegeModel.find.mockReturnValue(query([
      { _id: collegeId, name: 'Assigned College', metadata: { status: 'active' } },
      { _id: otherCollegeId, name: 'Other College', metadata: { status: 'active' } },
    ]));
    models.departmentModel.find.mockReturnValue(query([
      { _id: departmentId, collegeId, name: 'Assigned Department', metadata: { status: 'active' } },
      { _id: new Types.ObjectId(), collegeId: otherCollegeId, name: 'Hidden Department', metadata: { status: 'active' } },
    ]));

    const result = await models.service.getStructure(coordinatorId.toString());

    expect(result.colleges).toHaveLength(1);
    expect(result.colleges[0].id).toBe(collegeId.toString());
    expect(result.colleges[0].departments.map((item) => item.name)).toEqual(['Assigned Department']);
  });
});
