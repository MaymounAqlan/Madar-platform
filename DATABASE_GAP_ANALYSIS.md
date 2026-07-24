# MADAR Database Gap Analysis
# تحليل الفجوات في قاعدة البيانات

## Design Document Requirements: 25 Collections
## Currently Implemented: 7 Collections
## MISSING: 18 Collections

---

## Implemented (7) ✅
| # | Collection | Status | File |
|---|-----------|--------|------|
| 1 | users | ✅ | `src/users/schemas/user.schema.ts` |
| 2 | students | ✅ (basic) | `src/students/schemas/student.schema.ts` |
| 3 | companies | ✅ (basic) | `src/companies/schemas/company.schema.ts` |
| 4 | universities | ✅ (basic) | `src/universities/schemas/university.schema.ts` |
| 5 | jobs | ✅ (basic) | `src/jobs/schemas/job.schema.ts` |
| 6 | applications | ✅ (basic) | `src/applications/schemas/application.schema.ts` |
| 7 | skills | ✅ (basic) | `src/skills/schemas/skill.schema.ts` |

## MISSING (18) ❌
| # | Collection | Priority | Purpose |
|---|-----------|----------|---------|
| 8 | roles | HIGH | RBAC role definitions |
| 9 | permissions | HIGH | RBAC permission definitions |
| 10 | colleges | HIGH | College data within universities |
| 11 | departments | HIGH | Department-level academic data |
| 12 | studyPlans | HIGH | Curriculum and course mapping |
| 13 | courses | HIGH | Course catalog with skills mapping |
| 14 | matchResults | HIGH | AI-generated match scores |
| 15 | skillGaps | HIGH | Skill gap analysis results |
| 16 | recommendations | MEDIUM | AI recommendations for users |
| 17 | notifications | MEDIUM | User notifications |
| 18 | auditLogs | MEDIUM | Security & operation audit trail |
| 19 | marketData | MEDIUM | Labor market intelligence |
| 20 | sessions | MEDIUM | Active user sessions |
| 21 | collegeCoordinators | MEDIUM | Coordinator profiles |
| 22 | aiEmbeddings | MEDIUM | Vector embeddings for AI |
| 23 | analyticsSnapshots | LOW | Periodic analytics data |
| 24 | trainingCourses | LOW | External training courses |
| 25 | messages | LOW | Internal messaging |

## Existing Schema Issues

### users.schema.ts
- MISSING: `roleId` (references roles collection)
- MISSING: `profileId` (polymorphic reference)
- MISSING: `loginAttempts`, `lockUntil` (security)
- MISSING: `twoFactorEnabled`, `twoFactorSecret`
- MISSING: `refreshTokens` array
- MISSING: `preferences` object (language, theme, notifications)
- MISSING: `isVerified` field
- Current has `status` but design uses `isActive`

### students.schema.ts
- MISSING: `academicInfo` embedded object (universityId, collegeId, departmentId as ObjectIds)
- MISSING: `personalInfo` embedded object (firstName, lastName, dateOfBirth, gender, phone, address)
- MISSING: `professionalProfile` (headline, careerInterests, preferredLocations, expectedSalary)
- MISSING: `languages` array
- MISSING: `experiences` array (work experience)
- MISSING: `bio`, `avatarUrl`
- MISSING: `cvData` embedded object (fileUrl, fileName, fileSize, parsedData, parsingConfidence)
- MISSING: `aiAnalysis` (summary, strengths, weaknesses, suggestedImprovements)
- MISSING: `aiMetrics` (readinessScore, employabilityIndex, skillDiversityScore)
- MISSING: `embeddings` (skillVector, experienceVector, interestVector, combinedVector)
- MISSING: `privacySettings` (profileVisibility, showGpa, showContact, allowCompanySearch)
- MISSING: `engagement` metrics
- Current: skills array lacks `skillId` reference, `category`, `proficiency`, `source`, `verified`, `acquiredAt`
- Current: projects array lacks `_id`, `githubUrl`, `liveUrl`, `images`, `startDate`, `endDate`, `isOngoing`, `teamSize`, `role`, `impact`
- Current: certifications lack `issueDate`, `expiryDate`, `credentialUrl`, `skills`

### companies.schema.ts
- MISSING: `profile.legalName`, `subIndustries`, `foundedYear`, `coverImageUrl`, `verified`, `verificationStatus`
- MISSING: `headquarters` embedded object
- MISSING: `locations` array
- MISSING: `contactInfo` (hrEmail, linkedInUrl)
- MISSING: `culture` (values, benefits, workEnvironment, dressCode)
- MISSING: `recruitment` preferences (preferredUniversities, minimumGpa, requiredLanguages, hiringGoals)
- MISSING: `analytics` (totalJobsPosted, totalApplications, averageMatchScore, acceptanceRate, timeToHire, topSkillsSought, topUniversities)
- Current is VERY basic compared to design

### universities.schema.ts
- MISSING: `shortName`, `foundedYear`, `type` (public/private), `accreditation`
- MISSING: `branding` (logoUrl, coverImageUrl, colors)
- MISSING: `contactInfo` (socialMedia)
- MISSING: `colleges` should be embedded with more detail
- MISSING: `analytics` (totalStudents, totalGraduates, employmentRate, topSkills, topEmployers, skillGapSummary)
- MISSING: `rankings` (overall, employability, industryReadiness)
- MISSING: `settings` (allowPublicAnalytics, dataRetentionDays)

### jobs.schema.ts
- MISSING: `postedBy` (userId)
- MISSING: `summary` (AI-generated)
- MISSING: `category`, `subcategory`
- MISSING: `requirements` embedded object (education, experience with min/max years)
- MISSING: `requiredSkills` should have `skillId`, `minimumProficiency`, `isMandatory`
- MISSING: `preferredSkills`
- MISSING: `languages`
- MISSING: `compensation` embedded object (salary min/max/currency/period, benefits, isNegotiable)
- MISSING: `aiAnalysis` (extractedSkills, skillWeights, embedding, sentiment, complexity)
- MISSING: `applicationSettings` (deadline, maxApplications, requiresCoverLetter)
- MISSING: `targetUniversities`, `targetColleges`, `targetDepartments`
- MISSING: `publishedAt`, `closedAt`
- Current has `skillEmbeddings` but design uses `aiAnalysis.embedding`

### applications.schema.ts
- MISSING: `matchSnapshot` (matchScore, acceptanceProbability, skillMatch, experienceMatch, educationMatch, overallFit)
- MISSING: `additionalDocuments`
- MISSING: `interview` details (scheduledAt, type, location, meetingLink, interviewerName, feedback, rating)
- MISSING: `companyReview` (reviewedAt, reviewedBy, decision, feedback, internalNotes)
- MISSING: `notificationsSent`
- Current `statusHistory` lacks `changedBy`, `notes`

### skill.schema.ts
- MISSING: `normalizedName`, `aliases`
- MISSING: `subcategory`
- MISSING: `parentSkillId`, `relatedSkills` (skill hierarchy)
- MISSING: `marketData` (demandScore, growthRate, averageSalary, topCompaniesHiring, relatedJobTitles)
- MISSING: `learningResources` array with full details
- MISSING: `isActive` flag

---

## Action Plan
1. Create all 18 missing schema files
2. Update all 7 existing schemas to match design document
3. Create modules, controllers, services for missing collections
4. Update app.module.ts to register all new modules
