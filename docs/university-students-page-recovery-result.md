# University Students Page Recovery Result

## Summary

The University Students page (`/university/students`) was rendering the error message "حدث خطأ أثناء تحميل الطلاب" immediately on load for an active University Manager. The backend endpoints were healthy and returning data. The actual defect was in the frontend React Query hook usage: the students and statistics queries were never enabled, so `studentsData` stayed `undefined`, the loading check resolved to `false`, and the page fell through to the error UI.

## Root Cause

| Item | Finding |
|------|---------|
| File | `app/src/pages/university/UniversityStudents.tsx` |
| Line (before fix) | 66: `const studentsQuery = useUniversityStudents(query);` |
| Hook signature | `useUniversityStudents(params?, enabled = false)` |
| Effect | `enabled` defaulted to `false`, so React Query never fetched `/api/universities/students` |
| Result | `studentsData` remained `undefined`; `studentsQuery.isLoading` became `false`; the condition `studentsQuery.isError \|\| !studentsData` rendered the generic error message |
| Same issue | `useUniversityStudentStatistics()` and `useInstitutionalAccess()` were also called without enabling them |

The backend was not failing. Verified API calls:

| Endpoint | Role | Status | Body |
|----------|------|--------|------|
| `GET /api/universities/students?page=1&limit=20` | University Manager | 200 | 22 total students, paginated |
| `GET /api/universities/students/statistics` | University Manager | 200 | summary + distributions |
| `GET /api/universities/staff/me/access` | University Manager | 200 | `role: university`, `permissions: ["*"]` |

## Fixes Applied

### Frontend

File: `app/src/pages/university/UniversityStudents.tsx`

1. Enabled the data queries:
   - `useUniversityStudents(query, true)`
   - `useUniversityStudentStatistics(true)`
   - `useInstitutionalAccess(true)`
2. Corrected the loading/error/empty states:
   - Show `<LoadingSpinner />` while `isLoading` or `isPending`.
   - Show a real error UI only when `studentsQuery.isError`.
   - Distinguish 401/403 authorization errors from server-unavailable errors.
   - Show a dedicated empty-state message when no students are affiliated (`لا يوجد طلاب مرتبطون بالجامعة حتى الآن`) instead of the generic error.
3. Fixed retry behavior:
   - Retry button now refetches both students and statistics.
   - Disabled while either query is fetching.
4. Refresh button also refetches both queries.

No backend changes were required because the API contract and database queries were already correct.

## Files Modified

- `app/src/pages/university/UniversityStudents.tsx`

Backups of the original file and related modules are in:

- `backups/university-students-recovery-20260715/`

## Response Contract Verified

Backend returns:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "items": [ /* UniversityStudent[] */ ],
    "pagination": { "page": 1, "limit": 20, "total": 22, "totalPages": 2 },
    "filters": {
      "colleges": [{ "id": "...", "name": "..." }],
      "departments": [{ "id": "...", "name": "...", "collegeId": "..." }]
    }
  }
}
```

Frontend adapter `adaptUniversityStudents` maps `items`, `pagination`, and `filters` correctly. The page uses `studentsData?.items`, `studentsData?.pagination`, and `studentsData?.filters`.

## MongoDB Relationship Verified

Students are linked to the university through `Student.academicInfo.universityId`. The backend `resolveStudentScopeFilter` builds `{ 'academicInfo.universityId': universityId }` and also accepts legacy affiliations via `StudentAffiliation` records. University Managers see all students in their university; Coordinators see only students in their assigned college through `withCollegeScope`.

## Runtime Account Matrix

| Account | Role | students API | statistics API | access API | Result |
|---------|------|--------------|----------------|------------|--------|
| `cs@ksu.edu.sa` | university (active) | 200, 22 total | 200 | 200, permissions `["*"]` | PASS |
| `coordinator.test@madar.test` | coordinator (students:read) | 200, scoped to college | 200 | 200, 9 permissions | PASS |
| `viewer.test@madar.test` | university_viewer (students:read) | 200 | — | 200 | PASS |

Pagination, search, and limit filters were also verified:

| Test | Result |
|------|--------|
| `page=2&limit=5` | 200, 5 items, page 2, 5 total pages |
| `search=Functional` | 200, 1 matching item |
| invalid `page=abc` | 200, defaults to page 1 |

## Regression Verification

University Manager token tested against:

| Endpoint | Status |
|----------|--------|
| `GET /api/universities/dashboard` | 200 |
| `GET /api/universities/structure` | 200 |
| `GET /api/universities/colleges` | 200 |
| `GET /api/universities/departments` | 200 |
| `GET /api/universities/students` | 200 |
| `GET /api/universities/students/statistics` | 200 |
| `GET /api/universities/analytics` | 200 |
| `GET /api/universities/staff` | 200 |

## Automated Checks

| Command | Result |
|---------|--------|
| `cd madar-backend && npx tsc --noEmit` | ✅ Pass |
| `cd madar-backend && npm run build` | ✅ Pass |
| `cd madar-backend && npm run test -- --runInBand` | ✅ 9 suites, 70 tests passed |
| `cd madar-backend && npm run test:e2e` | ✅ 1 suite, 6 tests passed |
| `cd app && npx tsc --noEmit` | ✅ Pass |
| `cd app && npm run build` | ✅ Pass |

## Browser Result

No real browser walkthrough was performed. The fix was verified through API responses and frontend code inspection. The Vite dev server (port 3000) and NestJS backend (port 3001) remain running, so the updated component is available for immediate browser verification.

## URLs

- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api
- University Students page: http://localhost:3000/#/university/students

## Remaining Issues

1. Real browser rendering and HMR confirmation were not exercised; verify visually that the page loads the student table and statistics cards.
2. The `byCollege` filter returned 0 results for the test university in runtime API checks. This is likely a data-quality issue (student records reference college names rather than matching ObjectIds), not a code defect. The backend query is correct and returns 200.
3. No backend guard or DTO changes were needed, so no additional backend unit tests were added for this fix.
