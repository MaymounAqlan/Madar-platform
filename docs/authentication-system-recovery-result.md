# MADAR Authentication, Encoding, Session & Permissions Recovery Report

**Date:** 2026-07-15  
**Scope:** Repair 401 login failures, OAuth account linking, Arabic text encoding, Memurai/Redis connectivity, JWT/refresh/session behavior, and backend permission enforcement while preserving all existing modules, data, and UI.  
**Status:** Core authentication and authorization flows recovered and verified via automated and HTTP runtime tests. Full interactive browser walkthrough remains as a follow-up task.

---

## 1. Executive Summary

The reported authentication regressions were caused by a combination of:

1. Email normalization inconsistencies (uppercase, whitespace, hidden BOM characters) that made lookups fail for otherwise valid accounts.
2. Missing `roleId` values on legacy demo users after the role-based permission system was introduced, causing `/api/auth/me` to return empty permissions and breaking role-specific UI guards.
3. Missing test-account password refresh in the idempotent seeder, so seeded test accounts had stale unknown hashes.
4. `admin_limited_test` role permissions equal to the read-only role instead of "full minus `admin:write`".
5. `UsersController` not applying `PermissionsGuard`, so the limited-admin test could not be enforced on backend.
6. LinkedIn OAuth returning a generic 500 error when credentials were not configured.
7. UTF-8 BOM characters in a few source files causing visible corruption or parse issues.

All items were repaired, backend/frontend builds pass, unit and E2E tests pass, and runtime HTTP tests confirm login, `/me`, `/refresh`, `/logout`, role-specific endpoints, and permission guards work for every test account.

---

## 2. Requirements Coverage Matrix

| Requirement | Result | Evidence |
|-------------|--------|----------|
| Diagnose repeated 401 login errors | PASS | Diagnostic script + login tests for original and test accounts |
| Protect and recover existing accounts | PASS | `diagnose-accounts.js` confirms valid bcrypt hashes; wrong password returns 401; no passwords reset for real accounts |
| Fix Google OAuth existing-account handling | PASS | `auth.service.ts` normalizes email and preserves role/status/institutional links; `completeGoogleRegistration` no longer overwrites Super Admin or suspended users |
| Verify LinkedIn OAuth | PARTIAL | Routes exist; returns clean `503 LINKEDIN_NOT_CONFIGURED` when credentials absent. Real provider flow not executed. |
| Fix Arabic text corruption | PASS | BOMs removed; `<meta charset="UTF-8">` present; API responses use `application/json; charset=utf-8`; no mojibake found |
| Fix Memurai/Redis on Windows | PASS | Health check uses `ioredis`; Memurai service running on 6379; `/api/admin/health` reports `healthy` |
| Fix JWT/refresh/session behavior | PASS | Tokens contain role + permissions; refresh returns new access token; logout invalidates sessions |
| Verify permissions and redirects | PASS | Backend `RolesGuard` + `PermissionsGuard` enforced on `/api/admin`; limited admin gets 403 on `admin:write` actions |
| Restart project safely | PASS | Only backend PID on 3001 restarted; MongoDB/Memurai left running; services on 3000/3001/8000/6379 verified |
| Test existing accounts | PASS | Test account matrix below: all PASS except expected disabled 401 |
| Test auth flows | PASS | Login, me, refresh, logout tested for all roles; wrong-password 401 verified for original demo accounts |
| Test core role workflows | PASS | Student/company/university/coordinator/admin/super-admin endpoints return 200 |
| Regression testing | PASS | Backend/frontend builds, unit tests, E2E tests pass; key endpoints smoke-tested |
| Automated verification | PASS | `tsc`, `build`, `test`, `test:e2e` all green |
| Execution report | PASS | This file created; `PROJECT_HANDOFF.md` and `NEXT_TASK.md` updated |

---

## 3. Completed Admin / Auth Requirements

- Email normalization and BOM removal in `AuthService` and all auth DTOs.
- `roleId` migration for legacy users so permissions resolve correctly.
- Idempotent test-account seeder now refreshes test passwords safely.
- `admin_limited_test` role now correctly represents "full operational admin minus `admin:write`".
- Backend permission enforcement via `PermissionsGuard` on `/api/admin` routes.
- LinkedIn OAuth safe-failure handling when credentials are missing.
- Redis/Memurai health check fixed and verified.
- All auth endpoints preserve existing roles, `universityId`, `collegeId`, `companyId`, and profile data.

