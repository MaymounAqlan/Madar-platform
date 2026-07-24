# MADAR - CV Upload System Audit Report

## Executive Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Backend Controller | Partially Working | FileInterceptor exists but no multer config |
| Backend Service | Not Connected | Only saves URL string, no parsing |
| File Upload Service | Missing | No file-upload.service.ts |
| CV Parser Service | Missing | No cv-parser.service.ts |
| Multer Config | Missing | Uses default (unsafe) settings |
| AI Engine CV Parser | Working | Full PDF/DOCX parsing + skills extraction |
| AI Engine Router | Working | /parse endpoint with validation |
| Frontend UI | Static Only | No actual file input or API integration |
| Frontend API | Exists | uploadCV() function ready |
| File Storage | Not Configured | No GridFS or S3 |

---

## 1. Backend Analysis

### 1.1 `students.controller.ts` - Partially Working
- **Line 50**: `@UseInterceptors(FileInterceptor('file'))` - EXISTS
- **Line 60**: `@UploadedFile() file: any` - EXISTS
- **Line 62**: `const cvUrl = file ? '/uploads/${file.filename}' : ''` - HARDCODED PATH
- **Issues**:
  - No multer storage configuration (dest, limits, fileFilter)
  - No file size validation
  - No file type validation (accepts any file)
  - No GridFS/S3 integration - saves to local disk only
  - Hardcoded `/uploads/` path with no guarantee the directory exists

### 1.2 `students.service.ts` - Not Connected to AI
- **Line 78**: `handleCvUpload()` only saves `cvUrl` string to MongoDB
- **No CV parsing integration**: Does NOT call AI Engine endpoint
- **No skills extraction**: Does not update student.skills from parsed CV
- **No file metadata**: Does not save fileName, fileSize, fileType to cvData field
- The `cvData` schema field (lines 150+) is NOT populated by this service

### 1.3 `common/services/file-upload.service.ts` - MISSING
```
ERROR: File not found
```

### 1.4 `common/services/cv-parser.service.ts` - MISSING
```
ERROR: File not found
```

### 1.5 `config/multer.config.ts` - MISSING
```
ERROR: File not found
```

---

## 2. AI Engine Analysis

### 2.1 `madar-ai/models/cv_parser.py` - Fully Working
- **PDF extraction**: `_extract_text_from_pdf()` uses PyPDF2 (lines 152-175)
- **DOCX extraction**: `_extract_text_from_docx()` uses python-docx (lines 177-206)
- **Skills extraction**: Calls `SkillExtractor.extract_skills()` (line 223)
- **Personal info extraction**: Email, phone, LinkedIn, GitHub, name, location (lines 250-369)
- **Experience extraction**: Work history with duration calculation (lines 372-486)
- **Education extraction**: Degrees, institutions, GPA (lines 488-616)
- **Projects extraction**: Project names (lines 618-650)
- **Certifications**: Known cert matching (lines 652-723)
- **Embedding generation**: 384-dim vector for semantic matching (line 146)
- **Bilingual support**: English + Arabic section headers and patterns

### 2.2 `madar-ai/models/skill_extractor.py` - Fully Working
- **Comprehensive taxonomy**: 200+ technical skills, 25+ soft skills, 20+ certifications
- **Bilingual support**: English and Arabic aliases for each skill
- **Confidence scoring**: Context-aware scoring based on section proximity
- **Categories**: technical, soft, certification

### 2.3 `madar-ai/routers/cv.py` - Fully Working
- **POST /parse**: Upload file (PDF/DOCX) and get structured data (line 106)
- **POST /parse-text**: Parse raw CV text (line 199)
- **POST /extract-text**: Extract raw text only (line 255)
- **File validation**: Checks extension (pdf/docx) and file size (line 142-169)
- **Error handling**: Proper HTTP exceptions with logging

---

## 3. Frontend Analysis

