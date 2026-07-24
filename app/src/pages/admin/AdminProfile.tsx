import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import {
  AlertTriangle, CheckCircle2, Globe2, Loader2, Mail, Phone, Save, Shield, User, XCircle,
} from 'lucide-react';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth, useUpdateCurrentUser } from '@/hooks/useAuth';
import { getRoleLabel } from '@/constants/roleLabels';

interface AdminProfileForm {
  firstName: string;
  lastName: string;
  firstNameAr: string;
  lastNameAr: string;
  phone: string;
  avatar: string;
  language: 'ar' | 'en';
}

const emptyForm: AdminProfileForm = {
  firstName: '', lastName: '', firstNameAr: '', lastNameAr: '', phone: '', avatar: '', language: 'ar',
};

function messageFromError(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : typeof message === 'string' ? message : fallback;
}

export default function AdminProfile() {
  const { t, language } = useLanguage();
  const { user, isLoading } = useAuth();
  const updateProfile = useUpdateCurrentUser();
  const [form, setForm] = useState<AdminProfileForm>(emptyForm);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      firstNameAr: user.firstNameAr || '',
      lastNameAr: user.lastNameAr || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      language: (user.preferences?.language as 'ar' | 'en') || 'ar',
    });
  }, [user]);

  const reset = () => {
    if (!user) return setForm(emptyForm);
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      firstNameAr: user.firstNameAr || '',
      lastNameAr: user.lastNameAr || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      language: (user.preferences?.language as 'ar' | 'en') || 'ar',
    });
    setServerError('');
  };

  const setField = (field: keyof AdminProfileForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setServerError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError('');
    const payload = {
      firstName: form.firstName.trim() || undefined,
      lastName: form.lastName.trim() || undefined,
      firstNameAr: form.firstNameAr.trim() || undefined,
      lastNameAr: form.lastNameAr.trim() || undefined,
      phone: form.phone.trim() || undefined,
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

  if (isLoading) {
    return (
      <PortalLayout title={t('الملف الشخصي', 'My Profile')} subtitle={t('عرض وتحرير بياناتك الشخصية', 'View and edit your personal information')}>
        <div className="flex h-96 items-center justify-center"><Loader2 size={32} className="animate-spin text-[#9fe870]" /></div>
      </PortalLayout>
    );
  }

  if (!user) {
    return (
      <PortalLayout title={t('الملف الشخصي', 'My Profile')} subtitle={t('عرض وتحرير بياناتك الشخصية', 'View and edit your personal information')}>
        <ContentCard>
          <div className="flex items-center gap-3 rounded-2xl bg-[#FEE2E2] p-4 text-[#B91C1C]">
            <AlertTriangle size={20} />
            <p className="text-sm font-semibold">{t('لم يتم العثور على بيانات المستخدم', 'User data not found')}</p>
          </div>
        </ContentCard>
      </PortalLayout>
    );
  }

  const displayName = [form.firstNameAr, form.lastNameAr].filter(Boolean).join(' ') || [form.firstName, form.lastName].filter(Boolean).join(' ') || user.email;
  const roleLabel = getRoleLabel(user.role, language as 'ar' | 'en');

  return (
    <PortalLayout
      title={t('الملف الشخصي', 'My Profile')}
      subtitle={t('عرض وتحرير بيانات مسؤول النظام', 'View and edit system admin information')}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {serverError && (
          <div className="flex items-center gap-3 rounded-2xl bg-[#FEE2E2] p-4 text-[#B91C1C]">
            <XCircle size={20} />
            <p className="text-sm font-semibold">{serverError}</p>
          </div>
        )}

        <ContentCard
          title={t('معلومات الحساب', 'Account Information')}
          icon={<User size={20} style={{ color: '#5b5e5a' }} />}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2] text-[#B91C1C] text-xl font-black">
              {displayName.charAt(0)}
            </div>
            <div>
              <p className="text-lg font-bold text-[#0e0f0c]">{displayName}</p>
              <p className="text-sm font-medium text-[#B91C1C]">{roleLabel}</p>
              <p className="text-xs text-[#828782]">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#dfe1dd] bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-[#5b5e5a]"><Shield size={16} /> <span className="text-xs font-semibold">{t('الدور', 'Role')}</span></div>
              <p className="text-sm font-bold text-[#0e0f0c]">{roleLabel}</p>
            </div>
            <div className="rounded-2xl border border-[#dfe1dd] bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-[#5b5e5a]"><Mail size={16} /> <span className="text-xs font-semibold">{t('البريد الإلكتروني', 'Email')}</span></div>
              <p className="text-sm font-bold text-[#0e0f0c]">{user.email}</p>
              {user.isEmailVerified && <span className="mt-1 inline-flex items-center gap-1 text-xs text-[#1ba442]"><CheckCircle2 size={12} /> {t('موثق', 'Verified')}</span>}
            </div>
          </div>
        </ContentCard>

        <form onSubmit={submit}>
          <ContentCard
            title={t('تعديل البيانات الشخصية', 'Edit Personal Information')}
            icon={<User size={20} style={{ color: '#5b5e5a' }} />}
            action={
              <div className="flex items-center gap-2">
                <button type="button" onClick={reset} className="rounded-full border border-[#dfe1dd] px-4 py-2 text-xs font-semibold text-[#5b5e5a] hover:bg-[#f0f1ee]">
                  {t('إلغاء', 'Cancel')}
                </button>
                <button type="submit" disabled={updateProfile.isPending} className="inline-flex items-center gap-2 rounded-full bg-[#0e0f0c] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2a2b28] disabled:opacity-50">
                  {updateProfile.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  {t('حفظ', 'Save')}
                </button>
              </div>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5b5e5a]">{t('الاسم الأول بالعربية', 'First Name (Arabic)')}</label>
                <input type="text" value={form.firstNameAr} onChange={(e) => setField('firstNameAr', e.target.value)} className="h-12 w-full rounded-xl border border-[#dfe1dd] px-4 text-sm font-semibold outline-none focus:border-[#9fe870] focus:ring-1 focus:ring-[#9fe870]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5b5e5a]">{t('الاسم الأخير بالعربية', 'Last Name (Arabic)')}</label>
                <input type="text" value={form.lastNameAr} onChange={(e) => setField('lastNameAr', e.target.value)} className="h-12 w-full rounded-xl border border-[#dfe1dd] px-4 text-sm font-semibold outline-none focus:border-[#9fe870] focus:ring-1 focus:ring-[#9fe870]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5b5e5a]">{t('الاسم الأول بالإنجليزية', 'First Name (English)')}</label>
                <input type="text" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} className="h-12 w-full rounded-xl border border-[#dfe1dd] px-4 text-sm font-semibold outline-none focus:border-[#9fe870] focus:ring-1 focus:ring-[#9fe870]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5b5e5a]">{t('الاسم الأخير بالإنجليزية', 'Last Name (English)')}</label>
                <input type="text" value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} className="h-12 w-full rounded-xl border border-[#dfe1dd] px-4 text-sm font-semibold outline-none focus:border-[#9fe870] focus:ring-1 focus:ring-[#9fe870]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5b5e5a]">{t('رقم الهاتف', 'Phone')}</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#828782]" />
                  <input type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} className="h-12 w-full rounded-xl border border-[#dfe1dd] pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#9fe870] focus:ring-1 focus:ring-[#9fe870]" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5b5e5a]">{t('اللغة المفضلة', 'Preferred Language')}</label>
                <div className="relative">
                  <Globe2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#828782]" />
                  <select value={form.language} onChange={(e) => setField('language', e.target.value)} className="h-12 w-full rounded-xl border border-[#dfe1dd] bg-white pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#9fe870] focus:ring-1 focus:ring-[#9fe870]">
                    <option value="ar">العربية</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[#5b5e5a]">{t('رابط الصورة الشخصية', 'Profile Image URL')}</label>
                <input type="url" value={form.avatar} onChange={(e) => setField('avatar', e.target.value)} placeholder="https://..." className="h-12 w-full rounded-xl border border-[#dfe1dd] px-4 text-sm font-semibold outline-none focus:border-[#9fe870] focus:ring-1 focus:ring-[#9fe870]" />
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-[#FEF3C7] p-4 text-[#B45309]">
              <p className="text-xs font-semibold">{t('لا يمكنك تغيير دورك أو صلاحياتك من هذه الصفحة.', 'You cannot change your role or permissions from this page.')}</p>
            </div>
          </ContentCard>
        </form>
      </div>
    </PortalLayout>
  );
}
