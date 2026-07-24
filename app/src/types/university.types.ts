export interface UniversityDashboard {
  university: {
    id: string;
    name: string;
    logoUrl: string | null;
    academicYear: string | null;
  };
  summary: {
    totalStudents: number;
    totalColleges: number;
    totalDepartments: number;
    verifiedStudents?: number;
    averageReadiness: number;
    employmentRate: number;
    curriculumAlignment?: number;
  };
  collegePerformance: Array<{
    collegeId: string;
    collegeName: string;
    studentCount: number;
    readinessScore: number;
    employmentRate: number;
    skillGapCount?: number;
  }>;
  trends: {
    readiness: Array<{ period: string; value: number }>;
    employment: Array<{ period: string; value: number }>;
  };
  topSkills: Array<{ name: string; demandScore?: number; studentCoverage?: number }>;
  topEmployers: Array<{ name: string; hires?: number; applications?: number }>;
  recentActivities: Array<{ id: string; type: string; title: string; createdAt: string }>;
  skillGaps: string[];
}

export interface UniversityStudent {
  id: string;
  userId?: string;
  fullName: string;
  email?: string;
  studentNumber?: string;
  universityId: string;
  collegeId?: string;
  collegeName?: string;
  departmentId?: string;
  departmentName?: string;
  academicLevel?: string;
  readinessScore?: number;
  employmentStatus?: string;
  affiliationStatus?: string;
  cvStatus?: string;
  createdAt?: string;
  gpa?: number;
  graduationYear?: number;
  enrollmentYear?: number;
  expectedGraduationYear?: number;
  skills: string[];
}

export interface UniversityStudents {
  items: UniversityStudent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    colleges: Array<{ id: string; name: string }>;
    departments: Array<{ id: string; name: string; collegeId: string }>;
  };
}

export interface UniversityStudentStatistics {
  summary: {
    totalStudents: number;
    activeStudents: number;
    graduates: number;
    averageReadiness: number;
  };
  employmentStatusDistribution: Array<{ status: string; count: number }>;
  topSkillsDistribution: Array<{ skill: string; count: number }>;
  employmentTimeline: Array<{ period: string; employed: number; applicants?: number }>;
}

export interface UniversityDepartment {
  id: string;
  name: string;
  code?: string;
  description?: string;
  head?: string;
  status: string;
  studentCount: number;
  studyPlanCount: number;
  courseCount: number;
}

export interface UniversityCollege {
  id: string;
  name: string;
  code?: string;
  description?: string;
  dean?: string;
  established?: number;
  status: string;
  studentCount: number;
  departments: UniversityDepartment[];
}

export interface CreateCollegeRequest {
  name: string;
  nameAr?: string;
  code?: string;
  description?: string;
  dean?: string;
  established?: number;
}

export type UpdateCollegeRequest = Partial<CreateCollegeRequest>;

export interface CreateDepartmentRequest {
  name: string;
  nameAr?: string;
  code?: string;
  description?: string;
  head?: string;
}

export type UpdateDepartmentRequest = Partial<CreateDepartmentRequest>;

export interface UniversityStructure {
  university: { id: string; name: string };
  colleges: UniversityCollege[];
  totalColleges: number;
  totalDepartments: number;
}

export interface UniversityStudentQuery {
  page?: number;
  limit?: number;
  search?: string;
  college?: string;
  department?: string;
  status?: string;
  academicLevel?: string;
  gpaMin?: number;
  affiliationStatus?: string;
}

export interface UniversityAffiliationStudent { id: string; fullName: string; email: string; phone: string; studentNumber: string; college: { id: string; name: string } | null; department: { id: string; name: string } | null; academicLevel: string; enrollmentYear: number; expectedGraduationYear: number; affiliationStatus: string; verificationMethod: string; proofDocumentUrl: string | null; decisions: Array<{ status: string; reason?: string; createdAt: string }>; readinessScore: number; cvStatus: string }

