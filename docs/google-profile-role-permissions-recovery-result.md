# MADAR Google Authentication, Profile, Role & Permissions Recovery Result

## 1. Root Causes

### 1.1 Existing Google accounts redirected to CompleteGoogleProfile every login
- `CompleteGoogleProfile.tsx` decoded the OAuth state with `JSON.parse(atob(...))`. `atob` interprets base64 bytes as latin1, so Arabic names in the state became mojibake, but this was not the main redirect cause.
- The backend `AuthService.handleOAuthLogin` did not have an explicit `profileCompleted` flag. It inferred incompleteness from missing role-specific profile data and treated every login as potentially incomplete.
- Existing Google-linked users (especially those created before the profile-completion flag existed) were sent back to the completion page on every OAuth callback because no deterministic completion marker was persisted.
- Staff/institutional roles (`coordinator`, `university_viewer`, etc.) were not excluded from the OAuth completion flow, even though their access is governed by the institutional staff guard, not by the generic OAuth completion page.

### 1.2 Arabic names displayed as mojibake
- Root cause was in frontend base64 decoding: `atob(...)` decodes to latin1. UTF-8 bytes for Arabic were then shown as `ÙÙÙÙÙ Ø¹ÙÙØ§Ù`.
- MongoDB already stored the corrupted values for the affected record because the corrupted string had been written by an earlier code path.
- Source files were already UTF-8; no backend double-decoding was found.

### 1.3 Some university names displayed as `?????`
- These are unrecoverable placeholder values in test/seed records where Arabic text was never captured. They are not caused by encoding corruption; they consist of literal question marks.

### 1.4 University routes returned 403
- `GET /api/universities/me/status` was protected by `UniversityStatusGuard` and `InstitutionalStaffGuard`, but the `UniversitiesController` `@Roles` decorator only allowed `UserRole.UNIVERSITY`. Pending/suspended managers could not reach the status endpoint, and coordinators were blocked entirely from the controller-level status route.
- `GET /api/universities/staff/me/access` was in `CollegeCoordinatorController`, which applied `UniversityStatusGuard` without `@SkipUniversityStatus()` on the access/profile endpoints, so pending universities were denied.
- `GET /api/universities/dashboard` required an active university; pending universities legitimately got 403, but the frontend was calling it before `/auth/me` resolved and on every render, causing repeated 403 errors in the console.
- The `InstitutionalStaffGuard` required `user.userType === principal.role` and an active staff record. University Managers (owners) were correctly allowed, but the guard did not clearly separate owner access from staff access, and some pending-owner flows were blocked.

### 1.5 After login profile/institutional data sometimes did not appear
- Frontend hooks (`useQuery`) called University APIs before `/auth/me` completed, with stale or undefined tokens.
- `ProtectedRoute` gated the University status query for all portal users, not only `isUniversity`, causing extra 403 calls.
- React Query keys were not canonical; sidebar, layout, route guard, and page made duplicate calls.

### 1.6 Coordinator/University Manager role labels not shown
- The sidebar and header read `currentUser.role` directly and had no localized role-label mapping for institutional roles.
- Coordinator-specific institution (college/university) was not displayed beside the name.

### 1.7 Staff role and permission editing incomplete
- Default permission templates for operational staff roles (`university_viewer`, `data_officer`, `quality_officer`, `academic_development_officer`) did not exist in MongoDB.
- Several staff records had invalid legacy permissions (`curriculum:write`) or missing `roleId`.
- The backend DTO/schema permission list was not aligned with the canonical 18-permission set requested.

---

## 2. Fixes Applied

### 2.1 Existing Google account detection
**Backend**
- Added `profileCompleted: boolean` to `UserSchema` (`madar-backend/src/users/schemas/user.schema.ts`).
- Updated `AuthService.handleOAuthLogin`:
  - Looks up existing user by normalized email first.
  - Preserves existing `role`/`userType`, `universityId`, `collegeId`, `status`, and names.
  - Skips `CompleteGoogleProfile` for staff/institutional roles.
  - Uses `profileCompleted || isUserProfileComplete()` to decide whether to show completion.
  - Does not create duplicate provider records; updates existing provider identity.
- Updated `AuthService.completeGoogleRegistration`:
  - Preserves existing role/status when linking Google to an existing email/password account.
  - Sets `profileCompleted: true` after successful completion.
  - Rejects OAuth completion for staff roles.

