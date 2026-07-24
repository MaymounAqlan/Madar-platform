import { useEffect, useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import {
  AlertTriangle, Building2, Globe2, Loader2, Mail, MapPin, Phone, RefreshCw, Save,
} from 'lucide-react';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useUniversityProfile,
  useUpdateUniversityProfile,
} from '@/hooks/useUniversity';
import { useAuth } from '@/hooks/useAuth';
import type { UpdateUniversityProfileRequest } from '@/types/university.types';
import DevelopmentAutofillButton from '@/components/DevelopmentAutofillButton';
import { generateUniversityProfileTestData } from '@/utils/testDataGenerator';
import { universityApi } from '@/services/universityApi';

type UniversityProfileForm = Required<Pick<UpdateUniversityProfileRequest,
  'name' | 'nameAr' | 'type' | 'description' | 'city' | 'country' | 'address' | 'website' | 'phone' |
  'contactEmail' | 'officialContactEmail' | 'officialContactName' | 'officialContactPhone' | 'emailDomain' | 'logoUrl'>>;

const emptyUniversityForm: UniversityProfileForm = {
  name: '', nameAr: '', type: 'public', description: '', city: '', country: '', address: '', website: '', phone: '',
  contactEmail: '', officialContactEmail: '', officialContactName: '', officialContactPhone: '', emailDomain: '', logoUrl: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function messageFromError(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : typeof message === 'string' ? message : fallback;
}

const resolveAssetUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
};

