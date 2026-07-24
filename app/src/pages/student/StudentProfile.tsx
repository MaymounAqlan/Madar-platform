import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { useStudentProfile, useUpdateProfile, useUploadCV, useUploadStudentAvatar, useUploadStudentCoverImage } from '@/hooks/useStudent';
import type { StudentProfile as StudentProfileData } from '@/types/api.types';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  User, GraduationCap, BookOpen, FolderOpen, Award, FileText,
  Mail, Phone, Edit3, Upload, CheckCircle2, Sparkles, Loader2,
  Camera, MapPin, CalendarDays, Landmark, Github, Linkedin, Facebook,
  Instagram, Youtube, Globe2, MessageCircle, ExternalLink, Eye, X,
} from 'lucide-react';
import AcademicReferenceCombobox from '@/components/AcademicReferenceCombobox';
import StudentLocationPicker from '@/components/StudentLocationPicker';
import { universityApi } from '@/services/universityApi';
import type { PublicAcademicOption } from '@/types/university.types';

type SocialLinkKey = keyof NonNullable<StudentProfileData['socialLinks']>;

const SOCIAL_LINK_DEFINITIONS: Array<{
  key: SocialLinkKey;
  labelAr: string;
  labelEn: string;
  icon: typeof Globe2;
}> = [
  { key: 'linkedin', labelAr: 'لينكدإن', labelEn: 'LinkedIn', icon: Linkedin },
  { key: 'github', labelAr: 'جيت هاب', labelEn: 'GitHub', icon: Github },
  { key: 'portfolio', labelAr: 'معرض الأعمال', labelEn: 'Portfolio', icon: Globe2 },
  { key: 'website', labelAr: 'الموقع الشخصي', labelEn: 'Website', icon: Globe2 },
  { key: 'facebook', labelAr: 'فيسبوك', labelEn: 'Facebook', icon: Facebook },
  { key: 'twitter', labelAr: 'إكس / تويتر', labelEn: 'X / Twitter', icon: ExternalLink },
  { key: 'instagram', labelAr: 'إنستغرام', labelEn: 'Instagram', icon: Instagram },
  { key: 'youtube', labelAr: 'يوتيوب', labelEn: 'YouTube', icon: Youtube },
  { key: 'behance', labelAr: 'بيهانس', labelEn: 'Behance', icon: Globe2 },
  { key: 'dribbble', labelAr: 'دريبل', labelEn: 'Dribbble', icon: Globe2 },
  { key: 'stackOverflow', labelAr: 'Stack Overflow', labelEn: 'Stack Overflow', icon: Globe2 },
  { key: 'researchGate', labelAr: 'ResearchGate', labelEn: 'ResearchGate', icon: Globe2 },
  { key: 'orcid', labelAr: 'ORCID', labelEn: 'ORCID', icon: Globe2 },
];

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function getWhatsAppUrl(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

function isValidExternalUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(normalizeExternalUrl(value));
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function LoadingSpinner() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#9fe870]" />
    </div>
  );
}

function displayValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim();
    return text === '[object Object]' ? '' : text;
  }
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    return displayValue(
      value.name
      ?? value.title
      ?? value.skillName
      ?? value.label
      ?? value.value
      ?? value.description
      ?? value.provider
      ?? value.issuer
    );
  }
  return '';
}

function listToText(items?: Array<{ name?: string; title?: string }> | string[]) {
  if (!items) return '';
  return items
    .map(displayValue)
    .filter(Boolean)
    .join(', ');
}

const EMPTY_SOCIAL_LINKS: Record<SocialLinkKey, string> = {
  linkedin: '', github: '', portfolio: '', website: '', facebook: '', twitter: '', instagram: '',
  youtube: '', behance: '', dribbble: '', stackOverflow: '', researchGate: '', orcid: '',
};

function getStudentForm(student?: StudentProfileData) {
  return {
    firstName: student?.firstName || '',
    lastName: student?.lastName || '',
    email: student?.email || '',
    phone: student?.phone || '',
    whatsapp: student?.whatsapp || '',
    address: student?.address || student?.location || '',
    latitude: student?.coordinates?.lat ?? null,
    longitude: student?.coordinates?.lng ?? null,
    avatar: student?.avatar || '',
    university: student?.university || '',
    universityId: student?.universityInfo?.id || '',
    college: student?.college || '',
    collegeId: student?.collegeInfo?.id || '',
    department: student?.department || '',
    departmentId: student?.departmentInfo?.id || '',
    major: student?.major || student?.majorInfo?.name || '',
    majorId: student?.majorInfo?.id || '',
    academicLevel: student?.academicLevel || 'freshman',
    skills: listToText(student?.skills),
    interests: (student?.interests || []).join(', '),
    projects: listToText(student?.projects),
    certifications: listToText(student?.certifications),
    courses: listToText(student?.courses),
    socialLinks: { ...EMPTY_SOCIAL_LINKS, ...(student?.socialLinks || {}) },
  };
}

