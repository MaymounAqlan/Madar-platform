# Frontend API Integration Audit Report
## MADAR Platform - Frontend Functional Examination

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Pages Examined | 12 |
| Pages Connected to API | **0** |
| Pages Using Static/Dummy Data | **12 (100%)** |
| Functional CRUD Buttons | **0** |
| API Hooks Available but Unused | **4 hooks files** |
| API Services Available but Unused | **8 service files** |

### Verdict: ALL 12 pages are **PURELY STATIC/DUMMY**. Zero API integration.

---

## Critical Discovery: The "Disconnected Infrastructure" Problem

The project has a **fully-built API infrastructure** that is completely disconnected from the pages:

- **Services Layer**: `/src/services/` - 8 API files with Axios client, auth interceptors, token refresh
- **Hooks Layer**: `/src/hooks/` - 4 custom hooks using React Query (`useQuery`, `useMutation`)
- **Pages Layer**: `/src/pages/` - 12 pages that **IGNORE** all of the above and import from `@/data/*` static files instead

```
Infrastructure:     SERVICES + HOOKS     [Fully Built] ----X---- [Disconnected]
                                                          |
Pages:              STATIC DATA imports  [Fully Static] <---
```

### Hooks Available (but unused by pages):
- `useStudent.ts` - 10 hooks: `useStudentProfile`, `useUpdateProfile`, `useUploadCV`, `useRecommendedJobs`, `useSkillGaps`, `useStudentApplications`, `useStudentInsights`, `useJobs`, `useJob`, `useApplyToJob`
- `useCompany.ts` - 9 hooks: `useCompanyDashboard`, `useCompanyJobs`, `useCreateJob`, `useUpdateJob`, `useDeleteJob`, `useCandidates`, `useCompanyApplications`, `useUpdateApplicationStatus`, `useCompanyAnalytics`
- `useUniversity.ts` - 5 hooks: `useUniversityDashboard`, `useUniversityStructure`, `useUpdateStructure`, `useUniversityStudents`, `useUniversityAnalytics`
- `useAuth.ts` - Auth with login, register, logout

### grep result: `No API hooks usage found in pages`

---

## Detailed Page-by-Page Analysis

---

## A. Student Portal Pages

---

### 1. StudentDashboard.tsx - STATIC

| Check | Result |
|-------|--------|
| Data Source | `@/data/student` - static imports |
| useEffect API call | None |
| useQuery / useMutation | None |
| onClick handlers | UI only (no API) |

```typescript
// Line 7 - Static data import ONLY
import { studentProfile, jobs, skillGaps, applications, aiInsights, dashboardMetrics } from '@/data/student';

// Lines 63-66 - All data sliced from static arrays
const recommendedJobs = jobs.slice(0, 5);
const topSkillGaps = skillGaps.slice(0, 3);
const recentApplications = applications.slice(0, 3);
const topInsights = aiInsights.slice(0, 3);
```

**Buttons without API calls:**
- Bookmark button (lines 179-184): toggles local state only, no API
- Apply button (Send icon): no onClick handler at all

---

### 2. StudentProfile.tsx - STATIC

| Check | Result |
|-------|--------|
| Data Source | `@/data/student` - static imports |
| Save button calls API | **NO** - only toggles `editing` state |
| useMutation | None |

```typescript
// Line 130 - "Save" button ONLY toggles editing state
<button onClick={() => setEditing(!editing)}>
  {editing ? t('Save') : t('Edit')}
</button>
```

**Critical Issue**: The Save button does NOT call any API. It merely toggles a boolean `editing` state. There is no form data submission, no `useUpdateProfile` hook imported, no `useMutation`.

**Other non-functional elements:**
- CV upload area: UI only, no actual upload (`useUploadCV` hook exists but unused)
- AI-suggested skills buttons: no API call on click (`+` buttons are decorative)
- All profile fields render static data from `studentProfile` object

---

### 3. StudentJobs.tsx - STATIC

| Check | Result |
|-------|--------|
| Data Source | `@/data/student` - static `jobs` array |
| Apply button calls API | **NO** - button has NO onClick handler |
| useMutation (useApplyToJob) | Available but **NOT imported** |

