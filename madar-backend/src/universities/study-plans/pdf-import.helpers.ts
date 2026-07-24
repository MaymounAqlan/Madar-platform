import type { ParsedImportResult, ExtractedCourse, ExtractedSection, ElectiveGroup, ParsedImportPlan } from './schemas/study-plan-import.schema';

export const PLACEHOLDER_CODES = /^(XX|XXX| elective|اختياري|مقرر اختياري|تخصص اختياري|انتقائي)$/i;

export function nullIfEmpty(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  if (!str || str === '-' || str === '—' || str === 'N/A' || str === 'n/a' || str === 'غير متوفر') return null;
  return str;
}

export function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/,/g, '').trim();
  if (cleaned === '-' || cleaned === '—' || cleaned === '') return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function sanitizePlan(raw: unknown): ParsedImportPlan {
  const r = raw as any;
  return {
    universityName: nullIfEmpty(r?.universityName),
    collegeName: nullIfEmpty(r?.collegeName),
    departmentName: nullIfEmpty(r?.departmentName),
    programNameAr: nullIfEmpty(r?.programNameAr),
    programNameEn: nullIfEmpty(r?.programNameEn),
    degreeType: nullIfEmpty(r?.degreeType),
    academicYear: nullIfEmpty(r?.academicYear),
    version: toNumberOrNull(r?.version),
    totalCredits: toNumberOrNull(r?.totalCredits),
    yearsCount: toNumberOrNull(r?.yearsCount),
    semestersCount: toNumberOrNull(r?.semestersCount),
  };
}

export function cleanCodeArray(value: unknown): string[] {
  if (!value) return [];
  const split = (s: string) =>
    s.split(/[,،\n+\/]+|\s+(?:and|و)\s+/i)
      .map((part) => part.trim().replace(/^(and|و)\s+/i, '').trim().toUpperCase())
      .filter(Boolean);
  if (typeof value === 'string') return split(value);
  if (Array.isArray(value)) return value.map(String).flatMap(split);
  return [];
}

export function normalizeCourseType(value: unknown): ExtractedCourse['courseType'] {
  if (!value) return null;
  const normalized = String(value).toLowerCase().trim();
  const map: Record<string, string> = {
    required: 'required', إجباري: 'required', اجباري: 'required', compulsory: 'required', core: 'required',
    elective: 'elective', اختياري: 'elective', optional: 'elective', انتقائي: 'elective',
    practical: 'practical', عملي: 'practical',
    laboratory: 'laboratory', lab: 'laboratory', معمل: 'laboratory', مختبر: 'laboratory',
    project: 'project', مشروع: 'project', 'graduation project': 'project',
    internship: 'internship', training: 'internship', تدريب: 'internship',
  };
  return (map[normalized] as any) || null;
}

export function sanitizeCourse(raw: unknown): ExtractedCourse {
  const r = raw as any;
  const code = typeof r?.code === 'string' ? r.code.trim().toUpperCase() : '';
  return {
    code,
    nameAr: nullIfEmpty(r?.nameAr),
    nameEn: nullIfEmpty(r?.nameEn),
    lectureHours: toNumberOrNull(r?.lectureHours),
    tutorialHours: toNumberOrNull(r?.tutorialHours),
    practicalHours: toNumberOrNull(r?.practicalHours),
    laboratoryHours: toNumberOrNull(r?.laboratoryHours),
    creditHours: toNumberOrNull(r?.creditHours),
    year: toNumberOrNull(r?.year),
    level: toNumberOrNull(r?.level),
    semester: toNumberOrNull(r?.semester),
    courseType: normalizeCourseType(r?.courseType),
    prerequisites: cleanCodeArray(r?.prerequisites),
    corequisites: cleanCodeArray(r?.corequisites),
    eligibilityRules: Array.isArray(r?.eligibilityRules)
      ? r.eligibilityRules.filter((item: unknown) => item && String(item).trim()).map(String)
      : [],
    learningOutcomes: Array.isArray(r?.learningOutcomes)
      ? r.learningOutcomes.filter((item: unknown) => item && String(item).trim()).map(String)
      : [],
    extractedSkills: Array.isArray(r?.extractedSkills)
      ? r.extractedSkills.map((s: any) => ({
          name: String(s?.name || ''),
          confidence: Math.min(1, Math.max(0, toNumberOrNull(s?.confidence) ?? 0.5)),
          coverageType: ['theoretical', 'practical', 'mixed'].includes(s?.coverageType) ? s.coverageType : 'mixed',
          isSuggestion: true,
        })).filter((s: any) => s.name)
      : [],
    confidence: toNumberOrNull(r?.confidence),
    electiveGroup: nullIfEmpty(r?.electiveGroup),
  };
}