export interface UniversityProfileResponse {
  id: string;
  name: string;
  nameAr: string;
  type: string;
  description: string;
  location: {
    city: string;
    country: string;
    address: string;
  };
  contactInfo: {
    email: string;
    phone: string;
    website: string;
    officialContactEmail: string;
    officialContactName: string;
    officialContactPhone: string;
  };
  emailDomain: string;
  logoUrl: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface UpdateUniversityProfileRequest {
  name?: string;
  nameAr?: string;
  type?: string;
  description?: string;
  city?: string;
  country?: string;
  address?: string;
  website?: string;
  phone?: string;
  contactEmail?: string;
  officialContactEmail?: string;
  officialContactName?: string;
  officialContactPhone?: string;
  emailDomain?: string;
  logoUrl?: string;
}

export type UniversityApprovalStatus = 'pending' | 'inactive' | 'suspended' | 'active';

export interface UniversityStatusResponse {
  universityId: string;
  name: string;
  status: UniversityApprovalStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  suspensionReason: string | null;
  canAccessPortal: boolean;
}

export type UniversityStaffRole = 'coordinator' | 'university_viewer' | 'data_officer' | 'quality_officer' | 'academic_development_officer';
export type UniversityStaffStatus = 'active' | 'inactive';

export type UniversityStaffPermission =
  | 'dashboard:read'
  | 'structure:read'
  | 'students:read'
  | 'analytics:read'
  | 'departments:read'
  | 'departments:write'
  | 'study-plans:read'
  | 'study-plans:write'
  | 'courses:read'
  | 'courses:write'
  | 'course-skills:manage'
  | 'curriculum-analysis:run'
  | 'college-reports:read'
  | 'college:write'
  | 'affiliations:write'
  | 'reports:read'
  | 'audit:read';

export interface UniversityStaffMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UniversityStaffRole;
  permissions: UniversityStaffPermission[];
  college: { id: string; name: string; code?: string } | null;
  status: UniversityStaffStatus;
  invitationStatus: 'pending' | 'accepted' | 'cancelled';
  lastLoginAt: string | null;
  createdAt: string | null;
  lastInvitedAt: string | null;
}

