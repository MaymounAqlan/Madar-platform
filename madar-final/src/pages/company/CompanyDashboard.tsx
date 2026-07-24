import { useLanguage } from '@/hooks/useLanguage'
import PortalLayout from '@/components/PortalLayout'
import MetricCard from '@/components/MetricCard'
import ContentCard from '@/components/ContentCard'
import MatchScoreRing from '@/components/MatchScoreRing'
import StatusBadge from '@/components/StatusBadge'
import {
  jobs,
  candidates,
  funnelStages,
  upcomingInterviews,
  dashboardMetrics,
} from '@/data/company'
import { cn } from '@/lib/utils'
import {
  Briefcase,
  Users,
  CheckCircle2,
  TrendingUp,
  Plus,
  Search,
  BarChart3,
  Building2,
  Eye,
  Edit3,
  ChevronRight,
  Clock,
  Calendar,
  Video,
  Filter,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import {
  FunnelChart,
  Funnel,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from 'recharts'

const metricIcons = [Briefcase, Users, CheckCircle2, TrendingUp]

const statusColors: Record<string, string> = {
  active: 'bg-[#1ba442]',
  'closing-soon': 'bg-[#f59e0b]',
  draft: 'bg-[#828782]',
}

export default function CompanyDashboard() {
  const { dir } = useLanguage()
  const isRTL = dir === 'rtl'
  const navigate = useNavigate()

  const t = (ar: string, en: string) => (isRTL ? ar : en)

  return (
    <PortalLayout title="Dashboard" titleAr="لوحة التحكم">
      {/* Welcome Banner */}
      <div
        className="mb-6 rounded-[24px] p-8"
        style={{ background: 'linear-gradient(135deg, #9fe870 0%, #7dd455 100%)' }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#0e0f0c]">
              {t('أهلاً، فريق التوظيف في تك سول! 👋', 'Welcome back, TechSol Recruitment Team! 👋')}
            </h2>
            <p className="mt-1 text-base font-semibold text-[#0e0f0c] opacity-70">
              {t(
                'لديك 15 متقدم جديد هذا الأسبوع لـ 4 وظائف نشطة',
                'You have 15 new applicants this week for 4 active jobs'
              )}
            </p>
          </div>
          <button
            onClick={() => navigate('/company/jobs')}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0e0f0c] shadow-sm transition-all hover:scale-[1.02] hover:shadow-md sm:mt-0"
          >
            <Plus size={18} />
            {t('نشر وظيفة جديدة', 'Post New Job')}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {dashboardMetrics.map((m, i) => {
          const Icon = metricIcons[i]
          return (
            <MetricCard
              key={m.label}
              icon={Icon}
              value={m.value}
              label={isRTL ? m.labelAr : m.label}
              trend={m.trend}
              iconBg={m.iconBg}
            />
          )
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[55%_45%]">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Active Jobs */}
          <ContentCard
            title={t('وظائفنا النشطة', 'Active Jobs')}
            icon={<Briefcase size={20} />}
            action={
              <button
                onClick={() => navigate('/company/jobs')}
                className="text-sm font-semibold text-[#5b5e5a] hover:text-[#0e0f0c] transition-colors flex items-center gap-1"
              >
                {t('إدارة الوظائف', 'Manage Jobs')}
                <ChevronRight size={16} />
              </button>
            }
          >
            <div className="mt-2 flex flex-col gap-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center gap-4 rounded-2xl bg-[#f0f1ee] p-4 transition-all hover:bg-[#ebede9] hover:translate-x-1"
                >
                  <div className={cn('h-2 w-2 flex-shrink-0 rounded-full', statusColors[job.status])} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0e0f0c] truncate">{job.title}</p>
                    <p className="text-xs text-[#828782]">
                      {job.location} | {job.type} | {job.postedDate}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#5b5e5a]">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
                        {job.inReview} {t('مراجعة', 'review')}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
                        {job.interviews} {t('مقابلات', 'interviews')}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#1ba442]" />
                        {job.accepted} {t('مقبول', 'accepted')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button className="rounded-full p-2 text-[#828782] hover:bg-white hover:text-[#0e0f0c] transition-colors">
                      <Eye size={16} />
                    </button>
                    <button className="rounded-full p-2 text-[#828782] hover:bg-white hover:text-[#0e0f0c] transition-colors">
                      <Edit3 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>

          {/* Recruitment Funnel */}
          <ContentCard
            title={t('قمع التوظيف', 'Recruitment Funnel')}
            icon={<Filter size={20} />}
          >
            <p className="mb-4 text-xs text-[#828782]">{t('آخر 30 يوماً', 'Last 30 days')}</p>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <ReTooltip
                  formatter={(value: number) => [value, '']}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #dfe1dd',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Funnel
                  dataKey="count"
                  data={funnelStages.map((s) => ({ ...s, fill: '#9fe870' }))}
                  isAnimationActive
                  animationDuration={800}
                />
              </FunnelChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-3">
              {funnelStages.map((stage) => (
                <div key={stage.name} className="flex items-center gap-2 rounded-full bg-[#f0f1ee] px-3 py-1">
                  <span className="text-xs font-semibold text-[#0e0f0c]">
                    {isRTL ? stage.nameAr : stage.name}
                  </span>
                  <span className="text-xs font-bold text-[#9fe870]">{stage.count}</span>
                </div>
              ))}
            </div>
          </ContentCard>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Recent Applicants */}
          <ContentCard
            title={t('أحدث المتقدمين', 'Recent Applicants')}
            icon={<Users size={20} />}
            action={
              <button
                onClick={() => navigate('/company/candidates')}
                className="text-sm font-semibold text-[#5b5e5a] hover:text-[#0e0f0c] transition-colors flex items-center gap-1"
              >
                {t('عرض الكل', 'View All')}
                <ChevronRight size={16} />
              </button>
            }
          >
            <div className="mt-2 flex flex-col gap-3">
              {candidates.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-2xl bg-[#f0f1ee] p-3 transition-all hover:bg-[#ebede9]"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#9fe870] text-xs font-bold text-[#0e0f0c]">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0e0f0c] truncate">
                      {isRTL ? c.nameAr : c.name}
                    </p>
                    <p className="text-xs text-[#5b5e5a] truncate">{c.appliedJob}</p>
                    <p className="text-xs text-[#828782]">
                      {isRTL ? 'قبل 2 ساعة' : '2 hours ago'}
                    </p>
                  </div>
                  <MatchScoreRing score={c.matchScore} size={48} strokeWidth={3} />
                </div>
              ))}
            </div>
          </ContentCard>

          {/* Quick Actions */}
          <ContentCard
            title={t('إجراءات سريعة', 'Quick Actions')}
            icon={<Zap size={20} />}
          >
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/company/jobs')}
                className="flex flex-col items-center gap-2 rounded-2xl bg-[#9fe870] p-4 text-sm font-semibold text-[#0e0f0c] transition-all hover:scale-[1.02] hover:shadow-md"
              >
                <Briefcase size={24} />
                {t('نشر وظيفة', 'Post Job')}
              </button>
              <button
                onClick={() => navigate('/company/candidates')}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#dfe1dd] bg-white p-4 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#f0f1ee] hover:scale-[1.02]"
              >
                <Search size={24} />
                {t('البحث عن مرشحين', 'Search Candidates')}
              </button>
              <button
                onClick={() => navigate('/company/analytics')}
                className="flex flex-col items-center gap-2 rounded-2xl border border-[#dfe1dd] bg-white p-4 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#f0f1ee] hover:scale-[1.02]"
              >
                <BarChart3 size={24} />
                {t('عرض التحليلات', 'View Reports')}
              </button>
              <button className="flex flex-col items-center gap-2 rounded-2xl border border-[#dfe1dd] bg-white p-4 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#f0f1ee] hover:scale-[1.02]">
                <Building2 size={24} />
                {t('تحديث الشركة', 'Manage Team')}
              </button>
            </div>
          </ContentCard>

          {/* Upcoming Interviews */}
          <ContentCard
            title={t('مقابلات قادمة', 'Upcoming Interviews')}
            icon={<Calendar size={20} />}
          >
            <div className="mt-2 flex flex-col gap-3">
              {upcomingInterviews.map((interview) => {
                const day = new Date(interview.date).getDate()
                const month = new Date(interview.date).toLocaleString('en', { month: 'short' })
                return (
                  <div
                    key={interview.id}
                    className="flex items-center gap-3 rounded-2xl bg-[#f0f1ee] p-3 transition-all hover:bg-[#ebede9]"
                  >
                    <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-[#E7FDD8]">
                      <span className="text-lg font-black text-[#0e0f0c]">{day}</span>
                      <span className="text-[10px] font-semibold uppercase text-[#5b5e5a]">{month}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0e0f0c] truncate">
                        {isRTL ? interview.candidateNameAr : interview.candidateName}
                      </p>
                      <p className="text-xs text-[#5b5e5a]">{interview.jobTitle}</p>
                      <p className="flex items-center gap-1 text-xs text-[#828782]">
                        <Clock size={12} />
                        {interview.time}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <StatusBadge variant={interview.type === 'online' ? 'accepted' : 'pending'}>
                        {interview.type === 'online'
                          ? t('عبر الإنترنت', 'Online')
                          : t('حضوري', 'In-person')}
                      </StatusBadge>
                      {interview.type === 'online' && (
                        <button className="rounded-full p-2 text-[#828782] hover:bg-white hover:text-[#0e0f0c] transition-colors">
                          <Video size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </ContentCard>
        </div>
      </div>
    </PortalLayout>
  )
}
