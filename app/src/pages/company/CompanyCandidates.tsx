/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import PortalLayout from '@/components/PortalLayout'
import ContentCard from '@/components/ContentCard'
import MatchScoreRing from '@/components/MatchScoreRing'
import StatusBadge from '@/components/StatusBadge'
import { useCandidates, useCompanyApplications, useUpdateApplicationStatus, useForceMatchCheck, useCompanyJobs } from '@/hooks/useCompany'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
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
  Phone,
  MessageCircle,
  Linkedin,
  Github,
  Globe,
  Calendar,
  X,
  SlidersHorizontal,
  Clock,
  MapPin,
  Languages,
  Award,
  Loader2,
} from 'lucide-react'

const statusVariantMap: Record<string, 'new' | 'in-review' | 'interview' | 'accepted' | 'rejected'> = {
  new: 'new',
  'in-review': 'in-review',
  interview: 'interview',
  accepted: 'accepted',
  rejected: 'rejected',
}

const candidateArByEnglish: Record<string, string> = {
  Candidates: 'المرشحون',
  candidate: 'مرشح',
  Export: 'تصدير',
  'Search by name, skill, or university...': 'ابحث بالاسم، المهارة، أو الجامعة...',
  Filters: 'الفلاتر',
  Reset: 'إعادة ضبط',
  'Match Score': 'نسبة التطابق',
  Skills: 'المهارات',
  University: 'الجامعة',
  GPA: 'المعدل',
  'Experience (years)': 'الخبرة (سنوات)',
  Status: 'الحالة',
  New: 'جديد',
  'In Review': 'قيد المراجعة',
  Interview: 'مقابلة',
  Accepted: 'مقبول',
  Rejected: 'مرفوض',
  Apply: 'تطبيق',
  Candidate: 'المرشح',
  Major: 'التخصص',
  Match: 'التطابق',
  'No matching candidates found': 'لا توجد نتائج مطابقة',
  'Reset Filters': 'إعادة ضبط الفلاتر',
  Email: 'البريد الإلكتروني',
  Phone: 'الهاتف',
  Website: 'الموقع',
  years: 'سنوات',
  Acceptance: 'احتمالية القبول',
  'Personal Info': 'المعلومات الشخصية',
  Education: 'التعليم',
  'Grad Year': 'سنة التخرج',
  Experience: 'الخبرة',
  'Applied For': 'تقدم لـ',
  'Application Status': 'حالة الطلب',
  Shortlist: 'قبول',
  Reject: 'رفض',
  Message: 'رسالة',
  'No application is linked to this candidate': 'لا يوجد طلب تقديم مرتبط بهذا المرشح',
  'Status updated successfully': 'تم تحديث الحالة',
  'Failed to update': 'فشل التحديث',
}

function LoadingSpinner() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#9fe870]" />
    </div>
  )
}

const getSkillName = (skill: any): string => {
  if (typeof skill === 'string') return skill
  return skill?.name || skill?.skill || skill?.title || ''
}

const getCandidateName = (candidate: any, isRTL: boolean): string =>
  (isRTL ? candidate.nameAr : candidate.name) || candidate.name || candidate.email || 'Candidate'

const normalizeUrl = (url?: string): string => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

function ContactIconButton({
  href,
  title,
  children,
}: {
  href?: string
  title: string
  children: ReactNode
}) {
  if (!href) return null
  return (
    <a
      href={href}
      title={title}
      aria-label={title}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noreferrer' : undefined}
      onClick={(event) => event.stopPropagation()}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe1dd] bg-white text-[#5b5e5a] transition-all hover:border-[#9fe870] hover:bg-[#f4fcf0] hover:text-[#0e0f0c] focus:outline-none focus:ring-2 focus:ring-[#9fe870]"
    >
      {children}
    </a>
  )
}

