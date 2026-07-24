import { useLanguage } from '@/contexts/LanguageContext';
import { BentoCard, ConnectedNode, FeatureIcon, SectionHeader } from './LandingPrimitives';
import { landingIcons } from './landingIconMap';

export function LandingStats() {
  const { t } = useLanguage();
  const journey = [
    { icon: landingIcons.account, ar: 'إنشاء الحساب', en: 'Create account' },
    { icon: landingIcons.careerProfile, ar: 'بناء الملف', en: 'Build profile' },
    { icon: landingIcons.resume, ar: 'تحليل السيرة', en: 'Analyze resume' },
    { icon: landingIcons.skills, ar: 'فهم المهارات', en: 'Understand skills' },
    { icon: landingIcons.readiness, ar: 'قياس الجاهزية', en: 'Measure readiness' },
    { icon: landingIcons.match, ar: 'مطابقة الفرص', en: 'Match opportunities' },
    { icon: landingIcons.applications, ar: 'متابعة الطلب', en: 'Track application' },
  ];
  const portals = [
    { icon: landingIcons.student, ar: 'بوابة الطالب', en: 'Student portal' },
    { icon: landingIcons.university, ar: 'بوابة الجامعة', en: 'University portal' },
    { icon: landingIcons.company, ar: 'بوابة الشركة', en: 'Company portal' },
  ];

  return (
    <section
      id="platform-stats"
      className="landing-section-divider landing-overview-section px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      aria-labelledby="platform-stats-title"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          number="01"
          eyebrow={t('منظومة مدار', 'The MADAR ecosystem')}
          title={t(
            'رحلة واحدة بدل أدوات ومسارات متفرقة',
            'One connected journey instead of scattered tools',
          )}
          description={t(
            'تنتقل البيانات من الملف المهني إلى التحليل والمطابقة والمتابعة ضمن سياق واضح ومراجع.',
            'Data moves from the career profile to analysis, matching, and tracking in one clear, reviewable context.',
          )}
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          <BentoCard tone="soft" cut="none" className="p-6 sm:p-8 lg:col-span-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
              <div>
                <span className="landing-soft-label">
                  {t('سبع مراحل مترابطة', 'Seven connected stages')}
                </span>
                <h3 className="mt-4 text-2xl font-bold">
                  {t('من الحساب إلى فرصة قابلة للمتابعة', 'From account to a trackable opportunity')}
                </h3>
              </div>
              <FeatureIcon icon={landingIcons.roadmap} size="hero" tone="green" />
            </div>

            <div className="landing-journey-grid mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {journey.map(({ icon: JourneyIcon, ar, en }, index) => (
                <div key={en} className="landing-journey-item">
                  <span className="landing-journey-index">{String(index + 1).padStart(2, '0')}</span>
                  <JourneyIcon size={27} weight="regular" aria-hidden="true" />
                  <p>{t(ar, en)}</p>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard tone="dark" cut="none" className="p-6 sm:p-8 lg:col-span-4">
            <FeatureIcon icon={landingIcons.connected} tone="dark" />
            <h3 className="mt-6 text-2xl font-bold">
              {t('أطراف تعمل في سياق واحد', 'Stakeholders in one context')}
            </h3>
            <p className="mt-3 text-sm font-medium leading-7 text-[#b9bdb6]">
              {t(
                'الطالب والجامعة والشركة والفرصة مترابطة دون تكرار للملف المهني.',
                'Students, universities, companies, and opportunities stay connected without duplicating the career profile.',
              )}
            </p>
            <div className="landing-node-grid relative mt-7 grid grid-cols-2 gap-2">
              <ConnectedNode icon={landingIcons.student} label={t('الطالب', 'Student')} compact />
              <ConnectedNode icon={landingIcons.university} label={t('الجامعة', 'University')} compact />
              <ConnectedNode icon={landingIcons.company} label={t('الشركة', 'Company')} compact />
              <ConnectedNode icon={landingIcons.opportunity} label={t('الفرصة', 'Opportunity')} compact />
            </div>
          </BentoCard>

          <BentoCard tone="white" cut="none" className="p-6 sm:p-8 lg:col-span-5">
            <div className="flex items-center gap-4">
              <FeatureIcon icon={landingIcons.reports} tone="green" />
              <div>
                <span className="landing-soft-label">{t('ثلاث بوابات', 'Three portals')}</span>
                <h3 className="mt-2 text-xl font-bold">{t('تجربة مخصصة لكل طرف', 'A focused experience for each role')}</h3>
              </div>
            </div>
            <div className="mt-7 grid gap-3">
              {portals.map(({ icon: PortalIcon, ar, en }) => (
                <div key={en} className="landing-portal-row">
                  <PortalIcon size={26} weight="regular" aria-hidden="true" />
                  <span>{t(ar, en)}</span>
                </div>
              ))}
            </div>
          </BentoCard>

          <BentoCard tone="green" cut="none" className="p-6 sm:p-8 lg:col-span-7">
            <div className="grid gap-7 sm:grid-cols-[auto_1fr] sm:items-center">
              <div className="landing-profile-orbit flex h-36 w-36 items-center justify-center rounded-full">
                <FeatureIcon icon={landingIcons.careerProfile} size="hero" tone="white" />
              </div>
              <div className="min-w-0">
                <span className="landing-soft-label">{t('ملف مهني موحّد', 'Unified career profile')}</span>
                <h3 className="mt-3 text-2xl font-bold">
                  {t('مرجع واحد قابل للمراجعة والتطوير', 'One profile ready to review and improve')}
                </h3>
                <p className="mt-3 text-sm font-medium leading-7">
                  {t(
                    'يجمع البيانات الأكاديمية والسيرة والمهارات والطلبات دون تحويلها إلى ملفات منفصلة.',
                    'It brings academic data, resume, skills, and applications together without splitting them into separate records.',
                  )}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    ['البيانات الأكاديمية', 'Academic data'],
                    ['السيرة الذاتية', 'Resume'],
                    ['المهارات', 'Skills'],
                    ['الطلبات', 'Applications'],
                  ].map(([ar, en]) => (
                    <span key={en} className="landing-profile-chip">{t(ar, en)}</span>
                  ))}
                </div>
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}