```tsx
// Line 283-286 - Apply button with NO onClick handler
<button className="...">
  <Send size={12} />
  {t('Apply')}
</button>
// ^^^ NO onClick prop! Completely non-functional.
```

**Available but unused**: `useApplyToJob` mutation hook exists in `useStudent.ts` (lines 89-99) with proper `queryClient.invalidateQueries()` - but **never imported or used**.

**Other issues:**
- Bookmark toggle: local state only (`setBookmarkedIds`), not persisted to server
- Filter/sort: client-side only on static array

---

### 4. StudentApplications.tsx - STATIC

| Check | Result |
|-------|--------|
| Data Source | `@/data/student` - static `applications` array |
| useEffect API call | None |
| useStudentApplications hook | Available but **NOT imported** |

```typescript
// Line 7 - Static data
import { applications } from '@/data/student';

// Lines 48-51 - Client-side filtering of static array
const filtered = useMemo(() => {
  if (activeFilter === 'all') return applications;
  return applications.filter(a => a.status === activeFilter);
}, [activeFilter]);
```

**Available but unused**: `useStudentApplications` hook exists in `useStudent.ts` (lines 56-62) - not imported.

---

### 5. StudentInsights.tsx - STATIC

| Check | Result |
|-------|--------|
| Data Source | `@/data/student` - static imports |
| Charts from API | **NO** - all charts from static data |
| useStudentInsights hook | Available but **NOT imported** |

```typescript
// Line 5 - Static data imports
import { radarSkills, skillGaps, marketTrends, careerPaths, learningResources, aiInsights } from '@/data/student';

// Lines 35-47 - Chart data derived from static arrays
const radarData = radarSkills.map(...);
const marketData = marketTrends.map(...);
```

**Available but unused**: `useStudentInsights` hook exists in `useStudent.ts` (lines 64-70) - not imported.

---

## B. Company Portal Pages

---

### 6. CompanyDashboard.tsx - STATIC

| Check | Result |
|-------|--------|
| Data Source | `@/data/company` - static imports |
| useCompanyDashboard hook | Available but **NOT imported** |

```typescript
// Lines 7-12 - Static data imports
import { jobs, candidates, upcomingInterviews, dashboardMetrics } from '@/data/company';
```

**Static hardcoded data:**
- Recruitment funnel (lines 158-163): Hardcoded numbers `[156, 89, 34, 12, 8]`
- "Post New Job" button: no onClick handler, no navigation

**Available but unused**: `useCompanyDashboard` hook in `useCompany.ts` (lines 10-16).

---

### 7. CompanyJobs.tsx - STATIC

| Check | Result |
|-------|--------|
| Data Source | `@/data/company` - static `jobs` array |
| Create Job form submits to API | **NO** |
| useCreateJob hook | Available but **NOT imported** |

```tsx
// Lines 458-465 - Publish Job button: NO onClick handler!
<div className="sticky bottom-0 ...">
  <button>Save Draft</button>       {/* NO onClick */}
  <button>Publish Job</button>      {/* NO onClick */}
</div>
```

**Critical Issue**: The entire job creation form with 20+ state variables (`jobTitle`, `jobDescription`, `requirements`, etc.) has NO submission handler. The "Publish Job" and "Save Draft" buttons do nothing.

```typescript
// Lines 81-87 - AI "analysis" is just a setTimeout simulation
const triggerAI = () => {
  setAiLoading(true);
  setTimeout(() => {
    setAiLoading(false);
    setAiExtracted(true);
  }, 1500);  // Fake 1.5s delay, no actual API call
};
```

**Available but unused**: `useCreateJob` mutation hook in `useCompany.ts` (lines 26-35) with proper cache invalidation.

---

### 8. CompanyCandidates.tsx - STATIC

| Check | Result |
|-------|--------|
| Data Source | `@/data/company` - static `candidates` array |
| Action buttons (Accept/Reject/Interview) | **NO API calls** |
| useUpdateApplicationStatus hook | Available but **NOT imported** |

