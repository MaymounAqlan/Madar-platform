import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import {
  AlertTriangle, Building2, CheckCircle2, Clock3, FileText, Globe2, Loader2, Mail,
  Phone, RefreshCw, Save, Shield, User, XCircle,
} from 'lucide-react';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyStaffProfile, useUpdateMyStaffProfile } from '@/hooks/useUniversity';
import type { UpdateStaffProfileRequest } from '@/types/university.types';
import { getRoleLabel } from '@/constants/roleLabels';
import DevelopmentAutofillButton from '@/components/DevelopmentAutofillButton';
import { generateCoordinatorProfileTestData } from '@/utils/testDataGenerator';

const emptyStaffForm: Required<UpdateStaffProfileRequest> = {
  firstName: '', lastName: '', firstNameAr: '', lastNameAr: '', phone: '',
  jobTitle: '', biography: '', avatar: '', language: 'ar',
};

function messageFromError(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : typeof message === 'string' ? message : fallback;
}

export default function CoordinatorProfile() {
  const { t, language } = useLanguage();
  const profileQuery = useMyStaffProfile(true);
  const updateProfile = useUpdateMyStaffProfile();
  const [form, setForm] = useState<Required<UpdateStaffProfileRequest>>(emptyStaffForm);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!profileQuery.data) return;
    setForm({
      firstName: profileQuery.data.firstName || '',
      lastName: profileQuery.data.lastName || '',
      firstNameAr: profileQuery.data.firstNameAr || '',
      lastNameAr: profileQuery.data.lastNameAr || '',
      phone: profileQuery.data.phone || '',
      jobTitle: profileQuery.data.jobTitle || '',
      biography: profileQuery.data.biography || '',
      avatar: profileQuery.data.avatar || '',
      language: profileQuery.data.language || 'ar',
    });
  }, [profileQuery.data]);

  const reset = () => {
    if (!profileQuery.data) return setForm(emptyStaffForm);
    setForm({
      firstName: profileQuery.data.firstName || '',
      lastName: profileQuery.data.lastName || '',
      firstNameAr: profileQuery.data.firstNameAr || '',
      lastNameAr: profileQuery.data.lastNameAr || '',
      phone: profileQuery.data.phone || '',
      jobTitle: profileQuery.data.jobTitle || '',
      biography: profileQuery.data.biography || '',
      avatar: profileQuery.data.avatar || '',
      language: profileQuery.data.language || 'ar',
    });
    setServerError('');
  };

  const setField = (field: keyof UpdateStaffProfileRequest, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setServerError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError('');
    const payload: UpdateStaffProfileRequest = {
      firstName: form.firstName.trim() || undefined,
      lastName: form.lastName.trim() || undefined,
      firstNameAr: form.firstNameAr.trim() || undefined,
      lastNameAr: form.lastNameAr.trim() || undefined,
      phone: form.phone.trim() || undefined,
      jobTitle: form.jobTitle.trim() || undefined,
      biography: form.biography.trim() || undefined,
      avatar: form.avatar.trim() || undefined,
      language: form.language,
    };
    try {
      await updateProfile.mutateAsync(payload);
      toast.success(t('تم تحديث الملف الشخصي', 'Profile updated'));
    } catch (error) {
      setServerError(messageFromError(error, t('تعذر حفظ الملف الشخصي', 'Unable to save profile')));
    }
  };

  if (profileQuery.isLoading) {
    return (
      <PortalLayout title={t('الملف الشخصي', 'My Profile')} subtitle={t('عرض وتحرير بياناتك الشخصية', 'View and edit your personal information')}>
        <div className="flex h-96 items-center justify-center"><Loader2 size={32} className="animate-spin text-[#9fe870]" /></div>
      </PortalLayout>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <PortalLayout title={t('الملف الشخصي', 'My Profile')} subtitle={t('عرض وتحرير بياناتك الشخصية', 'View and edit your personal information')}>
        <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-2xl border bg-white p-8" style={{ borderColor: '#dfe1dd' }}>
          <AlertTriangle size={30} className="text-red-600" />
          <p className="text-sm font-semibold text-[#5b5e5a]">{t('حدث خطأ أثناء تحميل الملف الشخصي.', 'An error occurred while loading the profile.')}</p>
          <button onClick={() => profileQuery.refetch()} disabled={profileQuery.isFetching} className="inline-flex items-center gap-2 rounded-full bg-[#9fe870] px-4 py-2 text-sm font-semibold disabled:opacity-50"><RefreshCw size={15} className={profileQuery.isFetching ? 'animate-spin' : ''} />{t('إعادة المحاولة', 'Retry')}</button>
        </div>
      </PortalLayout>
    );
  }

  const data = profileQuery.data;
  const inputClass = 'h-11 w-full rounded-xl border bg-white px-3 text-sm font-semibold outline-none focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]';
  const readOnlyClass = 'h-11 w-full rounded-xl border bg-[#f0f1ee] px-3 text-sm font-semibold text-[#5b5e5a] outline-none';
  const roleLabel = getRoleLabel(data.role, language);

  return (
    <PortalLayout title={t('الملف الشخصي', 'My Profile')} subtitle={t('عرض وتحرير بياناتك الشخصية', 'View and edit your personal information')}>
      <form onSubmit={submit} className="space-y-6">
        <ContentCard title={t('المعلومات الشخصية', 'Personal Information')} icon={<User size={18} className="text-[#5b5e5a]" />}>
          <div className="grid gap-5 lg:grid-cols-[140px_1fr]">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border bg-[#f0f1ee]" style={{ borderColor: '#dfe1dd' }}>
              {form.avatar ? <img src={form.avatar} alt={form.firstNameAr || form.firstName} className="h-full w-full object-cover" /> : <User size={38} className="text-[#828782]" />}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><User size={14} />{t('الاسم العربي', 'Arabic Name')}</span><input type="text" value={form.firstNameAr} onChange={(e) => setField('firstNameAr', e.target.value)} className={inputClass} style={{ borderColor: '#dfe1dd' }} /></label>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><User size={14} />{t('الاسم الإنجليزي', 'English Name')}</span><input type="text" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} className={inputClass} style={{ borderColor: '#dfe1dd' }} /></label>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><User size={14} />{t('الاسم الأخير العربي', 'Arabic Last Name')}</span><input type="text" value={form.lastNameAr} onChange={(e) => setField('lastNameAr', e.target.value)} className={inputClass} style={{ borderColor: '#dfe1dd' }} /></label>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><User size={14} />{t('الاسم الأخير الإنجليزي', 'English Last Name')}</span><input type="text" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} className={inputClass} style={{ borderColor: '#dfe1dd' }} /></label>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><Phone size={14} />{t('الهاتف', 'Phone')}</span><input type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} className={inputClass} style={{ borderColor: '#dfe1dd' }} /></label>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><Shield size={14} />{t('المسمى الوظيفي', 'Job Title')}</span><input type="text" value={form.jobTitle} onChange={(e) => setField('jobTitle', e.target.value)} className={inputClass} style={{ borderColor: '#dfe1dd' }} /></label>
              <label className="block md:col-span-2"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><Globe2 size={14} />{t('رابط الصورة الشخصية', 'Profile Image URL')}</span><input type="url" value={form.avatar} onChange={(e) => setField('avatar', e.target.value)} className={inputClass} style={{ borderColor: '#dfe1dd' }} /></label>
              <label className="block md:col-span-2"><span className="mb-2 block text-xs font-bold text-[#5b5e5a]"><FileText size={14} className="inline me-2" />{t('نبذة', 'Biography')}</span><textarea value={form.biography} onChange={(e) => setField('biography', e.target.value)} rows={4} className="w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]" style={{ borderColor: '#dfe1dd' }} /></label>
              <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><Globe2 size={14} />{t('اللغة المفضلة', 'Preferred Language')}</span><select value={form.language} onChange={(e) => setField('language', e.target.value)} className={inputClass}><option value="ar">{t('العربية', 'Arabic')}</option><option value="en">{t('الإنجليزية', 'English')}</option></select></label>
            </div>
          </div>
        </ContentCard>

        <ContentCard title={t('معلومات مؤسسية', 'Institutional Information')} icon={<Building2 size={18} className="text-[#5b5e5a]" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><Shield size={14} />{t('الدور', 'Role')}</span><input type="text" value={roleLabel} readOnly className={readOnlyClass} /></label>
            <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><Building2 size={14} />{t('الجامعة', 'University')}</span><input type="text" value={language === 'ar' ? (data.university.nameAr || data.university.name) : data.university.name} readOnly className={readOnlyClass} /></label>
            <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><Building2 size={14} />{t('الكلية', 'College')}</span><input type="text" value={language === 'ar' ? (data.college?.nameAr || data.college?.name || '') : (data.college?.name || '')} readOnly className={readOnlyClass} /></label>
            <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><Mail size={14} />{t('البريد الإلكتروني', 'Email')}</span><input type="text" value={data.email} readOnly className={readOnlyClass} /></label>
            <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]">{data.isEmailVerified ? <CheckCircle2 size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />}{t('حالة التحقق', 'Verification Status')}</span><input type="text" value={data.isEmailVerified ? t('تم التحقق', 'Verified') : t('غير محقق', 'Not verified')} readOnly className={readOnlyClass} /></label>
            <label className="block"><span className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><Clock3 size={14} />{t('حالة الحساب', 'Account Status')}</span><input type="text" value={data.status === 'active' ? t('نشط', 'Active') : t('معطل', 'Inactive')} readOnly className={readOnlyClass} /></label>
            <div className="md:col-span-2"><span className="mb-2 block text-xs font-bold text-[#5b5e5a]"><Shield size={14} className="inline me-2" />{t('الصلاحيات', 'Permissions')}</span><div className="flex flex-wrap gap-2">{data.permissions.map((permission) => <span key={permission} className="rounded-full bg-[#E7FDD8] px-3 py-1 text-xs font-semibold text-[#167a32]">{permission}</span>)}</div></div>
          </div>
        </ContentCard>

        {serverError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{serverError}</div>}
        <div className="flex flex-wrap justify-end gap-2">
          <DevelopmentAutofillButton onClick={() => { setForm(generateCoordinatorProfileTestData()); setServerError(''); }} label={t('تعبئة بيانات تجريبية', 'Fill Test Data')} />
          <button type="button" onClick={reset} disabled={updateProfile.isPending} className="h-11 rounded-full border px-5 text-sm font-semibold disabled:opacity-50">{t('استرجاع القيم الأصلية', 'Restore Original Values')}</button>
          <button type="submit" disabled={updateProfile.isPending} className="inline-flex h-11 items-center gap-2 rounded-full bg-[#9fe870] px-6 text-sm font-bold text-[#0e0f0c] disabled:opacity-50">{updateProfile.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{t('حفظ التعديلات', 'Save Changes')}</button>
        </div>
      </form>
    </PortalLayout>
  );
}
