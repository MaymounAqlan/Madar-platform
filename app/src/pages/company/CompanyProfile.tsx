import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Building2, Camera, ExternalLink, Github, Globe, Image, Instagram, Linkedin, Loader2, Mail,
  MapPin, Palette, Phone, Save, Tags, Trash2, Wand2, X,
} from 'lucide-react';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { useLanguage } from '@/hooks/useLanguage';
import { useCompanyProfile, useUpdateCompanyProfile, useUploadCompanyImage } from '@/hooks/useCompany';
import type { CompanyProfilePayload } from '@/services/companyApi';

type CompanyProfileWithPreferences = CompanyProfilePayload & { recruitmentPreferences?: { targetMajors?: string[] } };
type ImageTarget = 'logoUrl' | 'bannerUrl';
type SocialKey = 'linkedIn' | 'github' | 'portfolio' | 'website' | 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'behance' | 'dribbble' | 'stackOverflow' | 'researchGate' | 'orcid';

const toCsv = (value?: string[]) => (value || []).filter(Boolean).join(', ');
const fromCsv = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const emptyToUndefined = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};
const toAbsoluteAssetUrl = (url: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
  return `${apiBase}${url.startsWith('/') ? url : `/${url}`}`;
};

const socialMeta: Array<{ key: SocialKey; label: string; icon: React.ReactNode }> = [
  { key: 'linkedIn', label: 'LinkedIn', icon: <Linkedin size={18} /> },
  { key: 'github', label: 'GitHub', icon: <Github size={18} /> },
  { key: 'portfolio', label: 'Portfolio', icon: <Globe size={18} /> },
  { key: 'website', label: 'Website', icon: <Globe size={18} /> },
  { key: 'facebook', label: 'Facebook', icon: <BrandLetter label="f" /> },
  { key: 'twitter', label: 'Twitter / X', icon: <BrandLetter label="X" /> },
  { key: 'instagram', label: 'Instagram', icon: <Instagram size={18} /> },
  { key: 'youtube', label: 'YouTube', icon: <BrandLetter label="▶" /> },
  { key: 'behance', label: 'Behance', icon: <BrandLetter label="Be" /> },
  { key: 'dribbble', label: 'Dribbble', icon: <BrandLetter label="Db" /> },
  { key: 'stackOverflow', label: 'Stack Overflow', icon: <BrandLetter label="SO" /> },
  { key: 'researchGate', label: 'ResearchGate', icon: <BrandLetter label="RG" /> },
  { key: 'orcid', label: 'ORCID', icon: <BrandLetter label="iD" /> },
];

function LoadingSpinner() {
  return <div className="flex h-96 items-center justify-center"><Loader2 size={32} className="animate-spin text-[#9fe870]" /></div>;
}

function BrandLetter({ label }: { label: string }) {
  return <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center text-[10px] font-black">{label}</span>;
}