```tsx
// Lines 582-599 - Action bar buttons: ALL have NO onClick handlers!
<div className="grid grid-cols-2 gap-2">
  <button><CheckCircle2 /> Shortlist</button>    {/* NO onClick */}
  <button><Calendar /> Interview</button>        {/* NO onClick */}
  <button><XCircle /> Reject</button>            {/* NO onClick */}
  <button><Mail /> Message</button>              {/* NO onClick */}
</div>
```

**All 4 action buttons in the candidate drawer are purely decorative.**

**Available but unused**: `useUpdateApplicationStatus` hook in `useCompany.ts` (lines 74-84).

---

### 9. CompanyAnalytics.tsx - STATIC

| Check | Result |
|-------|--------|
| Data Source | `@/data/company` - static imports |
| Charts from API | **NO** |
| useCompanyAnalytics hook | Available but **NOT imported** |

```typescript
// Lines 7-12 - Static data imports
import { recruitmentMetrics, monthlyApplications, topSkills, candidateSources, timeToFillData } from '@/data/company';
```

**Hardcoded chart data:**
- Recruitment Funnel (lines 122-128): Hardcoded array `[156, 89, 34, 12, 8]`
- Candidate Quality Distribution (lines 327-333): Hardcoded ranges and counts

**Available but unused**: `useCompanyAnalytics` hook in `useCompany.ts` (lines 86-92).

---

## C. University Portal Pages

---

### 10. UniversityDashboard.tsx - STATIC

| Check | Result |
|-------|--------|
| Data Source | `@/data/university` - static imports |
| Charts from API | **NO** |
| useUniversityDashboard hook | Available but **NOT imported** |

```typescript
// Lines 11-17 - Static data imports
import { employmentKPIs, colleges, employmentTrends, skillGaps, topEmployers, recentPlacements } from '@/data/university';
```

**Available but unused**: `useUniversityDashboard` hook in `useUniversity.ts` (lines 10-16).

---

### 11. UniversityStructure.tsx - STATIC

| Check | Result |
|-------|--------|
| Data Source | `@/data/university` - static imports |
| Add/Edit/Delete operations | **NO API calls** |
| useUpdateStructure hook | Available but **NOT imported** |

```tsx
// Lines 135-143 - Action buttons: NO onClick handlers
<button><Plus /> Add Department</button>     {/* NO onClick */}
<button><Edit /> Edit College</button>       {/* NO onClick */}

// Lines 224-228 - Add Plan button: NO onClick
<button><Plus /> Add Plan</button>           {/* NO onClick */}

// Lines 314-318 - Add Course button: NO onClick
<button><Plus /> Add Course</button>         {/* NO onClick */}

// Lines 77-82 - Edit/Delete department buttons: NO onClick
<button><Edit size={14} /></button>          {/* NO onClick */}
<button><Trash2 size={14} /></button>        {/* NO onClick */}
```

**Available but unused**: `useUpdateStructure` mutation hook in `useUniversity.ts` (lines 26-34).

---

### 12. UniversityStudents.tsx - STATIC

| Check | Result |
|-------|--------|
| Data Source | `@/data/university` - static imports |
| Add/Export/Import operations | **NO API calls** |
| useUniversityStudents hook | Available but **NOT imported** |

```tsx
// Lines 117-120 - Add Student button: NO onClick
<button><Plus /> Add Student</button>        {/* NO onClick */}

// Lines 109-112 - Export button: NO onClick
<button><Download /> Export</button>         {/* NO onClick */}

// Lines 113-116 - Import button: NO onClick
<button><Upload /> Import</button>           {/* NO onClick */}

// Lines 286-288 - View/Edit student buttons: NO onClick
<button><Eye /></button>                     {/* NO onClick */}
<button><Edit /></button>                    {/* NO onClick */}
```

**Available but unused**: `useUniversityStudents` hook in `useUniversity.ts` (lines 36-42).

---

## Summary Table

