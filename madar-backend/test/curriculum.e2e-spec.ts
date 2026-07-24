import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { StudyPlanService } from '../src/universities/study-plans/study-plan.service';
import { CourseService } from '../src/universities/courses/course.service';
import { StudyPlanController } from '../src/universities/study-plans/study-plan.controller';
import { CourseController } from '../src/universities/courses/course.controller';
import { UniversitiesService } from '../src/universities/universities.service';
import { CurriculumService } from '../src/universities/curriculum/curriculum.service';
import { NotificationService } from '../src/common/notifications/notification.service';
import { PdfImportService } from '../src/universities/study-plans/pdf-import.service';

describe('Curriculum Workflow & Rules (e2e)', () => {
  let app: INestApplication;

  const mockUniversityId = '60d21b4667d0d8992e610c85';
  const mockCollegeId = '60d21b4667d0d8992e610c86';
  const mockCoordinatorId = '60d21b4667d0d8992e610c87';
  const mockUniversityAdminId = '60d21b4667d0d8992e610c88';

  const mockStudyPlanModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    updateOne: jest.fn().mockReturnThis(),
    lean: jest.fn(),
  };

  const mockCourseModel = {
    create: jest.fn(),
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    updateOne: jest.fn().mockReturnThis(),
    exists: jest.fn(),
    countDocuments: jest.fn(),
    lean: jest.fn(),
  };

  const mockCollegeCoordinatorModel = {
    findOne: jest.fn(),
  };

  const mockUniversityModel = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    updateOne: jest.fn(),
    lean: jest.fn(),
  };

  // Helper to make chained .lean()/.exec() return a specific value for university model queries
  function setUniversityLean(value: any) {
    const leanValue = Array.isArray(value) ? value : [value];
    mockUniversityModel.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(value) });
    mockUniversityModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue(leanValue), exec: jest.fn().mockResolvedValue(leanValue) });
  }

  const mockStudentModel = {
    find: jest.fn().mockReturnThis(),
    countDocuments: jest.fn(),
    lean: jest.fn(),
  };

  const mockApplicationModel = {
    find: jest.fn().mockReturnThis(),
    lean: jest.fn(),
  };

  const mockCurriculumAnalysisModel = {
    find: jest.fn().mockReturnThis(),
    lean: jest.fn(),
  };

  const mockAuditLogModel = {
    create: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
  };

  const mockCurriculumService = {
    refreshAnalysisForDepartment: jest.fn(),
  };

  const mockPdfImportService = {
    uploadAndParse: jest.fn(),
    getImportJob: jest.fn(),
    confirmImport: jest.fn(),
    cancelImport: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [],
      providers: [
        StudyPlanService,
        CourseService,
        UniversitiesService,
        { provide: getModelToken('StudyPlan'), useValue: mockStudyPlanModel },
        { provide: getModelToken('Course'), useValue: mockCourseModel },
        { provide: getModelToken('CollegeCoordinator'), useValue: mockCollegeCoordinatorModel },
        { provide: getModelToken('University'), useValue: mockUniversityModel },
        { provide: getModelToken('Student'), useValue: mockStudentModel },
        { provide: getModelToken('Application'), useValue: mockApplicationModel },
        { provide: getModelToken('CurriculumAnalysis'), useValue: mockCurriculumAnalysisModel },
        { provide: getModelToken('AuditLog'), useValue: mockAuditLogModel },
        { provide: getModelToken('College'), useValue: {} },
        { provide: getModelToken('Department'), useValue: {} },
        { provide: getModelToken('Skill'), useValue: {} },
        { provide: getModelToken('Job'), useValue: {} },
        { provide: getModelToken('MatchResult'), useValue: {} },
        { provide: getModelToken('SkillGap'), useValue: {} },
        { provide: getModelToken('MarketData'), useValue: {} },
        { provide: getModelToken('StudentAffiliation'), useValue: {} },
        { provide: getModelToken('User'), useValue: {} },
        { provide: 'AuditService', useValue: mockAuditLogModel },
        { provide: NotificationService, useValue: mockNotificationsService },
        { provide: CurriculumService, useValue: mockCurriculumService },
        { provide: PdfImportService, useValue: mockPdfImportService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('Study Plan State Machine', () => {
    let studyPlanService: StudyPlanService;
    
    beforeAll(() => {
      studyPlanService = app.get<StudyPlanService>(StudyPlanService);
    });

    it('should prevent submitting an empty study plan', async () => {
      setUniversityLean({ _id: mockUniversityId, userId: mockUniversityAdminId });
      mockStudyPlanModel.findOne.mockReturnThis();
      mockStudyPlanModel.lean.mockResolvedValueOnce({ _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', courses: [], status: 'draft' });
      
      await expect(studyPlanService.submit(mockUniversityAdminId, 'aaaaaaaaaaaaaaaaaaaaaaaa')).rejects.toThrow('Cannot submit an empty study plan');
    });

    it('should activate a plan and archive the previous version', async () => {
      setUniversityLean({ _id: mockUniversityId, userId: mockUniversityAdminId });
      mockStudyPlanModel.findOne.mockReturnThis();
      mockStudyPlanModel.lean.mockResolvedValueOnce({ _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', status: 'approved', previousVersionId: 'aaaaaaaaaaaaaaaaaaaaaaaa' });
      mockStudyPlanModel.lean.mockResolvedValueOnce({ _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', status: 'active' });
      
      await studyPlanService.activate(mockUniversityAdminId, 'bbbbbbbbbbbbbbbbbbbbbbbb');
      
      expect(mockStudyPlanModel.updateOne).toHaveBeenCalledWith(
        { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa' },
        { $set: { status: 'archived' } }
      );
      expect(mockStudyPlanModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'bbbbbbbbbbbbbbbbbbbbbbbb',
        { $set: { status: 'active' } },
        { new: true }
      );
    });
  });

  describe('Course Rules & Prerequisites Constraints', () => {
    let courseService: CourseService;

    beforeAll(() => {
      courseService = app.get<CourseService>(CourseService);
    });

    it('should throw conflict error for duplicate course code', async () => {
      setUniversityLean({ _id: mockUniversityId, userId: mockUniversityAdminId });
      mockStudyPlanModel.findOne.mockReturnThis();
      mockStudyPlanModel.lean.mockResolvedValueOnce({ _id: 'cccccccccccccccccccccccc', universityId: mockUniversityId, status: 'draft' });
      
      mockCourseModel.exists.mockResolvedValueOnce(true);

      const dto = { studyPlanId: 'cccccccccccccccccccccccc', code: 'CS101', name: 'Intro', creditHours: 3, level: 1, semester: 1, type: 'required' as const };
      await expect(courseService.create(mockUniversityAdminId, dto)).rejects.toThrow('Course code already exists in this plan');
    });

    it('should prevent circular prerequisites', async () => {
      setUniversityLean({ _id: mockUniversityId, userId: mockUniversityAdminId });
      mockStudyPlanModel.findOne.mockReturnThis();
      mockStudyPlanModel.lean.mockResolvedValue({ _id: 'cccccccccccccccccccccccc', universityId: mockUniversityId, status: 'draft' });
      
      mockCourseModel.findOne.mockReturnThis();
      mockCourseModel.lean.mockResolvedValueOnce({ _id: 'dddddddddddddddddddddddd', studyPlanId: 'cccccccccccccccccccccccc', code: 'CS102', prerequisites: [] });

      // Mock course find to build dependency graph: course1 has prerequisite course2
      const mockFind = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockLean = jest.fn().mockResolvedValue([
        { _id: 'eeeeeeeeeeeeeeeeeeeeeeee', prerequisites: ['dddddddddddddddddddddddd'] },
        { _id: 'dddddddddddddddddddddddd', prerequisites: [] }
      ]);
      (courseService as any).model.find = mockFind;
      mockFind.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ lean: mockLean });
      mockCourseModel.countDocuments.mockResolvedValueOnce(1);

      // Updating course2 to require course1, creating circular dependency course1->course2->course1
      const updateDto = { prerequisites: ['eeeeeeeeeeeeeeeeeeeeeeee'] };
      await expect(courseService.update(mockUniversityAdminId, 'dddddddddddddddddddddddd', updateDto)).rejects.toThrow('Circular course prerequisites are not allowed');
    });
  });

  describe('KPIs and Employment Calculation (UniversitiesService)', () => {
    let universitiesService: UniversitiesService;

    beforeAll(() => {
      universitiesService = app.get<UniversitiesService>(UniversitiesService);
    });

    it('should strictly use confirmed_employed status for employment rate', async () => {
      // Mock two active universities
      const unis = [
        { _id: 'uni1', status: 'active', name: 'Uni A' }
      ];
      setUniversityLean(unis);

      // Mock students (graduates)
      const graduates = [
        { _id: 'student1', academicInfo: { academicLevel: 'graduate', universityId: 'uni1' } },
        { _id: 'student2', academicInfo: { academicLevel: 'graduate', universityId: 'uni1' } }
      ];
      mockStudentModel.find.mockReturnThis();
      mockStudentModel.lean.mockResolvedValue(graduates);

      // Mock applications: student1 is confirmed_employed, student2 is just accepted (not confirmed)
      const apps = [
        { studentId: 'student1', status: 'confirmed_employed' },
        { studentId: 'student2', status: 'accepted' }
      ];
      mockApplicationModel.find.mockReturnThis();
      mockApplicationModel.lean.mockResolvedValue(apps);

      // Mock analyses to return empty list
      mockCurriculumAnalysisModel.find.mockReturnThis();
      mockCurriculumAnalysisModel.lean.mockResolvedValue([]);

      await universitiesService.calculateRankings();

      // Dana is confirmed employed -> 1 / 2 graduates = 50%
      expect(mockUniversityModel.updateOne).toHaveBeenCalledWith(
        { _id: 'uni1' },
        expect.objectContaining({
          $set: expect.objectContaining({
            'analytics.employmentRate': 50,
            'statistics.employedConfirmed': 1,
            'statistics.totalGraduates': 2
          })
        })
      );
    });
  });
});
