import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Mail, Phone, User, GraduationCap, Building2, School } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardPath } from '@/services/authApi';
import { universityApi } from '@/services/universityApi';
import type { OAuthPayload } from '@/types/api.types';
import type { PublicAcademicOption } from '@/types/university.types';

function decodeBase64Utf8(value: string): string {
  try {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

function decodePayload(value: string | null): OAuthPayload | null {
  if (!value) return null;
  try {
    return JSON.parse(decodeBase64Utf8(value)) as OAuthPayload;
  } catch {
    return null;
  }
}

function getProviderName(provider?: string): string {
  if (provider === 'google') return 'Google';
  if (provider === 'linkedin') return 'LinkedIn';
  return provider || 'OAuth';
}

function getProviderId(payload: OAuthPayload | null): { field: 'googleId' | 'linkedinId'; value: string } | null {
  if (!payload) return null;
  if (payload.googleId) return { field: 'googleId', value: payload.googleId };
  if (payload.linkedinId) return { field: 'linkedinId', value: payload.linkedinId };
  return null;
}

const arabicToWesternDigits: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

function normalizePhone(value: string): string {
  return value
    .replace(/[\s\-\(\)\.]/g, '')
    .replace(/[٠-٩]/g, (c) => arabicToWesternDigits[c] || c);
}

type Role = 'student' | 'company' | 'university';

const academicLevels = [
  { value: 'freshman', label: 'مستوى أول' },
  { value: 'sophomore', label: 'مستوى ثاني' },
  { value: 'junior', label: 'مستوى ثالث' },
  { value: 'senior', label: 'مستوى رابع' },
  { value: 'graduate', label: 'دراسات عليا' },
];

export default function CompleteGoogleProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeGoogleRegistration, isCompletingGoogleRegistration } = useAuth();
  const payload = useMemo(() => decodePayload(searchParams.get('payload')), [searchParams]);

  const [role, setRole] = useState<Role>('student');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Student fields
  const [universities, setUniversities] = useState<PublicAcademicOption[]>([]);
  const [colleges, setColleges] = useState<PublicAcademicOption[]>([]);
  const [departments, setDepartments] = useState<PublicAcademicOption[]>([]);
  const [universityId, setUniversityId] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');

  // University fields
  const [universityName, setUniversityName] = useState('');
  const [universityLocation, setUniversityLocation] = useState('');
  const [officialContact, setOfficialContact] = useState('');

  const status = searchParams.get('status');
  const provider = searchParams.get('provider') || payload?.provider || 'OAuth';
  const providerName = getProviderName(provider);
  const message = searchParams.get('message') || `لم يتم العثور على حساب مرتبط بهذا البريد. يرجى إنشاء حساب جديد لإكمال التسجيل.`;

  useEffect(() => {
    if (role === 'student') {
      universityApi.getPublicUniversities().then(setUniversities).catch(() => setUniversities([]));
    }
  }, [role]);

  useEffect(() => {
    if (!universityId) {
      setColleges([]);
      setCollegeId('');
      setDepartments([]);
      setDepartmentId('');
      return;
    }
    universityApi.getPublicColleges(universityId).then(setColleges).catch(() => setColleges([]));
  }, [universityId]);

  useEffect(() => {
    if (!collegeId) {
      setDepartments([]);
      setDepartmentId('');
      return;
    }
    universityApi.getPublicDepartments(collegeId).then(setDepartments).catch(() => setDepartments([]));
  }, [collegeId]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      next.phone = 'رقم الهاتف مطلوب';
    } else if (!/^\+?[0-9]{7,15}$/.test(normalizedPhone)) {
      next.phone = 'صيغة رقم الهاتف غير صالحة';
    }

    if (!role) next.role = 'اختر نوع الحساب';

    if (role === 'student') {
      if (!universityId) next.universityId = 'اختر الجامعة';
      if (!collegeId) next.collegeId = 'اختر الكلية';
      if (!departmentId) next.departmentId = 'اختر القسم';
      if (!academicLevel) next.academicLevel = 'المستوى الأكاديمي مطلوب';
    }

    if (role === 'company') {
      if (!companyName.trim()) next.companyName = 'اسم الشركة مطلوب';
      if (!industry.trim()) next.industry = 'مجال الصناعة مطلوب';
    }

    if (role === 'university') {
      if (!universityName.trim()) next.universityName = 'اسم الجامعة مطلوب';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const providerId = getProviderId(payload);

    if (!providerId || !payload?.email) {
      const fallback = `بيانات ${providerName} غير مكتملة، يرجى المحاولة مرة أخرى.`;
      setErrors({ general: fallback });
      toast.error(fallback);
      return;
    }

    if (!validate()) {
      toast.error('يرجى تصحيح الأخطاء أدناه');
      return;
    }

    const profile: Record<string, any> = {};
    if (role === 'student') {
      profile.universityId = universityId;
      profile.collegeId = collegeId;
      profile.departmentId = departmentId;
      profile.academicLevel = academicLevel;
    } else if (role === 'company') {
      profile.companyName = companyName.trim();
      profile.industry = industry.trim();
      profile.location = companyLocation.trim();
    } else if (role === 'university') {
      profile.universityName = universityName.trim();
      profile.location = universityLocation.trim();
      profile.officialContact = officialContact.trim();
    }

    try {
      const result = await completeGoogleRegistration({
        [providerId.field]: providerId.value,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName || 'User',
        avatar: payload.avatar || undefined,
        phone: normalizePhone(phone),
        role,
        profile,
      });
      toast.success('تم تسجيل الدخول بنجاح');
      navigate(getDashboardPath(result.user.role), { replace: true });
    } catch (err: any) {
      const responseMessage = err?.response?.data?.message;
      const responseCode = err?.response?.data?.code;
      const responseDetails = err?.response?.data?.details;

      let nextError = responseMessage || err?.message || 'تعذر تسجيل الدخول';
      if (responseCode === 'USER_EXISTS' || responseCode === 'OAUTH_EMAIL_EXISTS') {
        nextError = 'البريد مستخدم بحساب آخر';
      } else if (responseCode === 'OAUTH_PROVIDER_ID_REQUIRED' || responseCode === 'OAUTH_PROFILE_INCOMPLETE') {
        nextError = 'بيانات Google غير مكتملة';
      } else if (responseCode === 'OAUTH_ROLE_NOT_ALLOWED') {
        nextError = 'تعذر ربط الحساب الحالي';
      } else if (responseCode === 'VALIDATION_ERROR' && responseDetails) {
        const fieldErrors: Record<string, string> = {};
        for (const [key, messages] of Object.entries(responseDetails as Record<string, string[]>)) {
          fieldErrors[key] = Array.isArray(messages) ? messages[0] : String(messages);
        }
        setErrors(fieldErrors);
        nextError = 'يرجى تصحيح البيانات المطلوبة';
      }

      setErrors((prev) => ({ ...prev, general: nextError }));
      toast.error(nextError);
    }
  };

  const renderRoleFields = () => {
    if (role === 'student') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">الجامعة *</label>
            <select value={universityId} onChange={(e) => setUniversityId(e.target.value)} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white">
              <option value="" className="bg-[#1A1A2E]">اختر الجامعة</option>
              {universities.map((u) => <option key={u.id} value={u.id} className="bg-[#1A1A2E]">{u.nameAr || u.name}</option>)}
            </select>
            {errors.universityId && <p className="mt-1 text-xs text-red-300">{errors.universityId}</p>}
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">الكلية *</label>
            <select disabled={!universityId} value={collegeId} onChange={(e) => setCollegeId(e.target.value)} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white disabled:opacity-50">
              <option value="" className="bg-[#1A1A2E]">اختر الكلية</option>
              {colleges.map((c) => <option key={c.id} value={c.id} className="bg-[#1A1A2E]">{c.nameAr || c.name}</option>)}
            </select>
            {errors.collegeId && <p className="mt-1 text-xs text-red-300">{errors.collegeId}</p>}
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">القسم *</label>
            <select disabled={!collegeId} value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white disabled:opacity-50">
              <option value="" className="bg-[#1A1A2E]">اختر القسم</option>
              {departments.map((d) => <option key={d.id} value={d.id} className="bg-[#1A1A2E]">{d.nameAr || d.name}</option>)}
            </select>
            {errors.departmentId && <p className="mt-1 text-xs text-red-300">{errors.departmentId}</p>}
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">المستوى الأكاديمي *</label>
            <select value={academicLevel} onChange={(e) => setAcademicLevel(e.target.value)} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white">
              <option value="" className="bg-[#1A1A2E]">اختر المستوى</option>
              {academicLevels.map((l) => <option key={l.value} value={l.value} className="bg-[#1A1A2E]">{l.label}</option>)}
            </select>
            {errors.academicLevel && <p className="mt-1 text-xs text-red-300">{errors.academicLevel}</p>}
          </div>
        </div>
      );
    }

    if (role === 'company') {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">اسم الشركة *</label>
            <div className="relative">
              <Building2 className="absolute right-3 top-3 w-5 h-5 text-white/40" />
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full pr-10 p-3 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="اسم الشركة" />
            </div>
            {errors.companyName && <p className="mt-1 text-xs text-red-300">{errors.companyName}</p>}
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">مجال الصناعة *</label>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="مثال: تقنية المعلومات" />
            {errors.industry && <p className="mt-1 text-xs text-red-300">{errors.industry}</p>}
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">الموقع</label>
            <input value={companyLocation} onChange={(e) => setCompanyLocation(e.target.value)} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="المدينة، الدولة" />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">اسم الجامعة *</label>
          <div className="relative">
            <School className="absolute right-3 top-3 w-5 h-5 text-white/40" />
            <input value={universityName} onChange={(e) => setUniversityName(e.target.value)} className="w-full pr-10 p-3 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="اسم الجامعة" />
          </div>
          {errors.universityName && <p className="mt-1 text-xs text-red-300">{errors.universityName}</p>}
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">الموقع</label>
          <input value={universityLocation} onChange={(e) => setUniversityLocation(e.target.value)} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="المدينة، الدولة" />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">البريد التواصل الرسمي</label>
          <input value={officialContact} onChange={(e) => setOfficialContact(e.target.value)} className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="email@university.edu.sa" />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0F] to-[#1A1A2E] py-8 px-4">
      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          {status === 'PROFILE_INCOMPLETE' ? 'إكمال الملف الشخصي' : `إنشاء حساب باستخدام ${providerName}`}
        </h1>
        <p className="text-white/50 text-sm text-center mb-6">{message}</p>

        {payload?.avatar && (
          <div className="mb-6 flex justify-center">
            <img src={payload.avatar} alt={payload.firstName} className="h-20 w-20 rounded-full border border-white/10 object-cover" />
          </div>
        )}

        {errors.general && <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg text-sm">{errors.general}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">الاسم</label>
            <div className="relative">
              <User className="absolute right-3 top-3 w-5 h-5 text-white/40" />
              <input value={`${payload?.firstName || ''} ${payload?.lastName || ''}`.trim()} readOnly className="w-full pr-10 p-3 bg-white/10 border border-white/20 rounded-xl text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 w-5 h-5 text-white/40" />
              <input value={payload?.email || ''} readOnly className="w-full pr-10 p-3 bg-white/10 border border-white/20 rounded-xl text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">نوع الحساب *</label>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setRole('student')} className={`py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 transition ${role === 'student' ? 'bg-[#9fe870] text-[#0A0A0F]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <GraduationCap className="w-4 h-4" /> طالب
              </button>
              <button type="button" onClick={() => setRole('company')} className={`py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 transition ${role === 'company' ? 'bg-[#9fe870] text-[#0A0A0F]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <Building2 className="w-4 h-4" /> شركة
              </button>
              <button type="button" onClick={() => setRole('university')} className={`py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1 transition ${role === 'university' ? 'bg-[#9fe870] text-[#0A0A0F]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                <School className="w-4 h-4" /> جامعة
              </button>
            </div>
            {errors.role && <p className="mt-1 text-xs text-red-300">{errors.role}</p>}
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">رقم الهاتف *</label>
            <div className="relative">
              <Phone className="absolute right-3 top-3 w-5 h-5 text-white/40" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pr-10 p-3 bg-white/10 border border-white/20 rounded-xl text-white" placeholder="+9665XXXXXXXX" />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-300">{errors.phone}</p>}
          </div>

          {renderRoleFields()}

          <button type="submit" disabled={isCompletingGoogleRegistration} className="w-full py-3 bg-[#9fe870] text-[#0A0A0F] font-bold rounded-xl hover:scale-105 transition disabled:opacity-50 flex items-center justify-center gap-2">
            {isCompletingGoogleRegistration ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> جاري إكمال التسجيل...</>
            ) : (
              <>إكمال التسجيل <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
