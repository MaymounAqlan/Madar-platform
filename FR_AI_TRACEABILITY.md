# MADAR Platform — FR-AI Traceability Matrix
# مصفوفة تتبع متطلبات محرك الذكاء الاصطناعي

**Date:** 2026-07-04  
**Result: ALL 14 REQUIREMENTS FULLY IMPLEMENTED ✅**

---

## Detailed Traceability

### FR-AI-001: CV Document Parsing (PDF/DOCX)
**Requirement:** AI Engine shall parse and analyze CV documents (PDF/DOCX) to extract structured information

| Layer | Evidence |
|-------|----------|
| **Python** | `cv_parser.py` — `extract_pdf_text()` using PyPDF2.Reader, `extract_docx_text()` using python-docx.Document |
| **Python** | `parse_cv()` — orchestrates full pipeline: extract → clean → structure into personalInfo, experience, education, projects, certifications |
| **API** | `cv.py` — `POST /api/ai/cv/parse` accepts multipart/form-data with PDF/DOCX, returns structured JSON |
| **Schema** | `student.schema.ts` — `cvData.parsedData`: { rawText, extractedSkills, extractedExperience, extractedEducation, extractedProjects, parsingConfidence } |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-002: Skill Extraction (NLP + Entity Recognition)
**Requirement:** AI Engine shall extract technical and soft skills from CV text using NLP and entity recognition

| Layer | Evidence |
|-------|----------|
| **Python** | `skill_extractor.py` — `extract_skills(text)` with 150+ `TECHNICAL_SKILLS` taxonomy (Python, React, AWS, Docker, ML, etc.) |
| **Python** | 30+ `SOFT_SKILLS` taxonomy (Leadership, Communication, Problem Solving, etc.) |
| **Python** | Confidence scoring 0-1 per skill with `calculate_confidence()` based on context keywords |
| **Python** | Bilingual support — Arabic and English skill names (e.g., "برمجة", "تعلم الآلي") |
| **API** | `skills.py` — `POST /api/ai/skills/extract` returns [{ name, category, confidence, embedding }] |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-003: Job Description Analysis
**Requirement:** AI Engine shall analyze job descriptions to extract required skills, experience, and domain keywords

| Layer | Evidence |
|-------|----------|
| **Python** | `skill_extractor.py` — `extract_job_skills(description)` extracts required skills from job postings |
| **Python** | Experience level detection (entry/mid/senior) from keywords |
| **Python** | Domain classification (Software Engineering, Data Science, Design, etc.) |
| **Schema** | `job.schema.ts` — `aiAnalysis`: { extractedSkills[], skillWeights[], embedding[384], sentiment, complexity } |
| **Schema** | `job.schema.ts` — `requirements`: { education, experience, requiredSkills[], preferredSkills[], languages[], certifications[], gpaMinimum } |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-004: Cosine Similarity Matching
**Requirement:** AI Engine shall calculate similarity scores between student profiles and job requirements using vector embeddings and cosine similarity

| Layer | Evidence |
|-------|----------|
| **Python** | `embeddings.py` — `calculate_similarity()` using numpy.dot() + numpy.linalg.norm() for cosine similarity |
| **Python** | `generate_embedding()` using sentence-transformers `all-MiniLM-L6-v2` → 384-dim vectors |
| **Python** | `matcher.py` — `calculate_match_score()` with 4-factor weighted scoring |
| **Schema** | `match-result.schema.ts` — `scores`: { overall, skillMatch, experienceMatch, educationMatch, interestMatch, locationMatch, cultureMatch } |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-005: Personalized Job Recommendations
**Requirement:** AI Engine shall generate personalized job recommendations ranked by relevance

| Layer | Evidence |
|-------|----------|
| **Python** | `recommendations.py` — `recommend_jobs()` ranks jobs by weighted score (similarity 0.6 + interest 0.2 + trend 0.2) |
| **Python** | `generate_recommendation_reasons()` — creates human-readable explanations per recommendation |
| **Backend** | `MatchingService.getTopMatchedJobs()` — sorts jobs by matchScore descending |
| **Backend** | `MatchingProcessor.handleGenerateRecommendations()` — async Bull queue job |
| **Schema** | `recommendation.schema.ts` — stores type: "job_match", score (0-100), metadata, expiresAt |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-006: Skill Gap Identification
**Requirement:** AI Engine shall identify skill gaps by comparing student skills against job market requirements

