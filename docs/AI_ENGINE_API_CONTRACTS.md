# AI Engine API Contracts

All browser-facing NestJS responses use the existing envelope:

```json
{ "success": true, "statusCode": 200, "message": "Success", "data": {} }
```

FastAPI endpoints are internal service contracts called by NestJS or queue workers.

## Browser-facing NestJS APIs

| Method | Route | Authentication and roles | Request | Response data | Mode | Main errors |
| --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/students/cv-upload/async` | JWT student | Multipart `file` PDF/DOCX | `taskId`, `status`, `contentHash` | Async | 400, 401, 413, 415, 503 |
| POST | `/api/students/cv-upload` | JWT student | Multipart `file` | Parsed profile compatibility response | Sync compatibility | 400, 401, 413, 415, 422, 503 |
| GET | `/api/matching/tasks/:taskId` | JWT scoped roles | Path task ID | state, progress, attempts, result/error | Poll | 401, 403, 404 |
| POST | `/api/matching/tasks/:taskId/retry` | JWT task owner/admin | Path task ID | queued task state | Async | 401, 403, 404, 409, 503 |
| POST | `/api/matching/tasks/recommendations` | JWT student | None | recommendation task ID | Async | 401, 503 |
| GET | `/api/students/recommended-jobs` | JWT student | page, limit, filters | job cards and pagination metadata | Sync read | 401, 404 |
| POST | `/api/students/recommendations/refresh` | JWT student | None | counts, refresh time, top recommendation | Sync compatibility | 401, 422, 503 |
| GET | `/api/students/skill-gaps` | JWT student | page, limit, search, priority | gaps, resources and pagination | Sync read | 401, 404 |
| GET | `/api/students/learning-paths` | JWT student | None | external resources and skills | Sync read | 401, 404 |
| GET | `/api/matching/job/:jobId/student/:studentId` | JWT student/company/admin | IDs, student self-scope enforced | weighted score and explanation | Sync | 401, 403, 404, 503 |
| GET | `/api/matching/top-jobs/:studentId` | JWT student/admin | limit | ranked active jobs | Sync read | 401, 403, 404 |
| GET | `/api/matching/top-candidates/:jobId` | JWT company/admin | limit | ranked candidates | Sync read | 401, 403, 404 |
| GET | `/marketdata/trends/summary` | JWT | months | period, sample size and trends | Sync read | 401, 422, 503 |
| POST | `/marketdata/trends/refresh` | JWT admin | months | persisted trend snapshot | Sync/admin | 401, 403, 422, 503 |
| POST | `/api/universities/curriculum/analysis/:departmentId/tasks` | JWT university/coordinator/academic officer | department path | task ID and queued state | Async | 401, 403, 404, 503 |
| GET | `/api/universities/curriculum/analysis/:departmentId` | JWT institution roles | optional `refresh` | scoped stored curriculum analysis | Sync read/compatibility | 401, 403, 404, 503 |
| POST | `/aiembeddings/search` | JWT admin | vector, entity type, model/version, limit | nearest entities and scores | Sync | 400, 401, 403 |

## Internal FastAPI APIs

| Method | Route | Request | Response | Consumer |
| --- | --- | --- | --- | --- |
| GET | `/api/ai/health` | None | health/version/environment | Health checks |
| GET | `/api/ai/info` | None | model, dimension and capabilities | Admin worker |
| POST | `/api/ai/cv/parse` | Multipart PDF/DOCX | structured CV, confidence, skills, hash/model metadata | CV worker |
| POST | `/api/ai/cv/parse-text` | text payload | structured CV | Internal diagnostics |
| POST | `/api/ai/cv/extract-text` | Multipart PDF/DOCX | cleaned text | Internal diagnostics |
| POST | `/api/ai/skills/extract` | text | canonical structured skills | Company/student services |
| POST | `/api/ai/skills/gap-analysis` | current and required skills | compatible skill-gap objects | Matching workflows |
| POST | `/api/ai/skills/embed` | text | vector, model, version, dimension, hash | Embedding repository |
| GET | `/api/ai/skills/taxonomy` | None | bilingual taxonomy | Administration |
| POST | `/api/ai/jobs/analyze` | title and description | structured reusable job analysis | Job worker |
| POST | `/api/ai/matching/calculate` | student/job features and embeddings | score breakdown, penalty, explanation, acceptance | Match worker |
| POST | `/api/ai/matching/batch` | one profile and jobs | batch match results | Batch worker |
| POST | `/api/ai/recommendations/jobs` | student profile plus eligible jobs | ranked recommendations with evidence/resources | Student recommendation flow |
| POST | `/api/ai/recommendations/semantic-search` | query embedding plus jobs | nearest jobs | Search |
| POST | `/api/ai/market/trends` | real dated jobs and period | sample-aware trend analysis | Market service |
| POST | `/api/ai/curriculum/analyze` | department curriculum skills and market skills | coverage, gaps and recommendations | Curriculum worker |

## Error contract

NestJS translates domain failures into 400, 401, 403, 404, 409, 413, 415, 422, 502 or 503. FastAPI validation uses 422, unsupported files use 415, oversized files use 413, analysis failures use 422 and overload uses 429. Unexpected production errors do not expose a stack trace.
