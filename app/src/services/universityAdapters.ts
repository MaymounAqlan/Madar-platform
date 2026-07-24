import type {
  UniversityDashboard,
  UniversityStudent,
  UniversityStudents,
  UniversityStudentStatistics,
  UniversityStructure,
} from '@/types/university.types';

type UnknownRecord = Record<string, unknown>;

const record = (value: unknown): UnknownRecord =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {};

const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown): string => typeof value === 'string' ? value : value == null ? '' : String(value);
const number = (value: unknown): number => Number.isFinite(Number(value)) ? Number(value) : 0;
const optionalNumber = (value: unknown): number | undefined => value == null ? undefined : number(value);

const skillName = (value: unknown): string => {
  if (typeof value === 'string') return value;
  const item = record(value);
  return text(item.name || item.skillName || item.title || item.label);
};

export function adaptUniversityDashboard(value: unknown): UniversityDashboard {
  const source = record(value);
  const university = record(source.university);
  const summarySource = record(source.summary);
  const legacyKpis = record(source.kpis || source.metrics);
  const trendsSource = record(source.trends);
  const legacyTrends = Array.isArray(source.trends) ? source.trends : [];
  const colleges = array(source.collegePerformance || source.colleges);
  const skills = array(source.topSkills || source.topSkillsInDemand);
  const employers = array(source.topEmployers || legacyKpis.topEmployers);

  return {
    university: {
      id: text(university.id || university._id),
      name: text(university.name || university.nameEn || university.nameAr),
      logoUrl: text(university.logoUrl) || null,
      academicYear: text(university.academicYear) || null,
    },
    summary: {
      totalStudents: number(summarySource.totalStudents ?? legacyKpis.totalStudents),
      totalColleges: number(summarySource.totalColleges ?? legacyKpis.totalColleges),
      totalDepartments: number(summarySource.totalDepartments ?? legacyKpis.totalDepartments),
      verifiedStudents: optionalNumber(summarySource.verifiedStudents),
      averageReadiness: number(summarySource.averageReadiness ?? legacyKpis.avgReadinessScore),
      employmentRate: number(summarySource.employmentRate ?? legacyKpis.employmentRate),
      curriculumAlignment: optionalNumber(summarySource.curriculumAlignment ?? legacyKpis.skillAlignmentScore),
    },
    collegePerformance: colleges.map((raw) => {
      const item = record(raw);
      return {
        collegeId: text(item.collegeId || item.id || item._id),
        collegeName: text(item.collegeName || item.name || item.nameEn || item.nameAr),
        studentCount: number(item.studentCount ?? item.totalStudents),
        readinessScore: number(item.readinessScore ?? item.avgReadinessScore),
        employmentRate: number(item.employmentRate),
        skillGapCount: optionalNumber(item.skillGapCount) ?? array(item.skillGaps).length,
      };
    }),
    trends: {
      readiness: array(trendsSource.readiness).map((raw) => {
        const item = record(raw);
        return { period: text(item.period || item.year), value: number(item.value ?? item.readiness) };
      }),
      employment: (array(trendsSource.employment).length ? array(trendsSource.employment) : legacyTrends).map((raw) => {
        const item = record(raw);
        return { period: text(item.period || item.year), value: number(item.value ?? item.employmentRate ?? item.universityAverage) };
      }),
    },
    topSkills: skills.map((raw) => {
      const item = record(raw);
      return {
        name: skillName(raw),
        demandScore: optionalNumber(item.demandScore),
        studentCoverage: optionalNumber(item.studentCoverage),
      };
    }).filter((item) => item.name),
    topEmployers: employers.map((raw) => {
      const item = record(raw);
      return {
        name: text(item.name || item.companyName),
        hires: optionalNumber(item.hires),
        applications: optionalNumber(item.applications),
      };
    }).filter((item) => item.name),
    recentActivities: array(source.recentActivities || source.recentPlacements).map((raw) => {
      const item = record(raw);
      return {
        id: text(item.id || item._id),
        type: text(item.type || 'activity'),
        title: text(item.title || item.studentName || item.description),
        createdAt: text(item.createdAt || item.date),
      };
    }).filter((item) => item.id && item.title),
    skillGaps: array(source.skillGaps).map(skillName).filter(Boolean),
  };
}