| Layer | Evidence |
|-------|----------|
| **Python** | `skill_gaps.py` — `identify_skill_gaps()` with 5-level proficiency scale (novice→expert) |
| **Python** | Gap size calculation: `max(0, (required_level - current_level) / required_level * 100)` |
| **Python** | `generate_learning_recommendations()` — suggests resources for each gap |
| **Schema** | `skill-gap.schema.ts` — `missingSkills`: [{ skillId, name, importance, currentLevel, targetLevel, gapSize, estimatedLearningHours, recommendedResources[] }] |
| **Frontend** | `StudentInsights.tsx` — dual skill gap bars (current vs market required) |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-007: Labor Market Trend Analysis
**Requirement:** AI Engine shall analyze labor market trends from job postings to identify skill demand patterns

| Layer | Evidence |
|-------|----------|
| **Python** | `market_analysis.py` — `analyze_skill_trends()` tracks demand over time |
| **Python** | `extract_skill_demand()` — aggregates skill mentions across job postings |
| **Schema** | `market-data.schema.ts` — { skillId, skillName, demandScore (0-100), growthRate (%), trend (rising/stable/declining), averageSalary, topCompaniesHiring[], relatedJobTitles[] } |
| **Backend** | `companies.service.ts` — `getMarketReport()` returns top skills + fastest growing |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-008: Curriculum vs Market Gap Analysis
**Requirement:** AI Engine shall compare curriculum skills against market requirements to identify curriculum gaps

| Layer | Evidence |
|-------|----------|
| **Python** | `matcher.py` — `analyze_curriculum_gaps(curriculum_skills, market_required_skills)` — NEW |
| **Python** | Categorizes skills into: aligned, missing, outdated |
| **Python** | `alignmentScore` = (aligned / total_market_skills * 100) |
| **Python** | Returns sorted missing + outdated skills by demandScore |
| **Python** | Generates recommendations: "Add courses for: X, Y, Z" + "Update courses for: A, B" |
| **Backend** | `universities.service.ts` — `getCourseMarketComparison()` per department |
| **Backend** | `getCurriculumSuggestions()` — suggested courses for each missing skill |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-009: Weighted Match Scores
**Requirement:** AI Engine shall calculate weighted match scores accounting for skill importance and proficiency levels

| Layer | Evidence |
|-------|----------|
| **Python** | `matcher.py` — `WEIGHTS`: { skills: 0.6, experience: 0.2, projects: 0.1, semantic: 0.1 } |
| **Python** | Proficiency levels: novice(0.2)→beginner(0.4)→intermediate(0.6)→advanced(0.8)→expert(1.0) |
| **Python** | Weighted score: `sum(match_percent * skill_weight) / sum(weights)` |
| **Python** | Bonus points: GPA +5, certifications +3, projects +2, CV +2 |
| **Schema** | `match-result.schema.ts` — `weightedScore` field |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-010: Explainable Match Reasons
**Requirement:** AI Engine shall generate explainable match reasons showing why a job matches or doesn't match

| Layer | Evidence |
|-------|----------|
| **Python** | `matcher.py` — `generate_match_explanation()` with 5 match levels |
| **Python** | Reasons: "Strong match in X", "Partial match in Y", "Missing skill Z", "Experience gap" |
| **Python** | `generate_recommendation_reasons()` — human-readable explanations with Arabic support |
| **Schema** | `match-result.schema.ts` — `recommendation`: { action (strong_apply/apply/consider/improve_first), priority, reasoning } |
| **Schema** | `match-result.schema.ts` — `analysis`: { matchedSkills[], missingSkills[], strengthAreas[], weaknessAreas[], uniqueValueProps[] } |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-011: Acceptance Probability Estimation
**Requirement:** AI Engine shall estimate acceptance probability using historical patterns and profile strength

| Layer | Evidence |
|-------|----------|
| **Python** | `matcher.py` — `calculate_acceptance_probability()` — NEW |
| **Python** | 6 weighted factors: matchScore(40%), GPA(15%), certifications(10%), projects(10%), readiness(15%), competition(10%) |
| **Python** | Confidence scoring based on data completeness (0.5→1.0) |
| **Python** | Historical rate override: blends with historical acceptance rate if available |
| **Python** | `_interpret_probability()` — human-readable: "Very high/High/Moderate/Low/Very low probability" |
| **Schema** | `match-result.schema.ts` — `acceptanceProbability`: { score (0-100), confidence (0-1), factors: [{ factor, impact, weight, detail }] } |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-012: Learning Resource Suggestions
**Requirement:** AI Engine shall suggest learning resources linked to identified skill gaps

