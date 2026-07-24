# University Staff and College Coordinator Management

## Backup

- Path: `C:\Users\a\Downloads\MADAR_before_university_staff_20260713_021312.zip`
- Size: 7,545,022 bytes (7.2 MB)
- Entries: 678

## Scope

This phase adds university staff invitations, role and college assignment, account activation, invitation lifecycle actions, database-backed access checks, college scoping, audit logs, and the `/university/staff` page. The existing `university` role, approval workflow, `UniversityStatusGuard`, Phase 3 contracts, student/company registration, design, and AI service were retained.

## Roles And Permissions

| Role | Portal access | Write access |
|---|---|---|
| `university` | All university pages and all university data | Staff, colleges, departments, and profile |
| `coordinator` | Dashboard, structure, students, and analytics for one assigned college | Departments in the assigned college only |
| `university_viewer` | Read-only university dashboard, structure, students, and analytics | None |
| `data_officer` | Read-only university dashboard, structure, students, and analytics | None |
| `quality_officer` | Read-only university dashboard, structure, students, and analytics | None |

Institutional staff roles cannot be created through public or Google registration. They require an invitation. A coordinator invitation requires a college owned by the authenticated university.

## API Endpoints

- `GET /api/universities/staff`
- `POST /api/universities/staff/invite`
- `PATCH /api/universities/staff/:id`
- `PATCH /api/universities/staff/:id/status`
- `POST /api/universities/staff/:id/resend-invitation`
- `DELETE /api/universities/staff/:id/invitation`

Every staff endpoint derives the university from the JWT user, applies `JwtAuthGuard`, `RolesGuard`, and `UniversityStatusGuard`, and is restricted to the `university` role. Service queries include the authenticated university ID.

## Security And Scope

- `InstitutionalStaffGuard` reads the current User, staff profile, invitation state, and University status from MongoDB on every protected request.
- Disabled users are rejected even when they present an access token issued before deactivation.
- Staff access requires `User.status=active`, `staff.status=active`, `invitationStatus=accepted`, and `University.status=active`.
- Coordinator reads add an `academicInfo.collegeId` scope and filter colleges/departments to the assigned college.
- Department writes verify `departments:write` and exact assigned `collegeId` in the service.
- Coordinators cannot create colleges, access university staff management, or access the university profile.
- Read-only roles cannot call department or college write endpoints.
- A user cannot register a staff role publicly or elevate their own role through the staff APIs.

## Invitation Lifecycle

1. University creates an invitation and a `pending_verification` User.
2. The invitation stores role, university, optional college, permissions, expiry, inviter, and message.
3. Email delivery uses the existing email service. Delivery failure is logged and does not roll back the invitation.
4. The existing reset-password flow sets the password, activates the User, and marks the invitation accepted.
5. Resend rotates the token and expiry. Cancel removes only an unused invitation and its pending User.

## Audit Logs

The following actions are stored in `auditlogs` with actor, staff resource, resource ID, details, severity, and timestamp:

- `INVITE_UNIVERSITY_STAFF`
- `UPDATE_UNIVERSITY_STAFF`
- `ACTIVATE_UNIVERSITY_STAFF`
- `DEACTIVATE_UNIVERSITY_STAFF`
- `RESEND_UNIVERSITY_STAFF_INVITATION`
- `CANCEL_UNIVERSITY_STAFF_INVITATION`

## Frontend

- Added `/university/staff` using the existing `PortalLayout`, `ContentCard`, Dialog, Sonner toast, colors, and responsive table patterns.
- Supports search and filters for role, college, status, and name/email, plus backend pagination.
- Supports invite, edit role/scope, activate/deactivate, resend, and cancel with validation, disabled pending states, confirmations, and error messages.
- The Staff link is visible only to the `university` owner.
- Coordinator/viewer/data/quality roles route to the university dashboard and see only permitted navigation.
- College controls remain owner-only. Department controls are shown to the owner and coordinator, while the backend remains authoritative.

## Runtime Verification

