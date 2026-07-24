# University Admin UI Completion

## Scope

This phase completed the existing University administrator UI without changing authentication, registration, JWT, approval, the `university` role, visual design, routing conventions, or the stabilized Dashboard/Students/Structure response contracts.

Restore point available before implementation:

- `C:\Users\a\Downloads\MADAR_before_phase4_20260713_013032.zip`
- 7,518,466 bytes (7.17 MB), 666 readable entries.

## Pages

### Updated

- `/university/dashboard`: real university logo, existing real metrics/charts, refresh, loading/error/empty states, and no institutional static values.
- `/university/structure`: real college/department data, expand/collapse, search across colleges/departments, status filter, reset, refresh, and complete CRUD dialogs.
- `/university/students`: real pagination, page size, search, dependent college/department filters, level/status/GPA filters, reset, refresh, student details, real statistics, and employment timeline when available.

### New

- `/university/profile`: view and edit supported University schema fields using the existing `PortalLayout`, `ContentCard`, colors, spacing, responsive layout, RTL/LTR behavior, toasts, validation, loading, error, and save states.

### Deferred

- `/university/settings` was not created because there is no dedicated university settings API.
- Curriculum, study plans, and courses remain outside this phase.
- Logo file upload remains deferred; Profile supports only the schema-backed logo URL.

## Forms And Dialogs

- Reused existing College create/edit dialog with name, code, description, dean, and establishment year.
- Reused existing Department create/edit dialog with name, code, description, and head.
- Reused confirmation dialog for college archive/restore and department soft delete.
- Added University Profile form for name, description, city, country, address, website, phone, public contact email, official contact email, and logo URL.
- Client and backend validation reject blank required names, invalid email, invalid URL, and empty/unsupported-only Profile updates.
- Failed mutations keep their form open and show API messages; successful mutations invalidate or update React Query caches without full reload.

## Buttons And Navigation

Connected actions:

- Dashboard refresh and real trend period selector.
- Structure refresh, search, status filter, reset, expand/collapse, add/edit/archive/restore college, and add/edit/archive department.
- Students refresh, search, filters, reset, page size, previous/next, and view details.
- Profile retry and save.
- Sidebar Profile route for the `university` role.

Disabled with an explanation:

- Dashboard detailed report.
- Study Plan and Course creation because no complete backend module exists.
- Student export/import because they are outside this phase.
- Manual student creation because students are created through registration.
- University header notification button because no university notification route exists.

The Profile link is hidden from the existing coordinator portal because the Profile API is scoped to the authenticated University account.

## APIs

Existing APIs used:

- `GET /api/universities/dashboard`
- `GET /api/universities/structure`
- `GET /api/universities/students`
- `GET /api/universities/students/statistics`
- College and Department create/update/archive/restore endpoints established in Phase 3.

Added profile APIs:

- `GET /api/universities/profile`
- `PUT /api/universities/profile`

Both Profile endpoints derive ownership exclusively from the JWT user. `universityId` is not part of the DTO; unsupported-only requests return HTTP 400.

## Data Compatibility Fix

The runtime test found that adding one current-format college caused legacy-owned colleges to disappear from Structure reads. The backend now merges current `universityId` records with legacy ownership records, de-duplicates by document ID, and performs no migration or write during GET.

## Files Modified

Frontend:

- `app/src/App.tsx`
- `app/src/components/PortalLayout.tsx`
- `app/src/pages/university/UniversityDashboard.tsx`
- `app/src/pages/university/UniversityStructure.tsx`
- `app/src/pages/university/UniversityStudents.tsx`
- `app/src/pages/university/UniversityProfile.tsx` (new)
- `app/src/services/universityApi.ts`
- `app/src/hooks/useUniversity.ts`
- `app/src/types/university.types.ts`

Backend:

- `madar-backend/src/universities/universities.controller.ts`
- `madar-backend/src/universities/universities.service.ts`
- `madar-backend/src/universities/dto/update-university.dto.ts`
- `madar-backend/src/universities/dto/university-contracts.dto.ts`
- `madar-backend/src/universities/universities.service.spec.ts`
- `madar-backend/src/universities/universities.controller.spec.ts`
- `madar-backend/src/universities/dto/university-management.dto.spec.ts`

## Verification Results

| Command | Result |
|---|---|
| `app: npx tsc --noEmit` | PASS, exit 0 |
| `app: npm run build` | PASS, exit 0, 2957 modules transformed |
| `madar-backend: npx tsc --noEmit` | PASS, exit 0 |
| `madar-backend: npm run build` | PASS, exit 0 |
| `madar-backend: npm run test -- --runInBand` | PASS, exit 0, 3 suites and 19 tests |

The frontend build reported only the existing stale Browserslist and large-chunk warnings. No packages were upgraded.

## Runtime Verification

- Frontend and Backend returned HTTP 200; MongoDB health was connected.
- University login used the existing seeded University account.
- Dashboard returned 22 scoped students and 2 real colleges.
- Students returned 5 of 22 using a real page limit; search reduced results to the matching student; statistics returned 22.
- Profile GET and temporary Profile update succeeded; the original description was restored.
- Invalid email, invalid URL, unsupported ownership field, and unauthenticated Profile requests returned 400, 400, 400, and 401 respectively.
- College create/update/archive/restore and Department create/update/soft-delete succeeded.
- Test records were soft-deleted after verification.
- Mixed current and legacy college ownership returned all three records during the merge test; the temporary record was then removed.
- All four frontend paths returned the Vite application with HTTP 200.

Authenticated visual interaction and browser Console inspection were not claimed because an interactive browser automation surface was unavailable. Responsive and RTL preservation are supported by the unchanged layout system and successful compilation, but remain a manual visual check.
