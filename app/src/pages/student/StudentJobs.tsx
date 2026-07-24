import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useLanguage } from '@/contexts/LanguageContext';
import PortalLayout from '@/components/PortalLayout';
import MatchScoreRing from '@/components/MatchScoreRing';
import { useJobs, useApplyToJob } from '@/hooks/useStudent';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, Bookmark, BookmarkCheck, Send, ChevronDown, ChevronLeft, ChevronRight,
  SlidersHorizontal, MapPin, Briefcase, DollarSign, Clock, Loader2, RotateCcw,
  Eye, CheckCircle2, GraduationCap, CalendarDays, X, Globe2,
} from 'lucide-react';
import type { JobFeedFilterOption, StudentJobFeedItem } from '@/types/api.types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const JOB_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  full_time: { ar: 'دوام كامل', en: 'Full-time' },
  part_time: { ar: 'دوام جزئي', en: 'Part-time' },
  contract: { ar: 'عقد', en: 'Contract' },
  internship: { ar: 'تدريب', en: 'Internship' },
  temporary: { ar: 'مؤقت', en: 'Temporary' },
  remote: { ar: 'عن بعد', en: 'Remote' },
};

const EXPERIENCE_LABELS: Record<string, { ar: string; en: string }> = {
  entry: { ar: 'مبتدئ', en: 'Entry-level' },
  mid: { ar: 'متوسط', en: 'Mid-level' },
  senior: { ar: 'خبير', en: 'Senior' },
  lead: { ar: 'قائد فريق', en: 'Lead' },
  executive: { ar: 'تنفيذي', en: 'Executive' },
};

const LOCATION_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  remote: { ar: 'عن بعد', en: 'Remote' },
  hybrid: { ar: 'هجين', en: 'Hybrid' },
  onsite: { ar: 'حضوري', en: 'Onsite' },
};

const EDUCATION_LABELS: Record<string, { ar: string; en: string }> = {
  high_school: { ar: 'الثانوية العامة', en: 'High school' },
  bachelor: { ar: 'بكالوريوس', en: "Bachelor's degree" },
  master: { ar: 'ماجستير', en: "Master's degree" },
  phd: { ar: 'دكتوراه', en: 'PhD' },
  any: { ar: 'أي مؤهل مناسب', en: 'Any suitable qualification' },
};

const JOB_TITLE_LABELS: Record<string, { ar: string; en: string }> = {
  'software engineer': { ar: 'مهندس برمجيات', en: 'Software Engineer' },
  'backend developer': { ar: 'مطور واجهات خلفية', en: 'Backend Developer' },
  'frontend developer': { ar: 'مطور واجهات أمامية', en: 'Frontend Developer' },
  'ai engineer': { ar: 'مهندس ذكاء اصطناعي', en: 'AI Engineer' },
  'data scientist': { ar: 'عالم بيانات', en: 'Data Scientist' },
  'network engineer': { ar: 'مهندس شبكات', en: 'Network Engineer' },
  'cyber security engineer': { ar: 'مهندس أمن سيبراني', en: 'Cyber Security Engineer' },
  'cloud engineer': { ar: 'مهندس سحابة', en: 'Cloud Engineer' },
  'electrical engineer': { ar: 'مهندس كهربائي', en: 'Electrical Engineer' },
  'mechanical engineer': { ar: 'مهندس ميكانيكي', en: 'Mechanical Engineer' },
  'chemical engineer': { ar: 'مهندس كيميائي', en: 'Chemical Engineer' },
  'civil engineer': { ar: 'مهندس مدني', en: 'Civil Engineer' },
  'business analyst': { ar: 'محلل أعمال', en: 'Business Analyst' },
  'project manager': { ar: 'مدير مشروع', en: 'Project Manager' },
  'frontend engineer intern': { ar: 'متدرب هندسة واجهات أمامية', en: 'Frontend Engineer Intern' },
  'devops engineer': { ar: 'مهندس عمليات تطوير', en: 'DevOps Engineer' },
  'frontend developer (react)': { ar: 'مطور واجهات أمامية (React)', en: 'Frontend Developer (React)' },
  'backend developer (java/spring)': { ar: 'مطور واجهات خلفية (Java/Spring)', en: 'Backend Developer (Java/Spring)' },
  'chemical process engineer': { ar: 'مهندس عمليات كيميائية', en: 'Chemical Process Engineer' },
  'smart city iot engineer': { ar: 'مهندس إنترنت الأشياء للمدن الذكية', en: 'Smart City IoT Engineer' },
  'cloud infrastructure engineer': { ar: 'مهندس بنية تحتية سحابية', en: 'Cloud Infrastructure Engineer' },
  'it solutions architect': { ar: 'مهندس حلول تقنية المعلومات', en: 'IT Solutions Architect' },
  'renewable energy engineer': { ar: 'مهندس طاقة متجددة', en: 'Renewable Energy Engineer' },
  'data engineer': { ar: 'مهندس بيانات', en: 'Data Engineer' },
  'junior data scientist': { ar: 'محلل بيانات مبتدئ', en: 'Junior Data Scientist' },
  'software engineer - ai/ml': { ar: 'مهندس برمجيات - ذكاء اصطناعي', en: 'Software Engineer - AI/ML' },
  'full stack developer': { ar: 'مطور متكامل', en: 'Full Stack Developer' },
  'ai platform engineer e2e': { ar: 'مهندس منصة ذكاء اصطناعي', en: 'AI Platform Engineer' },
};

const LOCATION_LABELS: Record<string, { ar: string; en: string }> = {
  riyadh: { ar: 'الرياض', en: 'Riyadh' },
  jeddah: { ar: 'جدة', en: 'Jeddah' },
  dammam: { ar: 'الدمام', en: 'Dammam' },
  dhahran: { ar: 'الظهران', en: 'Dhahran' },
  jubail: { ar: 'الجبيل', en: 'Jubail' },
  makkah: { ar: 'مكة المكرمة', en: 'Makkah' },
  madinah: { ar: 'المدينة المنورة', en: 'Madinah' },
  'saudi arabia': { ar: 'المملكة العربية السعودية', en: 'Saudi Arabia' },
  remote: { ar: 'عن بعد', en: 'Remote' },
};