export function detectCircularPrerequisites(courses: ExtractedCourse[]): string[] {
  const graph = new Map<string, string[]>();
  for (const course of courses) {
    if (!course.code) continue;
    graph.set(
      course.code.toUpperCase(),
      (course.prerequisites || [])
        .map((p) => p.trim().toUpperCase())
        .filter((p) => courses.some((c) => c.code?.toUpperCase() === p)),
    );
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycle: string[] = [];
  const visit = (node: string, path: string[]): boolean => {
    if (visiting.has(node)) {
      const start = path.indexOf(node);
      cycle.push(...path.slice(start));
      return true;
    }
    if (visited.has(node)) return false;
    visiting.add(node);
    path.push(node);
    for (const dep of graph.get(node) || []) {
      if (visit(dep, path)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    path.pop();
    return false;
  };
  for (const node of graph.keys()) {
    if (visit(node, [])) break;
  }
  return cycle;
}

export function postProcessAiResult(aiResult: unknown): ParsedImportResult {
  const raw = aiResult as any;
  const plan = sanitizePlan(raw?.plan || {});
  let courses: ExtractedCourse[] = [];

  const rawCourses = Array.isArray(raw?.courses) ? raw.courses : [];
  const rawSections: ExtractedSection[] = Array.isArray(raw?.sections) ? raw.sections : [];

  for (const item of rawCourses) {
    courses.push(sanitizeCourse(item));
  }
  for (const section of rawSections) {
    const sectionCourses = Array.isArray(section?.courses) ? section.courses : [];
    for (const item of sectionCourses) {
      const sanitized = sanitizeCourse(item);
      if (sanitized.year == null && section.year != null) sanitized.year = section.year;
      if (sanitized.level == null && section.level != null) sanitized.level = section.level;
      if (sanitized.semester == null && section.semester != null) sanitized.semester = section.semester;
      courses.push(sanitized);
    }
  }

  const seenCodes = new Set<string>();
  const deduped: ExtractedCourse[] = [];
  const duplicateWarnings: string[] = [];
  for (const course of courses) {
    if (!course.code) continue;
    const upper = course.code.toUpperCase();
    if (seenCodes.has(upper)) {
      duplicateWarnings.push(`Duplicate course code detected: ${course.code}`);
      continue;
    }
    seenCodes.add(upper);
    deduped.push(course);
  }
  courses = deduped;

  const warnings: string[] = Array.isArray(raw?.warnings) ? [...raw.warnings] : [];
  const unmatchedFields: string[] = Array.isArray(raw?.unmatchedFields) ? [...raw.unmatchedFields] : [];

  if (duplicateWarnings.length) warnings.push(...duplicateWarnings);

  const allCodes = new Set(courses.map((c) => c.code?.toUpperCase()).filter(Boolean));
  for (const course of courses) {
    for (const prereq of course.prerequisites || []) {
      if (!prereq) continue;
      const upper = prereq.toUpperCase();
      if (!allCodes.has(upper) && !PLACEHOLDER_CODES.test(upper)) {
        warnings.push(`Prerequisite ${prereq} for ${course.code} was not found in the extracted courses`);
      }
    }
    if (PLACEHOLDER_CODES.test(course.code || '')) {
      warnings.push(`Course code "${course.code}" appears to be a placeholder and requires review`);
    }
  }

  const circular = detectCircularPrerequisites(courses);
  if (circular.length) warnings.push(`Circular prerequisites detected: ${circular.join(' → ')}`);

  const electiveGroups: ElectiveGroup[] = (Array.isArray(raw?.electiveGroups) ? raw.electiveGroups : []).map((g: any) => ({
    id: g?.id ? String(g.id) : undefined,
    nameAr: nullIfEmpty(g?.nameAr),
    nameEn: nullIfEmpty(g?.nameEn),
    minCredits: toNumberOrNull(g?.minCredits),
    maxCredits: toNumberOrNull(g?.maxCredits),
    courseCodes: Array.isArray(g?.courseCodes) ? g.courseCodes.map(String) : [],
  }));

  let confidenceScore = toNumberOrNull(raw?.confidenceScore);
  if (confidenceScore == null && courses.length) {
    const scores = courses.map((c) => c.confidence ?? 0).filter((v) => v > 0);
    confidenceScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  if (!plan.academicYear) unmatchedFields.push('academicYear');
  if (!plan.totalCredits) unmatchedFields.push('totalCredits');
  if (!plan.programNameAr && !plan.programNameEn) unmatchedFields.push('programName');

  return { plan, sections: rawSections, courses, electiveGroups, warnings, unmatchedFields, confidenceScore };
}

export function buildFallbackResult(text: string): ParsedImportResult {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const coursePattern = /^([A-Z]{2,5}\s*\d{3,4})\s*[-:–]\s*(.+)/;
  const courses: ExtractedCourse[] = [];

  for (const line of lines) {
    const match = line.match(coursePattern);
    if (match) {
      courses.push({
        code: match[1].replace(/\s+/g, ''),
        nameEn: match[2].trim(),
        nameAr: null,
        lectureHours: null,
        tutorialHours: null,
        practicalHours: null,
        laboratoryHours: null,
        creditHours: null,
        year: null,
        level: null,
        semester: null,
        courseType: 'required',
        prerequisites: [],
        corequisites: [],
        eligibilityRules: [],
        learningOutcomes: [],
        extractedSkills: [],
        confidence: 0.3,
        electiveGroup: null,
      });
    }
  }

  return {
    plan: {
      universityName: null, collegeName: null, departmentName: null,
      programNameAr: null, programNameEn: null, degreeType: null,
      academicYear: null, version: null, totalCredits: null, yearsCount: null, semestersCount: null,
    },
    sections: [],
    courses,
    electiveGroups: [],
    warnings: ['AI analysis unavailable. Only basic text pattern matching was used. Please review and complete the data manually.'],
    unmatchedFields: ['academicYear', 'totalCredits', 'programName'],
    confidenceScore: courses.length > 0 ? 0.3 : 0.0,
  };
}
