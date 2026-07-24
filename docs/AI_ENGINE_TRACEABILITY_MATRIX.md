# AI Engine Traceability Matrix

Validated on 2026-07-22 against the running local development stack.

| Requirement ID | Implemented | Backend Files | AI Files | Frontend Files | Database | Tests | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FR-AI-001 | Yes | `students.controller.ts`, `students.service.ts`, `students-ai.processor.ts`, `multer.config.ts` | `models/cv_parser.py`, `routers/cv.py` | `services/studentApi.ts` | Student CV metadata and `rawTextHash`; no raw extracted text | Python parser tests; live async DOCX; invalid file 415; IDOR 403 | PDF and DOCX only by contract; corrupt/empty text returns 422. |
| FR-AI-002 | Yes | `students.service.ts` | `models/skill_extractor.py`, `routers/skills.py` | Existing profile/recommendation views | Canonical student skills | Alias, Arabic, deduplication and metadata tests | Extraction never adds a taxonomy skill without text evidence. |
| FR-AI-003 | Yes | `companies.service.ts`, `job.schema.ts`, `matching.processor.ts` | `models/job_analyzer.py`, `routers/jobs.py` | Existing job forms and status views | Job `aiAnalysis`, embedding/hash/version | Runtime queued job analysis; written-number tests | Stored result is reused until content/model changes. |
| FR-AI-004 | Yes | `ai-embedding.*`, `matching.processor.ts`, `students.service.ts` | `models/embeddings.py` | Existing recommendation views | `aiembeddings` with unique entity/model/version/hash indexes | Cosine and dimension tests; Mongo runtime counts | Local MongoDB uses bounded cosine repository; Atlas vector search can replace it. |
| FR-AI-005 | Yes | `matching.*`, `students.service.ts`, recommendation/match schemas | `routers/recommendations.py`, `models/matcher.py` | `studentApi.ts`, existing recommendation page | `matchresults`, `recommendations` worker output | Live refresh returned 20 eligible jobs | Excludes applied, inactive, deleted and expired jobs. |
| FR-AI-006 | Yes | `students.service.ts`, skill-gap schema/controller | `routers/skills.py`, `models/matcher.py` | Existing gaps and insights views | `skillgaps` | Runtime search/pagination and resource persistence | Uses `critical/high/medium/low` and compatible fields. |
| FR-AI-007 | Yes | `market-data.*`, `matching.processor.ts` | `routers/market.py` | Existing student/university/company analytics | `marketdatas` snapshots | Live new-job market task; insufficient-data behavior inspected | No trend direction is asserted below the minimum sample. |
| FR-AI-008 | Yes | `universities/curriculum/*` | `routers/curriculum.py` | Existing university curriculum page | `curriculumanalyses`, academic recommendations | Live queued department analysis completed at 100%; queue specs | Scope includes university, college, department, plan and courses. |
| FR-AI-009 | Yes | Match result breakdown fields | `models/matcher.py`, `routers/matching.py` | Existing score components | Match result score components | Weight, cosine and mandatory-penalty tests | Formula documented in implementation report. |
| FR-AI-010 | Yes | Match result explanation fields | `models/matcher.py` | Existing badges/lists/explanation panels | Match explanation persisted | Live recommendation inspected; no raw object rendering | Evidence is derived from actual profile/job values. |
| FR-AI-011 | Yes | `students.service.ts`, `matching.processor.ts` | `models/matcher.py` | Existing acceptance display | Method and factors persisted | Heuristic-label test; live result 38% | No historical model is claimed because the dataset is insufficient. |
| FR-AI-012 | Yes | Skill and skill-gap resource fields | `services/learning_resources.py` | Existing learning paths | Per-gap resources plus admin-editable Skill resources | HTTPS/no-fabrication test; live Machine Learning resource | Catalog is an allowlist; unknown skills remain empty. |
| FR-AI-013 | Yes | `ai-embedding.service.ts`, DTO/controller/schema | `models/embeddings.py` | Admin AI operations only | `aiembeddings` | Runtime job/student counts and search code validation | Repository is replaceable when native vector search is available. |
| FR-AI-014 | Yes | Bull modules, processors, matching task API, curriculum task API | Redis cache lifecycle | `studentApi.ts` polls CV task | Bull Redis state and Mongo result stores | Retry/idempotency specs; live CV/job/market/curriculum tasks | Queue processors run with NestJS; separate deployment can use the same build. |

## Final counts

- Complete: 14
- Partial: 0
- Missing: 0
- Blocked: 0
