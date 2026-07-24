import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import PortalLayout from '@/components/PortalLayout'
import ContentCard from '@/components/ContentCard'
import MetricCard from '@/components/MetricCard'
import { useCompanyAnalytics } from '@/hooks/useCompany'
import { cn } from '@/lib/utils'
import {
  Briefcase,
  Users,
  CheckCircle2,
  Download,
  Filter,
  TrendingUp as TrendingUpIcon,
  BarChart3,
  PieChart as PieChartIcon,
  Clock as ClockIcon,
  Award as AwardIcon,
  Loader2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ReferenceLine,
} from 'recharts'

const timeRanges = [
  { key: '7d', ar: '7 أيام', en: '7 Days' },
  { key: '30d', ar: '30 يوم', en: '30 Days' },
  { key: '90d', ar: '90 يوم', en: '90 Days' },
  { key: '1y', ar: 'سنة', en: '1 Year' },
]

const metricList = [
  { key: 'totalJobs', icon: Briefcase as LucideIcon, iconBg: '#E7FDD8' },
  { key: 'totalApplicants', icon: Users as LucideIcon, iconBg: '#DBEAFE' },
  { key: 'hires', icon: CheckCircle2 as LucideIcon, iconBg: '#D1FAE5' },
  { key: 'avgTimeToFill', icon: ClockIcon as LucideIcon, iconBg: '#FEF3C7' },
  { key: 'avgMatchScore', icon: TrendingUpIcon as LucideIcon, iconBg: '#F3E8FF' },
  { key: 'offerAcceptanceRate', icon: AwardIcon as LucideIcon, iconBg: '#E7FDD8' },
]

function LoadingSpinner() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#9fe870]" />
    </div>
  )
}

