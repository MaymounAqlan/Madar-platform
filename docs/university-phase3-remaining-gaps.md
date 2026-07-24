# University Phase 3 Remaining Gaps

## Deferred By Scope

- University approval workflow and institutional status guard.
- `university_admin` role; the existing `university` role was preserved.
- Logo upload or logo schema changes.
- Real PDF/Excel report generation.
- Full curriculum, course, and study-plan modules.
- Registration and authentication changes.
- Coordinator frontend/backend role mismatch from Phase 2.

## Data Migration

Legacy students that have a university name but no `academicInfo.universityId` require an explicit migration/reconciliation run. Phase 3 keeps a logged, read-only name fallback only when the university has no ID-linked students. Legacy colleges using `colleges.university` are read by verified ObjectId ownership without being rewritten. A later migration should normalize both collections to their current `universityId` fields.

## Data Availability

- Academic year has no current persisted source, so the contract returns `null` and the UI displays `Not specified`.
- Employment timeline has no dated historical source, so it returns `[]` and the chart is hidden.
- Recent university activities have no dedicated read model in this phase, so they return `[]`.
- Department `courseCount` and `studyPlanCount` are zero until curriculum collections are implemented.
- Employment status is read from existing `aiMetrics.employmentStatus` where available; records without it are categorized as `unknown`.

## UI Actions

- Add Plan and Add Course remain visible but disabled with a clear curriculum-module message.
- The active Structure page no longer calls the broad `PUT /universities/structure` endpoint.
- Add/Edit College and Add/Edit/Archive Department dialogs are connected to dedicated APIs. College archive and restore are also connected.
- Department restore is not exposed because no supported restore endpoint exists; implementing it is deferred rather than faking the action.
- Student export/import/manual creation and Dashboard report export remain disabled with clear explanatory titles because they are outside Phase 3.

## Verification Limitations

The running services, health checks, protection behavior, authenticated University API flow, write ownership, and temporary CRUD lifecycle were verified against the local database. In-app browser automation was unavailable, so visual page rendering, responsive behavior, and browser Console inspection remain a manual check.

## Existing Quality Baseline

General frontend lint failures documented in Phase 2 remain outside scope. A modified-file ESLint run still reports pre-existing explicit `any` usage in `universityApi.ts` and `useUniversity.ts`. Backend ESLint cannot run without a configuration file, and the existing npm lint script was intentionally not run because it uses `--fix`.
