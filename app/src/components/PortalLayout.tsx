import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { BarChart3, Bell, BookOpen, Briefcase, Brain, DatabaseBackup, FileText, GraduationCap, LayoutDashboard, Library, LogOut, Mail, Menu, ScrollText, Search, Settings, Shield, Sliders, Sparkles, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLabel } from '@/constants/roleLabels';
import NotificationBell from './NotificationBell';

interface PortalLayoutProps { children: React.ReactNode; title?: string; subtitle?: string; }
interface NavItem { path: string; labelAr: string; labelEn: string; icon: React.ComponentType<{ size?: number }>; }
interface Portal { labelAr: string; labelEn: string; badgeBg: string; badgeText: string; nav: NavItem[]; }

const portals: Record<string, Portal> = {
  admin: { labelAr: 'إداري', labelEn: 'Admin', badgeBg: '#FEE2E2', badgeText: '#B91C1C', nav: [
    { path: '/admin/dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', labelAr: 'المستخدمون', labelEn: 'Users', icon: Users },
    { path: '/admin/accounts', labelAr: 'الحسابات الإدارية', labelEn: 'Admin Accounts', icon: Sliders },
    { path: '/admin/roles', labelAr: 'الأدوار والصلاحيات', labelEn: 'Roles & Permissions', icon: Shield },
    { path: '/admin/monitoring', labelAr: 'صحة الخدمات', labelEn: 'Service Health', icon: BarChart3 },
    { path: '/admin/ai-operations', labelAr: 'عمليات الذكاء الاصطناعي', labelEn: 'AI Operations', icon: Brain },
    { path: '/admin/email', labelAr: 'البريد والإشعارات', labelEn: 'Email & Notifications', icon: Mail },
    { path: '/admin/backup', labelAr: 'نسخ احتياطي', labelEn: 'Backup & Restore', icon: DatabaseBackup },
    { path: '/admin/audit-logs', labelAr: 'سجلات التدقيق', labelEn: 'Audit Logs', icon: ScrollText },
    { path: '/admin/security-alerts', labelAr: 'التنبيهات الأمنية', labelEn: 'Security Alerts', icon: Shield },
    { path: '/admin/settings', labelAr: 'إعدادات المنصة', labelEn: 'Platform Settings', icon: Settings },
    { path: '/admin/universities', labelAr: 'الجامعات', labelEn: 'Universities', icon: GraduationCap },
    { path: '/admin/profile', labelAr: 'الملف الشخصي', labelEn: 'My Profile', icon: User },
  ] },
  student: { labelAr: 'طالب', labelEn: 'Student', badgeBg: '#E7FDD8', badgeText: '#1ba442', nav: [
    { path: '/student/dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard }, { path: '/student/recommendations', labelAr: 'التوصيات', labelEn: 'Recommendations', icon: Sparkles }, { path: '/student/jobs', labelAr: 'الوظائف', labelEn: 'Jobs', icon: Search }, { path: '/student/profile', labelAr: 'الملف الشخصي', labelEn: 'Profile', icon: Users }, { path: '/student/applications', labelAr: 'الطلبات', labelEn: 'Applications', icon: FileText }, { path: '/student/insights', labelAr: 'الرؤى والتحليلات', labelEn: 'Insights', icon: Sparkles }, { path: '/student/notifications', labelAr: 'الإشعارات', labelEn: 'Notifications', icon: Bell },
  ] },
  company: { labelAr: 'شركة', labelEn: 'Company', badgeBg: '#DBEAFE', badgeText: '#1D4ED8', nav: [
    { path: '/company/dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard }, { path: '/company/profile', labelAr: 'ملف الشركة', labelEn: 'Profile', icon: Settings }, { path: '/company/jobs', labelAr: 'الوظائف', labelEn: 'Jobs', icon: Briefcase }, { path: '/company/candidates', labelAr: 'المرشحون', labelEn: 'Candidates', icon: Users }, { path: '/company/analytics', labelAr: 'التحليلات', labelEn: 'Analytics', icon: BarChart3 }, { path: '/company/notifications', labelAr: 'الإشعارات', labelEn: 'Notifications', icon: Bell },
  ] },
  university: { labelAr: 'جامعة', labelEn: 'University', badgeBg: '#FEF3C7', badgeText: '#B45309', nav: [
    { path: '/university/staff', labelAr: 'الموظفون', labelEn: 'Staff', icon: Users }, { path: '/university/dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard }, { path: '/university/structure', labelAr: 'الهيكل الأكاديمي', labelEn: 'Structure', icon: BookOpen }, { path: '/university/students', labelAr: 'الطلاب', labelEn: 'Students', icon: GraduationCap }, { path: '/university/benchmarking', labelAr: 'المقارنة المرجعية', labelEn: 'Benchmarking', icon: BarChart3 }, { path: '/university/curriculum', labelAr: 'المناهج', labelEn: 'Curriculum', icon: Library }, { path: '/university/reports', labelAr: 'التقارير', labelEn: 'Reports', icon: FileText }, { path: '/university/notifications', labelAr: 'الإشعارات', labelEn: 'Notifications', icon: Bell }, { path: '/university/profile', labelAr: 'ملف الجامعة', labelEn: 'Profile', icon: Settings },
  ] },
};

function detectPortal(pathname: string) { if (pathname.startsWith('/student')) return portals.student; if (pathname.startsWith('/company')) return portals.company; if (pathname.startsWith('/university')) return portals.university; return portals.admin; }

const resolveAssetUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

export default function PortalLayout({ children, title, subtitle }: PortalLayoutProps) {
  const { language, isRTL, toggleLanguage, tr } = useLanguage();
  const { user, logout, isLoggingOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const portal = detectPortal(location.pathname);
  const isArabic = language === 'ar';
  const notificationPath = location.pathname.startsWith('/student') ? '/student/notifications' : location.pathname.startsWith('/company') ? '/company/notifications' : location.pathname.startsWith('/university') ? '/university/notifications' : null;
  const isUniversityManager = user?.role === 'university';
  const isInstitutionalStaff = ['coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer'].includes(user?.role || '');
  const visibleNav = portal.nav
    .filter((item) => {
      if (item.path === '/university/profile') return isUniversityManager || isInstitutionalStaff;
      if (['/university/staff', '/university/benchmarking'].includes(item.path)) return isUniversityManager;
      return true;
    })
    .map((item) => {
      if (item.path === '/university/profile' && isInstitutionalStaff) {
        return { ...item, labelAr: 'الملف الشخصي', labelEn: 'My Profile' };
      }
      return item;
    });

  const sidebarContent = <div className="flex h-full min-h-0 flex-col overflow-hidden">
    <div className="flex items-center justify-between px-6 py-5"><span className="text-xl font-black tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0e0f0c' }}>{tr('appName')}</span><span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: portal.badgeBg, color: portal.badgeText }}>{isArabic ? portal.labelAr : portal.labelEn}</span></div>
    <div className="mx-5 mb-4"><button onClick={toggleLanguage} className="flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}><span className={cn('text-xs', isArabic ? 'font-bold text-[#0e0f0c]' : 'text-[#828782]')}>AR</span><span className="text-[#dfe1dd]">/</span><span className={cn('text-xs', !isArabic ? 'font-bold text-[#0e0f0c]' : 'text-[#828782]')}>EN</span></button></div>
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 scrollbar-thin">{visibleNav.map((item) => { const active = location.pathname === item.path; return <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={cn('flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200', active ? 'font-bold' : 'hover:bg-[#f0f1ee]')} style={{ background: active ? portal.badgeBg : 'transparent', color: active ? '#0e0f0c' : '#5b5e5a', borderRight: active && isRTL ? `3px solid ${portal.badgeText}` : 'none', borderLeft: active && !isRTL ? `3px solid ${portal.badgeText}` : 'none' }}><item.icon size={20} /><span>{isArabic ? item.labelAr : item.labelEn}</span></NavLink>; })}</nav>
    <div className="mx-4 mb-4 rounded-2xl border bg-white p-4 shrink-0" style={{ borderColor: '#dfe1dd' }}><div className="flex items-center gap-3"><div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-full" style={{ background: portal.badgeBg }}>{user?.avatar ? <img src={resolveAssetUrl(user.avatar)} alt="Profile" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <Users size={18} style={{ color: portal.badgeText }} />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#0e0f0c]">{[user?.firstNameAr || user?.firstName, user?.lastNameAr || user?.lastName].filter(Boolean).join(' ') || user?.email || (isArabic ? 'مستخدم' : 'User')}</p><p className="truncate text-xs font-medium" style={{ color: portal.badgeText }}>{getRoleLabel(user?.role, language as 'ar' | 'en')}</p></div></div><button onClick={() => logout()} disabled={isLoggingOut} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border py-2 text-xs font-semibold transition-colors hover:bg-[#f0f1ee] disabled:opacity-50" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}><LogOut size={14} />{tr('logout')}</button></div>
  </div>;

  return <div className="flex h-screen h-[100dvh] overflow-hidden" style={{ background: '#e8ebe6' }} dir={isRTL ? 'rtl' : 'ltr'}>
    {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <aside className={cn('fixed inset-y-0 z-50 h-screen h-[100dvh] w-[280px] flex-shrink-0 overflow-hidden bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:block', isRTL ? 'border-l' : 'border-r', sidebarOpen ? 'translate-x-0' : isRTL ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')} style={{ borderColor: '#dfe1dd' }}>{sidebarContent}</aside>
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"><header className="z-30 flex h-16 shrink-0 items-center justify-between border-b px-6" style={{ background: '#e8ebe6', borderColor: '#dfe1dd' }}><div className="flex items-center gap-4"><button onClick={() => setSidebarOpen(true)} className="rounded-xl p-2 transition-colors hover:bg-[#f0f1ee] lg:hidden"><Menu size={20} /></button><div><h1 className="text-lg font-bold text-[#0e0f0c]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{title || tr('dashboardTitle')}</h1>{subtitle && <p className="text-xs text-[#5b5e5a]">{subtitle}</p>}</div></div><div className="flex items-center gap-3"><NotificationBell notificationPath={notificationPath} /><div className="flex h-9 w-9 overflow-hidden items-center justify-center rounded-full" style={{ background: portal.badgeBg }}>{user?.avatar ? <img src={resolveAssetUrl(user.avatar)} alt="Profile" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <Users size={18} style={{ color: portal.badgeText }} />}</div></div></header><main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 lg:p-8">{children}</main></div>
  </div>;
}
