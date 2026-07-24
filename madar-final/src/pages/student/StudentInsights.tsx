import { useLanguage } from '@/contexts/LanguageContext';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import MatchScoreRing from '@/components/MatchScoreRing';
import { radarSkills, skillGaps, marketTrends, careerPaths, learningResources, aiInsights } from '@/data/student';
import { cn } from '@/lib/utils';
import {
  Sparkles, TrendingUp, BookOpen, ExternalLink, Clock, Brain,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from 'recharts';

const insightIconMap: Record<string, React.ReactNode> = {
  skill: <Brain size={16} style={{ color: '#7C3AED' }} />,
  job: <Sparkles size={16} style={{ color: '#f59e0b' }} />,
  trend: <TrendingUp size={16} style={{ color: '#1ba442' }} />,
  learning: <BookOpen size={16} style={{ color: '#3b82f6' }} />,
};

const skillColorMap: Record<string, string> = {
  'Docker': '#3b82f6',
  'AWS': '#f59e0b',
  'TypeScript': '#3b82f6',
  'Python': '#a855f7',
  'SQL': '#0e0f0c',
  'Machine Learning': '#a855f7',
};

export default function StudentInsights() {
  const { t, isRTL } = useLanguage();

  const radarData = radarSkills.map((s) => ({
    subject: isRTL ? s.subjectAr : s.subject,
    yourSkills: s.yourSkills,
    marketDemand: s.marketDemand,
    fullMark: s.fullMark,
  }));

  const marketData = marketTrends.map((m) => ({
    name: isRTL ? m.monthAr : m.month,
    demand: m.demand,
    supply: m.supply,
    yourSkills: m.yourSkills,
  }));

  return (
    <PortalLayout title={t('الرؤى والتحليلات', 'Insights')}>
      <div className={cn("space-y-6", isRTL ? "rtl" : "ltr")}>

        {/* AI Summary */}
        <ContentCard
          title={t('ملخص الذكاء الاصطناعي', 'AI Summary')}
          icon={<Sparkles size={20} style={{ color: '#7C3AED' }} />}
        >
          <div className="rounded-2xl border border-[#9fe870] bg-[#F4FCF0] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
                <Sparkles size={20} style={{ color: '#7C3AED' }} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#0e0f0c]">
                  {t(
                    'ملفك الشخصي يطابق 85% من وظائف مطور junior المطروحة حالياً.',
                    'Your profile matches 85% of currently posted junior developer roles.'
                  )}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#5b5e5a]">
                  {t(
                    'لزيادة نسبة التطابق، ركّز على تعلم Docker وAWS. هاتان المهارتان الأكثر طلباً في السوق حالياً.',
                    'To increase your match rate, focus on learning Docker and AWS. These two skills are the most in-demand in the market right now.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </ContentCard>

        {/* Radar Chart */}
        <ContentCard
          title={t('مهاراتك مقابل الطلب السوقي', 'Your Skills vs Market Demand')}
          icon={<TrendingUp size={20} style={{ color: '#1D4ED8' }} />}
        >
          <div className="mt-2" style={{ minHeight: 400 }}>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#dfe1dd" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#5b5e5a' }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#828782' }}
                />
                <Radar
                  name={t('مهاراتك', 'Your Skills')}
                  dataKey="yourSkills"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name={t('الطلب السوقي', 'Market Demand')}
                  dataKey="marketDemand"
                  stroke="#9fe870"
                  fill="#9fe870"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #dfe1dd',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '16px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ContentCard>

        {/* Skill Gap Detail */}
        <ContentCard
          title={t('تفاصيل فجوة المهارات', 'Skill Gap Detail')}
          icon={<Brain size={20} style={{ color: '#dc2626' }} />}
        >
          <div className="mt-2 flex flex-col gap-5">
            {skillGaps.map((gap) => (
              <div key={gap.skill}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#0e0f0c]">{gap.skill}</span>
                    <span className="rounded-full bg-[#f0f1ee] px-2 py-0.5 text-[10px] font-semibold text-[#828782]">{gap.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-semibold" style={{ color: '#3b82f6' }}>
                      {t('لديك', 'You')}: {gap.currentLevel}%
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: '#9fe870' }}>
                      {t('السوق', 'Market')}: {gap.marketLevel}%
                    </span>
                  </div>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#f0f1ee]">
                  {/* Market level (background bar) */}
                  <div
                    className="absolute inset-y-0 start-0 rounded-full transition-all duration-700"
                    style={{ width: `${gap.marketLevel}%`, background: '#E7FDD8' }}
                  />
                  {/* Current level (foreground bar) */}
                  <div
                    className="absolute inset-y-0 start-0 rounded-full transition-all duration-700"
                    style={{ width: `${gap.currentLevel}%`, background: skillColorMap[gap.skill] || '#3b82f6' }}
                  />
                </div>
                <p className="mt-1 text-[10px] font-semibold" style={{ color: '#828782' }}>
                  {t('الفجوة:', 'Gap:')} {gap.marketLevel - gap.currentLevel}% {t('مطلوب للوصول للمستوى السوقي', 'needed to reach market level')}
                </p>
              </div>
            ))}
          </div>
        </ContentCard>

        {/* Market Trends Chart */}
        <ContentCard
          title={t('اتجاهات السوق', 'Market Trends')}
          subtitle={t('على مدار 12 شهراً', 'Over 12 months')}
          icon={<TrendingUp size={20} style={{ color: '#1ba442' }} />}
        >
          <div className="mt-2" style={{ minHeight: 320 }}>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={marketData}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9fe870" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9fe870" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSupply" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSkills" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f1ee" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#828782', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 11, fill: '#828782', fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #dfe1dd',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="demand"
                  name={t('الطلب', 'Demand')}
                  stroke="#9fe870"
                  fillOpacity={1}
                  fill="url(#colorDemand)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="supply"
                  name={t('العرض', 'Supply')}
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorSupply)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="yourSkills"
                  name={t('مهاراتك', 'Your Skills')}
                  stroke="#a855f7"
                  fillOpacity={1}
                  fill="url(#colorSkills)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ContentCard>

        {/* Career Path Suggestions */}
        <ContentCard
          title={t('مسارات مهنية مقترحة', 'Career Path Suggestions')}
          icon={<Sparkles size={20} style={{ color: '#7C3AED' }} />}
        >
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {careerPaths.map((path) => (
              <div
                key={path.id}
                className="rounded-2xl border border-[#dfe1dd] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-bold text-[#0e0f0c]">{isRTL ? path.titleAr : path.titleEn}</h4>
                  <MatchScoreRing score={path.readiness} size={48} strokeWidth={3} />
                </div>
                <p className="mt-2 text-xs font-semibold text-[#5b5e5a] line-clamp-3">
                  {isRTL ? path.descriptionAr : path.descriptionEn}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {path.skillsNeeded.map((skill) => (
                    <span key={skill} className="rounded-full bg-[#f0f1ee] px-2 py-0.5 text-[10px] font-semibold text-[#5b5e5a]">{skill}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ContentCard>

        {/* Learning Resources */}
        <ContentCard
          title={t('موارد تعليمية', 'Learning Resources')}
          icon={<BookOpen size={20} style={{ color: '#1D4ED8' }} />}
        >
          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {learningResources.map((resource) => (
              <div
                key={resource.id}
                className="rounded-2xl border border-[#dfe1dd] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DBEAFE]">
                    <BookOpen size={14} style={{ color: '#1D4ED8' }} />
                  </div>
                  <span className="text-[10px] font-semibold text-[#828782]">{isRTL ? resource.providerAr : resource.providerEn}</span>
                </div>
                <h4 className="mt-2 text-sm font-bold text-[#0e0f0c]">{isRTL ? resource.nameAr : resource.nameEn}</h4>
                <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-[#828782]">
                  <Clock size={10} />
                  {isRTL ? resource.durationAr : resource.duration}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {resource.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-[#E7FDD8] px-2 py-0.5 text-[10px] font-semibold" style={{ color: '#1ba442' }}>{skill}</span>
                  ))}
                </div>
                <a
                  href={resource.url}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-full bg-[#f0f1ee] py-2 text-xs font-semibold text-[#0e0f0c] transition-all hover:bg-[#9fe870]"
                >
                  <ExternalLink size={12} />
                  {t('بدء التعلم', 'Start Learning')}
                </a>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>
    </PortalLayout>
  );
}
