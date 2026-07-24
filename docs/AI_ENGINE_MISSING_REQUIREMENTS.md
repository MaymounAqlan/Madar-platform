# AI Engine Missing Requirements

Initial audit recorded before implementation. Status reflects real logic, persistence, integration, validation, error handling, and tests.

| ID | Requirement | Status | Current files | Confirmed gaps | Repair plan |
| --- | --- | --- | --- | --- | --- |
| FR-AI-001 | CV parsing | Partial | `madar-ai/models/cv_parser.py`, `madar-ai/routers/cv.py`, `madar-backend/src/students/students.service.ts` | PDF, DOCX and OCR exist; MIME/corruption status codes and async processing are incomplete; raw CV text is persisted; many Arabic section labels are mojibake | Harden validation, repair Arabic labels, limit raw text persistence, introduce tracked async analysis |
| FR-AI-002 | NLP skill extraction | Partial | `madar-ai/models/skill_extractor.py`, `routers/skills.py` | Taxonomy and canonical names exist, but Arabic aliases are corrupted and response lacks source/proficiency evidence | Add correct bilingual aliases and structured extraction evidence |
| FR-AI-003 | Job analysis | Partial | `companies.service.ts`, `routers/skills.py`, `job.schema.ts` | Only skill names are extracted; no reusable structured required/preferred skills, experience, education, responsibilities and importance contract | Add structured AI job analysis and persist hash/model/version |
| FR-AI-004 | Embeddings and cosine similarity | Partial | `models/embeddings.py`, `matching.processor.ts`, `ai-embedding.schema.ts` | Real embeddings exist, but local fallback dimension differs and persistent hash/version invalidation is absent | Enforce dimensions and model metadata, use persistent upsert repository |
| FR-AI-005 | Job recommendations | Partial | `matching.processor.ts`, `students.service.ts`, recommendation schemas | Ranking exists, but rank/modelVersion/generatedAt/reasons/risks are incomplete and deadline/application exclusion is inconsistent | Build recommendations from stored matches and active eligible jobs only |
| FR-AI-006 | Skill gaps | Partial | `routers/skills.py`, `skill-gap.schema.ts`, `students.service.ts` | Multiple incompatible contracts; demand counts and trustworthy learning resources are incomplete | Normalize contract and calculate demand from stored jobs |
| FR-AI-007 | Market trends | Partial | `skills/market-data/*`, company/university analytics | Storage exists, but no reliable time-window aggregation with sample size and insufficient-data state; CRUD is unprotected | Aggregate real jobs into secured snapshots with period and sample size |
| FR-AI-008 | Curriculum comparison | Partial | `madar-ai/routers/curriculum.py`, `universities/curriculum/*` | Department linkage and persistence exist; course/job/domain evidence and queued updates are incomplete | Extend traceable course-level result and queue refreshes |
| FR-AI-009 | Weighted match score | Partial | `models/matcher.py`, `routers/matching.py` | Weights normalize, but mandatory penalty is missing and neutral defaults can inflate sparse profiles | Add required-skill penalty and explicit score breakdown/method |
| FR-AI-010 | Explainable matching | Partial | `matcher.py`, match result schema | Matched/missing skills exist; structured strengths, weaknesses, experience failures and actions are incomplete | Generate and persist evidence-based explanation |
| FR-AI-011 | Acceptance probability | Partial | `matcher.py`, `matching.processor.ts` | A heuristic exists, but Backend uses `overall * 0.9`, does not disclose method, and does not verify historical sample quality | Use transparent `heuristic_estimate`; only label trained model after data sufficiency checks |
| FR-AI-012 | Learning resources | Partial | `routers/skills.py`, skill gap schema | Trusted links exist partially, but fallback creates Google searches and metadata is incomplete | Persist an editable trusted resource catalog and return verified URLs only |
| FR-AI-013 | Embedding storage/search | Partial | AI embedding schema/service, Python in-memory vector store | Mongo CRUD lacks hash/version uniqueness and search; Python store is ephemeral; controller is publicly writable | Implement secured idempotent Mongo repository and actual cosine search |
| FR-AI-014 | Async queue/worker | Partial | `matching.module.ts`, `matching.processor.ts`, `admin-ai/*` | Bull handles some matching tasks, but CV/job/gap/market/curriculum lack one tracked task contract, status API and idempotency | Add persisted AI task state, bounded retries/timeouts/idempotency and status API |

## Confirmed integration and security risks

- Embedding, recommendation, market-data and skill-gap generic CRUD controllers are not consistently protected by JWT and ownership.
- A student can pass another student identifier to matching endpoints.
- CV upload blocks on AI for up to 30 seconds and has no pollable task state.
- Student identifiers are inconsistently treated as User IDs and Student document IDs.
- Active-job filtering is not consistently combined with application deadline filtering.
- Full extracted CV text is stored even when downstream screens do not require it.
- Arabic aliases and CV headers contain mojibake and cannot reliably match real Arabic resumes.
- Backend `.env.example` does not document active AI, Redis, timeout, queue, model and scoring settings.

## Baseline decision

The existing implementation is a useful partial foundation. Changes will preserve current routes and add compatibility fields. Security, contracts, honest scoring and persistence are addressed before UI extensions. No requirement is marked Complete until its tests execute successfully.

## Post-implementation disposition

| ID | Final status | Verification |
| --- | --- | --- |
| FR-AI-001 | Complete | Async DOCX runtime flow completed; PDF/DOCX extraction, signatures, MIME, size, corruption and owner isolation are covered. |
| FR-AI-002 | Complete | Bilingual extraction, aliases, deduplication, category, confidence and source are tested. |
| FR-AI-003 | Complete | Structured job analysis is persisted with hash, embedding model and version; new-job queue completed at runtime. |
| FR-AI-004 | Complete | 384-dimensional normalized embeddings and cosine validation are active; student/job vectors exist in MongoDB. |
| FR-AI-005 | Complete | Only active, non-expired, unapplied jobs are ranked with model metadata and evidence. |
| FR-AI-006 | Complete | Skill gaps use the frontend contract and persist demand, priority, suggestion and learning resources. |
| FR-AI-007 | Complete | Real MongoDB jobs produce period/sample-aware market snapshots; insufficient samples are disclosed. |
| FR-AI-008 | Complete | Department/course/plan scoped analysis is stored and can run through a pollable Redis task. |
| FR-AI-009 | Complete | Normalized weighted score and mandatory-skill penalty are tested and bounded to 0-100. |
| FR-AI-010 | Complete | Strengths, weaknesses, matched/missing skills and improvement actions are persisted and rendered as text arrays. |
| FR-AI-011 | Complete | Historical-model eligibility is checked; current data uses the explicitly labeled `heuristic_estimate`. |
| FR-AI-012 | Complete | Current missing skills map to verified HTTPS resources; unknown skills return no fabricated URL. |
| FR-AI-013 | Complete | Idempotent MongoDB vector upsert/search is implemented with a bounded cosine fallback for local MongoDB. |
| FR-AI-014 | Complete | CV, job, matching, recommendations/gaps, market, embeddings/reindex and curriculum tasks use Bull/Redis states, retry, backoff, timeout and ownership-aware polling. |