function ExtractedList({ title, items }: { title: string; items?: any[] }) {
  const values = (items || []).map(displayValue).filter(Boolean);
  if (!values.length) return null;
  return (
    <div className="rounded-xl border border-[#dfe1dd] bg-white p-4 text-start">
      <p className="text-xs font-semibold text-[#5b5e5a]">{title}</p>
      <ul className="mt-3 space-y-2">
        {values.map((item, index) => (
          <li key={`${item}-${index}`} className="flex items-start gap-2 text-xs leading-5 text-[#0e0f0c]">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#9fe870]" aria-hidden="true" />
            <span className="min-w-0 break-words" dir="auto">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function resolveAssetUrl(value?: string | null) {
  const path = value?.trim();
  if (!path || typeof window === 'undefined') return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const origin = /^https?:/i.test(apiBase) ? new URL(apiBase).origin : window.location.origin;
  return new URL(path, `${origin}/`).toString();
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  return `${words[0]?.[0] || ''}${words.length > 1 ? words[words.length - 1]?.[0] || '' : ''}`.toUpperCase();
}

function StudentProfileHeader({ student }: { student: StudentProfileData }) {
  const { t, isRTL } = useLanguage();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const uploadAvatarMutation = useUploadStudentAvatar();
  const uploadCoverMutation = useUploadStudentCoverImage();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [coverLoadFailed, setCoverLoadFailed] = useState(false);
  const [universityLogoFailed, setUniversityLogoFailed] = useState(false);

  const fullName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || t('طالب', 'Student');
  const departmentName = (isRTL ? student.departmentInfo?.nameAr : student.departmentInfo?.name)
    || (isRTL ? student.departmentAr : student.department)
    || student.departmentInfo?.name
    || student.department
    || '';
  const collegeName = (isRTL ? student.collegeInfo?.nameAr : student.collegeInfo?.name)
    || (isRTL ? student.collegeAr : student.college)
    || student.collegeInfo?.name
    || student.college
    || '';
  const universityName = (isRTL ? student.universityInfo?.nameAr : student.universityInfo?.name)
    || student.universityInfo?.name
    || '';
  const professionalTitle = student.professionalTitle
    || (departmentName ? t(`طالب ${departmentName}`, `${departmentName} Student`) : t('طالب جامعي', 'University Student'));
  const avatarSource = avatarPreview || resolveAssetUrl(student.avatar);
  const coverSource = coverPreview || resolveAssetUrl(student.coverImage);
  const universityLogo = resolveAssetUrl(student.universityInfo?.logoUrl);
  const completion = Math.min(100, Math.max(0, Number(student.profileCompletion) || 0));
  const academicLevelLabels: Record<string, [string, string]> = {
    freshman: ['السنة الأولى', 'Freshman'],
    sophomore: ['السنة الثانية', 'Sophomore'],
    junior: ['السنة الثالثة', 'Junior'],
    senior: ['السنة الأخيرة', 'Senior'],
    graduate: ['خريج', 'Graduate'],
  };
  const academicLevel = student.academicLevel
    ? t(...(academicLevelLabels[student.academicLevel] || [student.academicLevel, student.academicLevel]))
    : '';
  const contactItems = [
    student.email ? { key: 'email', label: t('البريد الإلكتروني', 'Email'), value: student.email, href: `mailto:${student.email}`, icon: Mail, showValue: true } : null,
    student.phone ? { key: 'phone', label: t('رقم الهاتف', 'Phone'), value: student.phone, href: `tel:${student.phone}`, icon: Phone, showValue: true } : null,
    student.whatsapp ? { key: 'whatsapp', label: t('واتساب', 'WhatsApp'), value: student.whatsapp, href: getWhatsAppUrl(student.whatsapp), icon: MessageCircle, showValue: true } : null,
    ...SOCIAL_LINK_DEFINITIONS.map((definition) => {
      const value = student.socialLinks?.[definition.key]?.trim();
      return value ? {
        key: definition.key,
        label: isRTL ? definition.labelAr : definition.labelEn,
        value,
        href: normalizeExternalUrl(value),
        icon: definition.icon,
        showValue: false,
      } : null;
    }),
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    value: string;
    href: string;
    icon: typeof Globe2;
    showValue: boolean;
  }>;

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarSource]);

  useEffect(() => {
    setCoverLoadFailed(false);
  }, [coverSource]);

  useEffect(() => {
    setUniversityLogoFailed(false);
  }, [universityLogo]);

  useEffect(() => () => {
    if (avatarPreview?.startsWith('blob:')) URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  useEffect(() => () => {
    if (coverPreview?.startsWith('blob:')) URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(file.type)) {
      toast.error(t('اختر صورة بصيغة JPEG أو PNG أو WebP', 'Choose a JPEG, PNG, or WebP image'));
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('حجم الصورة يجب ألا يتجاوز 5 ميجابايت', 'Image size must not exceed 5MB'));
      event.target.value = '';
      return;
    }

    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setAvatarLoadFailed(false);
    try {
      await uploadAvatarMutation.mutateAsync(file);
      setAvatarPreview(null);
      toast.success(t('تم تحديث الصورة الشخصية', 'Profile photo updated'));
    } catch (error: any) {
      setAvatarPreview(null);
      toast.error(error?.response?.data?.message || error?.message || t('تعذر تحديث الصورة الشخصية', 'Could not update profile photo'));
    } finally {
      event.target.value = '';
    }
  };

  const handleCoverSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(file.type)) {
      toast.error(t('اختر صورة بصيغة JPEG أو PNG أو WebP', 'Choose a JPEG, PNG, or WebP image'));
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('حجم الصورة يجب ألا يتجاوز 5 ميجابايت', 'Image size must not exceed 5MB'));
      event.target.value = '';
      return;
    }

    const preview = URL.createObjectURL(file);
    setCoverPreview(preview);
    setCoverLoadFailed(false);
    try {
      await uploadCoverMutation.mutateAsync(file);
      setCoverPreview(null);
      toast.success(t('تم تحديث صورة الغلاف', 'Cover image updated'));
    } catch (error: any) {
      setCoverPreview(null);
      toast.error(error?.response?.data?.message || error?.message || t('تعذر تحديث صورة الغلاف', 'Could not update cover image'));
    } finally {
      event.target.value = '';
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-[#dfe1dd] bg-white shadow-sm" aria-labelledby="student-profile-name">
      <button
        type="button"
        aria-label={t('تغيير صورة الغلاف', 'Change cover image')}
        aria-busy={uploadCoverMutation.isPending}
        disabled={uploadCoverMutation.isPending}
        onClick={() => coverInputRef.current?.click()}
        className="group relative block h-28 w-full overflow-hidden bg-[#f0f1ee] text-[#0e0f0c] outline-none transition focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#9fe870]/70 disabled:cursor-wait sm:h-36"
      >
        {coverSource && !coverLoadFailed && (
          <img
            src={coverSource}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setCoverLoadFailed(true)}
          />
        )}
        <span className="absolute inset-0 hidden items-center justify-center bg-[#0e0f0c]/0 text-white transition group-hover:bg-[#0e0f0c]/30 group-focus-visible:bg-[#0e0f0c]/30 sm:flex" aria-hidden="true">
          {uploadCoverMutation.isPending ? (
            <Loader2 size={26} className="animate-spin" />
          ) : (
            <Camera size={24} className="opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" />
          )}
        </span>
        <span className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-[#dfe1dd] bg-white/95 text-[#0e0f0c] shadow-sm sm:hidden" aria-hidden="true">
          {uploadCoverMutation.isPending ? <Loader2 size={19} className="animate-spin" /> : <Camera size={19} />}
        </span>
      </button>
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        onChange={handleCoverSelect}
      />
      <div className="relative px-4 pb-6 sm:px-6 lg:px-8">
        <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-6 lg:grid-cols-[auto_minmax(0,1fr)_minmax(220px,280px)] lg:items-end lg:gap-x-8">
          <div className="-mt-12 flex justify-center sm:justify-start">
            <button
              type="button"
              aria-label={t('تغيير الصورة الشخصية', 'Change profile photo')}
              aria-busy={uploadAvatarMutation.isPending}
              disabled={uploadAvatarMutation.isPending}
              onClick={() => avatarInputRef.current?.click()}
              className="group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#e7e9e5] text-xl font-bold text-[#5b5e5a] shadow-sm outline-none transition focus-visible:ring-4 focus-visible:ring-[#9fe870]/60 disabled:cursor-wait sm:h-28 sm:w-28"
            >
              {avatarSource && !avatarLoadFailed ? (
                <img
                  src={avatarSource}
                  alt={t(`الصورة الشخصية لـ ${fullName}`, `${fullName}'s profile photo`)}
                  className="h-full w-full object-cover"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : getInitials(fullName) ? (
                <span aria-hidden="true">{getInitials(fullName)}</span>
              ) : (
                <User size={36} aria-hidden="true" />
              )}
              <span className="absolute inset-0 hidden items-center justify-center bg-[#0e0f0c]/0 text-white transition group-hover:bg-[#0e0f0c]/35 group-focus-visible:bg-[#0e0f0c]/35 sm:flex">
                {uploadAvatarMutation.isPending ? (
                  <Loader2 size={24} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Camera size={22} className="opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
                )}
              </span>
              <span className="absolute bottom-0 end-0 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-[#0e0f0c] text-white sm:hidden" aria-hidden="true">
                {uploadAvatarMutation.isPending ? <Loader2 size={19} className="animate-spin" /> : <Camera size={19} />}
              </span>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              tabIndex={-1}
              onChange={handleAvatarSelect}
            />
          </div>

          <div className="min-w-0 text-center sm:pt-3 sm:text-start lg:pt-0">
            <h2 id="student-profile-name" className="break-words text-2xl font-bold leading-tight text-[#0e0f0c] sm:text-[28px]" title={fullName}>
              {fullName}
            </h2>
            <p className="mt-1 break-words text-sm font-medium text-[#5b5e5a] sm:text-base" title={professionalTitle}>
              {professionalTitle}
            </p>

            {contactItems.length > 0 && (
              <div className="mt-3 flex min-w-0 flex-wrap justify-center gap-2 sm:justify-start" aria-label={t('وسائل التواصل', 'Contact links')}>
                {contactItems.map((item) => {
                  const Icon = item.icon;
                  const external = item.href.startsWith('http');
                  return (
                    <a
                      key={item.key}
                      href={item.href}
                      target={external ? '_blank' : undefined}
                      rel={external ? 'noopener noreferrer' : undefined}
                      aria-label={`${item.label}: ${item.value}`}
                      title={`${item.label}: ${item.value}`}
                      className="inline-flex min-h-11 min-w-11 max-w-full items-center justify-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-3 text-xs font-medium text-[#5b5e5a] transition hover:border-[#9fe870] hover:text-[#0e0f0c] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/50"
                    >
                      <Icon size={17} className="shrink-0" aria-hidden="true" />
                      {item.showValue && <span className="hidden max-w-40 truncate lg:inline" dir="auto">{item.value}</span>}
                    </a>
                  );
                })}
              </div>
            )}

            <div className="mx-auto mt-4 flex max-w-xl min-w-0 items-center gap-3 text-start sm:mx-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#dfe1dd] bg-[#f0f1ee]">
                {universityLogo && !universityLogoFailed ? (
                  <img
                    src={universityLogo}
                    alt={universityName ? t(`شعار ${universityName}`, `${universityName} logo`) : t('شعار الجامعة', 'University logo')}
                    className="h-full w-full object-contain p-1"
                    onError={() => setUniversityLogoFailed(true)}
                  />
                ) : (
                  <Landmark size={22} className="text-[#5b5e5a]" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {student.universityInfo?.id && universityName ? (
                  <>
                    <p className="break-words text-sm font-semibold text-[#0e0f0c]" title={universityName}>{universityName}</p>
                    {(collegeName || departmentName) && (
                      <p className="mt-0.5 flex min-w-0 items-start gap-1.5 break-words text-xs leading-5 text-[#5b5e5a]" title={[collegeName, departmentName].filter(Boolean).join(' - ')}>
                        <BookOpen size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <span>{[collegeName, departmentName].filter(Boolean).join(' - ')}</span>
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm font-medium text-[#5b5e5a]">{t('لم يتم ربط جامعة بالحساب', 'No university is linked to this account')}</p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-[#5b5e5a] sm:justify-start">
              {academicLevel && (
                <span className="inline-flex min-h-6 items-center gap-1.5">
                  <GraduationCap size={15} aria-hidden="true" />
                  {academicLevel}
                </span>
              )}
              {student.graduationYear && (
                <span className="inline-flex min-h-6 items-center gap-1.5">
                  <CalendarDays size={15} aria-hidden="true" />
                  {t(`التخرج المتوقع ${student.graduationYear}`, `Expected graduation ${student.graduationYear}`)}
                </span>
              )}
              {student.location && (
                <span className="inline-flex min-h-6 items-center gap-1.5 break-words" title={student.location}>
                  <MapPin size={15} className="shrink-0" aria-hidden="true" />
                  {student.location}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0 border-t border-[#e6e8e4] pt-5 sm:col-span-2 lg:col-span-1 lg:border-s lg:border-t-0 lg:pb-1 lg:ps-6 lg:pt-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-[#5b5e5a]">{t('اكتمال الملف', 'Profile completion')}</span>
              <span className="text-sm font-bold text-[#0e0f0c]">{completion}%</span>
            </div>
            <div
              className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[#e7e9e5]"
              role="progressbar"
              aria-label={t('نسبة اكتمال الملف', 'Profile completion percentage')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completion}
            >
              <div className="h-full rounded-full bg-[#9fe870] transition-[width] duration-500" style={{ width: `${completion}%` }} />
            </div>
            {completion < 100 && (
              <p className="mt-2 text-xs leading-5 text-[#5b5e5a]">
                {t('أكمل بيانات الخبرة والمهارات لتحسين فرص المطابقة', 'Complete your experience and skills to improve matching opportunities')}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function StudentProfile() {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState('personal');
  const [editing, setEditing] = useState(false);
  const [isDraggingCV, setIsDraggingCV] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const { data: student, isLoading } = useStudentProfile();
  const updateMutation = useUpdateProfile();
  const uploadCVMutation = useUploadCV();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(() => getStudentForm());
  const [universities, setUniversities] = useState<PublicAcademicOption[]>([]);
  const [colleges, setColleges] = useState<PublicAcademicOption[]>([]);
  const [departments, setDepartments] = useState<PublicAcademicOption[]>([]);
  const [majors, setMajors] = useState<PublicAcademicOption[]>([]);
  const [universitySearch, setUniversitySearch] = useState('');
  const [academicLoading, setAcademicLoading] = useState({ universities: false, colleges: false, departments: false, majors: false });
  const [academicError, setAcademicError] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!student) return;
    setForm(getStudentForm(student));
  }, [student]);

  const loadUniversities = () => {
    setAcademicLoading((value) => ({ ...value, universities: true }));
    universityApi.searchReferenceUniversities({ search: universitySearch || undefined, limit: 20 }).then((page) => { setUniversities(page.items); setAcademicError((value) => ({ ...value, universities: '' })); }).catch(() => setAcademicError((value) => ({ ...value, universities: t('تعذر تحميل الجامعات', 'Unable to load universities') }))).finally(() => setAcademicLoading((value) => ({ ...value, universities: false })));
  };

  useEffect(() => {
    if (!editing) return;
    const timer = window.setTimeout(loadUniversities, 300);
    return () => window.clearTimeout(timer);
  }, [editing, universitySearch]);
  useEffect(() => {
    if (!editing || !form.universityId) { if (!form.universityId) setColleges([]); return; }
    setAcademicLoading((value) => ({ ...value, colleges: true }));
    universityApi.getReferenceColleges(form.universityId, { limit: 100 }).then((page) => { setColleges(page.items); setAcademicError((value) => ({ ...value, colleges: '' })); }).catch(() => setAcademicError((value) => ({ ...value, colleges: t('تعذر تحميل الكليات', 'Unable to load colleges') }))).finally(() => setAcademicLoading((value) => ({ ...value, colleges: false })));
  }, [editing, form.universityId]);
  useEffect(() => {
    if (!editing || !form.collegeId) { if (!form.collegeId) setDepartments([]); return; }
    setAcademicLoading((value) => ({ ...value, departments: true }));
    universityApi.getReferenceDepartments(form.collegeId, { limit: 100 }).then((page) => { setDepartments(page.items); setAcademicError((value) => ({ ...value, departments: '' })); }).catch(() => setAcademicError((value) => ({ ...value, departments: t('تعذر تحميل الأقسام', 'Unable to load departments') }))).finally(() => setAcademicLoading((value) => ({ ...value, departments: false })));
  }, [editing, form.collegeId]);
  useEffect(() => {
    if (!editing || !form.departmentId) { if (!form.departmentId) setMajors([]); return; }
    setAcademicLoading((value) => ({ ...value, majors: true }));
    universityApi.getReferenceMajors(form.departmentId, { limit: 100 }).then((page) => { setMajors(page.items); setAcademicError((value) => ({ ...value, majors: '' })); }).catch(() => setAcademicError((value) => ({ ...value, majors: t('تعذر تحميل التخصصات', 'Unable to load majors') }))).finally(() => setAcademicLoading((value) => ({ ...value, majors: false })));
  }, [editing, form.departmentId]);

  const uploadCVFile = async (file?: File) => {
    if (!file) return;
    const validExtension = /\.(pdf|docx)$/i.test(file.name);
    const validType = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type);
    if (!validExtension || !validType) {
      toast.error(t('اختر ملف PDF أو DOCX صالحاً', 'Choose a valid PDF or DOCX file'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('حجم الملف يجب أن يكون أقل من 10 ميجا', 'File size must be less than 10MB'));
      return;
    }

    try {
      await uploadCVMutation.mutateAsync(file);
      toast.success(t('تم رفع السيرة الذاتية وتحليلها بنجاح', 'CV uploaded and analyzed successfully'));
    } catch (err: any) {
      const errorCode = err?.response?.data?.code;
      const errorMessage = err?.response?.data?.message;
      toast.error(
        errorCode === 'CV_DUPLICATE_FILE' || errorCode === 'CV_ANALYSIS_ALREADY_QUEUED'
          ? t('تم رفع ملف السيرة الذاتية نفسه مسبقاً', 'This CV file has already been uploaded')
          : errorMessage || err?.message || t('فشل رفع الملف', 'Failed to upload file'),
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    void uploadCVFile(event.target.files?.[0]);
  };

  const handleCVDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDraggingCV(false);
    if (!uploadCVMutation.isPending) void uploadCVFile(event.dataTransfer.files?.[0]);
  };

  const handleSave = async () => {
    const invalidSocialLink = SOCIAL_LINK_DEFINITIONS.find(({ key }) => !isValidExternalUrl(form.socialLinks[key]));
    if (invalidSocialLink) {
      toast.error(t(
        `تحقق من رابط ${invalidSocialLink.labelAr}`,
        `Check the ${invalidSocialLink.labelEn} URL`,
      ));
      return;
    }
    if (form.whatsapp && !/^\+?[0-9]{7,15}$/.test(form.whatsapp)) {
      toast.error(t('أدخل رقم واتساب صحيحاً مع رمز الدولة', 'Enter a valid WhatsApp number with country code'));
      return;
    }
    try {
      await updateMutation.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        whatsapp: form.whatsapp,
        address: form.address,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        socialLinks: Object.fromEntries(
          Object.entries(form.socialLinks).map(([key, value]) => [key, value ? normalizeExternalUrl(value) : '']),
        ),
        avatar: form.avatar,
        universityId: form.universityId || undefined,
        collegeId: form.collegeId || undefined,
        departmentId: form.departmentId || undefined,
        majorId: form.majorId || undefined,
        university: form.university,
        college: form.college,
        department: form.department,
        academicLevel: form.academicLevel,
        skills: form.skills.split(',').map((name) => name.trim()).filter(Boolean).map((name) => ({ name, level: 70 })),
        interests: form.interests.split(',').map((name) => name.trim()).filter(Boolean),
        projects: form.projects.split(',').map((title) => title.trim()).filter(Boolean).map((title) => ({ title, description: '', technologies: [] })),
        certifications: form.certifications.split(',').map((name) => name.trim()).filter(Boolean).map((name) => ({ name, issuer: '' })),
        courses: form.courses.split(',').map((name) => name.trim()).filter(Boolean).map((name) => ({ name })),
      });
      toast.success(t('تم حفظ التغييرات', 'Changes saved successfully'));
      setEditing(false);
    } catch (err: any) {
      toast.error(err?.message || t('فشل الحفظ', 'Failed to save'));
    }
  };

  const cancelEditing = () => {
    setForm(getStudentForm(student));
    setEditing(false);
  };

  if (isLoading || !student) return <LoadingSpinner />;

  const hasCV = !!student.cvData?.fileUrl;
  const parsedData = student.cvData?.parsedData;
  const activeSocialLinks = SOCIAL_LINK_DEFINITIONS
    .map((definition) => ({ ...definition, value: student.socialLinks?.[definition.key]?.trim() || '' }))
    .filter((item) => item.value);
  const tabItems = [
    { key: 'personal', labelAr: 'المعلومات الشخصية', labelEn: 'Personal Info', icon: <User size={16} /> },
    { key: 'academic', labelAr: 'الأكاديمي', labelEn: 'Academic', icon: <GraduationCap size={16} /> },
    { key: 'skills', labelAr: 'المهارات', labelEn: 'Skills', icon: <BookOpen size={16} /> },
    { key: 'projects', labelAr: 'المشاريع', labelEn: 'Projects', icon: <FolderOpen size={16} /> },
    { key: 'certifications', labelAr: 'الشهادات', labelEn: 'Certifications', icon: <Award size={16} /> },
    { key: 'cv', labelAr: 'السيرة الذاتية', labelEn: 'CV', icon: <FileText size={16} /> },
  ];

  return (
    <PortalLayout title={t('الملف الشخصي', 'Profile')}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className={cn('space-y-6', isRTL ? 'rtl' : 'ltr')}>
        <StudentProfileHeader student={student} />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end" aria-label={t('إجراءات الملف الشخصي', 'Profile actions')}>
          {editing ? (
            <>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={updateMutation.isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#5b5e5a] transition hover:bg-[#f0f1ee] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/40 disabled:opacity-50"
              >
                <X size={17} aria-hidden="true" /> {t('إلغاء', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={updateMutation.isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#9fe870] px-4 text-sm font-semibold text-[#0e0f0c] transition hover:bg-[#8ed760] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/50 disabled:opacity-50"
              >
                {updateMutation.isPending ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                {updateMutation.isPending ? t('جاري الحفظ...', 'Saving...') : t('حفظ التعديلات', 'Save changes')}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] transition hover:border-[#9fe870] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/40"
              >
                <Edit3 size={17} aria-hidden="true" /> {t('إضافة أو تعديل يدوي', 'Add or edit manually')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('cv');
                  window.setTimeout(() => fileInputRef.current?.click(), 0);
                }}
                disabled={uploadCVMutation.isPending}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#9fe870] px-4 text-sm font-semibold text-[#0e0f0c] transition hover:bg-[#8ed760] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/50 disabled:opacity-50"
              >
                <Upload size={17} aria-hidden="true" /> {t('استخراج البيانات من السيرة', 'Extract data from CV')}
              </button>
            </>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl bg-[#f0f1ee] p-1.5">
            {tabItems.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className={cn(
                  'flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all',
                  activeTab === tab.key ? 'bg-white text-[#0e0f0c] shadow-sm' : 'text-[#5b5e5a] hover:text-[#0e0f0c]'
                )}
              >
                {tab.icon}
                <span className="hidden sm:inline">{isRTL ? tab.labelAr : tab.labelEn}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="personal" className="mt-4">
            <ContentCard title={t('المعلومات الشخصية', 'Personal Information')}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ProfileField label={t('الاسم الأول', 'First Name')} value={form.firstName} editing={editing} onChange={(v) => setForm((prev) => ({ ...prev, firstName: v }))} />
                <ProfileField label={t('الاسم الأخير', 'Last Name')} value={form.lastName} editing={editing} onChange={(v) => setForm((prev) => ({ ...prev, lastName: v }))} />
                <ProfileField label={t('البريد الإلكتروني', 'Email')} value={form.email} editing={editing} onChange={(v) => setForm((prev) => ({ ...prev, email: v }))} icon={<Mail size={14} />} type="email" />
                <ProfileField label={t('رقم الهاتف', 'Phone')} value={form.phone} editing={editing} onChange={(v) => setForm((prev) => ({ ...prev, phone: v }))} icon={<Phone size={14} />} type="tel" />
                <ProfileField label={t('رقم واتساب', 'WhatsApp')} value={form.whatsapp} editing={editing} onChange={(v) => setForm((prev) => ({ ...prev, whatsapp: v }))} icon={<MessageCircle size={14} />} type="tel" />
                <div className="min-w-0 rounded-xl bg-[#f0f1ee] p-3 text-start sm:col-span-2">
                  <label htmlFor="student-address" className="block text-xs font-semibold text-[#5b5e5a]">{t('العنوان أو الموقع', 'Address or location')}</label>
                  {editing ? (
                    <div className="mt-2 flex min-w-0 flex-col gap-2 sm:flex-row">
                      <div className="relative min-w-0 flex-1">
                        <MapPin size={16} className="pointer-events-none absolute start-3 top-3.5 text-[#828782]" aria-hidden="true" />
                        <input
                          id="student-address"
                          value={form.address}
                          onChange={(event) => setForm((previous) => ({ ...previous, address: event.target.value, latitude: null, longitude: null }))}
                          placeholder={t('اكتب عنوانك', 'Enter your address')}
                          className="min-h-11 w-full rounded-xl border border-[#dfe1dd] bg-white pe-3 ps-10 text-sm text-[#0e0f0c] outline-none focus:border-[#9fe870] focus:ring-4 focus:ring-[#9fe870]/20"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setLocationPickerOpen(true)}
                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] transition hover:border-[#9fe870] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/40"
                      >
                        <MapPin size={17} aria-hidden="true" /> {t('تحديد من الخريطة', 'Select on map')}
                      </button>
                    </div>
                  ) : (
                    <p id="student-address" className="mt-1 flex min-w-0 items-start gap-2 break-words text-sm font-semibold text-[#0e0f0c]" dir="auto">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-[#5b5e5a]" aria-hidden="true" />
                      <span>{form.address || t('غير محدد', 'Not specified')}</span>
                    </p>
                  )}
                  {editing && form.latitude !== null && form.longitude !== null && (
                    <p className="mt-2 text-xs text-[#5b5e5a]" dir="ltr">{Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}</p>
                  )}
                </div>
              </div>
            </ContentCard>

            <ContentCard title={t('وسائل التواصل والحسابات المهنية', 'Contact and professional links')} icon={<Globe2 size={20} />} className="mt-4">
              {editing ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {SOCIAL_LINK_DEFINITIONS.map((definition) => {
                    const Icon = definition.icon;
                    return (
                      <ProfileField
                        key={definition.key}
                        label={isRTL ? definition.labelAr : definition.labelEn}
                        value={form.socialLinks[definition.key]}
                        editing
                        onChange={(value) => setForm((previous) => ({
                          ...previous,
                          socialLinks: { ...previous.socialLinks, [definition.key]: value },
                        }))}
                        icon={<Icon size={14} />}
                        type="url"
                        placeholder="https://"
                      />
                    );
                  })}
                </div>
              ) : activeSocialLinks.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {activeSocialLinks.map((item) => {
                    const Icon = item.icon;
                    const label = isRTL ? item.labelAr : item.labelEn;
                    return (
                      <a
                        key={item.key}
                        href={normalizeExternalUrl(item.value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-0 items-center gap-3 rounded-xl border border-[#dfe1dd] bg-[#f0f1ee] p-3 text-start transition hover:border-[#9fe870] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/40"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#0e0f0c]">
                          <Icon size={19} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-xs font-semibold text-[#5b5e5a]">{label}</span>
                          <span className="mt-0.5 block truncate text-sm font-medium text-[#0e0f0c]" dir="auto" title={item.value}>{item.value}</span>
                        </span>
                        <ExternalLink size={15} className="shrink-0 text-[#828782]" aria-hidden="true" />
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="rounded-xl bg-[#f0f1ee] p-4 text-start text-sm text-[#5b5e5a]">
                  {t('لم تتم إضافة حسابات مهنية بعد. استخدم التعديل اليدوي أو ارفع سيرتك الذاتية لاستخراجها.', 'No professional links have been added yet. Edit manually or upload your CV to extract them.')}
                </p>
              )}
            </ContentCard>
          </TabsContent>

          <TabsContent value="academic" className="mt-4">
            <ContentCard title={t('السجل الأكاديمي', 'Education History')} icon={<GraduationCap size={20} />}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {student.academicAffiliationNeedsUpdate && !editing && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2">{t('يرجى تحديث بيانات الجامعة والكلية', 'Please update your university and college details')}</div>}
                {editing ? (
                  <>
                    <div><label className="mb-2 block text-xs font-semibold text-[#5b5e5a]">{t('الجامعة', 'University')}</label><AcademicReferenceCombobox value={form.universityId} items={universities} selected={universities.find((item) => item.id === form.universityId) || (student.universityInfo ? { id: student.universityInfo.id, name: student.universityInfo.name, nameAr: student.universityInfo.nameAr, nameEn: student.universityInfo.nameEn, logoUrl: student.universityInfo.logoUrl, governorate: student.universityInfo.governorate } : undefined)} placeholder={t('اختر الجامعة', 'Select university')} searchPlaceholder={t('ابحث باسم الجامعة', 'Search universities')} emptyText={t('لا توجد نتائج', 'No results')} loading={academicLoading.universities} error={academicError.universities} showUniversityDetails onSearch={setUniversitySearch} onRetry={loadUniversities} onSelect={(item) => setForm((value) => ({ ...value, universityId: item.id, university: item.nameAr || item.name, collegeId: '', college: '', departmentId: '', department: '', majorId: '', major: '' }))} /></div>
                    <div><label className="mb-2 block text-xs font-semibold text-[#5b5e5a]">{t('الكلية', 'College')}</label><AcademicReferenceCombobox value={form.collegeId} items={colleges} selected={colleges.find((item) => item.id === form.collegeId) || (student.collegeInfo ? { id: student.collegeInfo.id, name: student.collegeInfo.name, nameAr: student.collegeInfo.nameAr } : undefined)} placeholder={t('اختر الكلية', 'Select college')} searchPlaceholder={t('ابحث باسم الكلية', 'Search colleges')} emptyText={t('لا توجد كليات متاحة', 'No colleges available')} loading={academicLoading.colleges} error={academicError.colleges} disabled={!form.universityId} onSelect={(item) => setForm((value) => ({ ...value, collegeId: item.id, college: item.nameAr || item.name, departmentId: '', department: '', majorId: '', major: '' }))} /></div>
                    <div><label className="mb-2 block text-xs font-semibold text-[#5b5e5a]">{t('القسم', 'Department')}</label><AcademicReferenceCombobox value={form.departmentId} items={departments} selected={departments.find((item) => item.id === form.departmentId) || (student.departmentInfo ? { id: student.departmentInfo.id, name: student.departmentInfo.name, nameAr: student.departmentInfo.nameAr } : undefined)} placeholder={t('اختر القسم', 'Select department')} searchPlaceholder={t('ابحث باسم القسم', 'Search departments')} emptyText={t('لا توجد أقسام متاحة', 'No departments available')} loading={academicLoading.departments} error={academicError.departments} disabled={!form.collegeId} onSelect={(item) => setForm((value) => ({ ...value, departmentId: item.id, department: item.nameAr || item.name, majorId: '', major: '' }))} /></div>
                    <div><label className="mb-2 block text-xs font-semibold text-[#5b5e5a]">{t('التخصص', 'Major')}</label><AcademicReferenceCombobox value={form.majorId} items={majors} selected={majors.find((item) => item.id === form.majorId) || (student.majorInfo ? { id: student.majorInfo.id, name: student.majorInfo.name, nameAr: student.majorInfo.nameAr, nameEn: student.majorInfo.nameEn } : undefined)} placeholder={t('اختر التخصص', 'Select major')} searchPlaceholder={t('ابحث باسم التخصص', 'Search majors')} emptyText={t('لا توجد تخصصات مسجلة', 'No majors registered')} loading={academicLoading.majors} error={academicError.majors} disabled={!form.departmentId || majors.length === 0} onSelect={(item) => setForm((value) => ({ ...value, majorId: item.id, major: item.nameAr || item.name }))} /></div>
                  </>
                ) : (
                  <>
                    <ProfileField label={t('الجامعة', 'University')} value={form.university} editing={false} onChange={() => undefined} />
                    <ProfileField label={t('الكلية', 'College')} value={form.college} editing={false} onChange={() => undefined} />
                    <ProfileField label={t('القسم', 'Department')} value={form.department} editing={false} onChange={() => undefined} />
                    <ProfileField label={t('التخصص', 'Major')} value={form.major} editing={false} onChange={() => undefined} />
                  </>
                )}
                <div className="rounded-xl bg-[#f0f1ee] p-3">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-[#828782]">{t('المستوى الأكاديمي', 'Academic Level')}</label>
                  {editing ? (
                    <select
                      value={form.academicLevel}
                      onChange={(e) => setForm((prev) => ({ ...prev, academicLevel: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-[#dfe1dd] bg-white p-2 text-sm font-semibold text-[#0e0f0c]"
                    >
                      <option value="freshman">Freshman</option>
                      <option value="sophomore">Sophomore</option>
                      <option value="junior">Junior</option>
                      <option value="senior">Senior</option>
                      <option value="graduate">Graduate</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm font-bold text-[#0e0f0c]">{form.academicLevel || '-'}</p>
                  )}
                </div>
              </div>
            </ContentCard>
          </TabsContent>

          <TabsContent value="skills" className="mt-4">
            <ContentCard title={t('المهارات', 'Skills')}>
              <ProfileField
                label={t('المهارات', 'Skills')}
                value={form.skills}
                editing={editing}
                onChange={(v) => setForm((prev) => ({ ...prev, skills: v }))}
                multiline
              />
              <ProfileField
                label={t('الاهتمامات', 'Interests')}
                value={form.interests}
                editing={editing}
                onChange={(v) => setForm((prev) => ({ ...prev, interests: v }))}
                multiline
              />
            </ContentCard>
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            <ContentCard title={t('المشاريع', 'Projects')}>
              <ProfileField
                label={t('المشاريع', 'Projects')}
                value={form.projects}
                editing={editing}
                onChange={(v) => setForm((prev) => ({ ...prev, projects: v }))}
                multiline
              />
            </ContentCard>
          </TabsContent>

          <TabsContent value="certifications" className="mt-4">
            <ContentCard title={t('الشهادات والدورات', 'Certifications & Courses')}>
              <ProfileField
                label={t('الشهادات', 'Certifications')}
                value={form.certifications}
                editing={editing}
                onChange={(v) => setForm((prev) => ({ ...prev, certifications: v }))}
                multiline
              />
              <ProfileField
                label={t('الدورات', 'Courses')}
                value={form.courses}
                editing={editing}
                onChange={(v) => setForm((prev) => ({ ...prev, courses: v }))}
                multiline
              />
            </ContentCard>
          </TabsContent>

          <TabsContent value="cv" className="mt-4">
            <div className="flex flex-col gap-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".pdf,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <ContentCard title={t('السيرة الذاتية', 'Curriculum Vitae')} icon={<FileText size={20} />}>
                {uploadCVMutation.isPending && (
                  <div className="mb-4 overflow-hidden rounded-xl border border-[#9fe870] bg-[#f4fcf0] p-5 text-center" aria-live="polite" aria-busy="true">
                    <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                      <span className="absolute inset-0 animate-ping rounded-full border border-[#9fe870] opacity-50" aria-hidden="true" />
                      <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0e0f0c]">
                        <Loader2 size={24} className="animate-spin" aria-hidden="true" />
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[#0e0f0c]">{t('جاري تحليل السيرة الذاتية', 'Analyzing your CV')}</p>
                    <p className="mt-1 text-xs leading-5 text-[#5b5e5a]">{t('يتم استخراج البيانات وتحديث الملف والتوصيات. قد يستغرق ذلك لحظات.', 'Extracting data and updating your profile and recommendations. This may take a moment.')}</p>
                    <div className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-2" aria-hidden="true">
                      {[0, 1, 2].map((step) => (
                        <span key={step} className="h-2 flex-1 animate-pulse rounded-full bg-[#9fe870]" style={{ animationDelay: `${step * 180}ms` }} />
                      ))}
                    </div>
                  </div>
                )}

                <div
                  onDragEnter={(event) => { event.preventDefault(); setIsDraggingCV(true); }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDraggingCV(false);
                  }}
                  onDrop={handleCVDrop}
                  className={cn(
                    'rounded-xl border-2 border-dashed p-5 transition sm:p-6',
                    isDraggingCV ? 'border-[#9fe870] bg-[#f4fcf0]' : 'border-[#dfe1dd] bg-[#f0f1ee]',
                    uploadCVMutation.isPending && 'pointer-events-none opacity-60',
                  )}
                >
                  {hasCV ? (
                    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center self-center rounded-xl bg-white text-[#0e0f0c] sm:self-auto">
                        <CheckCircle2 size={26} aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1 text-center sm:text-start">
                        <p className="break-words text-sm font-semibold text-[#0e0f0c]" dir="auto">{student.cvData?.fileName || t('السيرة الذاتية', 'CV file')}</p>
                        <p className="mt-1 text-xs text-[#5b5e5a]">
                          {(student.cvData?.fileType || 'PDF').replace('.', '').toUpperCase()}
                          {student.cvData?.fileSize ? ` - ${(student.cvData.fileSize / 1024).toFixed(1)} KB` : ''}
                        </p>
                        {student.cvData?.uploadedAt && (
                          <p className="mt-1 text-xs text-[#828782]">{t('آخر تحديث', 'Last updated')}: {new Date(student.cvData.uploadedAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</p>
                        )}
                        <p className="mt-2 text-xs leading-5 text-[#5b5e5a]">{t('عند نجاح تحليل ملف جديد سيتم استبدال هذه السيرة وحذف الملف السابق.', 'After a new file is analyzed successfully, this CV will be replaced and the previous file deleted.')}</p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        {student.cvData?.fileUrl && (
                          <a
                            href={resolveAssetUrl(student.cvData.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#9fe870] px-4 text-sm font-semibold text-[#0e0f0c] transition hover:bg-[#8ed760] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/50"
                          >
                            <Eye size={17} aria-hidden="true" /> {t('عرض السيرة', 'View CV')}
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadCVMutation.isPending}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] transition hover:border-[#9fe870] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/40 disabled:opacity-50"
                        >
                          <Upload size={17} aria-hidden="true" /> {t('استبدال السيرة', 'Replace CV')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadCVMutation.isPending}
                      className="flex min-h-44 w-full flex-col items-center justify-center rounded-lg text-center outline-none focus-visible:ring-4 focus-visible:ring-[#9fe870]/50 disabled:cursor-wait"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-[#5b5e5a]">
                        <Upload size={26} aria-hidden="true" />
                      </span>
                      <span className="mt-3 text-sm font-semibold text-[#0e0f0c]">{t('اختر سيرة ذاتية أو اسحبها هنا', 'Choose a CV or drag it here')}</span>
                      <span className="mt-1 text-xs text-[#5b5e5a]">PDF {t('أو', 'or')} DOCX - {t('بحد أقصى 10 ميجابايت', 'Maximum 10MB')}</span>
                    </button>
                  )}
                </div>
              </ContentCard>

                {student.cvData?.aiAnalysis?.summary && (
                  <ContentCard
                    title={t('تحليل الذكاء الاصطناعي', 'AI Analysis')}
                    icon={<Sparkles size={20} className="text-[#0e0f0c]" />}
                  >
                    <div className="rounded-xl border border-[#dfe1dd] bg-[#f4fcf0] p-4 text-start">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white">
                          <Sparkles size={17} className="text-[#0e0f0c]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0e0f0c]">{t('ملخص التحليل', 'Analysis summary')}</p>
                          <p className="mt-1 break-words text-xs leading-6 text-[#5b5e5a]" dir="auto">{student.cvData.aiAnalysis.summary}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ExtractedList title={t('المهارات المستخرجة', 'Extracted Skills')} items={parsedData?.extractedSkills} />
                      <ExtractedList title={t('المهارات الشخصية', 'Soft Skills')} items={parsedData?.extractedSoftSkills} />
                      <ExtractedList title={t('الأدوات والتقنيات', 'Tools & Technologies')} items={parsedData?.extractedTools} />
                      <ExtractedList title={t('اللغات', 'Languages')} items={parsedData?.extractedLanguages} />
                      <ExtractedList title={t('الخبرات', 'Experience')} items={parsedData?.extractedExperience} />
                      <ExtractedList title={t('التعليم', 'Education')} items={parsedData?.extractedEducation} />
                      <ExtractedList title={t('المشاريع', 'Projects')} items={parsedData?.extractedProjects} />
                      <ExtractedList title={t('الشهادات', 'Certifications')} items={parsedData?.extractedCertifications} />
                      <ExtractedList title={t('الدورات', 'Courses')} items={parsedData?.extractedCourses} />
                      <ExtractedList title={t('الإنجازات', 'Achievements')} items={parsedData?.extractedAchievements} />
                    </div>
                  </ContentCard>
                )}
            </div>
          </TabsContent>
        </Tabs>
        <StudentLocationPicker
          open={locationPickerOpen}
          onOpenChange={setLocationPickerOpen}
          initialAddress={form.address}
          initialCoordinates={form.latitude !== null && form.longitude !== null ? { lat: Number(form.latitude), lng: Number(form.longitude) } : null}
          onConfirm={(location) => setForm((previous) => ({
            ...previous,
            address: location.address,
            latitude: location.lat,
            longitude: location.lng,
          }))}
        />
      </div>
    </PortalLayout>
  );
}

function ProfileField({
  label,
  value,
  editing,
  onChange,
  icon,
  multiline = false,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  multiline?: boolean;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-[#f0f1ee] p-3 text-start">
      <label className="block text-xs font-semibold text-[#5b5e5a]">{label}</label>
      {editing ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            dir="auto"
            className="mt-2 min-h-[96px] w-full resize-y rounded-xl border border-[#dfe1dd] bg-white p-3 text-start text-sm font-medium text-[#0e0f0c] outline-none transition focus:border-[#9fe870] focus:ring-4 focus:ring-[#9fe870]/20"
          />
        ) : (
          <div className="relative mt-2">
            {icon && <div className="absolute start-3 top-1/2 -translate-y-1/2 text-[#828782]">{icon}</div>}
            <input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              dir="auto"
              className={cn('w-full rounded-xl border border-[#dfe1dd] bg-white p-3 text-start text-sm font-medium text-[#0e0f0c] outline-none transition focus:border-[#9fe870] focus:ring-4 focus:ring-[#9fe870]/20', icon ? 'ps-9' : '')}
            />
          </div>
        )
      ) : (
        <p className="mt-1 break-words text-start text-sm font-semibold text-[#0e0f0c]" dir="auto">{value || '-'}</p>
      )}
    </div>
  );
}