**Frontend**
- Replaced `JSON.parse(atob(...))` with UTF-8-safe decoding in `CompleteGoogleProfile.tsx`:
  ```ts
  const utf8Bytes = Uint8Array.from(atob(encoded).split('').map(c => c.charCodeAt(0)));
  const state = JSON.parse(new TextDecoder().decode(utf8Bytes));
  ```
- Updated auth store/context and `OAuthCallback` to wait for `/auth/me` and redirect based on role when `profileCompleted` is true.

### 2.2 Identity normalization
- `RegisterDto`, `LoginDto`, and OAuth DTOs strip U+FEFF/BOM, trim, and lowercase emails.
- `AuthService.validateUser` removes BOM from password input but preserves the password exactly.
- Backend login searches case-insensitively.
- Diagnostic script `scripts/diagnose-and-repair-encoding.js` detects duplicate normalized emails.

### 2.3 Arabic encoding
- Verified all source files are UTF-8; `index.html` already has `<meta charset="UTF-8">`.
- Repaired one recoverable mojibake record: `jawadaqlan@gmail.com` now has `firstNameAr = "ميمون"`, `lastNameAr = "عقلان"`. Original corrupted values backed up on the document in `encodingFixBackup`.
- Reported 43 unrecoverable `?????` placeholder records for manual correction.

### 2.4 University 403 routes
- `CollegeCoordinatorController`:
  - Added `@SkipUniversityStatus()` to `staff/me/access`, `staff/me/profile` GET/PUT so University Managers can read their access even when pending/suspended.
- `CollegeCoordinatorService.getMyAccess`:
  - Returns owner access for University Managers regardless of university status.
  - For coordinators, requires active staff record with `invitationStatus: 'accepted'` and active university.
- `UniversitiesService`:
  - Added `assertInstitutionalPermission` helper.
  - Enforced `dashboard:read`, `structure:read`, `students:read`, `analytics:read` on relevant methods.
- `InstitutionalStaffGuard` still enforces staff record requirements for coordinators; University Managers are not required to have a staff record.

### 2.5 Frontend query gating
- `ProtectedRoute`: status query is now gated to `isUniversity` only.
- `PortalLayout` and `UniversityDashboard` display the localized role label and institution only after `/auth/me` resolves.
- React Query:
  - One canonical key for staff access.
  - One canonical key for university status.
  - `retry: (failureCount, error) => error?.response?.status !== 401 && error?.response?.status !== 403 && failureCount < 2`.
  - Protected cache cleared and active queries cancelled on logout.

### 2.6 University Manager profile
- Existing `GET /api/universities/profile` and `PUT /api/universities/profile` used.
- Frontend `UniversityProfile.tsx` rewritten to handle both University Manager and staff profiles.
- Displays Arabic/English names, phone, email, university info, status, and role label `مسؤول الجامعة`.

### 2.7 Coordinator profile
- Created dedicated `CoordinatorProfile.tsx` component separate from `UniversityProfile.tsx`.
- Route `/university/profile` now renders `CoordinatorProfile` for coordinators/operational staff and `UniversityProfile` for University Managers via `UniversityProfileRouter` in `App.tsx`.
- Uses `GET /api/universities/staff/me/profile` and `PUT /api/universities/staff/me/profile`.
- `CollegeCoordinatorService.getMyProfile` / `updateMyProfile` implemented.
- Coordinator cannot change `universityId`, `collegeId`, role, or permissions from the profile page.
- Displays read-only university/college and role label `منسق كلية`.
- Sidebar label changes to `الملف الشخصي` / `My Profile` for coordinators.

### 2.8 Role display beside user name
- Added canonical role-label mapping in `app/src/constants/permissions.ts` and used it in `PortalLayout`, `UniversityDashboard`, and `UniversityProfile`.
- University Manager: `مسؤول الجامعة — جامعة <nameAr>`.
- Coordinator: `منسق كلية — كلية <nameAr>`.

### 2.9 Notification bell
- Created `NotificationBell.tsx` component integrated into `PortalLayout`.
- Displays a clear bell icon with a prominent red badge showing the unread count (refreshes every 30 seconds).
- Dropdown has **Unread / Read / All** tabs; unread notifications show a green dot.
- Clicking an unread notification opens a detail modal, marks it read via `PATCH /notifications/:id/read`, and moves it to the **Read** tab.
- Includes "Mark all as read" and "View all notifications" actions.
- Fixed `POST /api/notifications` to derive `userId` from the JWT (not the request body) and return a clean response shape by stripping the internal Mongoose `data` field.

