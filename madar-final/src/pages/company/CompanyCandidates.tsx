import { useState, useMemo } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import PortalLayout from '@/components/PortalLayout'
import ContentCard from '@/components/ContentCard'
import MatchScoreRing from '@/components/MatchScoreRing'
import StatusBadge from '@/components/StatusBadge'
import { candidates } from '@/data/company'
import { cn } from '@/lib/utils'
import {
  Search,
  Download,
  LayoutGrid,
  List,
  RefreshCw,
  GraduationCap,
  BookOpen,
  Briefcase,
  Eye,
  CheckCircle2,
  XCircle,
  Mail,
  Calendar,
  X,
  SlidersHorizontal,
  Clock,
  MapPin,
  Languages,
  Award,
} from 'lucide-react'

const allSkills = Array.from(new Set(candidates.flatMap((c) => c.skills)))
const allUniversities = Array.from(new Set(candidates.map((c) => c.university)))

const statusVariantMap: Record<string, 'new' | 'in-review' | 'interview' | 'accepted' | 'rejected'> = {
  new: 'new',
  'in-review': 'in-review',
  interview: 'interview',
  accepted: 'accepted',
  rejected: 'rejected',
}

export default function CompanyCandidates() {
  const { dir } = useLanguage()
  const isRTL = dir === 'rtl'
  const t = (ar: string, en: string) => (isRTL ? ar : en)

  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<typeof candidates[0] | null>(null)

  // Filter states
  const [matchScoreMin, setMatchScoreMin] = useState(50)
  const [matchScoreMax, setMatchScoreMax] = useState(100)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([])
  const [gpaMin, setGpaMin] = useState(0)
  const [gpaMax, setGpaMax] = useState(5)
  const [expMin, setExpMin] = useState(0)
  const [expMax, setExpMax] = useState(10)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const toggleSkill = (s: string) =>
    setSelectedSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  const toggleUniversity = (u: string) =>
    setSelectedUniversities((prev) => (prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]))
  const toggleStatus = (s: string) =>
    setSelectedStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const resetFilters = () => {
    setMatchScoreMin(50)
    setMatchScoreMax(100)
    setSelectedSkills([])
    setSelectedUniversities([])
    setGpaMin(0)
    setGpaMax(5)
    setExpMin(0)
    setExpMax(10)
    setSelectedStatuses([])
    setSearch('')
  }

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (search) {
        const q = search.toLowerCase()
        const nameMatch = c.name.toLowerCase().includes(q) || c.nameAr.includes(q)
        const skillMatch = c.skills.some((s) => s.toLowerCase().includes(q))
        const uniMatch = c.university.toLowerCase().includes(q) || c.universityAr.includes(q)
        if (!nameMatch && !skillMatch && !uniMatch) return false
      }
      if (c.matchScore < matchScoreMin || c.matchScore > matchScoreMax) return false
      if (selectedSkills.length && !selectedSkills.some((s) => c.skills.includes(s))) return false
      if (selectedUniversities.length && !selectedUniversities.includes(c.university)) return false
      if (c.gpa < gpaMin || c.gpa > gpaMax) return false
      if (c.experience < expMin || c.experience > expMax) return false
      if (selectedStatuses.length && !selectedStatuses.includes(c.status)) return false
      return true
    })
  }, [search, matchScoreMin, matchScoreMax, selectedSkills, selectedUniversities, gpaMin, gpaMax, expMin, expMax, selectedStatuses])

  return (
    <PortalLayout title="Candidates" titleAr="المرشحين">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-[#0e0f0c]">{t('الباحثين عن عمل', 'Candidates')}</h2>
            <p className="mt-1 text-base font-semibold text-[#5b5e5a]">
              {filtered.length} {t('مرشح', 'candidate')}{filtered.length !== 1 ? (isRTL ? '' : 's') : ''}
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-4 py-2 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#f0f1ee]">
            <Download size={16} />
            {t('تصدير', 'Export')}
          </button>
        </div>

        {/* Search + Actions */}
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#828782]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('ابحث بالاسم، المهارة، أو الجامعة...', 'Search by name, skill, or university...')}
              className="h-12 w-full rounded-full border border-[#dfe1dd] bg-white pl-12 pr-6 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'inline-flex h-12 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all lg:hidden',
              showFilters ? 'border-[#9fe870] bg-[#f4fcf0] text-[#0e0f0c]' : 'border-[#dfe1dd] bg-white text-[#5b5e5a]'
            )}
          >
            <SlidersHorizontal size={16} />
            {t('الفلاتر', 'Filters')}
          </button>
          <div className="inline-flex items-center rounded-full border border-[#dfe1dd] bg-[#f0f1ee] p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-full p-2 transition-all',
                viewMode === 'grid' ? 'bg-white text-[#0e0f0c] shadow-sm' : 'text-[#828782] hover:text-[#0e0f0c]'
              )}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-full p-2 transition-all',
                viewMode === 'list' ? 'bg-white text-[#0e0f0c] shadow-sm' : 'text-[#828782] hover:text-[#0e0f0c]'
              )}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-6">
        {/* Filter Sidebar - Desktop always, Mobile toggle */}
        <aside
          className={cn(
            'flex-shrink-0 lg:block',
            showFilters ? 'block' : 'hidden',
            'w-full lg:w-[280px]'
          )}
        >
          <ContentCard className="lg:sticky lg:top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0e0f0c]">{t('الفلاتر', 'Filters')}</h3>
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b5e5a] hover:text-[#0e0f0c]"
              >
                <RefreshCw size={14} />
                {t('إعادة ضبط', 'Reset')}
              </button>
            </div>

            <div className="flex flex-col gap-5">
              {/* Match Score */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                  {t('نطاق التطابق', 'Match Score')}: {matchScoreMin}% - {matchScoreMax}%
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={matchScoreMin}
                    onChange={(e) => setMatchScoreMin(Number(e.target.value))}
                    className="flex-1 accent-[#9fe870]"
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={matchScoreMax}
                    onChange={(e) => setMatchScoreMax(Number(e.target.value))}
                    className="flex-1 accent-[#9fe870]"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('المهارات', 'Skills')}</label>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-auto">
                  {allSkills.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSkill(s)}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold transition-all',
                        selectedSkills.includes(s)
                          ? 'bg-[#9fe870] text-[#0e0f0c]'
                          : 'bg-[#f0f1ee] text-[#5b5e5a] hover:bg-[#ebede9]'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* University */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('الجامعة', 'University')}</label>
                <div className="flex flex-col gap-1 max-h-[120px] overflow-auto">
                  {allUniversities.map((u) => (
                    <label key={u} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUniversities.includes(u)}
                        onChange={() => toggleUniversity(u)}
                        className="h-4 w-4 rounded border-[#dfe1dd] accent-[#9fe870]"
                      />
                      <span className="text-xs font-semibold text-[#5b5e5a]">{u}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* GPA */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                  {t('المعدل', 'GPA')}: {gpaMin} - {gpaMax}
                </label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={5} step={0.1} value={gpaMin} onChange={(e) => setGpaMin(Number(e.target.value))} className="flex-1 accent-[#9fe870]" />
                  <input type="range" min={0} max={5} step={0.1} value={gpaMax} onChange={(e) => setGpaMax(Number(e.target.value))} className="flex-1 accent-[#9fe870]" />
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                  {t('الخبرة (سنوات)', 'Experience (years)')}: {expMin} - {expMax}
                </label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={15} value={expMin} onChange={(e) => setExpMin(Number(e.target.value))} className="flex-1 accent-[#9fe870]" />
                  <input type="range" min={0} max={15} value={expMax} onChange={(e) => setExpMax(Number(e.target.value))} className="flex-1 accent-[#9fe870]" />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('الحالة', 'Status')}</label>
                <div className="flex flex-col gap-1.5">
                  {['new', 'in-review', 'interview', 'accepted', 'rejected'].map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStatuses.includes(s)}
                        onChange={() => toggleStatus(s)}
                        className="h-4 w-4 rounded border-[#dfe1dd] accent-[#9fe870]"
                      />
                      <span className="text-xs font-semibold text-[#5b5e5a]">
                        {s === 'new' && t('جديد', 'New')}
                        {s === 'in-review' && t('قيد المراجعة', 'In Review')}
                        {s === 'interview' && t('مقابلة', 'Interview')}
                        {s === 'accepted' && t('مقبول', 'Accepted')}
                        {s === 'rejected' && t('مرفوض', 'Rejected')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#9fe870] text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#80D34F] lg:hidden"
              >
                {t('تطبيق', 'Apply')}
              </button>
            </div>
          </ContentCard>
        </aside>

        {/* Candidates List */}
        <div className="flex-1 min-w-0">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCandidate(c)}
                  className="cursor-pointer rounded-[24px] border border-[#dfe1dd] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#9fe870] text-base font-bold text-[#0e0f0c]">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-bold text-[#0e0f0c]">{isRTL ? c.nameAr : c.name}</p>
                        <p className="text-xs text-[#5b5e5a]">{c.major}</p>
                      </div>
                    </div>
                    <MatchScoreRing score={c.matchScore} size={56} strokeWidth={3} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.skills.slice(0, 4).map((s) => (
                      <span key={s} className="rounded-full bg-[#f0f1ee] px-2.5 py-0.5 text-xs font-semibold text-[#5b5e5a]">
                        {s}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-[#828782]">
                    <span className="flex items-center gap-1"><GraduationCap size={12} /> {c.university}</span>
                    <span className="flex items-center gap-1"><Award size={12} /> GPA: {c.gpa}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-[#828782]">
                    <Briefcase size={12} />
                    {c.appliedJob}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge variant={statusVariantMap[c.status]}>
                      {c.status === 'new' && t('جديد', 'New')}
                      {c.status === 'in-review' && t('قيد المراجعة', 'In Review')}
                      {c.status === 'interview' && t('مقابلة', 'Interview')}
                      {c.status === 'accepted' && t('مقبول', 'Accepted')}
                      {c.status === 'rejected' && t('مرفوض', 'Rejected')}
                    </StatusBadge>
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedCandidate(c) }} className="rounded-full p-1.5 text-[#828782] hover:bg-[#f0f1ee] hover:text-[#0e0f0c]">
                        <Eye size={14} />
                      </button>
                      <button onClick={(e) => e.stopPropagation()} className="rounded-full p-1.5 text-[#828782] hover:bg-[#E7FDD8] hover:text-[#1ba442]">
                        <CheckCircle2 size={14} />
                      </button>
                      <button onClick={(e) => e.stopPropagation()} className="rounded-full p-1.5 text-[#828782] hover:bg-[#FEE2E2] hover:text-[#dc2626]">
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <ContentCard noPadding>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#dfe1dd] bg-[#f0f1ee]">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]">{t('المرشح', 'Candidate')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]">{t('الجامعة', 'University')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]">{t('التخصص', 'Major')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]">GPA</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]">{t('التطابق', 'Match')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]">{t('الحالة', 'Status')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCandidate(c)}
                        className="cursor-pointer border-b border-[#dfe1dd] transition-colors hover:bg-[#f0f1ee]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9fe870] text-xs font-bold text-[#0e0f0c]">
                              {c.name.charAt(0)}
                            </div>
                            <span className="text-sm font-semibold text-[#0e0f0c]">{isRTL ? c.nameAr : c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#5b5e5a]">{c.university}</td>
                        <td className="px-4 py-3 text-xs text-[#5b5e5a]">{c.major}</td>
                        <td className="px-4 py-3 text-xs font-bold text-[#9fe870]">{c.gpa}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-bold',
                            c.matchScore >= 80 ? 'bg-[#E7FDD8] text-[#1ba442]' :
                            c.matchScore >= 60 ? 'bg-[#DBEAFE] text-[#1D4ED8]' :
                            'bg-[#FEF3C7] text-[#B45309]'
                          )}>
                            {c.matchScore}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge variant={statusVariantMap[c.status]}>
                            {c.status === 'new' && t('جديد', 'New')}
                            {c.status === 'in-review' && t('قيد المراجعة', 'In Review')}
                            {c.status === 'interview' && t('مقابلة', 'Interview')}
                            {c.status === 'accepted' && t('مقبول', 'Accepted')}
                            {c.status === 'rejected' && t('مرفوض', 'Rejected')}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedCandidate(c) }} className="rounded-full p-1.5 text-[#828782] hover:bg-[#f0f1ee]">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ContentCard>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-[24px] border border-[#dfe1dd] bg-white p-12 text-center">
              <Search size={48} className="text-[#dfe1dd]" />
              <p className="mt-4 text-base font-semibold text-[#5b5e5a]">
                {t('لا توجد نتائج مطابقة', 'No matching candidates found')}
              </p>
              <button onClick={resetFilters} className="mt-3 text-sm font-semibold text-[#9fe870] hover:underline">
                {t('إعادة ضبط الفلاتر', 'Reset Filters')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Preview Drawer */}
      {selectedCandidate && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-[#0e0f0c]/30 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedCandidate(null)}
          />
          <div className="fixed top-0 right-0 z-[200] h-full w-full overflow-y-auto bg-white shadow-2xl sm:w-[480px]">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 border-b border-[#dfe1dd] bg-white px-6 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#9fe870] text-2xl font-bold text-[#0e0f0c]">
                    {selectedCandidate.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#0e0f0c]">
                      {isRTL ? selectedCandidate.nameAr : selectedCandidate.name}
                    </h3>
                    <p className="text-sm text-[#5b5e5a]">{selectedCandidate.major}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="rounded-full p-2 text-[#828782] hover:bg-[#f0f1ee] hover:text-[#0e0f0c]"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Match Score */}
            <div className="flex flex-col items-center gap-3 border-b border-[#dfe1dd] px-6 py-6">
              <MatchScoreRing score={selectedCandidate.matchScore} size={100} strokeWidth={6} />
              <p className="text-sm font-semibold text-[#5b5e5a]">
                {t('نسبة التطابق', 'Match Score')}
              </p>
            </div>

            {/* Profile Sections */}
            <div className="flex flex-col gap-5 px-6 py-6">
              {/* Personal Info */}
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#828782]">
                  {t('المعلومات الشخصية', 'Personal Info')}
                </h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail size={14} className="text-[#828782]" />
                    <span className="text-[#0e0f0c]">{selectedCandidate.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-[#828782]" />
                    <span className="text-[#0e0f0c]">{selectedCandidate.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Languages size={14} className="text-[#828782]" />
                    <span className="text-[#0e0f0c]">{selectedCandidate.languages.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Education */}
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#828782]">
                  {t('التعليم', 'Education')}
                </h4>
                <div className="flex flex-col gap-2 rounded-xl bg-[#f0f1ee] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#0e0f0c]">
                    <GraduationCap size={16} className="text-[#9fe870]" />
                    {selectedCandidate.university}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#5b5e5a]">
                    <BookOpen size={14} />
                    {selectedCandidate.major}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#828782]">
                    <span>GPA: {selectedCandidate.gpa}/5.00</span>
                    <span>{t('سنة التخرج', 'Grad Year')}: {selectedCandidate.graduationYear}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#828782]">
                  {t('المهارات', 'Skills')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((s) => (
                    <span key={s} className="rounded-full bg-[#E7FDD8] px-3 py-1 text-xs font-semibold text-[#0e0f0c]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#828782]">
                  {t('الخبرة', 'Experience')}
                </h4>
                <div className="flex items-center gap-2 rounded-xl bg-[#f0f1ee] p-4 text-sm font-semibold text-[#0e0f0c]">
                  <Clock size={16} className="text-[#9fe870]" />
                  {selectedCandidate.experience} {t('سنوات', 'years')}
                </div>
              </div>

              {/* Applied For */}
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#828782]">
                  {t('تقدم لـ', 'Applied For')}
                </h4>
                <div className="flex items-center gap-2 rounded-xl bg-[#f0f1ee] p-4 text-sm font-semibold text-[#0e0f0c]">
                  <Briefcase size={16} className="text-[#9fe870]" />
                  {selectedCandidate.appliedJob}
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#828782]">
                  {t('حالة الطلب', 'Application Status')}
                </h4>
                <StatusBadge variant={statusVariantMap[selectedCandidate.status]}>
                  {selectedCandidate.status === 'new' && t('جديد', 'New')}
                  {selectedCandidate.status === 'in-review' && t('قيد المراجعة', 'In Review')}
                  {selectedCandidate.status === 'interview' && t('مقابلة', 'Interview')}
                  {selectedCandidate.status === 'accepted' && t('مقبول', 'Accepted')}
                  {selectedCandidate.status === 'rejected' && t('مرفوض', 'Rejected')}
                </StatusBadge>
              </div>
            </div>

            {/* Action Bar */}
            <div className="sticky bottom-0 border-t border-[#dfe1dd] bg-white px-6 py-4">
              <div className="grid grid-cols-2 gap-2">
                <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#80D34F]">
                  <CheckCircle2 size={16} />
                  {t('قبول', 'Shortlist')}
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-4 py-3 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#f0f1ee]">
                  <Calendar size={16} />
                  {t('مقابلة', 'Interview')}
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[#FEE2E2] bg-[#FEE2E2] px-4 py-3 text-sm font-semibold text-[#dc2626] transition-all hover:bg-[#fecaca]">
                  <XCircle size={16} />
                  {t('رفض', 'Reject')}
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-4 py-3 text-sm font-semibold text-[#5b5e5a] transition-all hover:bg-[#f0f1ee]">
                  <Mail size={16} />
                  {t('رسالة', 'Message')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </PortalLayout>
  )
}
