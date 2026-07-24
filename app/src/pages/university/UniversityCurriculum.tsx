import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, BookOpen, BrainCircuit, Check, Edit3, FileUp, Library, RefreshCw, RotateCcw, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import DevelopmentAutofillButton from '@/components/DevelopmentAutofillButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInstitutionalAccess } from '@/hooks/useUniversity';
import { universityApi } from '@/services/universityApi';
import PdfImportWizard from './PdfImportWizard';

import type { AcademicRecommendation, UniversityCourse, UniversityStudyPlan } from '@/types/university.types';
import { generateAcademicRecommendationTestData, generateCourseTestData, generateStudyPlanTestData } from '@/utils/testDataGenerator';
import { hasPermission } from '@/constants/permissions';

type View = 'plans' | 'courses' | 'analysis' | 'recommendations';
type ReviewTarget = { kind: 'plan' | 'recommendation'; id: string; title: string } | null;

const emptyPlan = {
  departmentId: '',
  name: '',
  nameAr: '',
  description: '',
  academicYear: '',
  totalCreditHours: 132,
  levelsCount: 4,
  semestersCount: 2,
};

const emptyCourse = {
  studyPlanId: '',
  code: '',
  name: '',
  nameAr: '',
  description: '',
  descriptionAr: '',
  descriptionEn: '',
  creditHours: 3,
  level: 1,
  semester: 1,
  type: 'required' as 'required' | 'elective' | 'practical' | 'laboratory' | 'project' | 'internship',
  prerequisites: [] as string[],
  corequisites: [] as string[],
  learningOutcomes: '',
  learningOutcomesAr: '',
  learningOutcomesEn: ''
};

const emptyRecommendation = {
  title: '',
  description: '',
  type: 'add_course',
  studyPlanId: '',
  affectedCourses: [] as string[],
  affectedSkills: [] as string[],
  evidence: '',
  marketDemand: 50,
  studentImpact: '',
  priority: 'medium'
};

const input = 'h-11 w-full rounded-xl border border-[#dfe1dd] bg-white px-3 text-sm outline-none focus:border-[#9fe870]';
const label = 'block text-xs font-bold text-[#5b5e5a] mb-1';

