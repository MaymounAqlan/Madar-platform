# AI Engine Implementation Report

## Summary

The existing architecture was retained. FastAPI performs deterministic NLP, embeddings, scoring and explanations. NestJS owns authentication, authorization, queue orchestration and persistence. MongoDB stores reusable analyses and Redis/Memurai stores Bull task state and embedding cache entries. React continues to use the existing pages and now polls the real async CV task.

## Main files changed

### AI service

- `madar-ai/config.py`, `.env.example`, `main.py`
- `madar-ai/models/cv_parser.py`, `skill_extractor.py`, `job_analyzer.py`, `embeddings.py`, `matcher.py`
- `madar-ai/routers/cv.py`, `skills.py`, `jobs.py`, `matching.py`, `recommendations.py`, `market.py`, `curriculum.py`
- `madar-ai/services/cache_service.py`, `learning_resources.py`
- `madar-ai/tests/test_ai_core.py`

### Backend

- `madar-backend/.env.example`, `src/main.ts`, `src/config/multer.config.ts`
- `src/students/students.controller.ts`, `students.service.ts`, `students.module.ts`, `students-ai.processor.ts`
- `src/matching/matching.controller.ts`, `matching.service.ts`, `matching.processor.ts`, `matching.service.spec.ts`
- Match result, recommendation, skill-gap and AI embedding schemas/services/controllers/DTOs
- `src/companies/companies.service.ts`, `src/jobs/schemas/job.schema.ts`
- `src/skills/market-data/*`
- `src/universities/curriculum/*`, including queue processor and tests
- `src/admin-ai/admin-ai.module.ts` and the permission registry compatibility fix

### Frontend

- `app/src/services/studentApi.ts`
- Existing TypeScript blockers in `AdminAccounts.tsx` and `AdminAiOperations.tsx`

## CV and NLP pipeline

NestJS validates extension, MIME and 10 MB size, stores a sanitized generated filename, hashes the content, and enqueues Bull. The worker sends only the required file to FastAPI. FastAPI validates the PDF/DOCX signature, extracts and cleans text, rejects unreadable documents, extracts structured bilingual fields and canonical skills, and returns confidence/quality metadata. NestJS stores structured profile data and `rawTextHash`, not the full raw resume text.

Skill aliases normalize values such as JS/JavaScript, Node/Node.js and Arabic equivalents. Results include canonical name, category, confidence, source and inferred proficiency only when evidence permits it.

## Job analysis and embeddings

Publishing a job enqueues `analyze-job`. The worker stores required/preferred skills, technologies, responsibilities, experience, education, domain, keywords, content hash, embedding, model and version. Student and job embeddings use the configured `all-MiniLM-L6-v2`, version `1`, dimension `384`. Empty or dimension-mismatched vectors are rejected.

MongoDB vector documents are unique by entity, model, version and content hash. Local development uses a capped cosine search over candidate vectors because native MongoDB Vector Search is unavailable locally. The repository boundary allows replacing this implementation without changing callers.

## Match score formula

Weights are read from configuration and normalized to sum to 1:

```text
base = skillsScore * skillsWeight
     + experienceScore * experienceWeight
     + projectsScore * projectsWeight
     + semanticScore * semanticWeight

overallScore = clamp(base - mandatorySkillsPenalty, 0, 100)
```

The response and stored result contain `overallScore`, `skillsScore`, `experienceScore`, `projectsScore`, `semanticScore` and `mandatorySkillsPenalty`. Missing mandatory skills reduce the score, sparse profiles no longer receive artificial neutral scores, and all components are bounded to 0-100.

## Explainability and acceptance probability

Explanations contain matched and missing skills, experience evidence, strengths, weaknesses, risk factors and improvement actions. The live Data Scientist result showed a 66% match, a 38% acceptance estimate, three matched skills, one missing mandatory skill and specific evidence.

The current database does not contain a sufficiently controlled historical training dataset. Acceptance probability therefore uses `heuristic_estimate`, stores its method and factors, and never claims to be a trained historical model. A future historical model requires labeled outcomes, train/test separation, leakage controls and versioned evaluation metrics.

## Learning resources

Resources come from two trusted sources: admin-editable `Skill.learningResources` documents and a verified official HTTPS allowlist. Current market gaps are covered by official documentation, courses or professional resources. Unknown skills return an empty list instead of a fabricated search URL. Each AI catalog response includes skill, title, type, URL, provider, level, language, free/paid availability when known, reason and priority.

## Market and curriculum intelligence

Market analysis aggregates stored jobs by explicit period and returns sample size, demanded/rising/declining skills, domains, opportunity types, experience distribution and titles. Insufficient samples return an explicit status instead of invented trends. Snapshots are persisted in `marketdatas` and are refreshed automatically after analyzed jobs.

Curriculum analysis is scoped to the authenticated institution and department. It compares course skill mappings with stored market demand, persists covered/partial/missing/emerging skills and actionable recommendations, and now supports a tracked `analyze-curriculum` Bull task.

## Queue behavior

Bull uses Memurai/Redis on `6379` with job IDs, owner metadata, states, bounded retries, exponential backoff and timeout. Supported work includes CV parsing, job analysis, embedding generation through CV/job work, one-to-one and batch matching, recommendations with skill gaps, market refresh, global reindex/recalculation and curriculum analysis. Task status and retry endpoints enforce requester ownership except for administrative roles. NestJS shutdown hooks and FastAPI Redis cleanup are enabled.

## Error handling and security

- Invalid input 400/422, unauthorized 401, forbidden/IDOR 403, missing 404, duplicate 409, oversized file 413, unsupported type 415, AI failure 422/502/503 and queue outage 503.
- Student matching/task access is scoped to the authenticated student.
- Company jobs and university curriculum data use owner/institution/college scope.
- Generic AI embedding, recommendation and skill-gap mutation controllers are restricted to admin roles.
- No full CV text is logged or returned from task status.
- FastAPI hides unexpected details outside debug mode and has configurable per-client rate limiting.

## Verification results

| Check | Result |
| --- | --- |
| Frontend `npx tsc --noEmit` | PASS, exit 0 |
| Frontend `npm run build` | PASS, exit 0 |
| Backend `npx tsc --noEmit` | PASS, exit 0 |
| Backend `npm run build` | PASS, exit 0 |
| Backend Jest | PASS, 12 suites and 77 tests |
| AI compileall | PASS, exit 0 |
| AI pytest | PASS, 12 tests, no warning |
| MongoDB | PASS, connected; AI result collections contain documents |
| Redis/Memurai | PASS, queue tasks completed |
| Async CV E2E | PASS, 202 to completed, progress 100 |
| Job/market queue | PASS |
| Curriculum queue | PASS, 202 to completed, progress 100 |
| Owner isolation | PASS, other student task request returned 403 |
| Unsupported CV | PASS, 415 with `UNSUPPORTED_CV_TYPE` |

Frontend lint remains an existing repository-wide issue with 573 errors and 8 warnings, including backup source files and unrelated pages. Backend ESLint cannot run because the repository has no ESLint configuration although the script exists. These were not hidden and were not broadly rewritten as part of the AI work.

## Remaining limitations

- Acceptance probability is honestly heuristic until enough governed historical outcomes exist.
- Local MongoDB does not provide native vector indexing, so search is capped at 2,000 candidate vectors.
- The FastAPI service is intended for a private service network. Production deployment should enforce network policy or a service mesh credential in addition to application rate limiting.
- Vite reports a large main chunk and stale Browserslist data; production code splitting is a separate frontend performance task.