### 2.10 Notification schema fix
- Changed `NotificationSchema.userId` from `mongoose.Types.ObjectId` to `mongoose.SchemaTypes.ObjectId` so Mongoose casts string IDs to ObjectId correctly.
- Added `NotificationService.toResponse()` to convert documents to plain objects, preventing the global response interceptor from splitting on the schema's `data` field and exposing internal `$__`/`_doc`.
- Migrated 12 existing notifications that had `userId` stored as a string to ObjectId.

### 2.11 Staff role/permission management
- Created operational staff role documents in MongoDB:
  - `university_viewer`
  - `data_officer`
  - `quality_officer`
  - `academic_development_officer`
- Canonical 18-permission list aligned between frontend `app/src/constants/permissions.ts` and backend `UNIVERSITY_STAFF_PERMISSIONS` in `staff.dto.ts` / `college-coordinator.schema.ts`.
- Assigned missing `roleId`s to 6 users.
- Removed invalid `curriculum:write` permissions from 3 staff records.
- Marked 71 existing completed users with `profileCompleted: true`.

### 2.12 Missing-role repair
- Ran `scripts/repair-missing-roles.js` and found 88 users whose `role` field was missing/null/empty even though `userType` was set.
- Repaired each account by setting `role` from `userType` (or inferring from `collegecoordinators` / `universities` ownership when `userType` was also missing).
- This fixed `jawadaqlan@gmail.com`, which had `userType: 'coordinator'` but `role: undefined`, causing every University endpoint to return 403.

### 2.13 Test-data generators
- Added dev-only **Fill Test Data** button to `CoordinatorProfile.tsx` using `generateCoordinatorProfileTestData()`.
- `UniversityProfile.tsx` already had a **Fill Test Data** button using `generateUniversityProfileTestData()`.
- `NotificationBell.tsx` has a dev-only dice icon to generate a test notification.

---

## 3. Affected Accounts

- `jawadaqlan@gmail.com` — Google-linked coordinator; Arabic names repaired; `role` repaired to `coordinator`; existing `collegecoordinators` staff record is active and permissions are intact.
- 88 users had missing `role` values repaired.
- 71 existing users marked with `profileCompleted: true` so they will not be sent to `CompleteGoogleProfile` again.
- 6 users received missing `roleId`s.
- 3 staff records had `curriculum:write` removed.

---

## 4. Duplicate-Account Result

- No duplicate Google users were created during the fix or runtime tests.
- The backend lookup is by normalized email + provider identity; existing accounts are linked rather than duplicated.

---

## 5. MongoDB Verification

- `users` collection now has `profileCompleted` field.
- `jawadaqlan@gmail.com` verified:
  - `firstNameAr: "ميمون"`, `lastNameAr: "عقلان"`
  - `provider: "google"`, `userType: "coordinator"`, `profileCompleted: true`
- `collegecoordinators` staff records verified:
  - Invalid permissions removed.
  - `roleId` references populated for operational staff roles.
- `roles` collection verified:
  - Operational staff role documents exist.

---

## 6. Files Modified

### Backend
- `madar-backend/src/users/schemas/user.schema.ts`
- `madar-backend/src/auth/auth.service.ts`
- `madar-backend/src/auth/dto/register.dto.ts`
- `madar-backend/src/universities/college-coordinators/college-coordinator.controller.ts`
- `madar-backend/src/universities/college-coordinators/college-coordinator.service.ts`
- `madar-backend/src/universities/college-coordinators/dto/staff.dto.ts`
- `madar-backend/src/universities/college-coordinators/schemas/college-coordinator.schema.ts`
- `madar-backend/src/universities/universities.service.ts`
- `madar-backend/src/universities/institutional-staff.guard.ts`

### Frontend
- `app/src/pages/CompleteGoogleProfile.tsx`
- `app/src/components/ProtectedRoute.tsx`
- `app/src/components/PortalLayout.tsx`
- `app/src/components/NotificationBell.tsx`
- `app/src/pages/university/UniversityDashboard.tsx`
- `app/src/pages/university/UniversityProfile.tsx`
- `app/src/pages/university/CoordinatorProfile.tsx`
- `app/src/App.tsx`
- `app/src/constants/permissions.ts`
- `app/src/store/authStore.ts` (query gating / role display)
- `app/src/utils/testDataGenerator.ts`

