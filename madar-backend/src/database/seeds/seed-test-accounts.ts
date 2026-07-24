import mongoose, { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserSchema } from '../../users/schemas/user.schema';
import { Role, RoleSchema } from '../../users/roles/schemas/role.schema';
import { University, UniversitySchema } from '../../universities/schemas/university.schema';
import { College, CollegeSchema } from '../../universities/colleges/schemas/college.schema';
import { Department, DepartmentSchema } from '../../universities/departments/schemas/department.schema';
import { CollegeCoordinator, CollegeCoordinatorSchema } from '../../universities/college-coordinators/schemas/college-coordinator.schema';
import { Student, StudentSchema } from '../../students/schemas/student.schema';
import { StudentAffiliation, StudentAffiliationSchema } from '../../universities/student-affiliations/schemas/student-affiliation.schema';
import { StudyPlan, StudyPlanSchema } from '../../universities/study-plans/schemas/study-plan.schema';
import { Course, CourseSchema } from '../../universities/courses/schemas/course.schema';
import { AcademicRecommendation, AcademicRecommendationSchema } from '../../universities/curriculum/schemas/academic-recommendation.schema';
import { Company, CompanySchema } from '../../companies/schemas/company.schema';
import { Job, JobSchema } from '../../jobs/schemas/job.schema';
import { Application, ApplicationSchema } from '../../applications/schemas/application.schema';
import { CurriculumAnalysis, CurriculumAnalysisSchema } from '../../universities/curriculum/schemas/curriculum-analysis.schema';
import { AdminPermission, ALL_ADMIN_PERMISSIONS } from '../../users/permissions/permission.registry';

const TEST_DOMAIN = '@madar.test';

function assertSafeEnvironment(): void {
  if (process.env.NODE_ENV === 'production') throw new Error('Test account seed is disabled in production');
  if (process.env.ENABLE_TEST_SEED !== 'true') throw new Error('Set ENABLE_TEST_SEED=true to run the test account seed');
  const password = process.env.TEST_ACCOUNT_DEFAULT_PASSWORD || '';
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{10,}$/.test(password)) {
    throw new Error('TEST_ACCOUNT_DEFAULT_PASSWORD must be at least 10 characters and contain uppercase, lowercase, and a number');
  }
}

async function ensureUser(model: Model<any>, passwordHash: string, data: Record<string, any>): Promise<any> {
  const existing: any = await model.findOne({ email: data.email }).lean();
  if (existing) {
    if (!String(existing.email).endsWith(TEST_DOMAIN) && !String(existing.email).includes('edu') && !String(existing.email).includes('.ye') && !String(existing.email).includes('.net')) {
      throw new Error(`Existing account ${data.email} is not a compatible test account`);
    }
    const updates: any = {};
    if (existing.userType !== data.userType) updates.userType = data.userType;
    if (Object.keys(updates).length > 0 || !(await bcrypt.compare(process.env.TEST_ACCOUNT_DEFAULT_PASSWORD || '', existing.password || ''))) {
      updates.password = passwordHash;
    }
    if (Object.keys(updates).length > 0) {
      await model.updateOne({ _id: existing._id }, { $set: updates });
    }
    return { ...existing, ...updates };
  }
  return model.create({ ...data, password: passwordHash, isVerified: true, isEmailVerified: true });
}

