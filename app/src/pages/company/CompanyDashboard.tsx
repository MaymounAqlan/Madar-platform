import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Briefcase, Calendar, CheckCircle2, ChevronRight, Clock, Loader2, Plus, Sparkles, TrendingUp, Users, Video } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCompanyDashboard, useGenerateSampleJobs } from '@/hooks/useCompany';
import PortalLayout from '@/components/PortalLayout';
import MetricCard from '@/components/MetricCard';
import ContentCard from '@/components/ContentCard';
import MatchScoreRing from '@/components/MatchScoreRing';
import StatusBadge from '@/components/StatusBadge';

const metricIcons = [Briefcase, Users, CheckCircle2, TrendingUp];
const statusColors: Record<string, string> = {
  active: 'bg-[#1ba442]',
  'closing-soon': 'bg-[#f59e0b]',
  draft: 'bg-[#828782]',
};

function LoadingSpinner() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#9fe870]" />
    </div>
  );
}

export default function CompanyDashboard() {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useCompanyDashboard();
  const generateSamples = useGenerateSampleJobs();
  const dashboardData = dashboard?.data ?? dashboard ?? {};
  const t = (ar: string, en: string) => (isRTL ? ar : en);

  const metrics = dashboardData.metrics ?? [];
  const jobs = dashboardData.jobs ?? [];
  const candidates = dashboardData.candidates ?? [];
  const upcomingInterviews = dashboardData.upcomingInterviews ?? [];
  const funnelStages = dashboardData.funnel ?? [
    { name: t('المتقدمون', 'Applied'), count: 0 },
    { name: t('قيد المراجعة', 'Reviewed'), count: 0 },
    { name: t('المقابلات', 'Interviewed'), count: 0 },
    { name: t('العروض', 'Offered'), count: 0 },
    { name: t('المقبولون', 'Hired'), count: 0 },
  ];

  const handleGenerateSampleJobs = async () => {
    try {
      const result = await generateSamples.mutateAsync();
      toast.success(t(`تم إنشاء ${result.created} وظيفة اختبار`, `${result.created} sample jobs generated`));
    } catch (error: any) {
      toast.error(error?.response?.data?.message?.[0] || error?.response?.data?.message || t('تعذر إنشاء وظائف اختبار', 'Failed to generate sample jobs'));
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <PortalLayout title="Dashboard">
      <div className="mb-6 rounded-[24px] p-8" style={{ background: 'linear-gradient(135deg, #9fe870 0%, #7dd455 100%)' }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#0e0f0c]">
              {t(dashboardData.welcomeTitleAr ?? 'أهلاً، فريق التوظيف!', dashboardData.welcomeTitle ?? 'Welcome back, Recruitment Team!')}
            </h2>
            <p className="mt-1 text-base font-semibold text-[#0e0f0c] opacity-70">
              {t(dashboardData.welcomeSubtitleAr ?? `${dashboardData.newApplicants ?? 0} متقدم جديد هذا الأسبوع`, `${dashboardData.newApplicants ?? 0} new applicants this week`)}
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:mt-0 sm:flex-row">
            <button
              type="button"
              onClick={handleGenerateSampleJobs}
              disabled={generateSamples.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0e0f0c] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:scale-[1.02] disabled:opacity-50"
            >
              {generateSamples.isPending ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {t('إنشاء وظائف اختبار', 'Generate Sample Jobs')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/company/jobs')}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0e0f0c] shadow-sm transition-all hover:scale-[1.02]"
            >
              <Plus size={18} />
              {t('نشر وظيفة', 'Post New Job')}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(metrics as any[]).map((m, i) => {
          const Icon = metricIcons[i] ?? Briefcase;
          return (
            <MetricCard
              key={m.label ?? i}
              icon={<Icon size={20} style={{ color: '#1ba442' }} />}
              value={m.value ?? 0}
              label={isRTL ? m.labelAr : m.label}
              trend={m.trend}
              iconBg={m.iconBg ?? '#E7FDD8'}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[55%_45%]">
        <div className="flex flex-col gap-6">
          <ContentCard
            title={t('وظائفنا النشطة', 'Active Jobs')}
            icon={<Briefcase size={20} />}
            action={<button type="button" onClick={() => navigate('/company/jobs')} className="flex items-center gap-1 text-sm font-semibold text-[#5b5e5a]">{t('عرض الكل', 'View All')}<ChevronRight size={16} /></button>}
          >
            <div className="mt-2 flex flex-col gap-3">
              {(jobs as any[]).slice(0, 4).map((job) => (
                <button
                  key={job.id}
                  type="button"
                  onClick={() => navigate('/company/jobs')}
                  className="flex items-center gap-4 rounded-2xl bg-[#f0f1ee] p-4 text-start transition-all hover:bg-[#ebede9]"
                >
                  <div className={`h-2 w-2 flex-shrink-0 rounded-full ${statusColors[job.status] ?? 'bg-[#1ba442]'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0e0f0c]">{isRTL ? job.titleAr : job.title}</p>
                    <p className="text-xs text-[#828782]">{job.location} | {job.type}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#5b5e5a]">
                      <span>{job.inReview ?? job.in_review ?? 0} {t('مراجعة', 'review')}</span>
                      <span>{job.interviews ?? 0} {t('مقابلة', 'interview')}</span>
                      <span>{job.accepted ?? 0} {t('مقبول', 'accepted')}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#1ba442]">{job.applicants ?? 0} {t('متقدم', 'applicants')}</span>
                </button>
              ))}
            </div>
          </ContentCard>

          <ContentCard title={t('أحدث المتقدمين', 'Recent Applicants')} icon={<Users size={20} />}>
            <div className="mt-2 flex flex-col gap-3">
              {(candidates as any[]).slice(0, 4).map((c) => (
                <button key={c.id} type="button" onClick={() => navigate('/company/candidates')} className="flex items-center gap-4 rounded-2xl bg-[#f0f1ee] p-4 text-start transition-all hover:bg-[#ebede9]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E7FDD8] text-sm font-bold text-[#1ba442]">
                    {(c.name ?? '?').charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0e0f0c]">{c.name}</p>
                    <p className="text-xs text-[#828782]">{c.university} | {c.major}</p>
                  </div>
                  <MatchScoreRing score={c.matchScore ?? 0} size={48} />
                  <StatusBadge
                    label={c.status === 'new' ? t('جديد', 'New') : c.status === 'in-review' ? t('قيد المراجعة', 'In Review') : c.status === 'interview' ? t('مقابلة', 'Interview') : c.status === 'accepted' ? t('مقبول', 'Accepted') : t('مرفوض', 'Rejected')}
                    variant={c.status === 'accepted' ? 'success' : c.status === 'rejected' ? 'error' : c.status === 'interview' ? 'info' : c.status === 'new' ? 'ai' : 'warning'}
                  />
                </button>
              ))}
            </div>
          </ContentCard>
        </div>

        <div className="flex flex-col gap-6">
          <ContentCard title={t('قمع التوظيف', 'Recruitment Funnel')} icon={<TrendingUp size={20} />}>
            <div className="mt-2 flex flex-col gap-2">
              {(funnelStages as any[]).map((stage, i, arr) => (
                <div key={stage.name ?? i}>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-semibold text-[#5b5e5a]">{isRTL ? stage.nameAr ?? stage.name : stage.name}</span>
                    <span className="text-sm font-bold text-[#0e0f0c]">{stage.count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f0f1ee]">
                    <div className="h-full rounded-full transition-all" style={{ width: `${arr[0]?.count ? (stage.count / arr[0].count) * 100 : 0}%`, background: '#9fe870' }} />
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>

          <ContentCard title={t('المقابلات القادمة', 'Upcoming Interviews')} icon={<Video size={20} />}>
            <div className="mt-2 flex flex-col gap-3">
              {(upcomingInterviews as any[]).map((interview) => (
                <div key={interview.id} className="flex items-center gap-3 rounded-2xl bg-[#f0f1ee] p-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-white">
                    <Calendar size={14} className="text-[#828782]" />
                    <span className="text-xs font-bold text-[#0e0f0c]">{(interview.date ?? '').split(' ')[1] ?? ''}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0e0f0c]">{interview.candidateName}</p>
                    <p className="text-xs text-[#828782]">{interview.jobTitle}</p>
                    <div className="flex items-center gap-1 text-xs text-[#5b5e5a]"><Clock size={12} />{interview.time}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${interview.type === 'video' ? 'bg-[#DBEAFE] text-[#1D4ED8]' : 'bg-[#E7FDD8] text-[#1ba442]'}`}>
                    {interview.type === 'video' ? t('فيديو', 'Video') : t('حضوري', 'In-person')}
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
