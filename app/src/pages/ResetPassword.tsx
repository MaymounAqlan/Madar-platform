import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/services/authApi';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const token = searchParams.get('token') || '';
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) { setError('رابط إعادة التعيين غير صالح'); return; }
    if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    if (!passwordPattern.test(password)) { setError('كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم'); return; }
    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتين'); return; }
    try {
      setLoading(true);
      await authApi.resetPassword(token, password);
      setSent(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err: any) {
      setError(err.message || 'تعذر إعادة تعيين كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0F] to-[#1A1A2E]">
      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10">
        <h1 className="text-2xl font-bold text-white text-center mb-2">إعادة تعيين كلمة المرور</h1>
        <p className="text-white/50 text-sm text-center mb-6">أدخل كلمة مرور جديدة لحسابك في مدار</p>

        {error && <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg text-sm">{error}</div>}

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">كلمة المرور الجديدة</label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pr-10 p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30"
                  placeholder="Password123"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">تأكيد كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 w-5 h-5 text-white/40" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pr-10 p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30"
                  placeholder="Password123"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#9fe870] text-[#0A0A0F] font-bold rounded-xl hover:scale-105 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...</>
              ) : (
                <>حفظ كلمة المرور <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-16 h-16 text-[#9fe870] mx-auto" />
            <p className="text-white font-semibold">تم تحديث كلمة المرور بنجاح</p>
            <p className="text-white/60 text-sm">سيتم توجيهك إلى صفحة تسجيل الدخول.</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-[#9fe870] text-sm hover:underline">العودة لتسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
}
