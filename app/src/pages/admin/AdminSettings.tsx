import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePlatformSettings, useUpdatePlatformSettings } from '@/hooks/useAdmin';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { Settings, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AdminSettings() {
  const { t, isRTL } = useLanguage();
  const { data, isLoading } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();
  const [form, setForm] = useState<Record<string, any>>({});

  if (isLoading) {
    return (
      <PortalLayout title={t('إعدادات المنصة', 'Platform Settings')} subtitle={t('إعدادات النظام والتكوين', 'System configuration and settings')}>
        <p className="text-center text-sm text-[#828782]">{t('جاري التحميل...', 'Loading...')}</p>
      </PortalLayout>
    );
  }

  const settings = data || {};
  const sections = [
    { key: 'analysis', label: 'تحليل الذكاء الاصطناعي', en: 'AI Analysis' },
    { key: 'notifications', label: 'الإشعارات', en: 'Notifications' },
    { key: 'storage', label: 'التخزين', en: 'Storage' },
    { key: 'matching', label: 'المطابقة', en: 'Matching' },
    { key: 'platform', label: 'المنصة', en: 'Platform' },
  ];

  const handleSave = async () => {
    await updateSettings.mutateAsync(form);
    setForm({});
  };

  return (
    <PortalLayout
      title={t('إعدادات المنصة', 'Platform Settings')}
      subtitle={t('إعدادات النظام والتكوين', 'System configuration and settings')}
    >
      <div className={cn("space-y-6", isRTL ? "rtl" : "ltr")}>
        <ContentCard
          title={t('إعدادات المنصة', 'Platform Settings')}
          icon={<Settings size={20} style={{ color: '#5b5e5a' }} />}
          action={
            <button onClick={handleSave} disabled={updateSettings.isPending} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: '#1ba442', color: '#ffffff' }}>
              <Save size={16} /> {t('حفظ', 'Save')}
            </button>
          }
        >
          {sections.map((section) => (
            <div key={section.key} className="mb-6">
              <h3 className="mb-3 text-sm font-bold" style={{ color: '#0e0f0c' }}>{t(section.label, section.en)}</h3>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {Object.entries(settings[section.key] || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="rounded-xl border p-3" style={{ background: '#f0f1ee', borderColor: '#dfe1dd' }}>
                    <label className="block text-xs font-semibold" style={{ color: '#5b5e5a' }}>{key}</label>
                    <input
                      type="text"
                      value={form[`${section.key}.${key}`] ?? value ?? ''}
                      onChange={e => setForm({ ...form, [`${section.key}.${key}`]: e.target.value })}
                      className="mt-1 w-full rounded-lg border px-2 py-1 text-sm"
                      style={{ borderColor: '#dfe1dd', background: '#ffffff' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {settings.stats && (
            <div className="rounded-2xl border p-4" style={{ background: '#f0f1ee', borderColor: '#dfe1dd' }}>
              <h3 className="mb-2 text-sm font-bold" style={{ color: '#0e0f0c' }}>{t('الإحصائيات', 'Statistics')}</h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Object.entries(settings.stats).map(([key, value]: [string, any]) => (
                  <div key={key} className="text-center">
                    <p className="text-xl font-black" style={{ color: '#0e0f0c' }}>{value}</p>
                    <p className="text-xs" style={{ color: '#5b5e5a' }}>{key}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ContentCard>
      </div>
    </PortalLayout>
  );
}
