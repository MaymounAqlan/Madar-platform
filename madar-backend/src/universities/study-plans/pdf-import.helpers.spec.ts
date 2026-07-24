import {
  cleanCodeArray,
  normalizeCourseType,
  nullIfEmpty,
  toNumberOrNull,
  sanitizeCourse,
  postProcessAiResult,
  detectCircularPrerequisites,
  buildFallbackResult,
} from './pdf-import.helpers';

describe('pdf-import helpers', () => {
  describe('nullIfEmpty', () => {
    it('returns null for empty, dash, and N/A values', () => {
      expect(nullIfEmpty('')).toBeNull();
      expect(nullIfEmpty('-')).toBeNull();
      expect(nullIfEmpty('—')).toBeNull();
      expect(nullIfEmpty('N/A')).toBeNull();
      expect(nullIfEmpty(null)).toBeNull();
    });

    it('returns trimmed string for valid values', () => {
      expect(nullIfEmpty('  Architecture  ')).toBe('Architecture');
    });
  });

  describe('toNumberOrNull', () => {
    it('returns null for non-numeric values', () => {
      expect(toNumberOrNull('')).toBeNull();
      expect(toNumberOrNull('-')).toBeNull();
      expect(toNumberOrNull('abc')).toBeNull();
    });

    it('parses integers and decimals', () => {
      expect(toNumberOrNull('3')).toBe(3);
      expect(toNumberOrNull(4.5)).toBe(4.5);
      expect(toNumberOrNull('1,200')).toBe(1200);
    });
  });

  describe('cleanCodeArray', () => {
    it('splits multiple codes from a string', () => {
      expect(cleanCodeArray('MATH101, and PHYS102 و CHEM103')).toEqual(['MATH101', 'PHYS102', 'CHEM103']);
    });

    it('flattens arrays of strings', () => {
      expect(cleanCodeArray(['MATH101, PHYS102', 'CHEM103'])).toEqual(['MATH101', 'PHYS102', 'CHEM103']);
    });
  });

  describe('normalizeCourseType', () => {
    it('normalizes Arabic and English labels', () => {
      expect(normalizeCourseType('إجباري')).toBe('required');
      expect(normalizeCourseType('اختياري')).toBe('elective');
      expect(normalizeCourseType('تدريب')).toBe('internship');
      expect(normalizeCourseType('مشروع')).toBe('project');
    });

    it('returns null for unknown values', () => {
      expect(normalizeCourseType('')).toBeNull();
      expect(normalizeCourseType(null)).toBeNull();
    });
  });

  describe('sanitizeCourse', () => {
    it('trims and uppercases code and normalizes fields', () => {
      const result = sanitizeCourse({
        code: ' arch 101 ',
        nameAr: '  التصميم المعماري  ',
        nameEn: 'Architectural Design',
        creditHours: '3',
        lectureHours: '2',
        tutorialHours: '-',
        courseType: 'إجباري',
        prerequisites: 'ARCH100, and MATH101',
        corequisites: '',
        confidence: 0.85,
      });
      expect(result.code).toBe('ARCH 101');
      expect(result.nameAr).toBe('التصميم المعماري');
      expect(result.creditHours).toBe(3);
      expect(result.lectureHours).toBe(2);
      expect(result.tutorialHours).toBeNull();
      expect(result.courseType).toBe('required');
      expect(result.prerequisites).toEqual(['ARCH100', 'MATH101']);
      expect(result.corequisites).toEqual([]);
      expect(result.confidence).toBe(0.85);
    });
  });

  describe('postProcessAiResult', () => {
    it('detects duplicate course codes', () => {
      const result = postProcessAiResult({
        plan: { academicYear: '2026-2027', totalCredits: 120 },
        courses: [
          { code: 'ARCH101', nameEn: 'A', creditHours: 3, confidence: 0.9 },
          { code: 'ARCH101', nameEn: 'B', creditHours: 3, confidence: 0.8 },
        ],
      });
      expect(result.courses).toHaveLength(1);
      expect(result.warnings.some((w) => w.includes('Duplicate'))).toBe(true);
    });

    it('detects missing prerequisites', () => {
      const result = postProcessAiResult({
        plan: { academicYear: '2026-2027', totalCredits: 120 },
        courses: [
          { code: 'ARCH201', prerequisites: ['ARCH999'], confidence: 0.9 },
        ],
      });
      expect(result.warnings.some((w) => w.includes('Prerequisite ARCH999'))).toBe(true);
    });

    it('detects circular prerequisites', () => {
      const result = postProcessAiResult({
        plan: { academicYear: '2026-2027', totalCredits: 120 },
        courses: [
          { code: 'A', prerequisites: ['B'], confidence: 0.9 },
          { code: 'B', prerequisites: ['A'], confidence: 0.9 },
        ],
      });
      expect(result.warnings.some((w) => w.includes('Circular'))).toBe(true);
    });

    it('flags placeholder course codes', () => {
      const result = postProcessAiResult({
        plan: { academicYear: '2026-2027', totalCredits: 120 },
        courses: [{ code: 'XX', nameEn: 'Elective placeholder', confidence: 0.4 }],
      });
      expect(result.warnings.some((w) => w.includes('placeholder'))).toBe(true);
    });

    it('flattens sections into top-level courses and inherits grouping', () => {
      const result = postProcessAiResult({
        plan: { academicYear: '2026-2027', totalCredits: 120 },
        sections: [
          { year: 1, semester: 1, courses: [{ code: 'ARCH101', confidence: 0.9 }] },
        ],
      });
      expect(result.courses).toHaveLength(1);
      expect(result.courses[0].year).toBe(1);
      expect(result.courses[0].semester).toBe(1);
    });
  });

  describe('detectCircularPrerequisites', () => {
    it('returns empty when no cycles exist', () => {
      const courses = [
        { code: 'A', prerequisites: ['B'] },
        { code: 'B', prerequisites: [] },
      ] as any;
      expect(detectCircularPrerequisites(courses)).toEqual([]);
    });

    it('finds a cycle', () => {
      const courses = [
        { code: 'A', prerequisites: ['B'] },
        { code: 'B', prerequisites: ['A'] },
      ] as any;
      expect(detectCircularPrerequisites(courses).length).toBeGreaterThan(0);
    });
  });

  describe('buildFallbackResult', () => {
    it('extracts course codes from text', () => {
      const text = 'ARCH101 - Architectural Design\nMATH102: Calculus';
      const result = buildFallbackResult(text);
      expect(result.courses).toHaveLength(2);
      expect(result.courses[0].code).toBe('ARCH101');
      expect(result.courses[1].code).toBe('MATH102');
      expect(result.confidenceScore).toBe(0.3);
    });

    it('returns zero confidence for empty text', () => {
      const result = buildFallbackResult('');
      expect(result.courses).toHaveLength(0);
      expect(result.confidenceScore).toBe(0);
    });
  });
});
