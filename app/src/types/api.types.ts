// ============================================
// MADAR Platform - API Type Definitions
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  requestId: string;
  meta?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data?: T[];
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  firstNameAr: string;
  lastName: string;
  lastNameAr: string;
  phone?: string;
  role: 'student' | 'company' | 'university';
  profile?: StudentProfileInput | CompanyProfileInput | UniversityProfileInput;
}

export interface StudentProfileInput {
  universityId?: string;
  collegeId?: string;
  departmentId?: string;
  majorId?: string;
  studentNumber?: string;
  enrollmentYear?: number;
  expectedGraduationYear?: number;
  studentStatus?: string;
  university?: string;
  universityAr?: string;
  college?: string;
  department?: string;
  departmentAr?: string;
  major?: string;
  academicLevel?: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate';
  gpa?: number;
  graduationYear?: number;
}

export interface CompanyProfileInput {
  name?: string;
  nameAr?: string;
  companyName?: string;
  industry?: string;
  description?: string;
  size?: string;
  location?: string;
  website?: string;
  phone?: string;
  logo?: string;
  socialLinks?: Record<string, string>;
}

export interface UniversityProfileInput {
  name?: string;
  nameAr?: string;
  universityName?: string;
  shortName?: string;
  description?: string;
  descriptionAr?: string;
  location?: string;
  website?: string;
  phone?: string;
  officialContact?: string;
  officialEmail?: string;
  logo?: string;
  logoUrl?: string;
  studentCount?: number;
  jobTitle?: string;
  type?: string;
  country?: string;
  city?: string;
  address?: string;
  officialContactName?: string;
  officialPhone?: string;
  emailDomain?: string;
  licenseNumber?: string;
  accreditationDocumentUrl?: string;
  registrationNotes?: string;
}

export interface AuthResponse {
  user: UserData;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface GoogleRegistrationRequest {
  googleId?: string;
  linkedinId?: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone: string;
  role: 'student' | 'company' | 'university';
  profile?: StudentProfileInput | CompanyProfileInput | UniversityProfileInput;
}

export interface OAuthPayload {
  googleId?: string;
  linkedinId?: string;
  provider?: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  role?: string;
}

export interface UserData {
  id: string;
  email: string;
  firstName: string;
  firstNameAr: string;
  lastName: string;
  lastNameAr: string;
  role: 'student' | 'company' | 'university' | 'coordinator' | 'university_viewer' | 'data_officer' | 'quality_officer' | 'academic_development_officer' | 'admin' | 'super_admin';
  avatar?: string;
  phone?: string;
  isEmailVerified: boolean;
  profileCompleted?: boolean;
  permissions?: string[];
  preferences?: {
    language?: string;
    theme?: string;
    notifications?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
    };
  };
}

// Student Types
export interface StudentProfile {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    website?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    behance?: string;
    dribbble?: string;
    stackOverflow?: string;
    researchGate?: string;
    orcid?: string;
  };
  avatar?: string;
  coverImage?: string;
  professionalTitle?: string;
  location?: string;
  address?: string;
  coordinates?: { lat: number; lng: number } | null;
  university?: string;
  universityAr?: string;
  college?: string;
  collegeAr?: string;
  department?: string;
  departmentAr?: string;
  academicLevel?: string;
  academicStanding?: string;
  gpa?: number;
  graduationYear?: number;
  universityInfo?: {
    id: string;
    name: string;
    nameAr?: string;
    nameEn?: string;
    logoUrl?: string | null;
    governorate?: string;
  } | null;
  collegeInfo?: { id: string; name: string; nameAr?: string } | null;
  departmentInfo?: { id: string; name: string; nameAr?: string } | null;
  majorInfo?: { id: string; name: string; nameAr?: string; nameEn?: string } | null;
  major?: string;
  academicAffiliationNeedsUpdate?: boolean;
  profileCompletion: number;
  skills: Array<{ name: string; level: number; category?: string }>;
  interests?: string[];
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    link?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date?: string;
    credentialId?: string;
  }>;
  courses?: Array<{
    name: string;
    provider?: string;
    completionDate?: string;
  }>;
  cvData?: {
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    contentHash?: string;
    uploadedAt?: string;
    parsedData?: {
      rawText?: string;
      personalInfo?: Record<string, any>;
      extractedSkills?: string[];
      extractedSoftSkills?: string[];
      extractedTools?: string[];
      extractedExperience?: string[];
      extractedEducation?: string[];
      extractedProjects?: string[];
      extractedCertifications?: string[];
      extractedCourses?: string[];
      extractedLanguages?: string[];
      extractedVolunteerWork?: string[];
      extractedAwards?: string[];
      extractedAchievements?: string[];
      extractedPublications?: string[];
      references?: string[];
      additionalSections?: Record<string, string[]>;
      parsingConfidence?: number;
    };
    aiAnalysis?: {
      summary?: string;
      strengths?: string[];
      weaknesses?: string[];
      suggestedImprovements?: string[];
      analyzedAt?: string;
    };
  };
  cvUrl?: string;
  skillGaps?: Array<{
    skill: string;
    currentLevel: number;
    requiredLevel: number;
  }>;
}

