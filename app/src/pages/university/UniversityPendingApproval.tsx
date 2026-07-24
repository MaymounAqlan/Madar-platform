import { AlertTriangle, Building2, Clock3, Loader2, LogOut, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUniversityStatus } from '@/hooks/useUniversity';

export default function UniversityPendingApproval() {
  const { t, isRTL } = useLanguage();
  const { logout, isLoggingOut } = useAuth();
  const statusQuery = useUniversityStatus();
  const status = statusQuery.data;

  const formatDate = (value: string | null | undefined) => value
    ? new Date(value).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : t('غير محدد', 'Not specified');

  const content = status?.status === 'suspended'
    ? {
        icon: <ShieldAlert size={34} className="text-[#B91C1C]" />,
        title: t('الجامعة معلقة', 'University Suspended'),
        message: t('تم تعليق الوصول إلى بوابة الجامعة.', 'Access to the university portal has been suspended.'),
        reason: status.suspensionReason,
        bg: '#FEE2E2',
      }
    : status?.status === 'inactive'
      ? {
          icon: <XCircle size={34} className="text-[#B91C1C]" />,
          title: t('الطلب غير مفعل', 'Application Inactive'),
          message: t('لم يتم تفعيل طلب الجامعة أو تم رفضه.', 'The university application was not activated or was rejected.'),
          reason: status.rejectionReason,
          bg: '#FEE2E2',
        }
      : {
          icon: <Clock3 size={34} className="text-[#B45309]" />,
          title: t('الطلب قيد المراجعة', 'Application Under Review'),
          message: t('تم استلام طلب الجامعة وسيتم إشعاركم بعد مراجعته.', 'The university application was received. You will be notified after review.'),
          reason: null,
          bg: '#FEF3C7',
        };

  return <div className="flex min-h-[100dvh] items-center justify-center p-5" style={{ background: '#e8ebe6' }} dir={isRTL ? 'rtl' : 'ltr'}>
    <div className="w-full max-w-xl rounded-3xl border bg-white p-7 shadow-sm sm:p-9" style={{ borderColor: '#dfe1dd' }}>
      <div className="mb-7 flex items-center justify-between">
        <span className="text-xl font-black text-[#0e0f0c]">MADAR</span>
        <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-bold text-[#B45309]">{t('بوابة الجامعة', 'University Portal')}</span>
      </div>

      {statusQuery.isLoading ? <div className="flex min-h-72 items-center justify-center"><Loader2 size={32} className="animate-spin text-[#9fe870]" /></div> : statusQuery.isError || !status ? <div className="flex min-h-72 flex-col items-center justify-center gap-4 text-center"><AlertTriangle size={34} className="text-red-600" /><p className="text-sm font-semibold text-[#5b5e5a]">{t('تعذر تحميل حالة طلب الجامعة.', 'Unable to load the university application status.')}</p><button onClick={() => statusQuery.refetch()} className="inline-flex items-center gap-2 rounded-full bg-[#9fe870] px-5 py-2 text-sm font-bold"><RefreshCw size={15} />{t('إعادة المحاولة', 'Retry')}</button></div> : <>
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: content.bg }}>{content.icon}</div>
        <h1 className="text-2xl font-black text-[#0e0f0c]">{content.title}</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#5b5e5a]">{content.message}</p>

        <div className="mt-6 space-y-3 rounded-2xl bg-[#f0f1ee] p-5">
          <div className="flex items-center gap-3"><Building2 size={17} className="text-[#5b5e5a]" /><div><p className="text-xs font-semibold text-[#828782]">{t('الجامعة', 'University')}</p><p className="font-bold text-[#0e0f0c]">{status.name}</p></div></div>
          <div className="flex items-center gap-3"><Clock3 size={17} className="text-[#5b5e5a]" /><div><p className="text-xs font-semibold text-[#828782]">{t('تاريخ التقديم', 'Submitted At')}</p><p className="font-bold text-[#0e0f0c]">{formatDate(status.submittedAt)}</p></div></div>
          {content.reason && <div className="rounded-xl border border-red-200 bg-white p-3"><p className="text-xs font-semibold text-[#828782]">{t('السبب', 'Reason')}</p><p className="mt-1 text-sm font-bold text-[#B91C1C]">{content.reason}</p></div>}
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          {status.status === 'pending' && <button onClick={() => statusQuery.refetch()} disabled={statusQuery.isFetching} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#9fe870] px-5 text-sm font-bold disabled:opacity-50"><RefreshCw size={16} className={statusQuery.isFetching ? 'animate-spin' : ''} />{t('تحديث الحالة', 'Refresh Status')}</button>}
          <button onClick={() => logout()} disabled={isLoggingOut} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border px-5 text-sm font-bold disabled:opacity-50" style={{ borderColor: '#dfe1dd' }}><LogOut size={16} />{t('تسجيل الخروج', 'Logout')}</button>
        </div>
      </>}
    </div>
  </div>;
}