export interface UniversityStaffList {
  items: UniversityStaffMember[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface UniversityStaffQuery {
  search?: string;
  role?: UniversityStaffRole | '';
  collegeId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface PublicAcademicOption {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  code?: string;
  logoUrl?: string | null;
  governorate?: string;
  city?: string;
  institutionType?: string;
  ownership?: string;
  verificationStatus?: string;
  location?: { city: string; country: string };
}

export interface AcademicReferencePage {
  items: PublicAcademicOption[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface InviteUniversityStaffRequest {
  name: string;
  email: string;
  phone?: string;
  role: UniversityStaffRole;
  collegeId?: string;
  message?: string;
  permissions?: UniversityStaffPermission[];
}

export interface UpdateUniversityStaffRequest {
  name?: string;
  phone?: string;
  role?: UniversityStaffRole;
  collegeId?: string;
  permissions?: UniversityStaffPermission[];
  status?: 'active' | 'inactive';
}

export interface InstitutionalAccess {
  role: 'university' | UniversityStaffRole;
  universityId: string;
  universityStatus?: UniversityApprovalStatus;
  collegeId: string | null;
  college?: { id: string; name: string; code?: string } | null;
  isOwner: boolean;
  permissions: UniversityStaffPermission[];
  allowedActions: UniversityStaffPermission[];
}

export interface StaffProfileResponse {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  firstNameAr: string;
  lastNameAr: string;
  email: string;
  phone: string;
  avatar: string;
  jobTitle: string;
  biography: string;
  language: 'ar' | 'en';
  role: UniversityStaffRole;
  university: { id: string; name: string; nameAr: string; status: string };
  college: { id: string; name: string; nameAr: string; code?: string } | null;
  status: string;
  invitationStatus: string;
  permissions: UniversityStaffPermission[];
  isEmailVerified: boolean;
  lastLoginAt: string | null;
  updatedAt: string | null;
}

export interface UpdateStaffProfileRequest {
  firstName?: string;
  lastName?: string;
  firstNameAr?: string;
  lastNameAr?: string;
  phone?: string;
  jobTitle?: string;
  biography?: string;
  avatar?: string;
  language?: 'ar' | 'en';
}

export interface UniversityStudyPlan {
  id: string; universityId: string; collegeId: string; departmentId: string;
  name: string; nameAr?: string; description?: string; academicYear: string;
  version: number; totalCreditHours: number; status: string;
  previousVersionId?: string | null; courseIds: string[]; levels?: Array<{ level: number; semesters: Array<{ name: string; courseIds: string[] }> }>;
  reviewReason?: string | null; submittedAt?: string | null; reviewedAt?: string | null;
}

export interface UniversityCourse {
  id: string; studyPlanId: string; departmentId: string; code: string; name: string;
  nameAr?: string; nameEn?: string; description?: string; descriptionAr?: string; descriptionEn?: string; creditHours: number;
  lectureHours?: number | null; tutorialHours?: number | null; practicalHours?: number | null; laboratoryHours?: number | null;
  level: number; semester: number; type: 'required' | 'elective' | 'practical' | 'laboratory' | 'project' | 'internship'; status: string;
  prerequisites: string[]; corequisites?: string[]; learningOutcomes: string[]; learningOutcomesAr?: string[]; learningOutcomesEn?: string[];
  eligibilityRules?: string[]; electiveGroup?: string;
  skillMappings: Array<{ skillId: string; skill?: { id: string; name: string; nameAr?: string; category?: string }; coverageLevel: number; coverageType: string; assessmentMethod: string; notes?: string }>;
}

export interface CurriculumAnalysis {
  id?: string;
  department: { id: string; name: string };
  sample: { courses: number; marketSkills: number };
  alignmentPercentage: number | null;
  coveredSkills: Array<{ skillId: string; name: string; coverageLevel: number; courses: Array<{ id: string; code: string; name: string }> }>;
  partiallyCoveredSkills: Array<{ skillId: string; name: string; coverageLevel: number; courses: Array<{ id: string; code: string; name: string }> }>;
  missingSkills: Array<{ name: string; demandScore: number }>;
  emergingSkills: Array<{ name: string; demandScore: number }>;
  source: string; analyzedAt: string; trigger: string; status: 'completed' | 'fallback'; warning?: string | null;
}

export interface AcademicRecommendation {
  id: string; _id: string; title: string; description: string; type: string; departmentId: string;
  studyPlanId?: string | null; affectedCourses: string[]; affectedSkills: string[]; evidence: string[]; marketDemand: number; studentImpact: string;
  priority: string; status: string; reviewReason?: string | null; createdPlanVersionId?: string | null; createdAt?: string; updatedAt?: string;
}

export interface StudyPlanImportJob {
  id: string;
  status: 'uploading' | 'extracting' | 'analyzing' | 'ready_for_review' | 'confirmed' | 'failed' | 'cancelled';
  originalFilename: string;
  fileSize: number;
  parsedResult: ParsedStudyPlanResult | null;
  confirmedPlanId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedImportPlan {
  universityName?: string | null;
  collegeName?: string | null;
  departmentName?: string | null;
  programNameAr?: string | null;
  programNameEn?: string | null;
  degreeType?: string | null;
  academicYear?: string | null;
  version?: number | null;
  totalCredits?: number | null;
  yearsCount?: number | null;
  semestersCount?: number | null;
  levels?: number | null;
}

export interface ExtractedSection {
  year?: number | null;
  level?: number | null;
  semester?: number | null;
  sectionType?: 'year' | 'level' | 'semester' | 'summer' | 'elective' | 'training' | string;
  courses?: ExtractedCourse[];
}

export interface ElectiveGroup {
  id?: string;
  nameAr?: string | null;
  nameEn?: string | null;
  minCredits?: number | null;
  maxCredits?: number | null;
  courseCodes?: string[];
}

export interface ParsedStudyPlanResult {
  plan: ParsedImportPlan;
  sections?: ExtractedSection[];
  courses: ExtractedCourse[];
  electiveGroups?: ElectiveGroup[];
  warnings: string[];
  unmatchedSkills?: string[];
  unmatchedFields?: string[];
  confidenceScore: number | null;
}

export interface ExtractedSkill { name: string; confidence: number; coverageType?: string; matchedSkillId?: string | null; isSuggestion?: boolean; }

export interface ExtractedCourse {
  code: string; nameAr?: string | null; nameEn?: string | null;
  lectureHours?: number | null; tutorialHours?: number | null; practicalHours?: number | null; laboratoryHours?: number | null;
  creditHours?: number | null; year?: number | null; level?: number | null; semester?: number | null;
  courseType?: 'required' | 'elective' | 'practical' | 'laboratory' | 'project' | 'internship' | string;
  prerequisites?: string[]; corequisites?: string[]; eligibilityRules?: string[]; learningOutcomes?: string[];
  extractedSkills?: ExtractedSkill[]; confidence?: number | null; electiveGroup?: string | null;
}

export interface ConfirmImportData { plan?: Partial<ParsedStudyPlanResult['plan']>; courses?: ExtractedCourse[]; electiveGroups?: ElectiveGroup[]; }
