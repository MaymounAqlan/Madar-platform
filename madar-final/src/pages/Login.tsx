import { useState } from 'react';
import { Link } from 'react-router';
import AuthLayout from '@/components/AuthLayout';
import AuthInput from '@/components/AuthInput';
import AuthButton from '@/components/AuthButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Globe } from 'lucide-react';

export default function Login() {
  const { t, toggleLanguage, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = t('البريد الإلكتروني مطلوب', 'Email is required');
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = t('صيغة البريد الإلكتروني غير صحيحة', 'Invalid email format');
    }
    if (!password) {
      newErrors.password = t('كلمة المرور مطلوبة', 'Password is required');
    } else if (password.length < 8) {
      newErrors.password = t('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'Password must be at least 8 characters');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // TODO: Implement login
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {/* Language Toggle */}
        <div className="mb-8 flex justify-end">
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
        <div className="mb-8">
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif", color: '#0e0f0c' }}
          >
            {t('مرحباً بعودتك', 'Welcome Back')}
          </h1>
          <p className="mt-2 text-sm font-semibold" style={{ color: '#5b5e5a' }}>
            {t('سجل دخولك للوصول إلى لوحة التحكم', 'Sign in to access your dashboard')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AuthInput
            label={t('البريد الإلكتروني', 'Email')}
            type="email"
            placeholder={t('أدخل بريدك الإلكتروني', 'Enter your email')}
            value={email}
            onChange={setEmail}
            error={errors.email}
            icon={<Mail size={18} style={{ color: '#828782' }} />}
            required
          />

          <AuthInput
            label={t('كلمة المرور', 'Password')}
            type="password"
            placeholder={t('أدخل كلمة المرور', 'Enter your password')}
            value={password}
            onChange={setPassword}
            error={errors.password}
            icon={<Lock size={18} style={{ color: '#828782' }} />}
            required
          />

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[#dfe1dd] text-[#9fe870] focus:ring-[#9fe870]"
              />
              <span className="text-sm font-semibold" style={{ color: '#5b5e5a' }}>
                {t('تذكرني', 'Remember me')}
              </span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-semibold transition-colors hover:underline"
              style={{ color: '#9fe870' }}
            >
              {t('نسيت كلمة المرور؟', 'Forgot Password?')}
            </Link>
          </div>

          {/* Submit */}
          <AuthButton type="submit">
            {t('تسجيل الدخول', 'Sign In')}
          </AuthButton>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1" style={{ background: '#dfe1dd' }} />
          <span className="text-xs font-semibold" style={{ color: '#828782' }}>{t('أو', 'or')}</span>
          <div className="h-px flex-1" style={{ background: '#dfe1dd' }} />
        </div>

        {/* Social Buttons */}
        <div className="flex flex-col gap-3">
          <AuthButton variant="outline" icon={
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          }>
            {t('الدخول باستخدام Google', 'Continue with Google')}
          </AuthButton>
          <AuthButton variant="outline" icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          }>
            {t('الدخول باستخدام LinkedIn', 'Continue with LinkedIn')}
          </AuthButton>
        </div>

        {/* Register Link */}
        <p className="mt-8 text-center text-sm font-semibold" style={{ color: '#5b5e5a' }}>
          {t('ليس لديك حساب؟', "Don't have an account?")}{' '}
          <Link to="/register" className="font-bold transition-colors hover:underline" style={{ color: '#9fe870' }}>
            {t('سجل الآن', 'Register')}
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
