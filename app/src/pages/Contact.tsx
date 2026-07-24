import { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  GraduationCap,
  LifeBuoy,
  Loader2,
  Mail,
  MessageSquareText,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { PublicPageHero } from '@/components/landing/PublicPageHero';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  supportApi,
  type ContactRequesterType,
  type ContactRequestResult,
} from '@/services/supportApi';

interface ContactFormState {
  name: string;
  email: string;
  requesterType: ContactRequesterType;
  subject: string;
  message: string;
  website: string;
  consent: boolean;
}

type ContactFormErrors = Partial<Record<keyof ContactFormState, string>>;

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string') return response.data.message;
  }
  return fallback;
}

export default function Contact() {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const topic = searchParams.get('topic') || '';
  const initialRequesterType: ContactRequesterType =
    topic === 'university' ? 'university' : topic === 'company' ? 'company' : 'visitor';
  const initialSubject =
    topic === 'technical'
      ? t('طلب دعم تقني', 'Technical support request')
      : topic === 'university'
        ? t('استفسار جامعة', 'University inquiry')
        : topic === 'company'
          ? t('استفسار شركة', 'Company inquiry')
          : '';

  const [form, setForm] = useState<ContactFormState>({
    name: '',
    email: '',
    requesterType: initialRequesterType,
    subject: initialSubject,
    message: '',
    website: '',
    consent: false,
  });
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ContactRequestResult | null>(null);

  const setField = <K extends keyof ContactFormState>(
    field: K,
    value: ContactFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: ContactFormErrors = {};
    if (form.name.trim().length < 2) next.name = t('أدخل الاسم الكامل', 'Enter your full name');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = t('أدخل بريدًا إلكترونيًا صحيحًا', 'Enter a valid email address');
    if (form.subject.trim().length < 3) next.subject = t('اكتب عنوانًا واضحًا للطلب', 'Enter a clear request subject');
    if (form.message.trim().length < 20) next.message = t('يجب ألا تقل الرسالة عن 20 حرفًا', 'Message must contain at least 20 characters');
    if (!form.consent) next.consent = t('الموافقة مطلوبة لإرسال الطلب', 'Consent is required to submit the request');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const submitted = await supportApi.submitContactRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        requesterType: form.requesterType,
        subject: form.subject.trim(),
        message: form.message.trim(),
        language,
        website: form.website,
      });
      setResult(submitted);
      toast.success(t('تم استلام طلب التواصل', 'Your contact request was received'));
    } catch (submissionError: unknown) {
      toast.error(
        errorMessage(
          submissionError,
          t('تعذر إرسال الطلب. حاول مرة أخرى.', 'Unable to submit the request. Please try again.'),
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'min-h-12 w-full rounded-lg border border-[#cfd2cc] bg-white px-4 text-sm font-medium text-[#0e0f0c] outline-none transition placeholder:text-[#9a9e98] hover:border-[#aeb2ab] focus:border-[#1ba442] focus:ring-2 focus:ring-[#9fe870]/40';

  return (
    <div className="overflow-x-clip bg-[#f7f8f5]">
      <PublicPageHero
        icon={MessageSquareText}
        eyebrowAr="التواصل مع مدار"
        eyebrowEn="Contact MADAR"
        titleAr="أرسل استفسارك إلى الفريق المناسب"
        titleEn="Send your inquiry to the right team"
        descriptionAr="استخدم النموذج لإرسال استفسار عام أو طلب دعم يتعلق بحساب طالب أو جامعة أو شركة. تحفظ المنصة الطلب برقم مرجعي للمتابعة."
        descriptionEn="Use the form for a general inquiry or support request related to a student, university, or company account. MADAR stores the request with a reference number."
      />

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <aside className="space-y-4">
            {[
              [LifeBuoy, 'تحتاج إجابة سريعة؟', 'Need a quick answer?', 'راجع مركز الدعم والأسئلة المتكررة قبل إرسال الطلب.', 'Browse the support center and common questions before submitting.', '/support'],
              [ShieldCheck, 'بيانات الطلب محمية', 'Your request is protected', 'نحفظ الحد الأدنى من البيانات اللازمة لمعالجة استفسارك.', 'We store only the information needed to handle your inquiry.', '/about'],
            ].map(([Icon, arTitle, enTitle, arDescription, enDescription, to]) => {
              const CardIcon = Icon as typeof LifeBuoy;
              return (
                <Link
                  key={String(to)}
                  to={String(to)}
                  className="landing-cut-card landing-icon-card block border border-[#dfe1dd] bg-white p-6 transition hover:border-[#9fe870]"
                >
                  <span className="landing-icon-box flex h-16 w-16 items-center justify-center rounded-lg bg-[#e7fdd8] text-[#1ba442]">
                    <CardIcon size={34} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h2 className="mt-6 text-lg font-bold text-[#0e0f0c]">{t(String(arTitle), String(enTitle))}</h2>
                  <p className="mt-2 text-sm font-medium leading-7 text-[#5b5e5a]">{t(String(arDescription), String(enDescription))}</p>
                </Link>
              );
            })}
            <div className="border-s-2 border-[#1ba442] bg-[#f0f1ee] p-5">
              <p className="text-sm font-semibold leading-7 text-[#5b5e5a]">
                {t(
                  'لا ترسل كلمات المرور أو رموز الدخول أو نسخًا من الوثائق الحساسة داخل الرسالة.',
                  'Do not include passwords, access codes, or copies of sensitive documents in your message.',
                )}
              </p>
            </div>
          </aside>

          <div className="landing-cut-card border border-[#dfe1dd] bg-white p-5 sm:p-8 lg:p-10">
            {result ? (
              <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-lg bg-[#e7fdd8] text-[#1ba442]">
                  <CheckCircle2 size={44} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <h2 className="mt-7 text-2xl font-bold text-[#0e0f0c]">{t('تم استلام طلبك', 'Your request was received')}</h2>
                <p className="mt-3 max-w-md text-sm font-medium leading-7 text-[#5b5e5a]">
                  {t('احتفظ بالرقم المرجعي عند الحاجة إلى متابعة الطلب.', 'Keep the reference number if you need to follow up on the request.')}
                </p>
                <code className="mt-5 max-w-full break-all rounded-md bg-[#f0f1ee] px-4 py-3 text-sm font-bold text-[#0e0f0c]">{result.requestId}</code>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setForm({
                      name: '',
                      email: '',
                      requesterType: initialRequesterType,
                      subject: initialSubject,
                      message: '',
                      website: '',
                      consent: false,
                    });
                  }}
                  className="mt-7 min-h-12 bg-[#9fe870] px-6 text-sm font-bold text-[#0e0f0c] hover:bg-[#86d957]"
                >
                  {t('إرسال طلب آخر', 'Submit another request')}
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <span className="landing-icon-box flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#0e0f0c] text-[#9fe870]">
                    <Mail size={30} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-2xl font-bold text-[#0e0f0c]">{t('نموذج التواصل', 'Contact form')}</h2>
                    <p className="mt-1 text-sm font-medium text-[#5b5e5a]">{t('جميع الحقول المشار إليها مطلوبة.', 'All displayed fields are required.')}</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2" noValidate>
                  <div>
                    <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold text-[#0e0f0c]">{t('الاسم الكامل', 'Full name')}</label>
                    <input id="contact-name" value={form.name} onChange={(event) => setField('name', event.target.value)} className={inputClass} autoComplete="name" aria-invalid={Boolean(errors.name)} />
                    {errors.name && <p className="mt-1.5 text-xs font-semibold text-[#a9362d]">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-[#0e0f0c]">{t('البريد الإلكتروني', 'Email address')}</label>
                    <input id="contact-email" type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} className={inputClass} autoComplete="email" dir="ltr" aria-invalid={Boolean(errors.email)} />
                    {errors.email && <p className="mt-1.5 text-xs font-semibold text-[#a9362d]">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="contact-type" className="mb-2 block text-sm font-semibold text-[#0e0f0c]">{t('نوع المستخدم', 'Requester type')}</label>
                    <select id="contact-type" value={form.requesterType} onChange={(event) => setField('requesterType', event.target.value as ContactRequesterType)} className={inputClass}>
                      <option value="visitor">{t('زائر', 'Visitor')}</option>
                      <option value="student">{t('طالب أو خريج', 'Student or graduate')}</option>
                      <option value="university">{t('جامعة', 'University')}</option>
                      <option value="company">{t('شركة', 'Company')}</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="contact-subject" className="mb-2 block text-sm font-semibold text-[#0e0f0c]">{t('عنوان الطلب', 'Request subject')}</label>
                    <input id="contact-subject" value={form.subject} onChange={(event) => setField('subject', event.target.value)} className={inputClass} aria-invalid={Boolean(errors.subject)} />
                    {errors.subject && <p className="mt-1.5 text-xs font-semibold text-[#a9362d]">{errors.subject}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold text-[#0e0f0c]">{t('تفاصيل الطلب', 'Request details')}</label>
                    <textarea id="contact-message" value={form.message} onChange={(event) => setField('message', event.target.value)} rows={7} className={`${inputClass} resize-y py-3`} aria-invalid={Boolean(errors.message)} />
                    <div className="mt-1.5 flex justify-between gap-4 text-xs font-medium">
                      {errors.message ? <p className="font-semibold text-[#a9362d]">{errors.message}</p> : <span />}
                      <span className="text-[#747874]">{form.message.length}/3000</span>
                    </div>
                  </div>
                  <div className="sr-only" aria-hidden="true">
                    <label htmlFor="contact-website">Website</label>
                    <input id="contact-website" value={form.website} onChange={(event) => setField('website', event.target.value)} tabIndex={-1} autoComplete="off" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={form.consent} onChange={(event) => setField('consent', event.target.checked)} className="mt-1 h-5 w-5 accent-[#1ba442]" />
                      <span className="text-sm font-medium leading-6 text-[#5b5e5a]">{t('أوافق على استخدام البيانات المدخلة لمعالجة هذا الطلب والتواصل بشأنه.', 'I agree to the use of the submitted information to process and follow up on this request.')}</span>
                    </label>
                    {errors.consent && <p className="mt-1.5 text-xs font-semibold text-[#a9362d]">{errors.consent}</p>}
                  </div>
                  <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#5b5e5a]">
                      <ShieldCheck size={18} className="text-[#1ba442]" aria-hidden="true" />
                      {t('يحفظ الطلب مباشرة في نظام الدعم.', 'The request is stored directly in the support system.')}
                    </div>
                    <button type="submit" disabled={isSubmitting} className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#9fe870] px-7 text-sm font-bold text-[#0e0f0c] hover:bg-[#86d957] disabled:cursor-not-allowed disabled:opacity-60">
                      {isSubmitting ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <Send size={20} aria-hidden="true" />}
                      {isSubmitting ? t('جاري الإرسال...', 'Submitting...') : t('إرسال الطلب', 'Submit request')}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-[#dfe1dd] bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-3">
          {[
            [UserRound, 'الطلاب والخريجون', 'Students and graduates'],
            [GraduationCap, 'الجامعات', 'Universities'],
            [Building2, 'الشركات', 'Companies'],
          ].map(([Icon, ar, en]) => {
            const AudienceIcon = Icon as typeof UserRound;
            return (
              <div key={String(en)} className="landing-icon-card flex items-center gap-4 border border-[#dfe1dd] bg-[#f7f8f5] p-5">
                <span className="landing-icon-box flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-white text-[#1ba442]">
                  <AudienceIcon size={30} strokeWidth={1.7} aria-hidden="true" />
                </span>
                <span className="text-sm font-bold text-[#0e0f0c]">{t(String(ar), String(en))}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
