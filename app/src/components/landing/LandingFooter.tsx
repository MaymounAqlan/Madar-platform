import { ChatCenteredText, Headset } from '@phosphor-icons/react';
import {
  ArrowUp,
  ArrowUpRight,
  Globe2,
} from 'lucide-react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { FeatureIcon } from './LandingPrimitives';
import { landingIcons } from './landingIconMap';

interface LandingFooterProps {
  onNavigate: (sectionId: string) => void;
}

export function LandingFooter({ onNavigate }: LandingFooterProps) {
  const { t, toggleLanguage, isRTL } = useLanguage();
  const productLinks = [
    ['features', 'المميزات', 'Features'],
    ['how-it-works', 'كيف تعمل', 'How it works'],
    ['beneficiaries', 'المستفيدون', 'Beneficiaries'],
    ['faq', 'الأسئلة الشائعة', 'FAQ'],
  ];

  return (
    <footer className="landing-footer relative overflow-hidden border-t border-white/10 px-4 pb-8 pt-12 text-white sm:px-6 lg:px-8 lg:pt-16">
      <span className="footer-geometric-mark pointer-events-none absolute" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          className="footer-contact-panel landing-icon-card flex flex-col justify-between gap-6 border border-white/10 bg-[#171914] p-6 sm:p-8 lg:flex-row lg:items-center"
        >
          <div className="flex items-start gap-4">
            <FeatureIcon icon={Headset} tone="dark" />
            <div>
              <p className="text-xs font-bold text-[#9fe870]">{t('نحن هنا للمساعدة', 'We are here to help')}</p>
              <h2 className="mt-2 text-2xl font-bold">{t('ابحث في الدعم أو أرسل طلبًا موثقًا', 'Browse support or submit a tracked request')}</h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-7 text-[#aeb2ab]">
                {t('ابدأ بالإجابات الشائعة، وعند الحاجة تواصل مع الفريق من خلال نموذج مرتبط بالنظام.', 'Start with common answers, then reach the team through a form connected to the support system.')}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Link to="/support" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-sm font-bold text-white transition hover:border-[#9fe870] hover:bg-white/5">
              <Headset size={21} weight="regular" aria-hidden="true" />
              {t('مركز الدعم', 'Support center')}
            </Link>
            <Link to="/contact" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#9fe870] px-5 text-sm font-bold text-[#0e0f0c] transition hover:bg-[#86d957]">
              <ChatCenteredText size={21} weight="regular" aria-hidden="true" />
              {t('تواصل معنا', 'Contact us')}
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.8fr_0.9fr]">
          <div>
            <button type="button" onClick={() => onNavigate('top')} className="text-2xl font-bold text-[#9fe870] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]" aria-label={t('العودة إلى أعلى الصفحة', 'Back to top')}>
              {t('مدار', 'MADAR')}
            </button>
            <p className="mt-4 max-w-sm text-sm font-medium leading-7 text-[#92978f]">
              {t('منصة تربط التعليم والمهارات والفرص المهنية في رحلة واحدة قابلة للقياس.', 'A platform connecting education, skills, and career opportunities in one measurable journey.')}
            </p>
            <div className="mt-6 flex gap-3">
              {[
                [landingIcons.student, 'الطلاب', 'Students'],
                [landingIcons.company, 'الجامعات والشركات', 'Institutions'],
              ].map(([Icon, ar, en]) => {
                const AudienceIcon = Icon as typeof landingIcons.student;
                return (
                  <span key={String(en)} className="landing-icon-card inline-flex items-center gap-2 text-xs font-semibold text-[#b9bdb6]">
                    <span className="landing-icon-box flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-[#9fe870]">
                      <AudienceIcon size={23} weight="regular" aria-hidden="true" />
                    </span>
                    {t(String(ar), String(en))}
                  </span>
                );
              })}
            </div>
          </div>

          <nav aria-label={t('المنصة', 'Platform')}>
            <h3 className="text-sm font-bold text-white">{t('المنصة', 'Platform')}</h3>
            <div className="mt-4 grid gap-1">
              {productLinks.map(([id, ar, en]) => (
                <button key={id} type="button" onClick={() => onNavigate(id)} className="group inline-flex min-h-10 items-center justify-between gap-2 text-start text-sm font-semibold text-[#92978f] transition hover:text-white">
                  {t(ar, en)}
                  <ArrowUpRight size={15} className="opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                </button>
              ))}
            </div>
          </nav>

          <nav aria-label={t('المعلومات', 'Information')}>
            <h3 className="text-sm font-bold text-white">{t('المعلومات', 'Information')}</h3>
            <div className="mt-4 grid gap-1">
              {[
                ['/about', 'عن مدار', 'About MADAR'],
                ['/support', 'مركز الدعم', 'Support center'],
                ['/contact', 'التواصل', 'Contact'],
              ].map(([to, ar, en]) => (
                <Link key={to} to={to} className="group inline-flex min-h-10 items-center justify-between gap-2 text-sm font-semibold text-[#92978f] transition hover:text-white">
                  {t(ar, en)}
                  <ArrowUpRight size={15} className="opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </nav>

          <div>
            <h3 className="text-sm font-bold text-white">{t('ابدأ الآن', 'Get started')}</h3>
            <div className="mt-4 grid gap-3">
              <Link to="/register" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#9fe870] px-5 text-sm font-bold text-[#0e0f0c] transition hover:bg-[#86d957]">{t('إنشاء حساب', 'Create account')}</Link>
              <Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition hover:border-[#9fe870]">{t('تسجيل الدخول', 'Sign in')}</Link>
              <button type="button" onClick={toggleLanguage} className="inline-flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-[#b9bdb6] hover:text-white">
                <Globe2 size={18} aria-hidden="true" />
                {isRTL ? 'English' : 'العربية'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-xs font-medium text-[#828782] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {t('مدار', 'MADAR')}. {t('جميع الحقوق محفوظة.', 'All rights reserved.')}</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/about" className="hover:text-white">{t('عن المنصة', 'About')}</Link>
            <Link to="/contact" className="hover:text-white">{t('التواصل', 'Contact')}</Link>
            <button type="button" onClick={() => onNavigate('top')} className="inline-flex min-h-10 items-center gap-2 hover:text-white">
              <ArrowUp size={16} aria-hidden="true" />
              {t('أعلى الصفحة', 'Back to top')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
