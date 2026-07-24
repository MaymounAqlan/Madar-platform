import { useState } from 'react';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import {
  useArchiveCollege, useCreateCollege, useCreateDepartment, useDeleteDepartment,
  useInstitutionalAccess, useRestoreCollege, useRestoreDepartment, useUniversityStructure, useUpdateCollege, useUpdateDepartment,
} from '@/hooks/useUniversity';
import { universityApi } from '@/services/universityApi';
import { getAccessToken } from '@/services/api';
import type {
  CreateCollegeRequest, CreateDepartmentRequest, UniversityCollege, UniversityDepartment,
  UpdateCollegeRequest, UpdateDepartmentRequest, UniversityStudyPlan, UniversityCourse,
} from '@/types/university.types';
import {
  AlertTriangle, Archive, BookOpen, Building2, ChevronDown, ChevronUp,
  GraduationCap, Library, Loader2, Pencil, Plus, RefreshCw, RotateCcw, Search, SlidersHorizontal, Users, X,
} from 'lucide-react';
import { CollegeFormDialog, ConfirmActionDialog, DepartmentFormDialog } from './UniversityStructureDialogs';

const UNIVERSITY_KEY = 'university';

type FormDialog =
  | { type: 'college'; mode: 'create' | 'edit'; college?: UniversityCollege }
  | { type: 'department'; mode: 'create' | 'edit'; college: UniversityCollege; department?: UniversityDepartment };

type Confirmation =
  | { type: 'archive-college'; college: UniversityCollege }
  | { type: 'restore-college'; college: UniversityCollege }
  | { type: 'archive-department'; college: UniversityCollege; department: UniversityDepartment }
  | { type: 'restore-department'; college: UniversityCollege; department: UniversityDepartment };

function LoadingSpinner() {
  return <div className="flex h-96 items-center justify-center"><Loader2 size={32} className="animate-spin text-[#9fe870]" /></div>;
}

function StatusPill({ count, label, bg, color }: { count: number; label: string; bg: string; color: string }) {
  return <div className="flex items-center gap-2 rounded-full px-4 py-2" style={{ background: bg }}><span className="text-lg font-black" style={{ color }}>{count}</span><span className="text-xs font-semibold" style={{ color }}>{label}</span></div>;
}

function apiError(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : typeof message === 'string' ? message : fallback;
}

