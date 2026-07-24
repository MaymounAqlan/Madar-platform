import { useState } from 'react';
import { Link } from 'react-router';
import AuthLayout from '@/components/AuthLayout';
import AuthInput from '@/components/AuthInput';
import AuthButton from '@/components/AuthButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Building2, School, Mail, Lock, User, Phone, Globe, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type AccountType = 'student' | 'company' | 'university';

const accountTypes: { type: AccountType; labelAr: string; labelEn: string; icon: React.ReactNode; descAr: string; descEn: string }[] = [
  { type: 'student', labelAr: 'طالب', labelEn: 'Student', icon: <GraduationCap size={28} />, descAr: 'ابحث عن وظائف وتدريب', descEn: 'Find jobs and internships' },
  { type: 'company', labelAr: 'شركة', labelEn: 'Company', icon: <Building2 size={28} />, descAr: 'انشر وظائف ووظف مواهب', descEn: 'Post jobs and hire talent' },
  { type: 'university', labelAr: 'جامعة', labelEn: 'University', icon: <School size={28} />, descAr: 'راقب أداء الطلاب', descEn: 'Monitor student performance' },
];

const ease = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Register() {
  const { t, toggleLanguage, isRTL } = useLanguage();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>('student');
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', confirmPassword: '', phone: '',
    university: '', college: '', major: '', graduationYear: '', gpa: '',
    companyName: '', industry: '', companySize: '', companyLocation: '',
    uniName: '', uniLocation: '', website: '', studentCount: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
    t('ضعيف جداً', 'Very Weak'),
    t('ضعيف', 'Weak'),
    t('متوسط', 'Fair'),
    t('قوي', 'Strong'),
    t('قوي جداً', 'Very Strong'),
  ];
  const strengthColors = ['#dc2626', '#f59e0b', '#f59e0b', '#1ba442', '#1ba442'];

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (step === 2) {
      if (!formData.fullName.trim()) newErrors.fullName = t('الاسم الكامل مطلوب', 'Full name is required');
      if (!formData.email.trim()) newErrors.email = t('البريد الإلكتروني مطلوب', 'Email is required');
      else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = t('صيغة غير صحيحة', 'Invalid format');
      if (!formData.password) newErrors.password = t('كلمة المرور مطلوبة', 'Password is required');
      else if (formData.password.length < 8) newErrors.password = t('8 أحرف على الأقل', 'At least 8 characters');
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('كلمات المرور غير متطابقة', 'Passwords do not match');
      if (!formData.phone.trim()) newErrors.phone = t('رقم الهاتف مطلوب', 'Phone is required');
    }
    if (step === 3) {
      if (accountType === 'student') {
        if (!formData.university.trim()) newErrors.university = t('الجامعة مطلوبة', 'University is required');
        if (!formData.college.trim()) newErrors.college = t('الكلية مطلوبة', 'College is required');
        if (!formData.major.trim()) newErrors.major = t('التخصص مطلوب', 'Major is required');
      }
      if (accountType === 'company') {
        if (!formData.companyName.trim()) newErrors.companyName = t('اسم الشركة مطلوب', 'Company name is required');
        if (!formData.industry.trim()) newErrors.industry = t('المجال مطلوب', 'Industry is required');
      }
      if (accountType === 'university') {
        if (!formData.uniName.trim()) newErrors.uniName = t('اسم الجامعة مطلوب', 'University name is required');
        if (!formData.uniLocation.trim()) newErrors.uniLocation = t('الموقع مطلوب', 'Location is required');
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < 3) setStep(step + 1);
      else setDone(true);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const direction = isRTL ? -1 : 1;

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
            {t('يمكنك الآن تسجيل الدخول واستكشاف المنصة', 'You can now sign in and explore the platform')}
          </p>
          <div className="mt-8 w-full">
            <Link to="/student/dashboard">
              <AuthButton>
                {t('الذهاب للوحة التحكم', 'Go to Dashboard')}
              </AuthButton>
            </Link>
          </div>
          <div className="mt-3 w-full">
            <Link to="/login">
              <AuthButton variant="outline">
                {t('تسجيل الدخول', 'Sign In')}
              </AuthButton>
            </Link>
          </div>
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
        {/* Language Toggle */}
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

        {/* Heading */}
        <div className="mb-6">
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif", color: '#0e0f0c' }}
          >
            {t('إنشاء حساب جديد', 'Create Account')}
          </h1>
          <p className="mt-1 text-sm font-semibold" style={{ color: '#5b5e5a' }}>
            {t('خطوات بسيطة لفتح حسابك', 'A few simple steps to create your account')}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8 flex items-center gap-3">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
                  s <= step ? "text-[#0e0f0c]" : "text-[#828782]"
                )}
                style={{ background: s <= step ? '#9fe870' : '#f0f1ee' }}
              >
                {s < step ? <CheckCircle2 size={16} /> : s}
              </div>
              {s < 3 && (
                <div
                  className="h-0.5 flex-1 transition-all duration-300"
                  style={{ background: s < step ? '#9fe870' : '#dfe1dd' }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 * direction }}
              transition={{ duration: 0.3, ease }}
            >
              <h2 className="mb-4 text-base font-bold" style={{ color: '#0e0f0c' }}>
                {t('اختر نوع الحساب', 'Select Account Type')}
              </h2>
              <div className="flex flex-col gap-3">
                {accountTypes.map((at) => (
                  <button
                    key={at.type}
                    onClick={() => setAccountType(at.type)}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border-2 p-4 text-start transition-all duration-200 hover:shadow-md",
                      accountType === at.type
                        ? "border-[#9fe870] bg-[#F4FCF0]"
                        : "border-transparent bg-[#f0f1ee] hover:bg-[#ebede9]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-colors",
                        accountType === at.type ? "bg-[#9fe870] text-[#0e0f0c]" : "bg-white text-[#5b5e5a]"
                      )}
                    >
                      {at.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#0e0f0c' }}>{t(at.labelAr, at.labelEn)}</p>
                      <p className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t(at.descAr, at.descEn)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 * direction }}
              transition={{ duration: 0.3, ease }}
              className="flex flex-col gap-4"
            >
              <h2 className="mb-1 text-base font-bold" style={{ color: '#0e0f0c' }}>
                {t('بيانات الحساب', 'Account Details')}
              </h2>
              <AuthInput
                label={t('الاسم الكامل', 'Full Name')}
                placeholder={t('أحمد محمد', 'Ahmed Mohammed')}
                value={formData.fullName}
                onChange={(v) => updateField('fullName', v)}
                error={errors.fullName}
                icon={<User size={18} style={{ color: '#828782' }} />}
                required
              />
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
              {/* Password Strength */}
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
              <AuthInput
                label={t('رقم الهاتف', 'Phone')}
                type="tel"
                placeholder="+966 50 123 4567"
                value={formData.phone}
                onChange={(v) => updateField('phone', v)}
                error={errors.phone}
                icon={<Phone size={18} style={{ color: '#828782' }} />}
                required
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 * direction }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 * direction }}
              transition={{ duration: 0.3, ease }}
              className="flex flex-col gap-4"
            >
              <h2 className="mb-1 text-base font-bold" style={{ color: '#0e0f0c' }}>
                {t('بيانات إضافية', 'Profile Details')}
              </h2>

              {accountType === 'student' && (
                <>
                  <AuthInput label={t('الجامعة', 'University')} placeholder={t('جامعة الملك سعود', 'King Saud University')} value={formData.university} onChange={(v) => updateField('university', v)} error={errors.university} icon={<School size={18} style={{ color: '#828782' }} />} required />
                  <AuthInput label={t('الكلية', 'College')} placeholder={t('علوم الحاسب', 'Computer Science')} value={formData.college} onChange={(v) => updateField('college', v)} error={errors.college} required />
                  <AuthInput label={t('التخصص', 'Major')} placeholder={t('هندسة البرمجيات', 'Software Engineering')} value={formData.major} onChange={(v) => updateField('major', v)} error={errors.major} required />
                  <div className="grid grid-cols-2 gap-4">
                    <AuthInput label={t('سنة التخرج', 'Graduation Year')} placeholder="2026" value={formData.graduationYear} onChange={(v) => updateField('graduationYear', v)} />
                    <AuthInput label={t('المعدل', 'GPA')} placeholder="3.6" value={formData.gpa} onChange={(v) => updateField('gpa', v)} />
                  </div>
                </>
              )}

              {accountType === 'company' && (
                <>
                  <AuthInput label={t('اسم الشركة', 'Company Name')} placeholder={t('شركة تك سول', 'TechSol')} value={formData.companyName} onChange={(v) => updateField('companyName', v)} error={errors.companyName} icon={<Building2 size={18} style={{ color: '#828782' }} />} required />
                  <AuthInput label={t('المجال', 'Industry')} placeholder={t('تقنية المعلومات', 'Information Technology')} value={formData.industry} onChange={(v) => updateField('industry', v)} error={errors.industry} required />
                  <AuthInput label={t('الحجم', 'Company Size')} placeholder={t('50-250 موظف', '50-250 employees')} value={formData.companySize} onChange={(v) => updateField('companySize', v)} />
                  <AuthInput label={t('الموقع', 'Location')} placeholder={t('الرياض', 'Riyadh')} value={formData.companyLocation} onChange={(v) => updateField('companyLocation', v)} />
                </>
              )}

              {accountType === 'university' && (
                <>
                  <AuthInput label={t('اسم الجامعة', 'University Name')} placeholder={t('جامعة الملك سعود', 'King Saud University')} value={formData.uniName} onChange={(v) => updateField('uniName', v)} error={errors.uniName} icon={<School size={18} style={{ color: '#828782' }} />} required />
                  <AuthInput label={t('الموقع', 'Location')} placeholder={t('الرياض', 'Riyadh')} value={formData.uniLocation} onChange={(v) => updateField('uniLocation', v)} error={errors.uniLocation} required />
                  <AuthInput label={t('الموقع الإلكتروني', 'Website')} placeholder="https://university.edu.sa" value={formData.website} onChange={(v) => updateField('website', v)} />
                  <AuthInput label={t('عدد الطلاب', 'Student Count')} placeholder="25000" value={formData.studentCount} onChange={(v) => updateField('studentCount', v)} />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className={cn("mt-8 flex gap-3", step === 1 && "justify-end")}>
          {step > 1 && (
            <AuthButton variant="outline" onClick={handleBack} icon={isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}>
              {t('رجوع', 'Back')}
            </AuthButton>
          )}
          <AuthButton onClick={handleNext}>
            {step < 3 ? t('التالي', 'Next') : t('إنشاء الحساب', 'Create Account')}
          </AuthButton>
        </div>

        {/* Login Link */}
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
