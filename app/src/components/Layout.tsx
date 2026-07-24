import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { Globe2, Menu, Moon, Sun, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { LandingFooter } from '@/components/landing/LandingFooter';
import '@/components/landing/landing.css';

const landingRoutes = new Set(['/', '/features', '/how-it-works', '/careers']);
type PublicTheme = 'light' | 'dark';

function getInitialTheme(): PublicTheme {
  const savedTheme = window.localStorage.getItem('madar-public-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function Layout() {
  const { t, isRTL, toggleLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isLanding = landingRoutes.has(location.pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<PublicTheme>(getInitialTheme);
  const isDark = theme === 'dark';

  useEffect(() => {
    window.localStorage.setItem('madar-public-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));

  const navItems = [
    { to: '/', ar: 'الرئيسية', en: 'Home' },
    { to: '/about', ar: 'عن مدار', en: 'About' },
    { sectionId: 'features', ar: 'المميزات', en: 'Features' },
    { sectionId: 'how-it-works', ar: 'كيف تعمل', en: 'How it works' },
    { sectionId: 'beneficiaries', ar: 'المستفيدون', en: 'Beneficiaries' },
    { to: '/support', ar: 'الدعم', en: 'Support' },
  ];

  const navigateFromMenu = (item: (typeof navItems)[number]) => {
    setMobileMenuOpen(false);
    if (item.to) {
      navigate(item.to);
      return;
    }
    if (item.sectionId) navigateToSection(item.sectionId);
  };

  const navigateToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const scroll = () => {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (isLanding) {
      scroll();
      return;
    }

    navigate('/');
    window.requestAnimationFrame(() => window.requestAnimationFrame(scroll));
  };

  return (
    <div
      className={cn('landing-shell flex min-h-[100dvh] flex-col', isRTL ? 'rtl' : 'ltr')}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-landing-theme={theme}
    >
      <header className="landing-nav sticky top-0 z-50 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigateToSection('top')}
            className="landing-nav-brand shrink-0 text-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]"
            aria-label={t('الانتقال إلى الرئيسية', 'Go to home')}
          >
            {t('مدار', 'MADAR')}
          </button>

          <nav className="hidden min-w-0 items-center gap-0.5 lg:flex" aria-label={t('التنقل الرئيسي', 'Main navigation')}>
            {navItems.map((item) => (
              <button
                key={item.to || item.sectionId}
                type="button"
                onClick={() => navigateFromMenu(item)}
                className="landing-nav-link min-h-10 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]"
              >
                {t(item.ar, item.en)}
              </button>
            ))}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className="landing-nav-icon inline-flex h-10 w-10 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]"
              aria-label={isDark ? t('تفعيل الوضع النهاري', 'Use light mode') : t('تفعيل الوضع الليلي', 'Use dark mode')}
              aria-pressed={isDark}
              title={isDark ? t('الوضع النهاري', 'Light mode') : t('الوضع الليلي', 'Dark mode')}
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              type="button"
              onClick={toggleLanguage}
              className="landing-nav-link inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]"
              aria-label={t('تغيير اللغة إلى الإنجليزية', 'Change language to Arabic')}
            >
              <Globe2 size={15} />
              {isRTL ? 'EN' : 'AR'}
            </button>
            <Link
              to="/login"
              className="landing-button-secondary inline-flex min-h-10 items-center rounded-full px-4 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]"
            >
              {t('تسجيل الدخول', 'Sign in')}
            </Link>
            <Link
              to="/register"
              className="landing-button-primary inline-flex min-h-10 items-center rounded-full px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]"
            >
              {t('إنشاء حساب', 'Create account')}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="landing-nav-icon inline-flex h-11 w-11 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442] md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? t('إغلاق القائمة', 'Close menu') : t('فتح القائمة', 'Open menu')}
          >
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="landing-mobile-menu pb-5 pt-3 md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col" aria-label={t('قائمة الهاتف', 'Mobile navigation')}>
              {navItems.map((item) => (
                <button
                  key={item.to || item.sectionId}
                  type="button"
                  onClick={() => navigateFromMenu(item)}
                  className="landing-nav-link min-h-11 rounded-xl px-3 text-start text-sm font-semibold"
                >
                  {t(item.ar, item.en)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  toggleLanguage();
                  setMobileMenuOpen(false);
                }}
                className="landing-nav-link mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold"
              >
                <Globe2 size={16} />
                {isRTL ? 'English' : 'العربية'}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="landing-nav-link mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold"
                aria-pressed={isDark}
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
                {isDark ? t('الوضع النهاري', 'Light mode') : t('الوضع الليلي', 'Dark mode')}
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="landing-button-secondary inline-flex min-h-11 items-center justify-center rounded-full text-sm font-semibold"
                >
                  {t('تسجيل الدخول', 'Sign in')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="landing-button-primary inline-flex min-h-11 items-center justify-center rounded-full text-sm font-bold"
                >
                  {t('إنشاء حساب', 'Create account')}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="min-w-0 flex-1">
        <Outlet />
      </main>

      <LandingFooter onNavigate={navigateToSection} />
    </div>
  );
}