### Backend
- `madar-backend/src/common/notifications/notification.controller.ts`
- `madar-backend/src/common/notifications/notification.service.ts`
- `madar-backend/src/common/notifications/schemas/notification.schema.ts`

### Scripts / Tests
- `scripts/diagnose-and-repair-encoding.js`
- `scripts/runtime-recovery-check.js`
- `scripts/fix-jawadaqlan.js`
- `scripts/verify-jawadaqlan.js`
- `scripts/repair-missing-roles.js`
- `scripts/migrate-notification-userids.js`
- `madar-backend/src/universities/universities.service.spec.ts` (test fixture updated for `structure:read`)

### Backups
- `backups/google-profile-role-permissions-recovery-20260715-162458/`

---

## 7. Automated Test Results

| Command | Result |
|---------|--------|
| `cd madar-backend && npx tsc --noEmit` | PASS |
| `cd madar-backend && npm run build` | PASS |
| `cd madar-backend && npm run test -- --runInBand` | PASS (9 suites, 70 tests) |
| `cd madar-backend && npm run test:e2e` | PASS (1 suite, 6 tests) |
| `cd app && npx tsc --noEmit` | PASS |
| `cd app && npm run build` | PASS |

---

## 8. Runtime HTTP Verification

Script: `scripts/runtime-recovery-check.js`

| Flow | Result | Notes |
|------|--------|-------|
| Student registration + login + `/auth/me` | PASS | Arabic name `طالب تجريبي` displayed correctly |
| Company registration + login + `/auth/me` | PASS | Arabic name `شركة تجريبية` displayed correctly |
| Pending University Manager status | PASS | `/universities/me/status` 200, `/universities/dashboard` 403 |
| Active University Manager access | PASS | status 200, access 200, dashboard 200, profile 200 |
| Coordinator invitation + access | PASS | access 200, dashboard 200, profile 200, permissions persisted |

All temporary test accounts were cleaned up after the run.

---

## 9. Browser Runtime Result

- Real Google OAuth browser flow could **not** be exercised automatically because it requires a Google test account and live provider consent.
- Frontend dev server serves all routes including `/university/profile` with HTTP 200.
- No JavaScript build errors; production build succeeded.

---

## 10. Running Services

| Service | Port | PID | URL | Status |
|---------|------|-----|-----|--------|
| Frontend (Vite dev) | 3000 | 83524 (node) / 1412 (npm wrapper) | http://localhost:3000 | Running, bound to 127.0.0.1 |
| Backend API (NestJS watch) | 3001 | 65792 (node) / 1399 (npm wrapper) | http://localhost:3001/api | Running |
| MongoDB | 27017 | 71068 | mongodb://127.0.0.1:27017/madar | Running |
| Memurai (Redis) | 6379 | 70684 | — | Running |
| AI Engine | 8000 | — | http://localhost:8000/api/ai/health | Running (root `/` returns 404) |

---

## 11. Remaining Issues

1. **Real Google OAuth browser verification** is BLOCKED pending a Google test account and configured OAuth consent.
2. **43 `?????` Arabic placeholder records** remain unrecoverable (test/seed data where Arabic was never captured). They were reported, not invented.
3. **Pending/suspended University Managers** legitimately get 403 on `/universities/dashboard`; this is the intended guard behavior. They can still call `/universities/me/status` and `/universities/staff/me/access`.
4. **LinkedIn OAuth** regression was not re-tested because credentials are not confirmed in the running environment.
5. **Interactive browser walkthrough** of the University Staff page and Google OAuth flows is still needed and documented as a follow-up task.

## 12. Post-Report Fix: jawadaqlan@gmail.com

The user reported that `jawadaqlan@gmail.com` still received 403 errors on University endpoints. Investigation showed the account had `userType: 'coordinator'` and an active `collegecoordinators` staff record, but its `role` field was missing.

**Fix applied:**
- Ran `scripts/repair-missing-roles.js` and set `role` to `'coordinator'` based on the existing `userType`.
- Verified the existing `universityId`, `collegeId`, and staff record were intact.

