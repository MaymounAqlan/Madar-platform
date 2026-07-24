import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import { Loader2, XCircle } from 'lucide-react';
import { setTokens } from '@/services';
import { authApi, getDashboardPath } from '@/services/authApi';
import { toast } from 'sonner';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const accessToken = searchParams.get('token') || searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const errorMsg = searchParams.get('error');
    const status = searchParams.get('status');
    const message = searchParams.get('message');
    const payload = searchParams.get('payload');
    const provider = searchParams.get('provider') || 'OAuth';

    toast.loading(`جاري التحقق من حساب ${provider}...`, { id: 'oauth-auth' });

    if (errorMsg) {
      toast.dismiss('oauth-auth');
      toast.error(decodeURIComponent(errorMsg));
      setError(decodeURIComponent(errorMsg));
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    if (status === 'USER_NOT_FOUND' || status === 'PROFILE_INCOMPLETE') {
      toast.dismiss('oauth-auth');
      const query = new URLSearchParams();
      if (status) query.set('status', status);
      if (message) query.set('message', message);
      if (payload) query.set('payload', payload);
      if (provider) query.set('provider', provider);
      navigate(`/complete-profile?${query.toString()}`, { replace: true });
      return;
    }

    if (status === 'USER_EXISTS') {
      toast.dismiss('oauth-auth');
      const friendlyMessage = message || 'هذا البريد مرتبط بحساب موجود، يرجى تسجيل الدخول.';
      navigate(`/login?oauthStatus=${encodeURIComponent(status)}&message=${encodeURIComponent(friendlyMessage)}`, { replace: true });
      return;
    }

    if (accessToken) {
      setTokens(accessToken, refreshToken || '');

      authApi.getCurrentUser()
        .then((user) => {
          toast.dismiss('oauth-auth');
          toast.success(message || 'تم تسجيل الدخول بنجاح');
          localStorage.setItem('userType', user.role);
          navigate(getDashboardPath(user.role), { replace: true });
        })
        .catch((err: any) => {
          toast.dismiss('oauth-auth');
          toast.error(err?.message || 'تعذر تسجيل الدخول');
          navigate('/login?oauthStatus=OAUTH_FAILED&message=' + encodeURIComponent('تعذر تسجيل الدخول'), { replace: true });
        });
      return;
    }

    toast.dismiss('oauth-auth');
    setError('Invalid OAuth response - missing token');
    setTimeout(() => navigate('/login', { replace: true }), 3000);
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#f0f1ee' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
            <XCircle size={40} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#0e0f0c' }}>
            فشل تسجيل الدخول
          </h1>
          <p className="mt-2 text-sm font-semibold text-red-500">{error}</p>
          <p className="mt-4 text-sm" style={{ color: '#5b5e5a' }}>
            جاري إعادة توجيهك...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: '#f0f1ee' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ background: '#E7FDD8' }}>
          <Loader2 size={40} style={{ color: '#1ba442' }} className="animate-spin" />
        </div>
        <h1 className="text-2xl font-black" style={{ color: '#0e0f0c' }}>
          جاري التحقق من حساب OAuth...
        </h1>
        <p className="mt-2 text-sm font-semibold" style={{ color: '#5b5e5a' }}>
          يرجى الانتظار بينما نكمل عملية المصادقة
        </p>
      </motion.div>
    </div>
  );
}