const BENEFIT_LABELS: Record<string, { ar: string; en: string }> = {
  'health insurance': { ar: 'تأمين طبي', en: 'Health insurance' },
  'medical insurance': { ar: 'تأمين طبي', en: 'Medical insurance' },
  'training budget': { ar: 'ميزانية تدريب', en: 'Training budget' },
  'flexible work': { ar: 'عمل مرن', en: 'Flexible work' },
  'remote days': { ar: 'أيام عمل عن بعد', en: 'Remote days' },
  'remote work': { ar: 'إمكانية العمل عن بعد', en: 'Remote work' },
  'career growth': { ar: 'تطور مهني', en: 'Career growth' },
  'annual bonus': { ar: 'مكافأة سنوية', en: 'Annual bonus' },
  mentorship: { ar: 'إرشاد مهني', en: 'Mentorship' },
  'transport allowance': { ar: 'بدل نقل', en: 'Transport allowance' },
  transportation: { ar: 'بدل نقل', en: 'Transportation allowance' },
  training: { ar: 'تدريب وتطوير', en: 'Training and development' },
};

const normalizeLabelKey = (value?: string | null) => String(value || '').trim().toLocaleLowerCase();

const DOMAIN_LABELS: Record<string, { ar: string; en: string }> = {
  engineering: { ar: 'الهندسة', en: 'Engineering' },
  ai: { ar: 'الذكاء الاصطناعي', en: 'AI' },
  'artificial intelligence': { ar: 'الذكاء الاصطناعي', en: 'Artificial Intelligence' },
  'software engineering': { ar: 'هندسة البرمجيات', en: 'Software Engineering' },
  data: { ar: 'البيانات', en: 'Data' },
  it: { ar: 'تقنية المعلومات', en: 'IT' },
  security: { ar: 'الأمن السيبراني', en: 'Security' },
  cloud: { ar: 'الحوسبة السحابية', en: 'Cloud' },
  operations: { ar: 'العمليات', en: 'Operations' },
};

function CompanyLogo({ src, name }: { src?: string | null; name: string }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => setHasError(false), [src]);

  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#dfe1dd] bg-[#f0f1ee]">
      {src && !hasError ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-contain p-1"
          onError={() => setHasError(true)}
        />
      ) : (
        <Briefcase size={20} aria-hidden="true" className="text-[#5b5e5a]" />
      )}
    </div>
  );
}

