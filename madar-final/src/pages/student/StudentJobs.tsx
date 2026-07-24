import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import PortalLayout from '@/components/PortalLayout';
import MatchScoreRing from '@/components/MatchScoreRing';
import { jobs } from '@/data/student';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Search, Bookmark, BookmarkCheck, Send, ChevronDown, ChevronLeft, ChevronRight,
  SlidersHorizontal, MapPin, Briefcase, DollarSign, Clock,
} from 'lucide-react';

const experienceLevels = [
  { ar: 'مبتدئ (0-1)', en: 'Entry-level (0-1)' },
  { ar: 'جونيور (1-3)', en: 'Junior (1-3)' },
  { ar: 'متوسط (3-5)', en: 'Mid-level (3-5)' },
  { ar: 'senior (5+)', en: 'Senior (5+)' },
];

const jobTypes = [
  { ar: 'دوام كامل', en: 'Full-time' },
  { ar: 'دوام جزئي', en: 'Part-time' },
  { ar: 'عقد', en: 'Contract' },
  { ar: 'تدريب', en: 'Internship' },
];

const locations = [
  { ar: 'الرياض', en: 'Riyadh' },
  { ar: 'جدة', en: 'Jeddah' },
  { ar: 'الدمام', en: 'Dhahran' },
  { ar: 'مكة', en: 'Makkah' },
  { ar: 'عن بعد', en: 'Remote' },
];

const allSkills = ['React', 'TypeScript', 'Node.js', 'Python', 'Docker', 'AWS', 'Flutter', 'SQL', 'MongoDB', 'TensorFlow', 'PostgreSQL', 'Firebase'];

