# Google Registration & Account Login Recovery Result

## Summary

- **Root cause of the 400 Bad Request on `POST /api/auth/google/register`:** the backend DTO enforced a strict phone regex (`^\+?[0-9]{7,15}$`) and returned a generic English validation message. The frontend completion page only collected a phone number and sent it as-typed, so any spaces, dashes, or Arabic-Indic digits caused an opaque 400.
- **Secondary regressions fixed:** existing email/password accounts were blocked from safe Google linking (ConflictException 409 instead of linking); Google registration created empty role-specific profiles; validation errors were not logged or structured; multiple stale backend listeners were running on port 3001; 13 seed accounts had missing `userType`/`status`; 75+ demo/test accounts had stale unknown password hashes.

## Exact 400 Root Cause

| Item | Finding |
|------|---------|
| Endpoint | `POST http://localhost:3001/api/auth/google/register` |
| DTO field that failed | `phone` |
| DTO rule | `@Matches(/^\+?[0-9]{7,15}$/, { message: 'Invalid phone number format' })` |
| Frontend payload | `phone` sent exactly as the user typed it (could contain spaces, dashes, `+`, Arabic numerals) |
| Frontend missing fields | role-specific profile data (`universityId`, `collegeId`, `departmentId`, `academicLevel`, `companyName`, `industry`, `universityName`, etc.) |
| Error response before fix | Generic `400 VALIDATION_ERROR` with English message `"Invalid phone number format"` and no field details |
| Error response after fix | Sanitized structured error with `code`, Arabic message, and `details.{field}` |

## Request Body Contract (Google / OAuth Registration)

```json
{
  "googleId": "<google-sub>",
  "linkedinId": "<linkedin-sub>",
  "email": "<normalized-email>",
  "firstName": "...",
  "lastName": "...",
  "avatar": "<url-or-omit>",
  "phone": "<digits-only, optional + prefix>",
  "role": "student | company | university",
  "profile": { /* role-specific */ }
}
```

Either `googleId` or `linkedinId` is required. `role` is restricted to `student`, `company`, or `university`.

### Required `profile` by role

- **Student:** `universityId`, `collegeId`, `departmentId`, `academicLevel`
- **Company:** `companyName`, `industry`
- **University:** `universityName`

Email and phone are normalized on the backend (trim, remove BOM/U+FEFF, lowercase email, convert Arabic numerals, strip spaces/dashes/parentheses).

## Backend Changes

| File | Change |
|------|--------|
| `src/auth/dto/complete-google-registration.dto.ts` | Removed strict phone regex; added `@Transform` for email/firstName/lastName normalization; restricted role enum to student/company/university; documented profile contract |
| `src/auth/auth.service.ts` | Added `normalizePhone`; rewrote `completeGoogleRegistration` to safely link existing email/password accounts, preserve role/status/institutional links, validate role-specific profiles, create proper Student/Company/University profiles, and populate student affiliations |
| `src/auth/auth.controller.ts` | Added structured debug logging for Google registration requests; builds OAuth redirect URLs with encoded tokens/payload |
| `src/common/filters/http-exception.filter.ts` | Logs sanitized 400 bodies (no secrets); returns `details` object for validation errors |
| `src/main.ts` | Added `ValidationPipe.exceptionFactory` that logs structured field errors and returns `{ code: 'VALIDATION_ERROR', message, details }` |

## Frontend Changes

| File | Change |
|------|--------|
| `src/pages/CompleteGoogleProfile.tsx` | Added role selection (student/company/university); added role-specific forms (university/college/department/academic level for students; company name/industry/location for companies; university name/location/official contact for universities); phone normalization and Arabic-digit conversion; Arabic validation messages; structured error display |
| `src/pages/OAuthCallback.tsx` | Preserves `USER_NOT_FOUND`, `PROFILE_INCOMPLETE`, and `USER_EXISTS` Arabic messages through redirect |
| `src/types/api.types.ts` | Added optional `_id` to `NotificationItem`; updated `UserData.role` union to include all staff roles |
| `src/pages/university/UniversityNotifications.tsx` | Guarded `markRead.mutate` against missing id (build fix) |
| `src/pages/university/UniversityStructure.tsx` | Added missing `getAccessToken` import (build fix) |

## Account Recovery