const adaptStudent = (raw: unknown): UniversityStudent => {
  const item = record(raw);
  return {
    id: text(item.id || item._id),
    userId: text(item.userId) || undefined,
    fullName: text(item.fullName || item.name || item.nameEn || item.nameAr),
    email: text(item.email) || undefined,
    studentNumber: text(item.studentNumber || item.studentId) || undefined,
    universityId: text(item.universityId),
    collegeId: text(item.collegeId) || undefined,
    collegeName: text(item.collegeName || item.college) || undefined,
    departmentId: text(item.departmentId) || undefined,
    departmentName: text(item.departmentName || item.department) || undefined,
    academicLevel: text(item.academicLevel) || undefined,
    readinessScore: optionalNumber(item.readinessScore),
    employmentStatus: text(item.employmentStatus) || undefined,
    affiliationStatus: text(item.affiliationStatus) || undefined,
    cvStatus: text(item.cvStatus) || undefined,
    createdAt: text(item.createdAt) || undefined,
    gpa: optionalNumber(item.gpa),
    graduationYear: optionalNumber(item.graduationYear || item.expectedGraduation),
    skills: array(item.skills).map(skillName).filter(Boolean),
  };
};

export function adaptUniversityStudents(value: unknown): UniversityStudents {
  const source = record(value);
  const pagination = record(source.pagination);
  const filters = record(source.filters);
  return {
    items: array(source.items || source.students).map(adaptStudent),
    pagination: {
      page: number(pagination.page ?? source.page) || 1,
      limit: number(pagination.limit ?? source.limit) || 20,
      total: number(pagination.total ?? source.total),
      totalPages: number(pagination.totalPages ?? source.totalPages),
    },
    filters: {
      colleges: array(filters.colleges || source.colleges).map((raw) => {
        const item = record(raw);
        return { id: text(item.id || item._id), name: text(item.name || item.nameEn || item.nameAr) };
      }).filter((item) => item.id && item.name),
      departments: array(filters.departments || source.departments).map((raw) => {
        const item = record(raw);
        return {
          id: text(item.id || item._id),
          name: text(item.name || item.nameEn || item.nameAr),
          collegeId: text(item.collegeId),
        };
      }).filter((item) => item.id && item.name),
    },
  };
}

export function adaptUniversityStudentStatistics(value: unknown): UniversityStudentStatistics {
  const source = record(value);
  const summary = record(source.summary);
  return {
    summary: {
      totalStudents: number(summary.totalStudents),
      activeStudents: number(summary.activeStudents),
      graduates: number(summary.graduates),
      averageReadiness: number(summary.averageReadiness),
    },
    employmentStatusDistribution: array(source.employmentStatusDistribution).map((raw) => {
      const item = record(raw);
      return { status: text(item.status || item.name), count: number(item.count || item.value) };
    }).filter((item) => item.status),
    topSkillsDistribution: array(source.topSkillsDistribution).map((raw) => {
      const item = record(raw);
      return { skill: text(item.skill || item.name), count: number(item.count || item.students) };
    }).filter((item) => item.skill),
    employmentTimeline: array(source.employmentTimeline).map((raw) => {
      const item = record(raw);
      return {
        period: text(item.period || item.month),
        employed: number(item.employed || item.currentYear),
        applicants: optionalNumber(item.applicants),
      };
    }).filter((item) => item.period),
  };
}

export function adaptUniversityStructure(value: unknown): UniversityStructure {
  const source = record(value);
  const university = record(source.university);
  const colleges = array(source.colleges).map((raw) => {
    const item = record(raw);
    return {
      id: text(item.id || item._id),
      name: text(item.name || item.nameEn || item.nameAr),
      code: text(item.code) || undefined,
      description: text(item.description) || undefined,
      dean: text(item.dean) || undefined,
      established: optionalNumber(item.established || item.establishedYear),
      status: text(item.status) || 'active',
      studentCount: number(item.studentCount),
      departments: array(item.departments).map((departmentRaw) => {
        const department = record(departmentRaw);
        return {
          id: text(department.id || department._id),
          name: text(department.name || department.nameEn || department.nameAr),
          code: text(department.code) || undefined,
          description: text(department.description) || undefined,
          head: text(department.head) || undefined,
          status: text(department.status) || 'active',
          studentCount: number(department.studentCount),
          studyPlanCount: number(department.studyPlanCount),
          courseCount: number(department.courseCount),
        };
      }),
    };
  });
  return {
    university: {
      id: text(university.id || university._id),
      name: text(university.name || university.nameEn || university.nameAr),
    },
    colleges,
    totalColleges: number(source.totalColleges) || colleges.length,
    totalDepartments: number(source.totalDepartments) || colleges.reduce((total, college) => total + college.departments.length, 0),
  };
}