| # | Page | Data Source | useQuery | useMutation | useEffect API | onClick API | Status |
|---|------|-------------|----------|-------------|---------------|-------------|--------|
| 1 | StudentDashboard | `@/data/student` | No | No | No | No | **STATIC** |
| 2 | StudentProfile | `@/data/student` | No | No | No | No | **STATIC** |
| 3 | StudentJobs | `@/data/student` | No | No | No | No | **STATIC** |
| 4 | StudentApplications | `@/data/student` | No | No | No | No | **STATIC** |
| 5 | StudentInsights | `@/data/student` | No | No | No | No | **STATIC** |
| 6 | CompanyDashboard | `@/data/company` | No | No | No | No | **STATIC** |
| 7 | CompanyJobs | `@/data/company` | No | No | No | No | **STATIC** |
| 8 | CompanyCandidates | `@/data/company` | No | No | No | No | **STATIC** |
| 9 | CompanyAnalytics | `@/data/company` | No | No | No | No | **STATIC** |
| 10 | UniversityDashboard | `@/data/univ.` | No | No | No | No | **STATIC** |
| 11 | UniversityStructure | `@/data/univ.` | No | No | No | No | **STATIC** |
| 12 | UniversityStudents | `@/data/univ.` | No | No | No | No | **STATIC** |

**Score: 0/12 pages connected to API. 12/12 pages use static dummy data.**

---

## What EXISTS but is UNUSED

### Services (`/src/services/` - 8 files, fully built)
| File | Purpose |
|------|---------|
| `api.ts` | Axios client with interceptors, token refresh, auth headers |
| `authApi.ts` | Login, register, logout, get current user |
| `studentApi.ts` | Profile CRUD, CV upload, recommended jobs, skill gaps, applications, insights |
| `companyApi.ts` | Dashboard, jobs CRUD, candidates, applications, analytics |
| `jobsApi.ts` | Job listing, job detail, apply to job |
| `universityApi.ts` | Dashboard, structure, students, analytics |
| `matchingApi.ts` | Match calculation |
| `adminApi.ts` | Admin operations |

### Hooks (`/src/hooks/` - 4 files, fully built with React Query)
| File | Hooks Count | Key Hooks |
|------|-------------|-----------|
| `useStudent.ts` | 10 | `useStudentProfile`, `useUpdateProfile`, `useApplyToJob`, `useJobs`, `useStudentApplications` |
| `useCompany.ts` | 9 | `useCompanyDashboard`, `useCreateJob`, `useUpdateJob`, `useDeleteJob`, `useCandidates`, `useUpdateApplicationStatus` |
| `useUniversity.ts` | 5 | `useUniversityDashboard`, `useUniversityStudents`, `useUpdateStructure` |
| `useAuth.ts` | 1 | `useAuth` with login, register, logout |

---

## Recommendations

### Priority 1: Connect Student Pages to API
1. **StudentDashboard**: Replace static imports with `useStudentProfile()`, `useRecommendedJobs()`, `useStudentApplications()`, `useStudentInsights()`
2. **StudentProfile**: Wire Save button to `useUpdateProfile()` mutation; wire CV upload to `useUploadCV()`
3. **StudentJobs**: Wire job list to `useJobs()`; wire Apply button to `useApplyToJob()`
4. **StudentApplications**: Replace static array with `useStudentApplications()`
5. **StudentInsights**: Replace static data with `useStudentInsights()` and `useSkillGaps()`

### Priority 2: Connect Company Pages to API
6. **CompanyDashboard**: Use `useCompanyDashboard()`
7. **CompanyJobs**: Wire form to `useCreateJob()` mutation; use `useCompanyJobs()` for listing
8. **CompanyCandidates**: Use `useCandidates()`; wire action buttons to `useUpdateApplicationStatus()`
9. **CompanyAnalytics**: Use `useCompanyAnalytics()`

### Priority 3: Connect University Pages to API
10. **UniversityDashboard**: Use `useUniversityDashboard()`
11. **UniversityStructure**: Use `useUniversityStructure()`; wire edit to `useUpdateStructure()`
12. **UniversityStudents**: Use `useUniversityStudents()`

### Priority 4: Add Loading/Error States
All pages need loading skeletons and error handling for the async API calls.

---

*Report generated: Frontend API Integration Audit*
*Pages examined: 12 | API-connected: 0 | Static: 12*
