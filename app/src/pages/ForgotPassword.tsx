import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { Mail, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { forgotPassword, isForgotPasswordLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('يرجى إدخال البريد الإلكتروني'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('صيغة البريد الإلكتروني غير صحيحة'); return; }
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء الإرسال');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A0A0F] to-[#1A1A2E]">
      <div className="w-full max-w-md p-8 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10">
        <h1 className="text-2xl font-bold text-white text-center mb-2">نسيت كلمة المرور</h1>
        <p className="text-white/50 text-sm text-center mb-6">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة التعيين</p>

        {error && <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg text-sm">{error}</div>}

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 w-5 h-5 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pr-10 p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/30"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isForgotPasswordLoading}
              className="w-full py-3 bg-[#9fe870] text-[#0A0A0F] font-bold rounded-xl hover:scale-105 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isForgotPasswordLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> جاري الإرسال...</>
              ) : (
                <>إرسال رابط إعادة التعيين <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="w-16 h-16 text-[#9fe870] mx-auto" />
            <p className="text-white font-semibold">تم إرسال الرابط بنجاح!</p>
            <p className="text-white/60 text-sm">تحقق من بريدك الإلكتروني ({email}) لرابط إعادة تعيين كلمة المرور.</p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-[#9fe870] text-sm hover:underline">العودة لتسجيل الدخول</Link>
        </div>
      </div>
    </div>
  );
}