| Action | Count | Notes |
|--------|-------|-------|
| Backed up auth source files | — | `backups/auth-recovery-20260715-runtime/backend/auth` and frontend auth pages/services |
| Backed up MongoDB auth records | — | `backups/auth-recovery-20260715-runtime/mongodb/auth-snapshot.json` |
| Repaired seed accounts missing `userType`/`status` | 13 | Set to inferred role (`student`/`company`/`university`) and `status: active` |
| Reset demo/test account passwords | 75 | Aligned with `PROJECT_HANDOFF.md`: `DevPass123!` |
| Restored disabled test-account statuses | 2 | `admin.disabled@madar.test` → `banned`; `disabled.staff.test@madar.test` → `suspended` |
| Duplicate normalized emails | 0 | No automatic merge required |
| Existing Google-linked users | 5 | Preserved; callback path still authenticates them |

## Runtime Verification

### Google registration simulation (API only — not real provider consent)

| Scenario | Request | Status | Result |
|----------|---------|--------|--------|
| New student with spaced phone | `POST /api/auth/google/register` with `phone: "+966 50 000 0001"` | 200 | Phone normalized to `+966500000001`, student profile + affiliation created |
| New company | `POST /api/auth/google/register` company profile | 200 | Company profile created |
| New university | `POST /api/auth/google/register` university profile | 200 | University profile created, status `pending` |
| Existing email/password + same Google email | `POST /api/auth/google/register` for `admin@madar.sa` | 200 | Role/status preserved, `googleId` linked safely (reverted after test) |
| Missing profile data | student request without `universityId` | 400 | `OAUTH_PROFILE_INCOMPLETE` with Arabic message |
| Invalid academic selection | wrong `collegeId` for university | 400 | `COLLEGE_NOT_AVAILABLE` |
| Disallowed role | `role: "coordinator"` | 400 | `OAUTH_ROLE_NOT_ALLOWED` |
| Missing provider id | no `googleId`/`linkedinId` | 400 | `OAUTH_PROVIDER_ID_REQUIRED` |

### Existing Google-linked account local verification

Verified with a local NestJS test harness against the real MongoDB database:

| Check | Result |
|-------|--------|
| Existing user found by `googleId` | ✅ |
| `isUserProfileComplete` returns true for complete student profile | ✅ |
| Role preserved (`student`) | ✅ |
| Institutional links preserved | ✅ |
| `CompleteGoogleProfile` skipped (`AUTH_SUCCESS` returned) | ✅ |
| Tokens generated | ✅ |

**Status:** LOCAL PASS — provider consent/callback not exercised.

### Email/password login verification matrix

Password source for all listed development/demo accounts: `TEST_ACCOUNT_DEFAULT_PASSWORD` = `DevPass123!`.

| Account | Role | Status | Login | `/auth/me` | Permissions | Redirect | Result |
|---------|------|--------|-------|------------|-------------|----------|--------|
| `admin@madar.sa` | admin | active | 200 | 200 | admin role | `/admin/dashboard` | PASS |
| `superadmin@madar.sa` | super_admin | active | 200 | 200 | super_admin | `/admin/dashboard` | PASS |
| `admin.full@madar.test` | admin | active | 200 | 200 | 21 perms, `admin:write=true` | `/admin/dashboard` | PASS |
| `admin.readonly@madar.test` | admin | active | 200 | 200 | 11 perms, `admin:write=false` | `/admin/dashboard` | PASS |
| `admin.limited@madar.test` | admin | active | 200 | 200 | 20 perms, `admin:write=false` | `/admin/dashboard` | PASS |
| `admin.disabled@madar.test` | admin | banned | 401 `USER_INACTIVE` | — | — | — | EXPECTED_BLOCK |
| `superadmin.test@madar.test` | super_admin | active | 200 | 200 | super_admin | `/admin/dashboard` | PASS |
| `disabled.staff.test@madar.test` | university_viewer | suspended | 401 `USER_SUSPENDED` | — | — | — | EXPECTED_BLOCK |
| `ahmed@student.ksu.edu.sa` | student | active | 200 | 200 | student | `/student/dashboard` | PASS |
| `hr@aramco.com` | company | active | 200 | 200 | company | `/company/dashboard` | PASS |
| `cs@ksu.edu.sa` | university | active | 200 | 200 | university | `/university/pending-approval` | PASS |
| `coordinator@ksu.edu.sa` | coordinator | active | 200 | 200 | coordinator | `/university/dashboard` | PASS |

## Role Support Verification

All roles used by listed accounts are supported by the backend `UserRole` enum, JWT payload, `RolesGuard`, `PermissionsGuard`, frontend `UserData.role` union, `useAuth` hook, `getDashboardPath`, `App.tsx` routing, and `PortalLayout` sidebar.