export default function UniversityProfile() {
  const { t } = useLanguage();
  const profileQuery = useUniversityProfile(true);
  const updateProfile = useUpdateUniversityProfile();
  const { updateCurrentUser } = useAuth();
  const [form, setForm] = useState<UniversityProfileForm>(emptyUniversityForm);
  const [errors, setErrors] = useState<Partial<Record<keyof UniversityProfileForm, string>>>({});
  const [serverError, setServerError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profileQuery.data) return;
    setForm({
      name: profileQuery.data.name,
      nameAr: profileQuery.data.nameAr,
      type: profileQuery.data.type,
      description: profileQuery.data.description,
      city: profileQuery.data.location.city,
      country: profileQuery.data.location.country,
      address: profileQuery.data.location.address,
      website: profileQuery.data.contactInfo.website,
      phone: profileQuery.data.contactInfo.phone,
      contactEmail: profileQuery.data.contactInfo.email,
      officialContactEmail: profileQuery.data.contactInfo.officialContactEmail,
      officialContactName: profileQuery.data.contactInfo.officialContactName,
      officialContactPhone: profileQuery.data.contactInfo.officialContactPhone,
      emailDomain: profileQuery.data.emailDomain,
      logoUrl: profileQuery.data.logoUrl || '',
    });
  }, [profileQuery.data]);

  const reset = () => {
    if (!profileQuery.data) return setForm(emptyUniversityForm);
    setForm({
      name: profileQuery.data.name, nameAr: profileQuery.data.nameAr, type: profileQuery.data.type, description: profileQuery.data.description,
      city: profileQuery.data.location.city, country: profileQuery.data.location.country, address: profileQuery.data.location.address,
      website: profileQuery.data.contactInfo.website, phone: profileQuery.data.contactInfo.phone,
      contactEmail: profileQuery.data.contactInfo.email, officialContactEmail: profileQuery.data.contactInfo.officialContactEmail,
      officialContactName: profileQuery.data.contactInfo.officialContactName, officialContactPhone: profileQuery.data.contactInfo.officialContactPhone,
      emailDomain: profileQuery.data.emailDomain,
      logoUrl: profileQuery.data.logoUrl || '',
    });
    setErrors({}); setServerError('');
  };

  const setField = (field: keyof UniversityProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError('');
  };

  const validate = () => {
    const next: Partial<Record<keyof UniversityProfileForm, string>> = {};
    if (!form.name.trim()) next.name = t('اسم الجامعة مطلوب', 'University name is required');
    if (form.contactEmail && !emailPattern.test(form.contactEmail)) next.contactEmail = t('البريد غير صالح', 'Invalid email address');
    if (form.officialContactEmail && !emailPattern.test(form.officialContactEmail)) next.officialContactEmail = t('البريد غير صالح', 'Invalid email address');
    for (const field of ['website', 'logoUrl'] as const) {
      if (!form[field]) continue;
      try {
        const parsed = new URL(form[field]);
        if (field === 'logoUrl' && parsed.protocol !== 'https:') next[field] = t('يجب أن يستخدم رابط الشعار HTTPS', 'Logo URL must use HTTPS');
      } catch { next[field] = t('أدخل رابطًا صالحًا', 'Enter a valid URL'); }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setServerError('');
    try {
      await updateProfile.mutateAsync(Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim()]),
      ) as UpdateUniversityProfileRequest);
      toast.success(t('تم تحديث ملف الجامعة', 'University profile updated'));
    } catch (error) {
      setServerError(messageFromError(error, t('تعذر حفظ ملف الجامعة', 'Unable to save university profile')));
    }
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error(t('يرجى اختيار صورة بصيغة JPG أو PNG أو WebP', 'Please select a JPG, PNG, or WebP image'));
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('يجب أن لا يتجاوز حجم الصورة 5 ميجابايت', 'Image size must not exceed 5MB'));
      return;
    }

    setIsUploading(true);
    try {
      const response = await universityApi.uploadLogo(file);
      setForm(prev => ({ ...prev, logoUrl: response.logoUrl }));
      await updateCurrentUser({ avatar: response.logoUrl }).catch(() => {});
      toast.success(t('تم رفع الشعار بنجاح', 'Logo uploaded successfully'));
    } catch (error) {
      toast.error(messageFromError(error, t('تعذر رفع الشعار', 'Failed to upload logo')));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (profileQuery.isLoading) {
    return <PortalLayout title={t('ملف الجامعة', 'University Profile')} subtitle={t('إدارة بيانات الجامعة', 'Manage university information')}>
      <div className="flex h-96 items-center justify-center"><Loader2 size={32} className="animate-spin text-[#9fe870]" /></div>
    </PortalLayout>;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return <PortalLayout title={t('ملف الجامعة', 'University Profile')} subtitle={t('إدارة بيانات الجامعة', 'Manage university information')}>
      <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl border bg-white p-8" style={{ borderColor: '#dfe1dd' }}>
        <AlertTriangle size={30} className="text-red-600" />
        <p className="text-sm font-semibold text-[#5b5e5a]">{t('حدث خطأ أثناء تحميل ملف الجامعة.', 'An error occurred while loading the university profile.')}</p>
        <button onClick={() => profileQuery.refetch()} disabled={profileQuery.isFetching} className="inline-flex items-center gap-2 rounded-full bg-[#9fe870] px-4 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={15} className={profileQuery.isFetching ? 'animate-spin' : ''} />{t('إعادة المحاولة', 'Retry')}</button>
      </div>
    </PortalLayout>;
  }

  const inputClass = 'h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold outline-none focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]';
  const field = (name: keyof UniversityProfileForm, label: string, icon: React.ReactNode, type = 'text') => <label className="block" key={name}>
    <span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]">{icon}{label}</span>
    <input type={type} value={form[name]} onChange={(event) => setField(name, event.target.value)} className={inputClass} style={{ borderColor: errors[name] ? '#dc2626' : '#dfe1dd' }} />
    {errors[name] && <span className="mt-1 block text-xs font-semibold text-red-600">{errors[name]}</span>}
  </label>;

  return <PortalLayout title={t('ملف الجامعة', 'University Profile')} subtitle={t('إدارة بيانات الجامعة', 'Manage university information')}>
    <form onSubmit={submit} className="space-y-6">
      <ContentCard title={t('الهوية المؤسسية', 'Institution Identity')} icon={<Building2 size={18} className="text-[#5b5e5a]" />}>
        <div className="grid gap-5 lg:grid-cols-[140px_1fr]">
          <div 
            className="group relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border bg-[#f0f1ee] transition hover:border-[#9fe870]" 
            style={{ borderColor: '#dfe1dd' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <Loader2 size={30} className="animate-spin text-[#9fe870]" />
            ) : form.logoUrl ? (
              <img src={resolveAssetUrl(form.logoUrl)} alt={form.name} className="h-full w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <Building2 size={38} className="text-[#828782]" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
              <span className="text-xs font-semibold text-white">{t('تغيير الشعار', 'Change Logo')}</span>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleLogoUpload} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {field('name', t('اسم الجامعة', 'University Name'), <Building2 size={14} />)}
            {field('nameAr', t('الاسم العربي', 'Arabic Name'), <Building2 size={14} />)}
            <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><Building2 size={14} />{t('نوع الجامعة', 'University Type')}</span><select value={form.type} onChange={(event) => setField('type', event.target.value)} className={inputClass}><option value="government">{t('حكومية', 'Government')}</option><option value="private">{t('خاصة', 'Private')}</option><option value="non_profit">{t('غير ربحية', 'Non-profit')}</option><option value="international">{t('دولية', 'International')}</option><option value="other">{t('أخرى', 'Other')}</option></select></label>
            {field('logoUrl', t('رابط الشعار', 'Logo URL'), <Globe2 size={14} />, 'url')}
            <label className="block md:col-span-2"><span className="mb-2 block text-xs font-bold text-[#5b5e5a]">{t('الوصف', 'Description')}</span><textarea value={form.description} onChange={(event) => setField('description', event.target.value)} rows={4} className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]" style={{ borderColor: '#dfe1dd' }} /></label>
          </div>
        </div>
      </ContentCard>

      <ContentCard title={t('الموقع والتواصل', 'Location and Contact')} icon={<MapPin size={18} className="text-[#5b5e5a]" />}>
        <div className="grid gap-4 md:grid-cols-2">
          {field('city', t('المدينة', 'City'), <MapPin size={14} />)}
          {field('country', t('الدولة', 'Country'), <MapPin size={14} />)}
          <div className="md:col-span-2">{field('address', t('العنوان', 'Address'), <MapPin size={14} />)}</div>
          {field('website', t('الموقع الإلكتروني', 'Website'), <Globe2 size={14} />, 'url')}
          {field('phone', t('الهاتف', 'Phone'), <Phone size={14} />, 'tel')}
          {field('contactEmail', t('البريد العام', 'Contact Email'), <Mail size={14} />, 'email')}
          {field('officialContactEmail', t('جهة التواصل الرسمية', 'Official Contact'), <Mail size={14} />, 'email')}
          {field('officialContactName', t('اسم جهة التواصل الرسمية', 'Official Contact Name'), <Building2 size={14} />)}
          {field('officialContactPhone', t('هاتف جهة التواصل الرسمية', 'Official Contact Phone'), <Phone size={14} />, 'tel')}
          {field('emailDomain', t('نطاق البريد الجامعي', 'University Email Domain'), <Globe2 size={14} />)}
        </div>
      </ContentCard>

      {serverError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{serverError}</div>}
      <div className="flex flex-wrap justify-end gap-2"><DevelopmentAutofillButton onClick={() => { setForm(generateUniversityProfileTestData()); setErrors({}); setServerError(''); }} label={t('تعبئة بيانات تجريبية', 'Fill Test Data')} /><button type="button" onClick={reset} disabled={updateProfile.isPending} className="h-11 rounded-full border px-5 text-sm font-semibold disabled:opacity-50">{t('استرجاع القيم الأصلية', 'Restore Original Values')}</button><button type="submit" disabled={updateProfile.isPending} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#9fe870] px-6 text-sm font-bold text-[#0e0f0c] disabled:opacity-50">{updateProfile.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{t('حفظ التعديلات', 'Save Changes')}</button></div>
    </form>
  </PortalLayout>;
}