**Verification:**
- `/auth/me` — 200, role `coordinator`, universityId and collegeId populated.
- `/universities/staff/me/access` — 200, permissions returned.
- `/universities/dashboard`, `/universities/structure`, `/universities/students`, `/universities/students/statistics`, `/universities/study-plans`, `/universities/courses`, `/universities/staff/me/profile` — all 200.

## 13. Final Follow-Up Fixes

- Fixed `POST /api/notifications` returning 500 for coordinators because the response interceptor mis-handled the Mongoose document; controller now injects `userId` from JWT and service returns a plain response.
- Fixed `NotificationSchema.userId` type so string IDs are cast to ObjectId; migrated 12 existing string `userId` values.
- Improved `NotificationBell.tsx` with Unread/Read/All tabs, clearer bell badge, and automatic move-to-read behavior.
- Added dev-only test-data fill buttons to `CoordinatorProfile.tsx` and `UniversityProfile.tsx`.
- Repaired 88 users with missing `role` fields.

---

## 15. Latest Follow-Up Fixes (this session)

### 15.1 Backend dev-server startup failure
- **Root cause:** `AuthController` added a `PATCH /api/auth/me` endpoint that depended on `UsersService`, but `AuthModule` did not import `UsersModule`. `UsersModule` already imports `AuthModule`, so adding a circular import was not safe.
- **Fix:** Moved the update logic into `AuthService.updateMe` (which already had the `User` model) and removed the `UsersService` dependency from `AuthController`.
- **Files modified:** `madar-backend/src/auth/auth.controller.ts`, `madar-backend/src/auth/auth.service.ts`.
- **Verification:** `npx tsc --noEmit` ✅, `npm run build` ✅, dev server starts on port 3001.

### 15.2 Coordinator dashboard 403 loops
- **Root cause:** If a stale access token (e.g. from an earlier `student` session) remained in the browser while `/auth/me` returned `coordinator`, the frontend kept sending the old token to University endpoints, producing repeated 403 errors. The axios interceptor only refreshes on 401, not on 403.
- **Fix:** Added a lightweight JWT payload decoder (`app/src/utils/jwt.ts`) and a `useEffect` in `useAuth` that compares the token's `role` with the server's `user.role`. On mismatch it triggers logout immediately, forcing a clean re-login with a token that matches the current role.
- **Files modified:** `app/src/utils/jwt.ts` (new), `app/src/hooks/useAuth.ts`.
- **Verification:**
  - `coordinator@ksu.edu.sa` login → token role `coordinator`.
  - `/universities/staff/me/access` → 200.
  - `/universities/dashboard` → 200 (with `dashboard:read`).
  - `/universities/structure` → 200 (with `structure:read`).
  - `/universities/students` → 200 (with `students:read`).
  - `/universities/staff/me/profile` → 200.

### 15.3 Notification bell improvements
- Made the bell button larger and more prominent (`h-11 w-11`, `Bell size={22}`).
- Added a visible green status dot when there are no unread notifications and a red unread-count badge when there are.
- Added an Arabic/English tooltip showing the unread count.
- Preserved existing behavior: click opens detail modal, mark-read moves the item to the **Read** tab, dev-only dice button generates a test notification.
- **File modified:** `app/src/components/NotificationBell.tsx`.

### 15.4 Test-data helpers
- Verified existing `app/src/utils/testDataGenerator.ts` helpers for University profile, Coordinator profile, colleges, departments, staff, study plans, and courses.
- Verified `DevelopmentAutofillButton` is present on `CoordinatorProfile.tsx` and `UniversityProfile.tsx`.
- Verified the dev-only dice icon in `NotificationBell.tsx` creates a real notification through `POST /api/notifications`.

---

## 16. Updated Running Services

| Service | Port | PID | URL | Status |
|---------|------|-----|-----|--------|
| Frontend (Vite dev) | 3000 | 23940 (node) | http://127.0.0.1:3000 | Running, bound to 127.0.0.1 |
| Backend API (NestJS watch) | 3001 | 20180 (node) | http://localhost:3001/api | Running |
| MongoDB | 27017 | — | mongodb://127.0.0.1:27017/madar | Running |
| Memurai (Redis) | 6379 | — | — | Running |
| AI Engine | 8000 | — | http://localhost:8000/api/ai/health | Running |

---

## 17. Remaining Issues (updated)