export interface JobRecommendation {
  id: string;
  title: string;
  titleAr?: string;
  company?: string;
  companyName?: string;
  companyNameAr?: string;
  companyLogo?: string;
  companyIndustry?: string;
  location?: string;
  locationType?: string;
  type: string;
  level?: string;
  category?: string;
  matchScore: number;
  acceptanceProbability?: number;
  semanticSimilarity?: number;
  matchingSkills?: Array<string | { name?: string; skillName?: string; score?: number }>;
  matchedSkills?: Array<string | { name?: string; skillName?: string; score?: number }>;
  missingSkills?: Array<string | { name?: string; skillName?: string; importance?: number }>;
  requiredSkills?: Array<string | { name?: string; skillName?: string; weight?: number }>;
  preferredSkills?: Array<string | { name?: string; skillName?: string; weight?: number }>;
  strengthFactors?: Array<string | { name?: string; title?: string; reason?: string; description?: string }>;
  weaknessFactors?: Array<string | { name?: string; title?: string; reason?: string; description?: string }>;
  professionalDomain?: string;
  academicDomain?: string;
  careerPath?: string;
  recommendation?: string;
  recommendationExplanation?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  postedDate?: string;
}

export interface StudentCareerPath {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  readiness: number;
  skillsNeeded: string[];
  rank: number;
  professionalDomain?: string;
  academicDomain?: string;
}

export interface StudentLearningResource {
  id: string;
  name: string;
  nameAr?: string;
  provider: string;
  type?: string;
  duration?: string;
  level?: string;
  language?: string;
  isFree?: boolean | null;
  skills: string[];
  url: string;
  reason?: string;
  priority?: string;
  currentLevel?: number;
  requiredLevel?: number;
  gap?: number;
}

export interface StudentInsightItem {
  id: string;
  type: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
}

export interface StudentInsightsResponse {
  profileCompletion: number;
  readinessScore: number;
  recommendationCount: number;
  topMatchScore: number;
  skillCount: number;
  projectCount: number;
  certificationCount: number;
  courseCount: number;
  generatedAt: string;
  summaryTitle?: string;
  summaryTitleAr?: string;
  summaryDescription?: string;
  summaryDescriptionAr?: string;
  radarSkills: Array<{
    subject: string;
    subjectAr?: string;
    yourSkills: number;
    marketDemand: number;
    fullMark: number;
  }>;
  skillGaps: Array<{
    id: string;
    skill: string;
    currentLevel: number;
    requiredLevel: number;
    gap: number;
    priority?: string;
    category?: string;
    recommendation?: string;
    learningResources: StudentLearningResource[];
  }>;
  marketTrends: Array<{
    period: string;
    jobCount: number;
    relevantJobs: number;
    skillMentions: number;
  }>;
  marketSample: {
    jobCount: number;
    periodStart: string;
    periodEnd: string;
    sufficientData: boolean;
  };
  careerPaths: StudentCareerPath[];
  learningResources: StudentLearningResource[];
  aiInsights: StudentInsightItem[];
}

export interface SkillGapAnalysis {
  overallScore: number;
  matchingSkills: Array<{
    name: string;
    studentLevel: number;
    requiredLevel: number;
  }>;
  missingSkills: Array<{
    name: string;
    importance: string;
    learningResource?: string;
  }>;
  recommendations: string[];
}