export default function CompanyProfile() {
  const { isRTL } = useLanguage();
  const t = (ar: string, en: string) => (isRTL ? ar : en);
  const { data: company, isLoading } = useCompanyProfile();
  const updateMutation = useUpdateCompanyProfile();
  const uploadImage = useUploadCompanyImage();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageTarget, setImageTarget] = useState<ImageTarget | null>(null);
  const [imageUrlDraft, setImageUrlDraft] = useState('');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [form, setForm] = useState({
    name: '', industry: '', industryDomains: '', technologies: '', description: '', mission: '', vision: '',
    location: '', latitude: '', longitude: '', website: '', email: '', phone: '', logoUrl: '', bannerUrl: '',
    linkedIn: '', github: '', portfolio: '', facebook: '', twitter: '', instagram: '', youtube: '',
    behance: '', dribbble: '', stackOverflow: '', researchGate: '', orcid: '', values: '', benefits: '',
  });

  useEffect(() => {
    if (!company) return;
    const contact = company.contactInfo || {};
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      name: company.profile?.name || '',
      industry: company.profile?.industry || '',
      industryDomains: toCsv(company.profile?.subIndustries),
      technologies: toCsv((company as CompanyProfileWithPreferences).recruitmentPreferences?.targetMajors),
      description: company.profile?.description || '',
      mission: company.culture?.workEnvironment || '',
      vision: company.culture?.diversityStatement || '',
      location: company.headquarters?.address || [company.headquarters?.city, company.headquarters?.country].filter(Boolean).join(', '),
      latitude: company.headquarters?.coordinates?.lat?.toString() || '',
      longitude: company.headquarters?.coordinates?.lng?.toString() || '',
      website: company.profile?.website || '',
      email: contact.email || contact.hrEmail || '',
      phone: contact.phone || '',
      logoUrl: company.profile?.logoUrl || '',
      bannerUrl: company.profile?.coverImageUrl || '',
      linkedIn: contact.linkedIn || '',
      github: contact.github || '',
      portfolio: contact.portfolio || '',
      facebook: contact.facebook || '',
      twitter: contact.twitter || '',
      instagram: contact.instagram || '',
      youtube: contact.youtube || '',
      behance: contact.behance || '',
      dribbble: contact.dribbble || '',
      stackOverflow: contact.stackOverflow || '',
      researchGate: contact.researchGate || '',
      orcid: contact.orcid || '',
      values: toCsv(company.culture?.values),
      benefits: toCsv(company.culture?.benefits),
    });
  }, [company]);

  const activeSocialLinks = useMemo(
    () => socialMeta.filter((item) => Boolean(form[item.key]?.trim())),
    [form],
  );

  const setField = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const openImageDialog = (target: ImageTarget) => {
    setImageTarget(target);
    setImageUrlDraft(form[target]);
  };
  const closeImageDialog = () => {
    setImageTarget(null);
    setImageUrlDraft('');
  };

  const fillTestData = () => {
    setForm((prev) => ({
      ...prev,
      name: 'Madar Digital Solutions',
      industry: 'Technology',
      industryDomains: 'Software Engineering, AI, Cloud Computing',
      technologies: 'React, TypeScript, Node.js, NestJS, MongoDB, Python, AWS',
      description: 'A Saudi technology company building AI-powered recruitment and career development platforms.',
      mission: 'Connect talented graduates with meaningful opportunities through data-driven matching.',
      vision: 'Become the leading intelligent talent platform in the region.',
      location: 'King Fahd Road, Riyadh, Saudi Arabia',
      latitude: '24.7136',
      longitude: '46.6753',
      website: 'https://madar.example.com',
      email: 'hr@madar.example.com',
      phone: '+966500000000',
      logoUrl: 'https://placehold.co/256x256/9fe870/0e0f0c?text=M',
      bannerUrl: 'https://placehold.co/1200x360/0e0f0c/9fe870?text=Madar+Digital+Solutions',
      linkedIn: 'https://www.linkedin.com/company/madar',
      github: 'https://github.com/madar',
      portfolio: 'https://madar.example.com',
      twitter: 'https://x.com/madar',
      values: 'Innovation, Trust, Learning, Impact',
      benefits: 'Flexible Work, Training Budget, Health Insurance, Career Growth',
    }));
  };

  const buildPayload = () => ({
    name: emptyToUndefined(form.name),
    industry: emptyToUndefined(form.industry),
    industryDomains: fromCsv(form.industryDomains),
    technologies: fromCsv(form.technologies),
    description: emptyToUndefined(form.description),
    mission: emptyToUndefined(form.mission),
    vision: emptyToUndefined(form.vision),
    location: emptyToUndefined(form.location),
    formattedAddress: emptyToUndefined(form.location),
    latitude: form.latitude ? Number(form.latitude) : undefined,
    longitude: form.longitude ? Number(form.longitude) : undefined,
    website: emptyToUndefined(form.website),
    email: emptyToUndefined(form.email),
    phone: emptyToUndefined(form.phone),
    logoUrl: emptyToUndefined(form.logoUrl),
    bannerUrl: emptyToUndefined(form.bannerUrl),
    socialLinks: Object.fromEntries(socialMeta.filter((item) => item.key !== 'website').map((item) => [item.key, emptyToUndefined(form[item.key])])),
    values: fromCsv(form.values),
    benefits: fromCsv(form.benefits),
  });

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(buildPayload());
      toast.success(t('تم حفظ ملف الشركة', 'Company profile saved'));
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
        : undefined;
      toast.error((Array.isArray(message) ? message.join(', ') : message) || t('تعذر حفظ ملف الشركة', 'Failed to save company profile'));
    }
  };

  const handleUpload = async (file?: File) => {
    if (!file || !imageTarget) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      toast.error(t('نوع الصورة غير مدعوم', 'Unsupported image type'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('حجم الصورة يجب ألا يتجاوز 5MB', 'Image must be 5MB or smaller'));
      return;
    }
    const result = await uploadImage.mutateAsync(file);
    setImageUrlDraft(result.url);
  };

  const saveImageDialog = () => {
    if (!imageTarget) return;
    setField(imageTarget, imageUrlDraft.trim());
    closeImageDialog();
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <PortalLayout title={t('ملف الشركة', 'Company Profile')}>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-[24px] border border-[#dfe1dd] bg-white shadow-sm">
          <button type="button" onClick={() => openImageDialog('bannerUrl')} className="group relative h-36 w-full bg-[#dfe1dd] text-start">
            {form.bannerUrl ? <img src={toAbsoluteAssetUrl(form.bannerUrl)} alt="" className="h-full w-full object-cover" /> : null}
            <span className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-[#0e0f0c] opacity-0 shadow-sm transition group-hover:opacity-100">
              <Camera size={14} /> {t('تعديل الغلاف', 'Edit Cover')}
            </span>
          </button>
          <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="-mt-10 flex items-end gap-4">
              <button type="button" onClick={() => openImageDialog('logoUrl')} className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#DBEAFE] shadow-sm">
                {form.logoUrl ? <img src={toAbsoluteAssetUrl(form.logoUrl)} alt={form.name} className="h-full w-full object-cover" /> : <Building2 size={34} className="text-[#1D4ED8]" />}
                <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-white group-hover:flex"><Camera size={18} /></span>
              </button>
              <div className="pb-1">
                <h2 className="text-2xl font-black text-[#0e0f0c]">{form.name || t('شركة', 'Company')}</h2>
                <p className="text-sm font-semibold text-[#5b5e5a]">{form.industry || t('قطاع غير محدد', 'Industry not set')}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={fillTestData} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-5 py-3 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#f0f1ee]">
                <Wand2 size={16} /> {t('تعبئة بيانات اختبار', 'Fill Test Data')}
              </button>
              <button type="button" onClick={handleSave} disabled={updateMutation.isPending} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9fe870] px-5 py-3 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#80D34F] disabled:opacity-50">
                {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {t('حفظ التغييرات', 'Save Changes')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ContentCard title={t('المعلومات الأساسية', 'Basic Information')} icon={<Building2 size={20} />}>
            <div className="grid grid-cols-1 gap-4">
              <ProfileInput label={t('اسم الشركة', 'Company Name')} value={form.name} onChange={(value) => setField('name', value)} />
              <ProfileInput label={t('الصناعة', 'Industry')} value={form.industry} onChange={(value) => setField('industry', value)} icon={<Tags size={14} />} />
              <ProfileInput label={t('مجالات الصناعة', 'Industry Domains')} value={form.industryDomains} onChange={(value) => setField('industryDomains', value)} hint={t('افصل القيم بفاصلة', 'Comma-separated')} />
              <ProfileInput label={t('التقنيات', 'Technologies')} value={form.technologies} onChange={(value) => setField('technologies', value)} hint={t('افصل القيم بفاصلة', 'Comma-separated')} />
              <ProfileInput label={t('الوصف', 'Description')} value={form.description} onChange={(value) => setField('description', value)} multiline />
            </div>
          </ContentCard>

          <ContentCard title={t('الهوية والتواصل', 'Branding & Contact')} icon={<Palette size={20} />}>
            <div className="grid grid-cols-1 gap-4">
              <ProfileInput label={t('رابط الشعار', 'Logo URL')} value={form.logoUrl} onChange={(value) => setField('logoUrl', value)} icon={<Image size={14} />} action={<button type="button" onClick={() => openImageDialog('logoUrl')} className="text-xs font-bold text-[#1ba442]">{t('تعديل', 'Edit')}</button>} />
              <ProfileInput label={t('رابط الغلاف', 'Banner URL')} value={form.bannerUrl} onChange={(value) => setField('bannerUrl', value)} icon={<Image size={14} />} action={<button type="button" onClick={() => openImageDialog('bannerUrl')} className="text-xs font-bold text-[#1ba442]">{t('تعديل', 'Edit')}</button>} />
              <ProfileInput label={t('الموقع الإلكتروني', 'Website')} value={form.website} onChange={(value) => setField('website', value)} icon={<Globe size={14} />} />
              <ProfileInput label={t('البريد الإلكتروني', 'Email')} value={form.email} onChange={(value) => setField('email', value)} icon={<Mail size={14} />} />
              <ProfileInput label={t('الهاتف', 'Phone')} value={form.phone} onChange={(value) => setField('phone', value)} icon={<Phone size={14} />} />
              <ProfileInput label={t('الموقع', 'Location')} value={form.location} onChange={(value) => setField('location', value)} icon={<MapPin size={14} />} action={<button type="button" onClick={() => setShowLocationPicker(true)} className="text-xs font-bold text-[#1ba442]">{t('اختيار من الخريطة', 'Pick on Map')}</button>} />
            </div>
          </ContentCard>

          <ContentCard title={t('الرؤية والثقافة', 'Mission & Culture')}>
            <div className="grid grid-cols-1 gap-4">
              <ProfileInput label={t('الرسالة', 'Mission')} value={form.mission} onChange={(value) => setField('mission', value)} multiline />
              <ProfileInput label={t('الرؤية', 'Vision')} value={form.vision} onChange={(value) => setField('vision', value)} multiline />
              <ProfileInput label={t('القيم', 'Values')} value={form.values} onChange={(value) => setField('values', value)} hint={t('افصل القيم بفاصلة', 'Comma-separated')} />
              <ProfileInput label={t('المزايا', 'Benefits')} value={form.benefits} onChange={(value) => setField('benefits', value)} hint={t('افصل القيم بفاصلة', 'Comma-separated')} />
            </div>
          </ContentCard>

          <ContentCard title={t('الروابط الاجتماعية', 'Social Links')} icon={<Globe size={20} />}>
            <div className="mb-4 flex flex-wrap gap-2">
              {activeSocialLinks.map((item) => (
                <span key={item.key} className="inline-flex items-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-3 py-2 text-xs font-bold text-[#0e0f0c]">
                  <a href={form[item.key]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-[#1ba442]">{item.icon}{item.label}<ExternalLink size={12} /></a>
                  <button type="button" onClick={() => setField(item.key, '')} className="text-[#828782] hover:text-[#dc2626]"><Trash2 size={12} /></button>
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4">
              {socialMeta.map((item) => (
                <ProfileInput key={item.key} label={item.label} value={form[item.key]} onChange={(value) => setField(item.key, value)} icon={item.icon} />
              ))}
            </div>
          </ContentCard>
        </div>
      </div>

      {imageTarget && (
        <Modal title={imageTarget === 'logoUrl' ? t('تعديل الشعار', 'Edit Logo') : t('تعديل الغلاف', 'Edit Cover')} onClose={closeImageDialog}>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(event) => handleUpload(event.target.files?.[0])} />
          <div className="space-y-4">
            <div className="flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-[#f0f1ee]">
              {imageUrlDraft ? <img src={toAbsoluteAssetUrl(imageUrlDraft)} alt="" className="h-full w-full object-cover" /> : <Image size={42} className="text-[#828782]" />}
            </div>
            <ProfileInput label={t('رابط الصورة', 'Image URL')} value={imageUrlDraft} onChange={setImageUrlDraft} />
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadImage.isPending} className="rounded-full border border-[#dfe1dd] px-4 py-2 text-sm font-bold text-[#0e0f0c] hover:bg-[#f0f1ee]">
                {uploadImage.isPending ? t('جاري الرفع...', 'Uploading...') : t('رفع صورة', 'Upload Image')}
              </button>
              <button type="button" onClick={() => setImageUrlDraft('')} className="rounded-full border border-[#FEE2E2] px-4 py-2 text-sm font-bold text-[#dc2626] hover:bg-[#FEE2E2]">{t('حذف', 'Delete')}</button>
              <button type="button" onClick={saveImageDialog} className="rounded-full bg-[#9fe870] px-4 py-2 text-sm font-bold text-[#0e0f0c] hover:bg-[#80D34F]">{t('حفظ', 'Save')}</button>
            </div>
          </div>
        </Modal>
      )}

      {showLocationPicker && (
        <Modal title={t('اختيار موقع الشركة', 'Pick Company Location')} onClose={() => setShowLocationPicker(false)}>
          <div className="space-y-4">
            <ProfileInput label={t('العنوان', 'Formatted Address')} value={form.location} onChange={(value) => setField('location', value)} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ProfileInput label={t('خط العرض', 'Latitude')} value={form.latitude} onChange={(value) => setField('latitude', value)} />
              <ProfileInput label={t('خط الطول', 'Longitude')} value={form.longitude} onChange={(value) => setField('longitude', value)} />
            </div>
            <iframe
              title="Google Maps"
              src={`https://www.google.com/maps?q=${encodeURIComponent(form.latitude && form.longitude ? `${form.latitude},${form.longitude}` : form.location || 'Riyadh Saudi Arabia')}&output=embed`}
              className="h-72 w-full rounded-2xl border border-[#dfe1dd]"
              loading="lazy"
            />
            <div className="flex flex-wrap justify-between gap-2">
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.location || 'Riyadh Saudi Arabia')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#dfe1dd] px-4 py-2 text-sm font-bold text-[#0e0f0c] hover:bg-[#f0f1ee]">
                <MapPin size={16} /> {t('فتح Google Maps', 'Open Google Maps')}
              </a>
              <button type="button" onClick={() => setShowLocationPicker(false)} className="rounded-full bg-[#9fe870] px-4 py-2 text-sm font-bold text-[#0e0f0c] hover:bg-[#80D34F]">{t('حفظ الموقع', 'Save Location')}</button>
            </div>
          </div>
        </Modal>
      )}
    </PortalLayout>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-black text-[#0e0f0c]">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#828782] hover:bg-[#f0f1ee]"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ProfileInput({
  label, value, onChange, icon, hint, multiline = false, action,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  hint?: string;
  multiline?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <label className="block rounded-xl bg-[#f0f1ee] p-3">
      <span className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#828782]">
        <span>{label}</span>
        {action}
      </span>
      <div className="relative mt-2">
        {icon && !multiline ? <span className="absolute left-3 top-3 text-[#828782]">{icon}</span> : null}
        {multiline ? (
          <textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-[104px] w-full resize-none rounded-xl border border-[#dfe1dd] bg-white p-3 text-sm font-semibold text-[#0e0f0c] outline-none focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]" />
        ) : (
          <input value={value} onChange={(event) => onChange(event.target.value)} className={`h-11 w-full rounded-xl border border-[#dfe1dd] bg-white p-3 text-sm font-semibold text-[#0e0f0c] outline-none focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8] ${icon ? 'pl-9' : ''}`} />
        )}
      </div>
      {hint ? <span className="mt-1 block text-[10px] font-semibold text-[#828782]">{hint}</span> : null}
    </label>
  );
}
