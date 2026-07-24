import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import PortalLayout from '@/components/PortalLayout';
import MetricCard from '@/components/MetricCard';
import ContentCard from '@/components/ContentCard';
import StatusBadge from '@/components/StatusBadge';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  employmentKPIs,
  colleges,
  employmentTrends,
  skillGaps,
  topEmployers,
  recentPlacements,
} from '@/data/university';
import {
  Briefcase, Users, CheckCircle2, DollarSign, Building2, Clock,
  TrendingUp, Award, AlertTriangle, Sparkles, FileText, GraduationCap,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UniversityDashboard() {
  const { t } = useLanguage();
  const [timeFilter, setTimeFilter] = useState<'5' | '3' | '1'>('5');

  const trendData = useMemo(() => {
    const years = timeFilter === '5' ? 5 : timeFilter === '3' ? 3 : 1;
    return employmentTrends.slice(-years);
  }, [timeFilter]);

  const metrics = [
    {
      icon: <Briefcase size={20} style={{ color: '#1ba442' }} />,
      iconBg: '#E7FDD8',
      value: `${employmentKPIs.employmentRate}%`,
      label: t('معدل التوظيف', 'Employment Rate'),
      trend: employmentKPIs.employmentRateChange,
      trendLabel: t('عن العام الماضي', 'vs last year'),
      valueColor: '#9fe870',
    },
    {
      icon: <Users size={20} style={{ color: '#3b82f6' }} />,
      iconBg: '#DBEAFE',
      value: `${employmentKPIs.totalStudents.toLocaleString()}`,
      label: t('إجمالي الطلاب', 'Total Students'),
      valueColor: '#3b82f6',
    },
    {
      icon: <CheckCircle2 size={20} style={{ color: '#1ba442' }} />,
      iconBg: '#E7FDD8',
      value: `${employmentKPIs.totalGraduates.toLocaleString()}`,
      label: t('إجمالي الخريجين', 'Total Graduates'),
      valueColor: '#1ba442',
    },
    {
      icon: <DollarSign size={20} style={{ color: '#a855f7' }} />,
      iconBg: '#F3E8FF',
      value: `${employmentKPIs.avgSalary.toLocaleString()} ${t('ر.س', 'SAR')}`,
      label: t('متوسط الراتب', 'Avg. Salary'),
      trend: employmentKPIs.avgSalaryChange,
      trendLabel: t('ر.س', 'SAR'),
      valueColor: '#a855f7',
    },
    {
      icon: <Building2 size={20} style={{ color: '#f59e0b' }} />,
      iconBg: '#FEF3C7',
      value: `${employmentKPIs.activeCompanies}`,
      label: t('شركة نشطة', 'Active Companies'),
      trend: employmentKPIs.activeCompaniesChange,
      trendLabel: t('شركة', 'companies'),
      valueColor: '#f59e0b',
    },
    {
      icon: <Clock size={20} style={{ color: '#f59e0b' }} />,
      iconBg: '#FEF3C7',
      value: `${employmentKPIs.avgTimeToEmployment}`,
      label: t('متوسط شهور التوظيف', 'Avg. Months to Employment'),
      trend: employmentKPIs.avgTimeToEmploymentChange,
      trendLabel: t('شهر', 'months'),
      trendDirection: 'down' as const,
      valueColor: '#f59e0b',
    },
  ];

  const timeFilters = [
    { key: '5' as const, label: t('5 سنوات', '5 Years') },
    { key: '3' as const, label: t('3 سنوات', '3 Years') },
    { key: '1' as const, label: t('سنة', '1 Year') },
  ];

  const COLORS = {
    cs: '#3b82f6',
    eng: '#9fe870',
    bus: '#a855f7',
    med: '#f59e0b',
    avg: '#0e0f0c',
  };

  return (
    <PortalLayout title={t('لوحة التحكم', 'Dashboard')} subtitle={t('جامعة الملك سعود — السنة الأكاديمية 2024-2025', 'King Saud University — Academic Year 2024-2025')}>
      {/* Welcome Banner */}
      <div
        className="relative mb-6 overflow-hidden rounded-3xl p-8"
        style={{ background: 'linear-gradient(135deg, #9fe870 0%, #7dd455 100%)' }}
      >
        <div className="absolute left-4 top-4 opacity-10">
          <GraduationCap size={80} style={{ color: '#0e0f0c' }} />
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0e0f0c' }}>
            {t('أهلاً، إدارة جامعة الملك سعود!', 'Welcome back, King Saud University Administration!')}
          </h2>
          <p className="mt-2 text-sm font-semibold opacity-70" style={{ color: '#0e0f0c' }}>
            {t('السنة الأكاديمية 2024-2025 — معدل التوظيف الحالي 78% (ارتفاع 5% عن العام الماضي)', 'Academic Year 2024-2025 — Current employment rate 78% (up 5% from last year)')}
          </p>
          <button className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]" style={{ background: '#ffffff', color: '#0e0f0c' }}>
            <FileText size={16} />
            {t('عرض تقرير التوظيف', 'View Employment Report')}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m, i) => (
          <MetricCard key={i} {...m} />
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Left Column */}
        <div className="space-y-6 xl:col-span-3">
          {/* Employment Trends Chart */}
          <ContentCard
            title={t('اتجاهات التوظيف', 'Employment Trends')}
            subtitle={t('آخر 5 سنوات أكاديمية', 'Last 5 Academic Years')}
            icon={<TrendingUp size={18} style={{ color: '#5b5e5a' }} />}
            action={
              <div className="flex items-center gap-1 rounded-full p-1" style={{ background: '#f0f1ee' }}>
                {timeFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setTimeFilter(f.key)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                      timeFilter === f.key
                        ? "bg-white shadow-sm text-[#0e0f0c]"
                        : "text-[#5b5e5a] hover:text-[#0e0f0c]"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradCs" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.cs} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.cs} stopOpacity={0}/></linearGradient>
                    <linearGradient id="gradEng" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.eng} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.eng} stopOpacity={0}/></linearGradient>
                    <linearGradient id="gradBus" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.bus} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.bus} stopOpacity={0}/></linearGradient>
                    <linearGradient id="gradMed" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS.med} stopOpacity={0.3}/><stop offset="95%" stopColor={COLORS.med} stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#828782' }} axisLine={{ stroke: '#dfe1dd' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#828782' }} axisLine={{ stroke: '#dfe1dd' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 16, border: '1px solid #dfe1dd', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value: number) => [`${value}%`]}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="cs" name={t('علوم الحاسب', 'Computer Science')} stroke={COLORS.cs} fill="url(#gradCs)" strokeWidth={2} />
                  <Area type="monotone" dataKey="engineering" name={t('الهندسة', 'Engineering')} stroke={COLORS.eng} fill="url(#gradEng)" strokeWidth={2} />
                  <Area type="monotone" dataKey="business" name={t('إدارة الأعمال', 'Business')} stroke={COLORS.bus} fill="url(#gradBus)" strokeWidth={2} />
                  <Area type="monotone" dataKey="medicine" name={t('الطب', 'Medicine')} stroke={COLORS.med} fill="url(#gradMed)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ContentCard>

          {/* College Performance Table */}
          <ContentCard
            title={t('أداء الكليات', 'College Performance')}
            subtitle={t('تصنيف حسب معدل التوظيف', 'Ranked by Employment Rate')}
            icon={<Award size={18} style={{ color: '#5b5e5a' }} />}
            action={
              <button className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[#f0f1ee]" style={{ color: '#5b5e5a' }}>
                {t('تقرير مفصل', 'Detailed Report')}
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #dfe1dd' }}>
                    <th className="pb-3 pt-1 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#828782' }}>{t('الكلية', 'College')}</th>
                    <th className="pb-3 pt-1 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#828782' }}>{t('الخريجون', 'Graduates')}</th>
                    <th className="pb-3 pt-1 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#828782' }}>{t('الموظفون', 'Employed')}</th>
                    <th className="pb-3 pt-1 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#828782' }}>{t('المعدل', 'Rate')}</th>
                    <th className="pb-3 pt-1 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#828782' }}>{t('متوسط الراتب', 'Avg Salary')}</th>
                  </tr>
                </thead>
                <tbody>
                  {colleges.map((college, i) => {
                    const barColor = college.employmentRate >= 80 ? '#1ba442' : college.employmentRate >= 60 ? '#9fe870' : college.employmentRate >= 40 ? '#f59e0b' : '#dc2626';
                    return (
                      <tr
                        key={college.id}
                        className="transition-colors hover:bg-[#f0f1ee]/50"
                        style={{ borderBottom: '1px solid #dfe1dd' }}
                      >
                        <td className="flex items-center gap-3 py-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black" style={{ background: '#f0f1ee', color: '#5b5e5a' }}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="text-sm font-bold" style={{ color: '#0e0f0c' }}>{college.nameEn}</p>
                            <p className="text-xs" style={{ color: '#828782' }}>{college.nameAr}</p>
                          </div>
                        </td>
                        <td className="py-3 text-right text-sm font-semibold" style={{ color: '#5b5e5a' }}>{college.graduates.toLocaleString()}</td>
                        <td className="py-3 text-right text-sm font-semibold" style={{ color: '#5b5e5a' }}>{college.employed.toLocaleString()}</td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full" style={{ background: '#dfe1dd' }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${college.employmentRate}%`, background: barColor }} />
                            </div>
                            <span className="text-sm font-bold" style={{ color: barColor }}>{college.employmentRate}%</span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-sm font-bold" style={{ color: '#1ba442' }}>{college.avgSalary.toLocaleString()} {t('ر.س', 'SAR')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ContentCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6 xl:col-span-2">
          {/* Skill Gap Overview */}
          <ContentCard
            title={t('نظرة عامة على فجوات المهارات', 'Skill Gap Overview')}
            subtitle={t('أكبر الفجوات بين مهارات الطلاب ومتطلبات السوق', 'Largest gaps between student skills and market demands')}
            icon={<AlertTriangle size={18} style={{ color: '#f59e0b' }} />}
          >
            <div className="space-y-4">
              {skillGaps.slice(0, 6).map((sg) => (
                <div key={sg.skill} className="rounded-2xl p-4" style={{ background: '#f0f1ee' }}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: '#0e0f0c' }}>{sg.skill}</span>
                    <span className="text-sm font-bold" style={{ color: '#dc2626' }}>-{sg.gap}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('طلابنا', 'Our Students')}</span>
                        <span className="text-xs font-bold" style={{ color: '#9fe870' }}>{sg.studentAverage}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: '#dfe1dd' }}>
                        <div className="h-full rounded-full" style={{ width: `${sg.studentAverage}%`, background: '#9fe870' }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('السوق', 'Market')}</span>
                        <span className="text-xs font-bold" style={{ color: '#3b82f6' }}>{sg.marketRequired}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: '#dfe1dd' }}>
                        <div className="h-full rounded-full" style={{ width: `${sg.marketRequired}%`, background: '#3b82f6' }} />
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-semibold" style={{ color: '#828782' }}>
                    {t('يؤثر على:', 'Affects:')} {sg.affectedColleges.join(', ')}
                  </p>
                </div>
              ))}
            </div>

            {/* AI Recommendation */}
            <div className="mt-4 rounded-2xl p-4" style={{ background: '#E7FDD8' }}>
              <div className="mb-2 flex items-center gap-2">
                <Sparkles size={16} style={{ color: '#7C3AED' }} />
                <StatusBadge label={t('توصية الذكاء الاصطناعي', 'AI Recommendation')} variant="ai" />
              </div>
              <p className="text-sm font-semibold leading-relaxed" style={{ color: '#0e0f0c' }}>
                {t('نوصي بإضافة مساقات اختيارية في السحابة الإلكترونية والتعلم الآلي في كليتي الهندسة وعلوم الحاسب. هذا قد يرفع معدل التوظيف بنسبة 8%.', 'We recommend adding elective courses in Cloud Computing and Machine Learning for Engineering and CS colleges. This could raise the employment rate by 8%.')}
              </p>
            </div>
          </ContentCard>

          {/* Top Employers */}
          <ContentCard
            title={t('كبار الموظفين', 'Top Employers')}
            subtitle={t('الشركات الأكثر توظيفاً لخريجينا', 'Companies hiring the most of our graduates')}
            icon={<Building2 size={18} style={{ color: '#5b5e5a' }} />}
          >
            <div className="space-y-3">
              {topEmployers.map((emp) => (
                <div
                  key={emp.rank}
                  className="flex items-center gap-3 rounded-2xl p-4 transition-colors hover:bg-[#ebede9]"
                  style={{ background: '#f0f1ee' }}
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold" style={{ color: '#828782' }}>
                    {emp.rank}
                  </span>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: '#ffffff' }}>
                    <Building2 size={18} style={{ color: '#5b5e5a' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: '#0e0f0c' }}>{emp.name}</p>
                    <p className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{emp.hires} {t('خريجاً', 'graduates')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold" style={{ color: '#1ba442' }}>{emp.avgSalary.toLocaleString()} {t('ر.س', 'SAR')}</p>
                    <p className="text-xs" style={{ color: '#828782' }}>{emp.matchRate}% {t('مطابقة', 'match')}</p>
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>

          {/* Recent Placements */}
          <ContentCard
            title={t('توظيفات حديثة', 'Recent Placements')}
            icon={<CheckCircle2 size={18} style={{ color: '#1ba442' }} />}
            action={
              <button className="flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-70" style={{ color: '#5b5e5a' }}>
                {t('عرض الكل', 'View All')}
                <ChevronRight size={14} />
              </button>
            }
          >
            <div className="space-y-3">
              {recentPlacements.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-[#ebede9]"
                  style={{ background: '#f0f1ee' }}
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ background: '#E7FDD8' }}>
                    <GraduationCap size={16} style={{ color: '#1ba442' }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: '#0e0f0c' }}>{p.studentName}</p>
                    <div className="flex items-center gap-1 text-xs">
                      <span style={{ color: '#828782' }}>{p.collegeName}</span>
                      <ChevronRight size={12} style={{ color: '#dfe1dd' }} />
                      <span className="font-semibold" style={{ color: '#9fe870' }}>{p.company} — {p.role}</span>
                    </div>
                  </div>
                  <span className="flex-shrink-0 text-xs font-semibold" style={{ color: '#828782' }}>
                    {p.daysAgo}d
                  </span>
                </div>
              ))}
            </div>
          </ContentCard>
        </div>
      </div>
    </PortalLayout>
  );
}