Services used:

- MongoDB: `127.0.0.1:27017`
- NestJS: `http://localhost:3001`
- React/Vite: `http://localhost:3000`

A disposable university, college, coordinator, and read-only viewer were created. The university was activated as test fixture setup because approval workflow testing is outside this phase. All disposable MongoDB documents were removed after verification (`remainingUsers=0`, `remainingUniversity=0`, `remainingStaff=0`).

| Scenario | Actual result |
|---|---|
| Invite coordinator with owned college | HTTP success |
| Accept invitation and login | HTTP success |
| Coordinator structure | HTTP 200, exactly one college, assigned ID matched |
| Coordinator student filters | Exactly one assigned college |
| Coordinator opens Staff API | HTTP 403 |
| Coordinator opens University Profile API | HTTP 403 |
| Coordinator creates a college | HTTP 403 |
| Viewer reads structure | HTTP 200 |
| Viewer creates a department | HTTP 403 |
| Disable coordinator | HTTP success |
| Old token after disable | HTTP 403 |
| Login while disabled | HTTP 401 |
| Reactivate coordinator | HTTP success |
| Old token after reactivation | HTTP 200 after current DB state was re-read |
| Filter staff list | One matching coordinator |
| Audit records created during flow | 4 records before cleanup |

The expected 401/403 authorization checks are logged by the existing global exception filter as errors; they are test evidence, not unhandled process failures.

## Commands And Results

- `app: npx tsc --noEmit` - exit 0
- `app: npm run build` - exit 0; 2,960 modules transformed
- `madar-backend: npx tsc --noEmit` - exit 0
- `madar-backend: npm run build` - exit 0
- `madar-backend: npm run test -- --runInBand` - exit 0; 8 suites, 52 tests passed
- Manual NestJS startup - passed on port 3001
- Manual Vite startup - passed on port 3000
- MongoDB connection and test CRUD - passed

## Tests Added

- Active institutional scope is loaded from MongoDB.
- Disabled staff reject an old token.
- Revoked/unaccepted staff access is rejected.
- Inactive university blocks staff.
- Coordinator invitation validates college ownership.
- Email failure does not fail invitation persistence.
- Staff lookup is scoped by university.
- Coordinator structure is limited to the assigned college.
- Public registration cannot create an institutional staff role.

## Files Modified

### Frontend

- `app/src/App.tsx`
- `app/src/components/PortalLayout.tsx`
- `app/src/hooks/useUniversity.ts`
- `app/src/pages/university/UniversityStaff.tsx`
- `app/src/pages/university/UniversityStructure.tsx`
- `app/src/services/authApi.ts`
- `app/src/services/universityApi.ts`
- `app/src/types/api.types.ts`
- `app/src/types/university.types.ts`

### Backend

- `madar-backend/src/auth/auth-university-approval.spec.ts`
- `madar-backend/src/auth/auth.module.ts`
- `madar-backend/src/auth/auth.service.ts`
- `madar-backend/src/common/enums/user-role.enum.ts`
- `madar-backend/src/common/services/email.service.ts`
- `madar-backend/src/universities/college-coordinators/college-coordinator.controller.ts`
- `madar-backend/src/universities/college-coordinators/college-coordinator.module.ts`
- `madar-backend/src/universities/college-coordinators/college-coordinator.service.ts`
- `madar-backend/src/universities/college-coordinators/college-coordinator.service.spec.ts`
- `madar-backend/src/universities/college-coordinators/dto/staff.dto.ts`
- `madar-backend/src/universities/college-coordinators/schemas/college-coordinator.schema.ts`
- `madar-backend/src/universities/institutional-staff.guard.ts`
- `madar-backend/src/universities/institutional-staff.guard.spec.ts`
- `madar-backend/src/universities/universities.controller.ts`
- `madar-backend/src/universities/universities.module.ts`
- `madar-backend/src/universities/universities.service.ts`
- `madar-backend/src/universities/universities.service.spec.ts`
- `madar-backend/src/users/schemas/user.schema.ts`

