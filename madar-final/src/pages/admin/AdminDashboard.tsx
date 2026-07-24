import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import {
  users, healthStatuses, platformMetrics, recentActivity,
  apiRequestsData, responseTimeData, errorRateData, userGrowthData,
  typeLabelMap, statusVariantMap,
} from '@/data/admin';
import type { UserType, UserStatus, ActivityType } from '@/data/admin';
import {
  Server, Database, Brain, HardDrive, Users, GraduationCap, Building2,
  Briefcase, FileText, BarChart3, Activity, Search, Shield, Zap,
  Eye, Edit3, PauseCircle, ChevronLeft, ChevronRight, UserPlus,
  Sliders, Cpu, ScrollText, DatabaseBackup, Megaphone, TrendingUp,
  UserCheck, AlertCircle, XCircle, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users size={24} style={{ color: '#1ba442' }} />,
  Briefcase: <Briefcase size={24} style={{ color: '#1D4ED8' }} />,
  FileText: <FileText size={24} style={{ color: '#1ba442' }} />,
  GraduationCap: <GraduationCap size={24} style={{ color: '#7C3AED' }} />,
  BarChart3: <BarChart3 size={24} style={{ color: '#B45309' }} />,
  Activity: <Activity size={24} style={{ color: '#1ba442' }} />,
};

const activityIconMap: Record<ActivityType, { icon: React.ReactNode; bg: string }> = {
  user: { icon: <UserCheck size={14} style={{ color: '#1ba442' }} />, bg: '#E7FDD8' },
  system: { icon: <CheckCircle2 size={14} style={{ color: '#828782' }} />, bg: '#f0f1ee' },
  alert: { icon: <AlertCircle size={14} style={{ color: '#B45309' }} />, bg: '#FEF3C7' },
  error: { icon: <XCircle size={14} style={{ color: '#B91C1C' }} />, bg: '#FEE2E2' },
};

const healthIconMap: Record<string, React.ReactNode> = {
  API: <Server size={20} style={{ color: '#1ba442' }} />,
  Database: <Database size={20} style={{ color: '#1ba442' }} />,
  'AI Engine': <Brain size={20} style={{ color: '#7C3AED' }} />,
  Storage: <HardDrive size={20} style={{ color: '#B45309' }} />,
};

const tabs: { key: UserType | 'all'; labelAr: string; labelEn: string }[] = [
  { key: 'all', labelAr: 'الكل', labelEn: 'All' },
  { key: 'student', labelAr: 'طلاب', labelEn: 'Students' },
  { key: 'company', labelAr: 'شركات', labelEn: 'Companies' },
  { key: 'university', labelAr: 'جامعات', labelEn: 'Universities' },
  { key: 'admin', labelAr: 'مديرون', labelEn: 'Admins' },
];

const quickActions = [
  { icon: <Users size={22} />, labelAr: 'إدارة المستخدمين', labelEn: 'Manage Users', color: '#1ba442', bg: '#E7FDD8' },
  { icon: <Sliders size={22} />, labelAr: 'إعدادات النظام', labelEn: 'System Settings', color: '#1D4ED8', bg: '#DBEAFE' },
  { icon: <Cpu size={22} />, labelAr: 'إعدادات الذكاء الاصطناعي', labelEn: 'AI Configuration', color: '#7C3AED', bg: '#F3E8FF' },
  { icon: <ScrollText size={22} />, labelAr: 'عرض السجلات', labelEn: 'View Logs', color: '#B45309', bg: '#FEF3C7' },
  { icon: <DatabaseBackup size={22} />, labelAr: 'نسخ احتياطي', labelEn: 'Backup Data', color: '#0e0f0c', bg: '#f0f1ee' },
  { icon: <Megaphone size={22} />, labelAr: 'إرسال إعلان', labelEn: 'Announcement', color: '#B91C1C', bg: '#FEE2E2' },
];

