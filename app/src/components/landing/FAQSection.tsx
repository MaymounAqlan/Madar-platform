import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { FeatureIcon, SectionHeader } from './LandingPrimitives';
import { landingIcons } from './landingIconMap';

export function FAQSection() {
  const { t } = useLanguage();
  const questions = [
    {
      ar: 'كيف تحسب مدار نسبة المطابقة؟',
      en: 'How does MADAR calculate match scores?',
      answerAr: 'تُبنى النسبة على المهارات والخبرة والمشاريع والتشابه الدلالي ومتطلبات الفرصة المتاحة في النظام.',
      answerEn: 'The score uses skills, experience, projects, semantic similarity, and the opportunity requirements available in the system.',
    },
    {
      ar: 'هل أستطيع مراجعة البيانات المستخرجة من السيرة الذاتية؟',
      en: 'Can I review data extracted from my resume?',
      answerAr: 'نعم، تُعرض البيانات المستخرجة داخل الملف لتتمكن من مراجعتها واستكمال ما يلزم.',
      answerEn: 'Yes. Extracted information is presented in your profile so you can review and complete it.',
    },
    {
      ar: 'هل المنصة مخصصة للطلاب فقط؟',
      en: 'Is the platform only for students?',
      answerAr: 'لا، تدعم مدار الطلاب والخريجين والجامعات والشركات من خلال بوابات وصلاحيات مخصصة لكل فئة.',
      answerEn: 'No. MADAR supports students, graduates, universities, and companies through dedicated portals and permissions.',
    },
    {
      ar: 'هل تعني نسبة المطابقة ضمان القبول؟',
      en: 'Does a match score guarantee acceptance?',
      answerAr: 'لا، هي مؤشر يساعد على فهم الملاءمة والفجوات، بينما يبقى قرار القبول لدى الجهة المعلنة.',
      answerEn: 'No. It is an indicator of fit and gaps, while the final decision remains with the hiring organization.',
    },
    {
      ar: 'هل تعمل الواجهة بالعربية والإنجليزية؟',
      en: 'Does the interface support Arabic and English?',
      answerAr: 'نعم، تدعم المنصة اللغتين واتجاهي RTL وLTR.',
      answerEn: 'Yes. The platform supports both languages and RTL/LTR layouts.',
    },
  ];

  return (
    <section id="faq" className="landing-section-divider landing-divider-rail bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          number="11"
          eyebrow={t('الدعم', 'Support')}
          title={t('الأسئلة الشائعة', 'Frequently asked questions')}
          description={t(
            'إجابات مباشرة عن المطابقة وتحليل السيرة وحسابات المستفيدين.',
            'Direct answers about matching, resume analysis, and beneficiary accounts.',
          )}
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-[0.65fr_1.35fr] lg:items-start">
          <aside className="landing-cut-start border border-[#dfe1dd] bg-[#f0f1ee] p-6 sm:p-8">
            <FeatureIcon icon={landingIcons.question} size="hero" tone="green" />
            <h3 className="mt-6 text-xl font-bold text-[#0e0f0c]">{t('إجابة واضحة قبل بدء الرحلة', 'A clear answer before you begin')}</h3>
            <p className="mt-3 text-sm font-medium leading-7 text-[#5b5e5a]">
              {t(
                'توضح هذه الإجابات حدود المؤشرات وكيفية مراجعة البيانات واستخدام بوابات المنصة.',
                'These answers explain indicator boundaries, data review, and how platform portals are used.',
              )}
            </p>
          </aside>
          <Accordion.Root type="single" collapsible className="space-y-3">
            {questions.map((question, index) => (
              <Accordion.Item key={question.en} value={`question-${index}`} className="landing-cut-end overflow-hidden border border-[#dfe1dd] bg-[#f7f8f5]">
                <Accordion.Header>
                  <Accordion.Trigger className="group flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-bold text-[#0e0f0c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9fe870]">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="text-xs font-bold text-[#1ba442]">{String(index + 1).padStart(2, '0')}</span>
                      <span>{t(question.ar, question.en)}</span>
                    </span>
                    <ChevronDown size={18} className="shrink-0 text-[#5b5e5a] transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="overflow-hidden text-sm font-medium leading-7 text-[#5b5e5a] data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <p className="border-t border-[#dfe1dd] px-5 py-4">{t(question.answerAr, question.answerEn)}</p>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </div>
    </section>
  );
}
