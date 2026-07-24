import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface PublicPageHeroProps {
  icon: LucideIcon;
  eyebrowAr: string;
  eyebrowEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
}

export function PublicPageHero({
  icon: Icon,
  eyebrowAr,
  eyebrowEn,
  titleAr,
  titleEn,
  descriptionAr,
  descriptionEn,
}: PublicPageHeroProps) {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="public-page-hero relative isolate overflow-hidden bg-[#0e0f0c] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <span className="public-page-cut public-page-cut-start pointer-events-none absolute" aria-hidden="true" />
      <span className="public-page-cut public-page-cut-end pointer-events-none absolute" aria-hidden="true" />
      <div className="relative mx-auto max-w-7xl">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#b9bdb6] transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
        >
          <Home size={18} aria-hidden="true" />
          {t('الرئيسية', 'Home')}
          <Arrow size={16} aria-hidden="true" />
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start"
        >
          <span className="landing-icon-box flex h-20 w-20 items-center justify-center rounded-lg bg-[#9fe870] text-[#0e0f0c]">
            <Icon size={42} strokeWidth={1.6} aria-hidden="true" />
          </span>
          <div className="max-w-4xl">
            <p className="text-sm font-bold text-[#9fe870]">{t(eyebrowAr, eyebrowEn)}</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {t(titleAr, titleEn)}
            </h1>
            <p className="mt-5 max-w-3xl text-sm font-medium leading-8 text-[#c8cbc5] sm:text-base">
              {t(descriptionAr, descriptionEn)}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