export default function StudentJobs() {
  const { t, isRTL } = useLanguage();
  const [urlSearchParams] = useSearchParams();
  const notificationJobId = urlSearchParams.get('jobId') || '';
  const openedNotificationJobId = useRef('');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState({
    jobType: true,
    experience: true,
    location: true,
    locationType: false,
    company: false,
    salary: true,
    matchScore: true,
  });

  const [selectedJobTypes, setSelectedJobTypes] = useState<Set<string>>(new Set());
  const [selectedExperience, setSelectedExperience] = useState<Set<string>>(new Set());
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [selectedLocationTypes, setSelectedLocationTypes] = useState<Set<string>>(new Set());
  const [selectedCompanies, setSelectedCompanies] = useState<Set<string>>(new Set());
  const [minSalary, setMinSalary] = useState(0);
  const [maxSalary, setMaxSalary] = useState(0);
  const [minMatch, setMinMatch] = useState(0);
  const [sortBy, setSortBy] = useState<'match' | 'recent' | 'salary'>('match');
  const [selectedJob, setSelectedJob] = useState<StudentJobFeedItem | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearchQuery(searchQuery.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  const searchParams = useMemo(() => ({
    jobId: notificationJobId || undefined,
    page: currentPage,
    limit: 12,
    search: debouncedSearchQuery || undefined,
    jobTypes: selectedJobTypes.size ? [...selectedJobTypes].join('|') : undefined,
    experienceLevels: selectedExperience.size ? [...selectedExperience].join('|') : undefined,
    locations: selectedLocations.size ? [...selectedLocations].join('|') : undefined,
    locationTypes: selectedLocationTypes.size ? [...selectedLocationTypes].join('|') : undefined,
    companyIds: selectedCompanies.size ? [...selectedCompanies].join('|') : undefined,
    salaryMin: minSalary > 0 ? minSalary : undefined,
    salaryMax: maxSalary > 0 ? maxSalary : undefined,
    minMatchScore: minMatch > 0 ? minMatch : undefined,
    sortBy,
  }), [notificationJobId, currentPage, debouncedSearchQuery, selectedJobTypes, selectedExperience, selectedLocations, selectedLocationTypes, selectedCompanies, minSalary, maxSalary, minMatch, sortBy]);

  const { data: jobsData, isLoading, isFetching, isError, error, refetch } = useJobs(searchParams);
  const applyMutation = useApplyToJob();

  const jobs = useMemo(() => jobsData?.items ?? [], [jobsData?.items]);
  const pagination = jobsData?.pagination;
  const availableFilters = jobsData?.filters;
  const availableSalaryMax = availableFilters?.salary.max || 0;

  useEffect(() => {
    if (!notificationJobId || openedNotificationJobId.current === notificationJobId) return;
    const target = jobs.find((job) => job.id === notificationJobId);
    if (!target) return;
    openedNotificationJobId.current = notificationJobId;
    const timer = window.setTimeout(() => setSelectedJob(target), 0);
    return () => window.clearTimeout(timer);
  }, [jobs, notificationJobId]);

  const toggleSet = <T,>(set: Set<T>, value: T) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const toggleFilter = (section: keyof typeof filtersOpen) => {
    setFiltersOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const totalPages = Math.max(1, pagination?.totalPages || 1);
  const activeFilterCount = selectedJobTypes.size
    + selectedExperience.size
    + selectedLocations.size
    + selectedLocationTypes.size
    + selectedCompanies.size
    + Number(minSalary > 0)
    + Number(maxSalary > 0)
    + Number(minMatch > 0);

  const visiblePages = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const optionLabel = (option: JobFeedFilterOption, labels?: Record<string, { ar: string; en: string }>) => {
    const translated = labels?.[option.value];
    return translated ? (isRTL ? translated.ar : translated.en) : option.label;
  };

  const localizedMapValue = (value: string | null | undefined, labels: Record<string, { ar: string; en: string }>) => {
    const translated = labels[normalizeLabelKey(value)];
    return translated ? (isRTL ? translated.ar : translated.en) : String(value || '');
  };

  const localizedJobTitle = (job: StudentJobFeedItem) => {
    if (isRTL && job.titleAr && /[\u0600-\u06ff]/.test(job.titleAr)) return job.titleAr;
    return localizedMapValue(job.title, JOB_TITLE_LABELS) || job.titleAr || job.title;
  };

  const localizedLocation = (value?: string | null) => {
    if (!value) return t('الموقع غير محدد', 'Location not specified');
    return value.split(',').map((part) => localizedMapValue(part.trim(), LOCATION_LABELS) || part.trim()).join(isRTL ? '، ' : ', ');
  };

  const localizedDescription = (job: StudentJobFeedItem) => {
    if (isRTL && job.descriptionAr && /[\u0600-\u06ff]/.test(job.descriptionAr)) return job.descriptionAr;
    const description = job.description?.trim();
    if (!description) return t('لا يوجد وصف متاح', 'No description available');
    if (!isRTL) return description;

    const title = localizedJobTitle(job);
    const domain = localizedMapValue(job.category, DOMAIN_LABELS) || job.category || 'المجال المهني';
    return description
      .replace(/^.+? role focused on delivering high quality work in .+?\./i, `دور ${title} يركز على تقديم عمل عالي الجودة في مجال ${domain}.`)
      .replace(/The candidate will collaborate with cross-functional teams, solve practical business challenges, and contribute to measurable outcomes\./gi, 'يتعاون المرشح مع فرق متعددة التخصصات لحل تحديات عملية والمساهمة في نتائج قابلة للقياس.')
      .replace(/Deliver .+? tasks with clear ownership\./gi, `تنفيذ مهام ${title} بمسؤوليات واضحة.`)
      .replace(/Collaborate with product, engineering, and business stakeholders\./gi, 'التعاون مع فرق المنتجات والهندسة وأصحاب المصلحة في الأعمال.')
      .replace(/Document decisions, risks, and implementation progress\./gi, 'توثيق القرارات والمخاطر وتقدم التنفيذ.')
      .replace(/Improve quality, reliability, and team knowledge sharing\./gi, 'تحسين الجودة والموثوقية ومشاركة المعرفة داخل الفريق.')
      .replace(/Build Python and Node\.js AI services using Docker, Kubernetes, PostgreSQL and AWS\. Three years of experience and a bachelor degree are required\./gi, 'بناء خدمات ذكاء اصطناعي باستخدام Python وNode.js مع Docker وKubernetes وPostgreSQL وAWS. يشترط الحصول على درجة البكالوريوس وخبرة ثلاث سنوات.')
      .replace(/Build React applications, consume REST APIs, use TypeScript, Git, Docker and AWS basics\./gi, 'بناء تطبيقات React وربط واجهات REST API باستخدام TypeScript وGit وDocker وأساسيات AWS.')
      .replace(/Build React and TypeScript interfaces connected to REST APIs\. Use Docker and AWS cloud services\./gi, 'بناء واجهات باستخدام React وTypeScript وربطها بخدمات REST API مع استخدام Docker وخدمات AWS السحابية.')
      .replace(/Develop UI, integrate APIs, improve quality/gi, 'تطوير الواجهات وربط الخدمات وتحسين الجودة')
      .replace(/Build UI/gi, 'بناء واجهات المستخدم')
      .replace(/Integrate APIs/gi, 'ربط واجهات الخدمات')
      .replace(/Analyze business processes, document requirements, and support delivery teams with clear product specifications\./gi, 'تحليل إجراءات الأعمال وتوثيق المتطلبات ودعم فرق التنفيذ بمواصفات واضحة للمنتج.')
      .replace(/Gather stakeholder requirements/gi, 'جمع متطلبات أصحاب المصلحة')
      .replace(/Prepare process maps/gi, 'إعداد خرائط الإجراءات')
      .replace(/Write user stories/gi, 'كتابة قصص المستخدم')
      .replace(/Support acceptance testing/gi, 'دعم اختبارات القبول')
      .replace(/Strong communication skills/gi, 'مهارات تواصل قوية')
      .replace(/Experience with requirements analysis/gi, 'خبرة في تحليل المتطلبات')
      .replace(/Ability to work with technical and business teams/gi, 'القدرة على العمل مع الفرق التقنية وفرق الأعمال')
      .replace(/Build production AI services, develop model evaluation pipelines, and integrate NLP features with backend APIs\./gi, 'بناء خدمات ذكاء اصطناعي جاهزة للإنتاج وتطوير مسارات تقييم النماذج وربط مزايا معالجة اللغة الطبيعية بخدمات النظام الخلفية.')
      .replace(/Design NLP services/gi, 'تصميم خدمات معالجة اللغة الطبيعية')
      .replace(/Create embedding pipelines/gi, 'إنشاء مسارات التضمين الدلالي')
      .replace(/Monitor model quality/gi, 'مراقبة جودة النماذج')
      .replace(/Collaborate with product and backend teams/gi, 'التعاون مع فرق المنتج والأنظمة الخلفية')
      .replace(/Bachelor degree in Computer Science or related field/gi, 'درجة بكالوريوس في علوم الحاسب أو مجال ذي صلة')
      .replace(/Experience with Python and ML frameworks/gi, 'خبرة في Python وأطر تعلم الآلة')
      .replace(/Strong understanding of REST APIs/gi, 'فهم قوي لواجهات REST API')
      .replace(/Protect cloud and application environments through security monitoring, vulnerability assessment, and incident response\./gi, 'حماية البيئات السحابية والتطبيقات عبر المراقبة الأمنية وتقييم الثغرات والاستجابة للحوادث.')
      .replace(/Run vulnerability assessments/gi, 'تنفيذ تقييمات الثغرات')
      .replace(/Monitor security alerts/gi, 'مراقبة التنبيهات الأمنية')
      .replace(/Improve access controls/gi, 'تحسين ضوابط الوصول')
      .replace(/Prepare security reports/gi, 'إعداد التقارير الأمنية')
      .replace(/Knowledge of network security and cloud controls/gi, 'معرفة بأمن الشبكات والضوابط السحابية')
      .replace(/Experience with SIEM tools/gi, 'خبرة في أدوات إدارة معلومات وأحداث الأمن')
      .replace(/Understanding of secure development practices/gi, 'فهم ممارسات التطوير الآمن')
      .replace(/Frontend React TypeScript role for audit logging verification\./gi, 'وظيفة لتطوير واجهات React وTypeScript والتحقق من تسجيل العمليات.')
      .replace(/Review candidates/gi, 'مراجعة المرشحين')
      .replace(/React TypeScript role/gi, 'وظيفة لتطوير واجهات باستخدام React وTypeScript');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedJobTypes(new Set());
    setSelectedExperience(new Set());
    setSelectedLocations(new Set());
    setSelectedLocationTypes(new Set());
    setSelectedCompanies(new Set());
    setMinSalary(0);
    setMaxSalary(0);
    setMinMatch(0);
    setSortBy('match');
    setCurrentPage(1);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApply = async (jobId: string) => {
    try {
      const application = await applyMutation.mutateAsync({ jobId, data: {} });
      if (selectedJob?.id === jobId) {
        setSelectedJob({
          ...selectedJob,
          applicationId: application?.id || application?._id || null,
          applicationStatus: application?.status || 'submitted',
          appliedAt: application?.createdAt || new Date().toISOString(),
          canApply: false,
        });
      }
      toast.success(t('تم التقديم بنجاح، ويمكنك متابعة الطلب من صفحة طلباتي', 'Applied successfully. You can track it from Applications.'));
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      toast.error(isRTL ? 'تعذر إكمال التقديم. تحقق من حالة الوظيفة أو من تقديمك السابق عليها.' : backendMessage || 'Application failed');
    }
  };

  const applicationStatusLabel = (status?: string | null) => {
    const labels: Record<string, { ar: string; en: string }> = {
      submitted: { ar: 'تم التقديم', en: 'Applied' },
      applied: { ar: 'تم التقديم', en: 'Applied' },
      screening: { ar: 'قيد الفرز', en: 'Screening' },
      under_review: { ar: 'قيد المراجعة', en: 'In review' },
      shortlisted: { ar: 'ضمن القائمة المختصرة', en: 'Shortlisted' },
      interview_scheduled: { ar: 'تم تحديد مقابلة', en: 'Interview scheduled' },
      interviewed: { ar: 'تمت المقابلة', en: 'Interviewed' },
      offer_pending: { ar: 'عرض قيد الإعداد', en: 'Offer pending' },
      offered: { ar: 'تم إرسال عرض', en: 'Offer received' },
      accepted: { ar: 'مقبول', en: 'Accepted' },
      rejected: { ar: 'مرفوض', en: 'Rejected' },
      withdrawn: { ar: 'تم سحب الطلب', en: 'Withdrawn' },
    };
    const label = status ? labels[status] : null;
    return label ? (isRTL ? label.ar : label.en) : t('تم التقديم', 'Applied');
  };

  const locationTypeLabel = (type?: string | null) => type
    ? localizedMapValue(type, LOCATION_TYPE_LABELS)
    : '';

  const FilterSection = ({ title, section, children }: { title: string; section: keyof typeof filtersOpen; children: React.ReactNode }) => (
    <div className="border-b border-[#dfe1dd] pb-3">
      <button onClick={() => toggleFilter(section)} className="flex w-full items-center justify-between py-2">
        <span className="text-sm font-bold text-[#0e0f0c]">{title}</span>
        <ChevronDown size={16} className={cn('transition-transform', !filtersOpen[section] && '-rotate-180')} style={{ color: '#828782' }} />
      </button>
      {filtersOpen[section] && <div className="mt-1 flex flex-col gap-1.5">{children}</div>}
    </div>
  );

  const CheckboxItem = ({ label, count, checked, onChange }: { label: string; count?: number; checked: boolean; onChange: () => void }) => (
    <label className="flex cursor-pointer items-center gap-2 py-1">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-[#dfe1dd] text-[#9fe870] accent-[#9fe870]" />
      <span className="min-w-0 flex-1 break-words text-xs font-semibold text-[#5b5e5a]" dir="auto">{label}</span>
      {count !== undefined && <span className="text-[10px] font-medium text-[#828782]">{count}</span>}
    </label>
  );

  return (
    <PortalLayout title={t('الوظائف', 'Jobs')}>
      <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'} lang={isRTL ? 'ar' : 'en'}>
        {/* Search Bar */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-5">
            <Search size={20} style={{ color: '#828782' }} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder={t('البحث عن وظائف...', 'Search jobs...')}
            className="w-full rounded-full border border-[#dfe1dd] bg-white py-3 pe-5 ps-14 text-sm font-semibold text-[#0e0f0c] outline-none transition-all placeholder:text-[#828782] focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]"
            style={{ height: 48 }}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowMobileFilters((open) => !open)}
          aria-expanded={showMobileFilters}
          className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] lg:hidden"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal size={17} aria-hidden="true" />
            {t('التصفية', 'Filters')}
            {activeFilterCount > 0 && <span className="text-xs text-[#1ba442]">({activeFilterCount})</span>}
          </span>
          <ChevronDown size={17} className={cn('transition-transform', showMobileFilters && 'rotate-180')} aria-hidden="true" />
        </button>

        <div className="flex flex-col gap-5 lg:flex-row">
          {/* Filter Sidebar */}
          <aside className={cn(
            'w-full flex-shrink-0 space-y-4 rounded-xl border border-[#dfe1dd] bg-white p-4 lg:block lg:w-[260px] lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0',
            showMobileFilters ? 'block' : 'hidden',
          )}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} style={{ color: '#5b5e5a' }} />
                <span className="text-sm font-bold text-[#0e0f0c]">{t('التصفية', 'Filters')}</span>
              </div>
              <button type="button" onClick={resetFilters} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#5b5e5a] transition hover:bg-white" title={t('إعادة ضبط الفلاتر', 'Reset filters')}>
                <RotateCcw size={14} aria-hidden="true" /> {t('مسح', 'Reset')}
              </button>
            </div>

            <FilterSection title={t('نوع الوظيفة', 'Job Type')} section="jobType">
              {(availableFilters?.jobTypes || []).map((option) => (
                <CheckboxItem key={option.value} label={optionLabel(option, JOB_TYPE_LABELS)} count={option.count} checked={selectedJobTypes.has(option.value)} onChange={() => { setSelectedJobTypes(toggleSet(selectedJobTypes, option.value)); setCurrentPage(1); }} />
              ))}
            </FilterSection>

            <FilterSection title={t('المستوى', 'Experience Level')} section="experience">
              {(availableFilters?.experienceLevels || []).map((option) => (
                <CheckboxItem key={option.value} label={optionLabel(option, EXPERIENCE_LABELS)} count={option.count} checked={selectedExperience.has(option.value)} onChange={() => { setSelectedExperience(toggleSet(selectedExperience, option.value)); setCurrentPage(1); }} />
              ))}
            </FilterSection>

            <FilterSection title={t('الموقع', 'Location')} section="location">
              {(availableFilters?.locations || []).map((option) => (
                <CheckboxItem key={option.value} label={localizedLocation(option.label)} count={option.count} checked={selectedLocations.has(option.value)} onChange={() => { setSelectedLocations(toggleSet(selectedLocations, option.value)); setCurrentPage(1); }} />
              ))}
            </FilterSection>

            <FilterSection title={t('نمط العمل', 'Work mode')} section="locationType">
              {(availableFilters?.locationTypes || []).map((option) => (
                <CheckboxItem key={option.value} label={optionLabel(option, LOCATION_TYPE_LABELS)} count={option.count} checked={selectedLocationTypes.has(option.value)} onChange={() => { setSelectedLocationTypes(toggleSet(selectedLocationTypes, option.value)); setCurrentPage(1); }} />
              ))}
            </FilterSection>

            <FilterSection title={t('الشركة', 'Company')} section="company">
              {(availableFilters?.companies || []).map((option) => (
                <CheckboxItem key={option.value} label={option.label} count={option.count} checked={selectedCompanies.has(option.value)} onChange={() => { setSelectedCompanies(toggleSet(selectedCompanies, option.value)); setCurrentPage(1); }} />
              ))}
            </FilterSection>

            <FilterSection title={t('الراتب', 'Salary Range')} section="salary">
              {availableSalaryMax > 0 ? <>
                <div className="grid grid-cols-2 gap-2 px-1">
                  <label className="text-[10px] font-semibold text-[#828782]">
                    {t('من', 'From')}
                    <input type="number" min={0} max={availableSalaryMax} step={500} value={minSalary || ''} onChange={(event) => { setMinSalary(Math.max(0, Number(event.target.value) || 0)); setCurrentPage(1); }} className="mt-1 w-full rounded-lg border border-[#dfe1dd] bg-white px-2 py-1.5 text-xs text-[#0e0f0c] outline-none focus:border-[#9fe870]" placeholder={String(availableFilters?.salary.min || 0)} />
                  </label>
                  <label className="text-[10px] font-semibold text-[#828782]">
                    {t('إلى', 'To')}
                    <input type="number" min={0} max={availableSalaryMax} step={500} value={maxSalary || ''} onChange={(event) => { setMaxSalary(Math.max(0, Number(event.target.value) || 0)); setCurrentPage(1); }} className="mt-1 w-full rounded-lg border border-[#dfe1dd] bg-white px-2 py-1.5 text-xs text-[#0e0f0c] outline-none focus:border-[#9fe870]" placeholder={String(availableSalaryMax)} />
                  </label>
                </div>
                <p className="px-1 text-[10px] font-medium text-[#828782]">{availableFilters?.salary.currency || 'SAR'} {availableFilters?.salary.min.toLocaleString()} - {availableSalaryMax.toLocaleString()}</p>
              </> : <p className="text-xs text-[#828782]">{t('لا توجد رواتب محددة', 'No salary data available')}</p>}
            </FilterSection>

            <FilterSection title={t('نسبة التطابق', 'Match Score')} section="matchScore">
              <div className="flex items-center gap-2 px-1">
                <input type="range" min={0} max={100} step={5} value={minMatch} onChange={(e) => { setMinMatch(Number(e.target.value)); setCurrentPage(1); }} className="w-full accent-[#9fe870]" />
              </div>
              <p className="px-1 text-[10px] font-semibold text-[#828782]">{t('الحد الأدنى:', 'Min:')} {minMatch}%</p>
            </FilterSection>
          </aside>

          {/* Job Grid */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-semibold text-[#5b5e5a]">
                {isLoading ? '...' : pagination?.total || 0} {t('وظيفة منشورة', 'published jobs')}
                {jobsData && <span className="text-[#828782]"> {t('من أصل', 'out of')} {jobsData.totalPublished}</span>}
                {isFetching && !isLoading && <Loader2 size={12} className="ms-2 inline animate-spin text-[#1ba442]" />}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-[#828782]">{t('ترتيب:', 'Sort:')}</span>
                {(['match', 'recent', 'salary'] as const).map((s) => (
                  <button key={s} onClick={() => setSortBy(s)} className={cn('rounded-full px-3 py-1 text-xs font-semibold transition-colors', sortBy === s ? 'bg-[#9fe870] text-[#0e0f0c]' : 'bg-[#f0f1ee] text-[#5b5e5a] hover:bg-[#ebede9]')}>
                    {s === 'match' ? t('التطابق', 'Match') : s === 'recent' ? t('الأحدث', 'Recent') : t('الراتب', 'Salary')}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-[#9fe870]" />
              </div>
            )}

            {isError && !isLoading && (
              <div className="rounded-3xl border border-[#dfe1dd] bg-white px-6 py-12 text-center">
                <p className="text-sm font-semibold text-[#0e0f0c]">{t('تعذر تحميل الوظائف', 'Unable to load jobs')}</p>
                <p className="mt-1 text-xs text-[#828782]">{isRTL ? 'تحقق من الاتصال ثم حاول مرة أخرى.' : (error as any)?.response?.data?.message || 'Please try again'}</p>
                <button type="button" onClick={() => void refetch()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#9fe870] px-5 text-xs font-semibold text-[#0e0f0c]">
                  <RotateCcw size={15} /> {t('إعادة المحاولة', 'Retry')}
                </button>
              </div>
            )}

            {/* Job Cards */}
            {!isLoading && !isError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 gap-4 xl:grid-cols-2"
              >
                {jobs.map((job: StudentJobFeedItem, index: number) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                    className="min-w-0 rounded-3xl border border-[#dfe1dd] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <CompanyLogo src={job.companyLogo} name={job.companyName || t('شركة', 'Company')} />
                      <div className="min-w-0 flex-1 text-start">
                        <h3 className="break-words text-base font-bold leading-6 text-[#0e0f0c]" title={localizedJobTitle(job)}>
                          {localizedJobTitle(job)}
                        </h3>
                        <p className="mt-0.5 break-words text-xs font-semibold text-[#5b5e5a]" title={job.companyName}>
                          {job.companyName || t('شركة غير محددة', 'Company not specified')}
                        </p>
                      </div>
                      <div className="flex flex-none flex-col items-center gap-2">
                        <MatchScoreRing
                          score={Math.round(job.matchScore ?? 0)}
                          size={58}
                          strokeWidth={4}
                          className="sm:hidden"
                        />
                        <MatchScoreRing
                          score={Math.round(job.matchScore ?? 0)}
                          size={66}
                          strokeWidth={4}
                          className="hidden sm:inline-flex"
                        />
                        <span className="text-[10px] font-semibold text-[#828782]">{t('التطابق', 'Match')}</span>
                        <button
                          type="button"
                          onClick={() => toggleBookmark(job.id)}
                          aria-label={bookmarkedIds.has(job.id) ? t('إزالة من المحفوظات', 'Remove bookmark') : t('حفظ الوظيفة', 'Bookmark job')}
                          className="flex h-11 w-11 items-center justify-center rounded-full text-[#828782] transition-colors hover:bg-[#f0f1ee] focus:outline-none focus:ring-2 focus:ring-[#9fe870]"
                        >
                          {bookmarkedIds.has(job.id) ? <BookmarkCheck size={18} className="text-[#1ba442]" /> : <Bookmark size={18} />}
                        </button>
                      </div>
                    </div>

                    {job.skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {job.skills.slice(0, 5).map((skill) => (
                          <span key={skill} className="max-w-full break-words rounded-full border border-[#dfe1dd] bg-[#f8f9f7] px-2.5 py-1 text-[11px] font-semibold text-[#5b5e5a]">
                            {skill}
                          </span>
                        ))}
                        {job.skills.length > 5 && (
                          <span className="rounded-full border border-[#dfe1dd] px-2.5 py-1 text-[11px] font-semibold text-[#828782]">
                            +{job.skills.length - 5}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 min-w-0 border-y border-[#f0f1ee] py-3">
                      <div className="min-w-0 space-y-2 text-xs text-[#5b5e5a]">
                        <p className="flex min-w-0 items-start gap-2">
                          <MapPin size={14} className="mt-0.5 flex-none text-[#828782]" aria-hidden="true" />
                          <span className="break-words">{localizedLocation(job.location)}</span>
                          {locationTypeLabel(job.locationType) && <span className="text-[#828782]">· {locationTypeLabel(job.locationType)}</span>}
                        </p>
                        <p className="flex min-w-0 items-start gap-2">
                          <Briefcase size={14} className="mt-0.5 flex-none text-[#828782]" aria-hidden="true" />
                          <span>{optionLabel({ value: job.type || '', label: job.type || t('غير محدد', 'Not specified'), count: 0 }, JOB_TYPE_LABELS)}</span>
                          <span className="text-[#828782]">·</span>
                          <span>{optionLabel({ value: job.experienceLevel || '', label: job.experienceLevel || t('غير محدد', 'Not specified'), count: 0 }, EXPERIENCE_LABELS)}</span>
                        </p>
                        {job.applicationId && (
                          <p className="inline-flex items-center gap-1.5 font-bold text-[#1ba442]">
                            <CheckCircle2 size={14} aria-hidden="true" />
                            {applicationStatusLabel(job.applicationStatus)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 flex min-w-0 flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {job.salaryMin || job.salaryMax ? <span className="flex items-center gap-1 text-xs font-bold text-[#0e0f0c]">
                          <DollarSign size={12} style={{ color: '#1ba442' }} />
                          {isRTL && job.salaryCurrency === 'SAR' ? 'ر.س' : job.salaryCurrency} {job.salaryMin.toLocaleString(isRTL ? 'ar-SA' : 'en-US')} - {job.salaryMax.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                        </span> : <span className="text-[10px] font-semibold text-[#828782]">{t('الراتب غير محدد', 'Salary not specified')}</span>}
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#828782]">
                          <Clock size={10} />
                          {job.postedDate ? new Date(job.postedDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : t('غير محدد', 'Not specified')}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setSelectedJob(job)}
                          className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-[#dfe1dd] bg-white px-4 text-xs font-semibold text-[#5b5e5a] transition-colors hover:bg-[#f0f1ee]"
                        >
                          <Eye size={13} aria-hidden="true" />
                          {t('عرض التفاصيل', 'View details')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApply(job.id)}
                          disabled={applyMutation.isPending || Boolean(job.applicationId) || !job.canApply}
                          className={cn(
                            'inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-all disabled:cursor-not-allowed',
                            job.applicationId
                              ? 'bg-[#E7FDD8] text-[#1ba442]'
                              : job.canApply
                                ? 'bg-[#9fe870] text-[#0e0f0c] hover:scale-[1.02] hover:shadow-sm'
                                : 'bg-[#f0f1ee] text-[#828782]',
                          )}
                        >
                          {applyMutation.isPending && applyMutation.variables?.jobId === job.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : job.applicationId ? <CheckCircle2 size={12} /> : <Send size={12} />}
                          {job.applicationId
                            ? applicationStatusLabel(job.applicationStatus)
                            : job.canApply ? t('تقديم', 'Apply') : t('التقديم غير متاح', 'Unavailable')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {!isLoading && !isError && jobs.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-[#dfe1dd] bg-white py-16">
                <Search size={40} style={{ color: '#dfe1dd' }} />
                <p className="mt-3 text-sm font-semibold text-[#828782]">{t('لا توجد وظائف مطابقة', 'No matching jobs found')}</p>
              </div>
            )}

            {/* Pagination */}
            {!isLoading && !isError && totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#dfe1dd] text-[#5b5e5a] disabled:opacity-40 hover:bg-[#f0f1ee] transition-colors"
                >
                  {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
                {visiblePages.map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors',
                      currentPage === p ? 'bg-[#9fe870] text-[#0e0f0c]' : 'bg-white border border-[#dfe1dd] text-[#5b5e5a] hover:bg-[#f0f1ee]'
                    )}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#dfe1dd] text-[#5b5e5a] disabled:opacity-40 hover:bg-[#f0f1ee] transition-colors"
                >
                  {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={Boolean(selectedJob)} onOpenChange={(open) => !open && setSelectedJob(null)}>
        <DialogContent showCloseButton={false} className="h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none gap-0 overflow-hidden rounded-2xl border-[#dfe1dd] p-0 sm:h-[min(90dvh,860px)] sm:max-h-[90dvh] sm:max-w-2xl sm:rounded-3xl">
          {selectedJob && (
            <div className="flex h-full min-h-0 min-w-0 flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                aria-label={t('إغلاق تفاصيل الوظيفة', 'Close job details')}
                className="absolute end-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#5b5e5a] transition-colors hover:bg-[#f0f1ee] focus:outline-none focus:ring-2 focus:ring-[#9fe870]"
              >
                <X size={19} aria-hidden="true" />
              </button>
              <DialogHeader className="flex-none border-b border-[#dfe1dd] px-4 py-5 pe-16 text-start sm:px-6">
                <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                  <CompanyLogo src={selectedJob.companyLogo} name={selectedJob.companyName || t('شركة', 'Company')} />
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="break-words text-lg font-bold leading-7 text-[#0e0f0c]">
                      {localizedJobTitle(selectedJob)}
                    </DialogTitle>
                    <DialogDescription className="mt-1 break-words text-start text-sm font-semibold text-[#5b5e5a]">
                      {selectedJob.companyName || t('شركة غير محددة', 'Company not specified')}
                    </DialogDescription>
                    <div className="mt-3 flex flex-col gap-2 text-xs text-[#828782] sm:flex-row sm:flex-wrap sm:gap-3">
                      <span className="inline-flex min-w-0 items-start gap-1"><MapPin size={13} className="mt-0.5 flex-none" /><span className="break-words">{localizedLocation(selectedJob.location)}</span></span>
                      <span className="inline-flex items-center gap-1"><Briefcase size={13} />{optionLabel({ value: selectedJob.type || '', label: selectedJob.type || t('غير محدد', 'Not specified'), count: 0 }, JOB_TYPE_LABELS)}</span>
                      {selectedJob.applicationDeadline && <span className="inline-flex items-center gap-1"><CalendarDays size={13} />{t('آخر موعد', 'Deadline')}: {new Date(selectedJob.applicationDeadline).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>}
                    </div>
                  </div>
                  <div className="col-span-2 mt-1 flex items-center gap-3 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:mt-0 sm:flex-col sm:gap-1">
                    <MatchScoreRing score={Math.round(selectedJob.matchScore ?? 0)} size={64} strokeWidth={4} />
                    <span className="text-[10px] font-semibold text-[#828782]">{t('نسبة التطابق', 'Match score')}</span>
                  </div>
                </div>
              </DialogHeader>

              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                {selectedJob.applicationId && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#bdeca0] bg-[#F4FCEF] px-4 py-3">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1ba442]"><CheckCircle2 size={17} />{applicationStatusLabel(selectedJob.applicationStatus)}</span>
                    {selectedJob.appliedAt && <span className="text-xs text-[#5b5e5a]">{t('تاريخ التقديم', 'Applied on')}: {new Date(selectedJob.appliedAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</span>}
                  </div>
                )}

                <section>
                  <h3 className="text-sm font-bold text-[#0e0f0c]">{t('وصف الوظيفة', 'Job description')}</h3>
                  <p className="mt-2 whitespace-pre-line break-words text-start text-sm leading-7 text-[#5b5e5a]">{localizedDescription(selectedJob)}</p>
                </section>

                <section className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#e7e9e5] bg-[#f8f9f7] p-4">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><Briefcase size={15} />{t('تفاصيل العمل', 'Work details')}</span>
                    <dl className="mt-3 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-3"><dt className="text-[#828782]">{t('نوع الدوام', 'Employment type')}</dt><dd className="break-words text-end font-semibold text-[#0e0f0c]">{optionLabel({ value: selectedJob.type || '', label: selectedJob.type || t('غير محدد', 'Not specified'), count: 0 }, JOB_TYPE_LABELS)}</dd></div>
                      <div className="flex items-start justify-between gap-3"><dt className="text-[#828782]">{t('نمط العمل', 'Work mode')}</dt><dd className="break-words text-end font-semibold text-[#0e0f0c]">{selectedJob.locationType ? localizedMapValue(selectedJob.locationType, LOCATION_TYPE_LABELS) : t('غير محدد', 'Not specified')}</dd></div>
                      <div className="flex items-start justify-between gap-3"><dt className="text-[#828782]">{t('المستوى', 'Level')}</dt><dd className="break-words text-end font-semibold text-[#0e0f0c]">{selectedJob.experienceLevel ? localizedMapValue(selectedJob.experienceLevel, EXPERIENCE_LABELS) : t('غير محدد', 'Not specified')}</dd></div>
                      <div className="flex items-start justify-between gap-3"><dt className="text-[#828782]">{t('المجال', 'Category')}</dt><dd className="break-words text-end font-semibold text-[#0e0f0c]">{selectedJob.category ? localizedMapValue(selectedJob.category, DOMAIN_LABELS) : t('غير محدد', 'Not specified')}</dd></div>
                    </dl>
                  </div>
                  <div className="rounded-xl border border-[#e7e9e5] bg-[#f8f9f7] p-4">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><CalendarDays size={15} />{t('معلومات الإعلان', 'Posting information')}</span>
                    <dl className="mt-3 space-y-2 text-xs">
                      <div className="flex items-start justify-between gap-3"><dt className="text-[#828782]">{t('تاريخ النشر', 'Posted on')}</dt><dd className="text-end font-semibold text-[#0e0f0c]">{selectedJob.postedDate ? new Date(selectedJob.postedDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : t('غير محدد', 'Not specified')}</dd></div>
                      <div className="flex items-start justify-between gap-3"><dt className="text-[#828782]">{t('آخر موعد', 'Deadline')}</dt><dd className="text-end font-semibold text-[#0e0f0c]">{selectedJob.applicationDeadline ? new Date(selectedJob.applicationDeadline).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : t('غير محدد', 'Not specified')}</dd></div>
                      <div className="flex items-start justify-between gap-3"><dt className="text-[#828782]">{t('خطاب التقديم', 'Cover letter')}</dt><dd className="text-end font-semibold text-[#0e0f0c]">{selectedJob.requiresCoverLetter ? t('مطلوب', 'Required') : t('غير مطلوب', 'Not required')}</dd></div>
                    </dl>
                  </div>
                </section>

                {selectedJob.responsibilities.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-[#0e0f0c]">{t('المسؤوليات', 'Responsibilities')}</h3>
                    <ul className="mt-2 space-y-2 text-sm text-[#5b5e5a]">
                      {selectedJob.responsibilities.map((responsibility, index) => <li key={`${responsibility}-${index}`} className="flex gap-2 leading-6"><CheckCircle2 size={15} className="mt-1 flex-none text-[#1ba442]" aria-hidden="true" /><span className="break-words text-start">{localizedDescription({ ...selectedJob, description: responsibility, descriptionAr: undefined })}</span></li>)}
                    </ul>
                  </section>
                )}

                <section className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-[#f8f9f7] p-4">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><GraduationCap size={15} />{t('المؤهل والخبرة', 'Education and experience')}</span>
                    <p className="mt-2 text-sm font-semibold text-[#0e0f0c]">{selectedJob.educationLevel ? localizedMapValue(selectedJob.educationLevel, EDUCATION_LABELS) : t('غير محدد', 'Not specified')}</p>
                    <p className="mt-1 text-xs text-[#828782]">{t('الخبرة المطلوبة', 'Required experience')}: {selectedJob.requiredExperienceYears.toLocaleString(isRTL ? 'ar-SA' : 'en-US')} {t('سنة', 'years')}</p>
                    {selectedJob.educationFields.length > 0 && <p className="mt-2 break-words text-xs leading-5 text-[#5b5e5a]">{t('التخصصات المقبولة', 'Accepted fields')}: {selectedJob.educationFields.join(isRTL ? '، ' : ', ')}</p>}
                  </div>
                  <div className="rounded-xl bg-[#f8f9f7] p-4">
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-[#5b5e5a]"><DollarSign size={15} />{t('الراتب', 'Salary')}</span>
                    <p className="mt-2 text-sm font-semibold text-[#0e0f0c]">{selectedJob.salaryMin || selectedJob.salaryMax ? `${isRTL && selectedJob.salaryCurrency === 'SAR' ? 'ر.س' : selectedJob.salaryCurrency} ${selectedJob.salaryMin.toLocaleString(isRTL ? 'ar-SA' : 'en-US')} - ${selectedJob.salaryMax.toLocaleString(isRTL ? 'ar-SA' : 'en-US')}` : t('غير محدد', 'Not specified')}</p>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-[#0e0f0c]">{t('المهارات المطلوبة', 'Required skills')}</h3>
                  {selectedJob.skills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedJob.skills.map((skill) => <span key={skill} className="max-w-full break-words rounded-full border border-[#dfe1dd] bg-[#f8f9f7] px-3 py-1.5 text-xs font-semibold text-[#5b5e5a]">{skill}</span>)}
                    </div>
                  ) : <p className="mt-2 text-sm text-[#828782]">{t('غير محددة', 'Not specified')}</p>}
                </section>

                {selectedJob.preferredSkills.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-[#0e0f0c]">{t('المهارات المفضلة', 'Preferred skills')}</h3>
                    <p className="mt-2 break-words text-sm leading-7 text-[#5b5e5a]">{selectedJob.preferredSkills.join(isRTL ? '، ' : ', ')}</p>
                  </section>
                )}

                {(selectedJob.matchedSkills.length > 0 || selectedJob.missingSkills.length > 0) && (
                  <section>
                    <h3 className="text-sm font-bold text-[#0e0f0c]">{t('تحليل المطابقة', 'Match analysis')}</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-[#dfe1dd] p-4">
                        <p className="text-xs font-bold text-[#0e0f0c]">{t('مهارات متطابقة', 'Matched skills')}</p>
                        <p className="mt-2 break-words text-xs leading-6 text-[#5b5e5a]">{selectedJob.matchedSkills.length > 0 ? selectedJob.matchedSkills.join(isRTL ? '، ' : ', ') : t('لا توجد بيانات', 'No data')}</p>
                      </div>
                      <div className="rounded-xl border border-[#dfe1dd] p-4">
                        <p className="text-xs font-bold text-[#0e0f0c]">{t('مهارات تحتاج إلى تطوير', 'Skills to develop')}</p>
                        <p className="mt-2 break-words text-xs leading-6 text-[#5b5e5a]">{selectedJob.missingSkills.length > 0 ? selectedJob.missingSkills.join(isRTL ? '، ' : ', ') : t('لا توجد فجوات مسجلة', 'No recorded gaps')}</p>
                      </div>
                    </div>
                  </section>
                )}

                {selectedJob.benefits.length > 0 && (
                  <section>
                    <h3 className="text-sm font-bold text-[#0e0f0c]">{t('المزايا', 'Benefits')}</h3>
                    <ul className="mt-2 grid gap-2 text-sm text-[#5b5e5a] sm:grid-cols-2">
                      {selectedJob.benefits.map((benefit) => <li key={benefit} className="flex items-start gap-2"><CheckCircle2 size={15} className="mt-0.5 flex-none text-[#1ba442]" aria-hidden="true" /><span className="break-words">{localizedMapValue(benefit, BENEFIT_LABELS) || benefit}</span></li>)}
                    </ul>
                  </section>
                )}

                {selectedJob.companyWebsite && (
                  <section className="border-t border-[#f0f1ee] pt-5">
                    <a href={selectedJob.companyWebsite} target="_blank" rel="noreferrer" className="inline-flex min-h-11 max-w-full items-center gap-2 break-all rounded-full border border-[#dfe1dd] px-4 text-xs font-semibold text-[#0e0f0c] transition-colors hover:bg-[#f0f1ee] focus:outline-none focus:ring-2 focus:ring-[#9fe870]">
                      <Globe2 size={15} className="flex-none" aria-hidden="true" />
                      <span className="truncate">{t('زيارة موقع الشركة', 'Visit company website')}</span>
                    </a>
                  </section>
                )}
              </div>

              <div className="flex flex-none flex-col-reverse gap-2 border-t border-[#dfe1dd] bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button type="button" onClick={() => setSelectedJob(null)} className="min-h-11 rounded-full border border-[#dfe1dd] px-5 text-sm font-semibold text-[#5b5e5a] hover:bg-[#f0f1ee]">{t('إغلاق', 'Close')}</button>
                <button type="button" onClick={() => handleApply(selectedJob.id)} disabled={applyMutation.isPending || Boolean(selectedJob.applicationId) || !selectedJob.canApply} className={cn('inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-bold disabled:cursor-not-allowed', selectedJob.applicationId ? 'bg-[#E7FDD8] text-[#1ba442]' : selectedJob.canApply ? 'bg-[#9fe870] text-[#0e0f0c]' : 'bg-[#f0f1ee] text-[#828782]')}>
                  {applyMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : selectedJob.applicationId ? <CheckCircle2 size={15} /> : <Send size={15} />}
                  {selectedJob.applicationId ? applicationStatusLabel(selectedJob.applicationStatus) : selectedJob.canApply ? t('تقديم الآن', 'Apply now') : t('التقديم غير متاح', 'Unavailable')}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PortalLayout>
  );
}
