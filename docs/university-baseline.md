# University Baseline

## Repository State
- Root path: `C:\Users\a\Downloads\Kimi_Agent_طلب التنفيذ (6)`.
- Git status: not a Git repository. `git status`, `git branch --show-current`, and `git log -1 --oneline` all failed with `fatal: not a git repository`.
- No branch was created.
- Because there is no Git metadata, pre-existing modified/untracked files cannot be distinguished through Git.

## Project Commands
| Project | Package manager | Install command | Dev command | Build command | Lint command | Typecheck command | Test command | E2E command |
|---|---|---|---|---|---|---|---|---|
| Frontend `app` | npm | `npm ci` | `npm run dev` | `npm run build` | `npm run lint` | no script; `npx tsc --noEmit` used | no script | none |
| Backend `madar-backend` | npm | `npm ci` | `npm run start:dev` | `npm run build` | `npm run lint` exists but uses `--fix`; skipped | no script; `npx tsc --noEmit` used | `npm run test` | `npm run test:e2e` |
| AI `madar-ai` | pip/venv | not run in this phase | `uvicorn main:app --host 0.0.0.0 --port 8000 --reload` | none | none | `python -m compileall` | `python -m pytest` | none |

Lockfiles found:
- `app/package-lock.json`
- `madar-backend/package-lock.json`
- `madar-ai/requirements.txt`

No root `package.json`, root lockfile, `pnpm-workspace.yaml`, `yarn.lock`, or `turbo.json` was found.

## Runtime Versions
- Node: `v22.23.1`
- npm: `10.9.8`
- pnpm installed on machine: `10.20.0`, but not used by this project baseline.
- Python: `3.11.9`
- pip: `24.0`
- OS: `Microsoft Windows NT 10.0.26200.0`
- Frontend package versions: React `^19.2.0`, Vite `^7.2.4`, TypeScript `~5.9.3`.
- Backend package versions: NestJS `^10.3.0`, Mongoose `^8.0.3`, TypeScript `^5.3.3`.
- AI package versions from requirements/venv: FastAPI `0.109.0`.

## Environment Requirements
Frontend required:
- `VITE_API_URL`

Backend required or runtime-critical:
- `NODE_ENV`
- `PORT`
- `FRONTEND_URL`
- `MONGODB_URI`
- `MONGODB_POOL_SIZE`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRY`
- `JWT_REFRESH_EXPIRY`

Database required:
- `MONGODB_URI`

Auth/OAuth optional unless OAuth is enabled:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`
- `LINKEDIN_CLIENT_ID`
- `LINKEDIN_CLIENT_SECRET`
- `LINKEDIN_CALLBACK_URL`

File storage:
- `UPLOAD_DIR`
- `UPLOAD_PATH`
- `MAX_FILE_SIZE`
- `MAX_CV_SIZE`

AI/matching:
- `AI_SERVICE_URL`
- `AI_MODEL_VERSION`
- `EMBEDDING_MODEL`
- `MATCH_THRESHOLD`
- `HIGH_MATCH_THRESHOLD`
- `ACCEPTANCE_MIN`
- `MATCH_SKILLS_WEIGHT`
- `MATCH_EXPERIENCE_WEIGHT`
- `MATCH_PROJECTS_WEIGHT`
- `MATCH_SEMANTIC_WEIGHT`

Queue/cache:
- `REDIS_HOST`
- `REDIS_PORT`
- AI service also supports `REDIS_URL`, `REDIS_PASSWORD`, `CACHE_ENABLED`.

Email/notifications optional:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `FCM_SERVER_KEY`
- `TWILIO_SID`

AI service settings:
- `APP_NAME`, `APP_VERSION`, `APP_ENV`, `DEBUG`, `HOST`, `PORT`, `WORKERS`
- `CORS_ORIGINS`, `CORS_ALLOW_CREDENTIALS`, `CORS_ALLOW_METHODS`, `CORS_ALLOW_HEADERS`
- `EMBEDDING_MODEL`, `EMBEDDING_DIMENSION`, `MAX_SEQUENCE_LENGTH`
- CV parsing and NLP settings from `madar-ai/config.py`
- `OPENAI_API_KEY`, `HUGGINGFACE_API_KEY` optional

No secret values were copied into this document.

## Dependency Installation Results
- Frontend `npm ci`: exit code 0. Installed 512 packages. Reported 12 vulnerabilities: 1 low, 4 moderate, 7 high.
- Backend `npm ci`: first run timed out after 124 seconds. Second run exit code 0. Installed 827 packages. Reported 40 vulnerabilities: 3 low, 20 moderate, 17 high. Several deprecated package warnings were reported.
- No `--force` or `--legacy-peer-deps` was used.
- No package upgrade was attempted.

## Frontend Validation Results
- `npm run lint`: exit code 1. Reported 293 problems: 283 errors, 10 warnings.
- `npx tsc --noEmit`: exit code 0.
- `npm run test`: exit code 1 because no `test` script exists in `app/package.json`.
- `npm run build`: exit code 0. Vite build succeeded and generated/updated `app/dist`.
- Build warnings: Browserslist data is old; one or more chunks exceed 500 kB.

## Backend Validation Results
- `npm run lint`: skipped because the script is `eslint ... --fix`, which can modify code.
- `npx tsc --noEmit`: exit code 0.
- `npm run test -- --runInBand`: exit code 1. Jest found no tests because config root is `src`, while visible tests are under `madar-backend/test`.
- `npm run test:e2e -- --runInBand`: exit code 1. Jest found no e2e tests matching `.e2e-spec.ts`.
- `npm run build`: exit code 0.

## AI Validation Results
- `python -m compileall .`: exit code 1 because it traversed `.venv` and produced excessive vendor output.
- `python -m compileall -q main.py config.py models routers services utils`: exit code 0.
- Global `python -m pytest`: exit code 1, `No module named pytest`.
- `.venv\Scripts\python.exe -m pytest`: exit code 1, pytest present but collected 0 tests.
- AI source syntax status: pass when scoped to project source.

## University Contract Summary
- Auth register/login works through nested API response unwrapping in frontend.
- University dashboard and structure are partial matches.
- University students response is a mismatch: frontend types expect `items/pagination`, page expects `students` plus charts/filter collections, backend returns only `students,total,page,limit,totalPages`.
- Reports are partial: JSON and CSV are implemented; Excel is CSV content; PDF returns JSON content metadata, not a real PDF.

## Route Protection Summary
- `/register` is public.
- `/university/dashboard`, `/university/structure`, `/university/students` are protected in frontend for `university` and `coordinator`.
- Backend university controller generally uses `JwtAuthGuard` and `RolesGuard`.
- Backend `/api/universities/students` allows `UNIVERSITY` only, so coordinator can open the frontend route but can be rejected by backend.
- Institution status is not checked by the generic JWT/RBAC guards.

## Existing Failures
- Frontend lint failure: 283 errors, 10 warnings.
- Backend Jest configuration does not discover current tests.
- AI pytest has no test files.
- University API contracts are partially inconsistent.
- Static university text and fallback data exist in frontend.

## Generated Artifacts
- `app/dist` was generated/updated by `npm run build`.
- `docs/university-baseline.md`
- `docs/university-api-contract-matrix.md`
- `docs/university-route-security-matrix.md`
- `docs/university-baseline-errors.md`

## Git Status After Validation
- Git is unavailable for this folder because it is not a repository.
- `git status --short` after validation also returns `fatal: not a git repository`.

## Baseline Decision
Phase 2 status: Passed with existing failures.

The baseline is usable for Phase 3 because install, typecheck, and build are known, and current lint/test/API-contract failures are documented without changing production code.
