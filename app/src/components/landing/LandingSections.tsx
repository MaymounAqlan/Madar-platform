import type { Icon } from '@phosphor-icons/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { LaptopMockup, TabletMockup } from './DeviceMockups';
import {
  BentoCard,
  ConnectedNode,
  FeatureIcon,
  MetricVisual,
  ProcessStep,
  SectionHeader,
} from './LandingPrimitives';
import { landingIcons } from './landingIconMap';
import { landingReveal } from './landingMotion';

export function ProblemSolution() {
  const { t } = useLanguage();

  return (
    <section
      id="about"
      className="landing-section-divider landing-divider-angle bg-[#f7f8f5] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          number="02"
          eyebrow={t('الفجوة التي نعالجها', 'The gap we address')}
          title={t(
            'المهارات موجودة، لكن الوصول إلى الفرصة المناسبة ليس واضحًا دائمًا',
            'Skills exist, but the path to the right opportunity is not always clear',
          )}
          description={t(
            'تتوزع البيانات بين الملف الأكاديمي والسيرة الذاتية ومتطلبات الوظائف. مدار يوحّدها في رحلة قابلة للقياس تساعد كل طرف على اتخاذ قرار أفضل.',
            'Academic records, resumes, and job requirements often live apart. MADAR brings them into one measurable journey so every stakeholder can make better decisions.',
          )}
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_96px_1fr] lg:items-stretch">
          <BentoCard tone="soft" cut="start" className="min-h-[310px] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <FeatureIcon icon={landingIcons.gap} tone="neutral" />
              <span className="text-xs font-bold text-[#777b76]">
                {t('وضع متفرق', 'Disconnected state')}
              </span>
            </div>
            <h3 className="mt-6 text-xl font-bold text-[#0e0f0c]">{t('قبل مدار', 'Before MADAR')}</h3>
            <p className="mt-3 text-sm font-medium leading-7 text-[#5b5e5a]">
              {t(
                'صعوبة في تفسير فجوات المهارات، فرص متناثرة، وقرارات تعتمد على معلومات غير مترابطة.',
                'Hard-to-explain skill gaps, scattered opportunities, and decisions based on disconnected information.',
              )}
            </p>
            <div className="mt-7 space-y-3" aria-hidden="true">
              {[68, 44, 82].map((width, index) => (
                <div key={width} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full border border-[#a7aba5] bg-white" />
                  <span className="h-px flex-1 bg-[#c9ccc7]" style={{ maxWidth: `${width}%` }} />
                  <span className="text-[10px] font-bold text-[#8b8f89]">0{index + 1}</span>
                </div>
              ))}
            </div>
          </BentoCard>

          <motion.div
            {...landingReveal}
            className="landing-merge-bridge flex min-h-20 items-center justify-center"
            aria-hidden="true"
          >
            <FeatureIcon icon={landingIcons.merge} tone="green" />
          </motion.div>

          <BentoCard tone="white" cut="end" className="min-h-[310px] border-[#9fe870] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <FeatureIcon icon={landingIcons.success} tone="green" />
              <span className="text-xs font-bold text-[#187d35]">
                {t('مسار موحّد', 'Unified flow')}
              </span>
            </div>
            <h3 className="mt-6 text-xl font-bold text-[#0e0f0c]">{t('مع مدار', 'With MADAR')}</h3>
            <p className="mt-3 text-sm font-medium leading-7 text-[#5b5e5a]">
              {t(
                'ملف مهني موحّد، تحليل واضح، توصيات قابلة للتنفيذ، ومؤشرات تدعم الطالب والجامعة والشركة.',
                'A unified professional profile, clear analysis, actionable recommendations, and insights for students, universities, and companies.',
              )}
            </p>
            <div className="landing-unified-rail mt-7 flex items-center" aria-hidden="true">
              {[landingIcons.careerProfile, landingIcons.ai, landingIcons.match, landingIcons.opportunity].map(
                (RailIcon, index) => (
                  <div key={index} className="flex min-w-0 flex-1 items-center">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#b9e6a3] bg-[#eef9e9] text-[#187d35]">
                      <RailIcon size={24} weight="regular" />
                    </span>
                    {index < 3 ? <span className="h-0.5 min-w-3 flex-1 bg-[#1ba442]" /> : null}
                  </div>
                ),
              )}
            </div>
          </BentoCard>
        </div>

        <motion.div {...landingReveal} className="landing-ecosystem-map relative mx-auto mt-10 max-w-5xl">
          <div className="landing-ecosystem-main grid gap-3 sm:grid-cols-4">
            <ConnectedNode icon={landingIcons.student} label={t('الطالب', 'Student')} />
            <ConnectedNode icon={landingIcons.careerProfile} label={t('الملف المهني', 'Career profile')} active />
            <ConnectedNode icon={landingIcons.match} label={t('المطابقة', 'Matching')} active />
            <ConnectedNode icon={landingIcons.opportunity} label={t('الفرصة', 'Opportunity')} />
          </div>
          <div className="landing-ecosystem-support mx-auto mt-3 grid max-w-2xl gap-3 sm:grid-cols-2">
            <ConnectedNode icon={landingIcons.university} label={t('الجامعة', 'University')} />
            <ConnectedNode icon={landingIcons.company} label={t('الشركة', 'Company')} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const { t } = useLanguage();
  const phases: Array<{
    icon: Icon;
    ar: string;
    en: string;
    tone: 'white' | 'soft' | 'green';
    className: string;
    steps: Array<{ icon: Icon; ar: string; en: string; number: string }>;
  }> = [
    {
      icon: landingIcons.careerProfile,
      ar: 'بناء الملف',
      en: 'Build the profile',
      tone: 'white',
      className: 'lg:col-span-5',
      steps: [
        { icon: landingIcons.account, ar: 'إنشاء الحساب', en: 'Create account', number: '01' },
        { icon: landingIcons.careerProfile, ar: 'استكمال الملف', en: 'Complete profile', number: '02' },
        { icon: landingIcons.upload, ar: 'رفع السيرة الذاتية', en: 'Upload resume', number: '03' },
      ],
    },
    {
      icon: landingIcons.ai,
      ar: 'التحليل',
      en: 'Analysis',
      tone: 'soft',
      className: 'lg:col-span-3',
      steps: [
        { icon: landingIcons.extract, ar: 'استخراج المهارات', en: 'Extract skills', number: '04' },
        { icon: landingIcons.readiness, ar: 'قياس الجاهزية', en: 'Measure readiness', number: '05' },
      ],
    },
    {
      icon: landingIcons.opportunity,
      ar: 'الوصول للفرصة',
      en: 'Reach the opportunity',
      tone: 'green',
      className: 'lg:col-span-4',
      steps: [
        { icon: landingIcons.match, ar: 'مطابقة الفرص', en: 'Match opportunities', number: '06' },
        { icon: landingIcons.applications, ar: 'التقديم والمتابعة', en: 'Apply and track', number: '07' },
      ],
    },
  ];

  return (
    <section
      id="how-it-works"
      className="landing-section-divider landing-divider-rail bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          number="03"
          eyebrow={t('رحلة واحدة مترابطة', 'One connected journey')}
          title={t('كيف تعمل منصة مدار؟', 'How does MADAR work?')}
          description={t(
            'خطوات واضحة تبدأ ببياناتك الفعلية وتنتهي بفرص مرتبة وتوصيات يمكن تنفيذها.',
            'A clear flow that starts with your real data and ends with ranked opportunities and actionable guidance.',
          )}
        />
        <div className="landing-process-rail relative mt-14 grid gap-4 lg:grid-cols-12">
          {phases.map((phase, phaseIndex) => (
            <BentoCard
              key={phase.en}
              tone={phase.tone}
              cut={phaseIndex === 1 ? 'both' : phaseIndex === 0 ? 'start' : 'end'}
              className={cn('min-h-[360px] p-5 sm:p-6', phase.className)}
            >
              <div className="flex items-start justify-between gap-4">
                <FeatureIcon icon={phase.icon} tone={phase.tone === 'green' ? 'white' : 'green'} />
                <span className="text-xs font-bold text-[#187d35]">
                  {t(`المرحلة ${phaseIndex + 1}`, `Phase ${phaseIndex + 1}`)}
                </span>
              </div>
              <h3 className="mt-6 text-xl font-bold text-[#0e0f0c]">{t(phase.ar, phase.en)}</h3>
              <div className="mt-5 space-y-3">
                {phase.steps.map((step) => (
                  <ProcessStep
                    key={step.en}
                    icon={step.icon}
                    number={step.number}
                    title={t(step.ar, step.en)}
                    compact
                  />
                ))}
              </div>
            </BentoCard>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DashboardShowcase() {
  const { t, isRTL } = useLanguage();

  return (
    <section
      id="showcase"
      className="landing-section-divider landing-divider-dark overflow-hidden bg-[#0e0f0c] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          number="04"
          inverse
          eyebrow={t('واجهات النظام', 'Product experience')}
          title={t('المعلومة المهمة في مكانها الصحيح', 'The right information, in the right place')}
          description={t(
            'واجهات مصممة للعمل اليومي: فرص مرتبة، حالات طلبات واضحة، ومرشحون يمكن مقارنتهم بناءً على البيانات.',
            'Interfaces built for daily work: ranked opportunities, clear application states, and data-backed candidate comparison.',
          )}
        />
        <div className="relative mt-14 min-h-[360px] sm:min-h-[520px] lg:min-h-[650px]">
          <LaptopMockup
            src="/landing/student-applications.png"
            alt={t('واجهة متابعة طلبات الطالب', 'Student application tracking interface')}
            className="mx-auto max-w-5xl"
          />
          <TabletMockup
            src="/landing/company-candidates.png"
            alt={t('واجهة إدارة المرشحين للشركة', 'Company candidate management interface')}
            className={cn(
              'absolute -bottom-8 w-[58%] max-w-[620px] sm:-bottom-12',
              isRTL ? '-left-10 sm:-left-4' : '-right-10 sm:-right-4',
            )}
          />
        </div>
      </div>
    </section>
  );
}

export function ResumeAnalysis() {
  const { t } = useLanguage();
  const extracted: Array<{ icon: Icon; ar: string; en: string; stateAr: string; stateEn: string }> = [
    { icon: landingIcons.skills, ar: 'المهارات', en: 'Skills', stateAr: 'تم الاستخراج', stateEn: 'Extracted' },
    { icon: landingIcons.experience, ar: 'الخبرات', en: 'Experience', stateAr: 'تم الاستخراج', stateEn: 'Extracted' },
    { icon: landingIcons.education, ar: 'التعليم', en: 'Education', stateAr: 'للمراجعة', stateEn: 'Review' },
    { icon: landingIcons.projects, ar: 'المشاريع', en: 'Projects', stateAr: 'تم الاستخراج', stateEn: 'Extracted' },
    { icon: landingIcons.certificates, ar: 'الشهادات', en: 'Certificates', stateAr: 'للمراجعة', stateEn: 'Review' },
    { icon: landingIcons.languages, ar: 'اللغات', en: 'Languages', stateAr: 'تم الاستخراج', stateEn: 'Extracted' },
  ];
  const pipeline = [
    ['رفع الملف', 'Upload'],
    ['قراءة المحتوى', 'Read'],
    ['تصنيف المعلومات', 'Classify'],
    ['مراجعة المستخدم', 'Review'],
    ['اعتماد الملف', 'Confirm'],
  ];

  return (
    <section
      id="resume-analysis"
      className="landing-section-divider landing-divider-dots bg-[#f7f8f5] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          number="05"
          eyebrow={t('تحليل السيرة الذاتية', 'Resume analysis')}
          title={t('حوّل سيرتك إلى ملف مهني منظم', 'Turn your resume into a structured professional profile')}
          description={t(
            'تستخرج مدار عناصر السيرة وتعرضها للمراجعة، ثم تستخدم البيانات المعتمدة في قياس المهارات والمطابقة.',
            'MADAR extracts resume sections for review, then uses confirmed data in skill measurement and matching.',
          )}
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <BentoCard tone="dark" cut="start" className="min-h-[470px] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <FeatureIcon icon={landingIcons.resume} size="hero" tone="dark" />
              <FeatureIcon icon={landingIcons.security} tone="dark" />
            </div>
            <h3 className="mt-7 text-xl font-bold text-white">{t('مسار تحليل قابل للمراجعة', 'A reviewable analysis flow')}</h3>
            <p className="mt-3 text-sm font-medium leading-7 text-[#b9bdb6]">
              {t(
                'لا تُعتمد المعلومات المستخرجة قبل أن يراجعها المستخدم، وتبقى كل مرحلة واضحة داخل الملف.',
                'Extracted information is not confirmed before user review, and every stage stays visible in the profile.',
              )}
            </p>
            <ol className="landing-analysis-pipeline relative mt-8 space-y-3">
              {pipeline.map(([ar, en], index) => (
                <li key={en} className="relative flex min-h-12 items-center gap-3 border border-white/10 bg-white/[0.04] px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#9fe870]/50 text-xs font-bold text-[#9fe870]">
                    {index + 1}
                  </span>
                  <span className="text-sm font-semibold text-white">{t(ar, en)}</span>
                </li>
              ))}
            </ol>
            <span className="landing-scan-line absolute inset-x-6 top-32 h-px bg-[#9fe870]" aria-hidden="true" />
          </BentoCard>

          <div className="grid gap-3 sm:grid-cols-2">
            {extracted.map((item, index) => (
              <BentoCard
                key={item.en}
                tone={index === 0 ? 'green' : 'white'}
                cut={index % 2 ? 'end' : 'start'}
                className="min-h-[220px] p-5"
                transition={{ ...landingReveal.transition, delay: index * 0.05 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <FeatureIcon icon={item.icon} tone={index === 0 ? 'white' : 'green'} />
                  <span className={cn('flex items-center gap-2 text-[11px] font-bold', index === 0 ? 'text-[#165f2b]' : 'text-[#5b5e5a]')}>
                    <span className={cn('h-2 w-2 rounded-full', item.stateEn === 'Review' ? 'bg-[#a07716]' : 'bg-[#1ba442]')} />
                    {t(item.stateAr, item.stateEn)}
                  </span>
                </div>
                <h3 className="mt-8 text-lg font-bold text-[#0e0f0c]">{t(item.ar, item.en)}</h3>
                <div className="mt-4 space-y-2" aria-hidden="true">
                  <span className="block h-1.5 w-full bg-[#dfe1dd]" />
                  <span className="block h-1.5 w-2/3 bg-[#dfe1dd]" />
                </div>
              </BentoCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MatchScale() {
  return (
    <div className="landing-match-scale relative flex h-44 w-44 items-center justify-center" aria-hidden="true">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="50" fill="none" stroke="#dfe1dd" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="#1ba442"
          strokeWidth="8"
          strokeDasharray="210 314"
          strokeLinecap="butt"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" dir="ltr">
        <span className="text-3xl font-bold text-[#0e0f0c]">0–100</span>
        <span className="mt-1 text-[11px] font-bold text-[#5b5e5a]">SCORE</span>
      </div>
    </div>
  );
}

export function SmartMatching() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section
      id="matching"
      className="landing-section-divider landing-divider-corner bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          number="06"
          eyebrow={t('المطابقة وفجوات المهارات', 'Matching and skill gaps')}
          title={t('لا تكتفِ بنسبة المطابقة، افهم سببها', 'Go beyond the score and understand why')}
          description={t(
            'ترتيب الفرص حسب الملاءمة، توضيح المهارات المتوافقة والناقصة، وربط الفجوات بخطوات تطوير عملية.',
            'Rank opportunities by relevance, explain matched and missing skills, and connect gaps to practical development steps.',
          )}
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <BentoCard tone="soft" cut="start" className="p-4 sm:p-6 lg:col-span-7 lg:row-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-[#187d35]">{t('تفاصيل الفرصة', 'Opportunity details')}</p>
                <h3 className="mt-2 text-lg font-bold text-[#0e0f0c]">
                  {t('المطابقة داخل سياق الوظيفة', 'Matching in the job context')}
                </h3>
              </div>
              <FeatureIcon icon={landingIcons.opportunity} tone="green" />
            </div>
            <TabletMockup
              src="/landing/job-details.png"
              alt={t('تفاصيل الفرصة وحالة التقديم', 'Opportunity details and application status')}
              className="mt-6"
            />
          </BentoCard>

          <BentoCard tone="white" cut="end" className="p-6 lg:col-span-5">
            <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
              <MatchScale />
              <div>
                <FeatureIcon icon={landingIcons.readiness} tone="green" />
                <h3 className="mt-4 text-lg font-bold text-[#0e0f0c]">
                  {t('درجة مطابقة قابلة للتفسير', 'An explainable match score')}
                </h3>
                <p className="mt-2 text-xs font-medium leading-6 text-[#5b5e5a]">
                  {t(
                    'تُعرض الدرجة مع العوامل التي رفعتها أو خفضتها، لا كرقم منفصل.',
                    'The score appears with the factors that raised or lowered it, not as an isolated number.',
                  )}
                </p>
              </div>
            </div>
          </BentoCard>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5">
            <BentoCard tone="white" cut="start" className="p-5">
              <FeatureIcon icon={landingIcons.success} tone="green" />
              <h3 className="mt-5 text-base font-bold text-[#0e0f0c]">{t('مهارات متوافقة', 'Matched skills')}</h3>
              <div className="mt-4 space-y-3">
                {[t('متطلب أساسي', 'Core requirement'), t('خبرة مرتبطة', 'Relevant experience')].map((label) => (
                  <div key={label} className="flex items-center gap-2 text-xs font-semibold text-[#454944]">
                    <span className="h-2 w-2 rounded-full bg-[#1ba442]" />
                    {label}
                  </div>
                ))}
              </div>
            </BentoCard>
            <BentoCard tone="soft" cut="end" className="p-5">
              <FeatureIcon icon={landingIcons.gap} tone="neutral" />
              <h3 className="mt-5 text-base font-bold text-[#0e0f0c]">{t('مهارات ناقصة', 'Missing skills')}</h3>
              <div className="mt-4 space-y-3">
                {[t('فجوة ذات أولوية', 'Priority gap'), t('تغطية جزئية', 'Partial coverage')].map((label) => (
                  <div key={label} className="flex items-center gap-2 text-xs font-semibold text-[#5b5e5a]">
                    <span className="h-2 w-2 rounded-full border border-[#8a8f87] bg-white" />
                    {label}
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>

          <BentoCard tone="dark" cut="both" className="p-6 lg:col-span-12">
            <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr_auto] lg:items-center">
              <div className="flex items-center gap-4">
                <FeatureIcon icon={landingIcons.roadmap} tone="dark" />
                <div>
                  <p className="text-xs font-bold text-[#9fe870]">{t('الخطوة التالية', 'Next step')}</p>
                  <h3 className="mt-1 text-lg font-bold text-white">{t('خطة تطوير مرتبطة بالفجوة', 'A gap-linked development plan')}</h3>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                {[
                  ['المهارات', 'Skills'],
                  ['الخبرة', 'Experience'],
                  ['المشاريع', 'Projects'],
                  ['التشابه الدلالي', 'Semantic fit'],
                ].map(([ar, en]) => (
                  <div key={en} className="border-s border-white/15 ps-3">
                    <span className="text-xs font-semibold text-[#c8cbc5]">{t(ar, en)}</span>
                    <span className="mt-2 block h-1.5 bg-[#9fe870]" />
                  </div>
                ))}
              </div>
              <Link
                to="/register"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#9fe870] px-6 py-3 text-sm font-bold text-[#0e0f0c] hover:bg-[#80d34f]"
              >
                {t('ابدأ بناء ملفك', 'Start building your profile')}
                <Arrow size={17} />
              </Link>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

export function Beneficiaries() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section
      id="beneficiaries"
      className="landing-section-divider landing-divider-grid bg-[#f0f1ee] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          number="07"
          eyebrow={t('المستفيدون', 'Beneficiaries')}
          title={t('منصة واحدة، قيمة مختلفة لكل طرف', 'One platform, distinct value for every stakeholder')}
          description={t(
            'كل واجهة تركز على القرارات والمهام التي يحتاجها مستخدمها، مع بقاء البيانات مترابطة.',
            'Each experience focuses on the decisions and tasks its user needs while keeping the underlying data connected.',
          )}
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <BentoCard tone="white" cut="start" className="p-5 sm:p-7 lg:col-span-7">
            <div className="grid gap-7 md:grid-cols-[0.75fr_1.25fr] md:items-center">
              <div>
                <FeatureIcon icon={landingIcons.student} size="hero" tone="green" />
                <h3 className="mt-5 text-xl font-bold text-[#0e0f0c]">{t('الطلاب والخريجون', 'Students and graduates')}</h3>
                <p className="mt-2 text-sm font-medium leading-7 text-[#5b5e5a]">
                  {t('ملف مهني، فرص مرتبة، ومتابعة واضحة للطلبات.', 'A professional profile, ranked opportunities, and clear application tracking.')}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {[
                    ['درجة الجاهزية', 'Readiness'],
                    ['فرص مقترحة', 'Suggested jobs'],
                    ['حالة الطلبات', 'Applications'],
                    ['فجوة مهارية', 'Skill gap'],
                  ].map(([ar, en]) => (
                    <span key={en} className="border border-[#dfe1dd] bg-[#f7f8f5] px-3 py-2 text-xs font-semibold text-[#454944]">
                      {t(ar, en)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="aspect-[16/10] overflow-hidden border border-[#dfe1dd] bg-[#f7f8f5] p-3">
                <img
                  src="/landing/student-jobs.png"
                  alt={t('واجهة فرص الطالب', 'Student opportunities interface')}
                  loading="lazy"
                  className="h-full w-full object-contain object-top"
                />
              </div>
            </div>
          </BentoCard>

          <BentoCard tone="green" cut="end" className="flex min-h-[470px] flex-col p-5 sm:p-7 lg:col-span-5">
            <div className="flex items-start justify-between gap-4">
              <FeatureIcon icon={landingIcons.university} size="hero" tone="white" />
              <span className="text-xs font-bold text-[#165f2b]">{t('بوابة الجامعة', 'University portal')}</span>
            </div>
            <h3 className="mt-5 text-xl font-bold text-[#0e0f0c]">{t('الجامعات', 'Universities')}</h3>
            <p className="mt-2 text-sm font-medium leading-7 text-[#33402d]">
              {t('رؤية أوضح للجاهزية والانتقال من التعليم إلى التوظيف.', 'Clearer visibility into readiness and the transition from education to employment.')}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              {[
                ['متوسط الجاهزية', 'Average readiness'],
                ['فجوات المهارات', 'Skill gaps'],
                ['مقارنة الكليات', 'College comparison'],
                ['مؤشرات التوظيف', 'Employment indicators'],
              ].map(([ar, en]) => (
                <span key={en} className="border border-[#0e0f0c]/10 bg-white/55 px-3 py-2 text-xs font-semibold text-[#273124]">
                  {t(ar, en)}
                </span>
              ))}
            </div>
            <div className="mt-5 flex-1 overflow-hidden border border-[#0e0f0c]/10 bg-white/60 p-3">
              <img
                src="/landing/university-dashboard.png"
                alt={t('لوحة الجامعة ومؤشرات الكليات والأقسام', 'University dashboard with college and department insights')}
                loading="lazy"
                className="h-full min-h-40 w-full object-contain object-top"
              />
            </div>
          </BentoCard>

          <BentoCard tone="dark" cut="both" className="p-5 sm:p-7 lg:col-span-12">
            <div className="grid gap-7 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
              <div>
                <FeatureIcon icon={landingIcons.company} size="hero" tone="dark" />
                <h3 className="mt-5 text-xl font-bold text-white">{t('الشركات', 'Companies')}</h3>
                <p className="mt-2 text-sm font-medium leading-7 text-[#b9bdb6]">
                  {t('اكتشاف مرشحين ومراجعة عوامل المطابقة بكفاءة.', 'Discover candidates and review matching factors efficiently.')}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  {[
                    ['فرص منشورة', 'Published jobs'],
                    ['مرشحون متوافقون', 'Matched candidates'],
                    ['حالات الطلبات', 'Application states'],
                    ['أفضل المهارات', 'Top skills'],
                  ].map(([ar, en]) => (
                    <span key={en} className="border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[#d5d8d2]">
                      {t(ar, en)}
                    </span>
                  ))}
                </div>
                <Link to="/register" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#9fe870]">
                  {t('اكتشف قيمة مدار للشركات', 'Explore MADAR for companies')}
                  <Arrow size={17} />
                </Link>
              </div>
              <div className="aspect-[16/7] overflow-hidden border border-white/10 bg-white/[0.03] p-3">
                <img
                  src="/landing/company-candidates.png"
                  alt={t('واجهة إدارة المرشحين للشركة', 'Company candidate management interface')}
                  loading="lazy"
                  className="h-full w-full object-contain object-top"
                />
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

export function AiFlow() {
  const { t } = useLanguage();
  const flow: Array<{ icon: Icon; ar: string; en: string }> = [
    { icon: landingIcons.resume, ar: 'السيرة الذاتية', en: 'Resume' },
    { icon: landingIcons.extract, ar: 'استخراج وتصنيف البيانات', en: 'Extract and classify data' },
    { icon: landingIcons.ai, ar: 'تحليل المهارات', en: 'Analyze skills' },
    { icon: landingIcons.match, ar: 'مقارنة متطلبات الفرص', en: 'Compare job requirements' },
    { icon: landingIcons.recommendations, ar: 'تفسير النتيجة والتوصية', en: 'Explain and recommend' },
  ];

  return (
    <section
      id="ai"
      className="landing-section-divider landing-divider-data bg-[#0e0f0c] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          number="08"
          inverse
          eyebrow={t('ذكاء اصطناعي قابل للفهم', 'Understandable AI')}
          title={t('تحليل يقود إلى قرار، لا إلى رقم فقط', 'Analysis that leads to a decision, not just a number')}
          description={t(
            'تتدرج العملية من قراءة البيانات إلى تفسير النتيجة واقتراح الخطوة التالية، مع إبقاء المستخدم قادرًا على مراجعة معلوماته.',
            'The flow moves from reading data to explaining the result and recommending the next step, while keeping users in control of their information.',
          )}
        />

        <div className="landing-ai-flow relative mt-14 grid gap-3 lg:grid-cols-5">
          {flow.map((item, index) => (
            <motion.div
              key={item.en}
              {...landingReveal}
              transition={{ ...landingReveal.transition, delay: index * 0.08 }}
              className="landing-ai-node relative min-h-56 border border-white/10 bg-[#171914] p-5"
            >
              <span className="text-xs font-bold text-[#858a83]">{String(index + 1).padStart(2, '0')}</span>
              <FeatureIcon icon={item.icon} tone="dark" className="mt-8" />
              <h3 className="mt-5 text-sm font-bold leading-6 text-white">{t(item.ar, item.en)}</h3>
              {index < flow.length - 1 ? <span className="landing-data-pulse" aria-hidden="true" /> : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function VisionGoals() {
  const { t } = useLanguage();
  const goals: Array<{ icon: Icon; ar: string; en: string; tone: 'white' | 'soft' | 'green'; className: string }> = [
    { icon: landingIcons.gap, ar: 'تقليل فجوة المهارات', en: 'Reduce skill gaps', tone: 'green', className: 'lg:col-span-5' },
    { icon: landingIcons.readiness, ar: 'تحسين الجاهزية المهنية', en: 'Improve career readiness', tone: 'white', className: 'lg:col-span-7' },
    { icon: landingIcons.reports, ar: 'دعم الجامعات بالبيانات', en: 'Support universities with data', tone: 'soft', className: 'lg:col-span-7' },
    { icon: landingIcons.users, ar: 'مساعدة الشركات في اكتشاف المرشحين', en: 'Help companies discover candidates', tone: 'white', className: 'lg:col-span-5' },
  ];

  return (
    <section
      id="vision"
      className="landing-section-divider landing-divider-angle bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          number="09"
          eyebrow={t('الرؤية والأهداف', 'Vision and goals')}
          title={t('قرارات تعليم وتوظيف أكثر اتصالًا بالواقع', 'Education and hiring decisions that are better connected to reality')}
          description={t(
            'تدعم مدار انتقالًا أكثر وضوحًا من التعلم إلى العمل من خلال بيانات مشتركة ومؤشرات قابلة للاستخدام.',
            'MADAR supports a clearer transition from learning to work through shared data and usable insights.',
          )}
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          {goals.map((goal, index) => (
            <BentoCard
              key={goal.en}
              tone={goal.tone}
              cut={index % 2 ? 'end' : 'start'}
              className={cn('flex min-h-44 items-center gap-5 p-6', goal.className)}
              transition={{ ...landingReveal.transition, delay: index * 0.06 }}
            >
              <FeatureIcon icon={goal.icon} tone={goal.tone === 'green' ? 'white' : 'green'} />
              <div className="min-w-0">
                <span className="text-xs font-bold text-[#187d35]">{String(index + 1).padStart(2, '0')}</span>
                <h3 className="mt-2 text-base font-bold leading-7 text-[#0e0f0c]">{t(goal.ar, goal.en)}</h3>
              </div>
            </BentoCard>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesGrid() {
  const { t } = useLanguage();
  const supportFeatures: Array<{ icon: Icon; ar: string; en: string; className: string; tone?: 'white' | 'soft' | 'green' }> = [
    { icon: landingIcons.careerProfile, ar: 'الملف المهني', en: 'Professional profile', className: 'lg:col-span-3', tone: 'white' },
    { icon: landingIcons.readiness, ar: 'درجة الجاهزية', en: 'Readiness score', className: 'lg:col-span-3', tone: 'soft' },
    { icon: landingIcons.gap, ar: 'فجوات المهارات', en: 'Skill gaps', className: 'lg:col-span-3', tone: 'white' },
    { icon: landingIcons.recommendations, ar: 'التوصيات', en: 'Recommendations', className: 'lg:col-span-3', tone: 'green' },
  ];

  return (
    <section
      id="features"
      className="landing-section-divider landing-divider-dots bg-[#f7f8f5] px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          number="10"
          eyebrow={t('المميزات', 'Features')}
          title={t('كل ما تحتاجه لبناء قرار مهني أفضل', 'Everything needed to make a better career decision')}
          description={t(
            'أدوات مترابطة تعمل على نفس الملف والبيانات بدل الانتقال بين أنظمة منفصلة.',
            'Connected tools that work from the same profile and data instead of disconnected systems.',
          )}
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <BentoCard tone="dark" cut="start" className="min-h-[390px] p-6 sm:p-8 lg:col-span-6">
            <div className="flex items-start justify-between gap-4">
              <FeatureIcon icon={landingIcons.resume} size="hero" tone="dark" />
              <span className="text-xs font-bold text-[#9fe870]">01</span>
            </div>
            <h3 className="mt-7 text-2xl font-bold text-white">{t('تحليل السيرة الذاتية', 'Resume analysis')}</h3>
            <p className="mt-3 max-w-md text-sm font-medium leading-7 text-[#b9bdb6]">
              {t('تحويل ملف السيرة إلى بيانات مهنية منظمة يمكن مراجعتها واعتمادها.', 'Turn a resume into structured career data that can be reviewed and confirmed.')}
            </p>
            <div className="mt-7 grid grid-cols-3 gap-2">
              {[landingIcons.skills, landingIcons.experience, landingIcons.education].map((ItemIcon, index) => (
                <span key={index} className="flex min-h-20 items-center justify-center border border-white/10 bg-white/[0.04] text-[#9fe870]">
                  <ItemIcon size={32} weight="regular" aria-hidden="true" />
                </span>
              ))}
            </div>
          </BentoCard>

          <BentoCard tone="white" cut="end" className="min-h-[390px] p-6 sm:p-8 lg:col-span-6">
            <div className="flex items-start justify-between gap-4">
              <FeatureIcon icon={landingIcons.match} size="hero" tone="green" />
              <span className="text-xs font-bold text-[#187d35]">02</span>
            </div>
            <h3 className="mt-7 text-2xl font-bold text-[#0e0f0c]">{t('مطابقة الفرص', 'Opportunity matching')}</h3>
            <p className="mt-3 max-w-md text-sm font-medium leading-7 text-[#5b5e5a]">
              {t('قراءة متطلبات الفرصة ومقارنتها بملف الطالب مع توضيح عوامل النتيجة.', 'Read job requirements, compare them with the student profile, and explain the result factors.')}
            </p>
            <div className="landing-feature-link mt-8 grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <ConnectedNode icon={landingIcons.student} label={t('الملف', 'Profile')} compact />
              <FeatureIcon icon={landingIcons.match} tone="green" />
              <ConnectedNode icon={landingIcons.opportunity} label={t('الفرصة', 'Job')} compact />
            </div>
          </BentoCard>

          {supportFeatures.map((feature, index) => (
            <BentoCard
              key={feature.en}
              tone={feature.tone}
              cut={index % 2 ? 'end' : 'start'}
              className={cn('min-h-56 p-5', feature.className)}
              transition={{ ...landingReveal.transition, delay: index * 0.04 }}
            >
              <FeatureIcon icon={feature.icon} tone={feature.tone === 'green' ? 'white' : 'green'} />
              <span className="mt-7 block text-xs font-bold text-[#187d35]">0{index + 3}</span>
              <h3 className="mt-2 text-base font-bold leading-6 text-[#0e0f0c]">{t(feature.ar, feature.en)}</h3>
              <div className="mt-5 space-y-2" aria-hidden="true">
                <span className="block h-1.5 w-full bg-white/70" />
                <span className="block h-1.5 w-2/3 bg-white/70" />
              </div>
            </BentoCard>
          ))}

          <BentoCard tone="white" cut="start" className="p-6 lg:col-span-5">
            <div className="flex items-center gap-4">
              <FeatureIcon icon={landingIcons.applications} tone="green" />
              <div>
                <span className="text-xs font-bold text-[#187d35]">07</span>
                <h3 className="mt-1 text-lg font-bold text-[#0e0f0c]">{t('إدارة الطلبات', 'Application management')}</h3>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              {[t('مقدّم', 'Applied'), t('قيد المراجعة', 'In review'), t('قرار', 'Decision')].map((label) => (
                <span key={label} className="border-t-2 border-[#1ba442] bg-[#f0f1ee] p-3 text-xs font-semibold text-[#454944]">
                  {label}
                </span>
              ))}
            </div>
          </BentoCard>

          <BentoCard tone="soft" cut="end" className="p-6 lg:col-span-7">
            <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
              <FeatureIcon icon={landingIcons.reports} size="hero" tone="green" />
              <div>
                <span className="text-xs font-bold text-[#187d35]">08</span>
                <h3 className="mt-1 text-lg font-bold text-[#0e0f0c]">{t('مؤشرات الجامعات والشركات', 'University and company insights')}</h3>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MetricVisual label={t('الجاهزية', 'Readiness')} />
                  <MetricVisual label={t('سوق العمل', 'Labor market')} muted />
                </div>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="landing-final-cta relative overflow-hidden bg-[#9fe870] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <motion.div {...landingReveal} className="relative mx-auto flex max-w-5xl flex-col items-center justify-between gap-7 text-center lg:flex-row lg:text-start">
        <div>
          <h2 className="text-3xl font-bold text-[#0e0f0c] sm:text-4xl">{t('ابدأ رحلتك المهنية مع مدار', 'Start your career journey with MADAR')}</h2>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#33402d]">
            {t('أنشئ حسابك، أكمل ملفك، ودع بياناتك تساعدك على الوصول إلى فرصة أنسب.', 'Create your account, complete your profile, and let your data guide you toward a better-fit opportunity.')}
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
          <Link to="/register" className="landing-button-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 py-3 text-sm font-bold">
            {t('إنشاء حساب', 'Create account')}
            <Arrow size={16} />
          </Link>
          <Link to="/login" className="landing-button-secondary inline-flex min-h-12 items-center justify-center rounded-full px-7 py-3 text-sm font-bold">
            {t('تسجيل الدخول', 'Sign in')}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