## Limitations

- SMTP credentials were not configured in the local runtime. Invitation creation and resend remain successful and report `emailSent=false`, as required.
- Automated visual/browser-console verification was unavailable in this session. The Vite server, frontend build, route chunk, API flow, and backend runtime were verified; no claim is made about visual screenshot verification.
- Curriculum/course management remains outside this phase.

## Result

**Passed with environment limitations**: implementation, TypeScript, builds, unit tests, MongoDB integration, and the complete API authorization flow passed. The remaining limitation is external SMTP delivery and unavailable browser automation, not core staff management behavior.

## Test Environment And Accounts

All accounts below are development-only records on the reserved `madar.test` domain. Their shared password is `MadarTest@2026`. Delete them or change their passwords before any production deployment.

| Role | Name | Email | University / College | Status | Expected access | Expected denial |
|---|---|---|---|---|---|---|
| Super Admin | Test Super Admin | `superadmin.test@madar.test` | Platform | Active | Admin dashboard and university reviews | University owner-only pages |
| University Admin | Active University Admin | `university.active@madar.test` | MADAR Development University | Active | Full university portal, profile, structure, staff | Other universities' staff |
| University Admin | Pending University Admin | `university.pending@madar.test` | MADAR Pending Test University | Pending | Pending-approval status page | University dashboard and APIs |
| University Admin | Suspended University Admin | `university.suspended@madar.test` | MADAR Suspended Test University | Suspended | Suspension status page | University dashboard and APIs |
| Coordinator | Test Coordinator | `coordinator.test@madar.test` | MADAR Development University / College of Computing and AI | Active | Assigned college, departments, students, analytics | Staff page, profile, other college, college creation |
| University Viewer | Test Viewer | `viewer.test@madar.test` | MADAR Development University | Active | Read dashboard, structure, students, analytics | All university writes and staff management |
| Data Officer | Test Data Officer | `data.officer.test@madar.test` | MADAR Development University | Active | Read institutional data | College, department, profile, and staff writes |
| Quality Officer | Test Quality Officer | `quality.officer.test@madar.test` | MADAR Development University | Active | Read quality and analytics data | College, department, profile, and staff writes |
| Disabled Staff | Disabled Test Staff | `disabled.staff.test@madar.test` | MADAR Development University | Suspended / inactive | None | Login and all protected APIs |

The active test university contains two colleges, four departments, four linked students, readiness scores, college employment rates, and skill-gap samples.

Create or refresh missing records without overwriting existing test accounts:

```powershell
cd madar-backend
$env:NODE_ENV='development'
$env:ENABLE_TEST_SEED='true'
$env:TEST_ACCOUNT_DEFAULT_PASSWORD='MadarTest@2026'
npm run seed:test-accounts
```

Remove only the known development test accounts and their linked test records:

```powershell
cd madar-backend
$env:NODE_ENV='development'
$env:ENABLE_TEST_SEED='true'
npm run seed:test-accounts:cleanup
```

The seed was executed twice successfully. Final database evidence: 9 requested accounts, one active university with 2 colleges, 4 departments, 4 students, and 5 staff profiles. Production execution was rejected with exit code 1.

## Staff Role Editing And Permission Templates

### Problem

The staff edit form only exposed a role selector and permission checkboxes for the `coordinator` role. For other staff roles (`university_viewer`, `data_officer`, `quality_officer`, `academic_development_officer`) the permissions section was hidden, so a University Manager could not add a role or adjust its permissions from the same dialog.

### Fix

1. Added explicit role-permission templates in `app/src/constants/permissions.ts`:
   - `DEFAULT_COORDINATOR_PERMISSIONS`
   - `DEFAULT_VIEWER_PERMISSIONS`
   - `DEFAULT_DATA_OFFICER_PERMISSIONS`
   - `DEFAULT_QUALITY_OFFICER_PERMISSIONS`
   - `DEFAULT_ACADEMIC_DEVELOPMENT_OFFICER_PERMISSIONS`
   - `ROLE_PERMISSION_TEMPLATES: Record<UniversityStaffRole, UniversityStaffPermission[]>`
   - `getDefaultPermissionsForRole(role)` helper

