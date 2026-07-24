import {
  AlertCircle,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Clock3,
  ExternalLink,
  FolderKanban,
  Gauge,
  GraduationCap,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import MatchScoreRing from '@/components/MatchScoreRing';
import MetricCard from '@/components/MetricCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStudentInsights } from '@/hooks/useStudent';
import { cn } from '@/lib/utils';
import type { StudentInsightItem } from '@/types/api.types';

const clampPercentage = (value: number | undefined) => Math.min(100, Math.max(0, Number(value) || 0));

function insightIcon(type: string) {
  if (type === 'skill') return <Brain size={18} />;
  if (type === 'job') return <BriefcaseBusiness size={18} />;
  if (type === 'trend') return <TrendingUp size={18} />;
  return <BookOpen size={18} />;
}

export default function StudentInsights() {
  const { t, isRTL } = useLanguage();
  const query = useStudentInsights();
  const insights = query.data;
  const locale = isRTL ? 'ar-SA' : 'en-US';

  const radarSkills = insights?.radarSkills ?? [];
  const skillGaps = insights?.skillGaps ?? [];
  const marketTrends = insights?.marketTrends ?? [];
  const careerPaths = insights?.careerPaths ?? [];
  const learningResources = insights?.learningResources ?? [];
  const aiInsights = insights?.aiInsights ?? [];
  const summaryTitle = isRTL
    ? insights?.summaryTitleAr || insights?.summaryTitle
    : insights?.summaryTitle || insights?.summaryTitleAr;
  const summaryDescription = isRTL
    ? insights?.summaryDescriptionAr || insights?.summaryDescription
    : insights?.summaryDescription || insights?.summaryDescriptionAr;
  const hasInsightData = Boolean(
    insights && (
      insights.skillCount > 0
      || insights.recommendationCount > 0
      || skillGaps.length > 0
      || careerPaths.length > 0
      || learningResources.length > 0
    ),
  );

  const marketData = marketTrends.map((item) => ({
    ...item,
    label: new Date(`${item.period}-01T00:00:00Z`).toLocaleDateString(locale, {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  }));

  return (
    <PortalLayout
      title={t('الرؤى والتحليلات', 'Insights & Analytics')}
      subtitle={t('تحليل مهاراتك وفرصك المهنية اعتمادًا على ملفك والوظائف المنشورة', 'Analysis of your skills and career opportunities based on your profile and published jobs')}
    >
      <div className={cn('space-y-6', isRTL ? 'rtl' : 'ltr')}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-[#0e0f0c]">{t('نظرة مهنية شاملة', 'Career overview')}</h2>
            <p className="mt-1 text-sm text-[#5b5e5a]">
              {insights?.generatedAt
                ? `${t('آخر تحديث', 'Last updated')}: ${new Date(insights.generatedAt).toLocaleString(locale)}`
                : t('تُعرض النتائج بعد اكتمال تحليل ملفك', 'Results appear after your profile analysis is complete')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-4 py-2 text-sm font-semibold text-[#0e0f0c] transition-colors hover:bg-[#f0f1ee] disabled:opacity-50"
          >
            {query.isFetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {t('تحديث التحليل', 'Refresh analysis')}
          </button>
        </div>

        {query.isLoading ? (
          <LoadingState />
        ) : query.isError ? (
          <PageState
            icon={<AlertCircle size={34} />}
            title={t('تعذر تحميل التحليلات', 'Unable to load analytics')}
            description={t('تحقق من الاتصال ثم أعد المحاولة.', 'Check your connection and try again.')}
            action={(
              <button type="button" onClick={() => query.refetch()} className="rounded-full bg-[#9fe870] px-5 py-2.5 text-sm font-bold text-[#0e0f0c]">
                {t('إعادة المحاولة', 'Try again')}
              </button>
            )}
          />
        ) : !hasInsightData ? (
          <PageState
            icon={<Brain size={34} />}
            title={t('لا توجد تحليلات كافية بعد', 'Not enough insights yet')}
            description={t('أكمل ملفك وارفع سيرتك الذاتية وأضف مهاراتك ومشاريعك لتوليد تحليل مهني أدق.', 'Complete your profile, upload your CV, and add skills and projects to generate more accurate career insights.')}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MetricCard
                icon={<Gauge size={21} className="text-[#1ba442]" />}
                iconBg="#E7FDD8"
                value={`${clampPercentage(insights?.readinessScore)}%`}
                valueColor="#1ba442"
                label={t('الجاهزية المهنية', 'Career readiness')}
                className="min-w-0 p-4 sm:p-5"
              />
              <MetricCard
                icon={<Target size={21} className="text-[#1ba442]" />}
                iconBg="#E7FDD8"
                value={`${clampPercentage(insights?.topMatchScore)}%`}
                label={t('أعلى تطابق', 'Top match')}
                className="min-w-0 p-4 sm:p-5"
              />
              <MetricCard
                icon={<Brain size={21} className="text-[#5b5e5a]" />}
                iconBg="#F0F1EE"
                value={insights?.skillCount ?? 0}
                label={t('المهارات المسجلة', 'Profile skills')}
                className="min-w-0 p-4 sm:p-5"
              />
              <MetricCard
                icon={<FolderKanban size={21} className="text-[#5b5e5a]" />}
                iconBg="#F0F1EE"
                value={insights?.projectCount ?? 0}
                label={t('المشاريع', 'Projects')}
                className="min-w-0 p-4 sm:p-5"
              />
            </div>

            {(summaryTitle || summaryDescription) && (
              <ContentCard
                title={t('الملخص المهني', 'Career summary')}
                icon={<Sparkles size={19} className="text-[#1ba442]" />}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-[#dfe1dd] bg-[#f7f8f6] px-4 py-4 sm:px-5">
                  {summaryTitle && <h3 className="text-base font-bold leading-7 text-[#0e0f0c]">{summaryTitle}</h3>}
                  {summaryDescription && <p className="mt-1 text-sm leading-7 text-[#5b5e5a]">{summaryDescription}</p>}
                </div>
              </ContentCard>
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <ContentCard
                title={t('مستوى مهاراتك ومتطلبات السوق', 'Your skills and market requirements')}
                subtitle={t('المستوى المطلوب محسوب من فجوات المهارات وإعلانات الوظائف الفعلية', 'Required levels are calculated from skill gaps and actual job postings')}
                icon={<Target size={19} className="text-[#1ba442]" />}
              >
                {radarSkills.length > 0 ? (
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-[#5b5e5a]">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full border-2 border-[#2563eb] bg-[#dbeafe]" aria-hidden="true" />
                        {t('مستواك الحالي', 'Your current level')}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full border-2 border-[#1ba442] bg-[#9fe870]" aria-hidden="true" />
                        {t('المستوى المطلوب', 'Required level')}
                      </span>
                    </div>
                    <div className="h-[320px] w-full sm:h-[360px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarSkills} cx="50%" cy="48%" outerRadius="66%">
                          <PolarGrid stroke="#dfe1dd" strokeWidth={1} />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fontSize: 11, fontWeight: 600, fill: '#5b5e5a' }}
                            tickFormatter={(value: string) => value.length > 22 ? `${value.slice(0, 20)}...` : value}
                          />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#828782' }} axisLine={false} />
                          <Radar
                            name={t('المستوى المطلوب', 'Required level')}
                            dataKey="marketDemand"
                            stroke="#1ba442"
                            fill="#9fe870"
                            fillOpacity={0.2}
                            strokeWidth={3}
                            dot={{ r: 3.5, fill: '#9fe870', stroke: '#1ba442', strokeWidth: 2 }}
                            isAnimationActive
                            animationDuration={700}
                          />
                          <Radar
                            name={t('مستواك', 'Your level')}
                            dataKey="yourSkills"
                            stroke="#2563eb"
                            fill="#2563eb"
                            fillOpacity={0.12}
                            strokeWidth={3}
                            dot={{ r: 3.5, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }}
                            isAnimationActive
                            animationDuration={700}
                          />
                          <Tooltip
                            formatter={(value: number | string, name: string) => [`${Math.round(Number(value) || 0)}%`, name]}
                            contentStyle={{ background: '#fff', border: '1px solid #dfe1dd', borderRadius: 8, fontSize: 12, boxShadow: '0 8px 24px rgba(14, 15, 12, 0.08)' }}
                            labelStyle={{ color: '#0e0f0c', fontWeight: 700, marginBottom: 4 }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <SectionEmpty text={t('أضف مهاراتك لإظهار المقارنة.', 'Add your skills to display this comparison.')} />
                )}
              </ContentCard>

              <ContentCard
                title={t('نشاط سوق العمل', 'Job market activity')}
                subtitle={insights?.marketSample?.jobCount
                  ? t(`العينة: ${insights.marketSample.jobCount} إعلانًا منشورًا خلال آخر 6 أشهر`, `Sample: ${insights.marketSample.jobCount} published jobs over the last 6 months`)
                  : t('لا توجد إعلانات كافية ضمن الفترة الحالية', 'No sufficient postings in the current period')}
                icon={<TrendingUp size={19} className="text-[#1ba442]" />}
              >
                {(insights?.marketSample?.jobCount ?? 0) > 0 ? (
                  <>
                    {!insights?.marketSample?.sufficientData && (
                      <p className="mb-3 rounded-lg border border-[#dfe1dd] bg-[#f7f8f6] px-3 py-2 text-xs text-[#5b5e5a]">
                        {t('حجم العينة محدود؛ يعرض الرسم النشاط الفعلي دون استنتاج اتجاه عام.', 'The sample is limited; the chart shows actual activity without claiming a general trend.')}
                      </p>
                    )}
                    <div className="h-[290px] w-full sm:h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={marketData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e8eae6" />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#5b5e5a' }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#5b5e5a' }} />
                          <Tooltip contentStyle={{ background: '#fff', border: '1px solid #dfe1dd', borderRadius: 8, fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                          <Line type="monotone" dataKey="jobCount" name={t('الوظائف المنشورة', 'Published jobs')} stroke="#5b5e5a" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="relevantJobs" name={t('وظائف مرتبطة بمهاراتك', 'Jobs related to your skills')} stroke="#1ba442" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                ) : (
                  <SectionEmpty text={t('لا تتوفر بيانات سوق فعلية للعرض حاليًا.', 'No actual market data is currently available.')} />
                )}
              </ContentCard>
            </div>

            <ContentCard
              title={t('فجوات المهارات ذات الأولوية', 'Priority skill gaps')}
              subtitle={t('الفرق بين مستواك الحالي والمستوى المطلوب في الوظائف المرتبطة', 'The difference between your current level and requirements in relevant jobs')}
              icon={<Brain size={19} className="text-[#1ba442]" />}
            >
              {skillGaps.length > 0 ? (
                <div className="divide-y divide-[#e8eae6]">
                  {skillGaps.map((gap) => {
                    const current = clampPercentage(gap.currentLevel);
                    const required = clampPercentage(gap.requiredLevel);
                    return (
                      <div key={gap.id || gap.skill} className="py-5 first:pt-0 last:pb-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-[#0e0f0c]">{gap.skill}</h4>
                              {gap.priority && <span className="rounded-full border border-[#dfe1dd] px-2 py-0.5 text-[11px] text-[#5b5e5a]">{priorityLabel(gap.priority, isRTL)}</span>}
                            </div>
                            <p className="mt-1 text-xs leading-6 text-[#5b5e5a]">
                              {isRTL
                                ? `ركز على تطوير ${gap.skill} من ${current}% إلى ${required}% لتحسين فرص المطابقة.`
                                : gap.recommendation || `Develop ${gap.skill} from ${current}% to ${required}% to improve your matching opportunities.`}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-4 text-xs font-semibold">
                            <span className="text-[#2563eb]">{t('مستواك', 'You')}: {current}%</span>
                            <span className="text-[#1ba442]">{t('المطلوب', 'Required')}: {required}%</span>
                          </div>
                        </div>
                        <div className="relative mt-3 h-2.5 overflow-hidden rounded-full bg-[#e8eae6]">
                          <div className="absolute inset-y-0 start-0 bg-[#E7FDD8]" style={{ width: `${required}%` }} />
                          <div className="absolute inset-y-0 start-0 bg-[#2563eb]" style={{ width: `${current}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <SectionEmpty text={t('لم تُسجل فجوات مهارية حتى الآن.', 'No skill gaps have been recorded yet.')} />
              )}
            </ContentCard>

            <ContentCard
              title={t('المسارات المهنية المقترحة', 'Suggested career paths')}
              subtitle={t('مرتبة حسب توافق ملفك مع الوظائف النشطة', 'Ranked by your profile match with active jobs')}
              icon={<BriefcaseBusiness size={19} className="text-[#1ba442]" />}
            >
              {careerPaths.length > 0 ? (
                <div className="divide-y divide-[#e8eae6]">
                  {careerPaths.map((path) => (
                    <div key={path.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                      <MatchScoreRing score={clampPercentage(path.readiness)} size={62} strokeWidth={4} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-[#0e0f0c]">{isRTL ? path.titleAr || path.title : path.title}</h4>
                          <span className="text-xs text-[#828782]">#{path.rank}</span>
                        </div>
                        {(isRTL ? path.descriptionAr || path.description : path.description) && (
                          <p className="mt-1 text-xs leading-6 text-[#5b5e5a]">{isRTL ? path.descriptionAr || path.description : path.description}</p>
                        )}
                        {path.skillsNeeded.length > 0 && (
                          <p className="mt-2 text-xs text-[#5b5e5a]">
                            <span className="font-semibold text-[#0e0f0c]">{t('مهارات تحتاج إلى تطوير', 'Skills to develop')}:</span>{' '}
                            {path.skillsNeeded.join(isRTL ? '، ' : ', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <SectionEmpty text={t('لا توجد مسارات مقترحة حتى الآن.', 'No suggested career paths yet.')} />
              )}
            </ContentCard>

            <ContentCard
              title={t('مصادر التعلم الموصى بها', 'Recommended learning resources')}
              subtitle={t('روابط خارجية موثوقة مرتبطة بفجوات مهاراتك', 'Trusted external resources linked to your skill gaps')}
              icon={<GraduationCap size={19} className="text-[#1ba442]" />}
            >
              {learningResources.length > 0 ? (
                <div className="divide-y divide-[#e8eae6]">
                  {learningResources.map((resource) => (
                    <div key={resource.id || resource.url} className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#828782]">{resource.provider}</p>
                        <h4 className="mt-1 text-sm font-bold text-[#0e0f0c]">{isRTL ? resource.nameAr || resource.name : resource.name}</h4>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#5b5e5a]">
                          {resource.duration && <span className="inline-flex items-center gap-1"><Clock3 size={13} />{resource.duration}</span>}
                          {resource.level && <span>{t('المستوى', 'Level')}: {levelLabel(resource.level, isRTL)}</span>}
                          {resource.isFree !== null && resource.isFree !== undefined && <span>{resource.isFree ? t('مجاني', 'Free') : t('مدفوع', 'Paid')}</span>}
                        </div>
                        {resource.skills.length > 0 && <p className="mt-2 text-xs text-[#5b5e5a]">{t('يركز على', 'Focuses on')}: {resource.skills.join(isRTL ? '، ' : ', ')}</p>}
                      </div>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#9fe870] px-4 py-2 text-sm font-bold text-[#0e0f0c]"
                      >
                        <ExternalLink size={15} />
                        {t('فتح المصدر', 'Open resource')}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <SectionEmpty text={t('لا توجد مصادر تعلم مرتبطة بفجواتك حاليًا.', 'No learning resources are currently linked to your gaps.')} />
              )}
            </ContentCard>

            {aiInsights.length > 0 && (
              <ContentCard title={t('ملاحظات التحليل', 'Analysis notes')} icon={<Sparkles size={19} className="text-[#1ba442]" />}>
                <div className="divide-y divide-[#e8eae6]">
                  {aiInsights.map((item) => <InsightRow key={item.id} item={item} isRTL={isRTL} />)}
                </div>
              </ContentCard>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  );
}

function InsightRow({ item, isRTL }: { item: StudentInsightItem; isRTL: boolean }) {
  const title = isRTL ? item.titleAr || item.title : item.title;
  const description = isRTL ? item.descriptionAr || item.description : item.description;
  return (
    <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7FDD8] text-[#1ba442]">{insightIcon(item.type)}</div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#0e0f0c]">{title}</p>
        {description && <p className="mt-1 text-xs leading-6 text-[#5b5e5a]">{description}</p>}
      </div>
    </div>
  );
}

function priorityLabel(priority: string, isRTL: boolean) {
  const labels: Record<string, [string, string]> = {
    critical: ['حرجة', 'Critical'],
    high: ['عالية', 'High'],
    important: ['مهمة', 'Important'],
    medium: ['متوسطة', 'Medium'],
    low: ['منخفضة', 'Low'],
  };
  const label = labels[priority.toLowerCase()];
  return label ? label[isRTL ? 0 : 1] : priority;
}

function levelLabel(level: string, isRTL: boolean) {
  const labels: Record<string, [string, string]> = {
    beginner: ['مبتدئ', 'Beginner'],
    intermediate: ['متوسط', 'Intermediate'],
    advanced: ['متقدم', 'Advanced'],
    expert: ['خبير', 'Expert'],
    mixed: ['متعدد المستويات', 'Mixed'],
  };
  const label = labels[level.toLowerCase()];
  return label ? label[isRTL ? 0 : 1] : level;
}

function SectionEmpty({ text }: { text: string }) {
  return <div className="flex min-h-40 items-center justify-center text-center text-sm text-[#828782]">{text}</div>;
}

function PageState({ icon, title, description, action }: { icon: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-[#dfe1dd] bg-white p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0f1ee] text-[#5b5e5a]">{icon}</div>
      <h3 className="mt-4 text-lg font-bold text-[#0e0f0c]">{title}</h3>
      <p className="mt-2 max-w-lg text-sm leading-7 text-[#5b5e5a]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5" aria-label="Loading insights">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl border border-[#dfe1dd] bg-white" />)}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl border border-[#dfe1dd] bg-white" />
        <div className="h-96 animate-pulse rounded-2xl border border-[#dfe1dd] bg-white" />
      </div>
    </div>
  );
}
