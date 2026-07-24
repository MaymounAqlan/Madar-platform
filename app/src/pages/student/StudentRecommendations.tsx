import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Compass,
  Banknote,
  ExternalLink,
  Filter,
  GraduationCap,
  Lightbulb,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  Send,
  Target,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import PortalLayout from '@/components/PortalLayout';
import MatchScoreRing from '@/components/MatchScoreRing';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  useApplyToJob,
  useRecommendedJobs,
  useRefreshRecommendations,
  useStudentInsights,
} from '@/hooks/useStudent';
import type { JobRecommendation, StudentCareerPath, StudentLearningResource } from '@/types/api.types';

type RecommendationTab = 'jobs' | 'careers' | 'learning';

const JOB_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  full_time: { ar: 'دوام كامل', en: 'Full-time' },
  part_time: { ar: 'دوام جزئي', en: 'Part-time' },
  contract: { ar: 'عقد', en: 'Contract' },
  internship: { ar: 'تدريب', en: 'Internship' },
  temporary: { ar: 'مؤقت', en: 'Temporary' },
  remote: { ar: 'عن بعد', en: 'Remote' },
};

const RESOURCE_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  official_documentation: { ar: 'توثيق رسمي', en: 'Official documentation' },
  online_course: { ar: 'دورة إلكترونية', en: 'Online course' },
  professional_certificate: { ar: 'شهادة مهنية', en: 'Professional certificate' },
  learning_path: { ar: 'مسار تعلم', en: 'Learning path' },
  book: { ar: 'كتاب', en: 'Book' },
  certification_resource: { ar: 'مصدر شهادة', en: 'Certification resource' },
  official_resource: { ar: 'مصدر رسمي', en: 'Official resource' },
  learning_platform: { ar: 'منصة تعليمية', en: 'Learning platform' },
  learning_resource: { ar: 'مصدر تعلم', en: 'Learning resource' },
};

const LEVEL_LABELS: Record<string, { ar: string; en: string }> = {
  beginner: { ar: 'مبتدئ', en: 'Beginner' },
  intermediate: { ar: 'متوسط', en: 'Intermediate' },
  advanced: { ar: 'متقدم', en: 'Advanced' },
  mixed: { ar: 'جميع المستويات', en: 'All levels' },
};

function displayText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim();
    return text === '[object Object]' ? '' : text;
  }
  if (Array.isArray(value)) return displayList(value).join(', ');
  if (typeof value === 'object') {
    const item = value as Record<string, unknown>;
    return displayText(item.name ?? item.skillName ?? item.title ?? item.label ?? item.value ?? item.reason ?? item.description);
  }
  return '';
}