export default function CompanyCandidates() {
  const { dir } = useLanguage()
  const isRTL = dir === 'rtl'
  const t = (_ar: string, en: string) => (isRTL ? candidateArByEnglish[en] || _ar : en)

  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)

  // Filter states
  const [matchScoreMin, setMatchScoreMin] = useState(0)
  const [matchScoreMax, setMatchScoreMax] = useState(100)
  const [selectedJobs, setSelectedJobs] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([])
  const [gpaMin, setGpaMin] = useState(0)
  const [gpaMax, setGpaMax] = useState(5)
  const [expMin, setExpMin] = useState(0)
  const [expMax, setExpMax] = useState(10)
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const [searchParams] = useState<Record<string, unknown>>({})
  const { data: candidatesData, isLoading } = useCandidates(searchParams)
  const { data: applicationsData, isLoading: applicationsLoading } = useCompanyApplications({ limit: 50 })
  const { data: jobsData } = useCompanyJobs({ limit: 100 })
  const updateStatusMutation = useUpdateApplicationStatus()
  const forceMatchMutation = useForceMatchCheck()
  const [selectedMatchJobId, setSelectedMatchJobId] = useState<string>('')

  const candidates = useMemo(() => {
    const recommendedByStudent = new Map<string, any>()
    for (const candidate of candidatesData?.data ?? []) {
      recommendedByStudent.set(String((candidate as any).id), candidate)
    }

    const applicantStudentIds = new Set<string>()
    const applicants = (applicationsData?.items ?? []).flatMap((application) => {
      const item = application as any
      const studentId = String(item.student?.id || item.studentId || '')
      const applicationId = String(item.id || item._id || '')
      if (!studentId || !applicationId) return []

      applicantStudentIds.add(studentId)
      const existing = recommendedByStudent.get(studentId) || {}
      const rawStatus = String(item.status || 'submitted')
      const status = ['accepted', 'confirmed_employed'].includes(rawStatus)
        ? 'accepted'
        : rawStatus === 'rejected'
          ? 'rejected'
        : ['interview_scheduled', 'interviewed'].includes(rawStatus)
          ? 'interview'
          : ['screening', 'under_review', 'shortlisted', 'offer_pending', 'offered'].includes(rawStatus)
            ? 'in-review'
            : 'new'

      const applicationSkills = Array.isArray(item.student?.skills)
        ? item.student.skills
        : existing.skills || []

      return [{
        ...existing,
        id: `application:${applicationId}`,
        studentId,
        applicationId,
        name: item.student?.name || existing.name || '',
        university: item.student?.university || existing.university || '',
        college: item.student?.college || existing.college || '',
        department: item.student?.department || existing.department || '',
        major: item.student?.department || existing.major || '',
        gpa: item.student?.gpa ?? existing.gpa,
        skills: applicationSkills,
        readinessScore: item.student?.readinessScore ?? existing.readinessScore ?? 0,
        matchScore: Math.round(item.matchScore || item.matchSnapshot?.matchScore || existing.matchScore || 0),
        acceptanceProbability: Math.round((item.acceptanceProbability ?? existing.acceptanceProbability ?? 0) * 10) / 10,
        status,
        appliedJob: item.job?.titleAr || item.job?.title || existing.appliedJob || '',
        appliedFor: item.job?.titleAr || item.job?.title || existing.appliedFor || '',
        jobId: item.job?.id || item.job?._id || item.jobId || existing.jobId || '',
        appliedDate: item.appliedAt || existing.appliedDate,
        coverLetter: item.coverLetter || '',
      }]
    })

    const recommendations = [...recommendedByStudent.entries()]
      .filter(([studentId]) => !applicantStudentIds.has(studentId))
      .map(([, candidate]) => candidate)

    applicants.sort((left, right) => {
      const dateDifference = new Date(right.appliedDate || 0).getTime() - new Date(left.appliedDate || 0).getTime()
      return dateDifference || (right.matchScore || 0) - (left.matchScore || 0)
    })
    recommendations.sort((left, right) => (right.matchScore || 0) - (left.matchScore || 0))

    return [...applicants, ...recommendations]
  }, [applicationsData?.items, candidatesData?.data])

  const allJobs = Array.from(new Set(candidates.map((c: any) => c.appliedJob || c.appliedFor).filter(Boolean)))
  const allSkills = Array.from(new Set(candidates.flatMap((c: any) => (c.skills ?? []).map(getSkillName).filter(Boolean))))
  const allUniversities = Array.from(new Set(candidates.map((c: any) => c.university ?? '').filter(Boolean)))

  const toggleJob = (j: string) =>
    setSelectedJobs((prev) => (prev.includes(j) ? prev.filter((x) => x !== j) : [...prev, j]))
  const toggleSkill = (s: string) =>
    setSelectedSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  const toggleUniversity = (u: string) =>
    setSelectedUniversities((prev) => (prev.includes(u) ? prev.filter((x) => x !== u) : [...prev, u]))
  const toggleStatus = (s: string) =>
    setSelectedStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const resetFilters = () => {
    setMatchScoreMin(0)
    setMatchScoreMax(100)
    setSelectedJobs([])
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
    return (candidates as any[]).filter((c: any) => {
      if (search) {
        const q = search.toLowerCase()
        const nameMatch = (c.name ?? '').toLowerCase().includes(q) || (c.nameAr ?? '').includes(q)
        const skillMatch = (c.skills ?? []).some((s: any) => getSkillName(s).toLowerCase().includes(q))
        const uniMatch = (c.university ?? '').toLowerCase().includes(q) || (c.universityAr ?? '').includes(q)
        if (!nameMatch && !skillMatch && !uniMatch) return false
      }
      if ((c.matchScore ?? 0) < matchScoreMin || (c.matchScore ?? 0) > matchScoreMax) return false
      if (selectedJobs.length && !selectedJobs.includes(c.appliedJob || c.appliedFor)) return false
      if (selectedSkills.length && !selectedSkills.some((s) => (c.skills ?? []).map(getSkillName).includes(s))) return false
      if (selectedUniversities.length && !selectedUniversities.includes(c.university)) return false
      if ((c.gpa ?? 0) < gpaMin || (c.gpa ?? 0) > gpaMax) return false
      if ((c.experience ?? 0) < expMin || (c.experience ?? 0) > expMax) return false
      if (selectedStatuses.length && !selectedStatuses.includes(c.status)) return false
      return true
    })
  }, [search, matchScoreMin, matchScoreMax, selectedJobs, selectedSkills, selectedUniversities, gpaMin, gpaMax, expMin, expMax, selectedStatuses, candidates])

  const handleStatusChange = async (appId: string | undefined, status: string) => {
    if (!appId) {
      toast.error(t('لا يوجد طلب تقديم مرتبط بهذا المرشح', 'No application is linked to this candidate'))
      return
    }
    try {
      await updateStatusMutation.mutateAsync({ id: appId, status })
      setSelectedCandidate((current: any) => current?.applicationId === appId ? { ...current, status } : current)
      toast.success(t('تم تحديث الحالة', 'Status updated successfully'))
    } catch {
      toast.error(t('فشل التحديث', 'Failed to update'))
    }
  }

  const handleForceMatch = async () => {
    const targetJobId = selectedMatchJobId || selectedCandidate?.jobId;
    if (!targetJobId) {
      toast.error(t('الرجاء اختيار وظيفة للمطابقة', 'Please select a job for matching'))
      return
    }
    try {
      await forceMatchMutation.mutateAsync({ 
        jobId: targetJobId, 
        studentId: selectedCandidate.studentId || selectedCandidate.id 
      })
      toast.success(t('تم طلب التحديث، ستظهر النتيجة خلال ثوانٍ...', 'Match check requested — score will refresh in a few seconds...'))
    } catch {
      toast.error(t('تعذر طلب التحديث', 'Failed to request match check'))
    }
  }

  // Sync selectedCandidate with refreshed data so the panel reflects updated scores
  useEffect(() => {
    if (!selectedCandidate) return
    const key = selectedCandidate.applicationId
      ? `application:${selectedCandidate.applicationId}`
      : selectedCandidate.id
    const updated = candidates.find((c: any) => c.id === key || c.id === selectedCandidate.id)
    if (updated && updated.matchScore !== selectedCandidate.matchScore) {
      setSelectedCandidate({ ...selectedCandidate, ...updated })
    }
  }, [candidates]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading || applicationsLoading) return <LoadingSpinner />

  return (
    <PortalLayout title="Candidates">
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
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={matchScoreMin}
                    onChange={(e) => setMatchScoreMin(Number(e.target.value))}
                    className="w-full min-w-0 accent-[#9fe870]"
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={matchScoreMax}
                    onChange={(e) => setMatchScoreMax(Number(e.target.value))}
                    className="w-full min-w-0 accent-[#9fe870]"
                  />
                </div>
              </div>

              {/* Jobs */}
              {allJobs.length > 0 && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('الوظيفة', 'Job')}</label>
                  <div className="flex flex-col gap-2 max-h-[120px] overflow-auto">
                    {allJobs.map((j) => (
                      <label key={j as string} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedJobs.includes(j as string)}
                          onChange={() => toggleJob(j as string)}
                          className="rounded border-[#dfe1dd] text-[#9fe870] focus:ring-[#9fe870]"
                        />
                        <span className="text-sm text-[#0e0f0c]">{j as string}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {allSkills.length > 0 && (
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
              )}

              {/* University */}
              {allUniversities.length > 0 && (
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
              )}

              {/* GPA */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                  {t('المعدل', 'GPA')}: {gpaMin} - {gpaMax}
                </label>
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                  <input type="range" min={0} max={5} step={0.1} value={gpaMin} onChange={(e) => setGpaMin(Number(e.target.value))} className="w-full min-w-0 accent-[#9fe870]" />
                  <input type="range" min={0} max={5} step={0.1} value={gpaMax} onChange={(e) => setGpaMax(Number(e.target.value))} className="w-full min-w-0 accent-[#9fe870]" />
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                  {t('الخبرة (سنوات)', 'Experience (years)')}: {expMin} - {expMax}
                </label>
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                  <input type="range" min={0} max={15} value={expMin} onChange={(e) => setExpMin(Number(e.target.value))} className="w-full min-w-0 accent-[#9fe870]" />
                  <input type="range" min={0} max={15} value={expMax} onChange={(e) => setExpMax(Number(e.target.value))} className="w-full min-w-0 accent-[#9fe870]" />
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
              {filtered.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCandidate(c)}
                  className="cursor-pointer rounded-[24px] border border-[#dfe1dd] bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={getCandidateName(c, isRTL)} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#9fe870] text-base font-bold text-[#0e0f0c]">
                          {getCandidateName(c, isRTL).charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-base font-bold text-[#0e0f0c]">{getCandidateName(c, isRTL)}</p>
                        <p className="text-xs text-[#5b5e5a]">{c.major || c.department || c.academicLevel}</p>
                      </div>
                    </div>
                    <MatchScoreRing score={Math.round(c.matchScore ?? 0)} size={56} strokeWidth={3} />
                  </div>
                  {/* Job name tag */}
                  <div className="mt-3 flex items-center gap-1.5">
                    <Briefcase size={13} className="text-[#828782] flex-shrink-0" />
                    {(c.appliedJob || c.appliedFor) ? (
                      <span className="inline-flex items-center rounded-full bg-[#DBEAFE] px-2.5 py-0.5 text-xs font-semibold text-[#1D4ED8]">
                        {c.appliedJob || c.appliedFor}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#f0f1ee] px-2.5 py-0.5 text-xs font-semibold text-[#828782]">
                        {t('بدون طلب', 'No Application')}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(c.skills ?? []).slice(0, 4).map((s: any, index: number) => (
                      <span key={`${getSkillName(s)}-${index}`} className="rounded-full bg-[#f0f1ee] px-2.5 py-0.5 text-xs font-semibold text-[#5b5e5a]">
                        {getSkillName(s)}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#828782]">
                    <span className="flex items-center gap-1"><GraduationCap size={12} /> {c.university}</span>
                    <span className="flex items-center gap-1"><Award size={12} /> GPA: {c.gpa}</span>
                    <span className="flex items-center gap-1"><Briefcase size={12} /> {c.experience ?? 0} {t('سنوات', 'years')}</span>
                    {c.location && <span className="flex items-center gap-1"><MapPin size={12} /> {c.location}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <ContactIconButton href={c.email ? `mailto:${c.email}` : ''} title={t('البريد الإلكتروني', 'Email')}>
                      <Mail size={18} />
                    </ContactIconButton>
                    <ContactIconButton href={c.phone ? `tel:${c.phone}` : ''} title={t('الهاتف', 'Phone')}>
                      <Phone size={18} />
                    </ContactIconButton>
                    <ContactIconButton href={c.phone ? `https://wa.me/${String(c.phone).replace(/\D/g, '')}` : ''} title="WhatsApp">
                      <MessageCircle size={18} />
                    </ContactIconButton>
                    <ContactIconButton href={normalizeUrl(c.linkedIn)} title="LinkedIn">
                      <Linkedin size={18} />
                    </ContactIconButton>
                    <ContactIconButton href={normalizeUrl(c.github)} title="GitHub">
                      <Github size={18} />
                    </ContactIconButton>
                    <ContactIconButton href={normalizeUrl(c.portfolio || c.website)} title={t('الموقع', 'Website')}>
                      <Globe size={18} />
                    </ContactIconButton>
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#f0f1ee] px-3 py-2 text-xs font-semibold text-[#5b5e5a]">
                    <span>{t('احتمالية القبول', 'Acceptance')}</span>
                    <span className="text-[#0e0f0c]">{c.acceptanceProbability ?? 0}%</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <StatusBadge variant={statusVariantMap[c.status] ?? 'new'}>
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
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(c.applicationId, 'accepted') }}
                        disabled={updateStatusMutation.isPending}
                        className="rounded-full p-1.5 text-[#828782] hover:bg-[#E7FDD8] hover:text-[#1ba442] disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(c.applicationId, 'rejected') }}
                        disabled={updateStatusMutation.isPending}
                        className="rounded-full p-1.5 text-[#828782] hover:bg-[#FEE2E2] hover:text-[#dc2626] disabled:opacity-50"
                      >
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
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]">{t('الوظيفة', 'Job')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]">{t('الجامعة', 'University')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]">{t('التخصص', 'Major')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]">GPA</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]">{t('التطابق', 'Match')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]">{t('الحالة', 'Status')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5b5e5a]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c: any) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCandidate(c)}
                        className="cursor-pointer border-b border-[#dfe1dd] transition-colors hover:bg-[#f0f1ee]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {c.avatarUrl ? (
                              <img src={c.avatarUrl} alt={getCandidateName(c, isRTL)} className="h-8 w-8 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9fe870] text-xs font-bold text-[#0e0f0c]">
                                {getCandidateName(c, isRTL).charAt(0)}
                              </div>
                            )}
                            <span className="text-sm font-semibold text-[#0e0f0c]">{getCandidateName(c, isRTL)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {(c.appliedJob || c.appliedFor) ? (
                            <span className="inline-flex rounded-full bg-[#DBEAFE] px-2 py-0.5 text-xs font-semibold text-[#1D4ED8] max-w-[140px] truncate">
                              {c.appliedJob || c.appliedFor}
                            </span>
                          ) : (
                            <span className="text-xs text-[#828782]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#5b5e5a]">{c.university}</td>
                        <td className="px-4 py-3 text-xs text-[#5b5e5a]">{c.major}</td>
                        <td className="px-4 py-3 text-xs font-bold text-[#9fe870]">{c.gpa}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-bold',
                            (c.matchScore ?? 0) >= 80 ? 'bg-[#E7FDD8] text-[#1ba442]' :
                            (c.matchScore ?? 0) >= 60 ? 'bg-[#DBEAFE] text-[#1D4ED8]' :
                            'bg-[#FEF3C7] text-[#B45309]'
                          )}>
                            {Math.round(c.matchScore ?? 0)}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge variant={statusVariantMap[c.status] ?? 'new'}>
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
                  {selectedCandidate.avatarUrl ? (
                    <img src={selectedCandidate.avatarUrl} alt={getCandidateName(selectedCandidate, isRTL)} className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#9fe870] text-2xl font-bold text-[#0e0f0c]">
                      {getCandidateName(selectedCandidate, isRTL).charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-black text-[#0e0f0c]">
                      {getCandidateName(selectedCandidate, isRTL)}
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
              <MatchScoreRing score={selectedCandidate.matchScore ?? 0} size={100} strokeWidth={6} />
              <p className="text-sm font-semibold text-[#5b5e5a]">
                {t('نسبة التطابق', 'Match Score')}
              </p>
              <p className="text-xs text-[#828782]">
                {t('احتمالية القبول', 'Acceptance')}: <span className="font-bold text-[#0e0f0c]">{selectedCandidate.acceptanceProbability ?? 0}%</span>
              </p>
              {(selectedCandidate.appliedJob || selectedCandidate.appliedFor) ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
                  <Briefcase size={12} />
                  {selectedCandidate.appliedJob || selectedCandidate.appliedFor}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f1ee] px-3 py-1 text-xs font-semibold text-[#828782]">
                  <Briefcase size={12} />
                  {t('مرشح بالذكاء الاصطناعي', 'AI Recommended')}
                </span>
              )}
            </div>

            {/* Profile Sections */}
            <div className="flex flex-col gap-5 px-6 py-6">
              {/* Personal Info */}
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#828782]">
                  {t('المعلومات الشخصية', 'Personal Info')}
                </h4>
                <div className="flex flex-col gap-2">
                  {selectedCandidate.email && (
                    <a href={`mailto:${selectedCandidate.email}`} className="flex items-center gap-2 text-sm text-[#0e0f0c] hover:text-[#1ba442]">
                      <Mail size={14} className="text-[#828782]" />
                      <span>{selectedCandidate.email}</span>
                    </a>
                  )}
                  {selectedCandidate.phone && (
                    <a href={`tel:${selectedCandidate.phone}`} className="flex items-center gap-2 text-sm text-[#0e0f0c] hover:text-[#1ba442]">
                      <Phone size={14} className="text-[#828782]" />
                      <span>{selectedCandidate.phone}</span>
                    </a>
                  )}
                  {selectedCandidate.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-[#828782]" />
                      <span className="text-[#0e0f0c]">{selectedCandidate.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Languages size={14} className="text-[#828782]" />
                    <span className="text-[#0e0f0c]">{(selectedCandidate.languages ?? []).join(', ')}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ContactIconButton href={selectedCandidate.email ? `mailto:${selectedCandidate.email}` : ''} title={t('البريد الإلكتروني', 'Email')}>
                      <Mail size={18} />
                    </ContactIconButton>
                    <ContactIconButton href={selectedCandidate.phone ? `tel:${selectedCandidate.phone}` : ''} title={t('الهاتف', 'Phone')}>
                      <Phone size={18} />
                    </ContactIconButton>
                    <ContactIconButton href={selectedCandidate.phone ? `https://wa.me/${String(selectedCandidate.phone).replace(/\D/g, '')}` : ''} title="WhatsApp">
                      <MessageCircle size={18} />
                    </ContactIconButton>
                    <ContactIconButton href={normalizeUrl(selectedCandidate.linkedIn)} title="LinkedIn">
                      <Linkedin size={18} />
                    </ContactIconButton>
                    <ContactIconButton href={normalizeUrl(selectedCandidate.github)} title="GitHub">
                      <Github size={18} />
                    </ContactIconButton>
                    <ContactIconButton href={normalizeUrl(selectedCandidate.portfolio || selectedCandidate.website)} title={t('الموقع', 'Website')}>
                      <Globe size={18} />
                    </ContactIconButton>
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
                  {(selectedCandidate.skills ?? []).map((s: any, index: number) => (
                    <span key={`${getSkillName(s)}-${index}`} className="rounded-full bg-[#E7FDD8] px-3 py-1 text-xs font-semibold text-[#0e0f0c]">
                      {getSkillName(s)}
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
                  {selectedCandidate.appliedJob ?? selectedCandidate.appliedFor}
                </div>
              </div>

              {/* Status */}
              <div>
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#828782]">
                  {t('حالة الطلب', 'Application Status')}
                </h4>
                <StatusBadge variant={statusVariantMap[selectedCandidate.status] ?? 'new'}>
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
                <button
                  onClick={() => handleStatusChange(selectedCandidate.applicationId, 'accepted')}
                  disabled={updateStatusMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#80D34F] disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  {t('قبول', 'Shortlist')}
                </button>
                <button
                  onClick={() => handleStatusChange(selectedCandidate.applicationId, 'interview')}
                  disabled={updateStatusMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-4 py-3 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#f0f1ee] disabled:opacity-50"
                >
                  <Calendar size={16} />
                  {t('مقابلة', 'Interview')}
                </button>
                <button
                  onClick={() => handleStatusChange(selectedCandidate.applicationId, 'rejected')}
                  disabled={updateStatusMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#FEE2E2] bg-[#FEE2E2] px-4 py-3 text-sm font-semibold text-[#dc2626] transition-all hover:bg-[#fecaca] disabled:opacity-50"
                >
                  <XCircle size={16} />
                  {t('رفض', 'Reject')}
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-4 py-3 text-sm font-semibold text-[#5b5e5a] transition-all hover:bg-[#f0f1ee]">
                  <Mail size={16} />
                  {t('رسالة', 'Message')}
                </button>
              </div>
              <div className="mt-4 border-t border-[#dfe1dd] pt-4">
                <div className="mb-2 text-xs font-bold text-[#828782]">
                  {t('تحديث التوافق مع وظيفة', 'Force Match with Job')}
                </div>
                <select
                  className="mb-2 w-full rounded-lg border border-[#dfe1dd] bg-white p-2 text-sm outline-none focus:border-[#9fe870]"
                  value={selectedMatchJobId || selectedCandidate.jobId || ''}
                  onChange={(e) => setSelectedMatchJobId(e.target.value)}
                >
                  <option value="">{t('اختر وظيفة...', 'Select a job...')}</option>
                  {(jobsData?.data || []).map((job: any) => (
                    <option key={job.id || job._id} value={job.id || job._id}>
                      {job.titleAr || job.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleForceMatch}
                  disabled={forceMatchMutation.isPending || (!selectedMatchJobId && !selectedCandidate.jobId)}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[#dfe1dd] bg-[#f8f9f7] px-4 py-2 text-sm font-bold text-[#5b5e5a] transition-all hover:bg-[#f0f1ee] disabled:opacity-50"
                >
                  <RefreshCw size={16} className={forceMatchMutation.isPending ? 'animate-spin' : ''} />
                  {t('تحديث نسبة التوافق', 'Force Match Check')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </PortalLayout>
  )
}
