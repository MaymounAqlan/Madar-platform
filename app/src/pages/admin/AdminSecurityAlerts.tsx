import { useLanguage } from '@/contexts/LanguageContext';
import { useSecurityAlerts, useSecurityStatus } from '@/hooks/useAdmin';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import StatusBadge from '@/components/StatusBadge';
import { Shield, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertTypeMap: Record<string, { ar: string; en: string }> = {
  repeated_failed_logins: { ar: 'محاولات دخول فاشلة متكررة', en: 'Repeated Failed Logins' },
  repeated_invalid_refresh_tokens: { ar: 'رموز تحديث غير صالحة', en: 'Invalid Refresh Tokens' },
  repeated_403_attempts: { ar: 'محاولات وصول ممنوعة', en: 'Forbidden Access Attempts' },
  privilege_escalation_attempt: { ar: 'محاولة تصعيد صلاحيات', en: 'Privilege Escalation Attempt' },
  suspicious_file_upload: { ar: 'رفع ملف مشبوه', en: 'Suspicious File Upload' },
  abnormal_api_failure_rate: { ar: 'معدل فشل API غير طبيعي', en: 'Abnormal API Failure Rate' },
};

export default function AdminSecurityAlerts() {
  const { t, isRTL } = useLanguage();
  const { data: alertsData, isLoading: alertsLoading } = useSecurityAlerts();
  const { data: statusData, isLoading: statusLoading } = useSecurityStatus();

  const alerts = alertsData?.alerts || [];

  return (
    <PortalLayout
      title={t('التنبيهات الأمنية', 'Security Alerts')}
      subtitle={t('مراقبة التهديدات والأنشطة المشبوهة', 'Monitor threats and suspicious activity')}
    >
      <div className={cn("space-y-6", isRTL ? "rtl" : "ltr")}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {statusLoading ? (
            <p className="col-span-full text-sm text-[#828782]">{t('جاري التحميل...', 'Loading...')}</p>
          ) : (
            [
              { label: 'محاولات فاشلة 24 ساعة', en: 'Failed Logins (24h)', value: statusData?.failedLogins24h ?? 0 },
              { label: 'الحسابات المعلقة', en: 'Locked Accounts', value: statusData?.lockedAccounts ?? 0 },
              { label: 'أحداث حرجة 24 ساعة', en: 'Critical Events (24h)', value: statusData?.criticalEvents24h ?? 0 },
              { label: 'مستوى التنبيه', en: 'Alert Level', value: statusData?.alertLevel || 'normal' },
            ].map((item) => (
              <div key={item.en} className="rounded-2xl border p-4 text-center" style={{ background: '#ffffff', borderColor: '#dfe1dd' }}>
                <p className="text-2xl font-black" style={{ color: '#0e0f0c' }}>{item.value}</p>
                <p className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t(item.label, item.en)}</p>
              </div>
            ))
          )}
        </div>

        <ContentCard title={t('التنبيهات النشطة', 'Active Alerts')} icon={<ShieldAlert size={20} style={{ color: '#5b5e5a' }} />}>
          {alertsLoading ? (
            <p className="py-8 text-center text-sm text-[#828782]">{t('جاري التحميل...', 'Loading...')}</p>
          ) : alerts.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#828782]">{t('لا توجد تنبيهات نشطة', 'No active alerts')}</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div key={alert.id} className="rounded-2xl border p-4" style={{ background: '#ffffff', borderColor: '#dfe1dd' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: alert.severity === 'critical' ? '#FEE2E2' : '#FEF3C7' }}>
                        <Shield size={18} style={{ color: alert.severity === 'critical' ? '#B91C1C' : '#B45309' }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: '#0e0f0c' }}>{t(alertTypeMap[alert.type]?.ar || alert.type, alertTypeMap[alert.type]?.en || alert.type)}</p>
                        <p className="text-xs" style={{ color: '#828782' }}>{alert.message}</p>
                      </div>
                    </div>
                    <StatusBadge label={t(alert.severity === 'critical' ? 'حرج' : 'تنبيه', alert.severity)} variant={alert.severity === 'critical' ? 'error' : 'warning'} />
                  </div>
                  {alert.count && <p className="mt-2 text-xs" style={{ color: '#5b5e5a' }}>{t('العدد', 'Count')}: {alert.count}</p>}
                  {alert.actorId && <p className="text-xs" style={{ color: '#5b5e5a' }}>{t('المستخدم', 'Actor')}: {alert.actorId}</p>}
                </div>
              ))}
            </div>
          )}
        </ContentCard>
      </div>
    </PortalLayout>
  );
}
