import { useState } from 'react';
import {
  Building2,
  ChevronDown,
  CircleUserRound,
  FileQuestion,
  GraduationCap,
  KeyRound,
  LifeBuoy,
  Search,
  Settings2,
} from 'lucide-react';
import { Link } from 'react-router';
import * as Accordion from '@radix-ui/react-accordion';
import { motion } from 'framer-motion';
import { PublicPageHero } from '@/components/landing/PublicPageHero';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Support() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const topics = [
    {
      icon: CircleUserRound,
      titleAr: 'الحساب وتسجيل الدخول',
      titleEn: 'Account and sign-in',
      descriptionAr: 'استعادة كلمة المرور ومشكلات الدخول والحساب.',
      descriptionEn: 'Password recovery, sign-in, and account issues.',
      to: '/forgot-password',
    },
    {
      icon: GraduationCap,
      titleAr: 'دعم الطلاب',
      titleEn: 'Student support',
      descriptionAr: 'الملف المهني والسيرة والوظائف والطلبات.',
      descriptionEn: 'Career profile, resume, jobs, and applications.',
      to: '/contact?topic=technical',
    },
    {
      icon: Building2,
      titleAr: 'دعم الجامعات والشركات',
      titleEn: 'University and company support',
      descriptionAr: 'الحسابات المؤسسية والبوابات وإدارة البيانات.',
      descriptionEn: 'Institutional accounts, portals, and data management.',
      to: '/contact?topic=university',
    },
    {
      icon: Settings2,
      titleAr: 'مشكلة تقنية',
      titleEn: 'Technical issue',
      descriptionAr: 'صفحة لا تعمل أو طلب لا يكتمل أو رسالة خطأ.',
      descriptionEn: 'A page, request, or error that needs technical review.',
      to: '/contact?topic=technical',
    },
  ];
  const questions = [
    {
      arQ: 'كيف أستعيد كلمة المرور؟',
      enQ: 'How do I reset my password?',
      arA: 'افتح صفحة تسجيل الدخول واختر «نسيت كلمة المرور؟»، ثم أدخل بريد الحساب واتبع خطوات الاستعادة.',
      enA: 'Open the sign-in page, choose “Forgot password?”, enter your account email, and follow the recovery steps.',
      tags: 'account login password حساب دخول كلمة المرور',
    },
    {
      arQ: 'لماذا لا تظهر توصيات وظيفية؟',
      enQ: 'Why are job recommendations not appearing?',
      arA: 'تحتاج التوصيات إلى ملف طالب مكتمل وبيانات مهارات وسيرة محللة، إضافة إلى وجود فرص منشورة ونشطة في النظام.',
      enA: 'Recommendations require a completed student profile, skills and resume analysis, and active published opportunities.',
      tags: 'student recommendations jobs profile طالب توصيات وظائف ملف',
    },
    {
      arQ: 'كيف أتابع حالة طلب التوظيف؟',
      enQ: 'How do I track an application?',
      arA: 'تظهر جميع الطلبات وحالاتها الحالية داخل صفحة «الطلبات» في بوابة الطالب.',
      enA: 'All applications and their current states appear on the Applications page in the student portal.',
      tags: 'applications status company طلبات حالة شركة',
    },
    {
      arQ: 'متى تستطيع الجامعة استخدام بوابتها؟',
      enQ: 'When can a university use its portal?',
      arA: 'بعد تسجيل الحساب يظهر طلب الجامعة بحالة قيد المراجعة، ولا تتاح وظائف البوابة المؤسسية إلا بعد اعتماد الجامعة.',
      enA: 'After registration, the university remains under review. Institutional portal features become available after approval.',
      tags: 'university approval pending جامعة اعتماد مراجعة',
    },
    {
      arQ: 'ما المعلومات المناسبة لإرسالها في طلب الدعم؟',
      enQ: 'What should I include in a support request?',
      arA: 'اذكر الصفحة المتأثرة والخطوات التي سبقت المشكلة ورسالة الخطأ إن وجدت. لا ترسل كلمة المرور أو رموز الدخول.',
      enA: 'Include the affected page, steps before the issue, and any error message. Never send passwords or access codes.',
      tags: 'support error security دعم خطأ أمان',
    },
  ];

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredQuestions = normalizedSearch
    ? questions.filter((item) =>
        `${item.arQ} ${item.enQ} ${item.arA} ${item.enA} ${item.tags}`
          .toLocaleLowerCase()
          .includes(normalizedSearch),
      )
    : questions;

  return (
    <div className="overflow-x-clip bg-[#f7f8f5]">
      <PublicPageHero
        icon={LifeBuoy}
        eyebrowAr="مركز الدعم"
        eyebrowEn="Support center"
        titleAr="ابدأ بالإجابة السريعة، وانتقل إلى الفريق عند الحاجة"
        titleEn="Start with a quick answer, then reach the team when needed"
        descriptionAr="ابحث في الأسئلة المتكررة أو اختر نوع المساعدة المناسب. إذا لم تجد الحل، أرسل طلبًا موثقًا من صفحة التواصل."
        descriptionEn="Search common questions or choose the relevant help area. If the issue remains, submit a tracked request from the contact page."
      />

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topics.map(({ icon: Icon, ...topic }, index) => (
              <motion.div
                key={topic.titleEn}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
              >
                <Link to={topic.to} className="landing-cut-card landing-icon-card block min-h-64 border border-[#dfe1dd] bg-white p-6 transition hover:border-[#9fe870]">
                  <span className="landing-icon-box flex h-16 w-16 items-center justify-center rounded-lg bg-[#e7fdd8] text-[#1ba442]">
                    <Icon size={34} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h2 className="mt-7 text-lg font-bold text-[#0e0f0c]">{t(topic.titleAr, topic.titleEn)}</h2>
                  <p className="mt-3 text-sm font-medium leading-7 text-[#5b5e5a]">{t(topic.descriptionAr, topic.descriptionEn)}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <span className="landing-icon-box flex h-20 w-20 items-center justify-center rounded-lg bg-[#0e0f0c] text-[#9fe870]">
              <FileQuestion size={42} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <p className="mt-7 text-xs font-bold text-[#1ba442]">{t('الأسئلة المتكررة', 'Common questions')}</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-[#0e0f0c] sm:text-4xl">{t('ابحث عن الإجابة قبل إرسال طلب', 'Find an answer before submitting a request')}</h2>
            <div className="relative mt-7">
              <Search size={20} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[#747874]" aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-12 w-full rounded-lg border border-[#cfd2cc] bg-[#f7f8f5] pe-4 ps-12 text-sm font-medium outline-none focus:border-[#1ba442] focus:ring-2 focus:ring-[#9fe870]/40" placeholder={t('ابحث في الدعم...', 'Search support...')} aria-label={t('البحث في الأسئلة المتكررة', 'Search common questions')} />
            </div>
          </div>

          <div>
            {filteredQuestions.length > 0 ? (
              <Accordion.Root type="single" collapsible className="space-y-3">
                {filteredQuestions.map((item, index) => (
                  <Accordion.Item key={item.enQ} value={`support-${index}`} className="group border border-[#dfe1dd] bg-[#f7f8f5] data-[state=open]:border-[#9fe870]">
                    <Accordion.Header>
                      <Accordion.Trigger className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-bold text-[#0e0f0c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1ba442]">
                        {t(item.arQ, item.enQ)}
                        <ChevronDown size={21} className="shrink-0 text-[#1ba442] transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                      <p className="border-t border-[#dfe1dd] px-5 py-5 text-sm font-medium leading-7 text-[#5b5e5a]">{t(item.arA, item.enA)}</p>
                    </Accordion.Content>
                  </Accordion.Item>
                ))}
              </Accordion.Root>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-[#cfd2cc] bg-[#f7f8f5] p-6 text-center">
                <Search size={38} className="text-[#747874]" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold text-[#0e0f0c]">{t('لا توجد نتيجة مطابقة', 'No matching answer')}</h3>
                <p className="mt-2 text-sm font-medium text-[#5b5e5a]">{t('يمكنك إرسال طلب إلى فريق الدعم.', 'You can submit a request to the support team.')}</p>
                <Link to="/contact?topic=technical" className="mt-5 inline-flex min-h-11 items-center bg-[#9fe870] px-5 text-sm font-bold text-[#0e0f0c]">{t('إرسال طلب دعم', 'Submit support request')}</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="bg-[#9fe870] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-start">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#0e0f0c] text-[#9fe870]">
              <KeyRound size={34} strokeWidth={1.7} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-[#0e0f0c]">{t('ما زلت بحاجة إلى مساعدة؟', 'Still need help?')}</h2>
              <p className="mt-1 text-sm font-semibold text-[#33402d]">{t('أرسل التفاصيل وسيُحفظ طلبك برقم مرجعي.', 'Submit the details and receive a reference number.')}</p>
            </div>
          </div>
          <Link to="/contact?topic=technical" className="inline-flex min-h-12 w-full items-center justify-center bg-[#0e0f0c] px-7 text-sm font-bold text-white hover:bg-[#252722] sm:w-auto">{t('التواصل مع الدعم', 'Contact support')}</Link>
        </div>
      </section>
    </div>
  );
}
