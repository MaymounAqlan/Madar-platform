import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuditLogs } from '@/hooks/useAdmin';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { ScrollText, Search, ChevronLeft, ChevronRight, Loader2, FilterX, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const severityMap: Record<string, { ar: string; en: string; color: string; bg: string }> = {
  info: { ar: 'معلومات', en: 'Info', color: '#1ba442', bg: '#E7FDD8' },
  warning: { ar: 'تنبيه', en: 'Warning', color: '#B45309', bg: '#FEF3C7' },
  error: { ar: 'خطأ', en: 'Error', color: '#B91C1C', bg: '#FEE2E2' },
  critical: { ar: 'حرج', en: 'Critical', color: '#B91C1C', bg: '#FEE2E2' },
};

// Theme Colors
const COLORS = {
  primary: '#9fe870',      // MADAR Accent Green
  dark: '#272925',         // Soft Charcoal/Dark (Not pitch black)
  muted: '#5e615c',        // Softer gray-green text
  lightMuted: '#848782',   // Light gray-green for borders/hints
  border: '#e1e3df',       // Cohesive border
  bgLight: '#f4f5f2',      // Very light page backdrop
};

// Translations for Audit Log actions
function translateAuditAction(action: string): string {
  if (!action) return '-';
  const a = action.toUpperCase();
  
  // Route paths handling
  if (action.startsWith('/')) {
    const route = action.toLowerCase();
    if (route.includes('/users') && route.includes('/admin-view')) return 'عرض تفاصيل المستخدم الإدارية';
    if (route.includes('/users') && route.includes('/invalidate-sessions')) return 'إنهاء جلسات المستخدم';
    if (route.includes('/users') && route.includes('/role')) return 'تعيين دور للمستخدم';
    if (route.includes('/users') && route.includes('/status')) return 'تحديث حالة المستخدم';
    if (route.includes('/users') && route.includes('/resend-verification')) return 'إعادة إرسال التحقق';
    if (route.includes('/users') && route.includes('/send-reset-password')) return 'إرسال رابط استعادة كلمة المرور';
    if (route.endsWith('/users')) return 'عرض قائمة المستخدمين';
    if (route.includes('/users/')) return 'تعديل بيانات مستخدم';
    if (route.includes('/roles')) return 'إدارة الصلاحيات';
    if (route.includes('/permissions')) return 'إدارة التصاريح';
    if (route.includes('/backups')) return 'إدارة النسخ الاحتياطي';
    if (route.includes('/settings')) return 'تحديث إعدادات المنصة';
    if (route.includes('/universities')) return 'إدارة الجامعات';
    if (route.includes('/companies')) return 'إدارة الشركات';
  }

  if (a.includes('USER.UPDATE') || a.includes('UPDATE_USER')) return 'تعديل مستخدم';
  if (a.includes('USER.STATUS') || a.includes('STATUS_USER')) return 'تحديث حالة مستخدم';
  if (a.includes('USER.SESSIONS') || a.includes('SESSIONS_user') || a.includes('INVALIDATE_SESSIONS')) return 'إنهاء جلسات المستخدم';
  if (a.includes('RESEND_VERIFICATION')) return 'إعادة إرسال التحقق';
  if (a.includes('SEND_RESET_PASSWORD') || a.includes('RESET_PASSWORD')) return 'إعادة تعيين كلمة المرور';
  if (a.includes('ASSIGN_ROLE')) return 'تعيين دور/صلاحية';
  if (a.includes('UPDATE_ADMIN_ACCOUNT')) return 'تعديل حساب مسؤول';
  if (a.includes('REACTIVATE_ADMIN_ACCOUNT')) return 'إعادة تنشيط حساب مسؤول';
  if (a.includes('DISABLE_ADMIN_ACCOUNT')) return 'تعطيل حساب مسؤول';
  if (a.includes('CREATE_ADMIN_ACCOUNT')) return 'إنشاء حساب مسؤول';
  if (a.includes('UNAUTHORIZED') || a.includes('FORBIDDEN')) return 'محاولة وصول غير مصرح بها';
  if (a.includes('UNIVERSITY.APPROVE')) return 'موافقة على جامعة';
  if (a.includes('UNIVERSITY.REJECT')) return 'رفض طلب جامعة';
  if (a.includes('UNIVERSITY.SUSPEND')) return 'تعليق حساب جامعة';
  if (a.includes('UNIVERSITY.REACTIVATE')) return 'تنشيط حساب جامعة';
  if (a.includes('AUTH.LOGIN') || a.includes('LOGIN')) return 'تسجيل دخول';
  if (a.includes('AUTH.LOGOUT') || a.includes('LOGOUT')) return 'تسجيل خروج';
  if (a.includes('BACKUP.CREATE')) return 'إنشاء نسخة احتياطية';
  if (a.includes('BACKUP.RESTORE')) return 'استعادة نسخة احتياطية';
  if (a.includes('SETTINGS.UPDATE') || a.includes('SETTINGS_UPDATE')) return 'تحديث إعدادات المنصة';
  if (a.includes('ROLE.CREATE')) return 'إنشاء صلاحية جديدة';
  if (a.includes('PERMISSION.CREATE')) return 'إنشاء تصريح جديد';
  return action;
}

function translateAuditDescription(desc: string, action: string): string {
  if (!desc) return translateAuditAction(action);
  let d = desc.toLowerCase();
  
  if (d.includes('assigned role')) {
    const roleMatch = desc.match(/role\s+(\S+)/i);
    const userMatch = desc.match(/user\s+(\S+)/i);
    const roleName = roleMatch ? roleMatch[1] : '';
    const userId = userMatch ? userMatch[1] : '';
    return `تم تعيين الدور/الصلاحية "${roleName}" للمستخدم ${userId} بنجاح.`;
  }

  if (d.includes('updated admin account')) {
    const match = desc.match(/account\s+(\S+)/i);
    const userId = match ? match[1] : '';
    return `تم تحديث بيانات حساب المسؤول ${userId} بنجاح.`;
  }

  if (d.includes('reactivated admin account')) {
    const match = desc.match(/account\s+(\S+)/i);
    const userId = match ? match[1] : '';
    return `تم إعادة تنشيط حساب المسؤول ${userId} وتمكينه من الدخول.`;
  }

  if (d.includes('disabled admin account')) {
    const match = desc.match(/account\s+(\S+)/i);
    const userId = match ? match[1] : '';
    return `تم تعطيل حساب المسؤول ${userId} ومنعه من الدخول.`;
  }

  if (d.includes('created admin account')) {
    const emailMatch = desc.match(/account\s+(\S+)/i);
    const email = emailMatch ? emailMatch[1] : '';
    return `تم إنشاء حساب مسؤول جديد للبريد الإلكتروني: ${email}`;
  }

  if (d.includes('invalidated sessions')) {
    const userIdMatch = desc.match(/user\s+([a-fA-F0-9]+)/i);
    const userId = userIdMatch ? userIdMatch[1] : '';
    return `تم إنهاء جميع الجلسات النشطة للمستخدم ${userId} بنجاح.`;
  }
  
  if (d.includes('resent verification')) {
    const emailMatch = desc.match(/to\s+([^\s]+)/i);
    const email = emailMatch ? emailMatch[1].replace(/\.$/, '') : '';
    return `تم إعادة إرسال بريد التحقق بنجاح إلى البريد الإلكتروني: ${email}`;
  }

  if (d.includes('sent password reset')) {
    const emailMatch = desc.match(/to\s+([^\s]+)/i);
    const email = emailMatch ? emailMatch[1].replace(/\.$/, '') : '';
    return `تم إرسال رابط إعادة تعيين كلمة المرور بنجاح إلى البريد الإلكتروني: ${email}`;
  }

  if (d.includes('logged in')) return 'تم تسجيل دخول المسؤول إلى لوحة التحكم.';
  if (d.includes('logged out')) return 'تم تسجيل خروج المسؤول من النظام.';
  if (d.includes('backup created')) return 'تم إنشاء نسخة احتياطية جديدة لقاعدة البيانات.';
  if (d.includes('backup restored')) return 'تم استعادة قاعدة البيانات من النسخة الاحتياطية.';
  if (d.includes('updated settings')) return 'تم تعديل وتحديث الإعدادات العامة للمنصة.';
  if (d.includes('approved university')) return 'تمت الموافقة وتفعيل ملف الجامعة بنجاح.';
  if (d.includes('rejected university')) return 'تم رفض طلب تسجيل الجامعة.';
  if (d.includes('suspended university')) return 'تم تعليق ملف الجامعة مؤقتاً.';
  if (d.includes('invalidated sessions')) return 'تم إنهاء جميع جلسات النشاط للمستخدم.';
  if (d.includes('status updated') || d.includes('updated status')) return 'تم تغيير حالة الحساب بنجاح.';
  return desc;
}

function translateResource(res: string): string {
  if (!res) return '-';
  const r = res.toLowerCase();
  if (r === 'user' || r === 'users') return 'المستخدمين';
  if (r === 'university' || r === 'universities') return 'الجامعات';
  if (r === 'company' || r === 'companies') return 'الشركات';
  if (r === 'settings' || r === 'platformsettings') return 'الإعدادات';
  if (r === 'backup' || r === 'backups') return 'النسخ الاحتياطي';
  if (r === 'role' || r === 'roles') return 'الصلاحيات';
  if (r === 'permission' || r === 'permissions') return 'التصاريح';
  return res;
}

export default function AdminAuditLogs() {
  const { t, isRTL } = useLanguage();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const perPage = 20;

  const { data, isLoading } = useAuditLogs({ page, limit: perPage, action: actionFilter || undefined, severity: severityFilter || undefined });
  const logs = (data?.items ?? []).map((log: any) => ({
    id: log.id || log._id,
    action: log.action,
    resource: log.resource,
    description: log.description,
    severity: log.severity || 'info',
    actorId: log.actorId,
    timestamp: log.timestamp || log.createdAt,
    details: log.details,
  }));
  const totalPages = data?.pagination.totalPages ?? 1;

  function formatDate(value?: string | Date) {
    if (!value) return '-';
    return new Date(value).toLocaleString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <PortalLayout
      title={t('سجلات التدقيق والعمليات', 'Audit Logs')}
      subtitle={t('سجل الأحداث والعمليات الإدارية في المنصة', 'Record of events and admin actions')}
    >
      <div className={cn("space-y-6 pb-12", isRTL ? "rtl" : "ltr")} dir={isRTL ? "rtl" : "ltr"}>
        <ContentCard title={t('السجلات والأنشطة العامة', 'Logs')} icon={<ScrollText size={20} style={{ color: COLORS.muted }} />}>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center border-b pb-4" style={{ borderColor: COLORS.border }}>
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className={cn("absolute top-1/2 -translate-y-1/2", isRTL ? "right-3" : "left-3")} style={{ color: COLORS.lightMuted }} />
              <input 
                type="text" 
                placeholder={t('ابحث باسم الإجراء...', 'Filter action')} 
                value={actionFilter} 
                onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                className={cn(
                  "h-10 w-full rounded-full border text-sm font-semibold focus:outline-none focus:ring-2 transition-all",
                  isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                )} 
                style={{ borderColor: COLORS.border, background: '#ffffff', color: COLORS.dark }} 
              />
            </div>
            <select 
              value={severityFilter} 
              onChange={e => { setSeverityFilter(e.target.value); setPage(1); }} 
              className="h-10 rounded-full border px-4 text-xs font-bold focus:outline-none focus:ring-2" 
              style={{ borderColor: COLORS.border, color: COLORS.dark, background: '#ffffff' }}
            >
              <option value="">{t('كل درجات الخطورة', 'All Severities')}</option>
              <option value="info">{t('معلومات (Info)', 'Info')}</option>
              <option value="warning">{t('تنبيه (Warning)', 'Warning')}</option>
              <option value="error">{t('خطأ (Error)', 'Error')}</option>
              <option value="critical">{t('حرج (Critical)', 'Critical')}</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2">
              <Loader2 size={32} className="animate-spin" style={{ color: COLORS.dark }} />
              <p className="text-sm font-semibold" style={{ color: COLORS.lightMuted }}>{t('جاري تحميل سجلات التدقيق...', 'Loading logs...')}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <div className="rounded-full p-4" style={{ background: COLORS.bgLight }}>
                <FilterX size={32} style={{ color: COLORS.lightMuted }} />
              </div>
              <p className="text-sm font-bold" style={{ color: COLORS.dark }}>{t('لا توجد سجلات تدقيق', 'No logs found')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border" style={{ borderColor: COLORS.border }}>
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr style={{ background: COLORS.bgLight }}>
                    <th className={cn("py-3.5 px-4 text-xs font-bold uppercase tracking-wider", isRTL ? "text-right" : "text-left")} style={{ color: COLORS.muted }}>{t('الوقت والوقت الزمني', 'Time')}</th>
                    <th className={cn("py-3.5 px-4 text-xs font-bold uppercase tracking-wider", isRTL ? "text-right" : "text-left")} style={{ color: COLORS.muted }}>{t('نوع الإجراء', 'Action')}</th>
                    <th className={cn("py-3.5 px-4 text-xs font-bold uppercase tracking-wider hidden sm:table-cell", isRTL ? "text-right" : "text-left")} style={{ color: COLORS.muted }}>{t('المورد المستهدف', 'Resource')}</th>
                    <th className={cn("py-3.5 px-4 text-xs font-bold uppercase tracking-wider hidden md:table-cell", isRTL ? "text-right" : "text-left")} style={{ color: COLORS.muted }}>{t('تفاصيل الوصف', 'Description')}</th>
                    <th className={cn("py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-center", isRTL ? "text-right" : "text-left")} style={{ color: COLORS.muted }}>{t('الخطورة', 'Severity')}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="transition-colors hover:bg-[#f4f5f2]/50 border-b" style={{ borderColor: COLORS.border }}>
                      <td className="px-4 py-3 border-b text-xs font-bold" style={{ borderColor: COLORS.border, color: COLORS.lightMuted }}>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          {formatDate(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b text-sm font-bold" style={{ borderColor: COLORS.border, color: COLORS.dark }}>
                        {translateAuditAction(log.action)}
                      </td>
                      <td className="px-4 py-3 border-b text-sm hidden sm:table-cell" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
                        <span className="rounded-full px-2.5 py-1 text-xs font-bold bg-[#f0f1ee]" style={{ color: COLORS.dark }}>
                          {translateResource(log.resource)}
                        </span>
                      </td>
                      <td className="px-4 py-3 border-b text-sm hidden md:table-cell" style={{ borderColor: COLORS.border, color: COLORS.muted }}>
                        {translateAuditDescription(log.description, log.action)}
                      </td>
                      <td className="px-4 py-3 border-b" style={{ borderColor: COLORS.border }}>
                        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: severityMap[log.severity]?.bg || '#f0f1ee', color: severityMap[log.severity]?.color || '#5b5e5a' }}>
                          {t(severityMap[log.severity]?.ar || log.severity, severityMap[log.severity]?.en || log.severity)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-xs font-semibold" style={{ color: COLORS.lightMuted }}>
                {t(`عرض الصفحة ${page} من ${totalPages}`, `Showing page ${page} of ${totalPages}`)}
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1} 
                  className="rounded-full px-4 py-1.5 text-xs font-bold border transition-colors hover:bg-[#f0f1ee] disabled:opacity-30 cursor-pointer"
                  style={{ borderColor: COLORS.border, color: COLORS.dark, background: '#ffffff' }}
                >
                  {isRTL ? 'التالي' : 'Previous'}
                </button>
                
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = page;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = page - 2 + i;
                    
                    return (
                      <button 
                        key={pageNum} 
                        onClick={() => setPage(pageNum)} 
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all cursor-pointer", 
                          page === pageNum 
                            ? "shadow-sm scale-105" 
                            : "hover:bg-[#f0f1ee]"
                        )}
                        style={page === pageNum ? { background: COLORS.primary, color: COLORS.dark } : { color: COLORS.muted }}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages} 
                  className="rounded-full px-4 py-1.5 text-xs font-bold border transition-colors hover:bg-[#f0f1ee] disabled:opacity-30 cursor-pointer"
                  style={{ borderColor: COLORS.border, color: COLORS.dark, background: '#ffffff' }}
                >
                  {isRTL ? 'السابق' : 'Next'}
                </button>
              </div>
            </div>
          )}
        </ContentCard>
      </div>
    </PortalLayout>
  );
}
