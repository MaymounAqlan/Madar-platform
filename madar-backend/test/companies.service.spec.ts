import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CompaniesService } from '../src/companies/companies.service';

describe('CompaniesService', () => {
  let service: CompaniesService;

  const mockCompany = {
    _id: '650000000000000000000201',
    user: '650000000000000000000201',
    name: 'Test Company',
    industry: 'Technology',
    size: '50-200',
    location: 'Riyadh',
  };

  const mockJob = {
    _id: 'job-001',
    company: '650000000000000000000201',
    title: 'Software Engineer',
    status: 'active',
    applicationsCount: 5,
  };

  const mockCompanyModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
  };

  const mockJobModel = {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockApplicationModel = {
    find: jest.fn(),
    countDocuments: jest.fn(),
  };

  const mockStudentModel = {
    find: jest.fn(),
    findById: jest.fn(),
  };

  const mockMatchResultModel = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockNotificationService = {
    send: jest.fn(),
  };

  const mockAuditLogService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: getModelToken('Company'), useValue: mockCompanyModel },
        { provide: getModelToken('Job'), useValue: mockJobModel },
        { provide: getModelToken('Application'), useValue: mockApplicationModel },
        { provide: getModelToken('Student'), useValue: mockStudentModel },
        { provide: getModelToken('MatchResult'), useValue: mockMatchResultModel },
        { provide: 'NotificationService', useValue: mockNotificationService },
        { provide: 'AuditLogService', useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should return dashboard data for a company', async () => {
      mockCompanyModel.findOne.mockResolvedValue(mockCompany);
      mockJobModel.countDocuments.mockResolvedValue(5);
      mockApplicationModel.countDocuments.mockResolvedValue(12);
      mockJobModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockJob]),
        }),
      });

      const result = await service.getDashboard('650000000000000000000201');

      expect(result).toHaveProperty('company');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('recentJobs');
    });
  });

  describe('searchCandidates', () => {
    it('should return candidates with match scores', async () => {
      const mockCandidates = [
        { _id: 'student-1', firstName: 'Ahmed', skills: [{ name: 'Python' }] },
        { _id: 'student-2', firstName: 'Sara', skills: [{ name: 'Java' }] },
      ];

      mockStudentModel.find.mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockCandidates),
          }),
        }),
      });
      mockStudentModel.find.mockReturnValue({
        countDocuments: jest.fn().mockResolvedValue(2),
      });
      mockMatchResultModel.find.mockResolvedValue([]);

      const result = await service.searchCandidates('650000000000000000000201', {});

      expect(result).toHaveProperty('candidates');
      expect(result).toHaveProperty('total');
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      mockCompanyModel.findOne.mockResolvedValue(mockCompany);
      mockJobModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([mockJob]),
      });
      mockApplicationModel.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([]),
      });

      const result = await service.getAnalytics('650000000000000000000201');

      expect(result).toHaveProperty('overview');
      expect(result).toHaveProperty('byJob');
    });
  });
});
