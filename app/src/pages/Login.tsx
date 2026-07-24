import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Languages,
  Linkedin,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { LaptopMockup } from '@/components/landing/DeviceMockups';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { getDashboardPath } from '@/services/authApi';
import './login.css';

function getLoginErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message)) return message.filter((item): item is string => typeof item === 'string').join('، ');
  }

  return fallback;
}

export default function Login() {
  const [searchParams] = useSearchParams();
  const oauthMessage = searchParams.get('message') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(oauthMessage);
  const { login, user, isAuthenticated, isLoggingIn } = useAuth();
  const { t, isRTL, dir, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const DirectionArrow = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate(getDashboardPath(user?.role), { replace: true });
  }, [isAuthenticated, navigate, user?.role]);

  useEffect(() => {
    if (oauthMessage) toast.error(oauthMessage);
  }, [oauthMessage]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError(t('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'Enter your email and password'));
      return;
    }

    try {
      const result = await login({ email: email.trim(), password });
      toast.success(t('تم تسجيل الدخول بنجاح', 'Signed in successfully'));
      navigate(getDashboardPath(result.user.role), { replace: true });
    } catch (loginError: unknown) {
      const message = getLoginErrorMessage(
        loginError,
        t('تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.', 'Unable to sign in. Check your details and try again.'),
      );
      setError(message);
      toast.error(t('تعذر تسجيل الدخول', 'Unable to sign in'));
    }
  };

  const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

  const handleGoogle = () => {
    toast.loading(t('جاري الاتصال بحساب Google...', 'Connecting to Google...'), { id: 'google-auth' });
    window.location.href = `${apiBaseUrl}/auth/google`;
  };

  const handleLinkedIn = () => {
    window.location.href = `${apiBaseUrl}/auth/linkedin`;
  };

  const capabilities = [
    {
      icon: BarChart3,
      ar: 'مؤشرات جاهزية واضحة وقابلة للمتابعة',
      en: 'Clear, trackable readiness insights',
    },
    {
      icon: Target,
      ar: 'مطابقة فرص مبنية على بيانات الملف',
      en: 'Opportunity matching based on profile data',
    },
    {
      icon: ShieldCheck,
      ar: 'بوابات آمنة للطلاب والجامعات والشركات',
      en: 'Secure portals for students, universities, and companies',
    },
  ];

  return (
    <div
      dir={dir}
      className="min-h-dvh overflow-x-hidden bg-[#f0f1ee] px-4 py-4 text-[#0e0f0c] sm:px-6 sm:py-6 lg:px-8"
    >
      <header className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center rounded-md text-xl font-bold tracking-normal text-[#0e0f0c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442] focus-visible:ring-offset-2"
          aria-label={t('العودة إلى الصفحة الرئيسية', 'Return to home page')}
        >
          MADAR
        </Link>
        <button
          type="button"
          onClick={toggleLanguage}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#cfd2cc] bg-white px-4 text-sm font-semibold text-[#0e0f0c] transition hover:border-[#9fe870] hover:bg-[#f7f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]"
          aria-label={t('التبديل إلى الإنجليزية', 'Switch to Arabic')}
        >
          <Languages size={19} aria-hidden="true" />
          <span>{isRTL ? 'EN' : 'AR'}</span>
        </button>
      </header>

      <main className="login-geometric-shell mx-auto grid w-full max-w-7xl overflow-hidden border border-[#dfe1dd] bg-white shadow-[0_18px_55px_rgba(14,15,12,0.08)] lg:min-h-[690px] lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex min-w-0 items-center px-5 py-9 sm:px-10 sm:py-12 lg:px-14 xl:px-20">
          <div className="mx-auto w-full max-w-md">
            <p className="text-sm font-bold text-[#1ba442]">{t('مرحباً بعودتك', 'Welcome back')}</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-[#0e0f0c] sm:text-4xl">
              {t('تسجيل الدخول إلى مدار', 'Sign in to MADAR')}
            </h1>
            <p className="mt-3 text-sm font-medium leading-7 text-[#5b5e5a]">
              {t(
                'استخدم حسابك للوصول إلى بوابتك ومتابعة بياناتك وعملياتك.',
                'Use your account to access your portal and continue managing your data and activity.',
              )}
            </p>

            {error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-lg border border-[#f0c7c3] bg-[#fff7f6] p-3.5 text-sm font-medium leading-6 text-[#9b2921]"
              >
                <AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-semibold text-[#0e0f0c]">
                  {t('البريد الإلكتروني', 'Email address')}
                </label>
                <div className="relative">
                  <Mail
                    size={20}
                    className={cn(
                      'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#747874]',
                      isRTL ? 'right-4' : 'left-4',
                    )}
                    aria-hidden="true"
                  />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    dir="ltr"
                    required
                    aria-invalid={Boolean(error)}
                    className={cn(
                      'min-h-12 w-full rounded-lg border border-[#cfd2cc] bg-white px-4 text-sm font-medium text-[#0e0f0c] outline-none transition placeholder:text-[#9a9e98] hover:border-[#aeb2ab] focus:border-[#1ba442] focus:ring-2 focus:ring-[#9fe870]/45',
                      isRTL ? 'pr-12 text-right' : 'pl-12 text-left',
                    )}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label htmlFor="login-password" className="text-sm font-semibold text-[#0e0f0c]">
                    {t('كلمة المرور', 'Password')}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-bold text-[#187d35] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]"
                  >
                    {t('نسيت كلمة المرور؟', 'Forgot password?')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock
                    size={20}
                    className={cn(
                      'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#747874]',
                      isRTL ? 'right-4' : 'left-4',
                    )}
                    aria-hidden="true"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    dir="ltr"
                    required
                    aria-invalid={Boolean(error)}
                    className="min-h-12 w-full rounded-lg border border-[#cfd2cc] bg-white px-12 text-left text-sm font-medium text-[#0e0f0c] outline-none transition placeholder:text-[#9a9e98] hover:border-[#aeb2ab] focus:border-[#1ba442] focus:ring-2 focus:ring-[#9fe870]/45"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className={cn(
                      'absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-[#5b5e5a] transition hover:bg-[#f0f1ee] hover:text-[#0e0f0c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]',
                      isRTL ? 'left-1' : 'right-1',
                    )}
                    aria-label={showPassword ? t('إخفاء كلمة المرور', 'Hide password') : t('إظهار كلمة المرور', 'Show password')}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="login-cut-control inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#9fe870] px-5 text-sm font-bold text-[#0e0f0c] transition hover:bg-[#86d957] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                    {t('جاري تسجيل الدخول...', 'Signing in...')}
                  </>
                ) : (
                  <>
                    {t('تسجيل الدخول', 'Sign in')}
                    <DirectionArrow size={20} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4" aria-hidden="true">
              <div className="h-px flex-1 bg-[#dfe1dd]" />
              <span className="text-xs font-semibold text-[#747874]">{t('أو تابع باستخدام', 'or continue with')}</span>
              <div className="h-px flex-1 bg-[#dfe1dd]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleGoogle}
                className="login-cut-control inline-flex min-h-12 items-center justify-center gap-3 border border-[#cfd2cc] bg-white px-4 text-sm font-semibold text-[#0e0f0c] transition hover:border-[#9fe870] hover:bg-[#f7f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#dfe1dd] text-sm font-bold" aria-hidden="true">
                  G
                </span>
                Google
              </button>
              <button
                type="button"
                onClick={handleLinkedIn}
                className="login-cut-control inline-flex min-h-12 items-center justify-center gap-3 border border-[#cfd2cc] bg-white px-4 text-sm font-semibold text-[#0e0f0c] transition hover:border-[#9fe870] hover:bg-[#f7f8f5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]"
              >
                <Linkedin size={24} className="text-[#0a66c2]" aria-hidden="true" />
                LinkedIn
              </button>
            </div>

            <p className="mt-7 text-center text-sm font-medium text-[#5b5e5a]">
              {t('ليس لديك حساب؟', 'New to MADAR?')}{' '}
              <Link
                to="/register"
                className="font-bold text-[#187d35] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1ba442]"
              >
                {t('إنشاء حساب', 'Create an account')}
              </Link>
            </p>
          </div>
        </section>

        <aside
          className={cn(
            'login-geometric-panel relative hidden min-w-0 overflow-hidden bg-[#0e0f0c] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14',
            isRTL ? 'login-geometric-panel-rtl' : 'login-geometric-panel-ltr',
          )}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-[#9fe870]" aria-hidden="true" />
          <div className="login-geometric-mark pointer-events-none absolute" aria-hidden="true" />
          <div className="login-geometric-lines pointer-events-none absolute" aria-hidden="true" />
          <div className="relative">
            <p className="text-sm font-bold text-[#9fe870]">
              {t('منصة واحدة، قرارات أوضح', 'One platform, clearer decisions')}
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight xl:text-4xl">
              {t(
                'اربط التعليم والمهارات والفرص في مسار مهني واحد.',
                'Connect education, skills, and opportunities in one career journey.',
              )}
            </h2>
            <div className="mt-7 grid gap-4">
              {capabilities.map(({ icon: Icon, ar, en }) => (
                <div key={en} className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#9fe870] text-[#0e0f0c]">
                    <Icon size={26} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold leading-6 text-[#e9ebe7]">{t(ar, en)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-10">
            <LaptopMockup
              src="/landing/student-jobs.png"
              alt={t('واجهة الفرص المهنية في منصة مدار', 'MADAR career opportunities interface')}
              imageClassName="bg-white"
            />
          </div>
        </aside>
      </main>

      <footer className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 py-5 text-center text-xs font-medium text-[#747874] sm:flex-row sm:text-start">
        <span>{t('منصة مدار للجاهزية المهنية', 'MADAR career readiness platform')}</span>
        <Link to="/" className="font-semibold text-[#5b5e5a] hover:text-[#0e0f0c] hover:underline">
          {t('العودة إلى الصفحة الرئيسية', 'Back to home')}
        </Link>
      </footer>
    </div>
  );
}