export default function StudentJobs() {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set(jobs.filter(j => j.bookmarked).map(j => j.id)));
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState({
    jobType: true,
    experience: true,
    location: true,
    salary: true,
    matchScore: true,
    skills: true,
    postedDate: false,
  });

  // Filter states
  const [selectedJobTypes, setSelectedJobTypes] = useState<Set<string>>(new Set());
  const [selectedExperience, setSelectedExperience] = useState<Set<string>>(new Set());
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set());
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [minSalary, setMinSalary] = useState(0);
  const [maxSalary, setMaxSalary] = useState(50000);
  const [minMatch, setMinMatch] = useState(0);
  const [sortBy, setSortBy] = useState<'match' | 'recent' | 'salary'>('match');

  const perPage = 6;

  const toggleSet = <T,>(set: Set<T>, value: T) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const toggleFilter = (section: keyof typeof filtersOpen) => {
    setFiltersOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredJobs = useMemo(() => {
    let list = [...jobs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(j =>
        j.titleEn.toLowerCase().includes(q) || j.titleAr.includes(q) ||
        j.companyEn.toLowerCase().includes(q) || j.companyAr.includes(q)
      );
    }
    if (selectedJobTypes.size > 0) list = list.filter(j => selectedJobTypes.has(j.type));
    if (selectedExperience.size > 0) list = list.filter(j => selectedExperience.has(j.experienceLevel));
    if (selectedLocations.size > 0) list = list.filter(j => selectedLocations.has(isRTL ? j.locationAr : j.locationEn));
    if (selectedSkills.size > 0) list = list.filter(j => j.skills.some(s => selectedSkills.has(s)));
    list = list.filter(j => j.salaryMin >= minSalary && j.salaryMax <= maxSalary);
    list = list.filter(j => j.matchScore >= minMatch);

    if (sortBy === 'match') list.sort((a, b) => b.matchScore - a.matchScore);
    else if (sortBy === 'recent') list.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
    else if (sortBy === 'salary') list.sort((a, b) => b.salaryMax - a.salaryMax);

    return list;
  }, [searchQuery, selectedJobTypes, selectedExperience, selectedLocations, selectedSkills, minSalary, maxSalary, minMatch, sortBy, isRTL]);

  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / perPage));
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * perPage, currentPage * perPage);

  const toggleBookmark = (id: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const locationTypeIcon = (type: string) => {
    if (type === 'remote') return <span className="text-[10px] font-semibold rounded px-1.5 py-0.5" style={{ background: '#E7FDD8', color: '#1ba442' }}>{t('عن بعد', 'Remote')}</span>;
    if (type === 'hybrid') return <span className="text-[10px] font-semibold rounded px-1.5 py-0.5" style={{ background: '#FEF3C7', color: '#B45309' }}>{t('هجين', 'Hybrid')}</span>;
    return <span className="text-[10px] font-semibold rounded px-1.5 py-0.5" style={{ background: '#DBEAFE', color: '#1D4ED8' }}>{t('حضوري', 'Onsite')}</span>;
  };

  const FilterSection = ({ title, section, children }: { title: string; section: keyof typeof filtersOpen; children: React.ReactNode }) => (
    <div className="border-b border-[#dfe1dd] pb-3">
      <button onClick={() => toggleFilter(section)} className="flex w-full items-center justify-between py-2">
        <span className="text-sm font-bold text-[#0e0f0c]">{title}</span>
        <ChevronDown size={16} className={cn("transition-transform", !filtersOpen[section] && "-rotate-180")} style={{ color: '#828782' }} />
      </button>
      {filtersOpen[section] && <div className="mt-1 flex flex-col gap-1.5">{children}</div>}
    </div>
  );

  const CheckboxItem = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <label className="flex cursor-pointer items-center gap-2 py-1">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded border-[#dfe1dd] text-[#9fe870] accent-[#9fe870]" />
      <span className="text-xs font-semibold text-[#5b5e5a]">{label}</span>
    </label>
  );

  return (
    <PortalLayout title={t('الوظائف', 'Jobs')}>
      <div className={cn("space-y-5", isRTL ? "rtl" : "ltr")}>
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

        <div className="flex flex-col gap-5 lg:flex-row">
          {/* Filter Sidebar */}
          <div className="w-full flex-shrink-0 space-y-4 lg:w-[260px]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} style={{ color: '#5b5e5a' }} />
              <span className="text-sm font-bold text-[#0e0f0c]">{t('التصفية', 'Filters')}</span>
            </div>

            <FilterSection title={t('نوع الوظيفة', 'Job Type')} section="jobType">
              {jobTypes.map((jt, i) => (
                <CheckboxItem key={i} label={isRTL ? jt.ar : jt.en} checked={selectedJobTypes.has(isRTL ? jt.ar : jt.en)} onChange={() => { setSelectedJobTypes(toggleSet(selectedJobTypes, isRTL ? jt.ar : jt.en)); setCurrentPage(1); }} />
              ))}
            </FilterSection>

            <FilterSection title={t('المستوى', 'Experience Level')} section="experience">
              {experienceLevels.map((el, i) => (
                <CheckboxItem key={i} label={isRTL ? el.ar : el.en} checked={selectedExperience.has(isRTL ? el.ar : el.en)} onChange={() => { setSelectedExperience(toggleSet(selectedExperience, isRTL ? el.ar : el.en)); setCurrentPage(1); }} />
              ))}
            </FilterSection>

            <FilterSection title={t('الموقع', 'Location')} section="location">
              {locations.map((loc, i) => (
                <CheckboxItem key={i} label={isRTL ? loc.ar : loc.en} checked={selectedLocations.has(isRTL ? loc.ar : loc.en)} onChange={() => { setSelectedLocations(toggleSet(selectedLocations, isRTL ? loc.ar : loc.en)); setCurrentPage(1); }} />
              ))}
            </FilterSection>

            <FilterSection title={t('الراتب', 'Salary Range')} section="salary">
              <div className="flex items-center gap-2 px-1">
                <input type="range" min={0} max={50000} step={1000} value={maxSalary} onChange={(e) => { setMaxSalary(Number(e.target.value)); setCurrentPage(1); }} className="w-full accent-[#9fe870]" />
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold text-[#828782]">SAR {minSalary.toLocaleString()}</span>
                <span className="text-[10px] font-semibold text-[#828782]">SAR {maxSalary.toLocaleString()}</span>
              </div>
            </FilterSection>

            <FilterSection title={t('نسبة التطابق', 'Match Score')} section="matchScore">
              <div className="flex items-center gap-2 px-1">
                <input type="range" min={0} max={100} step={5} value={minMatch} onChange={(e) => { setMinMatch(Number(e.target.value)); setCurrentPage(1); }} className="w-full accent-[#9fe870]" />
              </div>
              <p className="px-1 text-[10px] font-semibold text-[#828782]">{t('الحد الأدنى:', 'Min:')} {minMatch}%</p>
            </FilterSection>

            <FilterSection title={t('المهارات', 'Skills')} section="skills">
              {allSkills.map((skill) => (
                <CheckboxItem key={skill} label={skill} checked={selectedSkills.has(skill)} onChange={() => { setSelectedSkills(toggleSet(selectedSkills, skill)); setCurrentPage(1); }} />
              ))}
            </FilterSection>
          </div>

          {/* Job Grid */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#5b5e5a]">
                {filteredJobs.length} {t('وظيفة', 'job')}{filteredJobs.length !== 1 ? (isRTL ? '' : 's') : ''}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#828782]">{t('ترتيب:', 'Sort:')}</span>
                {(['match', 'recent', 'salary'] as const).map((s) => (
                  <button key={s} onClick={() => setSortBy(s)} className={cn("rounded-full px-3 py-1 text-xs font-semibold transition-colors", sortBy === s ? "bg-[#9fe870] text-[#0e0f0c]" : "bg-[#f0f1ee] text-[#5b5e5a] hover:bg-[#ebede9]")}>
                    {s === 'match' ? t('التطابق', 'Match') : s === 'recent' ? t('الأحدث', 'Recent') : t('الراتب', 'Salary')}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Cards */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-4 xl:grid-cols-2"
            >
              {paginatedJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="rounded-3xl border border-[#dfe1dd] bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    {/* Company Logo Placeholder */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#f0f1ee]">
                      <Briefcase size={20} style={{ color: '#5b5e5a' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#0e0f0c] truncate">
                        {isRTL ? job.titleAr : job.titleEn}
                      </h3>
                      <p className="text-xs font-semibold text-[#5b5e5a] truncate">
                        {isRTL ? job.companyAr : job.companyEn}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-[#828782]">
                          <MapPin size={10} /> {isRTL ? job.locationAr : job.locationEn}
                        </span>
                        {locationTypeIcon(job.locationType)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <MatchScoreRing score={job.matchScore} size={64} strokeWidth={4} />
                      <button
                        onClick={() => toggleBookmark(job.id)}
                        className="rounded-full p-1.5 text-[#828782] hover:bg-[#f0f1ee] transition-colors"
                      >
                        {bookmarkedIds.has(job.id) ? <BookmarkCheck size={16} style={{ color: '#9fe870' }} /> : <Bookmark size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <span key={skill} className="rounded-full border border-[#dfe1dd] bg-[#f0f1ee] px-2.5 py-0.5 text-[10px] font-semibold text-[#5b5e5a]">
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-[#f0f1ee] pt-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs font-bold text-[#0e0f0c]">
                        <DollarSign size={12} style={{ color: '#1ba442' }} />
                        SAR {job.salaryMin.toLocaleString()} - {job.salaryMax.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#828782]">
                        <Clock size={10} />
                        {job.postedDate}
                      </span>
                    </div>
                    <button className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-[#0e0f0c] transition-all hover:scale-[1.02] hover:shadow-sm" style={{ background: '#9fe870' }}>
                      <Send size={12} />
                      {t('تقديم', 'Apply')}
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {paginatedJobs.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-[#dfe1dd] bg-white py-16">
                <Search size={40} style={{ color: '#dfe1dd' }} />
                <p className="mt-3 text-sm font-semibold text-[#828782]">{t('لا توجد وظائف مطابقة', 'No matching jobs found')}</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-[#dfe1dd] text-[#5b5e5a] disabled:opacity-40 hover:bg-[#f0f1ee] transition-colors"
                >
                  {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors",
                      currentPage === p ? "bg-[#9fe870] text-[#0e0f0c]" : "bg-white border border-[#dfe1dd] text-[#5b5e5a] hover:bg-[#f0f1ee]"
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
    </PortalLayout>
  );
}