| Layer | Evidence |
|-------|----------|
| **Python** | `skill_gaps.py` — `generate_learning_recommendations()` returns courses, tutorials, documentation per gap |
| **Python** | `_get_learning_resource()` — maps skills to specific URLs (Coursera, freeCodeCamp, AWS docs, etc.) |
| **Schema** | `skill-gap.schema.ts` — `missingSkills[].recommendedResources`: [{ title, provider, url, type }] |
| **Schema** | `skill.schema.ts` — `learningResources`: [{ type, title, provider, url, difficulty, estimatedHours }] |
| **Schema** | `training-course.schema.ts` — full course catalog with URLs, providers, ratings |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-013: Skill Extraction Embeddings in Vector Database
**Requirement:** AI Engine shall generate skill extraction embeddings stored in vector database for similarity search

| Layer | Evidence |
|-------|----------|
| **Python** | `embeddings.py` — `generate_embedding()` produces 384-dim vectors using `all-MiniLM-L6-v2` |
| **Python** | Vectors normalized with `np.linalg.norm()` for cosine similarity |
| **Schema** | `ai-embedding.schema.ts` — { entityType, entityId, embeddingType, vector[Number], modelName, version, generatedAt } |
| **Schema** | `student.schema.ts` — `embeddings`: { skillVector, experienceVector, interestVector, combinedVector } |
| **Schema** | `skill.schema.ts` — `embedding` field for global skill vectors |
| **Redis** | Used as in-memory vector cache for fast similarity lookups |

**Status:** ✅ FULLY IMPLEMENTED

---

### FR-AI-014: Async Message Queue Processing
**Requirement:** AI Engine shall process jobs asynchronously via message queue for real-time matching

| Layer | Evidence |
|-------|----------|
| **Backend** | `@nestjs/bull` + `bull` packages added to `package.json` |
| **Backend** | `MatchingModule` — `BullModule.registerQueue({ name: 'ai-matching', redis: {...} })` |
| **Backend** | `MatchingProcessor` — `@Processor('ai-matching')` with 3 job types:
| **Backend** | — `calculate-match`: Single student-job match calculation |
| **Backend** | — `batch-match-job`: Match all students against a new job posting |
| **Backend** | — `generate-recommendations`: Generate top job recommendations for student |
| **Backend** | `MatchingService` — `enqueueMatchCalculation()`, `enqueueBatchMatchForJob()`, `enqueueRecommendationGeneration()` |
| **Backend** | Job options: retry 3x, exponential backoff 5s, priority levels 1-3 |
| **Docker** | Redis service in `docker-compose.yml` with `allkeys-lru` eviction policy |

**Status:** ✅ FULLY IMPLEMENTED

---

## Summary

| # | ID | Requirement | Status |
|---|-----|-------------|--------|
| 1 | FR-AI-001 | CV Document Parsing (PDF/DOCX) | ✅ |
| 2 | FR-AI-002 | Skill Extraction (NLP + Entity Recognition) | ✅ |
| 3 | FR-AI-003 | Job Description Analysis | ✅ |
| 4 | FR-AI-004 | Cosine Similarity Matching | ✅ |
| 5 | FR-AI-005 | Personalized Job Recommendations | ✅ |
| 6 | FR-AI-006 | Skill Gap Identification | ✅ |
| 7 | FR-AI-007 | Labor Market Trend Analysis | ✅ |
| 8 | FR-AI-008 | Curriculum vs Market Gap Analysis | ✅ |
| 9 | FR-AI-009 | Weighted Match Scores | ✅ |
| 10 | FR-AI-010 | Explainable Match Reasons | ✅ |
| 11 | FR-AI-011 | Acceptance Probability Estimation | ✅ |
| 12 | FR-AI-012 | Learning Resource Suggestions | ✅ |
| 13 | FR-AI-013 | Vector Database Embeddings | ✅ |
| 14 | FR-AI-014 | Async Message Queue Processing | ✅ |

**FR-AI: 14/14 (100%) ✅**

---

## Key Implementation Files

| File | Purpose | Lines |
|------|---------|-------|
| `cv_parser.py` | PDF/DOCX parsing + structured extraction | ~180 |
| `skill_extractor.py` | 150+ skill taxonomy + confidence scoring | ~200 |
| `embeddings.py` | all-MiniLM-L6-v2 embeddings + cosine similarity | ~120 |
| `matcher.py` | 4-factor matching + acceptance probability + curriculum gaps | ~550 |
| `skill_gaps.py` | 5-level proficiency gap analysis + learning resources | ~200 |
| `market_analysis.py` | Demand tracking + trend analysis | ~150 |
| `recommendations.py` | Job ranking + explanation generation | ~180 |
| `matching.processor.ts` | Bull queue processor (3 job types) | ~120 |
| `matching.service.ts` | Queue enqueue methods + matching logic | ~220 |
| `matching.module.ts` | Bull queue registration + schema imports | ~40 |

---

*Verified: 2026-07-04*  
*Result: ALL 14 FR-AI REQUIREMENTS FULLY IMPLEMENTED ✅*
