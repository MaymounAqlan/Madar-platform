import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useEffect } from 'react';
import AuthLayout from '@/components/AuthLayout';
import AuthInput from '@/components/AuthInput';
import AuthButton from '@/components/AuthButton';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  School,
  Building2,
  Globe,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Layers3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DevelopmentAutofillButton from '@/components/DevelopmentAutofillButton';
import { generateUniversityTestData } from '@/utils/testDataGenerator';
import { universityApi } from '@/services/universityApi';
import type { PublicAcademicOption } from '@/types/university.types';
import AcademicReferenceCombobox from '@/components/AcademicReferenceCombobox';

type AcademicLevel = 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate';
type AccountType = 'student' | 'company' | 'university';

const academicLevels: { value: AcademicLevel; labelAr: string; labelEn: string }[] = [
  { value: 'freshman', labelAr: 'مستوى أول', labelEn: 'Freshman' },
  { value: 'sophomore', labelAr: 'مستوى ثاني', labelEn: 'Sophomore' },
  { value: 'junior', labelAr: 'مستوى ثالث', labelEn: 'Junior' },
  { value: 'senior', labelAr: 'مستوى رابع', labelEn: 'Senior' },
  { value: 'graduate', labelAr: 'دراسات عليا', labelEn: 'Graduate' },
];

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Register() {
  const { t, toggleLanguage, isRTL } = useLanguage();
  const { register, isRegistering } = useAuth();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    accountType: 'student' as AccountType,
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    university: '',
    college: '',
    department: '',
    major: '',
    academicLevel: 'freshman' as AcademicLevel,
    companyName: '',
    industry: '',
    companyDescription: '',
    location: '',
    website: '',
    logo: '',
    linkedIn: '',
    universityName: '',
    universityDescription: '',
    universityWebsite: '',
    officialContact: '',
    jobTitle: '', universityNameAr: '', universityType: 'public', country: '', city: '', address: '',
    universityOfficialEmail: '', officialPhone: '', emailDomain: '', licenseNumber: '',
    accreditationDocumentUrl: '', registrationNotes: '', acceptedTerms: false,
    universityId: '', collegeId: '', departmentId: '', majorId: '', studentNumber: '', enrollmentYear: '', expectedGraduationYear: '', studentStatus: 'student',
  });
  const [universities, setUniversities] = useState<PublicAcademicOption[]>([]);
  const [colleges, setColleges] = useState<PublicAcademicOption[]>([]);
  const [departments, setDepartments] = useState<PublicAcademicOption[]>([]);
  const [majors, setMajors] = useState<PublicAcademicOption[]>([]);
  const [universitySearch, setUniversitySearch] = useState('');
  const [academicLoading, setAcademicLoading] = useState({ universities: false, colleges: false, departments: false, majors: false });
  const [academicError, setAcademicError] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const fillUniversityTestData = () => {
    const data = generateUniversityTestData();
    setFormData((current) => ({ ...current, ...data }));
    setErrors({}); setApiError('');
  };

  const resetForm = () => {
    setFormData({
      accountType: 'student', fullName: '', email: '', phone: '', password: '', confirmPassword: '',
      university: '', college: '', department: '', major: '', academicLevel: 'freshman', companyName: '', industry: '',
      companyDescription: '', location: '', website: '', logo: '', linkedIn: '', universityName: '',
      universityDescription: '', universityWebsite: '', officialContact: '', jobTitle: '', universityNameAr: '', universityType: 'public', country: '', city: '', address: '', universityOfficialEmail: '', officialPhone: '', emailDomain: '', licenseNumber: '', accreditationDocumentUrl: '', registrationNotes: '', acceptedTerms: false, universityId: '', collegeId: '', departmentId: '', majorId: '', studentNumber: '', enrollmentYear: '', expectedGraduationYear: '', studentStatus: 'student',
    });
    setStep(1); setErrors({}); setApiError('');
  };

  const loadUniversities = () => {
    setAcademicLoading((value) => ({ ...value, universities: true }));
    setAcademicError((value) => ({ ...value, universities: '' }));
    universityApi.searchReferenceUniversities({ search: universitySearch || undefined, limit: 20 })
      .then((page) => setUniversities(page.items))
      .catch(() => { setUniversities([]); setAcademicError((value) => ({ ...value, universities: t('تعذر تحميل الجامعات', 'Unable to load universities') })); })
      .finally(() => setAcademicLoading((value) => ({ ...value, universities: false })));
  };

  useEffect(() => {
    if (formData.accountType !== 'student') return;
    const timer = window.setTimeout(loadUniversities, 300);
    return () => window.clearTimeout(timer);
  }, [formData.accountType, universitySearch]);
  useEffect(() => {
    if (!formData.universityId) { setColleges([]); return; }
    setAcademicLoading((value) => ({ ...value, colleges: true }));
    setAcademicError((value) => ({ ...value, colleges: '' }));
    universityApi.getReferenceColleges(formData.universityId, { limit: 100 }).then((page) => setColleges(page.items)).catch(() => { setColleges([]); setAcademicError((value) => ({ ...value, colleges: t('تعذر تحميل الكليات', 'Unable to load colleges') })); }).finally(() => setAcademicLoading((value) => ({ ...value, colleges: false })));
  }, [formData.universityId]);
  useEffect(() => {
    if (!formData.collegeId) { setDepartments([]); return; }
    setAcademicLoading((value) => ({ ...value, departments: true }));
    setAcademicError((value) => ({ ...value, departments: '' }));
    universityApi.getReferenceDepartments(formData.collegeId, { limit: 100 }).then((page) => setDepartments(page.items)).catch(() => { setDepartments([]); setAcademicError((value) => ({ ...value, departments: t('تعذر تحميل الأقسام', 'Unable to load departments') })); }).finally(() => setAcademicLoading((value) => ({ ...value, departments: false })));
  }, [formData.collegeId]);
  useEffect(() => {
    if (!formData.departmentId) { setMajors([]); return; }
    setAcademicLoading((value) => ({ ...value, majors: true }));
    setAcademicError((value) => ({ ...value, majors: '' }));
    universityApi.getReferenceMajors(formData.departmentId, { limit: 100 }).then((page) => setMajors(page.items)).catch(() => { setMajors([]); setAcademicError((value) => ({ ...value, majors: t('تعذر تحميل التخصصات', 'Unable to load majors') })); }).finally(() => setAcademicLoading((value) => ({ ...value, majors: false })));
  }, [formData.departmentId]);

  const updateField = (field: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthLabels = [
    t('ضعيف جدًا', 'Very Weak'),
    t('ضعيف', 'Weak'),
    t('متوسط', 'Fair'),
    t('قوي', 'Strong'),
    t('قوي جدًا', 'Very Strong'),
  ];
  const strengthColors = ['#dc2626', '#f59e0b', '#f59e0b', '#1ba442', '#1ba442'];

  const validateStep = (targetStep: 1 | 2 | 3) => {
    const nextErrors: Record<string, string> = {};

    if (targetStep === 1) {
      if (!formData.fullName.trim()) nextErrors.fullName = t('الاسم الكامل مطلوب', 'Full name is required');
      if (!formData.email.trim()) nextErrors.email = t('البريد الإلكتروني مطلوب', 'Email is required');
      else if (!/^\S+@\S+\.\S+$/.test(formData.email)) nextErrors.email = t('صيغة غير صحيحة', 'Invalid format');
      if (!formData.password) nextErrors.password = t('كلمة المرور مطلوبة', 'Password is required');
      else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
        nextErrors.password = t(
          'يجب أن تحتوي كلمة المرور على حرف كبير وصغير ورقم',
          'Password must contain uppercase, lowercase, and a number',
        );
      }
      if (!formData.confirmPassword) {
        nextErrors.confirmPassword = t('تأكيد كلمة المرور مطلوب', 'Confirm password is required');
      } else if (formData.password !== formData.confirmPassword) {
        nextErrors.confirmPassword = t('كلمات المرور غير متطابقة', 'Passwords do not match');
      }
    }

    if (targetStep === 2) {
      if (formData.accountType === 'student') {
        if (majors.length > 0 && !formData.majorId) nextErrors.major = t('التخصص مطلوب', 'Major is required');
        if (!formData.universityId) nextErrors.university = t('الجامعة مطلوبة', 'University is required');
        if (!formData.collegeId) nextErrors.college = t('الكلية مطلوبة', 'College is required');
        if (!formData.departmentId) nextErrors.department = t('القسم مطلوب', 'Department is required');
        if (!formData.studentNumber.trim()) nextErrors.studentNumber = t('الرقم الجامعي مطلوب', 'Student number is required');
        if (!formData.enrollmentYear) nextErrors.enrollmentYear = t('سنة الالتحاق مطلوبة', 'Enrollment year is required');
        if (!formData.expectedGraduationYear) nextErrors.expectedGraduationYear = t('سنة التخرج المتوقعة مطلوبة', 'Expected graduation year is required');
        if (!formData.academicLevel) nextErrors.academicLevel = t('المستوى الأكاديمي مطلوب', 'Academic level is required');
      } else if (formData.accountType === 'company') {
        if (!formData.companyName.trim()) nextErrors.companyName = t('اسم الشركة مطلوب', 'Company name is required');
        if (!formData.industry.trim()) nextErrors.industry = t('القطاع مطلوب', 'Industry is required');
        if (!formData.companyDescription.trim()) nextErrors.companyDescription = t('وصف الشركة مطلوب', 'Company description is required');
        if (!formData.location.trim()) nextErrors.location = t('الموقع مطلوب', 'Location is required');
      } else {
        if (!formData.universityName.trim()) nextErrors.universityName = t('اسم الجامعة مطلوب', 'University name is required');
        if (!formData.universityDescription.trim()) nextErrors.universityDescription = t('وصف الجامعة مطلوب', 'University description is required');
        if (!formData.location.trim()) nextErrors.location = t('الموقع مطلوب', 'Location is required');
      }
    }
    if (targetStep === 3 && formData.accountType === 'university') {
      if (!formData.officialContact.trim()) nextErrors.officialContact = t('البريد الرسمي مطلوب', 'Official email is required');
      if (formData.universityWebsite && !/^https?:\/\//i.test(formData.universityWebsite)) nextErrors.universityWebsite = t('رابط الموقع غير صحيح', 'Invalid website URL');
      if (formData.logo && !/^https:\/\//i.test(formData.logo)) nextErrors.logo = t('يجب أن يستخدم رابط الشعار HTTPS', 'Logo URL must use HTTPS');
      if (!formData.acceptedTerms) nextErrors.acceptedTerms = t('يجب الموافقة على الشروط', 'You must accept the terms');
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const splitFullName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || parts[0] || '',
    };
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setApiError('');
    setStep(step === 2 && formData.accountType === 'university' ? 3 : 2);
  };

  const handleBack = () => {
    setApiError('');
    setStep(step === 3 ? 2 : 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(formData.accountType === 'university' ? 3 : 2)) return;

    setApiError('');
    try {
      const { firstName, lastName } = splitFullName(formData.fullName);
      await register({
        email: formData.email,
        password: formData.password,
        firstName,
        lastName,
        firstNameAr: firstName,
        lastNameAr: lastName,
        phone: formData.phone,
        role: formData.accountType,
        profile: formData.accountType === 'student'
          ? {
              university: formData.university,
              college: formData.college,
              department: formData.department,
              major: formData.major,
              universityId: formData.universityId,
              collegeId: formData.collegeId,
              departmentId: formData.departmentId,
              majorId: formData.majorId || undefined,
              studentNumber: formData.studentNumber,
              enrollmentYear: Number(formData.enrollmentYear),
              expectedGraduationYear: Number(formData.expectedGraduationYear),
              studentStatus: formData.studentStatus,
              academicLevel: formData.academicLevel,
            }
          : formData.accountType === 'company'
            ? {
                companyName: formData.companyName,
                industry: formData.industry,
                description: formData.companyDescription,
                location: formData.location,
                website: formData.website,
                phone: formData.phone,
                logo: formData.logo,
                socialLinks: { linkedIn: formData.linkedIn },
              }
            : {
                universityName: formData.universityName,
                nameAr: formData.universityNameAr,
                description: formData.universityDescription,
                location: formData.location,
                type: formData.universityType,
                country: formData.country,
                city: formData.city,
                address: formData.address,
                website: formData.universityWebsite,
                phone: formData.phone,
                officialContact: formData.officialContact,
                officialContactName: formData.fullName,
                officialEmail: formData.universityOfficialEmail || formData.officialContact,
                officialPhone: formData.officialPhone,
                jobTitle: formData.jobTitle,
                emailDomain: formData.emailDomain,
                licenseNumber: formData.licenseNumber,
                accreditationDocumentUrl: formData.accreditationDocumentUrl,
                registrationNotes: formData.registrationNotes,
                logo: formData.logo,
              },
      });
      setDone(true);
      const dashboardPath = formData.accountType === 'company' ? '/company/dashboard' : formData.accountType === 'university' ? '/university/pending-approval' : '/student/dashboard';
      setTimeout(() => navigate(dashboardPath, { replace: true }), 1800);
    } catch (err: unknown) {
      const apiError = err as { message?: string; response?: { data?: { message?: string | string[] } } };
      const responseMessage = apiError.response?.data?.message;
      setApiError(
        (Array.isArray(responseMessage) ? responseMessage.join(', ') : responseMessage)
          || apiError.message
          || t('فشل التسجيل', 'Registration failed'),
      );
    }
  };

  if (done) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: '#E7FDD8' }}>
            <CheckCircle2 size={40} style={{ color: '#1ba442' }} />
          </div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif", color: '#0e0f0c' }}
          >
            {t('تم إنشاء الحساب!', 'Account Created!')}
          </h1>
          <p className="mt-2 text-sm font-semibold" style={{ color: '#5b5e5a' }}>
            {formData.accountType === 'company'
              ? t('سيتم توجيهك إلى لوحة الشركة الآن', 'You will be redirected to the company dashboard now')
              : formData.accountType === 'university'
                ? t('سيتم توجيهك إلى لوحة الجامعة الآن', 'You will be redirected to the university dashboard now')
              : t('سيتم توجيهك إلى لوحة الطالب الآن', 'You will be redirected to the student dashboard now')}
          </p>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="mb-6 flex justify-end">
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-[#f0f1ee]"
            style={{ color: '#5b5e5a' }}
          >
            <Globe size={14} />
            {isRTL ? 'English' : 'العربية'}
          </button>
        </div>

        <div className="mb-6">
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif", color: '#0e0f0c' }}
          >
            {formData.accountType === 'company' ? t('إنشاء حساب شركة', 'Create Company Account') : formData.accountType === 'university' ? t('إنشاء حساب جامعة', 'Create University Account') : t('إنشاء حساب طالب', 'Create Student Account')}
          </h1>
          <p className="mt-1 text-sm font-semibold" style={{ color: '#5b5e5a' }}>
            {t('أكمل التسجيل على مرحلتين بنفس التجربة السابقة', 'Complete your registration in two guided steps')}
          </p>
        </div>

        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600"
          >
            {apiError}
          </motion.div>
        )}

        <div className="mb-8 flex items-center gap-3">
          {Array.from({ length: formData.accountType === 'university' ? 3 : 2 }, (_, index) => index + 1).map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors"
                style={{ background: step >= s ? '#9fe870' : '#f0f1ee', color: '#0e0f0c' }}
              >
                {s}
              </div>
              {s < (formData.accountType === 'university' ? 3 : 2) && <div className="h-0.5 flex-1" style={{ background: step > s ? '#9fe870' : '#dfe1dd' }} />}
            </div>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between rounded-2xl bg-[#f8f9f7] px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#828782]">
              {t('المرحلة الحالية', 'Current Step')}
            </p>
            <p className="text-sm font-bold text-[#0e0f0c]">
              {step === 1 ? t('بيانات الحساب', 'Account Details') : step === 3 ? t('الهوية والاعتماد', 'Identity and Accreditation') : formData.accountType === 'company' ? t('بيانات الشركة', 'Company Details') : formData.accountType === 'university' ? t('بيانات الجامعة', 'University Details') : t('البيانات الأكاديمية', 'Academic Details')}
            </p>
          </div>
          <div className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1ba442]">
            {step}/{formData.accountType === 'university' ? 3 : 2}
          </div>
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, x: isRTL ? -16 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-4"
        >
          {step === 1 ? (
            <>
              <h2 className="mb-1 text-base font-bold" style={{ color: '#0e0f0c' }}>
                {t('بيانات الحساب', 'Account Details')}
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 rounded-2xl bg-[#f0f1ee] p-1">
                {([
                  { value: 'student', ar: 'طالب', en: 'Student' },
                  { value: 'company', ar: 'شركة', en: 'Company' },
                  { value: 'university', ar: 'جامعة', en: 'University' },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField('accountType', option.value)}
                    className={cn(
                      'flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-all',
                      formData.accountType === option.value ? 'bg-white text-[#0e0f0c] shadow-sm' : 'text-[#5b5e5a]',
                    )}
                  >
                    {t(option.ar, option.en)}
                  </button>
                ))}
              </div>
              <AuthInput
                label={formData.accountType === 'company' ? t('اسم مسؤول الحساب', 'Account Owner Name') : t('الاسم الكامل', 'Full Name')}
                placeholder={formData.accountType === 'company' ? t('مدير التوظيف', 'Recruitment Manager') : t('أحمد محمد', 'Ahmed Mohammed')}
                value={formData.fullName}
                onChange={(v) => updateField('fullName', v)}
                error={errors.fullName}
                icon={<User size={18} style={{ color: '#828782' }} />}
                required
              />
              <AuthInput
                label={t('رقم الهاتف', 'Phone')}
                placeholder="+966501234567"
                value={formData.phone}
                onChange={(v) => updateField('phone', v)}
                icon={<User size={18} style={{ color: '#828782' }} />}
              />
              {formData.accountType === 'university' && <AuthInput label={t('المسمى الوظيفي', 'Job Title')} placeholder={t('مدير العلاقات المؤسسية', 'Institutional Relations Manager')} value={formData.jobTitle} onChange={(value) => updateField('jobTitle', value)} icon={<User size={18} style={{ color: '#828782' }} />} />}
              <AuthInput
                label={t('البريد الإلكتروني', 'Email')}
                type="email"
                placeholder="ahmed@example.com"
                value={formData.email}
                onChange={(v) => updateField('email', v)}
                error={errors.email}
                icon={<Mail size={18} style={{ color: '#828782' }} />}
                required
              />
              <AuthInput
                label={t('كلمة المرور', 'Password')}
                type="password"
                placeholder={t('8 أحرف على الأقل', 'At least 8 characters')}
                value={formData.password}
                onChange={(v) => updateField('password', v)}
                error={errors.password}
                icon={<Lock size={18} style={{ color: '#828782' }} />}
                required
              />
              {formData.password && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className="h-1.5 flex-1 rounded-full transition-colors duration-200"
                        style={{ background: bar <= strength ? strengthColors[strength] : '#dfe1dd' }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-semibold" style={{ color: strengthColors[strength] }}>
                    {strengthLabels[strength]}
                  </p>
                </div>
              )}
              <AuthInput
                label={t('تأكيد كلمة المرور', 'Confirm Password')}
                type="password"
                placeholder={t('أعد إدخال كلمة المرور', 'Re-enter password')}
                value={formData.confirmPassword}
                onChange={(v) => updateField('confirmPassword', v)}
                error={errors.confirmPassword}
                icon={<Lock size={18} style={{ color: '#828782' }} />}
                required
              />
            </>
          ) : step === 3 && formData.accountType === 'university' ? (
            <>
              <h2 className="mb-1 text-base font-bold" style={{ color: '#0e0f0c' }}>{t('الهوية والاعتماد', 'Identity and Accreditation')}</h2>
              <AuthInput label={t('البريد الرسمي للجامعة', 'Official University Email')} type="email" placeholder="registrar@example.edu" value={formData.universityOfficialEmail} onChange={(value) => updateField('universityOfficialEmail', value)} icon={<Mail size={18} style={{ color: '#828782' }} />} />
              <AuthInput label={t('جهة التواصل الرسمية', 'Official Contact')} type="email" placeholder="office@example.edu" value={formData.officialContact} onChange={(value) => updateField('officialContact', value)} error={errors.officialContact} icon={<Mail size={18} style={{ color: '#828782' }} />} required />
              <AuthInput label={t('الهاتف الرسمي', 'Official Phone')} placeholder="+966501234567" value={formData.officialPhone} onChange={(value) => updateField('officialPhone', value)} icon={<User size={18} style={{ color: '#828782' }} />} />
              <AuthInput label={t('نطاق البريد الجامعي', 'University Email Domain')} placeholder="example.edu" value={formData.emailDomain} onChange={(value) => updateField('emailDomain', value)} icon={<Globe size={18} style={{ color: '#828782' }} />} />
              <AuthInput label={t('رابط الشعار', 'Logo URL')} placeholder="https://example.edu/logo.png" value={formData.logo} onChange={(value) => updateField('logo', value)} error={errors.logo} icon={<Building2 size={18} style={{ color: '#828782' }} />} />
              <AuthInput label={t('رقم الترخيص أو الاعتماد', 'License or Accreditation Number')} placeholder="UNI-2026-001" value={formData.licenseNumber} onChange={(value) => updateField('licenseNumber', value)} icon={<School size={18} style={{ color: '#828782' }} />} />
              <AuthInput label={t('رابط وثيقة الاعتماد', 'Accreditation Document URL')} placeholder="https://example.edu/accreditation.pdf" value={formData.accreditationDocumentUrl} onChange={(value) => updateField('accreditationDocumentUrl', value)} icon={<Globe size={18} style={{ color: '#828782' }} />} />
              <AuthInput label={t('ملاحظات الطلب', 'Application Notes')} placeholder={t('ملاحظات إضافية للمراجع', 'Additional notes for the reviewer')} value={formData.registrationNotes} onChange={(value) => updateField('registrationNotes', value)} icon={<GraduationCap size={18} style={{ color: '#828782' }} />} />
              <label className="flex items-start gap-3 rounded-2xl border border-[#dfe1dd] bg-white p-4 text-sm font-semibold"><input type="checkbox" checked={formData.acceptedTerms} onChange={(event) => updateField('acceptedTerms', event.target.checked)} className="mt-1" /><span>{t('أوافق على شروط التسجيل وصحة البيانات المؤسسية', 'I accept the registration terms and confirm the institutional data')}</span></label>
              {errors.acceptedTerms && <p className="text-xs font-semibold text-red-600">{errors.acceptedTerms}</p>}
            </>
          ) : formData.accountType === 'company' ? (
            <>
              <h2 className="mb-1 text-base font-bold" style={{ color: '#0e0f0c' }}>
                {t('بيانات الشركة', 'Company Details')}
              </h2>
              <AuthInput
                label={t('اسم الشركة', 'Company Name')}
                placeholder={t('شركة مدار التقنية', 'MADAR Tech')}
                value={formData.companyName}
                onChange={(v) => updateField('companyName', v)}
                error={errors.companyName}
                icon={<Building2 size={18} style={{ color: '#828782' }} />}
                required
              />
              <AuthInput
                label={t('القطاع', 'Industry')}
                placeholder={t('تقنية المعلومات', 'Information Technology')}
                value={formData.industry}
                onChange={(v) => updateField('industry', v)}
                error={errors.industry}
                icon={<Layers3 size={18} style={{ color: '#828782' }} />}
                required
              />
              <AuthInput
                label={t('وصف الشركة', 'Company Description')}
                placeholder={t('نبذة مختصرة عن الشركة', 'Short company overview')}
                value={formData.companyDescription}
                onChange={(v) => updateField('companyDescription', v)}
                error={errors.companyDescription}
                icon={<Building2 size={18} style={{ color: '#828782' }} />}
                required
              />
              <AuthInput
                label={t('الموقع', 'Location')}
                placeholder={t('الرياض، السعودية', 'Riyadh, Saudi Arabia')}
                value={formData.location}
                onChange={(v) => updateField('location', v)}
                error={errors.location}
                icon={<Globe size={18} style={{ color: '#828782' }} />}
                required
              />
              <AuthInput
                label={t('الموقع الإلكتروني', 'Website')}
                placeholder="https://company.com"
                value={formData.website}
                onChange={(v) => updateField('website', v)}
                icon={<Globe size={18} style={{ color: '#828782' }} />}
              />
              <AuthInput
                label={t('رابط الشعار', 'Logo URL')}
                placeholder="https://company.com/logo.png"
                value={formData.logo}
                onChange={(v) => updateField('logo', v)}
                icon={<Building2 size={18} style={{ color: '#828782' }} />}
              />
              <AuthInput
                label="LinkedIn"
                placeholder="https://linkedin.com/company/example"
                value={formData.linkedIn}
                onChange={(v) => updateField('linkedIn', v)}
                icon={<Globe size={18} style={{ color: '#828782' }} />}
              />
            </>
          ) : formData.accountType === 'university' ? (
            <>
              <h2 className="mb-1 text-base font-bold" style={{ color: '#0e0f0c' }}>
                {t('بيانات الجامعة', 'University Details')}
              </h2>
              <AuthInput
                label={t('اسم الجامعة', 'University Name')}
                placeholder={t('جامعة الملك سعود', 'King Saud University')}
                value={formData.universityName}
                onChange={(v) => updateField('universityName', v)}
                error={errors.universityName}
                icon={<School size={18} style={{ color: '#828782' }} />}
                required
              />
              <AuthInput
                label={t('وصف الجامعة', 'University Description')}
                placeholder={t('نبذة مختصرة عن الجامعة', 'Short university overview')}
                value={formData.universityDescription}
                onChange={(v) => updateField('universityDescription', v)}
                error={errors.universityDescription}
                icon={<GraduationCap size={18} style={{ color: '#828782' }} />}
                required
              />
              <AuthInput label={t('الاسم العربي', 'Arabic Name')} placeholder={t('جامعة المستقبل', 'Future University')} value={formData.universityNameAr} onChange={(value) => updateField('universityNameAr', value)} icon={<School size={18} style={{ color: '#828782' }} />} />
              <label className="block"><span className="mb-2 block text-sm font-semibold">{t('نوع الجامعة', 'University Type')}</span><select value={formData.universityType} onChange={(event) => updateField('universityType', event.target.value)} className="w-full rounded-2xl border border-[#dfe1dd] bg-white px-4 py-3 text-sm font-semibold"><option value="government">{t('حكومية', 'Government')}</option><option value="private">{t('خاصة', 'Private')}</option><option value="non_profit">{t('غير ربحية', 'Non-profit')}</option><option value="international">{t('دولية', 'International')}</option><option value="other">{t('أخرى', 'Other')}</option></select></label>
              <AuthInput
                label={t('الموقع', 'Location')}
                placeholder={t('الرياض، السعودية', 'Riyadh, Saudi Arabia')}
                value={formData.location}
                onChange={(v) => updateField('location', v)}
                error={errors.location}
                icon={<Globe size={18} style={{ color: '#828782' }} />}
                required
              />
              <AuthInput
                label={t('الموقع الإلكتروني', 'Website')}
                placeholder="https://university.edu.sa"
                value={formData.universityWebsite}
                onChange={(v) => updateField('universityWebsite', v)}
                icon={<Globe size={18} style={{ color: '#828782' }} />}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><AuthInput label={t('الدولة', 'Country')} placeholder={t('المملكة العربية السعودية', 'Saudi Arabia')} value={formData.country} onChange={(value) => updateField('country', value)} /><AuthInput label={t('المدينة', 'City')} placeholder={t('الرياض', 'Riyadh')} value={formData.city} onChange={(value) => updateField('city', value)} /></div>
              <AuthInput label={t('العنوان', 'Address')} placeholder={t('العنوان المؤسسي', 'Institutional address')} value={formData.address} onChange={(value) => updateField('address', value)} icon={<Globe size={18} style={{ color: '#828782' }} />} />
            </>
          ) : (
            <>
              <h2 className="mb-1 text-base font-bold" style={{ color: '#0e0f0c' }}>
                {t('البيانات الأكاديمية', 'Academic Details')}
              </h2>
              <label className="block"><span className="mb-2 block text-sm font-semibold">{t('الجامعة المعتمدة', 'Active University')} *</span><AcademicReferenceCombobox value={formData.universityId} items={universities} selected={universities.find((item) => item.id === formData.universityId)} placeholder={t('اختر الجامعة', 'Select university')} searchPlaceholder={t('ابحث باسم الجامعة', 'Search universities')} emptyText={t('لا توجد جامعات مطابقة', 'No matching universities')} loading={academicLoading.universities} error={academicError.universities} showUniversityDetails onSearch={setUniversitySearch} onRetry={loadUniversities} onSelect={(selected) => setFormData((current) => ({ ...current, universityId: selected.id, university: selected.nameAr || selected.name, collegeId: '', college: '', departmentId: '', department: '', majorId: '', major: '' }))} />{errors.university && <p className="mt-1 text-xs text-red-600">{errors.university}</p>}</label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">{t('الكلية', 'College')} *</span><AcademicReferenceCombobox value={formData.collegeId} items={colleges} selected={colleges.find((item) => item.id === formData.collegeId)} placeholder={t('اختر الكلية', 'Select college')} searchPlaceholder={t('ابحث باسم الكلية', 'Search colleges')} emptyText={t('لا توجد كليات متاحة لهذه الجامعة', 'No colleges available for this university')} loading={academicLoading.colleges} error={academicError.colleges} disabled={!formData.universityId} onSelect={(selected) => setFormData((current) => ({ ...current, collegeId: selected.id, college: selected.nameAr || selected.name, departmentId: '', department: '', majorId: '', major: '' }))} />{errors.college && <p className="mt-1 text-xs text-red-600">{errors.college}</p>}</label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">{t('القسم', 'Department')} *</span><AcademicReferenceCombobox value={formData.departmentId} items={departments} selected={departments.find((item) => item.id === formData.departmentId)} placeholder={t('اختر القسم', 'Select department')} searchPlaceholder={t('ابحث باسم القسم', 'Search departments')} emptyText={t('لا توجد أقسام متاحة لهذه الكلية', 'No departments available for this college')} loading={academicLoading.departments} error={academicError.departments} disabled={!formData.collegeId} onSelect={(selected) => setFormData((current) => ({ ...current, departmentId: selected.id, department: selected.nameAr || selected.name, majorId: '', major: '' }))} />{errors.department && <p className="mt-1 text-xs text-red-600">{errors.department}</p>}</label>
              <label className="block"><span className="mb-2 block text-sm font-semibold">{t('التخصص', 'Major')} {majors.length > 0 ? '*' : ''}</span><AcademicReferenceCombobox value={formData.majorId} items={majors} selected={majors.find((item) => item.id === formData.majorId)} placeholder={t('اختر التخصص', 'Select major')} searchPlaceholder={t('ابحث باسم التخصص', 'Search majors')} emptyText={t('لا توجد تخصصات مسجلة لهذا القسم', 'No majors registered for this department')} loading={academicLoading.majors} error={academicError.majors} disabled={!formData.departmentId || majors.length === 0} onSelect={(selected) => setFormData((current) => ({ ...current, majorId: selected.id, major: selected.nameAr || selected.name }))} />{errors.major && <p className="mt-1 text-xs text-red-600">{errors.major}</p>}</label>
              <AuthInput label={t('الرقم الجامعي', 'Student Number')} placeholder="ST-2026-001" value={formData.studentNumber} onChange={(v) => updateField('studentNumber', v)} error={errors.studentNumber} icon={<User size={18} style={{ color: '#828782' }} />} required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><AuthInput label={t('سنة الالتحاق', 'Enrollment Year')} type="number" placeholder="2023" value={formData.enrollmentYear} onChange={(v) => updateField('enrollmentYear', v)} error={errors.enrollmentYear} required /><AuthInput label={t('سنة التخرج المتوقعة', 'Expected Graduation')} type="number" placeholder="2027" value={formData.expectedGraduationYear} onChange={(v) => updateField('expectedGraduationYear', v)} error={errors.expectedGraduationYear} required /></div>
              <label className="block"><span className="mb-2 block text-sm font-semibold">{t('حالة الطالب', 'Student Status')}</span><select className="w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold" value={formData.studentStatus} onChange={(e) => updateField('studentStatus', e.target.value)}><option value="student">{t('طالب', 'Student')}</option><option value="graduate">{t('خريج', 'Graduate')}</option></select></label>

              <div>
                <label className="mb-2 block text-sm font-semibold" style={{ color: '#0e0f0c' }}>
                  {t('المستوى الأكاديمي', 'Academic Level')}
                </label>
                <div className="relative">
                  <Layers3 size={18} style={{ color: '#828782' }} className={cn('absolute top-3', isRTL ? 'right-3' : 'left-3')} />
                  <select
                    value={formData.academicLevel}
                    onChange={(e) => updateField('academicLevel', e.target.value)}
                    className={cn(
                      'w-full rounded-2xl border bg-white px-4 py-3 text-sm font-semibold outline-none transition-all',
                      isRTL ? 'pr-10 text-right' : 'pl-10 text-left',
                    )}
                    style={{ borderColor: errors.academicLevel ? '#dc2626' : '#dfe1dd', color: '#0e0f0c' }}
                  >
                    {academicLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {isRTL ? level.labelAr : level.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.academicLevel && (
                  <p className="mt-1 text-xs font-semibold text-red-600">{errors.academicLevel}</p>
                )}
              </div>
            </>
          )}
        </motion.div>

        <div className="mt-6 flex flex-wrap gap-2"><DevelopmentAutofillButton onClick={fillUniversityTestData} label={t('تعبئة بيانات جامعة تجريبية', 'Fill Test University Data')} /><button type="button" onClick={resetForm} className="rounded-full border px-3 py-2 text-xs font-semibold">{t('مسح الحقول', 'Clear Fields')}</button></div>

        <div className="mt-4 flex gap-3 justify-between">
          <Link to="/login">
            <AuthButton variant="outline" icon={<ChevronLeft size={16} />}>
              {t('تسجيل الدخول', 'Sign In')}
            </AuthButton>
          </Link>
          <div className="flex w-full gap-3">
            {step > 1 && (
              <AuthButton variant="outline" onClick={handleBack}>
                {t('السابق', 'Back')}
              </AuthButton>
            )}
            <AuthButton onClick={step === 1 || (step === 2 && formData.accountType === 'university') ? handleNext : handleSubmit} disabled={isRegistering}>
              {step === 1 || (step === 2 && formData.accountType === 'university') ? (
                t('التالي', 'Next')
              ) : isRegistering ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {t('جاري الإنشاء...', 'Creating...')}
                </span>
              ) : (
                t('إنشاء الحساب', 'Create Account')
              )}
            </AuthButton>
          </div>
        </div>

        <p className="mt-6 text-center text-sm font-semibold" style={{ color: '#5b5e5a' }}>
          {t('لديك حساب بالفعل؟', 'Already have an account?')}{' '}
          <Link to="/login" className="font-bold transition-colors hover:underline" style={{ color: '#9fe870' }}>
            {t('تسجيل الدخول', 'Sign In')}
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}