2. Updated `app/src/pages/university/UniversityStaff.tsx`:
   - Changed the staff table action from a generic "Edit" button to "تعديل الدور" (Edit role) with a Pencil icon.
   - Added a dedicated "الدور والصلاحيات" (Role & Permissions) section inside the `StaffForm` dialog.
   - Role select now auto-populates permissions from the matching template immediately on change.
   - Permission checkboxes are now visible for every staff role, not only `coordinator`.
   - Added a "تطبيق صلاحيات الدور الافتراضية" (Apply role default permissions) button to reset permissions to the template.
   - The update payload always sends `permissions` so backend validation and storage apply for every role.

3. Aligned backend default templates in `madar-backend/src/universities/college-coordinators/college-coordinator.service.ts`:
   - `permissionsFor(role)` now returns the correct permission set for each `UniversityStaffRole`.
   - Backend `UpdateUniversityStaffDto` already accepted `role` and `permissions` for all roles; no DTO change was required.

### Result

- University Manager can add a role and edit role/permissions for any staff member from one dialog.
- Selecting a role immediately shows and applies the default permissions for that role.
- Permissions are editable per-role before saving.
- `app: npx tsc --noEmit` - exit 0
- `app: npm run build` - exit 0
- `madar-backend: npx tsc --noEmit` - exit 0
- `madar-backend: npm run build` - exit 0

Browser visual verification was not performed in this session; API contract and build verification passed.

## Development Autofill Controls

Shared implementation:

- `app/src/utils/testDataGenerator.ts`
- `app/src/components/DevelopmentAutofillButton.tsx`
- Visibility: `import.meta.env.DEV || VITE_ENABLE_TEST_DATA === 'true'`
- Production default: hidden. The production bundle compiled the button component to `return null` with the example variable set to false.

Forms covered:

- University registration, including unique test email and valid temporary test password.
- Create and edit College.
- Create and edit Department.
- University Profile.
- Invite and edit University Staff / assign Coordinator / edit role and permissions.
- University rejection reason.
- University suspension reason.

Each form includes clear/test-only labeling and a clear or restore-original-values action. Autofill changes local form state only; it never submits or writes automatically. Runtime API validation passed for profile save/reset, college create/edit, department create/edit, staff invitation, staff role/permission edit, and invitation cancellation. Temporary autofill verification records were removed afterward.

## Extended Runtime Evidence

- Super Admin login: HTTP 200.
- Active University Admin login/dashboard/staff: HTTP 200; 5 staff visible.
- Pending University Admin login/status: HTTP 200; dashboard HTTP 403.
- Suspended University Admin login/status: HTTP 200; dashboard HTTP 403.
- Coordinator login: HTTP 200; exactly one assigned college and one college filter; Staff and college creation HTTP 403.
- Viewer login/read: HTTP 200; department write HTTP 403.
- Data Officer login/read: HTTP 200; college write HTTP 403.
- Quality Officer login/analytics: HTTP 200; profile write HTTP 403.
- Disabled staff login: HTTP 401.
- Coordinator token issued before deactivation: HTTP 403 after deactivation; coordinator was reactivated after the test.

## Final Development Services

- Frontend command: `npm run dev -- --host 0.0.0.0` inside `app`.
- Backend command: `npm run start:dev` inside `madar-backend`.
- MongoDB: local listener on `127.0.0.1:27017`, database `madar`.
- AI service is not required for this staff-management phase and was not modified.
- Frontend URL: `http://localhost:3000` (PID 12932, HTTP 200).
- Backend URL: `http://localhost:3001` (PID 7228).
- Health URL: `http://localhost:3001/api/health` (HTTP 200, `database=connected`).
- MongoDB PID: 5532.
- Frontend and Backend were intentionally left running after final verification.