async function ensureUniversity(model: Model<any>, userId: Types.ObjectId, data: Record<string, any>): Promise<any> {
  const { status, suspensionReason, ...insertData } = data;
  return model.findOneAndUpdate(
    { userId },
    {
      $setOnInsert: { userId, ...insertData, submittedAt: new Date() },
      $set: { status, ...(suspensionReason ? { suspensionReason } : {}) },
      ...(status !== 'suspended' ? { $unset: { suspensionReason: 1 } } : {}),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
}

async function ensureCollege(model: Model<any>, universityId: Types.ObjectId, data: Record<string, any>): Promise<any> {
  return model.findOneAndUpdate(
    { universityId, code: data.code },
    { $setOnInsert: { universityId, ...data } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
}

async function ensureDepartment(model: Model<any>, universityId: Types.ObjectId, collegeId: Types.ObjectId, data: Record<string, any>): Promise<any> {
  const { metadata, ...insertData } = data;
  return model.findOneAndUpdate(
    { collegeId, code: data.code },
    { $setOnInsert: { universityId, collegeId, ...insertData }, $set: { 'metadata.status': metadata?.status || 'active', 'metadata.testData': true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
}

export async function seedTestAccounts(): Promise<void> {
  assertSafeEnvironment();
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';
  await mongoose.connect(uri);

  const UserModel = (mongoose.models[User.name] || mongoose.model(User.name, UserSchema)) as Model<any>;
  const RoleModel = (mongoose.models[Role.name] || mongoose.model(Role.name, RoleSchema)) as Model<any>;
  const UniversityModel = (mongoose.models[University.name] || mongoose.model(University.name, UniversitySchema)) as Model<any>;
  const CollegeModel = (mongoose.models[College.name] || mongoose.model(College.name, CollegeSchema)) as Model<any>;
  const DepartmentModel = (mongoose.models[Department.name] || mongoose.model(Department.name, DepartmentSchema)) as Model<any>;
  const StaffModel = (mongoose.models[CollegeCoordinator.name] || mongoose.model(CollegeCoordinator.name, CollegeCoordinatorSchema)) as Model<any>;
  const StudentModel = (mongoose.models[Student.name] || mongoose.model(Student.name, StudentSchema)) as Model<any>;
  const AffiliationModel = (mongoose.models[StudentAffiliation.name] || mongoose.model(StudentAffiliation.name, StudentAffiliationSchema)) as Model<any>;
  const StudyPlanModel = (mongoose.models[StudyPlan.name] || mongoose.model(StudyPlan.name, StudyPlanSchema)) as Model<any>;
  const CourseModel = (mongoose.models[Course.name] || mongoose.model(Course.name, CourseSchema)) as Model<any>;
  const RecommendationModel = (mongoose.models[AcademicRecommendation.name] || mongoose.model(AcademicRecommendation.name, AcademicRecommendationSchema)) as Model<any>;
  const CompanyModel = (mongoose.models[Company.name] || mongoose.model(Company.name, CompanySchema)) as Model<any>;
  const JobModel = (mongoose.models[Job.name] || mongoose.model(Job.name, JobSchema)) as Model<any>;
  const ApplicationModel = (mongoose.models[Application.name] || mongoose.model(Application.name, ApplicationSchema)) as Model<any>;
  const AnalysisModel = (mongoose.models[CurriculumAnalysis.name] || mongoose.model(CurriculumAnalysis.name, CurriculumAnalysisSchema)) as Model<any>;

  const passwordHash = await bcrypt.hash(process.env.TEST_ACCOUNT_DEFAULT_PASSWORD!, 10);

  const user = (email: string, userType: string, firstName: string, lastName: string, status = 'active') =>
    ensureUser(UserModel, passwordHash, { email, userType, firstName, lastName, firstNameAr: firstName, lastNameAr: lastName, status, phone: '+966500000000' });

  await user('superadmin.test@madar.test', 'super_admin', 'Test', 'Super Admin');
  const activeOwner = await user('university.active@madar.test', 'university', 'Active', 'University Admin');
  const pendingOwner = await user('university.pending@madar.test', 'university', 'Pending', 'University Admin');
  const suspendedOwner = await user('university.suspended@madar.test', 'university', 'Suspended', 'University Admin');
  const competitorOwner = await user('university.competitor@madar.test', 'university', 'Competitor', 'University Admin');

  const activeUniversity = await ensureUniversity(UniversityModel, activeOwner._id, {
    name: 'MADAR Development University', shortName: 'MDU', nameAr: 'جامعة مدار للتطوير', description: 'Development-only university for institutional access verification.',
    descriptionAr: 'جامعة مخصصة لاختبارات التطوير والتحقق من الصلاحيات.', status: 'active',
    branding: { logoUrl: '', primaryColor: '#9fe870', secondaryColor: '#0e0f0c' },
    location: { city: 'Riyadh', country: 'Saudi Arabia', address: 'Development Campus', coordinates: { lat: 24.7136, lng: 46.6753 } },
    contactInfo: { email: 'university.active@madar.test', phone: '+966500000001', website: 'https://example.edu', hrEmail: 'office.active@madar.test' },
    analytics: { totalStudents: 5, totalGraduates: 2, totalFaculty: 0, averageGpa: 3.42, employmentRate: 50, averageTimeToEmployment: 3, topHiredSkills: ['TypeScript', 'Python', 'Data Analysis'], industryPartnerships: 2 },
  });

  const competitorUniversity = await ensureUniversity(UniversityModel, competitorOwner._id, {
    name: 'MADAR Competitor University', shortName: 'MCU', nameAr: 'جامعة مدار المنافسة', description: 'Competitor benchmark university.',
    descriptionAr: 'جامعة مدار المنافسة للمقارنة المرجعية.', status: 'active',
    branding: { logoUrl: '', primaryColor: '#3b82f6', secondaryColor: '#1e3a8a' },
    location: { city: 'Jeddah', country: 'Saudi Arabia', address: 'Jeddah Campus', coordinates: { lat: 21.4858, lng: 39.1925 } },
    contactInfo: { email: 'university.competitor@madar.test', phone: '+966500000004', website: 'https://competitor.edu', hrEmail: 'office.competitor@madar.test' },
  });

  await ensureUniversity(UniversityModel, pendingOwner._id, {
    name: 'MADAR Pending Test University', description: 'Development-only pending university.', status: 'pending',
    location: { city: 'Jeddah', country: 'Saudi Arabia', address: 'Pending Test Campus' },
    contactInfo: { email: 'university.pending@madar.test', phone: '+966500000002', website: 'https://example.edu', hrEmail: 'pending.office@madar.test' },
  });
  await ensureUniversity(UniversityModel, suspendedOwner._id, {
    name: 'MADAR Suspended Test University', description: 'Development-only suspended university.', status: 'suspended', suspensionReason: 'Development access-control test',
    location: { city: 'Dammam', country: 'Saudi Arabia', address: 'Suspended Test Campus' },
    contactInfo: { email: 'university.suspended@madar.test', phone: '+966500000003', website: 'https://example.edu', hrEmail: 'suspended.office@madar.test' },
  });

  const computing = await ensureCollege(CollegeModel, activeUniversity._id, {
    name: 'College of Computing and AI', nameAr: 'كلية الحوسبة والذكاء الاصطناعي', code: 'TEST-CAI', description: 'Development test college.', dean: 'Dr. Test Computing', studentCount: 2,
    analytics: { totalStudents: 2, totalGraduates: 1, employmentRate: 50, averageReadinessScore: 78, averageGpa: 3.5, topSkills: [], skillGaps: [], skillAlignmentScore: 74 }, metadata: { status: 'active', testData: true },
  });
  const engineering = await ensureCollege(CollegeModel, activeUniversity._id, {
    name: 'College of Engineering', nameAr: 'كلية الهندسة', code: 'TEST-ENG', description: 'Development test college.', dean: 'Dr. Test Engineering', studentCount: 2,
    analytics: { totalStudents: 2, totalGraduates: 0, employmentRate: 50, averageReadinessScore: 70, averageGpa: 3.34, topSkills: [], skillGaps: [], skillAlignmentScore: 68 }, metadata: { status: 'active', testData: true },
  });
  const business = await ensureCollege(CollegeModel, activeUniversity._id, {
    name: 'College of Business', nameAr: 'كلية الأعمال', code: 'TEST-BUS', description: 'Development test college.', dean: 'Dr. Test Business', studentCount: 1,
    analytics: { totalStudents: 1, totalGraduates: 1, employmentRate: 100, averageReadinessScore: 75, averageGpa: 3.4, topSkills: [], skillGaps: [], skillAlignmentScore: 72 }, metadata: { status: 'active', testData: true },
  });

  const compCollege = await ensureCollege(CollegeModel, competitorUniversity._id, {
    name: 'College of Computer Science', nameAr: 'كلية علوم الحاسب', code: 'COMP-CS', description: 'Competitor CS college.', dean: 'Dr. Competitor CS', studentCount: 2,
    analytics: { totalStudents: 2, totalGraduates: 1, employmentRate: 80, averageReadinessScore: 82, averageGpa: 3.6 }, metadata: { status: 'active', testData: true },
  });

  const departments = [
    await ensureDepartment(DepartmentModel, activeUniversity._id, computing._id, { name: 'Data Science', nameAr: 'علوم البيانات', code: 'TEST-DS', description: 'Development test department.', head: 'Dr. Test Data', studentCount: 1, analytics: { averageReadinessScore: 82, employmentRate: 50, skillGaps: ['MLOps'], curriculumGaps: [] }, metadata: { status: 'active', testData: true } }),
    await ensureDepartment(DepartmentModel, activeUniversity._id, computing._id, { name: 'Software Engineering', nameAr: 'هندسة البرمجيات', code: 'TEST-SE', description: 'Development test department.', head: 'Dr. Test Software', studentCount: 1, analytics: { averageReadinessScore: 74, employmentRate: 50, skillGaps: ['Cloud Architecture'], curriculumGaps: [] }, metadata: { status: 'active', testData: true } }),
    await ensureDepartment(DepartmentModel, activeUniversity._id, engineering._id, { name: 'Electrical Engineering', nameAr: 'الهندسة الكهربائية', code: 'TEST-EE', description: 'Development test department.', head: 'Dr. Test Electrical', studentCount: 1, analytics: { averageReadinessScore: 72, employmentRate: 50, skillGaps: ['IoT Security'], curriculumGaps: [] }, metadata: { status: 'active', testData: true } }),
    await ensureDepartment(DepartmentModel, activeUniversity._id, engineering._id, { name: 'Mechanical Engineering', nameAr: 'الهندسة الميكانيكية', code: 'TEST-ME', description: 'Development test department.', head: 'Dr. Test Mechanical', studentCount: 1, analytics: { averageReadinessScore: 68, employmentRate: 50, skillGaps: ['Digital Twins'], curriculumGaps: [] }, metadata: { status: 'active', testData: true } }),
    await ensureDepartment(DepartmentModel, activeUniversity._id, business._id, { name: 'Business Analytics', nameAr: 'تحليلات الأعمال', code: 'TEST-BA', description: 'Development test department.', head: 'Dr. Test Analytics', studentCount: 1, analytics: { averageReadinessScore: 75, employmentRate: 100, skillGaps: ['Forecasting'], curriculumGaps: [] }, metadata: { status: 'active', testData: true } }),
  ];

  const compDept = await ensureDepartment(DepartmentModel, competitorUniversity._id, compCollege._id, { 
    name: 'Software Systems', nameAr: 'أنظمة البرمجيات', code: 'COMP-SS', description: 'Competitor software department.', head: 'Dr. Competitor SS', studentCount: 2, 
    analytics: { averageReadinessScore: 82, employmentRate: 80, skillGaps: ['TypeScript'], curriculumGaps: [] }, metadata: { status: 'active', testData: true } 
  });

  const staffDefinitions = [
    { email: 'coordinator.test@madar.test', role: 'coordinator', name: ['Test', 'Coordinator'], collegeId: computing._id, permissions: ['dashboard:read', 'structure:read', 'students:read', 'analytics:read', 'departments:write', 'study-plans:read', 'study-plans:write', 'courses:read', 'courses:write'], userStatus: 'active', staffStatus: 'active' },
    { email: 'coordinator.engineering.test@madar.test', role: 'coordinator', name: ['Engineering', 'Coordinator'], collegeId: engineering._id, permissions: ['dashboard:read', 'structure:read', 'students:read', 'analytics:read', 'departments:write', 'curriculum:write'], userStatus: 'active', staffStatus: 'active' },
    { email: 'coordinator.business.test@madar.test', role: 'coordinator', name: ['Business', 'Coordinator'], collegeId: business._id, permissions: ['dashboard:read', 'structure:read', 'students:read', 'analytics:read', 'departments:write', 'curriculum:write'], userStatus: 'active', staffStatus: 'active' },
    { email: 'viewer.test@madar.test', role: 'university_viewer', name: ['Test', 'Viewer'], permissions: ['dashboard:read', 'structure:read', 'students:read', 'analytics:read'], userStatus: 'active', staffStatus: 'active' },
    { email: 'data.officer.test@madar.test', role: 'data_officer', name: ['Test', 'Data Officer'], permissions: ['dashboard:read', 'structure:read', 'students:read', 'analytics:read'], userStatus: 'active', staffStatus: 'active' },
    { email: 'quality.officer.test@madar.test', role: 'quality_officer', name: ['Test', 'Quality Officer'], permissions: ['dashboard:read', 'structure:read', 'students:read', 'analytics:read'], userStatus: 'active', staffStatus: 'active' },
    { email: 'academic.development.test@madar.test', role: 'academic_development_officer', name: ['Academic', 'Development Officer'], permissions: ['dashboard:read', 'structure:read', 'students:read', 'analytics:read', 'curriculum:write'], userStatus: 'active', staffStatus: 'active' },
    { email: 'disabled.staff.test@madar.test', role: 'university_viewer', name: ['Disabled', 'Test Staff'], permissions: ['dashboard:read'], userStatus: 'suspended', staffStatus: 'inactive' },
  ];
  for (const definition of staffDefinitions) {
    const staffUser = await user(definition.email, definition.role, definition.name[0], definition.name[1], definition.userStatus);
    await StaffModel.findOneAndUpdate(
      { userId: staffUser._id },
      { $setOnInsert: { userId: staffUser._id, universityId: activeUniversity._id, collegeId: definition.collegeId, role: definition.role, permissions: definition.permissions, status: definition.staffStatus, invitationStatus: 'accepted', invitedBy: activeOwner._id, invitedAt: new Date(), lastInvitedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  // Students seeding
  const studentDefinitions = [
    { email: 'student.ds.test@madar.test', firstName: 'Dana', lastName: 'Data', college: computing, department: departments[0], level: 'graduate', gpa: 3.8, readiness: 84, skills: ['Python', 'Data Analysis', 'SQL'], affiliationStatus: 'graduated' },
    { email: 'student.se.test@madar.test', firstName: 'Sami', lastName: 'Software', college: computing, department: departments[1], level: 'graduate', gpa: 3.5, readiness: 76, skills: ['TypeScript', 'React', 'Docker'], affiliationStatus: 'graduated' },
    { email: 'student.ee.test@madar.test', firstName: 'Eman', lastName: 'Electrical', college: engineering, department: departments[2], level: 'junior', gpa: 3.3, readiness: 72, skills: ['Embedded Systems', 'C++'], affiliationStatus: 'verified' },
    { email: 'student.me.test@madar.test', firstName: 'Majed', lastName: 'Mechanical', college: engineering, department: departments[3], level: 'senior', gpa: 3.1, readiness: 68, skills: ['CAD', 'Simulation'], affiliationStatus: 'verified' },
    { email: 'student.business.test@madar.test', firstName: 'Noura', lastName: 'Business', college: business, department: departments[4], level: 'graduate', gpa: 3.4, readiness: 75, skills: ['Business Analysis', 'Excel', 'SQL'], affiliationStatus: 'graduated' },
  ];
  const activeStudentObjs = [];
  for (let index = 0; index < studentDefinitions.length; index += 1) {
    const definition = studentDefinitions[index];
    const studentUser = await user(definition.email, 'student', definition.firstName, definition.lastName);
    const student: any = await StudentModel.findOneAndUpdate(
      { userId: studentUser._id },
      { $setOnInsert: {
        userId: studentUser._id,
        personalInfo: { firstName: definition.firstName, lastName: definition.lastName, phone: `+9665000001${index}`, address: { city: 'Riyadh', country: 'Saudi Arabia' }, languages: ['Arabic', 'English'], bio: 'Development test student.' },
        academicInfo: { universityId: activeUniversity._id, universityName: activeUniversity.name, collegeId: definition.college._id, collegeName: definition.college.name, departmentId: definition.department._id, departmentName: definition.department.name, studentId: `TEST-ST-${index + 1}`, enrollmentYear: 2022, expectedGraduation: 2026, academicLevel: definition.level, gpa: definition.gpa, academicStanding: 'good' },
        skills: definition.skills.map((name) => ({ name, category: 'technical', proficiency: 75, source: 'self_assessed', verified: false })),
        aiMetrics: { readinessScore: definition.readiness, employabilityIndex: definition.readiness - 3, skillDiversityScore: 70, experienceScore: 55, projectQualityScore: 65, lastCalculatedAt: new Date() },
        professionalProfile: { headline: 'Development test student', careerInterests: ['Technology'], preferredLocations: ['Riyadh'], preferredJobTypes: ['full_time'], availability: 'immediate' },
      } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    activeStudentObjs.push(student);
    await AffiliationModel.findOneAndUpdate(
      { studentId: student._id, isCurrent: true },
      { $setOnInsert: {
        studentId: student._id, universityId: activeUniversity._id, collegeId: definition.college._id,
        departmentId: definition.department._id, studentNumber: 'TEST-ST-' + (index + 1),
        academicLevel: definition.level, enrollmentYear: 2022, expectedGraduationYear: 2026,
        status: definition.affiliationStatus, verificationMethod: 'institutional', isCurrent: true,
        verifiedBy: definition.affiliationStatus === 'verified' ? activeOwner._id : undefined,
        verifiedAt: definition.affiliationStatus === 'verified' ? new Date() : undefined, decisions: [],
      } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  // Competitor university students
  const compStudents = [
    { email: 'student.comp1@madar.test', firstName: 'Khalid', lastName: 'Competitor', college: compCollege, department: compDept, level: 'graduate', gpa: 3.7, readiness: 81, skills: ['Python', 'SQL', 'Java'], affiliationStatus: 'graduated' },
    { email: 'student.comp2@madar.test', firstName: 'Sara', lastName: 'Competitor', college: compCollege, department: compDept, level: 'graduate', gpa: 3.5, readiness: 79, skills: ['JavaScript', 'HTML/CSS'], affiliationStatus: 'graduated' }
  ];
  const compStudentObjs = [];
  for (let index = 0; index < compStudents.length; index += 1) {
    const definition = compStudents[index];
    const studentUser = await user(definition.email, 'student', definition.firstName, definition.lastName);
    const student: any = await StudentModel.findOneAndUpdate(
      { userId: studentUser._id },
      { $setOnInsert: {
        userId: studentUser._id,
        personalInfo: { firstName: definition.firstName, lastName: definition.lastName, phone: `+9665000002${index}`, address: { city: 'Jeddah', country: 'Saudi Arabia' }, languages: ['Arabic', 'English'] },
        academicInfo: { universityId: competitorUniversity._id, universityName: competitorUniversity.name, collegeId: definition.college._id, collegeName: definition.college.name, departmentId: definition.department._id, departmentName: definition.department.name, studentId: `COMP-ST-${index + 1}`, enrollmentYear: 2022, expectedGraduation: 2026, academicLevel: definition.level, gpa: definition.gpa, academicStanding: 'good' },
        skills: definition.skills.map((name) => ({ name, category: 'technical', proficiency: 75, source: 'self_assessed', verified: false })),
        aiMetrics: { readinessScore: definition.readiness, employabilityIndex: definition.readiness - 3, skillDiversityScore: 70, lastCalculatedAt: new Date() },
      } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    compStudentObjs.push(student);
    await AffiliationModel.findOneAndUpdate(
      { studentId: student._id, isCurrent: true },
      { $setOnInsert: {
        studentId: student._id, universityId: competitorUniversity._id, collegeId: definition.college._id,
        departmentId: definition.department._id, studentNumber: 'COMP-ST-' + (index + 1),
        academicLevel: definition.level, enrollmentYear: 2022, expectedGraduationYear: 2026,
        status: definition.affiliationStatus, verificationMethod: 'institutional', isCurrent: true,
      } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  // Company and Jobs
  const companyUser = await user('company.test@madar.test', 'company', 'Test', 'Company Recruiter');
  const company: any = await CompanyModel.findOneAndUpdate(
    { userId: companyUser._id },
    { $setOnInsert: {
      userId: companyUser._id,
      profile: { name: 'MADAR Technology Co.', legalName: 'MADAR Tech', description: 'Tech recruiter company.', descriptionAr: 'شركة تقنية تجريبية.', industry: 'Software Development', companySize: '51-200', foundedYear: 2020, website: 'https://madartech.test', logoUrl: '', coverImageUrl: '', verified: true, verificationStatus: 'verified' },
      headquarters: { city: 'Riyadh', country: 'Saudi Arabia' },
      status: 'active'
    } },
    { upsert: true, new: true }
  ).lean();

  const job: any = await JobModel.findOneAndUpdate(
    { companyId: company._id, title: 'Junior Data Scientist' },
    { $setOnInsert: {
      companyId: company._id, title: 'Junior Data Scientist', titleAr: 'محلل بيانات مبتدئ', description: 'Data science position.', descriptionAr: 'وظيفة علوم بيانات.', department: 'Engineering', location: 'Riyadh', type: 'full_time', status: 'active', requirements: ['Python', 'SQL'], salary: { min: 8000, max: 12000, currency: 'SAR' }, postedAt: new Date()
    } },
    { upsert: true, new: true }
  ).lean();

  // Create Applications with diverse statuses
  const appsToSeed = [
    { student: activeStudentObjs[0], status: 'confirmed_employed' }, // Dana -> Confirmed Employed (MDU)
    { student: activeStudentObjs[1], status: 'under_review' },        // Sami -> Under Review (MDU)
    { student: activeStudentObjs[2], status: 'rejected' },            // Eman -> Rejected (MDU)
    { student: activeStudentObjs[3], status: 'applied' },             // Majed -> Applied (MDU)
    { student: activeStudentObjs[4], status: 'offered' },             // Noura -> Offered (MDU)
    { student: compStudentObjs[0], status: 'confirmed_employed' },  // Khalid -> Confirmed (MCU)
    { student: compStudentObjs[1], status: 'accepted' },            // Sara -> Accepted (MCU)
  ];

  for (const app of appsToSeed) {
    if (app.student) {
      await ApplicationModel.findOneAndUpdate(
        { studentId: app.student._id, jobId: job._id },
        { $setOnInsert: {
          studentId: app.student._id,
          jobId: job._id,
          companyId: company._id,
          status: app.status,
          matchSnapshot: { matchScore: 85, skillMatch: 80, experienceMatch: 70, educationMatch: 90, calculatedAt: new Date() }
        } },
        { upsert: true }
      );
    }
  }

  // Seed study plans and bilingual courses
  const plan: any = await StudyPlanModel.findOneAndUpdate(
    { universityId: activeUniversity._id, departmentId: departments[0]._id, academicYear: '2026-2027', version: 1 },
    { $setOnInsert: { universityId: activeUniversity._id, collegeId: computing._id, departmentId: departments[0]._id, name: 'Data Science Development Plan', nameAr: 'خطة علوم البيانات التجريبية', description: 'Development test curriculum.', totalCredits: 132, academicYear: '2026-2027', version: 1, status: 'draft', courses: [], levels: [], createdBy: activeOwner._id, metadata: { testData: true } } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  const course: any = await CourseModel.findOneAndUpdate(
    { studyPlanId: plan._id, code: 'TEST-AI-401' },
    { $setOnInsert: {
      universityId: activeUniversity._id, collegeId: computing._id, departmentId: departments[0]._id, studyPlanId: plan._id, code: 'TEST-AI-401',
      name: 'Applied Artificial Intelligence', nameAr: 'الذكاء الاصطناعي التطبيقي',
      description: 'Development test course (English).', descriptionAr: 'وصف مقرر الذكاء الاصطناعي باللغة العربية.', descriptionEn: 'Applied AI foundations.',
      credits: 3, level: 7, semester: 1, type: 'practical', skills: [], skillMappings: [],
      learningOutcomes: ['Build AI solutions'], learningOutcomesAr: ['بناء نماذج الذكاء الاصطناعي'], learningOutcomesEn: ['Design neural network layers'],
      prerequisites: [], status: 'active', metadata: { testData: true }
    } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  await StudyPlanModel.updateOne({ _id: plan._id }, { $addToSet: { courses: course._id } });

  await RecommendationModel.findOneAndUpdate(
    { universityId: activeUniversity._id, title: 'Add an applied MLOps project' },
    { $setOnInsert: { universityId: activeUniversity._id, collegeId: computing._id, departmentId: departments[0]._id, studyPlanId: plan._id, title: 'Add an applied MLOps project', description: 'Close the identified practical deployment gap.', type: 'add_project', affectedCourses: [course._id], affectedSkills: [], evidence: ['Department skill gap: MLOps'], marketDemand: 85, studentImpact: 'Improves production-readiness.', priority: 'high', status: 'submitted', createdBy: activeOwner._id, submittedAt: new Date() } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  // Seed dummy CurriculumAnalysis documents for scoring calculations
  await AnalysisModel.findOneAndUpdate(
    { departmentId: departments[0]._id },
    { $set: { universityId: activeUniversity._id, collegeId: computing._id, departmentId: departments[0]._id, alignmentPercentage: 85, coveredSkills: [{ name: 'Python' }, { name: 'SQL' }], partiallyCoveredSkills: [], missingSkills: [{ name: 'MLOps' }], emergingSkills: [], source: 'Test Data Seeder', analyzedAt: new Date(), status: 'completed' } },
    { upsert: true }
  );
  await AnalysisModel.findOneAndUpdate(
    { departmentId: compDept._id },
    { $set: { universityId: competitorUniversity._id, collegeId: compCollege._id, departmentId: compDept._id, alignmentPercentage: 90, coveredSkills: [{ name: 'Python' }, { name: 'Java' }], partiallyCoveredSkills: [], missingSkills: [], emergingSkills: [], source: 'Test Data Seeder', analyzedAt: new Date(), status: 'completed' } },
    { upsert: true }
  );

  // Trigger ranking updates directly on DB
  const universities = [activeUniversity, competitorUniversity];
  for (const uni of universities) {
    const studentFilter = { 'academicInfo.universityId': uni._id };
    const students = await StudentModel.find(studentFilter).lean();
    const studentIds = students.map(s => s._id);
    const applications = studentIds.length 
      ? await ApplicationModel.find({ studentId: { $in: studentIds } }).lean() 
      : [];

    const graduates = students.filter(s => s.academicInfo?.academicLevel === 'graduate');
    const totalSample = graduates.length > 0 ? graduates.length : (students.length > 0 ? students.length : 1);
    const employedConfirmed = applications.filter(app => app.status === 'confirmed_employed').length;
    const employmentRate = Math.min((employedConfirmed / totalSample) * 100, 100);

    const offeredOrAcceptedApps = applications.filter(app => ['offered', 'accepted', 'confirmed_employed'].includes(app.status));
    const acceptanceRate = applications.length > 0 ? (offeredOrAcceptedApps.length / applications.length) * 100 : 50;

    const analyses = await AnalysisModel.find({ universityId: uni._id, alignmentPercentage: { $ne: null } }).lean();
    const curriculumAlignment = analyses.length > 0 
      ? (analyses.reduce((sum: number, a: any) => sum + (a.alignmentPercentage || 0), 0) / analyses.length) 
      : 70;

    const readinessScores = students.map(s => s.aiMetrics?.readinessScore || 0).filter(Boolean);
    const readinessAverage = readinessScores.length > 0 
      ? (readinessScores.reduce((sum: number, r: number) => sum + r, 0) / readinessScores.length) 
      : 65;

    const matchScores = applications.map(app => app.matchSnapshot?.matchScore || 0).filter(Boolean);
    const matchingAverage = matchScores.length > 0 
      ? (matchScores.reduce((sum: number, m: number) => sum + m, 0) / matchScores.length) 
      : 60;

    const skillCoverage = analyses.length > 0 
      ? (analyses.reduce((sum: number, a: any) => {
          const covered = a.coveredSkills?.length || 0;
          const partial = a.partiallyCoveredSkills?.length || 0;
          const missing = a.missingSkills?.length || 1;
          return sum + ((covered + partial) / (covered + partial + missing)) * 100;
        }, 0) / analyses.length) 
      : 65;

    const dataReliability = Math.min((students.length / 50) * 100, 100);

    const wEmployment = 0.25;
    const wCurriculum = 0.20;
    const wReadiness = 0.15;
    const wMatching = 0.15;
    const wSkills = 0.10;
    const wAcceptance = 0.10;
    const wReliability = 0.05;

    const overall = 
      (employmentRate * wEmployment) +
      (curriculumAlignment * wCurriculum) +
      (readinessAverage * wReadiness) +
      (matchingAverage * wMatching) +
      (skillCoverage * wSkills) +
      (acceptanceRate * wAcceptance) +
      (dataReliability * wReliability);

    await UniversityModel.updateOne(
      { _id: uni._id },
      { 
        $set: { 
          'statistics.totalGraduates': totalSample,
          'statistics.employedConfirmed': employedConfirmed,
          'statistics.acceptanceRate': acceptanceRate,
          'scores.overall': Math.round(overall),
          'scores.curriculumAlignment': Math.round(curriculumAlignment),
          'scores.readinessAverage': Math.round(readinessAverage),
          'scores.matchingAverage': Math.round(matchingAverage),
          'scores.skillCoverage': Math.round(skillCoverage),
          'scores.dataReliability': Math.round(dataReliability),
          'analytics.employmentRate': Math.round(employmentRate)
        } 
      }
    );
  }

  // Admin test accounts and roles
  const adminPermissions = {
    full: ALL_ADMIN_PERMISSIONS,
    readonly: [
      AdminPermission.USERS_READ, AdminPermission.ROLES_READ, AdminPermission.AUDIT_READ,
      AdminPermission.AI_READ, AdminPermission.EMAIL_READ, AdminPermission.BACKUP_CREATE,
      AdminPermission.BACKUP_VERIFY, AdminPermission.SETTINGS_READ,
      AdminPermission.SECURITY_ALERTS_READ, AdminPermission.UNIVERSITIES_READ,
      AdminPermission.COMPANIES_READ,
    ],
    limited: ALL_ADMIN_PERMISSIONS.filter((p) => p !== AdminPermission.ADMIN_ACCOUNTS_WRITE && p !== AdminPermission.ROLES_WRITE),
  };

  const adminRoleFull: any = await RoleModel.findOneAndUpdate(
    { name: 'admin_full_test' },
    { $setOnInsert: { name: 'admin_full_test', nameAr: 'مدير تشغيلي كامل', description: 'Full operational admin test role', permissions: adminPermissions.full, isSystem: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const adminRoleReadonly: any = await RoleModel.findOneAndUpdate(
    { name: 'admin_readonly_test' },
    { $setOnInsert: { name: 'admin_readonly_test', nameAr: 'مدير قراءة فقط', description: 'Read-only admin test role', permissions: adminPermissions.readonly, isSystem: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  const adminRoleLimited: any = await RoleModel.findOneAndUpdate(
    { name: 'admin_limited_test' },
    {
      $set: { permissions: adminPermissions.limited },
      $setOnInsert: { name: 'admin_limited_test', nameAr: 'مدير محدود', description: 'Admin missing admin:write permission', isSystem: true },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  async function ensureAdminUser(email: string, role: any, firstName: string, lastName: string, status = 'active') {
    const existing: any = await UserModel.findOne({ email }).lean();
    if (existing) {
      const updates: any = { userType: 'admin', roleId: role._id, status };
      if (!(await bcrypt.compare(process.env.TEST_ACCOUNT_DEFAULT_PASSWORD || '', existing.password || ''))) {
        updates.password = passwordHash;
      }
      await UserModel.updateOne({ _id: existing._id }, { $set: updates });
      return { ...existing, ...updates };
    }
    return UserModel.create({
      email,
      userType: 'admin',
      roleId: role._id,
      firstName,
      lastName,
      firstNameAr: firstName,
      lastNameAr: lastName,
      password: passwordHash,
      phone: '+966500000000',
      status,
      isVerified: true,
      isEmailVerified: true,
    });
  }

  await ensureAdminUser('admin.full@madar.test', adminRoleFull, 'Full', 'Admin');
  await ensureAdminUser('admin.readonly@madar.test', adminRoleReadonly, 'Readonly', 'Admin');
  await ensureAdminUser('admin.limited@madar.test', adminRoleLimited, 'Limited', 'Admin');
  await ensureAdminUser('admin.disabled@madar.test', adminRoleFull, 'Disabled', 'Admin', 'banned');

  // Dynamically Seed ALL Real Universities in Database
  const allImportedUnis: any[] = await UniversityModel.find({
    $and: [
      { slug: { $exists: true, $ne: null } },
      { slug: { $nin: ['mdu', 'mcu'] } } // Exclude the dummy dev ones if needed
    ]
  }).lean();

  console.log(`Generating admin and coordinator test accounts for ${allImportedUnis.length} universities...`);

  for (const uniDoc of allImportedUnis) {
    if (!uniDoc.slug) continue;
    
    // Extract domain from website or fallback to slug.edu.ye
    let domain = `${uniDoc.slug}.edu.ye`;
    if (uniDoc.website) {
      try {
        const url = new URL(uniDoc.website.startsWith('http') ? uniDoc.website : `https://${uniDoc.website}`);
        domain = url.hostname.replace('www.', '');
      } catch (e) {}
    }
    
    // Standardized emails for predictable login
    const adminEmail = `admin@${domain}`;
    const coordEmail = `coordinator@${domain}`;
    
    // 1. Create/Ensure university admin user
    const firstName = uniDoc.nameEn ? uniDoc.nameEn.split(' ')[0] : 'Uni';
    const adminUser = await user(adminEmail, 'university', firstName, 'Admin');
    
    // Link user to university
    await UniversityModel.updateOne(
      { _id: uniDoc._id },
      { $set: { userId: adminUser._id, status: 'active', isActive: true } }
    );

    // 2. Find first college for this university
    const collegeDoc: any = await CollegeModel.findOne({ universityId: uniDoc._id }).lean();
    if (collegeDoc) {
      // 3. Create/Ensure coordinator user
      const coordUser = await user(coordEmail, 'coordinator', firstName + ' Col', 'Coordinator');
      
      // Link coordinator to college
      await StaffModel.findOneAndUpdate(
        { userId: coordUser._id },
        { 
          $setOnInsert: { 
            userId: coordUser._id, 
            universityId: uniDoc._id, 
            collegeId: collegeDoc._id, 
            role: 'coordinator', 
            permissions: [
              'dashboard:read', 'structure:read', 'students:read', 'analytics:read', 
              'departments:write', 'study-plans:read', 'study-plans:write', 'courses:read', 'courses:write'
            ], 
            status: 'active', 
            invitationStatus: 'accepted', 
            invitedBy: adminUser._id, 
            invitedAt: new Date(), 
            lastInvitedAt: new Date() 
          } 
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  console.log('Development test accounts and university data are ready.');
  console.log('Created missing records only; existing test accounts were not overwritten.');
}

seedTestAccounts()
  .catch((error) => {
    console.error(`Test seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => mongoose.disconnect());