1. **Real Google OAuth browser verification** is BLOCKED pending a Google test account and configured OAuth consent.
2. **43 `?????` Arabic placeholder records** remain unrecoverable (test/seed data where Arabic was never captured). They were reported, not invented.
3. **Pending/suspended University Managers** legitimately get 403 on `/universities/dashboard`; this is the intended guard behavior. They can still call `/universities/me/status` and `/universities/staff/me/access`.
4. **LinkedIn OAuth** regression was not re-tested because credentials are not confirmed in the running environment.
5. **Admin dashboard Phase 8–10** improvements (real KPI cards, AI/Email/Backup/Security Alerts pages, Admin Accounts/Roles pages) are partially implemented and still need interactive verification.

---

## 18. Report Path

`docs/google-profile-role-permissions-recovery-result.md`

---

## 19. Latest Follow-Up Fixes (this continuation)

### 19.1 Coordinator profile endpoint returned 404
- **Root cause:** `CollegeCoordinatorController` (which hosts `GET /api/universities/staff/me/profile`, `PUT /api/universities/staff/me/profile`, `GET /api/universities/staff/me/access`, and staff management routes) was implemented but never registered in `UniversitiesModule`. The module only declared `UniversitiesController` and `PublicUniversitiesController`, so all `/api/universities/staff/*` routes returned 404.
- **Fix:** Registered `CollegeCoordinatorController` in the `controllers` array and `CollegeCoordinatorService` in the `providers`/`exports` arrays of `madar-backend/src/universities/universities.module.ts`.
- **Files modified:** `madar-backend/src/universities/universities.module.ts`.
- **Verification:**
  - `npx tsc --noEmit` ✅
  - `npm run build` ✅
  - `npm run test -- --runInBand` ✅ (9 suites, 70 tests)
  - `npm run test:e2e` ✅ (1 suite, 6 tests)

### 19.2 Admin Monitoring page completed
- **Requirement:** Add "Check Now" and "View Details" buttons to the service-health monitoring page.
- **Fix:** Rewrote `app/src/pages/admin/AdminMonitoring.tsx`:
  - Added a "فحص الآن / Check Now" button that calls `refetch()` from `useSystemHealth` and disables itself while `isFetching` is true.
  - Added a "عرض التفاصيل / View Details" button on every service card.
  - Clicking "View Details" opens a modal that displays status, response time, last check time, failure reason, and additional metadata without exposing secrets.
  - Preserved the existing design, RTL layout, and color scheme.
- **File modified:** `app/src/pages/admin/AdminMonitoring.tsx`.
- **Verification:** `cd app && npx tsc --noEmit` ✅, `cd app && npm run build` ✅.

### 19.3 Admin pages verified as real (no placeholder data)
- Reviewed `AdminAiOperations.tsx`, `AdminEmail.tsx`, `AdminBackup.tsx`, `AdminSecurityAlerts.tsx`, `AdminAccounts.tsx`, `AdminRolesPermissions.tsx`, and `AdminUsers.tsx`.
- All pages use real React Query hooks from `useAdmin.ts` and call real endpoints in `adminApi.ts`.
- No page uses `Math.random()` or hard-coded fake numbers for production display.
- Remaining gaps identified and accepted as design refinements, not functional blockers:
  - Some cards show zero/empty states when backend returns no data (expected behavior).
  - Admin dashboard KPIs rely on `/admin/dashboard-metrics`; the endpoint shape is correct and the UI consumes it.

### 19.4 Test-data generators verified
- Verified `app/src/utils/testDataGenerator.ts` helpers for University profile, Coordinator profile, colleges, departments, staff, study plans, and courses.
- Verified `DevelopmentAutofillButton` is present on `CoordinatorProfile.tsx`, `UniversityProfile.tsx`, and `UniversityStaff.tsx` (staff invite/edit form).
- All dev-only autofill buttons are gated by `isDevelopmentTestDataEnabled` and disappear in production builds.

---

## 20. Updated Automated Test Results

| Command | Result |
|---------|--------|
| `cd madar-backend && npx tsc --noEmit` | PASS |
| `cd madar-backend && npm run build` | PASS |
| `cd madar-backend && npm run test -- --runInBand` | PASS (9 suites, 70 tests) |
| `cd madar-backend && npm run test:e2e` | PASS (1 suite, 6 tests) |
| `cd app && npx tsc --noEmit` | PASS |
| `cd app && npm run build` | PASS |

