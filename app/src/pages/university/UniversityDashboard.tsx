import { useMemo, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import PortalLayout from '@/components/PortalLayout';
import MetricCard from '@/components/MetricCard';
import ContentCard from '@/components/ContentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useInstitutionalAccess, useUniversityDashboard } from '@/hooks/useUniversity';
import { getRoleLabel } from '@/constants/roleLabels';
import {
  AlertTriangle, Award, Briefcase, Building2, CheckCircle2, FileText,
  GraduationCap, Layers3, Loader2, RefreshCw, TrendingUp, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function LoadingSpinner() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#9fe870]" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="py-10 text-center text-sm font-semibold text-[#828782]">{message}</p>;
}

export default function UniversityDashboard() {
  const { t, language } = useLanguage();
  const { isLoading: authLoading, isAuthenticated, isUniversityPortalUser, user } = useAuth();
  const authReady = !authLoading && isAuthenticated && isUniversityPortalUser;
  const access = useInstitutionalAccess(authReady);
  const queryEnabled = authReady && access.isSuccess;
  const [timeFilter, setTimeFilter] = useState<'5' | '3' | '1'>('5');
  const { data: dashboard, isLoading, isError, refetch, isFetching } = useUniversityDashboard(queryEnabled);

  const trendData = useMemo(() => {
    const periods = timeFilter === '5' ? 5 : timeFilter === '3' ? 3 : 1;
    return (dashboard?.trends.employment ?? []).slice(-periods);
  }, [dashboard?.trends.employment, timeFilter]);

  if (isLoading) return <LoadingSpinner />;
  if (isError || !dashboard) {
    return (
      <PortalLayout title={t('لوحة التحكم', 'Dashboard')} subtitle={t('تعذر تحميل بيانات الجامعة', 'University data could not be loaded')}>
        <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl border bg-white p-8" style={{ borderColor: '#dfe1dd' }}>
          <AlertTriangle size={30} style={{ color: '#dc2626' }} />
          <p className="text-sm font-semibold" style={{ color: '#5b5e5a' }}>{t('حدث خطأ أثناء تحميل لوحة التحكم.', 'An error occurred while loading the dashboard.')}</p>
          <button onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: '#9fe870', color: '#0e0f0c' }}>
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            {t('إعادة المحاولة', 'Retry')}
          </button>
        </div>
      </PortalLayout>
    );
  }

  const { university, summary, collegePerformance, topSkills, topEmployers, recentActivities, skillGaps } = dashboard;
  const academicYear = university.academicYear || t('غير محددة', 'Not specified');
  const metrics = [
    { icon: <Briefcase size={20} style={{ color: '#1ba442' }} />, iconBg: '#E7FDD8', value: `${summary.employmentRate}%`, label: t('معدل التوظيف', 'Employment Rate'), valueColor: '#1ba442' },
    { icon: <Users size={20} style={{ color: '#3b82f6' }} />, iconBg: '#DBEAFE', value: summary.totalStudents.toLocaleString(), label: t('إجمالي الطلاب', 'Total Students'), valueColor: '#3b82f6' },
    { icon: <Building2 size={20} style={{ color: '#a855f7' }} />, iconBg: '#F3E8FF', value: summary.totalColleges.toLocaleString(), label: t('الكليات', 'Colleges'), valueColor: '#a855f7' },
    { icon: <Layers3 size={20} style={{ color: '#f59e0b' }} />, iconBg: '#FEF3C7', value: summary.totalDepartments.toLocaleString(), label: t('الأقسام', 'Departments'), valueColor: '#f59e0b' },
    { icon: <CheckCircle2 size={20} style={{ color: '#1ba442' }} />, iconBg: '#E7FDD8', value: `${summary.averageReadiness}%`, label: t('متوسط الجاهزية', 'Average Readiness'), valueColor: '#1ba442' },
    { icon: <TrendingUp size={20} style={{ color: '#3b82f6' }} />, iconBg: '#DBEAFE', value: `${summary.curriculumAlignment ?? 0}%`, label: t('مواءمة المناهج', 'Curriculum Alignment'), valueColor: '#3b82f6' },
  ];
  const timeFilters = [
    { key: '5' as const, label: t('5 فترات', '5 Periods') },
    { key: '3' as const, label: t('3 فترات', '3 Periods') },
    { key: '1' as const, label: t('فترة واحدة', '1 Period') },
  ];
  const roleLabel = user?.role ? t(getRoleLabel(user.role, 'ar'), getRoleLabel(user.role, 'en')) : '';
  const institutionName = access.data?.college?.name || university.name || '';
  const subtitle = institutionName
    ? `${roleLabel}${institutionName ? ' — ' + institutionName : ''} · ${t('السنة الأكاديمية', 'Academic Year')}: ${academicYear}`
    : t('بيانات الجامعة', 'University data');

  return (
    <PortalLayout title={t('لوحة التحكم', 'Dashboard')} subtitle={subtitle}>
      <div className="mb-3 flex justify-end"><button onClick={() => refetch()} disabled={isFetching} title={t('تحديث بيانات لوحة التحكم', 'Refresh dashboard data')} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold disabled:opacity-50" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}><RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />{t('تحديث', 'Refresh')}</button></div>
      <div className="relative mb-6 overflow-hidden rounded-3xl p-8" style={{ background: 'linear-gradient(135deg, #9fe870 0%, #7dd455 100%)' }}>
        <div className="absolute left-4 top-4 opacity-10"><GraduationCap size={80} style={{ color: '#0e0f0c' }} /></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {university.logoUrl && <img src={university.logoUrl} alt={university.name} className="h-12 w-12 rounded-xl bg-white object-contain p-1" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}
            <h2 className="text-2xl font-black tracking-tight" style={{ color: '#0e0f0c' }}>{t(`أهلاً، إدارة ${university.name}`, `Welcome back, ${university.name} Administration`)}</h2>
          </div>
          <p className="mt-2 text-sm font-semibold opacity-70" style={{ color: '#0e0f0c' }}>
            {t('تعرض هذه الصفحة أحدث بيانات الجامعة المسجلة في النظام.', 'This page shows the latest university data recorded in the system.')}
          </p>
          <button disabled title={t('التقارير التفصيلية غير مشمولة في هذه المرحلة', 'Detailed reports are outside this phase')} className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold opacity-60" style={{ background: '#ffffff', color: '#0e0f0c' }}>
            <FileText size={16} />{t('عرض تقرير التوظيف', 'View Employment Report')}
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <ContentCard title={t('اتجاهات التوظيف', 'Employment Trends')} subtitle={t('الفترات المتاحة من بيانات النظام', 'Available periods from system data')} icon={<TrendingUp size={18} style={{ color: '#5b5e5a' }} />} action={
            <div className="flex items-center gap-1 rounded-full p-1" style={{ background: '#f0f1ee' }}>
              {timeFilters.map((filter) => (
                <button key={filter.key} onClick={() => setTimeFilter(filter.key)} className={cn('rounded-full px-3 py-1 text-xs font-semibold transition-all', timeFilter === filter.key ? 'bg-white text-[#0e0f0c] shadow-sm' : 'text-[#5b5e5a]')}>
                  {filter.label}
                </button>
              ))}
            </div>
          }>
            {trendData.length === 0 ? <EmptyState message={t('لا توجد بيانات اتجاهات مسجلة.', 'No trend data is recorded.')} /> : (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="employmentGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#9fe870" stopOpacity={0.3} /><stop offset="95%" stopColor="#9fe870" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" />
                    <XAxis dataKey="period" tick={{ fontSize: 12, fill: '#828782' }} axisLine={{ stroke: '#dfe1dd' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#828782' }} axisLine={{ stroke: '#dfe1dd' }} tickFormatter={(value) => `${value}%`} />
                    <Tooltip formatter={(value: number) => [`${value}%`, t('معدل التوظيف', 'Employment Rate')]} contentStyle={{ borderRadius: 16, border: '1px solid #dfe1dd' }} />
                    <Area type="monotone" dataKey="value" stroke="#1ba442" fill="url(#employmentGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </ContentCard>

          <ContentCard title={t('أداء الكليات', 'College Performance')} subtitle={t('بيانات فعلية حسب الكلية', 'Recorded data by college')} icon={<Award size={18} style={{ color: '#5b5e5a' }} />}>
            {collegePerformance.length === 0 ? <EmptyState message={t('لم تتم إضافة كليات بعد.', 'No colleges have been added yet.')} /> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr style={{ borderBottom: '1px solid #dfe1dd' }}>
                    {[t('الكلية', 'College'), t('الطلاب', 'Students'), t('الجاهزية', 'Readiness'), t('التوظيف', 'Employment'), t('فجوات المهارات', 'Skill Gaps')].map((heading) => <th key={heading} className="pb-3 pt-1 text-left text-xs font-semibold uppercase" style={{ color: '#828782' }}>{heading}</th>)}
                  </tr></thead>
                  <tbody>{collegePerformance.map((college, index) => (
                    <tr key={college.collegeId} style={{ borderBottom: '1px solid #dfe1dd' }}>
                      <td className="flex items-center gap-3 py-3"><span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black" style={{ background: '#f0f1ee', color: '#5b5e5a' }}>{index + 1}</span><span className="text-sm font-bold">{college.collegeName}</span></td>
                      <td className="py-3 text-sm font-semibold">{college.studentCount.toLocaleString()}</td>
                      <td className="py-3 text-sm font-semibold">{college.readinessScore}%</td>
                      <td className="py-3 text-sm font-semibold" style={{ color: '#1ba442' }}>{college.employmentRate}%</td>
                      <td className="py-3 text-sm font-semibold">{college.skillGapCount ?? 0}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </ContentCard>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <ContentCard title={t('فجوات المهارات', 'Skill Gaps')} subtitle={t('الفجوات المسجلة في تحليلات الكليات', 'Gaps recorded in college analytics')} icon={<AlertTriangle size={18} style={{ color: '#f59e0b' }} />}>
            {skillGaps.length === 0 ? <EmptyState message={t('لا توجد فجوات مهارات مسجلة.', 'No skill gaps are recorded.')} /> : <div className="flex flex-wrap gap-2">{skillGaps.map((skill) => <span key={skill} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: '#FEF3C7', color: '#B45309' }}>{skill}</span>)}</div>}
          </ContentCard>

          <ContentCard title={t('المهارات الأكثر طلباً', 'Top In-Demand Skills')} icon={<TrendingUp size={18} style={{ color: '#5b5e5a' }} />}>
            {topSkills.length === 0 ? <EmptyState message={t('لا توجد بيانات مهارات سوقية.', 'No market skill data is available.')} /> : <div className="space-y-2">{topSkills.slice(0, 8).map((skill) => <div key={skill.name} className="flex items-center justify-between rounded-2xl p-3" style={{ background: '#f0f1ee' }}><span className="text-sm font-bold">{skill.name}</span><span className="text-xs font-semibold text-[#5b5e5a]">{skill.demandScore ?? 0}%</span></div>)}</div>}
          </ContentCard>

          <ContentCard title={t('أبرز جهات التوظيف', 'Top Employers')} icon={<Building2 size={18} style={{ color: '#5b5e5a' }} />}>
            {topEmployers.length === 0 ? <EmptyState message={t('لا توجد جهات توظيف مسجلة.', 'No employers are recorded.')} /> : <div className="space-y-3">{topEmployers.map((employer) => <div key={employer.name} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: '#f0f1ee' }}><Building2 size={18} /><div className="flex-1"><p className="text-sm font-bold">{employer.name}</p><p className="text-xs text-[#5b5e5a]">{t('التعيينات', 'Hires')}: {employer.hires ?? 0}</p></div></div>)}</div>}
          </ContentCard>

          <ContentCard title={t('النشاطات الأخيرة', 'Recent Activities')} icon={<CheckCircle2 size={18} style={{ color: '#1ba442' }} />}>
            {recentActivities.length === 0 ? <EmptyState message={t('لا توجد نشاطات مسجلة.', 'No activities are recorded.')} /> : <div className="space-y-3">{recentActivities.map((activity) => <div key={activity.id} className="rounded-2xl p-3" style={{ background: '#f0f1ee' }}><p className="text-sm font-bold">{activity.title}</p><p className="text-xs text-[#828782]">{activity.createdAt}</p></div>)}</div>}
          </ContentCard>
        </div>
      </div>
    </PortalLayout>
  );
}