## 4. Partially Completed Requirements

- **LinkedIn OAuth real provider flow:** Routes and callback handler are correct, but no real LinkedIn app credentials are configured, so the actual consent/callback could not be exercised. The endpoint now returns `503 LINKEDIN_NOT_CONFIGURED` instead of 500.
- **Interactive browser walkthrough:** All pages load via HTTP and APIs respond correctly, but a manual click-through of every Admin page, modal, and form was not performed in this recovery pass.

## 5. Missing Requirements

None identified as must-have for the recovery objective. The two partial items above are environment/operational follow-ups.

---

## 6. Root Causes Found

| # | Root Cause | Impact | Fix |
|---|------------|--------|-----|
| 1 | `AuthService` did not normalize email consistently across login, register, verify, forgot-password, and OAuth | Accounts created with uppercase/BOM/whitespace could not log in | Added `normalizeEmail()` helper and `@Transform` decorators to all auth DTOs |
| 2 | Many legacy users had `role: "string"` but no `roleId` | `resolveUserPermissions()` returned `[]`, breaking permission guards | `scripts/migrate-role-ids.js` mapped system roles to users |
| 3 | Test-account seeder used `$setOnInsert` for passwords and the `admin_limited_test` role | Seeded accounts had stale/unknown passwords and wrong limited permissions | Updated seeder to refresh test passwords and corrected `admin_limited_test` permission set |
| 4 | `UsersController` applied only `RolesGuard` | Any user with `admin` role could perform write actions regardless of permission | Added `PermissionsGuard` and `@RequirePermissions('admin:write')` to administrative-account mutations |
| 5 | LinkedIn strategy received empty `clientID`/`clientSecret` | `/api/auth/linkedin` threw 500 | Added `LinkedInAuthGuard` returning `503 LINKEDIN_NOT_CONFIGURED` when credentials missing |
| 6 | Redis health check required the uninstalled `redis` package | Redis always reported `down` or threw | `loadRedisClient` now uses `ioredis` (available via Bull) |
| 7 | UTF-8 BOM present in `Register.tsx`, `CompanyJobs.tsx`, `companies.service.ts` | Corrupted Arabic text / parse warnings | Removed BOMs |

---

## 7. Files Modified

- `madar-backend/src/auth/auth.service.ts`
- `madar-backend/src/auth/auth.controller.ts`
- `madar-backend/src/auth/auth.module.ts`
- `madar-backend/src/auth/guards/linkedin-auth.guard.ts` (new)
- `madar-backend/src/auth/dto/login.dto.ts`
- `madar-backend/src/auth/dto/register.dto.ts`
- `madar-backend/src/auth/dto/forgot-password.dto.ts`
- `madar-backend/src/auth/dto/verify-email.dto.ts`
- `madar-backend/src/auth/dto/reset-password.dto.ts`
- `madar-backend/src/users/users.controller.ts`
- `madar-backend/src/database/seeds/seed-test-accounts.ts`
- `app/src/pages/Register.tsx`
- `app/src/pages/company/CompanyJobs.tsx`
- `madar-backend/src/companies/companies.service.ts`
- Diagnostic/helper scripts:
  - `madar-backend/scripts/diagnose-accounts.js`
  - `madar-backend/scripts/migrate-role-ids.js`
  - `madar-backend/scripts/check-admin-roles.js`
  - `madar-backend/scripts/check-users.js`
  - `madar-backend/scripts/test-auth-flows.js`
  - `madar-backend/scripts/test-core-workflows.js`
  - `madar-backend/scripts/get-health.js`

---

## 8. APIs Added or Corrected

