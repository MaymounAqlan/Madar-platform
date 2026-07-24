import { useState } from 'react';
import { Link } from 'react-router';
import AuthLayout from '@/components/AuthLayout';
import AuthInput from '@/components/AuthInput';
import AuthButton from '@/components/AuthButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2, Globe } from 'lucide-react';

export default function ForgotPassword() {
  const { t, toggleLanguage, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t('البريد الإلكتروني مطلوب', 'Email is required'));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t('صيغة البريد الإلكتروني غير صحيحة', 'Invalid email format'));
      return;
    }
    setError('');
    setSent(true);
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

        {!sent ? (
          <>
            {/* Heading */}
            <div className="mb-8">
              <h1
                className="text-2xl font-black tracking-tight"
                style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif", color: '#0e0f0c' }}
              >
                {t('إعادة تعيين كلمة المرور', 'Reset Password')}
              </h1>
              <p className="mt-2 text-sm font-semibold" style={{ color: '#5b5e5a' }}>
                {t('أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة التعيين', 'Enter your email and we will send you a reset link')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <AuthInput
                label={t('البريد الإلكتروني', 'Email')}
                type="email"
                placeholder="ahmed@example.com"
                value={email}
                onChange={setEmail}
                error={error}
                icon={<Mail size={18} style={{ color: '#828782' }} />}
                required
              />
              <AuthButton type="submit">
                {t('إرسال رابط إعادة التعيين', 'Send Reset Link')}
              </AuthButton>
            </form>
          </>
        ) : (
          /* Success State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="flex flex-col items-center text-center"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: '#E7FDD8' }}>
              <CheckCircle2 size={40} style={{ color: '#1ba442' }} />
            </div>
            <h1
              className="text-2xl font-black tracking-tight"
              style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif", color: '#0e0f0c' }}
            >
              {t('تحقق من بريدك الإلكتروني', 'Check Your Email')}
            </h1>
            <p className="mt-2 text-sm font-semibold" style={{ color: '#5b5e5a' }}>
              {t('لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى', 'We have sent a password reset link to')}
            </p>
            <p className="mt-1 text-sm font-bold" style={{ color: '#0e0f0c' }}>{email}</p>
          </motion.div>
        )}

        {/* Back to Login */}
        <p className="mt-8 text-center text-sm font-semibold" style={{ color: '#5b5e5a' }}>
          <Link to="/login" className="font-bold transition-colors hover:underline" style={{ color: '#9fe870' }}>
            {t('العودة لتسجيل الدخول', 'Back to Login')}
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
