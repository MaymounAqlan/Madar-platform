# University API Contract Matrix

Global response behavior:
- Backend uses `TransformInterceptor`.
- If a controller result contains a `data` key, the interceptor returns `{ success, statusCode, message, data, meta, timestamp }`.
- This creates nested responses for auth endpoints because `AuthController` already returns `{ success, data, message }`.

| Endpoint | Frontend caller file | Frontend method | Request expected by frontend | Backend controller method | DTO used | Service method | Actual response structure | Frontend expected structure | Match | Risk |
|---|---|---|---|---|---|---|---|---|---|---|
| `POST /api/auth/register` | `app/src/services/authApi.ts`, `app/src/pages/Register.tsx` | `authApi.register` | `RegisterRequest` with `role` and role-specific `profile` | `AuthController.register` | `RegisterDto` | `AuthService.register` | Nested wrapped auth response: `data.user`, `data.tokens`, with outer wrapper by interceptor | `AuthResponse` after `unwrapResponse` | Partial | Medium |
| `POST /api/auth/login` | `app/src/services/authApi.ts`, `app/src/pages/Login.tsx` | `authApi.login` | `{ email, password }` | `AuthController.login` | `LoginDto` | `AuthService.login` | Nested wrapped auth response: `data.user`, `data.tokens` | `AuthResponse` after `unwrapResponse` | Partial | Medium |
| `GET /api/universities/dashboard` | `app/src/services/universityApi.ts`, `useUniversityDashboard`, `UniversityDashboard.tsx` | `universityApi.getDashboard` | No body; bearer token | `UniversitiesController.getDashboard` | none | `UniversitiesService.getDashboard` | `{ university, kpis, collegePerformance, skillGaps, topSkillsInDemand }` wrapped in `data` | Page reads `kpis`, but also expects `colleges`, `trends`, `topEmployers`, `recentPlacements`, `welcomeTitle` fallbacks | Partial | High |
| `GET /api/universities/structure` | `app/src/services/universityApi.ts`, `useUniversityStructure`, `UniversityStructure.tsx` | `universityApi.getStructure` | No body; bearer token | `UniversitiesController.getStructure` | none | `UniversitiesService.getStructure` | `{ university, colleges, totalColleges, totalDepartments, courses: [] }` | Page expects `colleges`, `studyPlans`, `courses` | Partial | Medium |
| `GET /api/universities/students` | `app/src/services/universityApi.ts`, `useUniversityStudents`, `UniversityStudents.tsx` | `universityApi.getStudents` | Query `page,limit,college,department,status` | `UniversitiesController.getStudents` | none | `UniversitiesService.getStudents` | `{ students, total, page, limit, totalPages }` | Type expects `PaginatedResponse` with `items/pagination`; page also expects `colleges`, `employmentStatusDistribution`, `topSkillsDistribution`, `employmentTimeline` | Mismatch | High |
| `GET /api/universities/analytics` | `app/src/services/universityApi.ts` | `universityApi.getAnalytics` | No body; bearer token | `UniversitiesController.getAnalytics` | none | `UniversitiesService.getAnalytics` | `{ employmentByCollege, skillGapsByDepartment, avgReadiness, avgGpa, totalStudents, courseMarketComparison, topSkillsInDemand }` | Generic `any`; no strict contract | Partial | Medium |
| `GET /api/universities/reports/:type` | `app/src/services/universityApi.ts` | `universityApi.getReport` | Query `format=json/csv/excel/pdf` | `UniversitiesController.generateReport` | none | `UniversitiesService.generateReport` | JSON report, or raw `text/csv`; PDF returns JSON content metadata | Frontend treats non-json as text; PDF/Excel names imply richer formats | Partial | High |
| `POST /api/universities/colleges` | `app/src/services/universityApi.ts`, `useCreateCollege` | `universityApi.createCollege` | `any`, usually name/code/description/dean/etc | `UniversitiesController.createCollege` | none (`body:any`) | `UniversitiesService.createCollege` | College DTO via `toCollegeDto` | Generic `any` | Partial | Medium |
| `POST /api/universities/colleges/:collegeId/departments` | `app/src/services/universityApi.ts`, `useCreateDepartment` | `universityApi.createDepartment` | `any`, department payload | `UniversitiesController.createDepartment` | none (`body:any`) | `UniversitiesService.createDepartment` | Department DTO via `toDepartmentDto` | Generic `any` | Partial | Medium |

Focused contract findings:
- Register payload for university sends `profile.universityName`, `description`, `location`, `website`, `phone`, `officialContact`, `logo`.
- Backend requires only `profile.universityName` and `profile.description` for university registration.
- Backend stores logo as `branding.logoUrl`.
- Students endpoint is the largest current mismatch.
- Dashboard uses `collegePerformance`, while frontend page reads `colleges` for one section.
- Report `excel` is delivered as CSV, and `pdf` is not a binary PDF.