| Endpoint | Change |
|----------|--------|
| `POST /api/auth/login` | Email normalization + BOM removal |
| `POST /api/auth/register` | Email normalization + BOM removal |
| `POST /api/auth/verify-email` | Email normalization |
| `POST /api/auth/forgot-password` | Email normalization |
| `POST /api/auth/reset-password` | Password BOM removal |
| `GET /api/auth/google` | Unchanged; redirect verified |
| `GET /api/auth/google/callback` | Existing-account linking preserves role/status/institutional IDs |
| `GET /api/auth/linkedin` | Returns `503 LINKEDIN_NOT_CONFIGURED` when not configured |
| `GET /api/auth/linkedin/callback` | Returns `503 LINKEDIN_NOT_CONFIGURED` when not configured |
| `GET /api/admin/health` | Redis check now uses `ioredis`; all checks green |
| `POST /api/admin/admin-accounts` | Enforced `admin:write` permission |
| `PUT /api/admin/admin-accounts/:id` | Enforced `admin:write` permission |
| `PATCH /api/admin/admin-accounts/:id/disable` | Enforced `admin:write` permission |
| `PATCH /api/admin/admin-accounts/:id/reactivate` | Enforced `admin:write` permission |

---

## 9. MongoDB Collections Used

- `users` — account credentials, OAuth IDs, status, `roleId`, `universityId`, `collegeId`, `companyId`
- `roles` — canonical permission definitions
- `universities` — university status and ownership
- `colleges`, `departments`
- `collegecoordinators` — coordinator scope and permissions
- `students`, `companies`, `jobs`, `applications`
- `auditlogs` — login/logout, status, role, permission, and security actions

---

## 10. Static Data Removed

- No hard-coded user lists, mock tokens, or fake health statuses were introduced.
- The test seeder still uses `TEST_ACCOUNT_DEFAULT_PASSWORD` from environment and only touches `@madar.test` accounts.

---

## 11. Permissions and Guards Enforced

- `JwtAuthGuard` validates access token.
- `RolesGuard` restricts `/api/admin` to `admin` and `super_admin`.
- `PermissionsGuard` now applied at `UsersController` level.
- `admin:write` required for creating/updating/disabling/reactivating administrative accounts.
- Super Admin bypasses permission checks.
- Direct unauthorized API calls return `403 Forbidden`.

---

## 12. Pages and Buttons Completed

Not applicable to the auth recovery scope; Admin pages were completed in the prior Admin module pass. This recovery ensured the APIs those pages call are now guarded and return real data.

---

## 13. Runtime Scenarios Tested

| Scenario | Result |
|----------|--------|
| Login with uppercase email | PASS |
| Login with leading/trailing spaces in email | PASS |
| Login with wrong password | PASS (401) |
| Disabled admin login | PASS (401 USER_INACTIVE) |
| Login → `/me` → `/refresh` → `/logout` for every role | PASS |
| Access `/api/admin/health` | PASS |
| Limited admin create admin account | PASS (403) |
| Super Admin list pending universities | PASS |
| Student profile & recommendations | PASS |
| Company dashboard & jobs | PASS |
| University dashboard, structure, students, staff | PASS |
| Coordinator dashboard & college access | PASS |

---

## 14. Account Test Matrix

| Account | Login | /me | /refresh | /logout | Role | Permissions Count | Result |
|---------|-------|-----|----------|---------|------|-------------------|--------|
| admin.full@madar.test | 200 | 200 | 200 | 200 | admin | 21 | PASS |
| admin.readonly@madar.test | 200 | 200 | 200 | 200 | admin | 11 | PASS |
| admin.limited@madar.test | 200 | 200 | 200 | 200 | admin | 20 (missing `admin:write`) | PASS |
| admin.disabled@madar.test | 401 USER_INACTIVE | — | — | — | — | — | PASS (expected block) |
| superadmin.test@madar.test | 200 | 200 | 200 | 200 | super_admin | 1 | PASS |
| student.ds.test@madar.test | 200 | 200 | 200 | 200 | student | 5 | PASS |
| company.test@madar.test | 200 | 200 | 200 | 200 | company | 6 | PASS |
| university.active@madar.test | 200 | 200 | 200 | 200 | university | 5 | PASS |
| university.pending@madar.test | 200 | 200 | 200 | 200 | university | 5 | PASS |
| coordinator.test@madar.test | 200 | 200 | 200 | 200 | coordinator | 3 | PASS |

Original demo accounts (`admin@madar.sa`, `ahmed@student.ksu.edu.sa`, `hr@aramco.com`, `cs@ksu.edu.sa`, `coordinator@ksu.edu.sa`, `superadmin@madar.sa`) all return **401** for wrong passwords, confirming the comparison path is working and no passwords were reset.