function displayList(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  const seen = new Set<string>();
  return values.map(displayText).filter(Boolean).filter((item) => {
    const key = item.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function safeExternalUrl(value?: string): string | null {
  try {
    const url = new URL(value || '');
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function CompanyLogo({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-2xl border border-[#dfe1dd] bg-[#f0f1ee]">
      {src && !failed
        ? <img src={src} alt={name} className="h-full w-full object-contain p-1" onError={() => setFailed(true)} />
        : <Building2 size={20} className="text-[#5b5e5a]" aria-hidden="true" />}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-[#dfe1dd] bg-white px-5 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f1ee] text-[#5b5e5a]">{icon}</div>
      <p className="mt-4 text-sm font-bold text-[#0e0f0c]">{title}</p>
      <p className="mt-1 max-w-md text-xs leading-6 text-[#828782]">{description}</p>
    </div>
  );
}

export default function StudentRecommendations() {
  const { t, isRTL } = useLanguage();
  const [urlSearchParams] = useSearchParams();
  const notificationJobId = urlSearchParams.get('jobId') || '';
  const openedNotificationJobId = useRef('');
  const [activeTab, setActiveTab] = useState<RecommendationTab>('jobs');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('match');
  const [selectedJob, setSelectedJob] = useState<JobRecommendation | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  const params = useMemo(() => ({
    jobId: notificationJobId || undefined,
    page,
    limit: 6,
    search: search.trim() || undefined,
    location: location || undefined,
    type: type || undefined,
    minScore: minScore || undefined,
    sortBy,
  }), [notificationJobId, page, search, location, type, minScore, sortBy]);

  const jobsQuery = useRecommendedJobs(params);
  const insightsQuery = useStudentInsights();
  const refreshMutation = useRefreshRecommendations();
  const applyMutation = useApplyToJob();

  const items = useMemo(
    () => jobsQuery.data?.items ?? jobsQuery.data?.data ?? [],
    [jobsQuery.data?.data, jobsQuery.data?.items],
  );
  const pagination = jobsQuery.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;
  const insights = insightsQuery.data;
  const careerPaths = useMemo(() => insights?.careerPaths ?? [], [insights?.careerPaths]);
  const learningResources = useMemo(
    () => insights?.learningResources ?? [],
    [insights?.learningResources],
  );

  useEffect(() => {
    if (!notificationJobId || openedNotificationJobId.current === notificationJobId) return;
    const target = items.find((item) => item.id === notificationJobId);
    if (!target) return;
    openedNotificationJobId.current = notificationJobId;
    const timer = window.setTimeout(() => {
      setActiveTab('jobs');
      setSelectedJob(target);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [items, notificationJobId]);

  const providers = useMemo(
    () => Array.from(new Set(learningResources.map((resource) => resource.provider).filter(Boolean))).sort(),
    [learningResources],
  );
  const visibleResources = useMemo(
    () => selectedProvider ? learningResources.filter((resource) => resource.provider === selectedProvider) : learningResources,
    [learningResources, selectedProvider],
  );

  const localizedValue = (value: string | undefined, labels: Record<string, { ar: string; en: string }>) => {
    const item = labels[String(value || '').toLocaleLowerCase()];
    return item ? (isRTL ? item.ar : item.en) : displayText(value) || t('غير محدد', 'Not specified');
  };

  const localizedJobTitle = (job: JobRecommendation) => {
    if (isRTL && job.titleAr && /[\u0600-\u06ff]/.test(job.titleAr)) return job.titleAr;
    return job.title;
  };

  const localizedCompany = (job: JobRecommendation) => {
    if (isRTL && job.companyNameAr && /[\u0600-\u06ff]/.test(job.companyNameAr)) return job.companyNameAr;
    return job.companyName || job.company || t('شركة غير محددة', 'Company not specified');
  };

  const localizedRecommendation = (job: JobRecommendation) => {
    if (!isRTL) return displayText(job.recommendationExplanation) || displayText(job.recommendation) || 'Recommendation is based on your profile and the published job requirements.';
    const matched = displayList(job.matchingSkills ?? job.matchedSkills);
    const missing = displayList(job.missingSkills);
    const parts = [`بلغت نسبة توافق ملفك مع هذه الفرصة ${Math.round(job.matchScore || 0)}% بناءً على المهارات والخبرة والمشاريع.`];
    if (matched.length) parts.push(`تتوافق لديك مهارات مثل ${matched.slice(0, 3).join('، ')}.`);
    if (missing.length) parts.push(`يمكن رفع فرص القبول بتطوير ${missing.slice(0, 3).join('، ')}.`);
    return parts.join(' ');
  };

  const localizedFactor = (value: string, kind: 'strength' | 'weakness') => {
    if (!isRTL || /[\u0600-\u06ff]/.test(value)) return value;
    let match = value.match(/^Matched (.+) at ([\d.]+)%$/i);
    if (match) return `تطابق مهارة ${match[1]} بنسبة ${match[2]}%`;
    match = value.match(/^Missing required skill:\s*(.+)$/i);
    if (match) return `المهارة المطلوبة غير المتوفرة: ${match[1]}`;
    if (/experience meets/i.test(value)) return 'الخبرة المسجلة تحقق متطلب الوظيفة.';
    if (/experience is below/i.test(value)) return 'الخبرة المسجلة أقل من المستوى المطلوب.';
    if (/Projects contain/i.test(value)) return 'تتضمن مشاريعك تقنيات مرتبطة بالوظيفة.';
    if (/Semantic evidence is unavailable/i.test(value)) return 'لا تتوفر أدلة دلالية كافية بسبب نقص بيانات الملف أو الإعلان.';
    return kind === 'strength' ? 'عامل إيجابي مستخرج من توافق ملفك مع متطلبات الوظيفة.' : 'عامل يحتاج إلى تحسين وفق متطلبات الوظيفة.';
  };

  const localizedPathDescription = (path: StudentCareerPath) => {
    if (isRTL) return path.descriptionAr || `اقتُرح هذا المسار لأن جاهزية ملفك له تبلغ ${Math.round(path.readiness || 0)}% وفق الوظائف المنشورة ومهاراتك الحالية.`;
    return path.description || `This path was suggested because your current readiness is ${Math.round(path.readiness || 0)}% based on published jobs and your profile.`;
  };

  const localizedResourceReason = (resource: StudentLearningResource) => {
    if (!isRTL) return resource.reason || `Recommended to improve ${resource.skills.join(', ')} and strengthen your job readiness.`;
    const skill = resource.skills.join('، ') || t('المهارة المستهدفة', 'target skill');
    if (resource.currentLevel !== undefined && resource.requiredLevel !== undefined) {
      return `اقتُرح هذا المصدر لتطوير ${skill} من المستوى الحالي ${resource.currentLevel}% نحو المستوى المطلوب ${resource.requiredLevel}% في الوظائف المرتبطة.`;
    }
    return `اقتُرح هذا المصدر لمعالجة فجوة ${skill} وتحسين جاهزيتك للوظائف المرتبطة.`;
  };

  const handleRefresh = async () => {
    try {
      await refreshMutation.mutateAsync();
      toast.success(t('تم تحديث الوظائف والمسارات ومصادر التعلم', 'Jobs, career paths, and learning resources were refreshed'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      toast.error(message || t('تعذر تحديث التوصيات', 'Failed to refresh recommendations'));
    }
  };

  const handleApply = async (job: JobRecommendation) => {
    try {
      await applyMutation.mutateAsync({ jobId: job.id, data: {} });
      setAppliedJobIds((current) => new Set(current).add(job.id));
      toast.success(t('تم إرسال الطلب ويمكنك متابعة حالته من صفحة الطلبات', 'Application submitted. Track it from Applications.'));
    } catch (error: unknown) {
      const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(isRTL ? 'تعذر التقديم. ربما سبق التقديم أو لم تعد الوظيفة متاحة.' : responseMessage || 'Unable to apply for this job.');
    }
  };

  const showJobsForPath = (path: StudentCareerPath) => {
    setActiveTab('jobs');
    setSearch(path.title);
    setPage(1);
  };

  const tabs: Array<{ key: RecommendationTab; label: string; icon: React.ReactNode; count: number }> = [
    { key: 'jobs', label: t('فرص موصى بها', 'Recommended jobs'), icon: <BriefcaseBusiness size={17} />, count: pagination?.total ?? 0 },
    { key: 'careers', label: t('مسارات مهنية', 'Career paths'), icon: <Compass size={17} />, count: careerPaths.length },
    { key: 'learning', label: t('التعلم والتطوير', 'Learning resources'), icon: <GraduationCap size={17} />, count: learningResources.length },
  ];

  return (
    <PortalLayout title={t('التوصيات', 'Recommendations')}>
      <div className={cn('min-w-0 space-y-5', isRTL ? 'rtl' : 'ltr')}>
        <section className="rounded-3xl border border-[#dfe1dd] bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-base font-bold text-[#0e0f0c]">{t('خطة مهنية مبنية على بيانات ملفك', 'A career plan based on your profile')}</p>
              <p className="mt-1 max-w-3xl text-xs leading-6 text-[#5b5e5a]">
                {isRTL ? insights?.summaryDescriptionAr || 'تُرتب الفرص والمسارات ومصادر التعلم وفق سيرتك ومهاراتك ومتطلبات الوظائف المنشورة.' : insights?.summaryDescription || 'Jobs, paths, and resources are ranked using your CV, skills, and published job requirements.'}
              </p>
            </div>
            <div className="grid w-full grid-cols-1 gap-2 min-[390px]:grid-cols-2 lg:w-auto">
              <Link to="/student/applications" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#dfe1dd] px-4 text-xs font-semibold text-[#5b5e5a] transition-colors hover:bg-[#f0f1ee]">
                <BriefcaseBusiness size={15} />{t('متابعة طلباتي', 'My applications')}
              </Link>
              <button type="button" onClick={handleRefresh} disabled={refreshMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#9fe870] px-4 text-xs font-bold text-[#0e0f0c] disabled:opacity-50">
                {refreshMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                {t('تحديث التحليل', 'Refresh analysis')}
              </button>
            </div>
          </div>
        </section>

        <div className="overflow-x-auto pb-1">
          <div className="inline-flex min-w-full gap-1 rounded-2xl border border-[#dfe1dd] bg-white p-1 sm:min-w-0" role="tablist" aria-label={t('أقسام التوصيات', 'Recommendation sections')}>
            {tabs.map((tab) => (
              <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key} onClick={() => setActiveTab(tab.key)} className={cn('inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-xs font-semibold transition-colors', activeTab === tab.key ? 'bg-[#E7FDD8] text-[#0e0f0c]' : 'text-[#5b5e5a] hover:bg-[#f0f1ee]')}>
                {tab.icon}<span>{tab.label}</span><span className="text-[10px] text-[#828782]">({tab.count})</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'jobs' && (
          <>
            <section className="grid grid-cols-1 gap-3 rounded-3xl border border-[#dfe1dd] bg-white p-4 lg:grid-cols-12">
              <div className="relative lg:col-span-5">
                <Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#828782]" />
                <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('ابحث بالمسمى أو الشركة أو الموقع', 'Search by title, company, or location')} className="min-h-11 w-full rounded-xl border border-[#dfe1dd] bg-white py-2 ps-11 pe-4 text-sm text-[#0e0f0c] outline-none focus:ring-2 focus:ring-[#9fe870]" />
              </div>
              <div className="relative lg:col-span-3">
                <MapPin size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#828782]" />
                <input value={location} onChange={(event) => { setLocation(event.target.value); setPage(1); }} placeholder={t('الموقع', 'Location')} className="min-h-11 w-full rounded-xl border border-[#dfe1dd] bg-white py-2 ps-10 pe-4 text-sm text-[#0e0f0c] outline-none focus:ring-2 focus:ring-[#9fe870]" />
              </div>
              <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }} className="min-h-11 rounded-xl border border-[#dfe1dd] bg-white px-3 text-sm text-[#0e0f0c] outline-none focus:ring-2 focus:ring-[#9fe870] lg:col-span-2">
                <option value="">{t('كل الأنواع', 'All types')}</option>
                {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{isRTL ? label.ar : label.en}</option>)}
              </select>
              <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }} className="min-h-11 rounded-xl border border-[#dfe1dd] bg-white px-3 text-sm text-[#0e0f0c] outline-none focus:ring-2 focus:ring-[#9fe870] lg:col-span-2">
                <option value="match">{t('الأعلى تطابقًا', 'Best match')}</option>
                <option value="recent">{t('الأحدث', 'Newest')}</option>
                <option value="salary">{t('الأعلى راتبًا', 'Highest salary')}</option>
              </select>
              <div className="flex flex-wrap items-center gap-2 lg:col-span-12">
                <Filter size={14} className="text-[#828782]" />
                <span className="text-xs text-[#828782]">{t('الحد الأدنى للتطابق', 'Minimum match')}</span>
                {[0, 50, 60, 70, 80].map((value) => <button key={value} type="button" onClick={() => { setMinScore(value); setPage(1); }} className={cn('min-h-9 rounded-full border px-3 text-xs font-semibold', minScore === value ? 'border-[#9fe870] bg-[#E7FDD8] text-[#0e0f0c]' : 'border-[#dfe1dd] text-[#5b5e5a]')}>{value}%</button>)}
              </div>
            </section>

            {jobsQuery.isLoading ? (
              <div className="flex min-h-64 items-center justify-center"><Loader2 size={30} className="animate-spin text-[#1ba442]" /></div>
            ) : jobsQuery.isError ? (
              <EmptyState icon={<CircleAlert size={22} />} title={t('تعذر تحميل توصيات الوظائف', 'Unable to load job recommendations')} description={t('تحقق من الاتصال ثم أعد المحاولة.', 'Check your connection and try again.')} />
            ) : items.length === 0 ? (
              <EmptyState icon={<Search size={22} />} title={t('لا توجد فرص مطابقة للفلاتر الحالية', 'No jobs match the current filters')} description={t('غيّر البحث أو الفلاتر، أو حدّث التحليل بعد استكمال ملفك.', 'Change the filters or refresh the analysis after completing your profile.')} />
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {items.map((job, index) => {
                  const matchedSkills = displayList(job.matchingSkills ?? job.matchedSkills);
                  const missingSkills = displayList(job.missingSkills);
                  const isApplied = appliedJobIds.has(job.id);
                  const isApplying = applyMutation.isPending && applyMutation.variables?.jobId === job.id;
                  return (
                    <motion.article key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="flex min-w-0 flex-col rounded-3xl border border-[#dfe1dd] bg-white p-4 shadow-sm sm:p-5">
                      <div className="flex min-w-0 items-start gap-3">
                        <CompanyLogo src={job.companyLogo} name={localizedCompany(job)} />
                        <div className="min-w-0 flex-1 text-start">
                          <h2 className="break-words text-base font-bold leading-6 text-[#0e0f0c]">{localizedJobTitle(job)}</h2>
                          <p className="mt-0.5 break-words text-xs font-semibold text-[#5b5e5a]">{localizedCompany(job)}</p>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#828782]">
                            {job.location && <span className="inline-flex items-center gap-1"><MapPin size={12} />{job.location}</span>}
                            <span className="inline-flex items-center gap-1"><BriefcaseBusiness size={12} />{localizedValue(job.type, JOB_TYPE_LABELS)}</span>
                            {(job.salaryMin || job.salaryMax) && <span className="inline-flex items-center gap-1"><Banknote size={12} />{job.salaryCurrency || 'SAR'} {Number(job.salaryMin || 0).toLocaleString(isRTL ? 'ar-SA' : 'en-US')} - {Number(job.salaryMax || 0).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}</span>}
                          </div>
                        </div>
                        <div className="flex flex-none flex-col items-center gap-1">
                          <MatchScoreRing score={Math.round(job.matchScore || 0)} size={62} strokeWidth={4} />
                          <span className="text-[10px] font-semibold text-[#828782]">{t('التطابق', 'Match')}</span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-[#e7e9e5] bg-[#f8f9f7] p-3 text-start">
                        <p className="flex items-center gap-2 text-xs font-bold text-[#0e0f0c]"><Target size={15} className="text-[#1ba442]" />{t('لماذا هذه الفرصة؟', 'Why this job?')}</p>
                        <p className="mt-2 text-xs leading-6 text-[#5b5e5a]">{localizedRecommendation(job)}</p>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[#dfe1dd] p-3">
                          <p className="text-xs font-bold text-[#0e0f0c]">{t('نقاط التوافق', 'Matching strengths')}</p>
                          <p className="mt-2 break-words text-xs leading-6 text-[#5b5e5a]">{matchedSkills.length ? matchedSkills.slice(0, 4).join(isRTL ? '، ' : ', ') : t('لا توجد بيانات كافية', 'Insufficient data')}</p>
                        </div>
                        <div className="rounded-2xl border border-[#dfe1dd] p-3">
                          <p className="text-xs font-bold text-[#0e0f0c]">{t('ما يحتاج إلى تطوير', 'Areas to improve')}</p>
                          <p className="mt-2 break-words text-xs leading-6 text-[#5b5e5a]">{missingSkills.length ? missingSkills.slice(0, 4).join(isRTL ? '، ' : ', ') : t('لا توجد فجوات أساسية مسجلة', 'No key gaps recorded')}</p>
                        </div>
                      </div>

                      <div className="mt-auto grid grid-cols-1 gap-2 pt-4 min-[390px]:grid-cols-2">
                        <button type="button" onClick={() => setSelectedJob(job)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#dfe1dd] px-4 text-xs font-semibold text-[#5b5e5a] hover:bg-[#f0f1ee]">
                          <Lightbulb size={15} />{t('عرض التفسير', 'View explanation')}
                        </button>
                        <button type="button" onClick={() => void handleApply(job)} disabled={isApplying || isApplied} className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-bold disabled:cursor-not-allowed', isApplied ? 'bg-[#E7FDD8] text-[#1ba442]' : 'bg-[#9fe870] text-[#0e0f0c] disabled:opacity-60')}>
                          {isApplying ? <Loader2 size={15} className="animate-spin" /> : isApplied ? <CheckCircle2 size={15} /> : <Send size={15} />}
                          {isApplied ? t('تم التقديم', 'Applied') : t('التقديم الآن', 'Apply now')}
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            )}

            {!jobsQuery.isLoading && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button type="button" aria-label={t('الصفحة السابقة', 'Previous page')} onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfe1dd] bg-white text-[#5b5e5a] disabled:opacity-40">{isRTL ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
                <span className="min-w-20 text-center text-xs font-semibold text-[#5b5e5a]">{page} / {totalPages}</span>
                <button type="button" aria-label={t('الصفحة التالية', 'Next page')} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfe1dd] bg-white text-[#5b5e5a] disabled:opacity-40">{isRTL ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}</button>
              </div>
            )}
          </>
        )}

        {activeTab === 'careers' && (
          insightsQuery.isLoading ? <div className="flex min-h-64 items-center justify-center"><Loader2 size={30} className="animate-spin text-[#1ba442]" /></div>
            : insightsQuery.isError ? <EmptyState icon={<CircleAlert size={22} />} title={t('تعذر تحميل المسارات المهنية', 'Unable to load career paths')} description={t('أعد تحديث الصفحة بعد التحقق من الاتصال.', 'Try again after checking your connection.')} />
              : careerPaths.length === 0 ? <EmptyState icon={<Compass size={22} />} title={t('لا توجد مسارات مقترحة بعد', 'No career paths yet')} description={t('أكمل السيرة والمهارات ثم حدّث التحليل لإنشاء مسارات مرتبطة بفرص حقيقية.', 'Complete your CV and skills, then refresh the analysis.')} />
                : <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {careerPaths.map((path) => (
                    <article key={path.id} className="rounded-3xl border border-[#dfe1dd] bg-white p-4 sm:p-5">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-[#E7FDD8] text-[#1ba442]"><Compass size={19} /></div>
                        <div className="min-w-0 flex-1 text-start">
                          <p className="text-[11px] font-semibold text-[#828782]">{t('المسار', 'Path')} {path.rank}</p>
                          <h2 className="mt-0.5 break-words text-base font-bold text-[#0e0f0c]">{isRTL && path.titleAr ? path.titleAr : path.title}</h2>
                          {(path.professionalDomain || path.academicDomain) && <p className="mt-1 break-words text-xs text-[#828782]">{[path.professionalDomain, path.academicDomain].filter(Boolean).join(isRTL ? '، ' : ', ')}</p>}
                        </div>
                        <MatchScoreRing score={Math.round(path.readiness || 0)} size={58} strokeWidth={4} />
                      </div>
                      <div className="mt-4 border-t border-[#f0f1ee] pt-4 text-start">
                        <p className="text-xs font-bold text-[#0e0f0c]">{t('سبب الاقتراح', 'Why it was suggested')}</p>
                        <p className="mt-2 text-xs leading-6 text-[#5b5e5a]">{localizedPathDescription(path)}</p>
                      </div>
                      <div className="mt-4 text-start">
                        <p className="text-xs font-bold text-[#0e0f0c]">{t('مهارات ترفع الجاهزية لهذا المسار', 'Skills that improve readiness')}</p>
                        <p className="mt-2 break-words text-xs leading-6 text-[#5b5e5a]">{path.skillsNeeded.length ? path.skillsNeeded.join(isRTL ? '، ' : ', ') : t('لا توجد فجوات أساسية مسجلة', 'No key gaps recorded')}</p>
                      </div>
                      <button type="button" onClick={() => showJobsForPath(path)} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#dfe1dd] text-xs font-semibold text-[#0e0f0c] hover:bg-[#f0f1ee]">
                        <BriefcaseBusiness size={15} />{t('عرض الوظائف المرتبطة', 'View related jobs')}
                      </button>
                    </article>
                  ))}
                </div>
        )}

        {activeTab === 'learning' && (
          <>
            {providers.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-[#dfe1dd] bg-white p-4">
                <BookOpen size={15} className="text-[#828782]" />
                <button type="button" onClick={() => setSelectedProvider('')} className={cn('min-h-9 rounded-full border px-3 text-xs font-semibold', !selectedProvider ? 'border-[#9fe870] bg-[#E7FDD8]' : 'border-[#dfe1dd] text-[#5b5e5a]')}>{t('كل المنصات', 'All platforms')}</button>
                {providers.map((provider) => <button key={provider} type="button" onClick={() => setSelectedProvider(provider)} className={cn('min-h-9 rounded-full border px-3 text-xs font-semibold', selectedProvider === provider ? 'border-[#9fe870] bg-[#E7FDD8]' : 'border-[#dfe1dd] text-[#5b5e5a]')}>{provider}</button>)}
              </div>
            )}
            {insightsQuery.isLoading ? <div className="flex min-h-64 items-center justify-center"><Loader2 size={30} className="animate-spin text-[#1ba442]" /></div>
              : insightsQuery.isError ? <EmptyState icon={<CircleAlert size={22} />} title={t('تعذر تحميل مصادر التعلم', 'Unable to load learning resources')} description={t('أعد المحاولة بعد التحقق من الاتصال.', 'Try again after checking your connection.')} />
                : visibleResources.length === 0 ? <EmptyState icon={<BookOpen size={22} />} title={t('لا توجد دورات مرتبطة بفجواتك الحالية', 'No resources match your current gaps')} description={t('حدّث التحليل بعد إضافة مهاراتك وسيرتك للحصول على مصادر من منصات موثوقة.', 'Refresh after adding your CV and skills to get resources from trusted platforms.')} />
                  : <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {visibleResources.map((resource) => {
                      const url = safeExternalUrl(resource.url);
                      return (
                        <article key={resource.id} className="flex min-w-0 flex-col rounded-3xl border border-[#dfe1dd] bg-white p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-[#f0f1ee] text-[#5b5e5a]"><BookOpen size={19} /></div>
                            <div className="min-w-0 flex-1 text-start">
                              <h2 className="break-words text-sm font-bold leading-6 text-[#0e0f0c]">{isRTL && resource.nameAr ? resource.nameAr : resource.name}</h2>
                              <p className="mt-0.5 break-words text-xs font-semibold text-[#5b5e5a]">{resource.provider}</p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 border-y border-[#f0f1ee] py-3 text-[11px] text-[#828782]">
                            <span>{localizedValue(resource.type, RESOURCE_TYPE_LABELS)}</span>
                            <span>{localizedValue(resource.level, LEVEL_LABELS)}</span>
                            {resource.language && <span>{t('اللغة', 'Language')}: {resource.language.toLocaleUpperCase()}</span>}
                            {resource.isFree !== null && resource.isFree !== undefined && <span>{resource.isFree ? t('مجاني', 'Free') : t('قد يتطلب اشتراكًا', 'May require subscription')}</span>}
                          </div>
                          <div className="mt-4 text-start">
                            <p className="text-xs font-bold text-[#0e0f0c]">{t('سبب الاقتراح', 'Why it was suggested')}</p>
                            <p className="mt-2 text-xs leading-6 text-[#5b5e5a]">{localizedResourceReason(resource)}</p>
                          </div>
                          {resource.skills.length > 0 && <p className="mt-3 break-words text-xs text-[#5b5e5a]"><span className="font-bold text-[#0e0f0c]">{t('يطور', 'Develops')}:</span> {resource.skills.join(isRTL ? '، ' : ', ')}</p>}
                          {resource.gap !== undefined && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-[11px] text-[#828782]"><span>{t('حجم الفجوة', 'Skill gap')}</span><span className="font-bold text-[#0e0f0c]">{Math.round(resource.gap)}%</span></div>
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7e9e5]"><div className="h-full rounded-full bg-[#9fe870]" style={{ width: `${Math.max(0, Math.min(100, resource.gap))}%` }} /></div>
                            </div>
                          )}
                          {url ? <a href={url} target="_blank" rel="noreferrer" className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#9fe870] px-4 pt-0 text-xs font-bold text-[#0e0f0c]" style={{ marginTop: '1rem' }}>{t('فتح المصدر', 'Open resource')}<ExternalLink size={14} /></a>
                            : <span className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[#f0f1ee] px-4 text-xs text-[#828782]">{t('الرابط غير متاح', 'Link unavailable')}</span>}
                        </article>
                      );
                    })}
                  </div>}
          </>
        )}
      </div>

      <Dialog open={Boolean(selectedJob)} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent showCloseButton={false} className="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none gap-0 overflow-hidden rounded-2xl border-[#dfe1dd] p-0 sm:h-[min(88dvh,760px)] sm:max-w-2xl sm:rounded-3xl">
          {selectedJob && (
            <div className="flex h-full min-h-0 flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
              <button type="button" onClick={() => setSelectedJob(null)} aria-label={t('إغلاق', 'Close')} className="absolute end-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#5b5e5a] hover:bg-[#f0f1ee] focus:ring-2 focus:ring-[#9fe870]"><X size={18} /></button>
              <DialogHeader className="flex-none border-b border-[#dfe1dd] px-4 py-5 pe-16 text-start sm:px-6">
                <div className="flex min-w-0 items-start gap-3">
                  <CompanyLogo src={selectedJob.companyLogo} name={localizedCompany(selectedJob)} />
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="break-words text-lg font-bold leading-7">{localizedJobTitle(selectedJob)}</DialogTitle>
                    <DialogDescription className="mt-1 break-words text-start text-sm text-[#5b5e5a]">{localizedCompany(selectedJob)}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#dfe1dd] p-4 text-start"><p className="text-xs text-[#828782]">{t('الموقع ونوع العمل', 'Location and employment type')}</p><p className="mt-2 break-words text-sm font-semibold text-[#0e0f0c]">{selectedJob.location || t('غير محدد', 'Not specified')} · {localizedValue(selectedJob.type, JOB_TYPE_LABELS)}</p></div>
                  <div className="rounded-2xl border border-[#dfe1dd] p-4 text-start"><p className="text-xs text-[#828782]">{t('الراتب', 'Salary')}</p><p className="mt-2 text-sm font-semibold text-[#0e0f0c]">{selectedJob.salaryMin || selectedJob.salaryMax ? `${selectedJob.salaryCurrency || 'SAR'} ${Number(selectedJob.salaryMin || 0).toLocaleString(isRTL ? 'ar-SA' : 'en-US')} - ${Number(selectedJob.salaryMax || 0).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}` : t('غير محدد', 'Not specified')}</p></div>
                </div>
                <div className="flex flex-col gap-4 rounded-2xl border border-[#dfe1dd] bg-[#f8f9f7] p-4 sm:flex-row sm:items-center">
                  <MatchScoreRing score={Math.round(selectedJob.matchScore || 0)} size={72} strokeWidth={5} />
                  <div className="min-w-0 flex-1 text-start">
                    <p className="text-sm font-bold text-[#0e0f0c]">{t('تفسير المطابقة', 'Match explanation')}</p>
                    <p className="mt-2 text-xs leading-6 text-[#5b5e5a]">{localizedRecommendation(selectedJob)}</p>
                    {Number(selectedJob.acceptanceProbability) > 0 && <p className="mt-2 text-xs font-semibold text-[#0e0f0c]">{t('تقدير احتمالية القبول', 'Estimated acceptance probability')}: {Math.round(Number(selectedJob.acceptanceProbability))}% <span className="font-normal text-[#828782]">{t('(تقدير إرشادي وليس ضمانًا)', '(guidance estimate, not a guarantee)')}</span></p>}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#dfe1dd] p-4 text-start">
                    <p className="text-xs font-bold text-[#0e0f0c]">{t('عوامل القوة', 'Strength factors')}</p>
                    <ul className="mt-3 space-y-2">{displayList(selectedJob.strengthFactors).length ? displayList(selectedJob.strengthFactors).map((factor) => <li key={factor} className="flex items-start gap-2 text-xs leading-6 text-[#5b5e5a]"><CheckCircle2 size={14} className="mt-1 flex-none text-[#1ba442]" />{localizedFactor(factor, 'strength')}</li>) : <li className="text-xs text-[#828782]">{t('لا توجد عوامل مسجلة', 'No factors recorded')}</li>}</ul>
                  </div>
                  <div className="rounded-2xl border border-[#dfe1dd] p-4 text-start">
                    <p className="text-xs font-bold text-[#0e0f0c]">{t('عوامل تحتاج إلى تحسين', 'Improvement factors')}</p>
                    <ul className="mt-3 space-y-2">{displayList(selectedJob.weaknessFactors).length ? displayList(selectedJob.weaknessFactors).map((factor) => <li key={factor} className="flex items-start gap-2 text-xs leading-6 text-[#5b5e5a]"><CircleAlert size={14} className="mt-1 flex-none text-[#828782]" />{localizedFactor(factor, 'weakness')}</li>) : <li className="text-xs text-[#828782]">{t('لا توجد عوامل مسجلة', 'No factors recorded')}</li>}</ul>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#f8f9f7] p-4 text-start"><p className="text-xs font-bold text-[#0e0f0c]">{t('المهارات المتطابقة', 'Matched skills')}</p><p className="mt-2 break-words text-xs leading-6 text-[#5b5e5a]">{displayList(selectedJob.matchingSkills ?? selectedJob.matchedSkills).join(isRTL ? '، ' : ', ') || t('لا توجد بيانات', 'No data')}</p></div>
                  <div className="rounded-2xl bg-[#f8f9f7] p-4 text-start"><p className="text-xs font-bold text-[#0e0f0c]">{t('المهارات الناقصة', 'Missing skills')}</p><p className="mt-2 break-words text-xs leading-6 text-[#5b5e5a]">{displayList(selectedJob.missingSkills).join(isRTL ? '، ' : ', ') || t('لا توجد فجوات أساسية', 'No key gaps')}</p></div>
                </div>

                <button type="button" onClick={() => { setSelectedJob(null); setActiveTab('learning'); }} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#dfe1dd] text-xs font-semibold text-[#0e0f0c] hover:bg-[#f0f1ee]"><BookOpen size={15} />{t('عرض الدورات المقترحة لتحسين فرصي', 'View courses to improve my chances')}</button>
              </div>
              <div className="grid flex-none grid-cols-1 gap-2 border-t border-[#dfe1dd] bg-white px-4 py-4 min-[390px]:grid-cols-2 sm:px-6">
                <button type="button" onClick={() => setSelectedJob(null)} className="min-h-11 rounded-full border border-[#dfe1dd] text-sm font-semibold text-[#5b5e5a] hover:bg-[#f0f1ee]">{t('إغلاق', 'Close')}</button>
                <button type="button" onClick={() => void handleApply(selectedJob)} disabled={applyMutation.isPending || appliedJobIds.has(selectedJob.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#9fe870] text-sm font-bold text-[#0e0f0c] disabled:opacity-60">{applyMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <ArrowUpRight size={15} />}{appliedJobIds.has(selectedJob.id) ? t('تم التقديم', 'Applied') : t('التقديم على الوظيفة', 'Apply for job')}</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
