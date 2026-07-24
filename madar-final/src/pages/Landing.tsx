import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Sparkles, Briefcase, GraduationCap, Building2, TrendingUp,
  Users, BookOpen, Zap, ArrowRight, ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

const features = [
  {
    icon: <Sparkles size={24} />,
    titleAr: 'مطابقة ذكية',
    titleEn: 'AI Matching',
    descAr: 'مطابقة دقيقة بين مهاراتك ومتطلبات الوظائف باستخدام الذكاء الاصطناعي',
    descEn: 'Precise matching between your skills and job requirements using AI',
    color: '#9fe870',
    bg: '#F4FCF0',
  },
  {
    icon: <TrendingUp size={24} />,
    titleAr: 'تحليل السوق',
    titleEn: 'Market Analysis',
    descAr: 'رؤى عميقة حول اتجاهات سوق العمل والمهارات المطلوبة',
    descEn: 'Deep insights into job market trends and in-demand skills',
    color: '#3b82f6',
    bg: '#DBEAFE',
  },
  {
    icon: <BookOpen size={24} />,
    titleAr: 'تعلم مهارات',
    titleEn: 'Skill Learning',
    descAr: 'موارد تعليمية موصى بها لسد فجوات مهاراتك',
    descEn: 'Recommended learning resources to fill your skill gaps',
    color: '#a855f7',
    bg: '#F3E8FF',
  },
  {
    icon: <Users size={24} />,
    titleAr: 'ربط مباشر',
    titleEn: 'Direct Connection',
    descAr: 'تواصل مباشر بين الطلاب والشركات والجامعات',
    descEn: 'Direct connection between students, companies and universities',
    color: '#f59e0b',
    bg: '#FEF3C7',
  },
];

const stats = [
  { value: '10K+', labelAr: 'طالب مسجل', labelEn: 'Registered Students' },
  { value: '500+', labelAr: 'شركة شريكة', labelEn: 'Partner Companies' },
  { value: '50+', labelAr: 'جامعة', labelEn: 'Universities' },
  { value: '95%', labelAr: 'معدل الرضا', labelEn: 'Satisfaction Rate' },
];

const howItWorks = [
  {
    step: '01',
    titleAr: 'أنشئ ملفك',
    titleEn: 'Create Profile',
    descAr: 'سجّل دخولك وأكمل ملفك الشخصي بمهاراتك وخبراتك',
    descEn: 'Sign up and complete your profile with your skills and experience',
    icon: <Users size={20} />,
  },
  {
    step: '02',
    titleAr: 'احصل على التحليل',
    titleEn: 'Get Analysis',
    descAr: 'تحليل ذكي لمهاراتك ومقارنتها بمتطلبات السوق',
    descEn: 'AI analysis of your skills compared to market demands',
    icon: <Zap size={20} />,
  },
  {
    step: '03',
    titleAr: 'تقدم للوظائف',
    titleEn: 'Apply to Jobs',
    descAr: 'تقدم للوظائف الموصى بها مع نسبة تطابق عالية',
    descEn: 'Apply to recommended jobs with high match scores',
    icon: <Briefcase size={20} />,
  },
];

