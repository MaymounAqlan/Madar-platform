import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  Compass,
  GraduationCap,
  Network,
  ShieldCheck,
  Target,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { PublicPageHero } from '@/components/landing/PublicPageHero';
import { useLanguage } from '@/contexts/LanguageContext';

const reveal = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export default function About() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const values: Array<[LucideIcon, string, string, string, string]> = [
    [ShieldCheck, 'الوضوح والثقة', 'Clarity and trust', 'نتائج قابلة للفهم ومعلومات يمكن للمستخدم مراجعتها.', 'Understandable results and information users can review.'],
    [Target, 'القرار المبني على البيانات', 'Data-informed decisions', 'ربط المهارات والجاهزية ومتطلبات الفرص في سياق واحد.', 'Connecting skills, readiness, and opportunity requirements in one context.'],
    [UsersRound, 'قيمة لكل طرف', 'Value for every stakeholder', 'تجربة متخصصة مع بقاء البيانات والعلاقات مترابطة.', 'A focused experience while data and relationships remain connected.'],
    [BookOpenCheck, 'التطوير المستمر', 'Continuous development', 'تحويل الفجوات إلى خطوات تعلم وتحسين عملية.', 'Turning gaps into practical learning and improvement steps.'],
  ];
  const ecosystem: Array<[LucideIcon, string, string, string, string]> = [
    [GraduationCap, 'الطالب والخريج', 'Student and graduate', 'ملف مهني وتحليل ومطابقة ومتابعة للطلبات.', 'Career profile, analysis, matching, and application tracking.'],
    [Building2, 'الجامعة', 'University', 'مؤشرات للجاهزية والهيكل الأكاديمي والانتقال إلى التوظيف.', 'Insights for readiness, academic structure, and transition to employment.'],
    [BarChart3, 'الشركة', 'Company', 'فرص ومرشحون وقرارات توظيف مدعومة بعوامل مطابقة واضحة.', 'Opportunities, candidates, and hiring decisions supported by clear matching factors.'],
  ];

  return (
    <div className="overflow-x-clip bg-[#f7f8f5]">
      <PublicPageHero
        icon={Compass}
        eyebrowAr="عن منصة مدار"
        eyebrowEn="About MADAR"
        titleAr="نجعل المسافة بين التعليم والعمل أكثر وضوحًا"
        titleEn="Making the path from education to work clearer"
        descriptionAr="مدار منصة تربط الملف الأكاديمي والمهني بمتطلبات سوق العمل، وتحوّل البيانات المتفرقة إلى مؤشرات وتوصيات تساعد الطالب والجامعة والشركة على اتخاذ قرار أفضل."
        descriptionEn="MADAR connects academic and professional profiles with labor-market requirements, turning fragmented data into insights and recommendations for students, universities, and companies."
      />

      <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div {...reveal}>
            <p className="text-xs font-bold text-[#1ba442]">{t('رسالتنا', 'Our mission')}</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-[#0e0f0c] sm:text-4xl">
              {t('بيانات مفهومة تقود إلى خطوات قابلة للتنفيذ', 'Understandable data that leads to practical action')}
            </h2>
            <p className="mt-5 text-sm font-medium leading-8 text-[#5b5e5a] sm:text-base">
              {t(
                'لا تتوقف مدار عند عرض نسبة أو توصية عامة. تجمع المنصة بيانات الملف والسيرة والفرص، ثم توضح نقاط القوة والفجوات والخطوات التالية ضمن تجربة يمكن مراجعتها.',
                'MADAR goes beyond a score or generic recommendation. It connects profile, resume, and opportunity data, then explains strengths, gaps, and next steps in a reviewable experience.',
              )}
            </p>
          </motion.div>
          <div className="grid gap-4 sm:grid-cols-2">
            {values.map(([Icon, arTitle, enTitle, arDescription, enDescription], index) => (
              <motion.article
                key={enTitle}
                {...reveal}
                transition={{ ...reveal.transition, delay: index * 0.06 }}
                className="landing-cut-card landing-icon-card min-h-64 border border-[#dfe1dd] bg-white p-6"
              >
                <span className="landing-icon-box flex h-16 w-16 items-center justify-center rounded-lg bg-[#e7fdd8] text-[#1ba442]">
                  <Icon size={34} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <h3 className="mt-7 text-lg font-bold text-[#0e0f0c]">{t(arTitle, enTitle)}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-[#5b5e5a]">{t(arDescription, enDescription)}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold text-[#1ba442]">{t('منظومة مترابطة', 'A connected ecosystem')}</p>
            <h2 className="mt-3 text-3xl font-bold text-[#0e0f0c] sm:text-4xl">{t('واجهة متخصصة، وبيانات تعمل معًا', 'Focused experiences, connected data')}</h2>
          </motion.div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {ecosystem.map(([Icon, arTitle, enTitle, arDescription, enDescription], index) => (
              <motion.article
                key={enTitle}
                {...reveal}
                transition={{ ...reveal.transition, delay: index * 0.08 }}
                className="landing-icon-card border-t-2 border-[#9fe870] bg-[#f7f8f5] p-7"
              >
                <span className="landing-icon-box flex h-16 w-16 items-center justify-center rounded-lg bg-white text-[#1ba442]">
                  <Icon size={35} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <h3 className="mt-8 text-xl font-bold text-[#0e0f0c]">{t(arTitle, enTitle)}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-[#5b5e5a]">{t(arDescription, enDescription)}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0e0f0c] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-7 text-center lg:flex-row lg:text-start">
          <div>
            <div className="flex items-center justify-center gap-3 lg:justify-start">
              <Network size={30} className="text-[#9fe870]" aria-hidden="true" />
              <CheckCircle2 size={30} className="text-[#9fe870]" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-3xl font-bold">{t('تعرّف على المنصة من خلال تجربة فعلية', 'Explore MADAR through a real experience')}</h2>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link to="/contact" className="inline-flex min-h-12 items-center justify-center border border-white/20 px-6 text-sm font-bold text-white hover:border-[#9fe870]">
              {t('تواصل معنا', 'Contact us')}
            </Link>
            <Link to="/register" className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#9fe870] px-6 text-sm font-bold text-[#0e0f0c] hover:bg-[#86d957]">
              {t('إنشاء حساب', 'Create account')}
              <Arrow size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
