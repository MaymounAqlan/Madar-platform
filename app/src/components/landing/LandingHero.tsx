import { FileMagnifyingGlass, LinkSimple } from '@phosphor-icons/react';
import { ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { FloatingCard, LaptopMockup, PhoneMockup } from './DeviceMockups';

interface LandingHeroProps {
  onHowItWorks: () => void;
}

export function LandingHero({ onHowItWorks }: LandingHeroProps) {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="landing-hero relative isolate overflow-hidden px-4 pb-10 pt-12 sm:px-6 sm:pb-12 sm:pt-16 lg:px-8 lg:pb-16 lg:pt-20">
      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="landing-hero-copy mx-auto max-w-4xl text-center"
        >
          <p className="landing-hero-eyebrow text-sm font-semibold">
            {t('من التعليم إلى فرصة مهنية مناسبة', 'From education to the right career opportunity')}
          </p>
          <h1 className="landing-hero-title mt-4 text-4xl font-black leading-[1.08] sm:text-6xl lg:text-7xl">
            {t(
              'مدار يربط مهاراتك بما يحتاجه سوق العمل',
              'MADAR connects your skills to what the job market needs',
            )}
          </h1>
          <p className="landing-hero-description mx-auto mt-5 max-w-2xl text-sm font-medium leading-7 sm:text-lg sm:leading-8">
            {t(
              'منصة تجمع الطالب والجامعة والشركة في مسار واحد، من تحليل السيرة الذاتية وقياس الجاهزية إلى مطابقة الفرص ومتابعة الطلبات.',
              'One platform for students, universities, and companies, from resume analysis and readiness measurement to opportunity matching and application tracking.',
            )}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="landing-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442] focus-visible:ring-offset-2"
            >
              {t('إنشاء حساب', 'Create account')}
              <Arrow size={17} />
            </Link>
            <button
              type="button"
              onClick={onHowItWorks}
              className="landing-button-secondary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]"
            >
              {t('كيف تعمل المنصة', 'How it works')}
              <ArrowDown size={17} />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="landing-hero-stage relative mx-auto mt-10 w-[88%] max-w-[620px] sm:mt-12 sm:w-full lg:mt-14"
        >
          <LaptopMockup
            src="/landing/student-jobs.png"
            alt={t('واجهة فرص الطالب ونسب المطابقة في مدار', 'MADAR student opportunities and match scores')}
            className="landing-device-drift"
          />
          <PhoneMockup
            src="/landing/student-jobs-mobile.png"
            alt={t('واجهة فرص الطالب على الهاتف', 'Student opportunities on mobile')}
            className={cn(
              'absolute -bottom-5 w-[25%] min-w-[92px] max-w-[220px] sm:-bottom-8',
              isRTL ? '-left-1 sm:-left-6 lg:-left-12' : '-right-1 sm:-right-6 lg:-right-12',
            )}
          />
          <FloatingCard
            icon={<FileMagnifyingGlass size={24} weight="regular" />}
            title={t('تحليل السيرة الذاتية', 'Resume analysis')}
            description={t('استخراج منظم للمهارات والخبرات', 'Structured skills and experience extraction')}
            className={cn('absolute top-[18%]', isRTL ? '-right-8 lg:-right-24' : '-left-8 lg:-left-24')}
          />
          <FloatingCard
            icon={<LinkSimple size={24} weight="regular" />}
            title={t('مطابقة قابلة للتفسير', 'Explainable matching')}
            description={t('أسباب واضحة ونقاط تطوير عملية', 'Clear reasons and practical next steps')}
            className={cn('absolute bottom-[8%]', isRTL ? '-right-4 lg:-right-20' : '-left-4 lg:-left-20')}
          />
        </motion.div>
      </div>
    </section>
  );
}