function DepartmentDetailsDialog({ department, onClose, t }: { department: UniversityDepartment; onClose: () => void; t: (ar: string, en: string) => string }) {
  const dialogEnabled = !!department && !!getAccessToken();
  const plansQuery = useQuery({
    queryKey: [UNIVERSITY_KEY, 'department-plans', department.id],
    queryFn: () => universityApi.getStudyPlans({ departmentId: department.id, limit: 100 }),
    enabled: dialogEnabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
  const coursesQuery = useQuery({
    queryKey: [UNIVERSITY_KEY, 'department-courses', department.id],
    queryFn: () => universityApi.getCourses({ departmentId: department.id, limit: 100 }),
    enabled: dialogEnabled,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const plans = (plansQuery.data?.items || []) as UniversityStudyPlan[];
  const courses = (coursesQuery.data?.items || []) as UniversityCourse[];
  const isLoading = plansQuery.isLoading || coursesQuery.isLoading;
  const isError = plansQuery.isError || coursesQuery.isError;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="relative flex h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#dfe1dd] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">{department.name}</h2>
            <p className="text-xs text-[#828782]">{t('خطط ومقررات القسم', 'Department plans and courses')}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-[#f0f1ee]"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && <LoadingSpinner />}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <AlertTriangle size={30} style={{ color: '#dc2626' }} />
              <p className="text-sm font-semibold text-[#5b5e5a]">{t('تعذر تحميل بيانات القسم.', 'Unable to load department data.')}</p>
              <button onClick={() => { plansQuery.refetch(); coursesQuery.refetch(); }} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: '#9fe870', color: '#0e0f0c' }}><RefreshCw size={15} />{t('إعادة المحاولة', 'Retry')}</button>
            </div>
          )}
          {!isLoading && !isError && (
            <div className="space-y-6">
              <div className="rounded-xl border border-[#dfe1dd] p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><Library size={16} /> {t('الخطط الدراسية', 'Study Plans')} ({plans.length})</h3>
                {plans.length === 0 ? (
                  <p className="text-center text-sm text-[#828782]">{t('لا توجد خطط دراسية مسجلة.', 'No study plans recorded.')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-[#f7f8f5] text-[#828782]"><th className="px-2 py-2 text-start">{t('الاسم', 'Name')}</th><th className="px-2 py-2 text-start">{t('السنة', 'Year')}</th><th className="px-2 py-2 text-start">{t('الإصدار', 'Version')}</th><th className="px-2 py-2 text-start">{t('الحالة', 'Status')}</th><th className="px-2 py-2 text-start">{t('الساعات', 'Credits')}</th><th className="px-2 py-2 text-start">{t('المقررات', 'Courses')}</th></tr></thead>
                      <tbody>
                        {plans.map((plan) => (
                          <tr key={plan.id} className="border-t border-[#dfe1dd]">
                            <td className="px-2 py-2 font-semibold">{plan.nameAr || plan.name || '-'}</td>
                            <td className="px-2 py-2">{plan.academicYear || '-'}</td>
                            <td className="px-2 py-2">{plan.version}</td>
                            <td className="px-2 py-2"><span className="rounded-full px-2 py-0.5 text-xs" style={{ background: plan.status === 'active' ? '#E7FDD8' : '#FEF3C7', color: plan.status === 'active' ? '#1ba442' : '#B45309' }}>{plan.status}</span></td>
                            <td className="px-2 py-2">{plan.totalCreditHours ?? '-'}</td>
                            <td className="px-2 py-2">{(plan.courseIds || []).length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-[#dfe1dd] p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold"><BookOpen size={16} /> {t('المقررات', 'Courses')} ({courses.length})</h3>
                {courses.length === 0 ? (
                  <p className="text-center text-sm text-[#828782]">{t('لا توجد مقررات مسجلة.', 'No courses recorded.')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="bg-[#f7f8f5] text-[#828782]"><th className="px-2 py-2 text-start">{t('الرمز', 'Code')}</th><th className="px-2 py-2 text-start">{t('الاسم', 'Name')}</th><th className="px-2 py-2 text-start">{t('الساعات', 'Credits')}</th><th className="px-2 py-2 text-start">{t('المستوى', 'Level')}</th><th className="px-2 py-2 text-start">{t('الفصل', 'Semester')}</th><th className="px-2 py-2 text-start">{t('النوع', 'Type')}</th><th className="px-2 py-2 text-start">{t('المتطلبات', 'Prerequisites')}</th><th className="px-2 py-2 text-start">{t('الحالة', 'Status')}</th></tr></thead>
                      <tbody>
                        {courses.map((course) => (
                          <tr key={course.id} className="border-t border-[#dfe1dd]">
                            <td className="px-2 py-2 font-semibold">{course.code}</td>
                            <td className="px-2 py-2">{course.nameAr || course.name || '-'}</td>
                            <td className="px-2 py-2">{course.creditHours}</td>
                            <td className="px-2 py-2">{course.level}</td>
                            <td className="px-2 py-2">{course.semester}</td>
                            <td className="px-2 py-2">{course.type}</td>
                            <td className="px-2 py-2">{course.prerequisites?.length ? course.prerequisites.length : '-'}</td>
                            <td className="px-2 py-2"><span className="rounded-full px-2 py-0.5 text-xs" style={{ background: course.status === 'active' ? '#E7FDD8' : '#FEF3C7', color: course.status === 'active' ? '#1ba442' : '#B45309' }}>{course.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UniversityStructure() {
  const { t } = useLanguage();
  const { user, isLoading: authLoading, isAuthenticated, isUniversityPortalUser, isCoordinator } = useAuth();
  const navigate = useNavigate();
  const canManageColleges = user?.role === 'university';
  const canManageDepartments = canManageColleges || user?.role === 'coordinator';
  const authReady = !authLoading && isAuthenticated && isUniversityPortalUser;
  const institutionalAccess = useInstitutionalAccess(authReady);
  const coordinatorReady = !isCoordinator || Boolean(institutionalAccess.data?.collegeId);
  const queryEnabled = authReady && institutionalAccess.isSuccess && coordinatorReady;
  const canEditAssignedCollege = user?.role === 'coordinator' && Boolean(institutionalAccess.data?.permissions.includes('college:write'));
  const [openCollege, setOpenCollege] = useState<string | null>(null);
  const [formDialog, setFormDialog] = useState<FormDialog | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [viewDepartment, setViewDepartment] = useState<UniversityDepartment | null>(null);
  const structureQuery = useUniversityStructure(queryEnabled);
  const createCollege = useCreateCollege();
  const updateCollege = useUpdateCollege();
  const archiveCollege = useArchiveCollege();
  const restoreCollege = useRestoreCollege();
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const archiveDepartment = useDeleteDepartment();
  const restoreDepartment = useRestoreDepartment();
  const formSubmitting = createCollege.isPending || updateCollege.isPending || createDepartment.isPending || updateDepartment.isPending;
  const confirmationSubmitting = archiveCollege.isPending || restoreCollege.isPending || archiveDepartment.isPending || restoreDepartment.isPending;

  const closeForm = () => { setFormDialog(null); setActionError(''); };
  const closeConfirmation = () => { setConfirmation(null); setActionError(''); };

  const submitCollege = async (payload: CreateCollegeRequest | UpdateCollegeRequest) => {
    setActionError('');
    try {
      if (formDialog?.type === 'college' && formDialog.mode === 'edit' && formDialog.college) {
        await updateCollege.mutateAsync({ collegeId: formDialog.college.id, data: payload as UpdateCollegeRequest });
        toast.success(t('تم تحديث الكلية', 'College updated'));
      } else {
        const created = await createCollege.mutateAsync(payload as CreateCollegeRequest);
        setOpenCollege(created.id);
        toast.success(t('تمت إضافة الكلية', 'College added'));
      }
      closeForm();
    } catch (error) {
      setActionError(apiError(error, t('تعذر حفظ بيانات الكلية', 'Unable to save college data')));
    }
  };

  const submitDepartment = async (payload: CreateDepartmentRequest | UpdateDepartmentRequest) => {
    if (formDialog?.type !== 'department') return;
    setActionError('');
    try {
      if (formDialog.mode === 'edit' && formDialog.department) {
        await updateDepartment.mutateAsync({ departmentId: formDialog.department.id, data: payload as UpdateDepartmentRequest });
        toast.success(t('تم تحديث القسم', 'Department updated'));
      } else {
        await createDepartment.mutateAsync({ collegeId: formDialog.college.id, data: payload as CreateDepartmentRequest });
        setOpenCollege(formDialog.college.id);
        toast.success(t('تمت إضافة القسم', 'Department added'));
      }
      closeForm();
    } catch (error) {
      setActionError(apiError(error, t('تعذر حفظ بيانات القسم', 'Unable to save department data')));
    }
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    const pendingConfirmation = confirmation;
    setActionError('');
    try {
      if (pendingConfirmation.type === 'archive-college') {
        await archiveCollege.mutateAsync(pendingConfirmation.college.id);
        toast.success(t('تمت أرشفة الكلية', 'College archived'));
      } else if (pendingConfirmation.type === 'restore-college') {
        await restoreCollege.mutateAsync(pendingConfirmation.college.id);
        toast.success(t('تم استرجاع الكلية', 'College restored'));
      } else if (pendingConfirmation.type === 'archive-department') {
        await archiveDepartment.mutateAsync(pendingConfirmation.department.id);
        toast.success(t('تمت أرشفة القسم', 'Department archived'));
      } else {
        await restoreDepartment.mutateAsync(pendingConfirmation.department.id);
        toast.success(t('تم استرجاع القسم', 'Department restored'));
      }
      closeConfirmation();
    } catch (error) {
      setActionError(apiError(error, t('تعذر تنفيذ العملية', 'Unable to complete the action')));
    }
  };

  if (structureQuery.isLoading) return <LoadingSpinner />;
  if (structureQuery.isError || !structureQuery.data) {
    return (
      <PortalLayout title={t('الهيكل الأكاديمي', 'Academic Structure')} subtitle={t('تعذر تحميل الهيكل الأكاديمي', 'Academic structure could not be loaded')}>
        <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl border bg-white p-8" style={{ borderColor: '#dfe1dd' }}><AlertTriangle size={30} style={{ color: '#dc2626' }} /><p className="text-sm font-semibold text-[#5b5e5a]">{t('حدث خطأ أثناء تحميل الكليات والأقسام.', 'An error occurred while loading colleges and departments.')}</p><button onClick={() => structureQuery.refetch()} disabled={structureQuery.isFetching} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: '#9fe870', color: '#0e0f0c' }}><RefreshCw size={15} className={structureQuery.isFetching ? 'animate-spin' : ''} />{t('إعادة المحاولة', 'Retry')}</button></div>
      </PortalLayout>
    );
  }

  const structure = structureQuery.data;
  const term = search.trim().toLocaleLowerCase();
  const filteredColleges = structure.colleges.filter((college) => {
    const statusMatches = statusFilter === 'all' || college.status === statusFilter;
    const searchMatches = !term || [college.name, college.code, college.description, college.dean]
      .some((value) => value?.toLocaleLowerCase().includes(term)) || college.departments.some((department) =>
        [department.name, department.code, department.description, department.head]
          .some((value) => value?.toLocaleLowerCase().includes(term)),
      );
    return statusMatches && searchMatches;
  });
  const totalStudyPlans = structure.colleges.reduce((total, college) => total + college.departments.reduce((sum, department) => sum + department.studyPlanCount, 0), 0);
  const totalCourses = structure.colleges.reduce((total, college) => total + college.departments.reduce((sum, department) => sum + department.courseCount, 0), 0);

  return (
    <PortalLayout title={t('الهيكل الأكاديمي', 'Academic Structure')} subtitle={structure.university.name || t('غير متوفر', 'Unavailable')}>
      <div className="mb-6 flex flex-wrap items-center gap-3"><StatusPill count={structure.totalColleges} label={t('كليات', 'Colleges')} bg="#E7FDD8" color="#1ba442" /><StatusPill count={structure.totalDepartments} label={t('أقسام', 'Departments')} bg="#DBEAFE" color="#3b82f6" /><StatusPill count={totalStudyPlans} label={t('خطط دراسية', 'Study Plans')} bg="#FEF3C7" color="#B45309" /><StatusPill count={totalCourses} label={t('مساقات', 'Courses')} bg="#F3E8FF" color="#7C3AED" /><button onClick={() => structureQuery.refetch()} disabled={structureQuery.isFetching} title={t('تحديث البيانات', 'Refresh data')} className="ml-auto rounded-full border p-2 disabled:opacity-50" style={{ borderColor: '#dfe1dd' }}><RefreshCw size={16} className={structureQuery.isFetching ? 'animate-spin' : ''} /></button></div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#828782]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('ابحث في الكليات والأقسام...', 'Search colleges and departments...')} className="h-11 w-full rounded-full border bg-white pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]" style={{ borderColor: '#dfe1dd' }} /></div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-11 rounded-full border bg-white px-4 text-sm font-semibold" style={{ borderColor: '#dfe1dd' }}><option value="all">{t('كل الحالات', 'All Statuses')}</option><option value="active">{t('نشطة', 'Active')}</option><option value="archived">{t('مؤرشفة', 'Archived')}</option></select>
        <button onClick={() => { setSearch(''); setStatusFilter('all'); }} disabled={!search && statusFilter === 'all'} className="inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold disabled:opacity-40" style={{ borderColor: '#dfe1dd' }}><SlidersHorizontal size={15} />{t('إعادة ضبط', 'Reset')}</button>
      </div>

      <ContentCard className="mb-6" title={t('الكليات والأقسام', 'Colleges and Departments')} icon={<Building2 size={18} style={{ color: '#5b5e5a' }} />} action={canManageColleges ? <button onClick={() => { setActionError(''); setFormDialog({ type: 'college', mode: 'create' }); }} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02]" style={{ background: '#9fe870', color: '#0e0f0c' }}><Plus size={14} />{t('إضافة كلية', 'Add College')}</button> : undefined}>
        {filteredColleges.length === 0 ? <p className="py-12 text-center text-sm font-semibold text-[#828782]">{structure.colleges.length === 0 ? t('لم تتم إضافة كليات بعد.', 'No colleges have been added yet.') : t('لا توجد نتائج مطابقة للبحث.', 'No structure entries match the current filters.')}</p> : <div className="space-y-3">{filteredColleges.map((college) => {
          const isOpen = openCollege === college.id;
          const archived = college.status === 'archived';
          return <div key={college.id} className="overflow-hidden rounded-2xl border" style={{ borderColor: '#dfe1dd', background: '#ffffff', opacity: archived ? 0.75 : 1 }}>
            <button onClick={() => setOpenCollege(isOpen ? null : college.id)} className="flex w-full items-center justify-between p-5 text-left hover:bg-[#f0f1ee]/50"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#E7FDD8' }}><GraduationCap size={20} style={{ color: '#1ba442' }} /></div><div><h3 className="text-sm font-bold text-[#0e0f0c]">{college.name}</h3><p className="text-xs font-semibold text-[#828782]">{college.code || t('بدون رمز', 'No code')} - {college.departments.length} {t('قسم', 'departments')}</p></div></div><div className="flex items-center gap-3"><span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: archived ? '#FEF3C7' : '#E7FDD8', color: archived ? '#B45309' : '#1ba442' }}>{archived ? t('مؤرشفة', 'Archived') : t('نشطة', 'Active')}</span><span className="flex items-center gap-1 text-xs font-semibold text-[#5b5e5a]"><Users size={13} />{college.studentCount}</span>{isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div></button>
            {isOpen && <div className="border-t p-5" style={{ borderColor: '#dfe1dd', background: '#fafbfa' }}>
              {(canManageColleges || canManageDepartments) && <div className="mb-4 flex flex-wrap gap-2">{canManageColleges && <><button onClick={() => { setActionError(''); setFormDialog({ type: 'college', mode: 'edit', college }); }} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: '#dfe1dd' }}><Pencil size={13} />{t('تعديل الكلية', 'Edit College')}</button>{archived ? <button onClick={() => { setActionError(''); setConfirmation({ type: 'restore-college', college }); }} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: '#E7FDD8', color: '#1ba442' }}><RotateCcw size={13} />{t('استرجاع الكلية', 'Restore College')}</button> : <button onClick={() => { setActionError(''); setConfirmation({ type: 'archive-college', college }); }} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: '#FEF3C7', color: '#B45309' }}><Archive size={13} />{t('أرشفة الكلية', 'Archive College')}</button>}</>}{canManageDepartments && !archived && <button onClick={() => { setActionError(''); setFormDialog({ type: 'department', mode: 'create', college }); }} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: '#9fe870', color: '#0e0f0c' }}><Plus size={13} />{t('إضافة قسم', 'Add Department')}</button>}</div>}
               {canEditAssignedCollege && <div className="mb-4"><button onClick={() => { setActionError(''); setFormDialog({ type: 'college', mode: 'edit', college }); }} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: '#dfe1dd' }}><Pencil size={13} />{t('تعديل بيانات الكلية المسموحة', 'Edit permitted college data')}</button></div>}
               {college.description && <p className="mb-4 text-sm text-[#5b5e5a]">{college.description}</p>}
              {college.departments.length === 0 ? <p className="py-6 text-center text-sm font-semibold text-[#828782]">{t('لا توجد أقسام في هذه الكلية.', 'This college has no departments.')}</p> : <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{college.departments.map((department) => <div key={department.id} className="rounded-xl border bg-white p-4" style={{ borderColor: '#dfe1dd' }}><div className="flex items-start justify-between"><div><h4 className="text-sm font-bold">{department.name}</h4><p className="mt-1 text-xs text-[#828782]">{department.code || t('بدون رمز', 'No code')}</p></div><span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: department.status === 'archived' ? '#FEF3C7' : '#E7FDD8', color: department.status === 'archived' ? '#B45309' : '#1ba442' }}>{department.status}</span></div>{department.description && <p className="mt-2 text-xs text-[#5b5e5a]">{department.description}</p>}<div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#5b5e5a]"><span><Users size={12} className="inline" /> {department.studentCount}</span><span><BookOpen size={12} className="inline" /> {department.courseCount}</span><span><Library size={12} className="inline" /> {department.studyPlanCount}</span></div><div className="mt-3 flex gap-2"><button onClick={() => { setActionError(''); setViewDepartment(department); }} className="rounded-full p-1.5" style={{ background: '#DBEAFE', color: '#3b82f6' }} title={t('عرض الخطط والمقررات', 'View plans and courses')}><BookOpen size={13} /></button>{canManageDepartments && <><button onClick={() => { setActionError(''); setFormDialog({ type: 'department', mode: 'edit', college, department }); }} className="rounded-full border p-1.5" title={t('تعديل القسم', 'Edit department')}><Pencil size={13} /></button>{department.status === 'archived' ? <button onClick={() => { setActionError(''); setConfirmation({ type: 'restore-department', college, department }); }} className="rounded-full p-1.5" style={{ background: '#E7FDD8', color: '#1ba442' }} title={t('استرجاع القسم', 'Restore department')}><RotateCcw size={13} /></button> : <button onClick={() => { setActionError(''); setConfirmation({ type: 'archive-department', college, department }); }} className="rounded-full p-1.5" style={{ background: '#FEF3C7', color: '#B45309' }} title={t('أرشفة القسم', 'Archive department')}><Archive size={13} /></button>}</>}</div></div>)}</div>}
            </div>}
          </div>;
        })}</div>}
      </ContentCard>

      <ContentCard className="mb-6" title={t('الخطط الدراسية', 'Study Plans')} icon={<BookOpen size={18} style={{ color: '#5b5e5a' }} />} action={<button onClick={() => navigate('/university/curriculum')} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold" style={{ background: '#9fe870', color: '#0e0f0c' }}><Plus size={14} />{t('إدارة الخطط', 'Manage Plans')}</button>}><p className="py-10 text-center text-sm font-semibold text-[#828782]">{t('تتم إدارة الخطط الدراسية وإصداراتها من وحدة المناهج.', 'Study plans and versions are managed in the curriculum module.')}</p></ContentCard>
      <ContentCard title={t('دليل المقررات', 'Course Catalog')} icon={<Library size={18} style={{ color: '#5b5e5a' }} />} action={<button onClick={() => navigate('/university/curriculum')} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold" style={{ background: '#9fe870', color: '#0e0f0c' }}><Plus size={14} />{t('إدارة المقررات', 'Manage Courses')}</button>}><p className="py-10 text-center text-sm font-semibold text-[#828782]">{t('أضف المقررات واربطها بالخطط والمهارات من وحدة المناهج.', 'Add courses and connect them to plans and skills in the curriculum module.')}</p></ContentCard>

      {viewDepartment && <DepartmentDetailsDialog department={viewDepartment} onClose={() => setViewDepartment(null)} t={t} />}

      <CollegeFormDialog open={formDialog?.type === 'college'} mode={formDialog?.type === 'college' ? formDialog.mode : 'create'} initial={formDialog?.type === 'college' ? formDialog.college : undefined} submitting={formSubmitting} serverError={actionError} onOpenChange={(open) => !open && closeForm()} onSubmit={submitCollege} t={t} />
      <DepartmentFormDialog open={formDialog?.type === 'department'} mode={formDialog?.type === 'department' ? formDialog.mode : 'create'} collegeName={formDialog?.type === 'department' ? formDialog.college.name : ''} initial={formDialog?.type === 'department' ? formDialog.department : undefined} submitting={formSubmitting} serverError={actionError} onOpenChange={(open) => !open && closeForm()} onSubmit={submitDepartment} t={t} />
      <ConfirmActionDialog open={Boolean(confirmation)} title={confirmation?.type === 'restore-college' ? t('استرجاع الكلية', 'Restore College') : confirmation?.type === 'restore-department' ? t('استرجاع القسم', 'Restore Department') : confirmation?.type === 'archive-department' ? t('أرشفة القسم', 'Archive Department') : t('أرشفة الكلية', 'Archive College')} description={confirmation?.type === 'restore-college' || confirmation?.type === 'restore-department' ? t('سيتم إعادة العنصر إلى الحالة النشطة.', 'The item will return to active status.') : t('ستبقى البيانات محفوظة ولن يتم حذفها نهائيًا.', 'Data will remain saved and will not be permanently deleted.')} confirmLabel={confirmation?.type === 'restore-college' || confirmation?.type === 'restore-department' ? t('استرجاع', 'Restore') : t('أرشفة', 'Archive')} cancelLabel={t('إلغاء', 'Cancel')} destructive={confirmation?.type !== 'restore-college' && confirmation?.type !== 'restore-department'} submitting={confirmationSubmitting} error={actionError} onOpenChange={(open) => !open && closeConfirmation()} onConfirm={confirmAction} />
    </PortalLayout>
  );
}