### 3.1 `pages/student/StudentProfile.tsx` - Static UI Only
- **CV Tab**: Exists (line 299, tab key "cv")
- **Upload Area**: Visual drag-drop area (lines 303-334)
- **CRITICAL ISSUE**: No `<input type="file">` element exists
- **CRITICAL ISSUE**: No `onChange` handler for file selection
- **CRITICAL ISSUE**: No API call to `studentApi.uploadCV()`
- **State**: `cvUploaded` is hardcoded to `true` (line 41)
- **Filename**: Hardcoded "Ahmed_Mohammed_CV.pdf" (line 314)
- **AI Preview**: Static/hardcoded skills display (lines 338-365)
- **Re-upload button**: No click handler attached (line 321)

### 3.2 `components/CvUpload.tsx` - MISSING
```
ERROR: File not found
```

### 3.3 `services/studentApi.ts` - Ready but Unused
- **Line 16**: `uploadCV(file: File)` function EXISTS
- **Line 17-18**: Creates FormData with 'file' field
- **Line 19-23**: Posts to `/students/cv-upload` with multipart/form-data
- **Issue**: This function is NOT called from StudentProfile.tsx

---

## 4. Critical Issues Found

### Issue #1: No Multer Configuration (SEVERITY: HIGH)
The `FileInterceptor('file')` is used without any storage configuration:
- No `dest` directory specified - files may fail to save
- No file size limits - risk of disk fill attack
- No file type filter - accepts any file extension
- No filename customization - uses random multer filenames

### Issue #2: No File Storage Backend (SEVERITY: HIGH)
- No GridFS configuration for MongoDB file storage
- No S3/AWS integration for cloud storage
- Files stored on local disk only (`/uploads/`)
- No persistence strategy for uploaded files

### Issue #3: Backend Does NOT Call AI Engine (SEVERITY: CRITICAL)
The `handleCvUpload()` flow:
```
User uploads CV --> Multer saves file --> Only cvUrl saved to DB
                                    \\--> NO call to AI Engine /parse
                                    \\--> NO skills extracted
                                    \\--> NO cvData populated
```
The AI Engine CV parser exists and works but is NEVER invoked by the backend.

### Issue #4: Frontend UI is Non-Functional (SEVERITY: CRITICAL)
The CV upload UI:
- Has NO hidden `<input type="file">` element
- Has NO file selection trigger
- Has NO drag-and-drop handlers
- Has NO API integration
- Displays ONLY hardcoded mock data
- The `studentApi.uploadCV()` function exists but is never imported or used

### Issue #5: Schema Mismatch (SEVERITY: MEDIUM)
The `Student` schema has rich `cvData` field with:
- `fileUrl`, `fileName`, `fileType`, `fileSize`
- `parsedData.rawText`, `extractedSkills[]`, etc.
- `aiAnalysis.summary`, `strengths[]`, `weaknesses[]`

But `handleCvUpload()` only sets `cvUrl` (a string field that doesn't exist in schema), ignoring the rich `cvData` structure.

---

## 5. Risk Assessment

| Risk | Probability | Impact | Score |
|------|------------|--------|-------|
| Arbitrary file upload (no validation) | High | Critical | 9/10 |
| Disk space exhaustion (no size limit) | High | High | 8/10 |
| CV parsing never executes | Certain | High | 10/10 |
| Users cannot upload CVs via UI | Certain | Critical | 10/10 |
| Files lost on redeploy (local storage) | High | Medium | 7/10 |

---

## 6. Required Fixes (Priority Order)

### Priority 1 (Must Fix)
1. Add hidden `<input type="file">` to StudentProfile.tsx with proper handlers
2. Connect `studentApi.uploadCV()` to the file input onChange
3. Create `multer.config.ts` with diskStorage, limits, and fileFilter
4. Update `handleCvUpload()` to populate the full `cvData` schema

### Priority 2 (Should Fix)
5. Create `cv-parser.service.ts` that calls AI Engine `/parse` endpoint
6. Extract skills from parsed CV and update `student.skills[]`
7. Add upload progress indicator to frontend

### Priority 3 (Nice to Have)
8. Implement GridFS or S3 for persistent file storage
9. Add file type whitelist validation (PDF, DOCX only)
10. Add virus scanning for uploaded files
