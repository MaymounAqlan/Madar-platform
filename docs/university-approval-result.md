# University Approval and Status Protection Result

## Backup

- Path: `C:\Users\a\Downloads\MADAR_before_university_approval_20260713_014900.zip`
- Size: 7,527,442 bytes (7.18 MB)
- Entries: 668
- Read verification: passed.

## Registration State

- A newly registered University keeps the existing `university` user role.
- The User document remains `active` so authentication and the status page work.
- The University document is created with `status: pending` and `submittedAt`.
- Student and Company registration behavior remains active and unchanged.
- Frontend registration and login route University users through `/university/pending-approval`; active universities are then redirected to `/university/dashboard`.

## Guard

`UniversityStatusGuard` runs after JWT and role validation and reads both User and University from MongoDB for every protected request.

- Active University: allowed.
- Pending: HTTP 403, `UNIVERSITY_PENDING_APPROVAL`.
- Inactive: HTTP 403, `UNIVERSITY_INACTIVE`.
- Suspended: HTTP 403, `UNIVERSITY_SUSPENDED`.
- Inactive/banned/deleted User: `USER_INACTIVE`.
- Suspended User: `USER_SUSPENDED`.

The status endpoint skips only University approval enforcement; current User state is still checked. Admin and Super Admin endpoints in the Universities controller bypass the University-specific state check. An old JWT cannot bypass a later suspension because no University status is trusted from the token.

## Authentication Policy

- Login re-reads User status and blocks inactive, banned, deleted, and suspended users with stable codes.
- A University whose University document is pending, inactive, or suspended may authenticate while its User remains active, but can access only the status surface.
- Refresh Token verifies the signature, re-reads User status, and re-reads the University record for University users before issuing tokens.
- Suspended University records may receive a refreshed token so their status page remains available; protected portal APIs remain blocked by the database-backed Guard.

## APIs

University:

- `GET /api/universities/me/status`

Super Admin management:

- `GET /api/admin/universities/pending`
- `GET /api/admin/universities/:id`
- `PATCH /api/admin/universities/:id/approve`
- `PATCH /api/admin/universities/:id/reject`
- `PATCH /api/admin/universities/:id/suspend`
- `PATCH /api/admin/universities/:id/reactivate`

Compatibility routes retained:

- `PUT /api/admin/universities/:id/approve`
- `PUT /api/admin/universities/:id/suspend`

Admin identity is read from JWT rather than query parameters. Rejection and suspension require a validated non-blank reason.

## State Transitions

- Approve: active, reviewedAt/reviewedBy saved, old reasons removed, notification and Audit Log written.
- Reject: inactive, rejectionReason required, review metadata saved, notification and Audit Log written.
- Suspend: suspended immediately, suspensionReason required, notification and Audit Log written.
- Reactivate: active, old reasons removed, notification and Audit Log written.

## Frontend Pages

- New `/university/pending-approval` page with pending, inactive, suspended, refresh, reason, registration date, and logout states.
- New `/admin/universities` page using the existing PortalLayout, components, colors, RTL/LTR behavior, dialogs, and toasts.
- University management supports real search, status filtering, pagination, details, approve, reject, suspend, and reactivate.
- Reject and Suspend dialogs require a reason.
- ProtectedRoute prevents redirect loops and checks current University status.
- The API interceptor sends University status errors immediately to the pending-approval page.

## Files Modified

Backend:

- `src/auth/auth.service.ts`
- `src/universities/schemas/university.schema.ts`
- `src/universities/university-status.guard.ts`
- `src/universities/university-status.decorator.ts`
- `src/universities/universities.module.ts`
- `src/universities/universities.controller.ts`
- `src/universities/universities.service.ts`
- `src/users/users.module.ts`
- `src/users/users.controller.ts`
- `src/users/admin.service.ts`
- `src/users/dto/review-university.dto.ts`
- Approval-related Auth, Guard, Admin, DTO, Controller, and Service tests.

Frontend:

- `src/App.tsx`
- `src/components/ProtectedRoute.tsx`
- `src/components/PortalLayout.tsx`
- `src/pages/Register.tsx`
- `src/pages/university/UniversityPendingApproval.tsx`
- `src/pages/admin/AdminUniversities.tsx`
- `src/services/api.ts`
- `src/services/authApi.ts`
- `src/services/universityApi.ts`
- `src/services/adminApi.ts`
- `src/hooks/useUniversity.ts`
- `src/hooks/useAdmin.ts`
- `src/types/university.types.ts`
- `src/types/admin-university.types.ts`

## Automated Verification

| Command | Result |
|---|---|
| Frontend `npx tsc --noEmit` | PASS, exit 0 |
| Frontend `npm run build` | PASS, exit 0, 2959 modules |
| Backend `npx tsc --noEmit` | PASS, exit 0 |
| Backend `npm run build` | PASS, exit 0 |
| Backend `npm run test -- --runInBand` | PASS, exit 0, 6 suites and 42 tests |

Tests cover University pending registration, unchanged Student/Company registration, User status checks, current database reads, all University states, old-token suspension, status endpoint, required reasons, Admin transitions, notifications/auditing, and Refresh Token database checks.

## Runtime Flow

Executed against local MongoDB with temporary University and Super Admin fixtures:

1. University registration returned role `university`; University status was `pending`.
2. Status endpoint returned `canAccessPortal: false`.
3. Dashboard returned 403 with `UNIVERSITY_PENDING_APPROVAL`.
4. Pending list and details returned the new University.
5. Approval returned active, saved reviewedAt, and Dashboard returned 200 with the same University token.
6. Suspension returned suspended and the old token immediately received 403 with `UNIVERSITY_SUSPENDED`.
7. Status endpoint returned the suspension reason.
8. Refresh returned a new token while portal APIs remained Guard-protected.
9. Reactivation restored Dashboard access with HTTP 200.
10. A second flow verified rejection, rejectionReason, reactivation, suspension, and successful Refresh response shape.
11. Three notifications and three approval Audit Logs were present before cleanup.
12. Temporary Users, Universities, Notifications, and related Audit Logs were removed; cleanup verification returned zero temporary records.

## Preserved Behavior And Limits

- The `university` role, University UI design, Dashboard/Structure/Students/Profile contracts, Student/Company registration, logo handling, curriculum, staff, coordinators, and AI service were not changed.
- Existing active seeded universities remain active.
- Browser automation was unavailable, so authenticated visual screenshots and browser Console inspection were not claimed. HTTP/API runtime, TypeScript, production builds, and database state transitions were executed successfully.
- Existing Browserslist age and large frontend chunk warnings remain non-blocking; no package upgrades were performed.
