# University Phase 3 API Contracts

All responses below are the controller payload before the existing global `TransformInterceptor` envelope. The frontend unwraps the global envelope once, then applies the University adapter.

All university-owned operations derive scope from the authenticated JWT user. No university ID is accepted from a query or request body.

## GET /api/universities/dashboard

```ts
{
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
  kpis: Record<string, unknown>;       // compatibility
  skillGaps: string[];                 // compatibility
  topSkillsInDemand: unknown[];        // compatibility
}
```

## GET /api/universities/students

Supported query fields: `page`, `limit`, `search`, `college`, `department`, `status`, `academicLevel`, and `gpaMin`. Page is at least 1; limit is constrained to 1-100.

```ts
{
  items: Array<{
    id: string;
    userId?: string;
    fullName: string;
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
  }>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  filters: {
    colleges: Array<{ id: string; name: string }>;
    departments: Array<{ id: string; name: string; collegeId: string }>;
  };
  students: unknown[]; // compatibility alias of items
  total: number;       // compatibility
  page: number;        // compatibility
  limit: number;       // compatibility
  totalPages: number;  // compatibility
}
```

Student scope is derived from the authenticated user's university profile. No `universityId` query field is accepted for scope control.

## GET /api/universities/students/statistics

```ts
{
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
```

The timeline is an empty array until a real dated employment history source exists. No chart points are synthesized.

## GET /api/universities/structure

```ts
{
  university: { id: string; name: string };
  colleges: Array<{
    id: string;
    name: string;
    code?: string;
    description?: string;
    dean?: string;
    established?: number;
    status: string;
    studentCount: number;
    departments: Array<{
      id: string;
      name: string;
      code?: string;
      description?: string;
      head?: string;
      status: string;
      studentCount: number;
      studyPlanCount: number;
      courseCount: number;
    }>;
  }>;
  totalColleges: number;
  totalDepartments: number;
}
```

No fake `courses` or `studyPlans` arrays are returned. The active page uses only the dedicated college and department endpoints.

## College And Department Mutations

| Method and path | Request | Result |
|---|---|---|
| `POST /api/universities/colleges` | `CreateCollegeDto` | Created normalized college |
| `PUT /api/universities/colleges/:collegeId` | `UpdateCollegeDto` | Updated owned college |
| `PUT /api/universities/colleges/:collegeId/archive` | none | College with `status: archived` |
| `PUT /api/universities/colleges/:collegeId/restore` | none | College with `status: active` |
| `DELETE /api/universities/colleges/:collegeId` | none | Soft-delete confirmation |
| `POST /api/universities/colleges/:collegeId/departments` | `CreateDepartmentDto` | Created normalized department |
| `PUT /api/universities/departments/:departmentId` | `UpdateDepartmentDto` | Updated owned department |
| `DELETE /api/universities/departments/:departmentId` | none | Soft-delete confirmation |

College fields are `name`, `nameAr`, `code`, `description`, `dean`, and `established`. Department fields are `name`, `nameAr`, `code`, `description`, and `head`. Unknown fields are rejected by the existing global validation pipe. Ownership is checked against both current `universityId` records and read-compatible legacy ownership fields.

## Explicit Maintenance Endpoint

`POST /api/universities/students/reconcile-affiliations`

Returns `{ matched: number; updated: number }`. It is JWT/RBAC protected for `admin` and `super_admin`; a university token returned HTTP 403 during verification. It is the only Phase 3 path that can run legacy affiliation reconciliation.