export default function CompanyAnalytics() {
  const { dir } = useLanguage()
  const isRTL = dir === 'rtl'
  const t = (ar: string, en: string) => (isRTL ? ar : en)
  const [timeRange, setTimeRange] = useState('30d')

  const { data: analytics, isLoading } = useCompanyAnalytics(timeRange)

  const analyticsData = analytics?.data ?? analytics ?? {}

  const recruitmentMetrics = analyticsData.metrics ?? {}
  const monthlyApplications = analyticsData.monthlyApplications ?? analyticsData.trends ?? []
  const topSkills = analyticsData.topSkills ?? []
  const candidateSources = analyticsData.candidateSources ?? []
  const timeToFillData = analyticsData.timeToFill ?? []
  const funnelData = analyticsData.funnel ?? [
    { name: isRTL ? 'المتقدمين' : 'Applicants', count: 0 },
    { name: isRTL ? 'الفرز' : 'Screening', count: 0 },
    { name: isRTL ? 'المقابلات' : 'Interviews', count: 0 },
    { name: isRTL ? 'العروض' : 'Offers', count: 0 },
    { name: isRTL ? 'المعينين' : 'Hired', count: 0 },
  ]
  const qualityDistribution = analyticsData.qualityDistribution ?? [
    { range: '0-20%', count: 0, color: '#dc2626' },
    { range: '21-40%', count: 0, color: '#f59e0b' },
    { range: '41-60%', count: 0, color: '#f59e0b' },
    { range: '61-80%', count: 0, color: '#3b82f6' },
    { range: '81-100%', count: 0, color: '#9fe870' },
  ]

  if (isLoading) return <LoadingSpinner />

  return (
    <PortalLayout title="Recruitment Analytics">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-black text-[#0e0f0c]">{t('تحليلات التوظيف', 'Recruitment Analytics')}</h2>
        <div className="flex items-center gap-3">
          {/* Time Range Tabs */}
          <div className="inline-flex items-center rounded-full bg-[#f0f1ee] p-1">
            {timeRanges.map((tr) => (
              <button
                key={tr.key}
                onClick={() => setTimeRange(tr.key)}
                className={cn(
                  'rounded-full px-4 py-2 text-xs font-semibold transition-all',
                  timeRange === tr.key
                    ? 'bg-white text-[#0e0f0c] shadow-sm'
                    : 'text-[#5b5e5a] hover:text-[#0e0f0c]'
                )}
              >
                {isRTL ? tr.ar : tr.en}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-4 py-2 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#f0f1ee]">
            <Download size={16} />
            <span className="hidden sm:inline">{t('تصدير', 'Export')}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {metricList.map((m) => {
          const data = (recruitmentMetrics as any)[m.key]
          return (
            <MetricCard
              key={m.key}
              icon={<m.icon size={20} />}
              value={data?.value ?? 0}
              label={isRTL ? data?.labelAr : data?.label ?? m.key}
              trend={data?.trend}
              iconBg={m.iconBg}
            />
          )
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recruitment Funnel - Horizontal Bar */}
        <ContentCard
          title={t('قمع التوظيف', 'Recruitment Funnel')}
          icon={<Filter size={20} />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#5b5e5a' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#0e0f0c', fontWeight: 600 }} width={100} />
              <ReTooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #dfe1dd',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" fill="#9fe870" radius={[0, 8, 8, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </ContentCard>

        {/* Application Trends - Line Chart */}
        <ContentCard
          title={t('اتجاهات الطلبات', 'Application Trends')}
          icon={<TrendingUpIcon size={20} />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyApplications} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" />
              <XAxis dataKey={isRTL ? 'monthAr' : 'month'} tick={{ fontSize: 12, fill: '#5b5e5a' }} />
              <YAxis tick={{ fontSize: 12, fill: '#5b5e5a' }} />
              <ReTooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #dfe1dd',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="total"
                name={isRTL ? 'إجمالي الطلبات' : 'Total Applications'}
                stroke="#9fe870"
                strokeWidth={3}
                dot={{ r: 5, fill: '#9fe870' }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="qualified"
                name={isRTL ? 'مرشحون مؤهلون' : 'Qualified'}
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 5, fill: '#3b82f6' }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="interviews"
                name={isRTL ? 'مقابلات' : 'Interviews'}
                stroke="#a855f7"
                strokeWidth={3}
                dot={{ r: 5, fill: '#a855f7' }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ContentCard>
      </div>

      {/* Charts Row 2 */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Demanded Skills - Horizontal Bar */}
        <ContentCard
          title={t('أكثر المهارات طلباً', 'Top Demanded Skills')}
          icon={<BarChart3 size={20} />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={topSkills}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#5b5e5a' }} />
              <YAxis dataKey="skill" type="category" tick={{ fontSize: 11, fill: '#0e0f0c', fontWeight: 600 }} width={80} />
              <ReTooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #dfe1dd',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="demand" fill="#9fe870" radius={[0, 8, 8, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ContentCard>

        {/* Candidate Sources - Donut Chart */}
        <ContentCard
          title={t('مصادر المرشحين', 'Candidate Sources')}
          icon={<PieChartIcon size={20} />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={candidateSources}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                nameKey={isRTL ? 'nameAr' : 'name'}
              >
                {candidateSources.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ReTooltip
                formatter={(value: number) => [`${value}%`, '']}
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #dfe1dd',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                wrapperStyle={{ fontSize: '12px', right: 0 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ContentCard>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Time to Fill by Job */}
        <ContentCard
          title={t('وقت التوظيف لكل وظيفة', 'Time to Fill by Job')}
          icon={<ClockIcon size={20} />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeToFillData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" />
              <XAxis dataKey="jobTitle" tick={{ fontSize: 11, fill: '#5b5e5a' }} />
              <YAxis tick={{ fontSize: 12, fill: '#5b5e5a' }} label={{ value: t('أيام', 'Days'), angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#5b5e5a' } }} />
              <ReTooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #dfe1dd',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <ReferenceLine
                y={18}
                label={{ value: t('المتوسط', 'Avg'), position: 'right', fill: '#f59e0b', fontSize: 12 }}
                stroke="#f59e0b"
                strokeDasharray="6 3"
              />
              <Bar
                dataKey="days"
                name={t('أيام التوظيف', 'Days to Fill')}
                radius={[8, 8, 0, 0]}
                barSize={32}
              >
                {timeToFillData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.days < 20 ? '#9fe870' : entry.days <= 30 ? '#f59e0b' : '#dc2626'}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="industryAvg"
                name={t('متوسط القطاع', 'Industry Avg')}
                fill="#dfe1dd"
                radius={[8, 8, 0, 0]}
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </ContentCard>

        {/* Candidate Quality Distribution */}
        <ContentCard
          title={t('توزيع جودة المرشحين', 'Candidate Quality Distribution')}
          icon={<AwardIcon size={20} />}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={qualityDistribution}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" />
              <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#5b5e5a' }} />
              <YAxis tick={{ fontSize: 12, fill: '#5b5e5a' }} />
              <ReTooltip
                contentStyle={{
                  background: '#fff',
                  border: '1px solid #dfe1dd',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                {qualityDistribution.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ContentCard>
      </div>
    </PortalLayout>
  )
}