export default function UniversityCurriculum() {
  const { t } = useLanguage();
  const client = useQueryClient();
  const [view, setView] = useState<View>('plans');
  const [departmentId, setDepartmentId] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [editingPlan, setEditingPlan] = useState<UniversityStudyPlan | null>(null);
  const [detailsPlan, setDetailsPlan] = useState<UniversityStudyPlan | null>(null);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [editingCourse, setEditingCourse] = useState<UniversityCourse | null>(null);
  const [detailsCourse, setDetailsCourse] = useState<UniversityCourse | null>(null);
  const [skillCourse, setSkillCourse] = useState<UniversityCourse | null>(null);
  const [skillForm, setSkillForm] = useState({ skillId: '', coverageLevel: 3, coverageType: 'mixed' as const, assessmentMethod: 'project', notes: '' });
  const [recommendationForm, setRecommendationForm] = useState(emptyRecommendation);
  const [editingRecommendation, setEditingRecommendation] = useState<AcademicRecommendation | null>(null);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'changes_requested' | 'under_review'>('approved');
  const [reviewReason, setReviewReason] = useState('');
  const [showImportWizard, setShowImportWizard] = useState(false);

  const access = useInstitutionalAccess();
  const structure = useQuery({ queryKey: ['university', 'structure'], queryFn: universityApi.getStructure });
  const departments = useMemo(
    () => structure.data?.colleges.flatMap((college) => college.departments.map((department) => ({ ...department, collegeName: college.name }))) ?? [],
    [structure.data]
  );

  const permissions = access.data?.permissions ?? [];
  const canWritePlan = access.data?.role === 'university' || hasPermission(permissions, 'study-plans:write');
  const canWriteCourse = access.data?.role === 'university' || hasPermission(permissions, 'courses:write');
  const canMapSkill = access.data?.role === 'university' || hasPermission(permissions, 'course-skills:manage');
  const canRunAnalysis = access.data?.role === 'university' || hasPermission(permissions, 'curriculum-analysis:run');
  const canWriteRecommendation = access.data?.role === 'university' || hasPermission(permissions, 'study-plans:write');
  const canReview = access.data?.role === 'university';

  const plans = useQuery({
    queryKey: ['university', 'study-plans', departmentId, search, status],
    queryFn: () => universityApi.getStudyPlans({ departmentId: departmentId || undefined, search: search || undefined, status: status || undefined, includeArchived: true })
  });
  const courses = useQuery({
    queryKey: ['university', 'courses', departmentId, search, status],
    queryFn: () => universityApi.getCourses({ departmentId: departmentId || undefined, search: search || undefined, includeArchived: true })
  });
  const skills = useQuery({ queryKey: ['skills', 'curriculum'], queryFn: () => universityApi.getSkills({ limit: 100 }), enabled: view === 'courses' });
  const recommendations = useQuery({
    queryKey: ['university', 'academic-recommendations', departmentId, search, status],
    queryFn: () => universityApi.getAcademicRecommendations({ departmentId: departmentId || undefined, search: search || undefined, status: status || undefined })
  });
  const analysis = useQuery({
    queryKey: ['university', 'curriculum-analysis', departmentId],
    queryFn: () => universityApi.analyzeCurriculum(departmentId),
    enabled: Boolean(departmentId)
  });
  const refresh = () => client.invalidateQueries({ queryKey: ['university'] });

  const savePlan = useMutation({
    mutationFn: () => {
      const payload = {
        ...planForm,
        levelsCount: planForm.levelsCount,
        semestersCount: planForm.semestersCount,
      };
      return editingPlan ? universityApi.updateStudyPlan(editingPlan.id, payload) : universityApi.createStudyPlan(payload);
    },
    onSuccess: () => {
      toast.success(t('تم حفظ الخطة الدراسية', 'Study plan saved'));
      setPlanForm(emptyPlan);
      setEditingPlan(null);
      refresh();
    },
    onError: (error) => toast.error(message(error, t('تعذر حفظ الخطة الدراسية', 'Unable to save study plan'))),
  });

  const saveCourse = useMutation({
    mutationFn: () => {
      const payload = {
        ...courseForm,
        corequisites: courseForm.corequisites,
        learningOutcomes: courseForm.learningOutcomes.split('\n').map((value) => value.trim()).filter(Boolean),
        learningOutcomesAr: courseForm.learningOutcomesAr.split('\n').map((value) => value.trim()).filter(Boolean),
        learningOutcomesEn: courseForm.learningOutcomesEn.split('\n').map((value) => value.trim()).filter(Boolean)
      };
      return editingCourse ? universityApi.updateCourse(editingCourse.id, payload) : universityApi.createCourse(payload);
    },
    onSuccess: () => {
      toast.success(t('تم حفظ المقرر وبدأ التحليل التلقائي', 'Course saved and automatic analysis started'));
      setCourseForm(emptyCourse);
      setEditingCourse(null);
      refresh();
    },
    onError: (error) => toast.error(message(error, t('تعذر حفظ المقرر', 'Unable to save course'))),
  });

  const saveSkill = useMutation({
    mutationFn: () => universityApi.mapCourseSkill(skillCourse!.id, skillForm),
    onSuccess: () => {
      toast.success(t('تم ربط المهارة وبدأ تحديث التحليل', 'Skill mapped and analysis refresh started'));
      setSkillCourse(null);
      setSkillForm({ skillId: '', coverageLevel: 3, coverageType: 'mixed', assessmentMethod: 'project', notes: '' });
      refresh();
    },
    onError: (error) => toast.error(message(error, t('تعذر ربط المهارة', 'Unable to map skill'))),
  });

  const removeSkill = useMutation({
    mutationFn: ({ courseId, skillId }: { courseId: string; skillId: string }) => universityApi.unmapCourseSkill(courseId, skillId),
    onSuccess: () => {
      toast.success(t('تم إزالة المهارة وبدأ تحديث التحليل', 'Skill removed and analysis refresh started'));
      refresh();
    },
    onError: (error) => toast.error(message(error, t('تعذر إزالة المهارة', 'Unable to remove skill'))),
  });

  const saveRecommendation = useMutation({
    mutationFn: () => {
      const payload = {
        ...recommendationForm,
        departmentId,
        studyPlanId: recommendationForm.studyPlanId || undefined,
        evidence: recommendationForm.evidence.split('\n').map((value) => value.trim()).filter(Boolean)
      };
      return editingRecommendation ? universityApi.updateAcademicRecommendation(editingRecommendation.id, payload) : universityApi.createAcademicRecommendation(payload);
    },
    onSuccess: () => {
      toast.success(t('تم حفظ التوصية', 'Recommendation saved'));
      setRecommendationForm(emptyRecommendation);
      setEditingRecommendation(null);
      refresh();
    },
    onError: (error) => toast.error(message(error, t('تعذر حفظ التوصية', 'Unable to save recommendation'))),
  });

  const action = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      if (type === 'submit-plan') return universityApi.submitStudyPlan(id);
      if (type === 'activate-plan') return universityApi.activateStudyPlan(id);
      if (type === 'new-version') return universityApi.createStudyPlanVersion(id);
      if (type === 'archive-plan') return universityApi.archiveStudyPlan(id);
      if (type === 'archive-course') return universityApi.archiveCourse(id);
      if (type === 'restore-course') return universityApi.restoreCourse(id);
      if (type === 'submit-recommendation') return universityApi.submitAcademicRecommendation(id);
      if (type === 'refresh-analysis') return universityApi.analyzeCurriculum(id, true);
      throw new Error('Unsupported action');
    },
    onSuccess: () => {
      toast.success(t('تم تنفيذ العملية', 'Action completed'));
      refresh();
    },
    onError: (error) => toast.error(message(error, t('تعذر تنفيذ العملية', 'Action failed'))),
  });

  const review = useMutation({
    mutationFn: () => (reviewTarget?.kind === 'plan'
      ? universityApi.reviewStudyPlan(reviewTarget.id, reviewStatus, reviewReason || undefined)
      : universityApi.reviewAcademicRecommendation(reviewTarget!.id, reviewStatus, reviewReason || undefined)) as Promise<unknown>,
    onSuccess: () => {
      toast.success(t('تم حفظ قرار المراجعة وإرسال الإشعار', 'Review decision saved and notification sent'));
      setReviewTarget(null);
      setReviewReason('');
      refresh();
    },
    onError: (error) => toast.error(message(error, t('تعذر حفظ قرار المراجعة', 'Unable to save review decision'))),
  });

  const startPlanEdit = (plan: UniversityStudyPlan) => {
    setEditingPlan(plan);
    const levelsCount = plan.levels?.length ?? 4;
    const semestersCount = plan.levels?.[0]?.semesters?.length ?? 2;
    setPlanForm({
      departmentId: plan.departmentId,
      name: plan.name,
      nameAr: plan.nameAr || '',
      description: plan.description || '',
      academicYear: plan.academicYear,
      totalCreditHours: plan.totalCreditHours,
      levelsCount,
      semestersCount,
    });
  };

  const startCourseEdit = (course: UniversityCourse) => {
    setEditingCourse(course);
    setCourseForm({
      studyPlanId: course.studyPlanId,
      code: course.code,
      name: course.name,
      nameAr: course.nameAr || '',
      description: course.description || '',
      descriptionAr: course.descriptionAr || '',
      descriptionEn: course.descriptionEn || '',
      creditHours: course.creditHours,
      level: course.level,
      semester: course.semester,
      type: course.type,
      prerequisites: course.prerequisites || [],
      corequisites: course.corequisites || [],
      learningOutcomes: (course.learningOutcomes || []).join('\n'),
      learningOutcomesAr: (course.learningOutcomesAr || []).join('\n'),
      learningOutcomesEn: (course.learningOutcomesEn || []).join('\n')
    });
  };

  const startRecommendationEdit = (item: AcademicRecommendation) => {
    setEditingRecommendation(item);
    setDepartmentId(item.departmentId);
    setRecommendationForm({
      title: item.title,
      description: item.description,
      type: item.type,
      studyPlanId: item.studyPlanId || '',
      affectedCourses: item.affectedCourses || [],
      affectedSkills: item.affectedSkills || [],
      evidence: (item.evidence || []).join('\n'),
      marketDemand: item.marketDemand,
      studentImpact: item.studentImpact,
      priority: item.priority
    });
  };

  const planOptions = plans.data?.items.filter((plan) => ['draft', 'changes_requested'].includes(plan.status)) ?? [];
  const coursePrerequisiteOptions = courses.data?.items.filter((c) => c.id !== editingCourse?.id) ?? [];

  const tabs: Array<[View, string]> = [
    ['plans', t('الخطط الدراسية', 'Study Plans')],
    ['courses', t('المقررات', 'Courses')],
    ['analysis', t('تحليل المواءمة', 'Alignment Analysis')],
    ['recommendations', t('التوصيات', 'Recommendations')]
  ];

  const hasError = structure.isError || plans.isError || courses.isError || recommendations.isError;

  return (
    <PortalLayout
      title={t('إدارة المناهج', 'Curriculum Management')}
      subtitle={t('الخطط والمقررات ومواءمة سوق العمل', 'Plans, courses, and market alignment')}
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className="rounded-full px-4 py-2 text-sm font-semibold"
            style={{ background: view === key ? '#9fe870' : '#fff' }}
          >
            {label}
          </button>
        ))}
        <button onClick={refresh} className="ms-auto rounded-full border border-[#dfe1dd] p-2" title={t('تحديث', 'Refresh')}>
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} className={input}>
          <option value="">{t('كل الأقسام', 'All departments')}</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.collegeName} - {department.name}</option>
          ))}
        </select>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('بحث...', 'Search...')} className={input} />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className={input}>
          <option value="">{t('كل الحالات', 'All statuses')}</option>
          {['draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'active', 'rejected', 'archived'].map((value) => (
            <option key={value} value={value}>{statusLabel(value, t)}</option>
          ))}
        </select>
      </div>

      {hasError && <State text={t('تعذر تحميل بعض بيانات المناهج. أعد المحاولة.', 'Some curriculum data could not be loaded. Please retry.')} />}

      {view === 'plans' && (
        <ContentCard title={t('الخطط الدراسية', 'Study Plans')} icon={<BookOpen size={18} />}>
          {canWritePlan && (
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowImportWizard(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white border border-[#dfe1dd] px-4 py-2 text-sm font-bold hover:bg-[#f0f1ee]"
              >
                <FileUp size={16} />
                {t('استيراد خطة من PDF', 'Import plan from PDF')}
              </button>
            </div>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              {plans.isLoading ? (
                <State text={t('جاري التحميل...', 'Loading...')} />
              ) : plans.data?.items.length ? (
                plans.data.items.map((plan) => (
                  <article key={plan.id} className="rounded-xl border border-[#dfe1dd] p-4">
                    <div className="flex justify-between gap-3">
                      <div>
                        <b>{plan.name}</b>
                        <p className="text-xs text-[#828782]">{plan.academicYear} - v{plan.version} - {plan.totalCreditHours}h</p>
                      </div>
                      <Status value={plan.status} t={t} />
                    </div>
                    {plan.description && <p className="mt-2 text-sm text-[#5b5e5a]">{plan.description}</p>}
                    {plan.reviewReason && <ReviewNote text={plan.reviewReason} t={t} />}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SmallButton icon={<BookOpen size={13} />} label={t('التفاصيل', 'Details')} onClick={() => setDetailsPlan(plan)} />
                      {['draft', 'changes_requested'].includes(plan.status) && canWritePlan && (
                        <>
                          <SmallButton icon={<Edit3 size={13} />} label={t('تعديل', 'Edit')} onClick={() => startPlanEdit(plan)} />
                          <SmallButton icon={<Check size={13} />} label={t('إرسال للمراجعة', 'Submit')} onClick={() => action.mutate({ type: 'submit-plan', id: plan.id })} />
                        </>
                      )}
                      {['approved', 'active'].includes(plan.status) && canWritePlan && (
                        <SmallButton icon={<RotateCcw size={13} />} label={t('إنشاء إصدار جديد', 'New version')} onClick={() => action.mutate({ type: 'new-version', id: plan.id })} />
                      )}
                      {['submitted', 'under_review'].includes(plan.status) && canReview && (
                        <SmallButton icon={<Check size={13} />} label={t('مراجعة', 'Review')} onClick={() => setReviewTarget({ kind: 'plan', id: plan.id, title: plan.name })} />
                      )}
                      {plan.status === 'approved' && canReview && (
                        <SmallButton icon={<Sparkles size={13} />} label={t('تفعيل الخطة', 'Activate Plan')} onClick={() => action.mutate({ type: 'activate-plan', id: plan.id })} />
                      )}
                      {plan.status !== 'archived' && canWritePlan && (
                        <SmallButton icon={<Archive size={13} />} label={t('أرشفة', 'Archive')} onClick={() => action.mutate({ type: 'archive-plan', id: plan.id })} />
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <State text={t('لا توجد خطط دراسية', 'No study plans')} />
              )}
            </div>

            {canWritePlan && (
              <form onSubmit={(event) => { event.preventDefault(); savePlan.mutate(); }} className="space-y-3 rounded-xl bg-[#f7f8f5] p-4">
                <h3 className="font-bold">{editingPlan ? t('تعديل الخطة', 'Edit Plan') : t('إضافة خطة', 'Add Plan')}</h3>
                <DevelopmentAutofillButton onClick={() => setPlanForm((old) => ({ ...old, ...generateStudyPlanTestData() }))} />
                <div>
                  <label className={label}>{t('القسم', 'Department')}</label>
                  <select
                    required
                    disabled={Boolean(editingPlan)}
                    value={planForm.departmentId}
                    onChange={(event) => setPlanForm({ ...planForm, departmentId: event.target.value })}
                    className={input}
                  >
                    <option value="">{t('اختر القسم', 'Select department')}</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>{t('اسم الخطة (إنجليزي)', 'Plan name (English)')}</label>
                  <input
                    required
                    value={planForm.name}
                    onChange={(event) => setPlanForm({ ...planForm, name: event.target.value })}
                    placeholder={t('اسم الخطة', 'Plan name')}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>{t('الاسم العربي', 'Arabic name')}</label>
                  <input
                    value={planForm.nameAr}
                    onChange={(event) => setPlanForm({ ...planForm, nameAr: event.target.value })}
                    placeholder={t('الاسم العربي', 'Arabic name')}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>{t('الوصف', 'Description')}</label>
                  <textarea
                    value={planForm.description}
                    onChange={(event) => setPlanForm({ ...planForm, description: event.target.value })}
                    placeholder={t('الوصف', 'Description')}
                    className="min-h-20 w-full rounded-xl border border-[#dfe1dd] bg-white p-3 text-sm outline-none focus:border-[#9fe870]"
                  />
                </div>
                <div>
                  <label className={label}>{t('السنة الأكاديمية', 'Academic year')}</label>
                  <input
                    required
                    disabled={Boolean(editingPlan)}
                    value={planForm.academicYear}
                    onChange={(event) => setPlanForm({ ...planForm, academicYear: event.target.value })}
                    placeholder="2026-2027"
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>{t('إجمالي الساعات المعتمدة', 'Total credit hours')}</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="400"
                    value={planForm.totalCreditHours}
                    onChange={(event) => setPlanForm({ ...planForm, totalCreditHours: Number(event.target.value) })}
                    className={input}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={label}>{t('عدد المستويات', 'Levels count')}</label>
                    <input
                      type="number"
                      min="1"
                      value={planForm.levelsCount}
                      onChange={(event) => setPlanForm({ ...planForm, levelsCount: Number(event.target.value) })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>{t('عدد الفصول لكل مستوى', 'Semesters per level')}</label>
                    <input
                      type="number"
                      min="1"
                      value={planForm.semestersCount}
                      onChange={(event) => setPlanForm({ ...planForm, semestersCount: Number(event.target.value) })}
                      className={input}
                    />
                  </div>
                </div>
                <FormButtons pending={savePlan.isPending} reset={() => { setPlanForm(emptyPlan); setEditingPlan(null); }} t={t} />
              </form>
            )}
          </div>
        </ContentCard>
      )}

      {view === 'courses' && (
        <ContentCard title={t('دليل المقررات', 'Course Catalog')} icon={<Library size={18} />}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              {courses.isLoading ? (
                <State text={t('جاري التحميل...', 'Loading...')} />
              ) : courses.data?.items.length ? (
                courses.data.items.map((course) => (
                  <article key={course.id} className="rounded-xl border border-[#dfe1dd] p-4">
                    <div className="flex justify-between">
                      <b>{course.code} - {course.name}</b>
                      <Status value={course.status} t={t} />
                    </div>
                    <p className="text-xs text-[#828782]">
                      {course.creditHours}h - {t('المستوى', 'Level')} {course.level} - {t('الفصل', 'Semester')} {course.semester}
                    </p>
                    {course.skillMappings.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {course.skillMappings.map((mapping) => (
                          <span
                            key={mapping.skillId}
                            className="inline-flex items-center gap-1 rounded-full bg-[#E7FDD8] px-2.5 py-1 text-xs font-bold text-emerald-800"
                          >
                            {mapping.skill?.nameAr || mapping.skill?.name || mapping.skillId} ({mapping.coverageLevel}/5)
                            {canMapSkill && course.status !== 'archived' && (
                              <button
                                type="button"
                                onClick={() => removeSkill.mutate({ courseId: course.id, skillId: mapping.skillId })}
                                className="ms-1 rounded-full p-0.5 hover:bg-emerald-200/50"
                                title={t('إزالة المهارة', 'Remove skill')}
                              >
                                <X size={10} />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SmallButton icon={<Library size={13} />} label={t('التفاصيل', 'Details')} onClick={() => setDetailsCourse(course)} />
                      {course.status !== 'archived' && (
                        <>
                          {canWriteCourse && <SmallButton icon={<Edit3 size={13} />} label={t('تعديل', 'Edit')} onClick={() => startCourseEdit(course)} />}
                          {canMapSkill && <SmallButton icon={<Sparkles size={13} />} label={t('ربط مهارة', 'Map skill')} onClick={() => setSkillCourse(course)} />}
                          {canWriteCourse && <SmallButton icon={<Archive size={13} />} label={t('أرشفة', 'Archive')} onClick={() => action.mutate({ type: 'archive-course', id: course.id })} />}
                        </>
                      )}
                      {canWriteCourse && course.status === 'archived' && (
                        <SmallButton icon={<RotateCcw size={13} />} label={t('استعادة', 'Restore')} onClick={() => action.mutate({ type: 'restore-course', id: course.id })} />
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <State text={t('لا توجد مقررات', 'No courses')} />
              )}
            </div>

            {canWriteCourse && (
              <form onSubmit={(event) => { event.preventDefault(); saveCourse.mutate(); }} className="space-y-3 rounded-xl bg-[#f7f8f5] p-4">
                <h3 className="font-bold">{editingCourse ? t('تعديل المقرر', 'Edit Course') : t('إضافة مقرر', 'Add Course')}</h3>
                <DevelopmentAutofillButton onClick={() => setCourseForm((old) => ({ ...old, ...generateCourseTestData() }))} />
                <div>
                  <label className={label}>{t('الخطة الدراسية', 'Study plan')}</label>
                  <select
                    required
                    disabled={Boolean(editingCourse)}
                    value={courseForm.studyPlanId}
                    onChange={(event) => setCourseForm({ ...courseForm, studyPlanId: event.target.value })}
                    className={input}
                  >
                    <option value="">{t('اختر خطة قابلة للتعديل', 'Select editable plan')}</option>
                    {planOptions.map((plan) => (
                      <option key={plan.id} value={plan.id}>{plan.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>{t('رمز المقرر', 'Course code')}</label>
                  <input
                    required
                    value={courseForm.code}
                    onChange={(event) => setCourseForm({ ...courseForm, code: event.target.value })}
                    placeholder={t('رمز المقرر', 'Course code')}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>{t('اسم المقرر (إنجليزي)', 'Course name (English)')}</label>
                  <input
                    required
                    value={courseForm.name}
                    onChange={(event) => setCourseForm({ ...courseForm, name: event.target.value })}
                    placeholder={t('اسم المقرر (إنجليزي)', 'Course name (English)')}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>{t('الاسم العربي', 'Arabic name')}</label>
                  <input
                    value={courseForm.nameAr}
                    onChange={(event) => setCourseForm({ ...courseForm, nameAr: event.target.value })}
                    placeholder={t('الاسم العربي', 'Arabic name')}
                    className={input}
                  />
                </div>
                <div>
                  <label className={label}>{t('الوصف (إنجليزي)', 'Description (English)')}</label>
                  <textarea
                    value={courseForm.descriptionEn}
                    onChange={(event) => setCourseForm({ ...courseForm, descriptionEn: event.target.value, description: event.target.value })}
                    placeholder={t('الوصف (إنجليزي)', 'Description (English)')}
                    className="min-h-20 w-full rounded-xl border border-[#dfe1dd] bg-white p-3 text-sm outline-none focus:border-[#9fe870]"
                  />
                </div>
                <div>
                  <label className={label}>{t('الوصف العربي', 'Arabic description')}</label>
                  <textarea
                    value={courseForm.descriptionAr}
                    onChange={(event) => setCourseForm({ ...courseForm, descriptionAr: event.target.value })}
                    placeholder={t('الوصف العربي', 'Arabic description')}
                    className="min-h-20 w-full rounded-xl border border-[#dfe1dd] bg-white p-3 text-sm outline-none focus:border-[#9fe870]"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className={label}>{t('الساعات', 'Credits')}</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={courseForm.creditHours}
                      onChange={(event) => setCourseForm({ ...courseForm, creditHours: Number(event.target.value) })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>{t('المستوى', 'Level')}</label>
                    <input
                      type="number"
                      min="1"
                      value={courseForm.level}
                      onChange={(event) => setCourseForm({ ...courseForm, level: Number(event.target.value) })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>{t('الفصل', 'Semester')}</label>
                    <input
                      type="number"
                      min="1"
                      value={courseForm.semester}
                      onChange={(event) => setCourseForm({ ...courseForm, semester: Number(event.target.value) })}
                      className={input}
                    />
                  </div>
                  <div>
                    <label className={label}>{t('النوع', 'Type')}</label>
                    <select
                      value={courseForm.type}
                      onChange={(event) => setCourseForm({ ...courseForm, type: event.target.value as typeof courseForm.type })}
                      className={input}
                    >
                      {['required', 'elective', 'practical', 'laboratory', 'project', 'internship'].map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={label}>{t('المتطلبات السابقة', 'Prerequisites')}</label>
                  <select
                    multiple
                    value={courseForm.prerequisites}
                    onChange={(event) => {
                      const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
                      setCourseForm({ ...courseForm, prerequisites: selected });
                    }}
                    className={`${input} !h-24`}
                  >
                    {coursePrerequisiteOptions.map((course) => (
                      <option key={course.id} value={course.id}>{course.code} - {course.nameAr || course.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-[#828782]">{t('استخدم Ctrl/Cmd لاختيار متعدد', 'Use Ctrl/Cmd for multiple selection')}</p>
                </div>
                <div>
                  <label className={label}>{t('المتطلبات المصاحبة', 'Co-requisites')}</label>
                  <select
                    multiple
                    value={courseForm.corequisites}
                    onChange={(event) => {
                      const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
                      setCourseForm({ ...courseForm, corequisites: selected });
                    }}
                    className={`${input} !h-24`}
                  >
                    {coursePrerequisiteOptions.map((course) => (
                      <option key={course.id} value={course.id}>{course.code} - {course.nameAr || course.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-[#828782]">{t('استخدم Ctrl/Cmd لاختيار متعدد', 'Use Ctrl/Cmd for multiple selection')}</p>
                </div>
                <div>
                  <label className={label}>{t('نواتج التعلم (إنجليزي)', 'Learning outcomes (English)')}</label>
                  <textarea
                    value={courseForm.learningOutcomes}
                    onChange={(event) => setCourseForm({ ...courseForm, learningOutcomes: event.target.value })}
                    placeholder={t('سطر لكل نتيجة', 'One outcome per line')}
                    className="min-h-20 w-full rounded-xl border border-[#dfe1dd] bg-white p-3 text-sm outline-none focus:border-[#9fe870]"
                  />
                </div>
                <div>
                  <label className={label}>{t('نواتج التعلم (عربي)', 'Learning outcomes (Arabic)')}</label>
                  <textarea
                    value={courseForm.learningOutcomesAr}
                    onChange={(event) => setCourseForm({ ...courseForm, learningOutcomesAr: event.target.value })}
                    placeholder={t('سطر لكل نتيجة', 'One outcome per line')}
                    className="min-h-20 w-full rounded-xl border border-[#dfe1dd] bg-white p-3 text-sm outline-none focus:border-[#9fe870]"
                  />
                </div>
                <div>
                  <label className={label}>{t('نواتج التعلم (إنجليزي بديل)', 'Learning outcomes (English alt)')}</label>
                  <textarea
                    value={courseForm.learningOutcomesEn}
                    onChange={(event) => setCourseForm({ ...courseForm, learningOutcomesEn: event.target.value })}
                    placeholder={t('سطر لكل نتيجة', 'One outcome per line')}
                    className="min-h-20 w-full rounded-xl border border-[#dfe1dd] bg-white p-3 text-sm outline-none focus:border-[#9fe870]"
                  />
                </div>
                <FormButtons pending={saveCourse.isPending} reset={() => { setCourseForm(emptyCourse); setEditingCourse(null); }} t={t} />
              </form>
            )}
          </div>
        </ContentCard>
      )}

      {view === 'analysis' && (
        <ContentCard
          title={t('تحليل مواءمة المناهج', 'Curriculum Alignment Analysis')}
          icon={<BrainCircuit size={18} />}
          action={
            departmentId && canRunAnalysis ? (
              <button
                disabled={action.isPending}
                onClick={() => action.mutate({ type: 'refresh-analysis', id: departmentId })}
                className="rounded-full bg-[#9fe870] px-4 py-2 text-xs font-bold"
              >
                {t('إعادة التحليل', 'Re-analyze')}
              </button>
            ) : undefined
          }
        >
          {!departmentId ? (
            <State text={t('اختر قسمًا لعرض التحليل', 'Select a department to view analysis')} />
          ) : analysis.isLoading ? (
            <State text={t('جاري التحليل...', 'Analyzing...')} />
          ) : analysis.isError ? (
            <State text={t('تعذر إجراء التحليل', 'Analysis unavailable')} />
          ) : analysis.data ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Metric
                  label={t('نسبة المواءمة', 'Alignment')}
                  value={analysis.data.alignmentPercentage === null ? t('غير متاح', 'Unavailable') : `${analysis.data.alignmentPercentage}%`}
                />
                <SkillList title={t('تغطية كافية', 'Covered')} items={analysis.data.coveredSkills.map((value) => value.name)} />
                <SkillList title={t('تغطية جزئية', 'Partial')} items={analysis.data.partiallyCoveredSkills.map((value) => value.name)} />
                <SkillList title={t('غير مغطاة', 'Missing')} items={analysis.data.missingSkills.map((value) => `${value.name} (${value.demandScore})`)} />
              </div>
              <SkillList title={t('مهارات ناشئة', 'Emerging Skills')} items={analysis.data.emergingSkills.map((value) => `${value.name} (${value.demandScore})`)} />
              <div className="rounded-xl bg-[#f7f8f5] p-4 text-xs text-[#5b5e5a]">
                <p><b>{t('المصدر:', 'Source:')}</b> {analysis.data.source}</p>
                <p><b>{t('آخر تحديث:', 'Last updated:')}</b> {new Date(analysis.data.analyzedAt).toLocaleString()}</p>
                {analysis.data.warning && <p className="mt-1 text-[#B45309]">{analysis.data.warning}</p>}
              </div>
            </div>
          ) : (
            <State text={t('لا توجد نتيجة تحليل', 'No analysis result')} />
          )}
        </ContentCard>
      )}

      {view === 'recommendations' && (
        <ContentCard title={t('التوصيات الأكاديمية', 'Academic Recommendations')} icon={<Sparkles size={18} />}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              {recommendations.isLoading ? (
                <State text={t('جاري التحميل...', 'Loading...')} />
              ) : recommendations.data?.items.length ? (
                recommendations.data.items.map((item) => (
                  <article key={item.id} className="rounded-xl border border-[#dfe1dd] p-4">
                    <div className="flex justify-between gap-3">
                      <b>{item.title}</b>
                      <Status value={item.status} t={t} />
                    </div>
                    <p className="mt-2 text-sm text-[#5b5e5a]">{item.description}</p>
                    <p className="mt-2 text-xs">
                      {t('الأولوية', 'Priority')}: {item.priority} - {t('طلب السوق', 'Market demand')}: {item.marketDemand}%
                    </p>
                    {item.evidence.length > 0 && (
                      <ul className="mt-2 list-inside list-disc text-xs text-[#5b5e5a]">
                        {item.evidence.map((value, index) => <li key={`${value}-${index}`}>{value}</li>)}
                      </ul>
                    )}
                    {item.reviewReason && <ReviewNote text={item.reviewReason} t={t} />}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['draft', 'changes_requested'].includes(item.status) && canWriteRecommendation && (
                        <>
                          <SmallButton icon={<Edit3 size={13} />} label={t('تعديل', 'Edit')} onClick={() => startRecommendationEdit(item)} />
                          <SmallButton icon={<Check size={13} />} label={t('إرسال', 'Submit')} onClick={() => action.mutate({ type: 'submit-recommendation', id: item.id })} />
                        </>
                      )}
                      {['submitted', 'under_review'].includes(item.status) && canReview && (
                        <SmallButton icon={<Check size={13} />} label={t('مراجعة', 'Review')} onClick={() => setReviewTarget({ kind: 'recommendation', id: item.id, title: item.title })} />
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <State text={t('لا توجد توصيات', 'No recommendations')} />
              )}
            </div>

            {canWriteRecommendation && (
              <form onSubmit={(event) => { event.preventDefault(); saveRecommendation.mutate(); }} className="space-y-3 rounded-xl bg-[#f7f8f5] p-4">
                <h3 className="font-bold">{editingRecommendation ? t('تعديل التوصية', 'Edit Recommendation') : t('إنشاء توصية', 'Create Recommendation')}</h3>
                <DevelopmentAutofillButton onClick={() => setRecommendationForm((old) => ({ ...old, ...generateAcademicRecommendationTestData() }))} />
                <input
                  required
                  value={recommendationForm.title}
                  onChange={(event) => setRecommendationForm({ ...recommendationForm, title: event.target.value })}
                  placeholder={t('العنوان', 'Title')}
                  className={input}
                />
                <textarea
                  required
                  value={recommendationForm.description}
                  onChange={(event) => setRecommendationForm({ ...recommendationForm, description: event.target.value })}
                  placeholder={t('الوصف', 'Description')}
                  className="min-h-24 w-full rounded-xl border border-[#dfe1dd] bg-white p-3 text-sm outline-none focus:border-[#9fe870]"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    value={recommendationForm.type}
                    onChange={(event) => setRecommendationForm({ ...recommendationForm, type: event.target.value })}
                    className={input}
                  >
                    {['add_course', 'update_course', 'add_lab', 'add_project', 'increase_practical_coverage', 'add_certificate', 'add_technology'].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                  <select
                    value={recommendationForm.priority}
                    onChange={(event) => setRecommendationForm({ ...recommendationForm, priority: event.target.value })}
                    className={input}
                  >
                    {['low', 'medium', 'high', 'critical'].map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={recommendationForm.studyPlanId}
                  onChange={(event) => setRecommendationForm({ ...recommendationForm, studyPlanId: event.target.value })}
                  className={input}
                >
                  <option value="">{t('بدون خطة مرتبطة', 'No linked plan')}</option>
                  {plans.data?.items.filter((plan) => !departmentId || plan.departmentId === departmentId).map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} v{plan.version}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={recommendationForm.marketDemand}
                  onChange={(event) => setRecommendationForm({ ...recommendationForm, marketDemand: Number(event.target.value) })}
                  placeholder={t('طلب السوق (0-100)', 'Market demand (0-100)')}
                  className={input}
                />
                <input
                  value={recommendationForm.studentImpact}
                  onChange={(event) => setRecommendationForm({ ...recommendationForm, studentImpact: event.target.value })}
                  placeholder={t('التأثير على الطلاب', 'Student impact')}
                  className={input}
                />
                <textarea
                  value={recommendationForm.evidence}
                  onChange={(event) => setRecommendationForm({ ...recommendationForm, evidence: event.target.value })}
                  placeholder={t('الأدلة (سطر لكل دليل)', 'Evidence (one per line)')}
                  className="min-h-20 w-full rounded-xl border border-[#dfe1dd] bg-white p-3 text-sm outline-none focus:border-[#9fe870]"
                />
                <FormButtons pending={saveRecommendation.isPending} reset={() => { setRecommendationForm(emptyRecommendation); setEditingRecommendation(null); }} t={t} />
              </form>
            )}
          </div>
        </ContentCard>
      )}

      {skillCourse && (
        <Overlay onClose={() => setSkillCourse(null)}>
          <h3 className="mb-4 font-bold">{t('ربط مهارة بالمقرر', 'Map Skill to Course')}: {skillCourse.code}</h3>
          <form onSubmit={(event) => { event.preventDefault(); saveSkill.mutate(); }} className="space-y-3">
            <select
              required
              value={skillForm.skillId}
              onChange={(event) => setSkillForm({ ...skillForm, skillId: event.target.value })}
              className={input}
            >
              <option value="">{t('اختر من قاموس المهارات', 'Select from skill catalog')}</option>
              {skills.data?.map((skill) => (
                <option key={skill.id} value={skill.id}>{skill.nameAr || skill.name} - {skill.category}</option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="5"
              value={skillForm.coverageLevel}
              onChange={(event) => setSkillForm({ ...skillForm, coverageLevel: Number(event.target.value) })}
              className={input}
            />
            <select
              value={skillForm.coverageType}
              onChange={(event) => setSkillForm({ ...skillForm, coverageType: event.target.value as typeof skillForm.coverageType })}
              className={input}
            >
              <option value="theoretical">{t('نظري', 'Theoretical')}</option>
              <option value="practical">{t('عملي', 'Practical')}</option>
              <option value="mixed">{t('مختلط', 'Mixed')}</option>
            </select>
            <input
              required
              value={skillForm.assessmentMethod}
              onChange={(event) => setSkillForm({ ...skillForm, assessmentMethod: event.target.value })}
              placeholder={t('طريقة التقييم: مشروع, اختبار, مختبر', 'Assessment: project, exam, lab')}
              className={input}
            />
            <FormButtons pending={saveSkill.isPending} reset={() => setSkillCourse(null)} t={t} />
          </form>
        </Overlay>
      )}

      {reviewTarget && (
        <Overlay onClose={() => setReviewTarget(null)}>
          <h3 className="mb-1 font-bold">{t('مراجعة', 'Review')}: {reviewTarget.title}</h3>
          <p className="mb-4 text-xs text-[#5b5e5a]">{t('سيصل القرار إلى منشئ العنصر عبر الإشعارات.', 'The creator will receive this decision as a notification.')}</p>
          <form onSubmit={(event) => { event.preventDefault(); review.mutate(); }} className="space-y-3">
            <select
              value={reviewStatus}
              onChange={(event) => setReviewStatus(event.target.value as typeof reviewStatus)}
              className={input}
            >
              <option value="under_review">{t('تحت المراجعة', 'Under review')}</option>
              <option value="approved">{t('اعتماد', 'Approve')}</option>
              <option value="changes_requested">{t('إعادة للتعديل', 'Request changes')}</option>
              <option value="rejected">{t('رفض', 'Reject')}</option>
            </select>
            <textarea
              required={['rejected', 'changes_requested'].includes(reviewStatus)}
              value={reviewReason}
              onChange={(event) => setReviewReason(event.target.value)}
              placeholder={t('سبب القرار أو الملاحظات', 'Decision reason or notes')}
              className="min-h-24 w-full rounded-xl border border-[#dfe1dd] bg-white p-3 text-sm outline-none focus:border-[#9fe870]"
            />
            <FormButtons pending={review.isPending} reset={() => setReviewTarget(null)} t={t} />
          </form>
        </Overlay>
      )}

      {detailsPlan && (
        <Overlay onClose={() => setDetailsPlan(null)}>
          <h3 className="mb-2 font-bold text-lg border-b pb-2">{t('تفاصيل الخطة الدراسية', 'Study Plan Details')}</h3>
          <div className="space-y-3 text-sm text-[#5b5e5a] max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <span className="block text-xs font-bold text-[#828782]">{t('اسم الخطة (عربي/إنجليزي):', 'Plan Name (Ar/En):')}</span>
              <b className="text-[#0e0f0c]">{detailsPlan.nameAr || '-'} / {detailsPlan.name}</b>
            </div>
            <div>
              <span className="block text-xs font-bold text-[#828782]">{t('السنة الأكاديمية والنسخة:', 'Academic Year & Version:')}</span>
              <span>{detailsPlan.academicYear} ({t('الإصدار', 'Version')} {detailsPlan.version})</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-[#828782]">{t('الساعات المعتمدة الإجمالية:', 'Total Credit Hours:')}</span>
              <span>{detailsPlan.totalCreditHours} {t('ساعة', 'Hours')}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-[#828782]">{t('حالة الخطة الدراسية:', 'Plan Status:')}</span>
              <Status value={detailsPlan.status} t={t} />
            </div>
            {detailsPlan.description && (
              <div>
                <span className="block text-xs font-bold text-[#828782]">{t('الوصف:', 'Description:')}</span>
                <p className="mt-1 bg-gray-50 p-2.5 rounded-lg text-xs leading-relaxed">{detailsPlan.description}</p>
              </div>
            )}
            {detailsPlan.reviewReason && (
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs text-amber-800">
                <b className="block mb-1">{t('ملاحظات المراجعة:', 'Review Notes:')}</b>
                {detailsPlan.reviewReason}
              </div>
            )}
            <div className="pt-2 border-t">
              <h4 className="font-bold text-xs mb-2 text-[#0e0f0c]">{t('المقررات المدرجة بالخطة:', 'Courses Included in the Plan:')}</h4>
              <div className="space-y-2">
                {courses.data?.items.filter((c) => c.studyPlanId === detailsPlan.id).length ? (
                  courses.data?.items
                    .filter((c) => c.studyPlanId === detailsPlan.id)
                    .map((c) => (
                      <div key={c.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg text-xs">
                        <div>
                          <b className="text-slate-800">{c.code}</b>
                          <span className="mx-1.5 text-gray-300">|</span>
                          <span>{c.nameAr || c.name}</span>
                        </div>
                        <span className="text-slate-500 font-semibold">{c.creditHours}h</span>
                      </div>
                    ))
                ) : (
                  <p className="text-xs text-[#828782] italic">{t('لا توجد مقررات مضافة بعد في هذه الخطة.', 'No courses added yet in this study plan.')}</p>
                )}
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {detailsCourse && (
        <Overlay onClose={() => setDetailsCourse(null)}>
          <h3 className="mb-2 font-bold text-lg border-b pb-2">{t('تفاصيل المقرر الدراسي', 'Course Details')}</h3>
          <div className="space-y-3 text-sm text-[#5b5e5a] max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-bold text-[#828782]">{t('رمز المقرر:', 'Course Code:')}</span>
                <b className="text-[#0e0f0c]">{detailsCourse.code}</b>
              </div>
              <div>
                <span className="block text-xs font-bold text-[#828782]">{t('حالة المقرر:', 'Course Status:')}</span>
                <Status value={detailsCourse.status} t={t} />
              </div>
            </div>
            <div>
              <span className="block text-xs font-bold text-[#828782]">{t('اسم المقرر:', 'Course Name:')}</span>
              <b className="text-[#0e0f0c]">{detailsCourse.nameAr || '-'} / {detailsCourse.name}</b>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-lg text-xs text-center font-medium">
              <div>
                <span className="block text-[10px] text-[#828782]">{t('الساعات', 'Credits')}</span>
                <span className="text-slate-800 font-bold">{detailsCourse.creditHours}h</span>
              </div>
              <div>
                <span className="block text-[10px] text-[#828782]">{t('المستوى', 'Level')}</span>
                <span className="text-slate-800 font-bold">{detailsCourse.level}</span>
              </div>
              <div>
                <span className="block text-[10px] text-[#828782]">{t('الفصل', 'Semester')}</span>
                <span className="text-slate-800 font-bold">{detailsCourse.semester}</span>
              </div>
            </div>
            <div>
              <span className="block text-xs font-bold text-[#828782]">{t('نوع المقرر:', 'Course Type:')}</span>
              <span className="capitalize">{detailsCourse.type}</span>
            </div>
            {detailsCourse.descriptionEn && (
              <div>
                <span className="block text-xs font-bold text-[#828782]">{t('الوصف (إنجليزي):', 'Description (English):')}</span>
                <p className="mt-1 bg-gray-50 p-2.5 rounded-lg text-xs leading-relaxed">{detailsCourse.descriptionEn}</p>
              </div>
            )}
            {detailsCourse.descriptionAr && (
              <div>
                <span className="block text-xs font-bold text-[#828782]">{t('الوصف العربي:', 'Arabic Description:')}</span>
                <p className="mt-1 bg-gray-50 p-2.5 rounded-lg text-xs leading-relaxed">{detailsCourse.descriptionAr}</p>
              </div>
            )}
            {detailsCourse.learningOutcomes && detailsCourse.learningOutcomes.length > 0 && (
              <div>
                <span className="block text-xs font-bold text-[#828782]">{t('نواتج التعلم المستهدفة:', 'Target Learning Outcomes:')}</span>
                <ul className="mt-1 list-inside list-disc text-xs space-y-1 bg-gray-50 p-2.5 rounded-lg">
                  {detailsCourse.learningOutcomes.map((lo, idx) => (
                    <li key={idx}>{lo}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <span className="block text-xs font-bold text-[#828782] mb-1.5">{t('المتطلبات السابقة:', 'Prerequisite Courses:')}</span>
              {detailsCourse.prerequisites && detailsCourse.prerequisites.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {detailsCourse.prerequisites.map((preId) => {
                    const preObj = courses.data?.items.find((c) => c.id === preId);
                    return (
                      <span key={preId} className="rounded-full bg-slate-100 border px-2 py-0.5 text-xs text-slate-700 font-semibold">
                        {preObj ? `${preObj.code} - ${preObj.nameAr || preObj.name}` : preId}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-[#828782] italic">{t('لا يوجد متطلبات سابقة للمقرر.', 'No prerequisites for this course.')}</span>
              )}
            </div>
            <div>
              <span className="block text-xs font-bold text-[#828782] mb-1.5">{t('المتطلبات المصاحبة:', 'Co-requisite Courses:')}</span>
              {detailsCourse.corequisites && detailsCourse.corequisites.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {detailsCourse.corequisites.map((coId) => {
                    const coObj = courses.data?.items.find((c) => c.id === coId);
                    return (
                      <span key={coId} className="rounded-full bg-slate-100 border px-2 py-0.5 text-xs text-slate-700 font-semibold">
                        {coObj ? `${coObj.code} - ${coObj.nameAr || coObj.name}` : coId}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-[#828782] italic">{t('لا يوجد متطلبات مصاحبة للمقرر.', 'No co-requisites for this course.')}</span>
              )}
            </div>
            <div>
              <span className="block text-xs font-bold text-[#828782] mb-1.5">{t('المهارات المرتبطة:', 'Mapped Skills:')}</span>
              {detailsCourse.skillMappings && detailsCourse.skillMappings.length > 0 ? (
                <div className="space-y-1.5">
                  {detailsCourse.skillMappings.map((m) => (
                    <div key={m.skillId} className="flex justify-between items-center bg-[#E7FDD8] text-emerald-950 px-3 py-1.5 rounded-lg text-xs font-medium">
                      <div>
                        <b>{m.skill?.nameAr || m.skill?.name || m.skillId}</b>
                        <span className="block text-[10px] text-emerald-800 mt-0.5">{t('طريقة التقييم:', 'Assessment:')} {m.assessmentMethod} ({m.coverageType})</span>
                      </div>
                      <span className="font-bold">{m.coverageLevel}/5</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-[#828782] italic">{t('لا يوجد مهارات مربوطة بالمقرر حتى الآن.', 'No skills mapped to this course yet.')}</span>
              )}
            </div>
          </div>
        </Overlay>
      )}

      {showImportWizard && (
        <PdfImportWizard
          access={access.data}
          departments={departments}
          onClose={() => setShowImportWizard(false)}
          onSaved={() => { refresh(); setView('plans'); }}
        />
      )}
    </PortalLayout>
  );
}

function message(error: unknown, fallback: string) {
  const value = (error as { response?: { data?: { message?: string | string[] } }; message?: string })?.response?.data?.message || (error as { message?: string })?.message;
  return Array.isArray(value) ? value.join('، ') : value || fallback;
}

function statusLabel(value: string, t: (ar: string, en: string) => string) {
  const labels: Record<string, [string, string]> = {
    draft: ['مسودة', 'Draft'],
    submitted: ['مرسلة', 'Submitted'],
    under_review: ['تحت المراجعة', 'Under review'],
    changes_requested: ['معادة للتعديل', 'Changes requested'],
    approved: ['معتمدة', 'Approved'],
    active: ['نشطة', 'Active'],
    rejected: ['مرفوضة', 'Rejected'],
    archived: ['مؤرشفة', 'Archived']
  };
  const label = labels[value];
  return label ? t(label[0], label[1]) : value;
}

function Status({ value, t }: { value: string; t: (ar: string, en: string) => string }) {
  return <span className="h-fit rounded-full bg-[#f0f1ee] px-2 py-1 text-xs font-bold">{statusLabel(value, t)}</span>;
}

function State({ text }: { text: string }) {
  return <p className="py-10 text-center text-sm font-semibold text-[#828782]">{text}</p>;
}

function ReviewNote({ text, t }: { text: string; t: (ar: string, en: string) => string }) {
  return <div className="mt-3 rounded-xl bg-[#FEF3C7] p-3 text-xs text-[#92400E]"><b>{t('ملاحظات المراجعة:', 'Review notes:')}</b> {text}</div>;
}

function SmallButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-full border border-[#dfe1dd] px-3 py-1.5 text-xs font-bold hover:bg-[#f0f1ee]">
      {icon}{label}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#E7FDD8] p-5">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold text-[#5b5e5a]">{label}</p>
    </div>
  );
}

function SkillList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-[#dfe1dd] p-5">
      <h3 className="mb-3 font-bold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.length ? items.map((item, index) => <span key={`${item}-${index}`} className="rounded-full bg-[#f0f1ee] px-3 py-1 text-xs font-semibold">{item}</span>) : <span className="text-xs text-[#828782]">-</span>}
      </div>
    </div>
  );
}

function FormButtons({ pending, reset, t }: { pending: boolean; reset: () => void; t: (ar: string, en: string) => string }) {
  return (
    <div className="flex gap-2">
      <button disabled={pending} className="rounded-full bg-[#9fe870] px-5 py-2 text-sm font-bold disabled:opacity-50">
        {pending ? t('جاري الحفظ...', 'Saving...') : t('حفظ', 'Save')}
      </button>
      <button type="button" onClick={reset} className="rounded-full border border-[#dfe1dd] px-5 py-2 text-sm font-bold">
        {t('إعادة تعيين', 'Reset')}
      </button>
    </div>
  );
}

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <button type="button" onClick={onClose} className="absolute end-4 top-4 rounded-full p-1 hover:bg-[#f0f1ee]">
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  );
}
