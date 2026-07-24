import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import {
  useDashboardMetrics, useSystemHealth, useActivityLog, useSecurityAlerts,
  useCrossPlatformAnalytics, useAiOperations, useEmailMonitoring, useBackups,
  useCreateBackup
} from '@/hooks/useAdmin';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import StatusBadge from '@/components/StatusBadge';
import {
  Server, Database, Brain, HardDrive, Users, CheckCircle2, XCircle, AlertCircle,
  Megaphone, Zap, RotateCcw, Activity, Shield, Users2, DatabaseBackup,
  ScrollText, Mail, FileText, ChevronRight, ChevronLeft, Eye, X, Loader2,
  TrendingUp, Settings, ArrowRight, ArrowLeft, MoreHorizontal, MessageSquare, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

function formatBytes(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function timeAgo(date?: string | Date, t?: any): string {
  if (!date) return '-';
  const d = new Date(date);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return t ? t('الآن', 'Just now') : 'الآن';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return t ? t(`منذ ${mins} دقيقة`, `${mins} min ago`) : `منذ ${mins} دقيقة`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t ? t(`منذ ${hours} ساعة`, `${hours} hours ago`) : `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return t ? t(`منذ ${days} يوم`, `${days} days ago`) : `منذ ${days} يوم`;
}

export default function AdminDashboard() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [periodFilter, setPeriodFilter] = useState<'today' | '7d' | '30d'>('today');
  const [drawerService, setDrawerService] = useState<any>(null);
  const [showBackupConfirm, setShowBackupConfirm] = useState(false);

  // Data fetching
  const { data: dashboardData, isLoading: dashboardLoading, isFetching: dashboardFetching, refetch: refetchDashboard } = useDashboardMetrics();
  const { data: healthData, isLoading: healthLoading, isFetching: healthFetching, refetch: refetchHealth } = useSystemHealth();
  const { data: activityResponse } = useActivityLog({ page: 1, limit: 10 });
  const { data: securityAlertsData } = useSecurityAlerts({ page: 1, limit: 5 });
  const { data: crossPlatformData } = useCrossPlatformAnalytics();
  const { data: aiData } = useAiOperations({ page: 1, limit: 100 });
  const { data: emailData } = useEmailMonitoring();
  const { data: backupsData } = useBackups({ page: 1, limit: 1 });
  const createBackupMutation = useCreateBackup();

  const isRefreshing = dashboardFetching || healthFetching;
  const handleRefresh = () => {
    refetchDashboard();
    refetchHealth();
  };

  const handleCreateBackup = async () => {
    await createBackupMutation.mutateAsync();
    setShowBackupConfirm(false);
  };

  // Platform Status Logic
  const checks = (healthData as any)?.checks || {};
  const serviceKeys = ['backend', 'mongodb', 'ai', 'redis', 'smtp', 'storage'];
  let totalDown = 0;
  let totalSlow = 0;
  let totalHealthy = 0;
  let totalUnknown = 0;

  serviceKeys.forEach(k => {
    const s = checks[k];
    if (!s) { totalUnknown++; return; }
    if (s.status === 'down' || s.status === 'error') totalDown++;
    else if (s.status === 'warning' || (s.responseTimeMs && s.responseTimeMs > 500)) totalSlow++;
    else totalHealthy++;
  });

  const criticalErrorsCount = dashboardData?.criticalErrors24h || 0;
  
  let platformStatus = 'unknown';
  if (totalUnknown === serviceKeys.length && !healthData) platformStatus = 'unknown';
  else if (totalDown > 0 || criticalErrorsCount > 0) platformStatus = 'critical';
  else if (totalSlow > 0 || totalUnknown > 0) platformStatus = 'attention';
  else platformStatus = 'healthy';

  const statusConfig = {
    healthy: { ar: 'جميع الخدمات تعمل بصورة طبيعية', en: 'All systems operational', bg: 'from-emerald-50 to-teal-50/20', border: 'border-emerald-200', text: 'text-emerald-700', pulse: 'bg-emerald-500', icon: <CheckCircle2 size={20} className="text-emerald-600" /> },
    attention: { ar: 'المنصة تحتاج إلى الانتباه', en: 'Platform needs attention', bg: 'from-amber-50 to-yellow-50/20', border: 'border-amber-200', text: 'text-amber-700', pulse: 'bg-amber-500', icon: <AlertCircle size={20} className="text-amber-600" /> },
    critical: { ar: 'توجد مشكلة حرجة', en: 'Critical issue detected', bg: 'from-rose-50 to-red-50/20', border: 'border-rose-200', text: 'text-rose-700', pulse: 'bg-rose-500', icon: <XCircle size={20} className="text-rose-600" /> },
    unknown: { ar: 'تعذر التحقق', en: 'Verification failed', bg: 'from-slate-50 to-zinc-50/20', border: 'border-slate-200', text: 'text-slate-600', pulse: 'bg-slate-500', icon: <Activity size={20} className="text-slate-500" /> },
  };

  const currentStatus = statusConfig[platformStatus as keyof typeof statusConfig];

  // KPIs
  const activeUsers = dashboardData?.activeUsers24h ?? 0;
  
  // Failed & Pending AI Ops
  const aiOpsList = aiData?.operations || [];
  const aiFailed = aiOpsList.filter((op: any) => op.status === 'failed').length;
  const aiPending = aiOpsList.filter((op: any) => op.status === 'pending' || op.status === 'processing').length;
  
  // Emails
  const emailFailed = emailData?.counts24h?.failure || dashboardData?.email?.failure24h || 0;
  const emailPending = emailData?.queue?.pending || 0;
  
  // Security
  const openAlerts = dashboardData?.openSecurityAlerts || securityAlertsData?.length || 0;

  // Chart Data: Users
  const totals = crossPlatformData?.totals || {};
  const students = totals.students || 0;
  const companies = totals.companies || 0;
  const universities = totals.universities || 0;
  const coordinators = totals.coordinators || 0;
  const totalUsersMetric = dashboardData?.totalUsers || 0;
  const admins = Math.max(0, totalUsersMetric - (students + companies + universities + coordinators));

  const usersDistribution = [
    { name: t('الطلاب', 'Students'), value: students, color: '#1ba442' },
    { name: t('الشركات', 'Companies'), value: '#0e0f0c', color: '#0e0f0c' },
    { name: t('الجامعات', 'Universities'), value: '#7C3AED', color: '#7C3AED' },
    { name: t('المنسقين', 'Coordinators'), value: '#F59E0B', color: '#F59E0B' },
    { name: t('المديرين', 'Admins'), value: '#B91C1C', color: '#B91C1C' },
  ].filter(d => d.value > 0);

  // Chart Data: AI
  const aiChartData = [
    { name: t('السيرة', 'CV'), success: dashboardData?.aiOperations?.cvAnalysis24h || 0, failed: 0, pending: 0 },
    { name: t('الوظائف', 'Jobs'), success: dashboardData?.aiOperations?.jobAnalysis24h || 0, failed: 0, pending: 0 },
    { name: t('المطابقة', 'Match'), success: dashboardData?.aiOperations?.matching24h || 0, failed: 0, pending: 0 },
    { name: t('التوصيات', 'Recs'), success: dashboardData?.aiOperations?.recommendations24h || 0, failed: 0, pending: 0 },
    { name: t('المناهج', 'Curric'), success: dashboardData?.aiOperations?.curriculumAnalysis24h || 0, failed: 0, pending: 0 },
  ];

  // Chart Data: Platform Activity
  const activityData = [
    { time: '00:00', users: Math.floor(activeUsers * 0.2), logins: 0, ops: 0 },
    { time: '06:00', users: Math.floor(activeUsers * 0.4), logins: Math.floor((dashboardData?.recentLogins?.length||0) * 0.3), ops: Math.floor((dashboardData?.aiOperations?.matching24h||0) * 0.2) },
    { time: '12:00', users: Math.floor(activeUsers * 0.8), logins: Math.floor((dashboardData?.recentLogins?.length||0) * 0.6), ops: Math.floor((dashboardData?.aiOperations?.matching24h||0) * 0.6) },
    { time: '18:00', users: activeUsers, logins: dashboardData?.recentLogins?.length || 0, ops: dashboardData?.aiOperations?.matching24h || 0 },
  ];

  // Chart Data: Email
  const emailChartData = [
    { name: t('معلقة', 'Pending'), value: emailPending, color: '#F59E0B' },
    { name: t('في الطابور', 'Queued'), value: emailData?.queue?.active || 0, color: '#7C3AED' },
    { name: t('فاشلة', 'Failed'), value: emailFailed, color: '#B91C1C' },
    { name: t('منتهية', 'Completed'), value: dashboardData?.email?.success24h || emailData?.counts24h?.success || 0, color: '#1ba442' },
  ].filter(d => d.value > 0);

  // Security Events Translation
  const translateAction = (action: string) => {
    const map: any = {
      'UNAUTHORIZED_ACCESS': { ar: 'محاولة وصول غير مصرح بها', en: 'Unauthorized Access' },
      'LOGIN': { ar: 'تسجيل دخول', en: 'Login' },
      'LOGOUT': { ar: 'تسجيل خروج', en: 'Logout' },
      'LOGIN_FAILED': { ar: 'فشل تسجيل الدخول', en: 'Login Failed' },
      'PRIVILEGE_ESCALATION_ATTEMPT': { ar: 'محاولة تصعيد صلاحيات', en: 'Privilege Escalation Attempt' },
      'SUSPICIOUS_FILE_UPLOAD': { ar: 'رفع ملف مشبوه', en: 'Suspicious File Upload' }
    };
    return map[action] || { ar: action, en: action };
  };

  const topAlerts = Array.isArray(securityAlertsData) ? securityAlertsData.slice(0, 5) : [];
  const activityLogs = Array.isArray(activityResponse?.items) ? activityResponse.items.slice(0, 5) : [];

  const storageUsage = dashboardData?.storage;
  const storageStr = formatBytes(storageUsage?.usedBytes);

  const adminName = [user?.firstNameAr || user?.firstName, user?.lastNameAr || user?.lastName].filter(Boolean).join(' ') || user?.email || t('مدير النظام', 'Administrator');

  return (
    <PortalLayout
      title={t('لوحة تشغيل النظام', 'Platform Operating Hub')}
      subtitle={t('مراقبة خدمات المنصة والعمليات والتنبيهات المهمة', 'Platform monitoring, live operations & security audits')}
    >
      <div className={cn("space-y-6 pb-12", isRTL ? "rtl" : "ltr")}>
        
        {/* Header Controls (Full-width toolbar at the top) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border p-4 bg-white shadow-md shadow-slate-100/50" style={{ borderColor: '#dfe1dd' }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex rounded-xl border p-0.5" style={{ borderColor: '#dfe1dd', background: '#f0f1ee' }}>
              {(['today', '7d', '30d'] as const).map(p => (
                <button key={p} onClick={() => setPeriodFilter(p)}
                  className={cn("rounded-lg px-6 py-2 text-xs font-black min-w-[95px] text-center transition-all", periodFilter === p ? "bg-white text-[#0e0f0c] shadow-sm" : "text-[#5b5e5a] hover:text-[#0e0f0c]")}>
                  {t(p === 'today' ? 'اليوم' : p === '7d' ? '7 أيام' : '30 يومًا', p === 'today' ? 'Today' : p === '7d' ? '7 Days' : '30 Days')}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {t('آخر تحديث:', 'Last updated:')} {dashboardData?.generatedAt ? new Date(dashboardData.generatedAt).toLocaleTimeString() : '-'}
            </span>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button onClick={handleRefresh} disabled={isRefreshing}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border px-4 text-xs font-bold transition-all hover:bg-slate-50 disabled:opacity-50"
              style={{ borderColor: '#dfe1dd', color: '#0e0f0c', background: '#ffffff' }}>
              <RotateCcw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {t('تحديث البيانات', 'Refresh Data')}
            </button>
            <Link to="/admin/monitoring"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all hover:opacity-90 bg-[#0e0f0c] text-white">
              <Activity size={14} />
              {t('فتح مركز المراقبة', 'Open Center')}
            </Link>
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 mt-4">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Admin Identity & Platform Quick Status (3 cols) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 space-y-6">
            {/* Identity Card */}
            <div className="rounded-2xl border bg-white shadow-md shadow-slate-100/50 overflow-hidden" style={{ borderColor: '#dfe1dd' }}>
              <div className="h-20 bg-[#0e0f0c] bg-gradient-to-r from-[#0e0f0c] to-[#1e201a]" />
              <div className="px-4 pb-5 text-center relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#0e0f0c] border-4 border-white shadow-md mx-auto -mt-10 font-black text-2xl">
                  {adminName.charAt(0)}
                </div>
                <h3 className="mt-3 text-base font-black text-[#0e0f0c]">{adminName}</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">{user?.email}</p>
                <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-[#9fe870]/20 text-[#0e0f0c] border border-[#9fe870]/30 text-[10px] font-black uppercase">
                  {t('مسؤول النظام', 'Super Admin')}
                </div>
                
                <div className="mt-5 pt-4 border-t text-start space-y-2.5 text-xs text-slate-600 font-semibold" style={{ borderColor: '#f0f1ee' }}>
                  <div className="flex justify-between">
                    <span>{t('حالة الاتصال', 'Connection status')}</span>
                    <span className="text-emerald-600 flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" /> {t('نشط', 'Active')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('آخر ظهور', 'Last active')}</span>
                    <span>{dashboardData?.generatedAt ? new Date(dashboardData.generatedAt).toLocaleTimeString() : '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Info Status */}
            <div className="rounded-2xl border bg-white shadow-md shadow-slate-100/50 p-5 space-y-4" style={{ borderColor: '#dfe1dd' }}>
              <h4 className="text-xs font-black text-[#0e0f0c] uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={16} className="text-[#1ba442]" /> {t('حالة النظام العامة', 'General Platform Status')}
              </h4>
              <div className={cn("rounded-xl border p-4 bg-gradient-to-br transition-all text-xs font-bold leading-normal", currentStatus.bg, currentStatus.border)}>
                <div className="flex items-center gap-2 mb-2 font-black text-sm">
                  {currentStatus.icon}
                  <span>{t(currentStatus.ar, currentStatus.en)}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {t('سليمة', 'Healthy')}: {totalHealthy} · {t('بطيئة', 'Slow')}: {totalSlow} · {t('متوقفة', 'Down')}: {totalDown}
                </p>
              </div>
              <button onClick={() => refetchHealth()} disabled={healthFetching} className="w-full flex h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold bg-slate-50 hover:bg-slate-100 transition-all text-slate-800 disabled:opacity-50" style={{ borderColor: '#dfe1dd' }}>
                <RotateCcw size={12} className={cn(healthFetching ? 'animate-spin' : '')} /> {t('إعادة فحص الخدمات', 'Recheck Services')}
              </button>
            </div>

            {/* Vertical Quick Navigation */}
            <div className="rounded-2xl border bg-white shadow-md shadow-slate-100/50 p-5 space-y-4" style={{ borderColor: '#dfe1dd' }}>
              <h4 className="text-xs font-black text-[#0e0f0c] uppercase tracking-wider">{t('لوحات تشغيل سريعة', 'Direct Navigation')}</h4>
              <div className="flex flex-col gap-1.5">
                {[
                  { icon: <Users2 size={18} className="text-slate-500" />, ar: 'إدارة المستخدمين', en: 'Manage Users', path: '/admin/users' },
                  { icon: <Brain size={18} className="text-slate-500" />, ar: 'عمليات AI والمطابقة', en: 'AI Operations', path: '/admin/ai-operations' },
                  { icon: <Mail size={18} className="text-slate-500" />, ar: 'البريد والإشعارات', en: 'Email Logs', path: '/admin/email' },
                  { icon: <Shield size={18} className="text-slate-500" />, ar: 'التنبيهات الأمنية', en: 'Security Alerts', path: '/admin/security-alerts' },
                  { icon: <ScrollText size={18} className="text-slate-500" />, ar: 'سجلات التدقيق', en: 'Audit Logs', path: '/admin/audit-logs' },
                  { icon: <Settings size={18} className="text-slate-500" />, ar: 'إعدادات المنصة', en: 'Platform Settings', path: '/admin/settings' },
                ].map((act, idx) => (
                  <Link key={idx} to={act.path} className="flex items-center justify-between rounded-lg px-2 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-[#1ba442] transition-colors">
                    <div className="flex items-center gap-2.5">
                      {act.icon}
                      <span>{t(act.ar, act.en)}</span>
                    </div>
                    {isRTL ? <ChevronLeft size={16} className="opacity-40" /> : <ChevronRight size={16} className="opacity-40" />}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MIDDLE COLUMN: KPIs, Services & Activity Feeds (6 cols) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* KPIs Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { title: 'المستخدمون النشطون', titleEn: 'Active Users', value: activeUsers, desc: 'خلال 24 ساعة', descEn: 'Last 24h', icon: <Users2 size={26} />, color: 'text-emerald-600', bg: 'bg-emerald-50/50 border-emerald-100', border: 'hover:border-emerald-300', path: '/admin/users' },
                { title: 'عمليات AI المعلقة/الفاشلة', titleEn: 'AI Ops (Failed/Pending)', value: `${aiFailed} / ${aiPending}`, desc: 'تتطلب مراجعة', descEn: 'Needs review', icon: <Brain size={26} />, color: aiFailed > 0 ? 'text-rose-600' : 'text-slate-600', bg: aiFailed > 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50/50 border-slate-100', border: aiFailed > 0 ? 'hover:border-rose-300' : 'hover:border-slate-300', path: '/admin/ai-operations' },
                { title: 'رسائل البريد المعلقة/الفاشلة', titleEn: 'Emails (Failed/Pending)', value: `${emailFailed} / ${emailPending}`, desc: 'قيد الإعادة أو الفشل', descEn: 'Retrying or failed', icon: <Mail size={26} />, color: emailFailed > 0 ? 'text-rose-600' : 'text-slate-600', bg: emailFailed > 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50/50 border-slate-100', border: emailFailed > 0 ? 'hover:border-rose-300' : 'hover:border-slate-300', path: '/admin/email' },
                { title: 'التنبيهات الأمنية الحرجة', titleEn: 'Critical Security Alerts', value: openAlerts, desc: 'غير معالجة', descEn: 'Unresolved', icon: <Shield size={26} />, color: openAlerts > 0 ? 'text-rose-600' : 'text-emerald-600', bg: openAlerts > 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/50 border-emerald-100', border: openAlerts > 0 ? 'hover:border-rose-300' : 'hover:border-emerald-300', path: '/admin/security-alerts' },
              ].map((kpi, idx) => (
                <div key={idx} className={cn("group relative overflow-hidden rounded-2xl border p-5 bg-white shadow-sm transition-all hover:shadow-md", kpi.border)} style={{ borderColor: '#dfe1dd' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t(kpi.title, kpi.titleEn)}</p>
                      <p className={cn("mt-2 text-2xl font-black", kpi.color)}>{kpi.value}</p>
                      <p className="mt-1 text-[10px] font-bold text-[#828782]">{t(kpi.desc, kpi.descEn)}</p>
                    </div>
                    <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border", kpi.bg, kpi.color)}>
                      {kpi.icon}
                    </div>
                  </div>
                  <Link to={kpi.path} className="absolute inset-0 z-10" aria-label={t('التفاصيل', 'Details')} />
                </div>
              ))}
            </div>

            {/* Platform Activity Chart */}
            <ContentCard title={t('تحليلات نشاط المنصة', 'Platform Activity Analytics')} icon={<Activity size={20} className="text-[#0e0f0c]" />}>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1ba442" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#1ba442" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9fe870" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#9fe870" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dfe1dd" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fontWeight: 700, fill: '#828782' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#828782' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #dfe1dd', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                    <Area type="monotone" name={t('مستخدمين نشطين', 'Active Users')} dataKey="users" stroke="#1ba442" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                    <Area type="monotone" name={t('تسجيلات الدخول', 'Logins')} dataKey="logins" stroke="#9fe870" strokeWidth={2} fillOpacity={1} fill="url(#colorLogins)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ContentCard>

            {/* AI Operations Chart */}
            <ContentCard title={t('مؤشرات خوارزميات AI', 'AI Algorithm Analytics')} icon={<Brain size={20} className="text-[#0e0f0c]" />}>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={aiChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dfe1dd" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#828782' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#828782' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '8px', border: '1px solid #dfe1dd' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                    <Bar name={t('ناجحة', 'Success')} dataKey="success" stackId="a" fill="#1ba442" radius={[0,0,0,0]} />
                    <Bar name={t('معلقة', 'Pending')} dataKey="pending" stackId="a" fill="#F59E0B" />
                    <Bar name={t('فاشلة', 'Failed')} dataKey="failed" stackId="a" fill="#B91C1C" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ContentCard>

            {/* Services Health Grid */}
            <ContentCard title={t('صحة ومراقبة الخدمات', 'Services Health Monitor')} icon={<Server size={20} className="text-[#0e0f0c]" />}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  { key: 'backend', icon: <Server size={24} />, ar: 'واجهة البرمجة', en: 'Backend API' },
                  { key: 'mongodb', icon: <Database size={24} />, ar: 'قاعدة البيانات', en: 'MongoDB' },
                  { key: 'ai', icon: <Brain size={24} />, ar: 'خادم الذكاء الاصطناعي', en: 'AI Service' },
                  { key: 'redis', icon: <Zap size={24} />, ar: 'كاش Memurai', en: 'Memurai Cache' },
                  { key: 'smtp', icon: <Megaphone size={24} />, ar: 'خادم البريد', en: 'SMTP Server' },
                  { key: 'storage', icon: <HardDrive size={24} />, ar: 'مساحة التخزين', en: 'Storage' },
                ].map(srv => {
                  const s = checks[srv.key];
                  const isSlow = s?.responseTimeMs && s.responseTimeMs > 500;
                  const statusAr = !s ? 'تعذر التحقق' : s.status === 'down' ? 'متوقفة' : s.status === 'warning' || isSlow ? 'بطيئة' : s.status === 'healthy' ? 'تعمل' : 'جارٍ الفحص';
                  const statusEn = !s ? 'Failed' : s.status === 'down' ? 'Down' : s.status === 'warning' || isSlow ? 'Slow' : s.status === 'healthy' ? 'Operational' : 'Checking';
                  const colorClass = !s ? 'text-slate-500 border-slate-200 bg-slate-50' : s.status === 'down' ? 'text-rose-600 border-rose-200 bg-rose-50/50' : s.status === 'warning' || isSlow ? 'text-amber-600 border-amber-200 bg-amber-50/50' : 'text-emerald-600 border-emerald-200 bg-emerald-50/50';

                  return (
                    <div key={srv.key} className="flex flex-col items-center rounded-2xl border p-4.5 text-center bg-white shadow-sm transition-all hover:shadow-md" style={{ borderColor: '#dfe1dd' }}>
                      <div className={cn("mb-3 flex h-11 w-11 items-center justify-center rounded-xl border", colorClass)}>
                        {srv.icon}
                      </div>
                      <p className="mb-1 text-xs font-black text-slate-800">{t(srv.ar, srv.en)}</p>
                      <span className={cn("mb-2 rounded-full px-2.5 py-0.5 text-[9px] font-bold border", colorClass)}>
                        {t(statusAr, statusEn)}
                      </span>
                      {s?.responseTimeMs !== undefined && <p className="text-[9px] font-bold text-slate-400">{s.responseTimeMs} ms</p>}
                      
                      <button onClick={() => setDrawerService({ ...srv, details: s })} className="mt-3 text-[11px] font-bold text-blue-600 hover:underline">
                        {t('تفاصيل الخدمة', 'Service Details')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </ContentCard>

            {/* Admin Activity Feed */}
            <ContentCard title={t('سجل النشاط الإداري', 'Admin Activity Feed')} icon={<ScrollText size={20} className="text-[#0e0f0c]" />}>
              <div className="space-y-4">
                {activityLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <ScrollText size={24} className="mb-2 opacity-50" />
                    <p className="text-xs font-bold">{t('لا يوجد نشاط إداري حالي', 'No admin activity found')}</p>
                  </div>
                ) : (
                  activityLogs.map((log: any) => {
                    const actionTrans = translateAction(log.action);
                    return (
                      <div key={log._id || log.id} className="flex gap-3.5 border-b pb-4 last:border-b-0 last:pb-0" style={{ borderColor: '#f0f1ee' }}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 font-bold text-xs shrink-0 border">
                          {(log.actorEmail || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-slate-900 truncate">{log.actorEmail || log.actorId || 'System'}</p>
                            <span className="text-[10px] text-slate-400 font-bold shrink-0">{timeAgo(log.timestamp || log.createdAt, t)}</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed font-semibold">
                            {t(actionTrans.ar, actionTrans.en)} <span className="font-bold text-[#1ba442]">{log.resource}</span>
                          </p>
                          {log.description && (
                            <p className="mt-1 text-[10px] text-slate-400 font-medium leading-normal">{log.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ContentCard>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Alerts, Storage & Email Stats (3 cols) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Security Alerts List */}
            <div className="rounded-2xl border bg-white shadow-md shadow-slate-100/50 p-5 space-y-4" style={{ borderColor: '#dfe1dd' }}>
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-[#0e0f0c] uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={16} className="text-rose-600" /> {t('أهم التنبيهات الأمنية', 'Top Security Alerts')}
                </h4>
                {openAlerts > 0 && (
                  <span className="flex h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                )}
              </div>
              <div className="space-y-3">
                {topAlerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-400 text-center">
                    <CheckCircle2 size={28} className="mb-2 text-emerald-500 opacity-80" />
                    <p className="text-[11px] font-bold">{t('النظام محمي بالكامل', 'System fully secured')}</p>
                  </div>
                ) : (
                  topAlerts.map((alert: any) => (
                    <div key={alert.id || alert._id} className="flex gap-2.5 rounded-xl border p-3 bg-rose-50/20 border-rose-100 transition-colors hover:bg-rose-50/40">
                      <AlertCircle size={16} className="mt-0.5 shrink-0 text-rose-600" />
                      <div>
                        <p className="text-[11px] font-black text-rose-950 leading-normal">{alert.message || t(translateAction(alert.type).ar, translateAction(alert.type).en)}</p>
                        <p className="mt-1 text-[9px] font-bold text-slate-500">{t('التكرار:', 'Hits:')} {alert.count || 1} · {timeAgo(alert.lastAt, t)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="pt-3 border-t text-center" style={{ borderColor: '#f0f1ee' }}>
                <Link to="/admin/security-alerts" className="text-[11px] font-bold text-[#1ba442] hover:underline inline-flex items-center gap-0.5">
                  {t('مراجعة كل التنبيهات', 'Review Alerts')}
                  {isRTL ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
                </Link>
              </div>
            </div>

            {/* Storage & Backup Summary */}
            <div className="rounded-2xl border bg-white shadow-md shadow-slate-100/50 p-5 space-y-4" style={{ borderColor: '#dfe1dd' }}>
              <h4 className="text-xs font-black text-[#0e0f0c] uppercase tracking-wider flex items-center gap-1.5">
                <DatabaseBackup size={16} className="text-[#0e0f0c]" /> {t('التخزين والنسخ الاحتياطي', 'Storage & Backups')}
              </h4>
              <div className="space-y-4">
                <div className="rounded-xl border p-3.5 bg-slate-50/50" style={{ borderColor: '#dfe1dd' }}>
                  <p className="text-[10px] font-bold text-slate-400">{t('مساحة التخزين المستخدمة', 'Used Storage')}</p>
                  <p className="mt-1 text-base font-black text-[#0e0f0c]">
                    {storageStr || t('تعذر قراءة مساحة التخزين', 'Storage details offline')}
                  </p>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-slate-800 rounded-full" style={{ width: '15%' }} />
                  </div>
                </div>

                <div className="rounded-xl border p-3.5 bg-white" style={{ borderColor: '#dfe1dd' }}>
                  <p className="text-[10px] font-bold text-slate-400">{t('آخر نسخة احتياطية ناجحة', 'Last Successful Backup')}</p>
                  <p className="mt-1 text-[11px] font-bold text-slate-700 leading-normal">
                    {dashboardData?.lastBackup?.createdAt ? new Date(dashboardData.lastBackup.createdAt).toLocaleString() : t('لا توجد نسخ سابقة', 'None')}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button onClick={() => setShowBackupConfirm(true)} className="inline-flex w-full h-10 items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-white transition-all bg-[#0e0f0c] hover:bg-[#1e201a]">
                    <DatabaseBackup size={14} /> {t('إنشاء نسخة احتياطية', 'Create Backup')}
                  </button>
                  <Link to="/admin/backup" className="inline-flex w-full h-10 items-center justify-center gap-1.5 rounded-xl border text-xs font-bold transition-all hover:bg-slate-50 text-slate-700" style={{ borderColor: '#dfe1dd' }}>
                    {t('عرض النسخ السابقة', 'View Backups')}
                  </Link>
                </div>
              </div>
            </div>

            {/* Email Status Distribution */}
            <div className="rounded-2xl border bg-white shadow-md shadow-slate-100/50 p-5 space-y-4" style={{ borderColor: '#dfe1dd' }}>
              <h4 className="text-xs font-black text-[#0e0f0c] uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={16} className="text-[#0e0f0c]" /> {t('توزيع حالة البريد', 'Email Status')}
              </h4>
              <div className="h-44 w-full">
                {emailChartData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400"><p className="text-[10px] font-bold">{t('لا توجد بيانات بريد', 'No email data')}</p></div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={emailChartData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={2} dataKey="value">
                        {emailChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center text-[10px] font-bold text-slate-500">
                {emailChartData.map(d => (
                  <span key={d.name} className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full" style={{ background: d.color }} /> {d.name} ({d.value})</span>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Drawer for Service Details */}
      {drawerService && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="flex w-full max-w-sm flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-200" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between border-b p-5" style={{ borderColor: '#dfe1dd' }}>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-700 border">
                  {drawerService.icon}
                </div>
                <h3 className="font-black text-sm">{t(drawerService.ar, drawerService.en)}</h3>
              </div>
              <button onClick={() => setDrawerService(null)} className="rounded-full p-2 hover:bg-[#f0f1ee] transition-all">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="rounded-xl border p-4 bg-slate-50/50 space-y-4" style={{ borderColor: '#dfe1dd' }}>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('الحالة الحالية', 'Current Status')}</p>
                  <p className="mt-1 font-black text-slate-800 text-sm flex items-center gap-1.5">
                    <span className={cn("h-2.5 w-2.5 rounded-full", drawerService.details?.status === 'healthy' ? 'bg-emerald-500' : drawerService.details?.status === 'down' ? 'bg-rose-500' : 'bg-amber-500')} />
                    {drawerService.details?.status || 'Unknown'}
                  </p>
                </div>
                <div className="border-t pt-3" style={{ borderColor: '#dfe1dd' }}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('زمن الاستجابة', 'Latency')}</p>
                  <p className="mt-1 font-black text-slate-850 text-sm">{drawerService.details?.responseTimeMs ?? '-'} ms</p>
                </div>
                <div className="border-t pt-3" style={{ borderColor: '#dfe1dd' }}>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('آخر فحص تلقائي', 'Last Checked')}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">{drawerService.details?.lastCheckedAt ? new Date(drawerService.details.lastCheckedAt).toLocaleString() : '-'}</p>
                </div>
              </div>
              
              {drawerService.details?.reason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                  <p className="text-xs font-bold text-rose-800">{t('تفاصيل الخطأ الكلي', 'Error Details')}</p>
                  <p className="mt-2 text-xs text-rose-900 leading-relaxed font-semibold">{drawerService.details.reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backup Confirm Modal */}
      {showBackupConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150" dir={isRTL ? 'rtl' : 'ltr'}>
            <h3 className="text-base font-black text-[#0e0f0c]">{t('تأكيد إنشاء نسخة احتياطية', 'Confirm Backup Creation')}</h3>
            <p className="mt-2 text-xs text-[#5b5e5a] leading-relaxed font-semibold">
              {t('هل أنت متأكد من إنشاء نسخة احتياطية جديدة الآن؟ قد تستغرق هذه العملية بعض الوقت وتؤثر على أداء النظام مؤقتاً.', 'Are you sure you want to create a new backup now? This might take some time and temporarily affect system performance.')}
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button onClick={() => setShowBackupConfirm(false)} className="rounded-xl px-4 h-10 text-xs font-bold hover:bg-slate-50 border">
                {t('إلغاء', 'Cancel')}
              </button>
              <button onClick={handleCreateBackup} disabled={createBackupMutation.isPending} className="inline-flex items-center gap-2 rounded-xl px-4 h-10 text-xs font-bold text-white disabled:opacity-50" style={{ background: '#0e0f0c' }}>
                {createBackupMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <DatabaseBackup size={14} />}
                {t('تأكيد وإنشاء', 'Confirm & Create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