| Role | Backend enum | JWT | Guards | Frontend route | Sidebar | Dashboard redirect |
|------|--------------|-----|--------|----------------|---------|-------------------|
| `student` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `company` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `university` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `coordinator` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `university_viewer` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `data_officer` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `quality_officer` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `academic_development_officer` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `super_admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

`disabled.staff.test@madar.test` remains `university_viewer` + `suspended`. No migration was performed because `university_viewer` is a fully supported system role.

## Test Credentials

Single source: `TEST_ACCOUNT_DEFAULT_PASSWORD=DevPass123!`

The seed script `madar-backend/src/database/seeds/seed-test-accounts.ts` uses this variable for every named test account and is idempotent (creates missing records only; updates test accounts only when the password hash does not match or the `userType` differs). It refuses to run in production and refuses to modify accounts that do not end with `@madar.test`.

## Configuration Status

| Variable | Status |
|----------|--------|
| `GOOGLE_CLIENT_ID` | configured |
| `GOOGLE_CLIENT_SECRET` | configured |
| `GOOGLE_CALLBACK_URL` | configured (`http://localhost:3001/api/auth/google/callback`) |
| `FRONTEND_URL` | configured (`http://localhost:3000`) |
| `LINKEDIN_CLIENT_ID` | missing |
| `LINKEDIN_CLIENT_SECRET` | missing |
| `LINKEDIN_CALLBACK_URL` | configured (`http://localhost:3001/api/auth/linkedin/callback`) |

## OAuth Provider Status

| Provider | Status | Reason |
|----------|--------|--------|
| Google | BLOCKED (real provider) / LOCAL PASS (account-linking logic) | Credentials are present in `.env`, but real browser consent/callback could not be exercised because no Google test-account credentials were available. Local service logic verified with real MongoDB. |
| LinkedIn | BLOCKED | `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` are missing. |

## Arabic Text Encoding Verification

| Check | Result |
|-------|--------|
| Source files / API responses | UTF-8 |
| Sample Arabic user names | ✅ Readable (e.g. `admin@madar.sa` → `مدير النظام`) |
| Sample Arabic university names | ✅ Readable (e.g. `King Saud University` → `جامعة الملك سعود`) |
| Mojibake (`Ø`, `Ù`, etc.) | 0 records |
| Unrecoverable `?????` Arabic fields | 20 user records + 1 university record contain `?????` in Arabic fields. These are development/test records where Arabic text was never captured; values were not invented. |

## Service Status

| Service | Port | Listener PID | URL | Status |
|---------|------|--------------|-----|--------|
| Frontend (Vite dev) | 3000 | 12596 | http://localhost:3000 | Running (accessible via localhost:3000) |
| Backend API (NestJS watch) | 3001 | 29872 | http://localhost:3001/api | Running |
| MongoDB | 27017 | 71068 | mongodb://localhost:27017/madar | Running |
| Memurai (Redis) | 6379 | 70684 | — | Running |
| AI Engine | 8000 | 82652 | http://localhost:8000/api/ai/health | Running, health endpoint returns 200 |

## Automated Test Results

| Command | Result |
|---------|--------|
| `cd madar-backend && npx tsc --noEmit` | ✅ Passed |
| `cd madar-backend && npm run build` | ✅ Passed |
| `cd madar-backend && npm run test -- --runInBand` | ✅ 9 suites, 70 tests passed |
| `cd madar-backend && npm run test:e2e` | ✅ 1 suite, 6 tests passed |
| `cd app && npx tsc --noEmit` | ✅ Passed |
| `cd app && npm run build` | ✅ Passed |

## Files Modified

- `madar-backend/src/auth/dto/complete-google-registration.dto.ts`
- `madar-backend/src/auth/auth.service.ts`
- `madar-backend/src/auth/auth.controller.ts`
- `madar-backend/src/common/filters/http-exception.filter.ts`
- `madar-backend/src/main.ts`
- `app/src/pages/CompleteGoogleProfile.tsx`
- `app/src/pages/OAuthCallback.tsx`
- `app/src/types/api.types.ts`
- `app/src/pages/university/UniversityNotifications.tsx`
- `app/src/pages/university/UniversityStructure.tsx`

## Backup Location

`backups/auth-recovery-20260715-runtime/`

## Remaining Issues / Cannot Claim PASS

1. **Real Google OAuth consent/callback** could not be exercised. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are present, but no Google test-account credentials were available. The API path, DTO, frontend completion page, and local account-linking logic are verified; end-to-end browser flow with Google provider consent remains **BLOCKED**.
2. **LinkedIn OAuth** is **BLOCKED** because `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET` are missing.
3. **20 test/demo user records and 1 test university record** contain `?????` in Arabic fields. These are unrecoverable because the original Arabic values were never captured; they were not invented.
4. Real-user accounts (e.g. any non-test email domains outside the development set) were left untouched.
