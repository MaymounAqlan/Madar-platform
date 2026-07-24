import { useLanguage } from '@/contexts/LanguageContext';
import PortalLayout from '@/components/PortalLayout';
import MetricCard from '@/components/MetricCard';
import ContentCard from '@/components/ContentCard';
import MatchScoreRing from '@/components/MatchScoreRing';
import StatusBadge from '@/components/StatusBadge';
import { studentProfile, jobs, skillGaps, applications, aiInsights, dashboardMetrics } from '@/data/student';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Sparkles, FileText, BookOpen, Eye, Bookmark, BookmarkCheck, Send,
  TrendingUp, Brain, Lightbulb, Zap,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
};

const skillColorMap: Record<string, string> = {
  'Docker': '#3b82f6',
  'AWS': '#f59e0b',
  'TypeScript': '#3b82f6',
  'Python': '#a855f7',
  'SQL': '#0e0f0c',
  'Machine Learning': '#a855f7',
};

const statusVariantMap: Record<string, 'submitted' | 'in-review' | 'interview' | 'accepted' | 'rejected'> = {
  submitted: 'info',
  'in-review': 'warning',
  interview: 'info',
  accepted: 'success',
  rejected: 'error',
} as unknown as Record<string, 'submitted' | 'in-review' | 'interview' | 'accepted' | 'rejected'>;

