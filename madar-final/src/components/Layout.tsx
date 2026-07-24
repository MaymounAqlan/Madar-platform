import { Outlet, useLocation } from 'react-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Link } from 'react-router';
import { useState } from 'react';
import { Menu, X, Globe } from 'lucide-react';

export default function Layout() {
  const { t, isRTL, toggleLanguage } = useLanguage();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { labelAr: 'الرئيسية', labelEn: 'Home', href: '/' },
    { labelAr: 'المميزات', labelEn: 'Features', href: '/#features' },
    { labelAr: 'كيف تعمل', labelEn: 'How It Works', href: '/#how-it-works' },
    { labelAr: 'التوظيف', labelEn: 'Careers', href: '/#careers' },
  ];

  return (
    <div className={cn("min-h-[100dvh] flex flex-col", isRTL ? "rtl" : "ltr")} style={{ background: '#e8ebe6' }}>
      {/* Navbar */}
      <header
        className={cn(
          "sticky top-0 z-50 border-b px-4 sm:px-6 lg:px-8",
          isHome ? "bg-[#0e0f0c]/80 backdrop-blur-md border-[#2a2b28]" : "bg-white/80 backdrop-blur-md border-[#dfe1dd]"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span
              className="text-xl font-black tracking-tight"
              style={{
                fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif",
                color: isHome ? '#9fe870' : '#0e0f0c',
              }}
            >
              {t('مدر', 'MADAR')}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  isHome ? "text-[#828782] hover:text-white" : "text-[#5b5e5a] hover:text-[#0e0f0c]"
                )}
              >
                {isRTL ? item.labelAr : item.labelEn}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="hidden items-center gap-3 md:flex">
            <button
              onClick={toggleLanguage}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                isHome ? "text-[#828782] hover:bg-white/10 hover:text-white" : "text-[#5b5e5a] hover:bg-[#f0f1ee]"
              )}
            >
              <Globe size={14} />
              {isRTL ? 'EN' : 'AR'}
            </button>
            <Link
              to="/login"
              className={cn(
                "rounded-full px-5 py-2 text-sm font-semibold transition-all hover:scale-[1.02]",
                isHome
                  ? "bg-[#9fe870] text-[#0e0f0c] hover:bg-[#80D34F]"
                  : "border border-[#dfe1dd] bg-white text-[#0e0f0c] hover:bg-[#f0f1ee]"
              )}
            >
              {t('تسجيل الدخول', 'Sign In')}
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-[#9fe870] px-5 py-2 text-sm font-semibold text-[#0e0f0c] transition-all hover:scale-[1.02] hover:bg-[#80D34F]"
            >
              {t('سجل الآن', 'Get Started')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              "rounded-full p-2 md:hidden",
              isHome ? "text-white" : "text-[#0e0f0c]"
            )}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-[#dfe1dd] bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#5b5e5a] hover:bg-[#f0f1ee] hover:text-[#0e0f0c]"
                >
                  {isRTL ? item.labelAr : item.labelEn}
                </a>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-[#f0f1ee] pt-3">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full border border-[#dfe1dd] bg-white px-4 py-2.5 text-center text-sm font-semibold text-[#0e0f0c]"
                >
                  {t('تسجيل الدخول', 'Sign In')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-full bg-[#9fe870] px-4 py-2.5 text-center text-sm font-semibold text-[#0e0f0c]"
                >
                  {t('سجل الآن', 'Get Started')}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2a2b28] px-4 py-12 sm:px-6 lg:px-8" style={{ background: '#0e0f0c' }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="text-xl font-black tracking-tight" style={{ color: '#9fe870', fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif" }}>
                {t('مدر', 'MADAR')}
              </span>
              <p className="mt-3 text-sm font-semibold" style={{ color: '#828782' }}>
                {t(
                  'منصتك الذكية للتوظيف والتوجيه المهني',
                  'Your AI-powered career guidance platform'
                )}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: '#ffffff' }}>{t('المنصة', 'Platform')}</h4>
              <ul className="mt-3 space-y-2">
                {[
                  { ar: 'عن مدر', en: 'About MADAR' },
                  { ar: 'المميزات', en: 'Features' },
                  { ar: 'التسعير', en: 'Pricing' },
                ].map((item) => (
                  <li key={item.en}>
                    <span className="text-sm font-semibold" style={{ color: '#828782' }}>{isRTL ? item.ar : item.en}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: '#ffffff' }}>{t('الدعم', 'Support')}</h4>
              <ul className="mt-3 space-y-2">
                {[
                  { ar: 'مركز المساعدة', en: 'Help Center' },
                  { ar: 'اتصل بنا', en: 'Contact Us' },
                  { ar: 'الأسئلة الشائعة', en: 'FAQ' },
                ].map((item) => (
                  <li key={item.en}>
                    <span className="text-sm font-semibold" style={{ color: '#828782' }}>{isRTL ? item.ar : item.en}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold" style={{ color: '#ffffff' }}>{t('قانوني', 'Legal')}</h4>
              <ul className="mt-3 space-y-2">
                {[
                  { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
                  { ar: 'شروط الاستخدام', en: 'Terms of Service' },
                ].map((item) => (
                  <li key={item.en}>
                    <span className="text-sm font-semibold" style={{ color: '#828782' }}>{isRTL ? item.ar : item.en}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-[#2a2b28] pt-6 text-center">
            <p className="text-xs font-semibold" style={{ color: '#828782' }}>
              © 2026 {t('مدر', 'MADAR')}. {t('جميع الحقوق محفوظة.', 'All rights reserved.')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
