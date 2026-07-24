import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import MatchScoreRing from '@/components/MatchScoreRing';
import StatusBadge from '@/components/StatusBadge';
import { useStudentApplications } from '@/hooks/useStudent';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  FileText, LayoutGrid, List, Clock, CheckCircle2, Loader2, RotateCcw,
} from 'lucide-react';
import type { StudentApplicationItem } from '@/types/api.types';

type AppStatus = 'all' | 'submitted' | 'in-review' | 'interview' | 'accepted' | 'rejected';

const statusVariantMap: Record<string, 'submitted' | 'in-review' | 'interview' | 'accepted' | 'rejected'> = {
  submitted: 'submitted',
  'in-review': 'in-review',
  interview: 'interview',
  accepted: 'accepted',
  rejected: 'rejected',
};

const statusLabelMap: Record<string, { ar: string; en: string }> = {
  submitted: { ar: 'مُقدَّم', en: 'Submitted' },
  'in-review': { ar: 'قيد المراجعة', en: 'In Review' },
  interview: { ar: 'مقابلة', en: 'Interview' },
  accepted: { ar: 'مقبول', en: 'Accepted' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
};

const timelineStages = [
  { key: 'Submitted', ar: 'تم التقديم', en: 'Submitted' },
  { key: 'In Review', ar: 'قيد المراجعة', en: 'In Review' },
  { key: 'Interview', ar: 'المقابلة', en: 'Interview' },
  { key: 'Accepted', ar: 'القبول', en: 'Accepted' },
];

function LoadingSpinner() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#9fe870]" />
    </div>
  );
}

export default function StudentApplications() {
  const { t, isRTL } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<AppStatus>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const { data: appsData, isLoading, isError, refetch } = useStudentApplications({ limit: 50 });

  const applications = appsData?.items ?? [];

  const statusFilters = useMemo(() => [
    { key: 'all' as AppStatus, labelAr: 'الكل', labelEn: 'All', count: applications.length },
    { key: 'submitted' as AppStatus, labelAr: 'مُقدَّم', labelEn: 'Submitted', count: applications.filter((a: any) => a.status === 'submitted').length },
    { key: 'in-review' as AppStatus, labelAr: 'قيد المراجعة', labelEn: 'In Review', count: applications.filter((a: any) => a.status === 'in-review').length },
    { key: 'interview' as AppStatus, labelAr: 'مقابلة', labelEn: 'Interview', count: applications.filter((a: any) => a.status === 'interview').length },
    { key: 'accepted' as AppStatus, labelAr: 'مقبول', labelEn: 'Accepted', count: applications.filter((a: any) => a.status === 'accepted').length },
    { key: 'rejected' as AppStatus, labelAr: 'مرفوض', labelEn: 'Rejected', count: applications.filter((a: any) => a.status === 'rejected').length },
  ], [applications]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return applications;
    return applications.filter((a: any) => a.status === activeFilter);
  }, [activeFilter, applications]);

  if (isLoading) return <LoadingSpinner />;

  return (
    <PortalLayout title={t('طلباتي', 'Applications')}>
      <div className={cn('space-y-5', isRTL ? 'rtl' : 'ltr')}>

        {isError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-semibold text-red-700">{t('تعذر تحميل طلبات التوظيف', 'Unable to load applications')}</p>
            <button type="button" onClick={() => void refetch()} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[#0e0f0c]"><RotateCcw size={14} />{t('إعادة المحاولة', 'Retry')}</button>
          </div>
        )}

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all',
                  activeFilter === filter.key
                    ? 'bg-[#9fe870] text-[#0e0f0c] shadow-sm'
                    : 'bg-white border border-[#dfe1dd] text-[#5b5e5a] hover:bg-[#f0f1ee]'
                )}
              >
                {isRTL ? filter.labelAr : filter.labelEn}
                <span className={cn(
                  'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold',
                  activeFilter === filter.key ? 'bg-white text-[#0e0f0c]' : 'bg-[#f0f1ee] text-[#828782]'
                )}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center rounded-xl bg-[#f0f1ee] p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-lg p-1.5 transition-all',
                viewMode === 'list' ? 'bg-white shadow-sm text-[#0e0f0c]' : 'text-[#828782]'
              )}
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-lg p-1.5 transition-all',
                viewMode === 'grid' ? 'bg-white shadow-sm text-[#0e0f0c]' : 'text-[#828782]'
              )}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Applications */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            viewMode === 'grid' && 'grid grid-cols-1 gap-4 sm:grid-cols-2'
          )}
        >
          {!isError && filtered.map((app: StudentApplicationItem, index: number) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <ContentCard className={viewMode === 'list' ? 'p-5' : ''}>
                <div className={cn('flex gap-4', viewMode === 'list' && 'items-center')}>
                  {/* Match Score */}
                  <div className="flex-shrink-0">
                    <MatchScoreRing score={app.matchScore ?? 0} size={56} strokeWidth={3} />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Title & Status */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-[#0e0f0c] truncate">
                        {isRTL ? app.jobTitleAr || app.jobTitle : app.jobTitle}
                      </h4>
                      <StatusBadge
                        label={isRTL ? statusLabelMap[app.status]?.ar : statusLabelMap[app.status]?.en ?? app.status}
                        variant={statusVariantMap[app.status] ?? 'submitted'}
                      />
                    </div>
                    <p className="text-xs font-semibold text-[#5b5e5a]">
                      {app.companyName}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-[#828782]">
                      <Clock size={10} />
                      {t('تم التقديم في', 'Applied on')} {new Date(app.appliedDate || app.createdAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                    </div>

                    {/* Mini Timeline */}
                    <div className="mt-3 flex items-center gap-0">
                      {timelineStages.map((stage, idx) => {
                        const stageData = (app.timeline ?? []).find((item) => item.stage === stage.key);
                        const completed = stageData?.completed ?? false;
                        const isLast = idx === timelineStages.length - 1;
                        return (
                          <div key={stage.key} className="flex items-center">
                            <div className="flex flex-col items-center gap-1">
                              <div
                                className={cn(
                                  'flex h-5 w-5 items-center justify-center rounded-full border-2',
                                  completed
                                    ? 'border-[#1ba442] bg-[#E7FDD8]'
                                    : 'border-[#dfe1dd] bg-white'
                                )}
                              >
                                {completed && <CheckCircle2 size={10} style={{ color: '#1ba442' }} />}
                              </div>
                              <span className={cn(
                                'text-[9px] font-semibold',
                                completed ? 'text-[#1ba442]' : 'text-[#828782]'
                              )}>
                                {isRTL ? stage.ar : stage.en}
                              </span>
                            </div>
                            {!isLast && (
                              <div className={cn(
                                'mx-1 h-0.5 w-6 sm:w-10',
                                (app.timeline ?? []).find((item) => item.stage === timelineStages[idx + 1].key)?.completed
                                  ? 'bg-[#1ba442]'
                                  : 'bg-[#dfe1dd]'
                              )} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {app.rejectionReason && <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{t('سبب الرفض', 'Rejection reason')}: {app.rejectionReason}</p>}
                  </div>
                </div>
              </ContentCard>
            </motion.div>
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-[#dfe1dd] bg-white py-16">
            <FileText size={40} style={{ color: '#dfe1dd' }} />
            <p className="mt-3 text-sm font-semibold text-[#828782]">{t('لا توجد طلبات', 'No applications')}</p>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
