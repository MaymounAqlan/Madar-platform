import { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  Shield,
  Menu,
  X,
  Bell,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortalLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const navItems = [
  { path: '/admin/dashboard', labelAr: 'لوحة التحكم', labelEn: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/users', labelAr: 'المستخدمين', labelEn: 'Users', icon: Users },
  { path: '/admin/analytics', labelAr: 'التحليلات', labelEn: 'Analytics', icon: BarChart3 },
  { path: '/admin/settings', labelAr: 'الإعدادات', labelEn: 'Settings', icon: Settings },
];

export default function PortalLayout({ children, title, subtitle }: PortalLayoutProps) {
  const { language, isRTL, t, toggleLanguage } = useLanguage();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5">
        <span className="text-xl font-black tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0e0f0c' }}>
          {t('مدر', 'MADAR')}
        </span>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
          {t('إداري', 'Admin')}
        </span>
      </div>

      {/* Language Toggle */}
      <div className="mx-5 mb-4">
        <button
          onClick={toggleLanguage}
          className="flex w-full items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition-colors"
          style={{ background: '#f0f1ee', color: '#5b5e5a' }}
        >
          <span className={cn("px-2 py-0.5 rounded-full text-xs", language === 'ar' ? "bg-white font-bold shadow-sm" : "opacity-60")}>AR</span>
          <span>/</span>
          <span className={cn("px-2 py-0.5 rounded-full text-xs", language === 'en' ? "bg-white font-bold shadow-sm" : "opacity-60")}>EN</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "font-bold text-[#0e0f0c]"
                  : "text-[#5b5e5a] hover:bg-[#f0f1ee] hover:text-[#0e0f0c]"
              )}
              style={isActive ? { background: '#e8ebe6', borderLeft: isRTL ? 'none' : '3px solid #9fe870', borderRight: isRTL ? '3px solid #9fe870' : 'none' } : {}}
            >
              <Icon size={20} />
              <span>{t(item.labelAr, item.labelEn)}</span>
              {isActive && <div className="ml-auto mr-auto h-1.5 w-1.5 rounded-full" style={{ background: '#9fe870' }} />}
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="mx-3 mb-4 mt-auto rounded-2xl p-4" style={{ background: '#f0f1ee' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: '#FEE2E2' }}>
            <Shield size={18} style={{ color: '#B91C1C' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: '#0e0f0c' }}>{t('مدير المنصة', 'Platform Admin')}</p>
            <p className="text-xs truncate" style={{ color: '#828782' }}>{t('صلاحيات كاملة', 'Full Access')}</p>
          </div>
        </div>
        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold transition-colors hover:bg-[#dfe1dd]" style={{ color: '#5b5e5a' }}>
          <LogOut size={14} />
          {t('تسجيل الخروج', 'Logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className={cn("min-h-[100dvh]", isRTL ? "rtl" : "ltr")} style={{ background: '#e8ebe6' }}>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-[280px] border-r lg:block" style={{ background: '#ffffff', borderColor: '#dfe1dd', zIndex: 50 }}>
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[280px]" style={{ background: '#ffffff' }}>
            <button onClick={() => setSidebarOpen(false)} className="absolute right-3 top-3 rounded-full p-2 hover:bg-gray-100">
              <X size={20} />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:ml-[280px]">
        {/* Top Bar */}
        <header
          className="sticky top-0 z-40 flex h-16 items-center justify-between border-b px-6"
          style={{ background: '#e8ebe6', borderColor: '#dfe1dd' }}
        >
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-full p-2 hover:bg-[#dfe1dd] lg:hidden">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-base font-black" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0e0f0c' }}>
                {title || t('لوحة التحكم', 'Dashboard')}
              </h1>
              {subtitle && (
                <p className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-full p-2 hover:bg-[#dfe1dd] transition-colors">
              <Bell size={20} style={{ color: '#5b5e5a' }} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full" style={{ background: '#dc2626' }} />
            </button>
            <div className="hidden h-8 w-8 items-center justify-center rounded-full sm:flex" style={{ background: '#FEE2E2' }}>
              <Shield size={16} style={{ color: '#B91C1C' }} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
