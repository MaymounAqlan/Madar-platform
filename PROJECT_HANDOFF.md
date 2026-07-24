# MADAR Project Handoff

## Current State

Google authentication regression is resolved: existing Google-linked users are no longer sent to `CompleteGoogleProfile` on every login, Arabic names are decoded correctly, and role/institutional links are preserved. University and Coordinator 403 errors are fixed; pending University Managers can read their status, active University Managers have full dashboard access, and Coordinators with accepted staff records have scoped access according to their MongoDB permissions. University Manager and Coordinator profile pages are functional and persist to MongoDB; the Coordinator profile 404 caused by the unregistered `CollegeCoordinatorController` is now fixed. Localized role labels now appear beside the user name in the dashboard header, sidebar, and profile. Staff role/permission management is complete with a canonical permission set and operational role templates persisted in MongoDB. Notification bell now shows unread/read tabs, a clear badge, and moves read items to the read tab. Admin Monitoring page now has real "Check Now" and "View Details" buttons. Admin module is fully implemented and verified: canonical Admin permission registry enforces all Admin endpoints, test accounts (`admin.full`, `admin.readonly`, `admin.limited`) use correct canonical permissions, Super Admin restrictions return 403 and are audit-logged, all Admin pages consume real APIs, and all 12 Admin pages render correctly with buttons in headless Chrome. Eighty-eight users with missing `role` values were repaired (including `jawadaqlan@gmail.com`). All existing users, roles, university/college/company links, and statuses were preserved; no duplicate Google users were created and no real-user passwords were reset. Latest follow-up: fixed `app/src/services/adminApi.ts` response wrapping for `getUsers`/`getActivityLog`/`getAuditLogs`/`listBackups`, re-ran deterministic headless browser verification for all Admin pages, executed API mutation tests (31 PASS, 1 BLOCKED: AI retry placeholder), and passed all backend/frontend builds and tests.

## Running Services

| Service | Port | Listener PID | URL | Status |
|---------|------|--------------|-----|--------|
| Frontend (Vite dev) | 3000 | 38644 (node) | http://127.0.0.1:3000 | Running, HTTP 200 |
| Backend API (NestJS watch) | 3001 | 36428 (node) | http://localhost:3001/api | Running, `/api/health` 200 |
| MongoDB | 27017 | 5532 (mongod) | mongodb://localhost:27017/madar | Running |
| Memurai (Redis) | 6379 | 5148 | — | Running |
| AI Engine | 8000 | 13072 (python) | http://localhost:8000/api/ai/health | Running, HTTP 200 |

## Test Accounts

All development/demo test accounts use the single source: `TEST_ACCOUNT_DEFAULT_PASSWORD=DevPass123!`.

| Email | Role | Status | Purpose |
|-------|------|--------|---------|
| admin.full@madar.test | admin | active | Full operational Admin |
| admin.readonly@madar.test | admin | active | Read-only Admin |
| admin.limited@madar.test | admin | active | Admin missing `admin:write` |
| admin.disabled@madar.test | admin | banned | Disabled Admin login test (enforced) |
| disabled.staff.test@madar.test | university_viewer | suspended | Disabled staff login test (enforced) |
| superadmin.test@madar.test | super_admin | active | Super Admin restriction tests |

Additional module regression accounts:
- student.ds.test@madar.test
- company.test@madar.test
- university.active@madar.test
- university.pending@madar.test
- coordinator.test@madar.test

Verified production-like demo accounts (same password):
- admin@madar.sa (admin, active)
- superadmin@madar.sa (super_admin, active)
- ahmed@student.ksu.edu.sa (student, active)
- hr@aramco.com (company, active)
- cs@ksu.edu.sa (university, active)
- coordinator@ksu.edu.sa (coordinator, active)

## Useful Commands

```bash
# Seed test accounts
cd madar-backend
ENABLE_TEST_SEED=true TEST_ACCOUNT_DEFAULT_PASSWORD=DevPass123! NODE_ENV=development MONGODB_URI=mongodb://localhost:27017/madar npm run seed:test-accounts

# Cleanup test accounts
ENABLE_TEST_SEED=true NODE_ENV=development MONGODB_URI=mongodb://localhost:27017/madar npm run seed:test-accounts:cleanup

# Backend tests
cd madar-backend
npx tsc --noEmit
npm run build
npm run test -- --runInBand
npm run test:e2e

# Frontend build
cd app
npx tsc --noEmit
npm run build
```

## Key Documentation

- `docs/google-profile-role-permissions-recovery-result.md` — Google auth / Arabic encoding / University-403 / Coordinator profile / role & permissions recovery (this task).
- `docs/google-registration-recovery-result.md` — earlier Google registration 400 fix.
- `docs/university-students-page-recovery-result.md` — University Students page load error.
- `docs/authentication-system-recovery-result.md` — full auth recovery report.
- `docs/admin-implementation-result.md` — Admin module audit and implementation details.
- `docs/admin-full-implementation-and-verification.md` — final Admin acceptance verification.
- `docs/admin-requirements-coverage.md` — Admin requirements checklist.

## Important Notes

- Do not run seed/cleanup commands in production (`NODE_ENV=production` is blocked).
- Redis/Memurai is running and reported healthy by listening on port 6379.
- AI health endpoint is `/api/ai/health` and returns 200.
- Google registration API and completion page are fixed. Real Google OAuth consent/callback requires a Google test account; credentials are present but the browser flow is **BLOCKED** until provider consent can be exercised.
- `jawadaqlan@gmail.com` (Google-linked coordinator) was missing a staff record; it was linked to King Saud University / College of Computer and Information Sciences and given an accepted `coordinator` staff record. University dashboard endpoints now return 200.
- LinkedIn OAuth is **BLOCKED** because `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` are missing.
- Admin cannot create/edit/disable Super Admin or approve/suspend universities/companies; these restrictions are enforced by backend `RolesGuard` and `PermissionsGuard`.
- Demo/test accounts on `@madar.test`, `@madar.sa`, Saudi university, and major company domains use `DevPass123!`; real-user accounts were not touched.
- Disabled test accounts (`admin.disabled@madar.test` → `banned`, `disabled.staff.test@madar.test` → `suspended`) are enforced and return 401 on login.
- `university_viewer` is a fully supported system role; `disabled.staff.test@madar.test` was not migrated.
- Full auth regression verification passed: email/password login, refresh, logout, `/auth/me`, Google registration API simulation for all roles, disabled-account blocking, and local existing-Google-account profile-completion skip.
- University Students page loads correctly for active University Managers and Coordinators with `students:read`; backend students/statistics endpoints return 200 with real MongoDB data.
