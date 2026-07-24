import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useBackups, useCreateBackup, useVerifyBackup, useRestoreBackup } from '@/hooks/useAdmin';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import StatusBadge from '@/components/StatusBadge';
import { DatabaseBackup, Plus, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function AdminBackup() {
  const { t, isRTL } = useLanguage();
  const { data, isLoading, refetch } = useBackups();
  const createBackup = useCreateBackup();
  const verifyBackup = useVerifyBackup();
  const restoreBackup = useRestoreBackup();
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ id: string; valid: boolean; status: string } | null>(null);

  const backups = data?.items ?? [];

  const handleCreate = async () => {
    await createBackup.mutateAsync();
    refetch();
  };

  const handleVerify = async (id: string) => {
    const result = await verifyBackup.mutateAsync(id);
    setVerifyResult(result);
  };

  const handleRestore = async (id: string) => {
    await restoreBackup.mutateAsync(id);
    setConfirmRestore(null);
    refetch();
  };

  return (
    <PortalLayout
      title={t('النسخ الاحتياطي والاستعادة', 'Backup & Restore')}
      subtitle={t('إدارة نسخ المنصة الاحتياطية والتحقق منها', 'Manage and verify platform backups')}
    >
      <div className={cn("space-y-6", isRTL ? "rtl" : "ltr")}>
        <ContentCard
          title={t('النسخ الاحتياطية', 'Backups')}
          icon={<DatabaseBackup size={20} style={{ color: '#5b5e5a' }} />}
          action={
            <div className="flex items-center gap-2">
              <button onClick={() => refetch()} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-[#f0f1ee]" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}>
                <RotateCcw size={12} /> {t('تحديث', 'Refresh')}
              </button>
              <button onClick={handleCreate} disabled={createBackup.isPending} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: '#1ba442', color: '#ffffff' }}>
                <Plus size={12} /> {t('نسخة جديدة', 'New Backup')}
              </button>
            </div>
          }
        >
          {isLoading ? (
            <p className="py-8 text-center text-sm text-[#828782]">{t('جاري التحميل...', 'Loading...')}</p>
          ) : backups.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#828782]">{t('لا توجد نسخ احتياطية', 'No backups found')}</p>
          ) : (
            <div className="space-y-3">
              {backups.map((backup: any) => (
                <div key={backup.id} className="rounded-2xl border p-4" style={{ background: '#ffffff', borderColor: '#dfe1dd' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold" style={{ color: '#0e0f0c' }}>{backup.id}</p>
                      <p className="text-xs" style={{ color: '#828782' }}>{new Date(backup.createdAt).toLocaleString()} · {formatBytes(backup.sizeBytes)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge label={backup.status || 'unknown'} variant={backup.status === 'completed' || backup.status === 'verified' ? 'success' : 'warning'} />
                      <button onClick={() => handleVerify(backup.id)} disabled={verifyBackup.isPending} className="rounded-full p-1.5 hover:bg-[#E7FDD8]" title={t('تحقق', 'Verify')}><CheckCircle size={16} style={{ color: '#1ba442' }} /></button>
                      <button onClick={() => setConfirmRestore(backup.id)} className="rounded-full p-1.5 hover:bg-[#FEE2E2]" title={t('استعادة', 'Restore')}><RotateCcw size={16} style={{ color: '#B91C1C' }} /></button>
                    </div>
                  </div>
                  {confirmRestore === backup.id && (
                    <div className="mt-3 rounded-xl border p-3" style={{ background: '#FEF3C7', borderColor: '#F59E0B' }}>
                      <p className="mb-2 text-xs font-semibold" style={{ color: '#B45309' }}>{t('تأكيد استعادة هذه النسخة؟', 'Confirm restore this backup?')}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleRestore(backup.id)} disabled={restoreBackup.isPending} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: '#B91C1C', color: '#ffffff' }}>{t('استعادة', 'Restore')}</button>
                        <button onClick={() => setConfirmRestore(null)} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ background: '#f0f1ee', color: '#5b5e5a' }}>{t('إلغاء', 'Cancel')}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {verifyResult && (
            <div className={cn("mt-4 rounded-xl p-3 text-sm", verifyResult.valid ? 'bg-[#E7FDD8] text-[#1ba442]' : 'bg-[#FEE2E2] text-[#B91C1C]')}>
              {t(`النسخة ${verifyResult.id}: ${verifyResult.status}`, `Backup ${verifyResult.id}: ${verifyResult.status}`)}
            </div>
          )}
        </ContentCard>
      </div>
    </PortalLayout>
  );
}
