import { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import PortalLayout from '@/components/PortalLayout';
import MetricCard from '@/components/MetricCard';
import ContentCard from '@/components/ContentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInstitutionalAccess, useUniversityStudents, useUniversityStudentStatistics, useReviewStudentAffiliation } from '@/hooks/useUniversity';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { UniversityStudent } from '@/types/university.types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertTriangle, BarChart3, ChevronLeft, ChevronRight, Download, Eye,
  Loader2, PieChart as PieIcon, Plus, RefreshCw, Search, SlidersHorizontal,
  Upload, Users,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  employed: '#1ba442',
  seeking: '#f59e0b',
  interviewing: '#3b82f6',
  'not-interested': '#828782',
  'further-studies': '#a855f7',
  unknown: '#5b5e5a',
};

function LoadingSpinner() {
  return <div className="flex h-96 items-center justify-center"><Loader2 size={32} className="animate-spin text-[#9fe870]" /></div>;
}

export default function UniversityStudents() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [academicLevelFilter, setAcademicLevelFilter] = useState('all');
  const [gpaFilter, setGpaFilter] = useState('all');
  const [limit, setLimit] = useState(20);
  const [selectedStudent, setSelectedStudent] = useState<UniversityStudent | null>(null);
  const [affiliationFilter, setAffiliationFilter] = useState('all');
  const [reviewAction, setReviewAction] = useState<'reject' | 'suspend' | null>(null);
  const [reviewReason, setReviewReason] = useState('');
  const { user: authenticatedUser } = useAuth();
  const institutionalAccess = useInstitutionalAccess(true);
  const hasAffiliationPermission = Boolean(institutionalAccess.data?.permissions.includes('affiliations:write'));
  const user = hasAffiliationPermission ? { ...authenticatedUser, role: 'university' as const } : authenticatedUser;
  const reviewAffiliation = useReviewStudentAffiliation();

  const query = useMemo(() => ({
    page,
    limit,
    search: search.trim() || undefined,
    college: collegeFilter === 'all' ? undefined : collegeFilter,
    department: departmentFilter === 'all' ? undefined : departmentFilter,
    status: statusFilter === 'all' ? undefined : statusFilter,
    academicLevel: academicLevelFilter === 'all' ? undefined : academicLevelFilter,
    gpaMin: gpaFilter === 'all' ? undefined : Number(gpaFilter),
    affiliationStatus: affiliationFilter === 'all' ? undefined : affiliationFilter,
  }), [page, search, collegeFilter, departmentFilter, statusFilter, academicLevelFilter, gpaFilter, affiliationFilter]);

  const studentsQuery = useUniversityStudents(query, true);
  const statisticsQuery = useUniversityStudentStatistics(true);
  const studentsData = studentsQuery.data;
  const statistics = statisticsQuery.data;
  const students = studentsData?.items ?? [];
  const pagination = studentsData?.pagination ?? { page: 1, limit, total: 0, totalPages: 0 };
  const colleges = studentsData?.filters.colleges ?? [];
  const departments = studentsData?.filters.departments ?? [];
  const availableDepartments = collegeFilter === 'all'
    ? departments
    : departments.filter((department) => department.collegeId === collegeFilter);
  const pieData = (statistics?.employmentStatusDistribution ?? []).map((entry) => ({
    name: entry.status,
    value: entry.count,
    color: STATUS_COLORS[entry.status] || STATUS_COLORS.unknown,
  }));
  const skillData = statistics?.topSkillsDistribution ?? [];
  const employmentTimeline = statistics?.employmentTimeline ?? [];
  const hasFilters = Boolean(search || collegeFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all' || academicLevelFilter !== 'all' || gpaFilter !== 'all');
  const resetFilters = () => {
    setSearch('');
    setCollegeFilter('all');
    setDepartmentFilter('all');
    setStatusFilter('all');
    setAcademicLevelFilter('all');
    setGpaFilter('all');
    setAffiliationFilter('all');
    setPage(1);
  };

  const statusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      employed: t('موظف', 'Employed'),
      seeking: t('يبحث عن عمل', 'Seeking'),
      interviewing: t('في المقابلات', 'Interviewing'),
      'not-interested': t('لا يبحث', 'Not seeking'),
      'further-studies': t('دراسات عليا', 'Further studies'),
      unknown: t('غير محدد', 'Not specified'),
    };
    return labels[status || 'unknown'] || status || labels.unknown;
  };

  if (studentsQuery.isLoading || studentsQuery.isPending) return <LoadingSpinner />;
  if (studentsQuery.isError) {
    const isAuthError = (studentsQuery.error as any)?.response?.status === 401 || (studentsQuery.error as any)?.response?.status === 403;
    const errorMessage = isAuthError
      ? t('ليس لديك صلاحية لعرض دليل الطلاب.', 'You do not have permission to view the student directory.')
      : t('تعذر الاتصال بالخادم، تحقق من تشغيل الخدمة.', 'Unable to connect to the server. Please check that the service is running.');
    return (
      <PortalLayout title={t('دليل الطلاب', 'Student Directory')} subtitle={t('تعذر تحميل قائمة الطلاب', 'Student list could not be loaded')}>
        <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl border bg-white p-8" style={{ borderColor: '#dfe1dd' }}>
          <AlertTriangle size={30} style={{ color: '#dc2626' }} />
          <p className="text-sm font-semibold text-[#5b5e5a]">{errorMessage}</p>
          <button onClick={() => { studentsQuery.refetch(); statisticsQuery.refetch(); }} disabled={studentsQuery.isFetching || statisticsQuery.isFetching} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: '#9fe870', color: '#0e0f0c' }}>
            <RefreshCw size={15} className={studentsQuery.isFetching || statisticsQuery.isFetching ? 'animate-spin' : ''} />{t('إعادة المحاولة', 'Retry')}
          </button>
        </div>
      </PortalLayout>
    );
  }
  if (!studentsData) {
    return (
      <PortalLayout title={t('دليل الطلاب', 'Student Directory')} subtitle={t('لا توجد بيانات متاحة', 'No data available')}>
        <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl border bg-white p-8" style={{ borderColor: '#dfe1dd' }}>
          <Users size={30} style={{ color: '#828782' }} />
          <p className="text-sm font-semibold text-[#5b5e5a]">{t('لا يوجد طلاب مرتبطون بالجامعة حتى الآن.', 'There are no students affiliated with the university yet.')}</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout title={t('دليل الطلاب', 'Student Directory')} subtitle={`${pagination.total.toLocaleString()} ${t('طالب', 'students')}`}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#828782]" />
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('ابحث عن طالب...', 'Search students...')} className="h-11 w-full rounded-full border pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]" style={{ borderColor: '#dfe1dd' }} />
        </div>
        <button onClick={() => { studentsQuery.refetch(); statisticsQuery.refetch(); }} disabled={studentsQuery.isFetching || statisticsQuery.isFetching} title={t('تحديث البيانات', 'Refresh data')} className="flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold disabled:opacity-50" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}><RefreshCw size={16} className={studentsQuery.isFetching || statisticsQuery.isFetching ? 'animate-spin' : ''} />{t('تحديث', 'Refresh')}</button>
        <button onClick={resetFilters} disabled={!hasFilters} title={t('مسح البحث والفلاتر', 'Clear search and filters')} className="flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold disabled:opacity-40" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}><SlidersHorizontal size={16} />{t('إعادة ضبط', 'Reset')}</button>
        <button disabled title={t('التصدير غير مشمول في هذه المرحلة', 'Export is outside this phase')} className="hidden h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold opacity-60 sm:inline-flex" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}><Download size={16} />{t('تصدير', 'Export')}</button>
        <button disabled title={t('الاستيراد غير مشمول في هذه المرحلة', 'Import is outside this phase')} className="hidden h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold opacity-60 sm:inline-flex" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}><Upload size={16} />{t('استيراد', 'Import')}</button>
        <button disabled title={t('إضافة الطلاب تتم عبر التسجيل', 'Students are added through registration')} className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold opacity-60" style={{ background: '#9fe870', color: '#0e0f0c' }}><Plus size={16} />{t('إضافة طالب', 'Add Student')}</button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={<Users size={20} style={{ color: '#3b82f6' }} />} iconBg="#DBEAFE" value={(statistics?.summary.totalStudents ?? pagination.total).toLocaleString()} label={t('إجمالي الطلاب', 'Total Students')} valueColor="#3b82f6" />
        <MetricCard icon={<Users size={20} style={{ color: '#1ba442' }} />} iconBg="#E7FDD8" value={(statistics?.summary.activeStudents ?? 0).toLocaleString()} label={t('طلاب نشطون', 'Active Students')} valueColor="#1ba442" />
        <MetricCard icon={<Users size={20} style={{ color: '#a855f7' }} />} iconBg="#F3E8FF" value={(statistics?.summary.graduates ?? 0).toLocaleString()} label={t('خريجون', 'Graduates')} valueColor="#a855f7" />
        <MetricCard icon={<BarChart3 size={20} style={{ color: '#f59e0b' }} />} iconBg="#FEF3C7" value={`${statistics?.summary.averageReadiness ?? 0}%`} label={t('متوسط الجاهزية', 'Average Readiness')} valueColor="#f59e0b" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">{['all', 'pending', 'verified', 'rejected', 'suspended', 'graduated'].map((status) => <button key={status} onClick={() => { setAffiliationFilter(status); setPage(1); }} className={`rounded-full px-4 py-2 text-xs font-bold ${affiliationFilter === status ? 'bg-[#9fe870] text-[#0e0f0c]' : 'border bg-white text-[#5b5e5a]'}`}>{status === 'all' ? t('جميع الطلاب', 'All Students') : status}</button>)}</div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ContentCard title={t('دليل الطلاب', 'Student Directory')} subtitle={`${pagination.total} ${t('نتيجة', 'results')}`} icon={<Users size={18} style={{ color: '#5b5e5a' }} />} noPadding>
            <div className="flex flex-wrap gap-2 border-b px-6 py-4" style={{ borderColor: '#dfe1dd' }}>
              <select value={collegeFilter} onChange={(event) => { setCollegeFilter(event.target.value); setDepartmentFilter('all'); setPage(1); }} className="h-9 rounded-full border px-3 text-xs font-semibold" style={{ borderColor: '#dfe1dd' }}><option value="all">{t('كل الكليات', 'All Colleges')}</option>{colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}</select>
              <select value={departmentFilter} onChange={(event) => { setDepartmentFilter(event.target.value); setPage(1); }} className="h-9 rounded-full border px-3 text-xs font-semibold" style={{ borderColor: '#dfe1dd' }}><option value="all">{t('كل الأقسام', 'All Departments')}</option>{availableDepartments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>
              <select value={academicLevelFilter} onChange={(event) => { setAcademicLevelFilter(event.target.value); setPage(1); }} className="h-9 rounded-full border px-3 text-xs font-semibold" style={{ borderColor: '#dfe1dd' }}><option value="all">{t('كل المستويات', 'All Levels')}</option>{['freshman', 'sophomore', 'junior', 'senior', 'graduate'].map((level) => <option key={level} value={level}>{level}</option>)}</select>
              <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-9 rounded-full border px-3 text-xs font-semibold" style={{ borderColor: '#dfe1dd' }}><option value="all">{t('كل الحالات', 'All Statuses')}</option>{Object.keys(STATUS_COLORS).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select>
              <select value={gpaFilter} onChange={(event) => { setGpaFilter(event.target.value); setPage(1); }} className="h-9 rounded-full border px-3 text-xs font-semibold" style={{ borderColor: '#dfe1dd' }}><option value="all">{t('كل المعدلات', 'All GPA')}</option><option value="3.5">3.5+</option><option value="3">3.0+</option><option value="2.5">2.5+</option></select>
            </div>

            {students.length === 0 ? <p className="py-12 text-center text-sm font-semibold text-[#828782]">{t('لا يوجد طلاب مطابقون للبحث.', 'No students match the current query.')}</p> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr style={{ background: '#f0f1ee' }}>{[t('الرقم', 'ID'), t('الاسم', 'Name'), t('الكلية', 'College'), t('القسم', 'Department'), t('المعدل', 'GPA'), t('سنة التخرج', 'Grad Year'), t('الحالة', 'Status'), t('المهارات', 'Skills'), t('إجراءات', 'Actions')].map((heading) => <th key={heading} className="px-3 py-3 text-left text-xs font-bold uppercase" style={{ color: '#5b5e5a' }}>{heading}</th>)}</tr></thead>
                  <tbody>{students.map((student) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid #dfe1dd' }}>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs font-bold text-[#828782]">{student.studentNumber || student.id}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm font-bold">{student.fullName || t('غير متوفر', 'Unavailable')}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold text-[#5b5e5a]">{student.collegeName || t('غير متوفر', 'Unavailable')}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-[#828782]">{student.departmentName || t('غير متوفر', 'Unavailable')}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-sm font-black">{student.gpa?.toFixed(2) ?? t('غير متوفر', 'Unavailable')}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold">{student.graduationYear ?? t('غير متوفر', 'Unavailable')}</td>
                      <td className="whitespace-nowrap px-3 py-2.5"><span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: '#f0f1ee', color: STATUS_COLORS[student.employmentStatus || 'unknown'] }}>{statusLabel(student.employmentStatus)}</span></td>
                      <td className="px-3 py-2.5"><div className="flex flex-wrap gap-1">{student.skills.slice(0, 3).map((skill, index) => <span key={`${student.id}-${skill}-${index}`} className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: '#E7FDD8', color: '#1ba442' }}>{skill}</span>)}</div></td>
                      <td className="px-3 py-2.5"><button onClick={() => setSelectedStudent(student)} title={t('عرض التفاصيل', 'View details')} className="rounded-full p-1.5 transition-colors hover:bg-[#f0f1ee]"><Eye size={14} style={{ color: '#3b82f6' }} /></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between border-t px-6 py-3" style={{ borderColor: '#dfe1dd' }}>
              <div className="flex items-center gap-3"><span className="text-xs font-semibold text-[#828782]">{t('الصفحة', 'Page')} {pagination.page} {t('من', 'of')} {Math.max(pagination.totalPages, 1)}</span><select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} className="h-8 rounded-full border px-2 text-xs font-semibold" style={{ borderColor: '#dfe1dd' }} aria-label={t('حجم الصفحة', 'Page size')}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select></div>
              <div className="flex gap-2">
                <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={pagination.page <= 1 || studentsQuery.isFetching} className="rounded-full border p-2 disabled:opacity-40" style={{ borderColor: '#dfe1dd' }}><ChevronLeft size={15} /></button>
                <button onClick={() => setPage((current) => current + 1)} disabled={pagination.page >= pagination.totalPages || studentsQuery.isFetching} className="rounded-full border p-2 disabled:opacity-40" style={{ borderColor: '#dfe1dd' }}><ChevronRight size={15} /></button>
              </div>
            </div>
          </ContentCard>
        </div>

        <div className="space-y-6 xl:col-span-2">
          {statisticsQuery.isError && <ContentCard title={t('إحصاءات الطلاب', 'Student Statistics')} icon={<AlertTriangle size={18} style={{ color: '#dc2626' }} />}><button onClick={() => statisticsQuery.refetch()} className="inline-flex items-center gap-2 text-sm font-semibold"><RefreshCw size={14} />{t('إعادة تحميل الإحصاءات', 'Retry statistics')}</button></ContentCard>}
          {pieData.length > 0 && <ContentCard title={t('توزيع حالات التوظيف', 'Employment Status Distribution')} icon={<PieIcon size={18} style={{ color: '#5b5e5a' }} />}><div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="45%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" stroke="none">{pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip formatter={(value: number) => [value, t('طلاب', 'Students')]} /><Legend /></PieChart></ResponsiveContainer></div></ContentCard>}
          {skillData.length > 0 && <ContentCard title={t('توزيع المهارات', 'Skill Distribution')} icon={<BarChart3 size={18} style={{ color: '#5b5e5a' }} />}><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={skillData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" horizontal={false} /><XAxis type="number" /><YAxis dataKey="skill" type="category" width={100} /><Tooltip /><Bar dataKey="count" fill="#9fe870" radius={[0, 6, 6, 0]} /></BarChart></ResponsiveContainer></div></ContentCard>}
          {employmentTimeline.length > 0 && <ContentCard title={t('الخط الزمني للتوظيف', 'Employment Timeline')} icon={<BarChart3 size={18} style={{ color: '#5b5e5a' }} />}><div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={employmentTimeline}><CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" /><XAxis dataKey="period" /><YAxis /><Tooltip /><Line type="monotone" dataKey="employed" stroke="#1ba442" strokeWidth={2} name={t('موظفون', 'Employed')} /><Line type="monotone" dataKey="applicants" stroke="#3b82f6" strokeWidth={2} name={t('متقدمون', 'Applicants')} /></LineChart></ResponsiveContainer></div></ContentCard>}
          {!statisticsQuery.isLoading && !statisticsQuery.isError && pieData.length === 0 && skillData.length === 0 && <ContentCard title={t('إحصاءات الطلاب', 'Student Statistics')} icon={<BarChart3 size={18} style={{ color: '#5b5e5a' }} />}><p className="py-8 text-center text-sm font-semibold text-[#828782]">{t('لا توجد إحصاءات مسجلة بعد.', 'No statistics are recorded yet.')}</p></ContentCard>}
        </div>
      </div>
      <Dialog open={Boolean(selectedStudent)} onOpenChange={(open) => !open && setSelectedStudent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{selectedStudent?.fullName || t('تفاصيل الطالب', 'Student Details')}</DialogTitle><DialogDescription>{t('بيانات الدليل المتاحة لهذه الجامعة فقط.', 'Directory data available to this university only.')}</DialogDescription></DialogHeader>
          {selectedStudent && <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-[#f0f1ee] p-3"><p className="text-xs font-semibold text-[#828782]">{t('الرقم الجامعي', 'Student Number')}</p><p className="mt-1 font-bold">{selectedStudent.studentNumber || t('غير متوفر', 'Unavailable')}</p></div>
            <div className="rounded-xl bg-[#f0f1ee] p-3"><p className="text-xs font-semibold text-[#828782]">{t('البريد الإلكتروني', 'Email')}</p><p className="mt-1 break-all font-bold">{selectedStudent.email || t('غير متوفر', 'Unavailable')}</p></div>
            <div className="rounded-xl bg-[#f0f1ee] p-3"><p className="text-xs font-semibold text-[#828782]">{t('المستوى', 'Academic Level')}</p><p className="mt-1 font-bold">{selectedStudent.academicLevel || t('غير متوفر', 'Unavailable')}</p></div>
            <div className="rounded-xl bg-[#f0f1ee] p-3"><p className="text-xs font-semibold text-[#828782]">{t('الكلية', 'College')}</p><p className="mt-1 font-bold">{selectedStudent.collegeName || t('غير متوفر', 'Unavailable')}</p></div>
            <div className="rounded-xl bg-[#f0f1ee] p-3"><p className="text-xs font-semibold text-[#828782]">{t('القسم', 'Department')}</p><p className="mt-1 font-bold">{selectedStudent.departmentName || t('غير متوفر', 'Unavailable')}</p></div>
            <div className="rounded-xl bg-[#f0f1ee] p-3"><p className="text-xs font-semibold text-[#828782]">{t('المعدل', 'GPA')}</p><p className="mt-1 font-bold">{selectedStudent.gpa?.toFixed(2) ?? t('غير متوفر', 'Unavailable')}</p></div>
            <div className="rounded-xl bg-[#f0f1ee] p-3"><p className="text-xs font-semibold text-[#828782]">{t('الجاهزية', 'Readiness')}</p><p className="mt-1 font-bold">{selectedStudent.readinessScore == null ? t('غير متوفر', 'Unavailable') : `${selectedStudent.readinessScore}%`}</p></div>
            <div className="rounded-xl bg-[#f0f1ee] p-3"><p className="text-xs font-semibold text-[#828782]">{t('حالة التوظيف', 'Employment Status')}</p><p className="mt-1 font-bold">{statusLabel(selectedStudent.employmentStatus)}</p></div>
            <div className="rounded-xl bg-[#f0f1ee] p-3"><p className="text-xs font-semibold text-[#828782]">{t('حالة السيرة الذاتية', 'CV Status')}</p><p className="mt-1 font-bold">{selectedStudent.cvStatus || t('غير متوفر', 'Unavailable')}</p></div>
            <div className="sm:col-span-2"><p className="mb-2 text-xs font-semibold text-[#828782]">{t('المهارات', 'Skills')}</p><div className="flex flex-wrap gap-2">{selectedStudent.skills.length ? selectedStudent.skills.map((skill, index) => <span key={`${skill}-${index}`} className="rounded-full bg-[#E7FDD8] px-2.5 py-1 text-xs font-semibold text-[#1ba442]">{skill}</span>) : <span className="text-sm text-[#828782]">{t('لا توجد مهارات مسجلة', 'No skills recorded')}</span>}</div></div>
            <div className="rounded-xl bg-[#f0f1ee] p-3"><p className="text-xs font-semibold text-[#828782]">{t('حالة الانتساب', 'Affiliation Status')}</p><p className="mt-1 font-bold">{selectedStudent.affiliationStatus || '—'}</p></div>
            <div className="rounded-xl bg-[#f0f1ee] p-3"><p className="text-xs font-semibold text-[#828782]">{t('سنوات الدراسة', 'Study Years')}</p><p className="mt-1 font-bold">{selectedStudent.enrollmentYear || '—'} - {selectedStudent.expectedGraduationYear || '—'}</p></div>
            {user?.role === 'university' && <div className="sm:col-span-2 space-y-3 border-t pt-4"><div className="flex flex-wrap gap-2"><button disabled={reviewAffiliation.isPending} onClick={async () => { await reviewAffiliation.mutateAsync({ studentId: selectedStudent.id, action: 'verify' }); toast.success(t('تم اعتماد الانتساب', 'Affiliation verified')); setSelectedStudent(null); }} className="rounded-full bg-[#9fe870] px-4 py-2 text-xs font-bold">{t('اعتماد', 'Verify')}</button><button onClick={() => setReviewAction('reject')} className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-700">{t('رفض', 'Reject')}</button><button onClick={() => setReviewAction('suspend')} className="rounded-full bg-[#FEF3C7] px-4 py-2 text-xs font-bold text-[#B45309]">{t('تعليق', 'Suspend')}</button><button disabled={reviewAffiliation.isPending} onClick={async () => { await reviewAffiliation.mutateAsync({ studentId: selectedStudent.id, action: 'mark-graduated' }); toast.success(t('تم تحديد الطالب كخريج', 'Student marked as graduated')); setSelectedStudent(null); }} className="rounded-full border px-4 py-2 text-xs font-bold">{t('تحديد كخريج', 'Mark Graduated')}</button></div>{reviewAction && <div className="space-y-2 rounded-xl bg-[#f8f9f7] p-3"><textarea value={reviewReason} onChange={(e) => setReviewReason(e.target.value)} placeholder={t('اكتب السبب المطلوب', 'Enter the required reason')} className="w-full rounded-lg border p-3 text-sm" /><div className="flex gap-2"><button onClick={() => { setReviewAction(null); setReviewReason(''); }} className="rounded-full border px-3 py-2 text-xs">{t('إلغاء', 'Cancel')}</button><button disabled={!reviewReason.trim() || reviewAffiliation.isPending} onClick={async () => { await reviewAffiliation.mutateAsync({ studentId: selectedStudent.id, action: reviewAction, reason: reviewReason }); toast.success(t('تم تحديث الانتساب', 'Affiliation updated')); setSelectedStudent(null); setReviewAction(null); setReviewReason(''); }} className="rounded-full bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{t('تأكيد', 'Confirm')}</button></div></div>}</div>}
          </div>}
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