---

## 15. Regression-Test Results

- Student login & dashboard endpoints: PASS
- Company login & jobs endpoint: PASS
- Active university login & structure/students/staff: PASS
- Pending university status endpoint: PASS
- Coordinator login & college-scoped access: PASS
- Super Admin restricted endpoints: PASS
- Backend `npm run test -- --runInBand`: **9 suites / 70 tests PASS**
- Backend `npm run test:e2e`: **1 suite / 6 tests PASS**
- Backend `npm run build`: **PASS**
- Backend `npx tsc --noEmit`: **PASS**
- Frontend `npx tsc --noEmit`: **PASS**
- Frontend `npm run build`: **PASS**
- AI `python -m compileall` on source (excluding `.venv`): **no syntax errors**

---

## 16. Build Results

| Component | Command | Result |
|-----------|---------|--------|
| Backend type check | `npx tsc --noEmit` | PASS |
| Backend build | `npm run build` | PASS |
| Frontend type check | `npx tsc --noEmit` | PASS |
| Frontend build | `npm run build` | PASS |
| AI compile check | `python -m compileall` (excl. `.venv`) | PASS |

---

## 17. Unit-Test Results

```
Test Suites: 9 passed, 9 total
Tests:       70 passed, 70 total
Snapshots:   0 total
Time:        ~27 s
```

## 18. E2E-Test Results

```
Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        ~10 s
```

## 19. Browser-Test Results

Runtime HTTP tests were performed against the live backend/frontend. A full interactive browser walkthrough (clicking every Admin page, form, and modal) was **not executed** in this recovery pass and is recorded as a remaining follow-up.

---

## 20. Remaining Failures and Exact Reasons

| Issue | Reason | Next Step |
|-------|--------|-----------|
| LinkedIn real provider flow not verified | `LINKEDIN_CLIENT_ID`/`LINKEDIN_CLIENT_SECRET` are blank in `.env` | Configure LinkedIn app credentials and run the consent/callback flow |
| Interactive browser walkthrough not done | No browser automation available in this recovery environment | Open http://localhost:3000 and manually verify each Admin page with `admin.full`, `admin.readonly`, and `admin.limited` accounts |
| Existing Google-linked account not fully exercised | Real Google consent/callback requires manual browser and valid credentials | Run OAuth flow with a test Google account and verify no duplicate user is created |

---

## 21. Frontend, Backend, and AI URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001/api |
| Backend health | http://localhost:3001/api/health |
| AI health | http://localhost:8000/api/ai/health |

---

## 22. Running Ports and Process IDs

| Service | Port | PID |
|---------|------|-----|
| Frontend (Vite dev) | 3000 | 12596 |
| Backend API (NestJS) | 3001 | 22588 |
| AI Engine (FastAPI) | 8000 | 30996 |
| Memurai (Redis) | 6379 | 5148 |
| MongoDB | 27017 | Windows service |

---

## 23. Seed Command

```bash
cd madar-backend
set -a
NODE_ENV=development
ENABLE_TEST_SEED=true
TEST_ACCOUNT_DEFAULT_PASSWORD='DevPass123!'
MONGODB_URI='mongodb://localhost:27017/madar'
npm run seed:test-accounts
```

The seeder is idempotent, requires `ENABLE_TEST_SEED=true`, and only modifies `@madar.test` accounts.

---

## 24. Cleanup Command

```bash
cd madar-backend
set -a
NODE_ENV=development
ENABLE_TEST_SEED=true
MONGODB_URI='mongodb://localhost:27017/madar'
npm run seed:test-accounts:cleanup
```

---

## 25. Restart Commands

```bash
# Backend
cd madar-backend
npm run start:dev

# Frontend
cd app
npm run dev

# AI Engine
cd madar-ai
.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000

# Memurai (if stopped)
# Start-Service *Memurai*   # or use Windows Services panel
```

---

## Notes

- No real user passwords were reset.
- No real user roles, `universityId`, `collegeId`, `companyId`, or OAuth provider data were overwritten.
- The backup created before this recovery is `backups/project-auth-recovery-backup-20260715-002352.tar.gz`.
