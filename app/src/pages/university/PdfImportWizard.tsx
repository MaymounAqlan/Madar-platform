import { useEffect, useRef, useState } from 'react';
import { FileText, Upload, X, AlertCircle, Check, Trash2, Plus, Loader2, BookOpen, GraduationCap, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { universityApi } from '@/services/universityApi';
import { useLanguage } from '@/contexts/LanguageContext';
import type {
  ExtractedCourse,
  StudyPlanImportJob,
  ParsedStudyPlanResult,
  ParsedImportPlan,
  ExtractedSection,
  ElectiveGroup,
  InstitutionalAccess,
} from '@/types/university.types';
import { hasPermission } from '@/constants/permissions';

const input = 'h-9 w-full rounded-xl border border-[#dfe1dd] bg-white px-3 text-sm outline-none focus:border-[#9fe870]';
const textarea = 'min-h-16 w-full rounded-xl border border-[#dfe1dd] bg-white p-2 text-sm outline-none focus:border-[#9fe870]';
const select = 'h-9 w-full rounded-xl border border-[#dfe1dd] bg-white px-3 text-sm outline-none focus:border-[#9fe870]';
const smallBtn = 'inline-flex items-center gap-1 rounded-full border border-[#dfe1dd] px-3 py-1.5 text-xs font-bold hover:bg-[#f0f1ee]';
const primaryBtn = 'inline-flex items-center justify-center gap-2 rounded-full bg-[#9fe870] px-5 py-2 text-sm font-bold disabled:opacity-50';
const dangerBtn = 'inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-5 py-2 text-sm font-bold text-red-600 hover:bg-red-50';

const courseTypeOptions: Array<'required' | 'elective' | 'practical' | 'laboratory' | 'project' | 'internship'> = [
  'required', 'elective', 'practical', 'laboratory', 'project', 'internship',
];

const emptyCourse = (): ExtractedCourse => ({
  code: '',
  nameAr: '',
  nameEn: '',
  lectureHours: null,
  tutorialHours: null,
  practicalHours: null,
  laboratoryHours: null,
  creditHours: 3,
  year: null,
  level: 1,
  semester: 1,
  courseType: 'required',
  prerequisites: [],
  corequisites: [],
  eligibilityRules: [],
  learningOutcomes: [],
  extractedSkills: [],
  confidence: undefined,
  electiveGroup: null,
});

const emptyGroup = (): ElectiveGroup => ({
  id: undefined,
  nameAr: '',
  nameEn: '',
  minCredits: null,
  maxCredits: null,
  courseCodes: [],
});

interface PdfImportWizardProps {
  access: InstitutionalAccess | undefined;
  departments: Array<{ id: string; name: string; collegeName?: string }>;
  onClose: () => void;
  onSaved: () => void;
}

export default function PdfImportWizard({ access, departments, onClose, onSaved }: PdfImportWizardProps) {
  const { t } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const [departmentId, setDepartmentId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [job, setJob] = useState<StudyPlanImportJob | null>(null);
  const [phase, setPhase] = useState<'select' | 'uploading' | 'processing' | 'review' | 'failed'>('select');
  const [plan, setPlan] = useState<ParsedImportPlan>({});
  const [courses, setCourses] = useState<ExtractedCourse[]>([]);
  const [sections, setSections] = useState<ExtractedSection[]>([]);
  const [electiveGroups, setElectiveGroups] = useState<ElectiveGroup[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [unmatchedSkills, setUnmatchedSkills] = useState<string[]>([]);
  const [unmatchedFields, setUnmatchedFields] = useState<string[]>([]);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const canWrite = access?.role === 'university' || hasPermission(access?.permissions, 'study-plans:write');

  const loadParsedResult = (parsed: ParsedStudyPlanResult) => {
    setPlan(parsed.plan || {});
    setCourses((parsed.courses || []).map((c) => ({
      ...c,
      prerequisites: c.prerequisites ?? [],
      corequisites: c.corequisites ?? [],
      eligibilityRules: c.eligibilityRules ?? [],
      learningOutcomes: c.learningOutcomes ?? [],
      extractedSkills: c.extractedSkills ?? [],
    })));
    setSections(parsed.sections || []);
    setElectiveGroups(parsed.electiveGroups || []);
    setWarnings(parsed.warnings || []);
    setUnmatchedSkills(parsed.unmatchedSkills || []);
    setUnmatchedFields(parsed.unmatchedFields || []);
    setConfidenceScore(parsed.confidenceScore ?? null);
  };

  useEffect(() => {
    if (!job || phase !== 'processing') return;
    let cancelled = false;
    const poll = async () => {
      try {
        const latest = await universityApi.getImportJob(job.id);
        if (cancelled) return;
        setJob(latest);
        if (latest.status === 'ready_for_review') {
          if (latest.parsedResult) loadParsedResult(latest.parsedResult);
          setPhase('review');
          return;
        }
        if (latest.status === 'failed') {
          setPhase('failed');
          return;
        }
        if (['cancelled', 'confirmed'].includes(latest.status)) {
          onCloseRef.current();
          return;
        }
        setTimeout(poll, 3000);
      } catch (error) {
        setPhase('failed');
        toast.error(message(error, t('تعذر متابعة حالة الاستيراد', 'Unable to track import status')));
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [job, phase, t]);

  const handleUpload = async () => {
    if (!departmentId || !file) {
      toast.error(t('اختر القسم والملف أولاً', 'Select department and file first'));
      return;
    }
    try {
      setPhase('uploading');
      const created = await universityApi.importStudyPlanPdf(departmentId, file);
      setJob(created);
      if (created.status === 'ready_for_review') {
        if (created.parsedResult) loadParsedResult(created.parsedResult);
        setPhase('review');
      } else if (created.status === 'failed') {
        setPhase('failed');
      } else {
        setPhase('processing');
      }
    } catch (error) {
      setPhase('failed');
      toast.error(message(error, t('تعذر رفع ملف PDF', 'Unable to upload PDF file')));
    }
  };

  const handleConfirm = async () => {
    if (!job) return;
    try {
      setSaving(true);
      await universityApi.confirmImport(job.id, { plan, courses, electiveGroups });
      toast.success(t('تم حفظ الخطة والمقررات', 'Study plan and courses saved'));
      onSaved();
      onClose();
    } catch (error) {
      toast.error(message(error, t('تعذر حفظ الاستيراد', 'Unable to save import')));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    if (!job) {
      onClose();
      return;
    }
    try {
      setCancelling(true);
      await universityApi.cancelImport(job.id);
      toast.success(t('تم إلغاء الاستيراد', 'Import cancelled'));
      onClose();
    } catch (error) {
      toast.error(message(error, t('تعذر إلغاء الاستيراد', 'Unable to cancel import')));
    } finally {
      setCancelling(false);
    }
  };

  const updatePlan = (field: keyof ParsedImportPlan, value: unknown) => {
    setPlan((prev) => ({ ...prev, [field]: value }));
  };

  const updateCourse = (index: number, field: keyof ExtractedCourse, value: unknown) => {
    setCourses((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const updateCourseNumber = (index: number, field: keyof ExtractedCourse, value: string) => {
    const num = value === '' ? null : Number(value);
    setCourses((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: Number.isFinite(num) ? num : null } : c)));
  };

  const updateCourseArray = (index: number, field: 'prerequisites' | 'corequisites' | 'eligibilityRules' | 'learningOutcomes', value: string) => {
    const items = value.split(/[,،\n]+/).map((v) => v.trim()).filter(Boolean);
    setCourses((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: items } : c)));
  };

  const removeCourse = (index: number) => setCourses((prev) => prev.filter((_, i) => i !== index));
  const addCourse = () => setCourses((prev) => [...prev, emptyCourse()]);

  const updateGroup = (index: number, field: keyof ElectiveGroup, value: unknown) => {
    setElectiveGroups((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  };

  const updateGroupCodes = (index: number, value: string) => {
    const codes = value.split(/[,،\n]+/).map((v) => v.trim().toUpperCase()).filter(Boolean);
    setElectiveGroups((prev) => prev.map((g, i) => (i === index ? { ...g, courseCodes: codes } : g)));
  };

  const removeGroup = (index: number) => setElectiveGroups((prev) => prev.filter((_, i) => i !== index));
  const addGroup = () => setElectiveGroups((prev) => [...prev, emptyGroup()]);

  const courseTypeLabel = (type?: string | null) => {
    if (!type) return '';
    const labels: Record<string, string> = {
      required: t('إجباري', 'Required'),
      elective: t('اختياري', 'Elective'),
      practical: t('عملي', 'Practical'),
      laboratory: t('معمل', 'Laboratory'),
      project: t('مشروع', 'Project'),
      internship: t('تدريب', 'Internship'),
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
      <div className="relative flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#dfe1dd] px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <GraduationCap size={20} />
            {t('استيراد خطة دراسية من PDF', 'Import Study Plan from PDF')}
          </h2>
          <button type="button" onClick={handleCancel} className="rounded-full p-1 hover:bg-[#f0f1ee]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {phase === 'select' && (
            <div className="mx-auto max-w-xl space-y-5">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5b5e5a]">{t('القسم', 'Department')}</label>
                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={select}>
                  <option value="">{t('اختر القسم', 'Select department')}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.collegeName ? `${d.collegeName} - ` : ''}{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5b5e5a]">{t('ملف PDF', 'PDF file')}</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer rounded-xl border border-dashed border-[#dfe1dd] bg-white p-8 text-center hover:bg-[#f7f8f5]"
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-[#0e0f0c]">
                      <FileText size={18} /> {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                  ) : (
                    <div className="text-sm text-[#828782]">
                      <Upload size={24} className="mx-auto mb-2" />
                      {t('اضغط لاختيار ملف PDF', 'Click to select a PDF file')}
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleUpload} disabled={!departmentId || !file} className={primaryBtn}>
                  {t('رفع وبدء الاستيراد', 'Upload and start import')}
                </button>
                <button type="button" onClick={handleCancel} className={smallBtn}>{t('إلغاء', 'Cancel')}</button>
              </div>
            </div>
          )}

          {phase === 'uploading' && (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto mb-3 animate-spin text-[#9fe870]" size={32} />
              <p className="text-sm font-semibold text-[#5b5e5a]">{t('جاري رفع الملف...', 'Uploading file...')}</p>
            </div>
          )}

          {phase === 'processing' && (
            <div className="py-16 text-center">
              <Loader2 className="mx-auto mb-3 animate-spin text-[#9fe870]" size={32} />
              <p className="text-sm font-semibold text-[#5b5e5a]">{t('جاري تحليل الخطة...', 'Analyzing study plan...')}</p>
              <p className="mt-1 text-xs text-[#828782]">{t('الحالة الحالية:', 'Current status:')} {job?.status}</p>
            </div>
          )}

          {phase === 'failed' && (
            <div className="py-10 text-center">
              <AlertCircle className="mx-auto mb-3 text-red-500" size={40} />
              <p className="text-sm font-semibold text-red-600">{t('فشل استيراد الملف', 'Import failed')}</p>
              {job?.error && <p className="mt-2 text-xs text-[#5b5e5a]">{job.error}</p>}
              <div className="mt-4 flex justify-center gap-2">
                <button type="button" onClick={() => setPhase('select')} className={smallBtn}>{t('إعادة المحاولة', 'Retry')}</button>
                <button type="button" onClick={handleCancel} className={smallBtn}>{t('إغلاق', 'Close')}</button>
              </div>
            </div>
          )}

          {phase === 'review' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-[#dfe1dd] p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
                  <BookOpen size={16} /> {t('بيانات الخطة', 'Plan Information')}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label={t('الجامعة', 'University')} value={plan.universityName ?? ''} onChange={(v) => updatePlan('universityName', v)} />
                  <Field label={t('الكلية', 'College')} value={plan.collegeName ?? ''} onChange={(v) => updatePlan('collegeName', v)} />
                  <Field label={t('القسم', 'Department')} value={plan.departmentName ?? ''} onChange={(v) => updatePlan('departmentName', v)} />
                  <Field label={t('اسم البرنامج (ع)', 'Program name (Ar)')} value={plan.programNameAr ?? ''} onChange={(v) => updatePlan('programNameAr', v)} />
                  <Field label={t('اسم البرنامج (En)', 'Program name (En)')} value={plan.programNameEn ?? ''} onChange={(v) => updatePlan('programNameEn', v)} />
                  <Field label={t('نوع الدرجة', 'Degree type')} value={plan.degreeType ?? ''} onChange={(v) => updatePlan('degreeType', v)} />
                  <Field label={t('السنة الأكاديمية', 'Academic year')} value={plan.academicYear ?? ''} onChange={(v) => updatePlan('academicYear', v)} placeholder="2026-2027" />
                  <NumberField label={t('إجمالي الساعات', 'Total credits')} value={plan.totalCredits} onChange={(v) => updatePlan('totalCredits', v)} />
                  <NumberField label={t('عدد السنوات', 'Years count')} value={plan.yearsCount} onChange={(v) => updatePlan('yearsCount', v)} />
                  <NumberField label={t('عدد الفصول', 'Semesters count')} value={plan.semestersCount} onChange={(v) => updatePlan('semestersCount', v)} />
                </div>
              </div>

              {confidenceScore !== null && (
                <div className="flex items-center gap-2 rounded-xl bg-[#f7f8f5] p-3 text-xs">
                  <Check size={14} className="text-[#9fe870]" />
                  {t('درجة الثقة في الاستخراج:', 'Extraction confidence:')} <b>{Math.round(confidenceScore * 100)}%</b>
                </div>
              )}

              {sections.length > 0 && (
                <div className="rounded-xl border border-[#dfe1dd] p-4">
                  <h3 className="mb-2 text-sm font-bold">{t('الأقسام المستخرجة', 'Extracted Sections')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {sections.map((s, i) => (
                      <span key={i} className="rounded-full bg-[#E7FDD8] px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        {s.sectionType || t('قسم', 'Section')} {s.year || s.level || s.semester ? `(${[s.year, s.level, s.semester].filter(Boolean).join('/')})` : ''}
                        {s.courses ? ` - ${s.courses.length} ${t('مقرر', 'courses')}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-[#dfe1dd] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold">{t('المقررات المستخرجة', 'Extracted Courses')}</h3>
                  <button type="button" onClick={addCourse} className={smallBtn}><Plus size={13} /> {t('إضافة مقرر', 'Add course')}</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#f7f8f5] text-[#828782]">
                        <th className="whitespace-nowrap px-2 py-2 text-start">{t('الرمز', 'Code')}</th>
                        <th className="whitespace-nowrap px-2 py-2 text-start">{t('الاسم ع', 'Name Ar')}</th>
                        <th className="whitespace-nowrap px-2 py-2 text-start">{t('الاسم إن', 'Name En')}</th>
                        <th className="whitespace-nowrap px-1 py-2 text-start">L</th>
                        <th className="whitespace-nowrap px-1 py-2 text-start">T</th>
                        <th className="whitespace-nowrap px-1 py-2 text-start">P</th>
                        <th className="whitespace-nowrap px-1 py-2 text-start">Lab</th>
                        <th className="whitespace-nowrap px-1 py-2 text-start">{t('س', 'Cr')}</th>
                        <th className="whitespace-nowrap px-1 py-2 text-start">{t('سنة', 'Yr')}</th>
                        <th className="whitespace-nowrap px-1 py-2 text-start">{t('مستوى', 'Lvl')}</th>
                        <th className="whitespace-nowrap px-1 py-2 text-start">{t('فصل', 'Sem')}</th>
                        <th className="whitespace-nowrap px-2 py-2 text-start">{t('النوع', 'Type')}</th>
                        <th className="whitespace-nowrap px-2 py-2 text-start">{t('متطلب سابق', 'Pre')}</th>
                        <th className="whitespace-nowrap px-2 py-2 text-start">{t('متطلب مصاحب', 'Co')}</th>
                        <th className="whitespace-nowrap px-2 py-2 text-start">{t('شروط', 'Rules')}</th>
                        <th className="whitespace-nowrap px-2 py-2 text-start">{t('مجموعة', 'Group')}</th>
                        <th className="whitespace-nowrap px-1 py-2 text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course, index) => (
                        <tr key={index} className="border-t border-[#dfe1dd]">
                          <td className="px-1 py-1"><input value={course.code} onChange={(e) => updateCourse(index, 'code', e.target.value.toUpperCase())} className={`${input} !h-8`} /></td>
                          <td className="px-1 py-1"><input value={course.nameAr ?? ''} onChange={(e) => updateCourse(index, 'nameAr', e.target.value)} className={`${input} !h-8`} /></td>
                          <td className="px-1 py-1"><input value={course.nameEn ?? ''} onChange={(e) => updateCourse(index, 'nameEn', e.target.value)} className={`${input} !h-8`} /></td>
                          <td className="px-1 py-1"><input type="number" min={0} value={course.lectureHours ?? ''} onChange={(e) => updateCourseNumber(index, 'lectureHours', e.target.value)} className={`${input} !h-8 w-14`} /></td>
                          <td className="px-1 py-1"><input type="number" min={0} value={course.tutorialHours ?? ''} onChange={(e) => updateCourseNumber(index, 'tutorialHours', e.target.value)} className={`${input} !h-8 w-14`} /></td>
                          <td className="px-1 py-1"><input type="number" min={0} value={course.practicalHours ?? ''} onChange={(e) => updateCourseNumber(index, 'practicalHours', e.target.value)} className={`${input} !h-8 w-14`} /></td>
                          <td className="px-1 py-1"><input type="number" min={0} value={course.laboratoryHours ?? ''} onChange={(e) => updateCourseNumber(index, 'laboratoryHours', e.target.value)} className={`${input} !h-8 w-14`} /></td>
                          <td className="px-1 py-1"><input type="number" min={0} value={course.creditHours ?? ''} onChange={(e) => updateCourseNumber(index, 'creditHours', e.target.value)} className={`${input} !h-8 w-14`} /></td>
                          <td className="px-1 py-1"><input type="number" min={1} value={course.year ?? ''} onChange={(e) => updateCourseNumber(index, 'year', e.target.value)} className={`${input} !h-8 w-14`} /></td>
                          <td className="px-1 py-1"><input type="number" min={1} value={course.level ?? ''} onChange={(e) => updateCourseNumber(index, 'level', e.target.value)} className={`${input} !h-8 w-14`} /></td>
                          <td className="px-1 py-1"><input type="number" min={1} value={course.semester ?? ''} onChange={(e) => updateCourseNumber(index, 'semester', e.target.value)} className={`${input} !h-8 w-14`} /></td>
                          <td className="px-1 py-1">
                            <select value={course.courseType || 'required'} onChange={(e) => updateCourse(index, 'courseType', e.target.value)} className={`${select} !h-8`}>
                              {courseTypeOptions.map((opt) => (<option key={opt} value={opt}>{courseTypeLabel(opt)}</option>))}
                            </select>
                          </td>
                          <td className="px-1 py-1"><textarea value={(course.prerequisites ?? []).join('\n')} onChange={(e) => updateCourseArray(index, 'prerequisites', e.target.value)} className={`${textarea} !min-h-[2rem]`} rows={2} placeholder={t('واحد لكل سطر', 'one per line')} /></td>
                          <td className="px-1 py-1"><textarea value={(course.corequisites ?? []).join('\n')} onChange={(e) => updateCourseArray(index, 'corequisites', e.target.value)} className={`${textarea} !min-h-[2rem]`} rows={2} placeholder={t('واحد لكل سطر', 'one per line')} /></td>
                          <td className="px-1 py-1"><textarea value={(course.eligibilityRules ?? []).join('\n')} onChange={(e) => updateCourseArray(index, 'eligibilityRules', e.target.value)} className={`${textarea} !min-h-[2rem]`} rows={2} placeholder={t('واحد لكل سطر', 'one per line')} /></td>
                          <td className="px-1 py-1"><input value={course.electiveGroup ?? ''} onChange={(e) => updateCourse(index, 'electiveGroup', e.target.value || null)} className={`${input} !h-8 w-24`} /></td>
                          <td className="px-1 py-1 text-center"><button type="button" onClick={() => removeCourse(index)} className="rounded-full p-1 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button></td>
                        </tr>
                      ))}
                      {courses.length === 0 && (
                        <tr><td colSpan={17} className="py-6 text-center text-xs text-[#828782]">{t('لا توجد مقررات مستخرجة', 'No extracted courses')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-[#dfe1dd] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold">{t('المجموعات الاختيارية', 'Elective Groups')}</h3>
                  <button type="button" onClick={addGroup} className={smallBtn}><Plus size={13} /> {t('إضافة مجموعة', 'Add group')}</button>
                </div>
                {electiveGroups.length === 0 ? (
                  <p className="text-xs text-[#828782]">{t('لا توجد مجموعات اختيارية مستخرجة', 'No elective groups extracted')}</p>
                ) : (
                  <div className="space-y-3">
                    {electiveGroups.map((group, index) => (
                      <div key={index} className="grid gap-2 rounded-xl bg-[#f7f8f5] p-3 sm:grid-cols-2 lg:grid-cols-6">
                        <input value={group.nameAr ?? ''} onChange={(e) => updateGroup(index, 'nameAr', e.target.value)} placeholder={t('الاسم ع', 'Name Ar')} className={input} />
                        <input value={group.nameEn ?? ''} onChange={(e) => updateGroup(index, 'nameEn', e.target.value)} placeholder={t('الاسم إن', 'Name En')} className={input} />
                        <input type="number" min={0} value={group.minCredits ?? ''} onChange={(e) => updateGroup(index, 'minCredits', e.target.value === '' ? null : Number(e.target.value))} placeholder={t('حد أدنى', 'Min')} className={input} />
                        <input type="number" min={0} value={group.maxCredits ?? ''} onChange={(e) => updateGroup(index, 'maxCredits', e.target.value === '' ? null : Number(e.target.value))} placeholder={t('حد أعلى', 'Max')} className={input} />
                        <textarea value={(group.courseCodes ?? []).join('\n')} onChange={(e) => updateGroupCodes(index, e.target.value)} placeholder={t('رموز المقررات', 'Course codes')} className={`${textarea} !min-h-[2rem] sm:col-span-1`} rows={2} />
                        <div className="flex items-center justify-end">
                          <button type="button" onClick={() => removeGroup(index)} className="rounded-full p-1 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {unmatchedSkills.length > 0 && (
                <div className="rounded-xl border border-[#dfe1dd] p-4">
                  <h3 className="mb-2 text-sm font-bold">{t('مهارات غير مطابقة', 'Unmatched Skills')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {unmatchedSkills.map((skill, index) => (
                      <span key={`${skill}-${index}`} className="rounded-full bg-[#f0f1ee] px-2.5 py-1 text-xs font-semibold">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {unmatchedFields.length > 0 && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-xs text-amber-800">
                  <h3 className="mb-1 flex items-center gap-1 font-bold"><AlertTriangle size={13} /> {t('حقول غير واضحة', 'Unmatched Fields')}</h3>
                  <p>{unmatchedFields.join(' • ')}</p>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                  <h3 className="mb-1 font-bold">{t('تحذيرات', 'Warnings')}</h3>
                  <ul className="list-inside list-disc space-y-1">
                    {warnings.map((warning, index) => (<li key={index}>{warning}</li>))}
                  </ul>
                </div>
              )}

              {courses.some((c) => (c.extractedSkills ?? []).length > 0) && (
                <div className="rounded-xl border border-[#dfe1dd] p-4">
                  <h3 className="mb-2 text-sm font-bold">{t('المهارات المستخرجة', 'Extracted Skills')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {courses.flatMap((c) => c.extractedSkills ?? []).map((skill, index) => (
                      <span key={`${skill.name}-${index}`} className="rounded-full bg-[#E7FDD8] px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        {skill.name} ({Math.round(skill.confidence * 100)}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button type="button" onClick={handleConfirm} disabled={!canWrite || saving} className={primaryBtn}>
                  {saving ? t('جاري الحفظ...', 'Saving...') : t('حفظ كمسودة', 'Save as draft')}
                </button>
                <button type="button" onClick={handleCancel} disabled={cancelling} className={dangerBtn}>
                  {cancelling ? t('جاري الإلغاء...', 'Cancelling...') : t('إلغاء', 'Cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-[#828782]">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || ''} className={input} />
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value?: number | null; onChange: (value: number | null) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-[#828782]">{label}</label>
      <input
        type="number"
        min={0}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className={input}
      />
    </div>
  );
}

function message(error: unknown, fallback: string) {
  const value = (error as { response?: { data?: { message?: string | string[] } }; message?: string })?.response?.data?.message || (error as { message?: string })?.message;
  return Array.isArray(value) ? value.join('، ') : value || fallback;
}
