# University E2E Test Results

## Commands

| Command | Result |
|---|---|
| app: npx tsc --noEmit | Passed |
| app: npm run build | Passed |
| madar-backend: npx tsc --noEmit | Passed |
| madar-backend: npm run build | Passed |
| madar-backend: npm run test -- --runInBand | Passed, 8 suites and 52 tests |
| madar-ai: python -m compileall -q | Passed |
| madar-ai: python -m pytest | Not run: pytest is not installed |

## Runtime

- Frontend http://localhost:3000: HTTP 200.
- Backend http://localhost:3001: running.
- Health http://localhost:3001/api/health: HTTP 200, MongoDB connected.
- MongoDB localhost:27017: listening.
- AI service was not required by the structured curriculum comparison and is not running.

Final listening processes: Frontend PID 12932 on port 3000, Backend PID 5788 on port 3001, and MongoDB PID 5532 on port 27017.

Active login, pending protection, approval with old token, coordinator scope, viewer write denial, disabled login denial, academic-development access, five affiliation states, curriculum reads, and CSV/XLSX/PDF signatures passed.

Additional runtime checks: duplicate student number rejected with 409, coordinator cross-college access rejected with 404, institutional profile update persisted, department archive and restore returned archived then active, and audit output included UPDATE_PROFILE, ARCHIVE_DEPARTMENT, RESTORE_DEPARTMENT, GENERATE_REPORT, and DOWNLOAD_REPORT.

Visual browser automation was unavailable in this session, so no visual PASS is claimed.
