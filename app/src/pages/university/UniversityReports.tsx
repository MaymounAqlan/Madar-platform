import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInstitutionalAccess } from '@/hooks/useUniversity';
import { universityApi } from '@/services/universityApi';

const reportTypes = [
  ['summary', 'ملخص النطاق', 'Scope Summary'], ['academic', 'الطلاب', 'Students'], ['readiness', 'الجاهزية', 'Readiness'],
  ['employment', 'التوظيف', 'Employment'], ['skills', 'فجوات المهارات', 'Skill Gaps'], ['college', 'مقارنة الكليات', 'College Comparison'],
  ['department', 'مقارنة الأقسام', 'Department Comparison'], ['curriculum', 'مواءمة المناهج', 'Curriculum Alignment'],
  ['recommendations', 'توصيات المناهج', 'Curriculum Recommendations'], ['audit', 'سجل التدقيق', 'Audit Report'],
] as const;

export default function UniversityReports() {
  const { t } = useLanguage();
  const access = useInstitutionalAccess();
  const [busy, setBusy] = useState('');
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);
  const allowed = reportTypes.filter(([type]) => type !== 'college' || access.data?.role === 'university').filter(([type]) => type !== 'audit' || access.data?.role === 'university' || access.data?.permissions.includes('audit:read'));
  const loadPreview = async (type: string) => { setBusy(`${type}-json`); setPreview(null); try { setPreview(await universityApi.getReport(type, 'json')); } catch (error: any) { toast.error(error?.response?.data?.message || t('تعذر إنشاء معاينة التقرير', 'Unable to generate report preview')); } finally { setBusy(''); } };
  const download = async (type: string, format: 'csv' | 'xlsx' | 'pdf') => { setBusy(`${type}-${format}`); try { const blob = await universityApi.getReport(type, format) as Blob; const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${type}-report-${new Date().toISOString().slice(0, 10)}.${format}`; anchor.click(); URL.revokeObjectURL(url); toast.success(t('تم إنشاء التقرير', 'Report generated')); } catch (error: any) { toast.error(error?.response?.data?.message || t('تعذر تصدير التقرير', 'Unable to export report')); } finally { setBusy(''); } };
  return <PortalLayout title={t('تقارير النطاق الأكاديمي', 'Academic Scope Reports')} subtitle={access.data?.role === 'coordinator' ? t('تقتصر التقارير تلقائيًا على الكلية المرتبطة بحسابك', 'Reports are automatically limited to your assigned college') : t('تقارير فعلية مستخرجة من بيانات الجامعة', 'Reports generated from university data')}>
    <ContentCard title={t('أنواع التقارير', 'Report Types')} icon={<FileSpreadsheet size={18} />}><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{allowed.map(([type, ar, en]) => <div key={type} className="rounded-xl border border-[#dfe1dd] bg-white p-4"><div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-[#E7FDD8] p-2 text-[#1ba442]"><FileText size={18} /></div><b>{t(ar, en)}</b></div><div className="flex flex-wrap gap-2"><button disabled={Boolean(busy)} onClick={() => loadPreview(type)} className="rounded-full border border-[#dfe1dd] px-3 py-1.5 text-xs font-bold disabled:opacity-50">{busy === `${type}-json` ? <RefreshCw size={13} className="animate-spin" /> : t('معاينة', 'Preview')}</button>{(['csv', 'xlsx', 'pdf'] as const).map((format) => <button key={format} disabled={Boolean(busy)} onClick={() => download(type, format)} className="inline-flex items-center gap-1 rounded-full bg-[#9fe870] px-3 py-1.5 text-xs font-bold disabled:opacity-50"><Download size={12} />{format.toUpperCase()}</button>)}</div></div>)}</div></ContentCard>
    {preview && <ContentCard className="mt-5" title={t('معاينة التقرير', 'Report Preview')} icon={<FileText size={18} />}><pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl bg-[#f7f8f5] p-4 text-xs" dir="ltr">{JSON.stringify(preview, null, 2)}</pre></ContentCard>}
  </PortalLayout>;
}