---

## 21. Updated Running Services

| Service | Port | PID | URL | Status |
|---------|------|-----|-----|--------|
| Frontend (Vite dev) | 3000 | 33684 (node) | http://127.0.0.1:3000 | Running, HTTP 200 |
| Backend API (NestJS watch) | 3001 | 31668 (node) | http://localhost:3001/api | Running, `/api/health` 200 |
| MongoDB | 27017 | — | mongodb://127.0.0.1:27017/madar | Running |
| Memurai (Redis) | 6379 | — | — | Running |
| AI Engine | 8000 | — | http://localhost:8000/api/ai/health | Running |

---

## 22. Remaining Issues (updated)

1. **Real Google OAuth browser verification** is BLOCKED pending a Google test account and configured OAuth consent.
2. **43 `?????` Arabic placeholder records** remain unrecoverable (test/seed data where Arabic was never captured). They were reported, not invented.
3. **Pending/suspended University Managers** legitimately get 403 on `/universities/dashboard`; this is the intended guard behavior. They can still call `/universities/me/status` and `/universities/staff/me/access`.
4. **LinkedIn OAuth** regression was not re-tested because credentials are not confirmed in the running environment.
5. **Interactive browser walkthrough** of the Coordinator profile, Admin Monitoring details modal, and University Staff role/permission editing is still needed and documented as a follow-up task.

---

## 23. Admin Module Final Verification (this autonomous run)

### 23.1 Root cause fixed
- **Admin test account permissions were stale.** `admin.full@madar.test` used the `admin_full_test` role with legacy permission keys (`admin:read`, `monitoring:read`, `security:read`, etc.) that did not match the canonical `AdminPermission` registry used by `PermissionsGuard`.
- **Result:** 403 on `/api/admin/admin-accounts`, `/api/admin/security-alerts`, `/api/admin/companies`, `/api/admin/universities`.
- **Fix:**
  - Updated `madar-backend/src/database/seeds/seed-test-accounts.ts` to derive test-role permissions from `ALL_ADMIN_PERMISSIONS`.
  - Created and ran `scripts/fix-admin-role-permissions.js` to migrate existing `admin`, `admin_full_test`, `admin_readonly_test`, and `admin_limited_test` roles in MongoDB to canonical permissions.
  - Restarted the backend dev server to clear the 5-minute `PermissionsGuard` cache.

### 23.2 Test script fixes
- `scripts/admin-api-test.sh`, `scripts/admin-restrictions-test.sh`, and `scripts/regression-test.sh` referenced stale password `TestPass123!`; updated to `DevPass123!`.

### 23.3 Verification results
- All Admin API endpoints return 200 for `admin.full@madar.test`.
- Admin restriction tests return 403 for Super Admin creation and university/company approve/suspend.
- Super Admin confirmation tests return 200 for authorized actions.
- Coordinator endpoints (`/api/universities/staff/me/access`, `/api/universities/staff/me/profile`, dashboard, structure, students, study-plans, courses) all return 200 for `coordinator@ksu.edu.sa`.
- Regression login/refresh/logout passed for student, company, university, coordinator, and super_admin test accounts.

### 23.4 Builds and tests
- `cd madar-backend && npx tsc --noEmit` ✅
- `cd madar-backend && npm run build` ✅
- `cd madar-backend && npm run test -- --runInBand` ✅ (9 suites, 70 tests)
- `cd madar-backend && npm run test:e2e` ✅ (1 suite, 6 tests)
- `cd app && npx tsc --noEmit` ✅
- `cd app && npm run build` ✅

### 23.5 Updated running services
| Service | Port | PID | Status |
|---------|------|-----|--------|
| Frontend (Vite dev) | 3000 | 33684 | Running, HTTP 200 |
| Backend API (NestJS watch) | 3001 | 29152 | Running, `/api/health` 200 |
| MongoDB | 27017 | — | Running |
| Memurai (Redis) | 6379 | — | Running |

### 23.6 Remaining items
- Interactive browser walkthrough for every Admin page and button (requires manual browser session).
- Real Google OAuth and LinkedIn OAuth verification remain blocked by provider credentials/consent.
- AI service on port 8000 is not responding; reported as `down` in health checks (pre-existing, outside Admin scope).
