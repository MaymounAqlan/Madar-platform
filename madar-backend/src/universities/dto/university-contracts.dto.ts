export interface UniversityDashboardResponse {
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
  topSkills: Array<{
    name: string;
    demandScore?: number;
    studentCoverage?: number;
  }>;
  topEmployers: Array<{
    name: string;
    hires?: number;
    applications?: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    title: string;
    createdAt: string;
  }>;
  // Compatibility fields retained for existing consumers.
  kpis: Record<string, unknown>;
  skillGaps: string[];
  topSkillsInDemand: unknown[];
}

export interface UniversityStudentItem {
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
  skills: string[];
}

export interface UniversityStudentsResponse {
  items: UniversityStudentItem[];
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
  // Compatibility fields retained for existing consumers.
  students: UniversityStudentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UniversityStudentStatisticsResponse {
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

export interface UniversityStructureResponse {
  university: {
    id: string;
    name: string;
  };
  colleges: Array<{
    id: string;
    name: string;
    code?: string;
    status: string;
    studentCount: number;
    departments: Array<{
      id: string;
      name: string;
      code?: string;
      status: string;
      studentCount: number;
      studyPlanCount: number;
      courseCount: number;
    }>;
  }>;
  totalColleges: number;
  totalDepartments: number;
}

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