export interface NotificationItem {
  id: string;
  _id?: string;
  userId: string;
  type: 'match' | 'application_update' | 'message' | 'system' | 'reminder' | 'alert';
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  read: boolean;
  actionUrl?: string;
  data?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

// Company Types
export interface Job {
  id: string;
  title: string;
  titleAr: string;
  description?: string;
  descriptionAr?: string;
  location: string;
  locationAr?: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  department?: string;
  experienceLevel?: string;
  educationRequired?: string;
  requiredSkills: Array<{ name: string; weight: number }>;
  niceToHaveSkills: Array<{ name: string }>;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  benefits: string[];
  status: 'active' | 'paused' | 'closed' | 'draft';
  applicantsCount: number;
  viewsCount: number;
  postedDate: string;
  expiresAt?: string;
  companyId: string;
  companyName?: string;
  companyNameAr?: string;
}

export interface StudentJobFeedItem {
  id: string;
  title: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
  companyIndustry?: string | null;
  companyWebsite?: string | null;
  location: string;
  locationType?: string | null;
  type?: string | null;
  experienceLevel?: string | null;
  category?: string | null;
  skills: string[];
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  benefits: string[];
  responsibilities: string[];
  preferredSkills: string[];
  educationLevel?: string | null;
  educationFields: string[];
  requiredExperienceYears: number;
  applicationDeadline?: string | null;
  requiresCoverLetter: boolean;
  postedDate: string;
  expiresAt?: string | null;
  matchScore: number;
  matchSource: 'ai_analysis' | 'profile_calculation' | 'insufficient_profile';
  matchedSkills: string[];
  missingSkills: string[];
  matchBreakdown: {
    skills?: number;
    experience?: number;
    education?: number;
    projects?: number;
    semantic?: number;
    mandatorySkillsPenalty?: number;
  };
  matchCalculatedAt?: string | null;
  applicationId?: string | null;
  applicationStatus?: string | null;
  appliedAt?: string | null;
  canApply: boolean;
}

export interface JobFeedFilterOption {
  value: string;
  label: string;
  count: number;
}

export interface StudentJobFeedResponse {
  items: StudentJobFeedItem[];
  pagination: PaginatedResponse<StudentJobFeedItem>['pagination'];
  filters: {
    jobTypes: JobFeedFilterOption[];
    experienceLevels: JobFeedFilterOption[];
    locations: JobFeedFilterOption[];
    locationTypes: JobFeedFilterOption[];
    companies: JobFeedFilterOption[];
    salary: { min: number; max: number; currency: string };
  };
  totalPublished: number;
}

export interface Candidate {
  id: string;
  name: string;
  nameAr?: string;
  matchScore: number;
  skills: string[];
  university: string;
  universityAr?: string;
  major: string;
  majorAr?: string;
  gpa?: number;
  experience: number;
  status: string;
  appliedDate: string;
}

export interface RecruitmentMetrics {
  activeJobs: number;
  totalApplicants: number;
  acceptanceRate: number;
  avgMatchScore: number;
  trend: number;
}

// Application Types
export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  jobTitleAr: string;
  companyName: string;
  companyNameAr: string;
  studentId: string;
  status: 'submitted' | 'in-review' | 'interview' | 'accepted' | 'rejected';
  matchScore?: number;
  coverLetter?: string;
  appliedDate: string;
  statusHistory: Array<{
    status: string;
    note?: string;
    createdAt: string;
  }>;
  interviewDate?: string;
  interviewType?: string;
}

export interface StudentApplicationItem {
  id: string;
  jobId: string;
  jobTitle: string;
  jobTitleAr?: string;
  companyName: string;
  companyLogo?: string | null;
  location?: string;
  jobType?: string | null;
  status: 'submitted' | 'in-review' | 'interview' | 'accepted' | 'rejected';
  rawStatus: string;
  matchScore: number;
  coverLetter?: string;
  appliedDate: string;
  createdAt: string;
  updatedAt?: string;
  rejectionReason?: string;
  statusHistory: Array<{
    status: string;
    rawStatus?: string;
    note?: string;
    noteAr?: string;
    createdAt: string;
  }>;
  timeline: Array<{ stage: string; completed: boolean }>;
  interview?: Record<string, any> | null;
}

// University Types
export interface CollegePerformance {
  name: string;
  nameAr: string;
  graduates: number;
  employed: number;
  employmentRate: number;
  avgSalary: number;
  skillAlignment: number;
}

export interface Employer {
  name: string;
  nameAr?: string;
  hires: number;
  avgSalary: number;
  matchRate: number;
}

export interface RecentPlacement {
  studentName: string;
  college: string;
  company: string;
  role: string;
  daysAgo: number;
}

// Matching Types
export interface MatchResult {
  overallScore: number;
  breakdown: {
    skillsMatch: { score: number; weight: number };
    experienceMatch: { score: number; weight: number };
    projectsMatch: { score: number; weight: number };
    semanticMatch: { score: number; weight: number };
  };
  missingSkills: Array<{
    name: string;
    importance: string;
    learningResource?: string;
  }>;
  matchingSkills: Array<{
    name: string;
    studentLevel: number;
    requiredLevel: number;
  }>;
  recommendation: string;
}

// Admin Types
export interface SystemHealth {
  api: { status: string; responseTime: number };
  database: { status: string; connections: number };
  aiEngine: { status: string; latency: number };
  storage: { status: string; usage: number };
}

export interface PlatformMetrics {
  totalUsers: number;
  activeJobs: number;
  totalApplications: number;
  avgMatchScore: number;
  systemUptime: number;
}

export interface ActivityLog {
  id: string;
  type: string;
  description: string;
  descriptionAr: string;
  userId?: string;
  userName?: string;
  createdAt: string;
  severity: 'info' | 'warning' | 'error';
}

// Error Types
export interface ApiError {
  statusCode: number;
  message: string;
  code: string;
  details?: Record<string, string[]>;
  timestamp: string;
  requestId: string;
}