const statusLabelMap = {
  submitted: { ar: 'مُقدَّم', en: 'Submitted' },
  'in-review': { ar: 'قيد المراجعة', en: 'In Review' },
  interview: { ar: 'مقابلة', en: 'Interview' },
  accepted: { ar: 'مقبول', en: 'Accepted' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
};

const insightIconMap: Record<string, React.ReactNode> = {
  skill: <Brain size={18} style={{ color: '#7C3AED' }} />,
  job: <Zap size={18} style={{ color: '#f59e0b' }} />,
  trend: <TrendingUp size={18} style={{ color: '#1ba442' }} />,
  learning: <Lightbulb size={18} style={{ color: '#3b82f6' }} />,
};

export default function StudentDashboard() {
  const { t, isRTL } = useLanguage();

  const recommendedJobs = jobs.slice(0, 5);
  const topSkillGaps = skillGaps.slice(0, 3);
  const recentApplications = applications.slice(0, 3);
  const topInsights = aiInsights.slice(0, 3);

  return (
    <PortalLayout title={t('لوحة التحكم', 'Dashboard')}>
      <div className={cn("space-y-6", isRTL ? "rtl" : "ltr")}>

        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[24px] p-6 sm:p-8"
          style={{ background: 'linear-gradient(135deg, #9fe870 0%, #7dd455 100%)' }}
        >
          <h2
            className="text-xl font-black text-[#0e0f0c] sm:text-2xl"
            style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif" }}
          >
            {t('أهلاً بك، أحمد!', 'Welcome back, Ahmed!')}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#0e0f0c] opacity-70 sm:text-base">
            {t(
              'لديك 3 وظائف موصى بها ومهارة جديدة للتعلم',
              'You have 3 recommended jobs and 1 new skill to learn'
            )}
          </p>
        </motion.div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            icon={<Sparkles size={22} style={{ color: '#7C3AED' }} />}
            iconBg="#F3E8FF"
            value={`${dashboardMetrics.matchScore.value}%`}
            label={t('نسبة التطابق', 'Match Score')}
            trend={dashboardMetrics.matchScore.trend}
            trendLabel={t('هذا الشهر', 'this month')}
            trendDirection="up"
            valueColor="#7C3AED"
          />
          <MetricCard
            icon={<FileText size={22} style={{ color: '#1D4ED8' }} />}
            iconBg="#DBEAFE"
            value={dashboardMetrics.applications.value}
            label={t('الطلبات', 'Applications')}
            trend={dashboardMetrics.applications.trend}
            trendLabel={t('جديد', 'new')}
            trendDirection="up"
            valueColor="#1D4ED8"
          />
          <MetricCard
            icon={<BookOpen size={22} style={{ color: '#1ba442' }} />}
            iconBg="#E7FDD8"
            value={dashboardMetrics.skills.value}
            label={t('المهارات', 'Skills')}
            trend={dashboardMetrics.skills.trend}
            trendLabel={t('مضاف', 'added')}
            trendDirection="up"
            valueColor="#1ba442"
          />
          <MetricCard
            icon={<Eye size={22} style={{ color: '#B45309' }} />}
            iconBg="#FEF3C7"
            value={dashboardMetrics.profileViews.value}
            label={t('مشاهدات الملف', 'Profile Views')}
            trend={dashboardMetrics.profileViews.trend}
            trendLabel={t('هذا الأسبوع', 'this week')}
            trendDirection="up"
            valueColor="#B45309"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recommended Jobs */}
          <ContentCard
            title={t('وظائف موصى بها', 'Recommended Jobs')}
            icon={<Sparkles size={20} style={{ color: '#7C3AED' }} />}
            action={
              <a href="/student/jobs" className="text-xs font-semibold transition-colors hover:underline" style={{ color: '#9fe870' }}>
                {t('عرض الكل', 'View All')}
              </a>
            }
          >
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="mt-2 flex flex-col gap-3"
            >
              {recommendedJobs.map((job) => (
                <motion.div
                  key={job.id}
                  variants={itemVariants}
                  className="flex items-center gap-3 rounded-2xl bg-[#f0f1ee] p-3 transition-all hover:bg-[#ebede9]"
                >
                  <MatchScoreRing score={job.matchScore} size={64} strokeWidth={4} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0e0f0c] truncate">
                      {isRTL ? job.titleAr : job.titleEn}
                    </p>
                    <p className="text-xs text-[#5b5e5a] truncate">
                      {isRTL ? job.companyAr : job.companyEn} · {isRTL ? job.locationAr : job.locationEn}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {job.skills.slice(0, 2).map((s) => (
                        <span key={s} className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: '#E7FDD8', color: '#1ba442' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button className="rounded-full p-2 text-[#828782] hover:bg-white hover:text-[#0e0f0c] transition-colors">
                      {job.bookmarked ? <BookmarkCheck size={16} style={{ color: '#9fe870' }} /> : <Bookmark size={16} />}
                    </button>
                    <button className="rounded-full p-2 text-[#828782] hover:bg-white hover:text-[#0e0f0c] transition-colors">
                      <Send size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </ContentCard>

          {/* Skill Gap Preview */}
          <ContentCard
            title={t('نقاط ضعف المهارات', 'Skill Gap Preview')}
            icon={<Brain size={20} style={{ color: '#dc2626' }} />}
          >
            <div className="mt-2 flex flex-col gap-4">
              {topSkillGaps.map((gap) => (
                <div key={gap.skill}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#0e0f0c]">{gap.skill}</span>
                    <span className="text-xs font-semibold" style={{ color: '#828782' }}>
                      {gap.currentLevel}% / {gap.marketLevel}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f0f1ee]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(gap.currentLevel / gap.marketLevel) * 100}%`,
                        background: skillColorMap[gap.skill] || '#9fe870',
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-semibold" style={{ color: '#828782' }}>
                    {t('المطلوب سوقياً:', 'Market required:')} {gap.marketLevel}% · {t('لديك:', 'You have:')} {gap.currentLevel}%
                  </p>
                </div>
              ))}
            </div>
          </ContentCard>

          {/* Recent Applications */}
          <ContentCard
            title={t('أحدث الطلبات', 'Recent Applications')}
            icon={<FileText size={20} style={{ color: '#1D4ED8' }} />}
          >
            <div className="mt-2 flex flex-col gap-3">
              {recentApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center gap-3 rounded-2xl bg-[#f0f1ee] p-3"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#DBEAFE]">
                    <FileText size={18} style={{ color: '#1D4ED8' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0e0f0c] truncate">
                      {isRTL ? app.jobTitleAr : app.jobTitleEn}
                    </p>
                    <p className="text-xs text-[#5b5e5a] truncate">
                      {isRTL ? app.companyAr : app.companyEn}
                    </p>
                  </div>
                  <StatusBadge
                    label={isRTL ? statusLabelMap[app.status].ar : statusLabelMap[app.status].en}
                    variant={statusVariantMap[app.status]}
                  />
                </div>
              ))}
            </div>
          </ContentCard>

          {/* AI Insights */}
          <ContentCard
            title={t('رؤى الذكاء الاصطناعي', 'AI Insights')}
            icon={<Sparkles size={20} style={{ color: '#7C3AED' }} />}
          >
            <div className="mt-2 flex flex-col gap-3">
              {topInsights.map((insight) => (
                <div
                  key={insight.id}
                  className="rounded-2xl border border-[#9fe870] bg-[#F4FCF0] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white">
                      {insightIconMap[insight.type]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0e0f0c]">
                        {isRTL ? insight.titleAr : insight.titleEn}
                      </p>
                      <p className="mt-1 text-xs font-semibold" style={{ color: '#5b5e5a' }}>
                        {isRTL ? insight.descriptionAr : insight.descriptionEn}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ContentCard>
        </div>
      </div>
    </PortalLayout>
  );
}