export default function Landing() {
  const { t, isRTL } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={cn(isRTL ? "rtl" : "ltr")}>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32" style={{ background: '#0e0f0c' }}>
        {/* Decorative glows */}
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #9fe870 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-20 left-0 h-72 w-72 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }} />

        <div className="relative mx-auto max-w-7xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold" style={{ background: 'rgba(159,232,112,0.1)', color: '#9fe870', border: '1px solid rgba(159,232,112,0.2)' }}>
              <Sparkles size={14} />
              {t('مدعوم بالذكاء الاصطناعي', 'AI-Powered')}
            </span>

            <h1
              className="mx-auto max-w-4xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif" }}
            >
              {t(
                'وجهتك الذكية نحو مستقبلك المهني',
                'Your AI-Powered Career Compass'
              )}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base font-semibold sm:text-lg" style={{ color: '#828782' }}>
              {t(
                'منصة مدر تربط الطلاب بالشركات والجامعات من خلال تحليل ذكي للمهارات وتوصيات مخصصة للوظائف والتدريب.',
                'MADAR connects students with companies and universities through intelligent skill analysis and personalized job recommendations.'
              )}
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-[#0e0f0c] transition-all hover:scale-[1.02] hover:shadow-lg"
                style={{ background: '#9fe870' }}
              >
                {t('ابدأ رحلتك', 'Start Your Journey')}
                <ArrowRight size={16} className={cn(isRTL && "rotate-180")} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-[#2a2b28] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/5"
              >
                {t('تسجيل الدخول', 'Sign In')}
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
        >
          <ChevronDown size={24} style={{ color: '#828782' }} />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="border-b border-[#dfe1dd] px-4 py-12 sm:px-6 lg:px-8" style={{ background: '#e8ebe6' }}>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.labelEn}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4, ease }}
              className="text-center"
            >
              <p
                className="text-3xl font-black sm:text-4xl"
                style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif", color: '#0e0f0c' }}
              >
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-semibold" style={{ color: '#5b5e5a' }}>
                {isRTL ? stat.labelAr : stat.labelEn}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-4 py-20 sm:px-6 lg:px-8" style={{ background: '#e8ebe6' }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2
              className="text-2xl font-black sm:text-3xl"
              style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif", color: '#0e0f0c' }}
            >
              {t('لماذا تختار مدر؟', 'Why Choose MADAR?')}
            </h2>
            <p className="mt-3 text-base font-semibold" style={{ color: '#5b5e5a' }}>
              {t('منصة شاملة تدعم رحلتك المهنية من كل الجوانب', 'A comprehensive platform supporting your career journey from all angles')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.titleEn}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4, ease }}
                className="rounded-3xl border border-[#dfe1dd] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: feature.bg, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h3 className="mt-4 text-base font-bold text-[#0e0f0c]">
                  {isRTL ? feature.titleAr : feature.titleEn}
                </h3>
                <p className="mt-2 text-sm font-semibold" style={{ color: '#5b5e5a' }}>
                  {isRTL ? feature.descAr : feature.descEn}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8" style={{ background: '#ffffff' }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2
              className="text-2xl font-black sm:text-3xl"
              style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif", color: '#0e0f0c' }}
            >
              {t('كيف تعمل مدر؟', 'How Does MADAR Work?')}
            </h2>
            <p className="mt-3 text-base font-semibold" style={{ color: '#5b5e5a' }}>
              {t('ثلاث خطوات بسيطة لبدء رحلتك المهنية', 'Three simple steps to start your career journey')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4, ease }}
                className="relative text-center"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: '#9fe870' }}>
                  {step.icon}
                </div>
                <span
                  className="mt-3 block text-3xl font-black"
                  style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif", color: '#dfe1dd' }}
                >
                  {step.step}
                </span>
                <h3 className="mt-2 text-base font-bold text-[#0e0f0c]">
                  {isRTL ? step.titleAr : step.titleEn}
                </h3>
                <p className="mt-2 text-sm font-semibold" style={{ color: '#5b5e5a' }}>
                  {isRTL ? step.descAr : step.descEn}
                </p>
                {index < howItWorks.length - 1 && (
                  <div className="hidden sm:block absolute top-8" style={{ [isRTL ? 'left' : 'right']: '-20px', width: '40px', borderTop: '2px dashed #dfe1dd' }} />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section id="careers" className="px-4 py-20 sm:px-6 lg:px-8" style={{ background: '#e8ebe6' }}>
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2
              className="text-2xl font-black sm:text-3xl"
              style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif", color: '#0e0f0c' }}
            >
              {t('مصمم لكل الأطراف', 'Designed for Everyone')}
            </h2>
            <p className="mt-3 text-base font-semibold" style={{ color: '#5b5e5a' }}>
              {t('حلول متخصصة للطلاب والشركات والجامعات', 'Specialized solutions for students, companies, and universities')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: <GraduationCap size={28} />,
                titleAr: 'طلاب', titleEn: 'Students',
                descAr: 'اكتشف فرصك،حلل مهاراتك،وتقدم للوظائف المناسبة',
                descEn: 'Discover opportunities, analyze your skills, and apply to fitting jobs',
                link: '/student/dashboard',
                color: '#1D4ED8',
                bg: '#DBEAFE',
              },
              {
                icon: <Building2 size={28} />,
                titleAr: 'شركات', titleEn: 'Companies',
                descAr: 'اعثر على أفضل المواهب باستخدام المطابقة الذكية',
                descEn: 'Find the best talent using intelligent matching',
                link: '/company/dashboard',
                color: '#1ba442',
                bg: '#E7FDD8',
              },
              {
                icon: <BookOpen size={28} />,
                titleAr: 'جامعات', titleEn: 'Universities',
                descAr: 'راقب أداء طلابك وتواصل مع الشركات',
                descEn: 'Monitor student performance and connect with companies',
                link: '/university/dashboard',
                color: '#B45309',
                bg: '#FEF3C7',
              },
            ].map((card, index) => (
              <motion.div
                key={card.titleEn}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4, ease }}
              >
                <Link
                  to={card.link}
                  className="flex flex-col items-center rounded-3xl border border-[#dfe1dd] bg-white p-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{ background: card.bg, color: card.color }}
                  >
                    {card.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#0e0f0c]">{isRTL ? card.titleAr : card.titleEn}</h3>
                  <p className="mt-2 text-sm font-semibold" style={{ color: '#5b5e5a' }}>
                    {isRTL ? card.descAr : card.descEn}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#9fe870' }}>
                    {t('استكشف', 'Explore')}
                    <ArrowRight size={14} className={cn(isRTL && "rotate-180")} />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8" style={{ background: '#0e0f0c' }}>
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
          >
            <h2
              className="text-2xl font-black text-white sm:text-3xl"
              style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif" }}
            >
              {t('ابدأ رحلتك المهنية اليوم', 'Start Your Career Journey Today')}
            </h2>
            <p className="mt-4 text-base font-semibold" style={{ color: '#828782' }}>
              {t(
                'انضم إلى آلاف الطلاب والشركات والجامعات على منصة مدر',
                'Join thousands of students, companies, and universities on MADAR'
              )}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-[#0e0f0c] transition-all hover:scale-[1.02]"
                style={{ background: '#9fe870' }}
              >
                {t('سجل مجاناً', 'Register for Free')}
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full border border-[#2a2b28] px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/5"
              >
                {t('تسجيل الدخول', 'Sign In')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
