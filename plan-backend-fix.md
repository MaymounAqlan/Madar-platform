# Backend Fix Plan - 144 TypeScript Errors

## Error Categories

### 1. MISSING SCHEMA FILES (14 files)
- src/analytics/schemas/analytics-snapshot.schema.ts
- src/auth/schemas/session.schema.ts
- src/common/schemas/audit-log.schema.ts
- src/common/schemas/message.schema.ts
- src/common/schemas/notification.schema.ts
- src/matching/schemas/ai-embedding.schema.ts
- src/matching/schemas/match-result.schema.ts
- src/matching/schemas/recommendation.schema.ts
- src/matching/schemas/skill-gap.schema.ts
- src/skills/schemas/market-data.schema.ts
- src/skills/schemas/training-course.schema.ts
- src/universities/schemas/college-coordinator.schema.ts
- src/universities/schemas/college.schema.ts
- src/universities/schemas/department.schema.ts
- src/universities/schemas/study-plan.schema.ts
- src/universities/schemas/course.schema.ts
- src/users/schemas/permission.schema.ts
- src/users/schemas/role.schema.ts

### 2. SCHEMA/SERVICE MISMATCH
- User schema: missing `role` property access
- Company schema: missing `_id`, `nameAr`, `industry` on Company type
- Student schema: missing `skillGaps`, `profileCompletion`
- Job schema: missing `viewsCount`, `requiredSkills`, `createdAt`
- Application schema: missing `createdAt`
- MatchResult schema: missing `acceptanceProbability`
- University schema: missing `_id`, `nameAr`, analytics props
- UserRole enum: missing COORDINATOR

### 3. SERVICE ERRORS
- companies.service.ts: Company type properties
- matching.service.ts: skill.level vs skill.proficiency
- students.service.ts: schema property names
- universities.service.ts: University type properties
- users/admin.service.ts: getMetrics, getActivityLog, admin().ping()

### 4. CONTROLLER ERRORS
- users.controller.ts: getMetrics -> getAIMetrics, getActivityLog missing
- universities.controller.ts: UserRole.COORDINATOR
- students.controller.ts: Express.Multer.File

### 5. IMPORT ERROR
- main.ts: cookieParser namespace import

### 6. TEST ERRORS
- auth.service.spec.ts: ApiResponse, tokens, RegisterDto
- companies.service.spec.ts: getAnalytics arguments