export default function AdminDashboard() {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<UserType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 5;

  const filteredUsers = useMemo(() => {
    let list = users;
    if (activeTab !== 'all') list = list.filter(u => u.type === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * perPage, currentPage * perPage);
  const allHealthy = healthStatuses.every(h => h.status === 'healthy');

  return (
    <PortalLayout
      title={t('لوحة إدارة المنصة', 'Platform Administration')}
      subtitle={t('نظرة عامة على صحة النظام والمستخدمين والأداء', 'System health, users, and performance overview')}
    >
      <div className={cn("space-y-6", isRTL ? "rtl" : "ltr")}>
        {/* Platform Status Badge */}
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
            style={{
              background: allHealthy ? '#E7FDD8' : '#FEE2E2',
              borderColor: allHealthy ? '#1ba442' : '#DC2626',
              color: allHealthy ? '#1ba442' : '#B91C1C',
            }}
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: allHealthy ? '#1ba442' : '#DC2626' }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: allHealthy ? '#1ba442' : '#DC2626' }} />
            </span>
            {allHealthy ? t('تعمل جميع الأنظمة', 'All Systems Operational') : t('توجد مشكلة', 'Issue Detected')}
          </span>
        </div>

        {/* System Health Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {healthStatuses.map((health) => (
            <ContentCard key={health.name} noPadding className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: health.status === 'healthy' ? '#E7FDD8' : health.status === 'warning' ? '#FEF3C7' : '#FEE2E2' }}>
                  {healthIconMap[health.name]}
                </div>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                    style={{ background: health.status === 'healthy' ? '#1ba442' : health.status === 'warning' ? '#F59E0B' : '#DC2626' }} />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full"
                    style={{ background: health.status === 'healthy' ? '#1ba442' : health.status === 'warning' ? '#F59E0B' : '#DC2626' }} />
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t(health.nameAr, health.name)}</p>
                <p className="mt-1 text-lg font-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: health.status === 'warning' ? '#B45309' : '#0e0f0c' }}>
                  {health.status === 'healthy' && (health.uptime || health.connections || health.usage)}
                  {health.status === 'warning' && (health.requestsToday || health.detail)}
                </p>
                {health.detail && <p className="mt-1 text-xs font-semibold" style={{ color: '#B45309' }}>{t(health.detailAr || '', health.detail)}</p>}
                {(health.responseTime || health.avgResponse || health.capacity) && (
                  <p className="mt-1 text-xs" style={{ color: '#828782' }}>{health.responseTime || health.avgResponse || health.capacity}</p>
                )}
              </div>
            </ContentCard>
          ))}
        </div>

        {/* Platform Metrics */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {platformMetrics.map((metric) => (
            <MetricCard
              key={metric.labelEn}
              icon={iconMap[metric.iconName]}
              iconBg={metric.iconBg}
              value={metric.value}
              label={t(metric.labelAr, metric.labelEn)}
              trend={metric.trend}
              trendLabel={metric.trend ? t(metric.trendLabelAr || '', metric.trendLabelEn || '') : undefined}
              trendDirection={metric.trendDirection}
            />
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left Column: User Management + Recent Activity */}
          <div className="space-y-6 lg:col-span-3">
            {/* User Management */}
            <ContentCard
              title={t('إدارة المستخدمين', 'User Management')}
              icon={<Users size={20} style={{ color: '#5b5e5a' }} />}
              action={
                <button className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 hover:scale-[1.02]" style={{ background: '#9fe870', color: '#0e0f0c' }}>
                  <UserPlus size={16} />{t('إضافة مستخدم', 'Add User')}
                </button>
              }
            >
              {/* Tabs */}
              <div className="mb-4 flex flex-wrap gap-1 rounded-full p-1" style={{ background: '#f0f1ee' }}>
                {tabs.map(tab => (
                  <button key={tab.key}
                    onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                    className={cn("rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200", activeTab === tab.key ? "text-[#0e0f0c] shadow-sm" : "text-[#5b5e5a] hover:text-[#0e0f0c]")}
                    style={activeTab === tab.key ? { background: '#ffffff' } : {}}>
                    {t(tab.labelAr, tab.labelEn)}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#828782' }} />
                <input type="text" placeholder={t('ابحث بالاسم أو البريد أو النوع...', 'Search by name, email, or type...')}
                  value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="h-12 w-full rounded-full border pl-11 pr-4 text-sm font-semibold outline-none transition-all focus:ring-2"
                  style={{ background: '#ffffff', borderColor: '#dfe1dd', color: '#0e0f0c' }} />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#f0f1ee' }}>
                      <th className="rounded-l-xl px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5b5e5a' }}>{t('المستخدم', 'User')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5b5e5a' }}>{t('النوع', 'Type')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5b5e5a' }}>{t('الحالة', 'Status')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5b5e5a' }}>{t('تاريخ التسجيل', 'Joined')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5b5e5a' }}>{t('آخر نشاط', 'Last Active')}</th>
                      <th className="rounded-r-xl px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#5b5e5a' }}>{t('إجراءات', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user) => {
                      const typeInfo = typeLabelMap[user.type];
                      const statusVariant = statusVariantMap[user.status] as 'success' | 'error' | 'warning';
                      return (
                        <tr key={user.id} className="border-b transition-colors hover:bg-[#f0f1ee]" style={{ borderColor: '#dfe1dd' }}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold" style={{ background: typeInfo.bg, color: typeInfo.text }}>
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: '#0e0f0c' }}>{t(user.nameAr, user.name)}</p>
                                <p className="text-xs" style={{ color: '#828782' }}>{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><StatusBadge label={t(typeInfo.ar, typeInfo.en)} variant="default" className="text-xs" /></td>
                          <td className="px-4 py-3">
                            <StatusBadge
                              label={t(user.status === 'active' ? 'نشط' : user.status === 'banned' ? 'محظور' : 'معلق', user.status.charAt(0).toUpperCase() + user.status.slice(1))}
                              variant={statusVariant} />
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#5b5e5a' }}>{user.joinedDate}</td>
                          <td className="px-4 py-3 text-sm" style={{ color: '#828782' }}>{t(user.lastActiveAr, user.lastActive)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button className="rounded-full p-1.5 transition-colors hover:bg-[#E7FDD8]" title={t('عرض', 'View')}><Eye size={16} style={{ color: '#1ba442' }} /></button>
                              <button className="rounded-full p-1.5 transition-colors hover:bg-[#DBEAFE]" title={t('تعديل', 'Edit')}><Edit3 size={16} style={{ color: '#1D4ED8' }} /></button>
                              <button className="rounded-full p-1.5 transition-colors hover:bg-[#FEE2E2]" title={t('تعليق', 'Suspend')}><PauseCircle size={16} style={{ color: '#B91C1C' }} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs" style={{ color: '#828782' }}>
                    {t(`عرض ${(currentPage - 1) * perPage + 1} - ${Math.min(currentPage * perPage, filteredUsers.length)} من ${filteredUsers.length}`,
                      `Showing ${(currentPage - 1) * perPage + 1} - ${Math.min(currentPage * perPage, filteredUsers.length)} of ${filteredUsers.length}`)}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="rounded-full p-2 transition-colors disabled:opacity-30 hover:bg-[#f0f1ee]">
                      {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button key={page} onClick={() => setCurrentPage(page)}
                        className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all", currentPage === page ? "text-[#0e0f0c]" : "text-[#5b5e5a] hover:bg-[#f0f1ee]")}
                        style={currentPage === page ? { background: '#9fe870' } : {}}>{page}</button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="rounded-full p-2 transition-colors disabled:opacity-30 hover:bg-[#f0f1ee]">
                      {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </ContentCard>

            {/* Recent Activity */}
            <ContentCard
              title={t('النشاط الأخير', 'Recent Activity')}
              icon={<Activity size={20} style={{ color: '#5b5e5a' }} />}
            >
              <div className="space-y-3">
                {recentActivity.map((event) => {
                  const activityStyle = activityIconMap[event.type];
                  return (
                    <div key={event.id} className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-[#f0f1ee]" style={{ background: '#f0f1ee' }}>
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ background: activityStyle.bg }}>
                        {activityStyle.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold" style={{ color: '#0e0f0c' }}>{t(event.descriptionAr, event.description)}</p>
                        <p className="text-xs" style={{ color: '#828782' }}>{t(event.timestampAr, event.timestamp)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ContentCard>
          </div>

          {/* Right Column: Monitoring + Analytics + Quick Actions */}
          <div className="space-y-6 lg:col-span-2">
            {/* Performance Monitoring */}
            <ContentCard
              title={t('مراقبة الأداء', 'Performance Monitoring')}
              icon={<Activity size={20} style={{ color: '#5b5e5a' }} />}
              action={
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold" style={{ background: '#FEE2E2', borderColor: '#DC2626', color: '#B91C1C' }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: '#DC2626' }} />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: '#DC2626' }} />
                  </span>
                  {t('مباشر', 'LIVE')}
                </span>
              }
            >
              {/* API Requests Chart */}
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('طلبات API في الدقيقة', 'API Requests / Minute')}</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={apiRequestsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#828782' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#828782' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #dfe1dd', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="total" name={t('الإجمالي', 'Total')} stroke="#9fe870" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="successful" name={t('ناجح', 'Successful')} stroke="#1ba442" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="failed" name={t('فاشل', 'Failed')} stroke="#DC2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Response Time Chart */}
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('أوقات الاستجابة (ms)', 'Response Times (ms)')}</p>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#828782' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#828782' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #dfe1dd', fontSize: '12px' }} />
                    <ReferenceLine y={300} stroke="#DC2626" strokeDasharray="6 3" label={{ value: 'Threshold', position: 'right', fontSize: 10, fill: '#DC2626' }} />
                    <Area type="monotone" dataKey="responseTime" name={t('الاستجابة', 'Response')} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Error Rate Chart */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('معدل الأخطاء حسب النقطة', 'Error Rates by Endpoint')}</p>
                  <span className="text-xs font-semibold" style={{ color: '#1ba442' }}>0.03%</span>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={errorRateData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#828782' }} />
                    <YAxis dataKey="endpoint" type="category" tick={{ fontSize: 9, fill: '#828782' }} width={90} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #dfe1dd', fontSize: '12px' }} />
                    <Bar dataKey="errorRate" name={t('معدل الخطأ %', 'Error Rate %')} fill="#DC2626" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ContentCard>

            {/* User Growth Chart */}
            <ContentCard
              title={t('تحليلات النمو', 'Growth Analytics')}
              icon={<TrendingUp size={20} style={{ color: '#5b5e5a' }} />}
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dfe1dd" />
                  <XAxis dataKey={isRTL ? 'monthAr' : 'month'} tick={{ fontSize: 10, fill: '#828782' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#828782' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #dfe1dd', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="students" name={t('طلاب', 'Students')} stroke="#9fe870" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="companies" name={t('شركات', 'Companies')} stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="universities" name={t('جامعات', 'Universities')} stroke="#a855f7" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="total" name={t('الإجمالي', 'Total')} stroke="#0e0f0c" strokeWidth={2} strokeDasharray="6 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ContentCard>

            {/* Quick Admin Actions */}
            <ContentCard
              title={t('إجراءات سريعة', 'Quick Actions')}
              icon={<Zap size={20} style={{ color: '#5b5e5a' }} />}
            >
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, idx) => (
                  <button key={idx}
                    className="flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    style={{ background: '#ffffff', borderColor: '#dfe1dd' }}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: action.bg, color: action.color }}>
                      {action.icon}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: '#0e0f0c' }}>{t(action.labelAr, action.labelEn)}</span>
                  </button>
                ))}
              </div>
            </ContentCard>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
