import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import PortalLayout from '@/components/PortalLayout'
import ContentCard from '@/components/ContentCard'
import MatchScoreRing from '@/components/MatchScoreRing'
import { jobs } from '@/data/company'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Plus,
  Copy,
  CheckCircle2,
  Eye,
  FileText,
  Zap,
  X,
} from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Switch } from '@/components/ui/switch'

const skillSuggestions = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker']
const commonBenefits = [
  { ar: 'تأمين طبي', en: 'Health Insurance' },
  { ar: 'بدل نقل', en: 'Transport Allowance' },
  { ar: 'عمل عن بعد', en: 'Remote Work' },
  { ar: 'تدريب', en: 'Training' },
  { ar: 'مكافأة سنوية', en: 'Annual Bonus' },
]
const departments = ['IT', 'HR', 'Finance', 'Engineering', 'Marketing', 'Operations']
const cities = ['Riyadh', 'Jeddah', 'Dhahran', 'Dammam', 'Makkah', 'Madinah']

export default function CompanyJobs() {
  const { dir } = useLanguage()
  const isRTL = dir === 'rtl'
  const t = (ar: string, en: string) => (isRTL ? ar : en)

  const [activeTab, setActiveTab] = useState<'create' | 'posted'>('create')
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [requirements, setRequirements] = useState('')
  const [responsibilities, setResponsibilities] = useState('')
  const [department, setDepartment] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [experienceLevel, setExperienceLevel] = useState('')
  const [workLocation, setWorkLocation] = useState('')
  const [city, setCity] = useState('')
  const [salaryFrom, setSalaryFrom] = useState('')
  const [salaryTo, setSalaryTo] = useState('')
  const [hideSalary, setHideSalary] = useState(false)
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'TypeScript'])
  const [skillInput, setSkillInput] = useState('')
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
  const [equity, setEquity] = useState(false)
  const [screeningQuestions, setScreeningQuestions] = useState<{ q: string; type: string }[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiExtracted, setAiExtracted] = useState(false)

  const addSkill = () => {
    if (skillInput.trim() && !selectedSkills.includes(skillInput.trim())) {
      setSelectedSkills([...selectedSkills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const removeSkill = (s: string) => setSelectedSkills(selectedSkills.filter((x) => x !== s))

  const toggleBenefit = (b: string) => {
    setSelectedBenefits((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]))
  }

  const addQuestion = () => {
    setScreeningQuestions([...screeningQuestions, { q: '', type: 'text' }])
  }

  const triggerAI = () => {
    setAiLoading(true)
    setTimeout(() => {
      setAiLoading(false)
      setAiExtracted(true)
    }, 1500)
  }

  return (
    <PortalLayout title="Job Management" titleAr="إدارة الوظائف">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-[#0e0f0c]">{t('إدارة الوظائف', 'Job Management')}</h2>
        <p className="mt-1 text-base font-semibold text-[#5b5e5a]">
          {t('أنشئ وظائف جديدة وتابع قائمة وظائفك النشطة', 'Create new jobs and track your active listings')}
        </p>
        {/* View Toggle */}
        <div className="mt-4 inline-flex rounded-full bg-[#f0f1ee] p-1">
          <button
            onClick={() => setActiveTab('create')}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-semibold transition-all',
              activeTab === 'create' ? 'bg-white text-[#0e0f0c] shadow-sm' : 'text-[#5b5e5a] hover:text-[#0e0f0c]'
            )}
          >
            {t('إنشاء وظيفة', 'Create Job')}
          </button>
          <button
            onClick={() => setActiveTab('posted')}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-semibold transition-all',
              activeTab === 'posted' ? 'bg-white text-[#0e0f0c] shadow-sm' : 'text-[#5b5e5a] hover:text-[#0e0f0c]'
            )}
          >
            {t('الوظائف المنشورة', 'Posted Jobs')}
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60%_40%]">
          {/* Left: Create Job Form */}
          <ContentCard noPadding>
            <div className="p-6 border-b border-[#dfe1dd]">
              <h3 className="text-xl font-black text-[#0e0f0c]">{t('تفاصيل الوظيفة', 'Job Details')}</h3>
            </div>

            <div className="p-6">
              <Accordion type="multiple" defaultValue={['basic']} className="w-full">
                {/* Section 1: Basic Information */}
                <AccordionItem value="basic" className="border-b border-[#dfe1dd]">
                  <AccordionTrigger className="text-base font-bold text-[#0e0f0c] hover:no-underline py-4">
                    {t('المعلومات الأساسية', 'Basic Information')}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                          {t('مسمى الوظيفة *', 'Job Title *')}
                        </label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder={t('مطور برمجيات أول', 'Senior Software Developer')}
                          className="h-12 w-full rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                          {t('وصف الوظيفة *', 'Job Description *')}
                        </label>
                        <textarea
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder={t('صف المسؤوليات والمتطلبات...', 'Describe responsibilities and requirements...')}
                          rows={4}
                          className="w-full rounded-xl border border-[#dfe1dd] bg-white px-4 py-3 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8] resize-none"
                        />
                        <button
                          onClick={triggerAI}
                          className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#F3E8FF] px-4 py-2 text-sm font-semibold text-[#7C3AED] transition-all hover:bg-[#ede0fc]"
                        >
                          <Sparkles size={16} className={aiLoading ? 'animate-spin' : ''} />
                          {t('استخراج المهارات بالذكاء الاصطناعي', 'Extract Skills with AI')}
                        </button>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                          {t('المتطلبات', 'Requirements')}
                        </label>
                        <textarea
                          value={requirements}
                          onChange={(e) => setRequirements(e.target.value)}
                          placeholder={t('المؤهلات والخبرات المطلوبة...', 'Required qualifications and experience...')}
                          rows={3}
                          className="w-full rounded-xl border border-[#dfe1dd] bg-white px-4 py-3 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8] resize-none"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                          {t('المسؤوليات', 'Responsibilities')}
                        </label>
                        <textarea
                          value={responsibilities}
                          onChange={(e) => setResponsibilities(e.target.value)}
                          rows={3}
                          className="w-full rounded-xl border border-[#dfe1dd] bg-white px-4 py-3 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8] resize-none"
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Section 2: Job Details */}
                <AccordionItem value="details" className="border-b border-[#dfe1dd]">
                  <AccordionTrigger className="text-base font-bold text-[#0e0f0c] hover:no-underline py-4">
                    {t('تفاصيل الوظيفة', 'Job Details')}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('القسم', 'Department')}</label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="h-12 w-full rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
                        >
                          <option value="">{t('اختر القسم', 'Select Department')}</option>
                          {departments.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('نوع التوظيف', 'Employment Type')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'full-time', ar: 'دوام كامل', en: 'Full-time' },
                            { value: 'part-time', ar: 'دوام جزئي', en: 'Part-time' },
                            { value: 'contract', ar: 'عقد', en: 'Contract' },
                            { value: 'internship', ar: 'تدريب', en: 'Internship' },
                          ].map((type) => (
                            <button
                              key={type.value}
                              onClick={() => setEmploymentType(type.value)}
                              className={cn(
                                'rounded-xl border px-4 py-3 text-sm font-semibold transition-all',
                                employmentType === type.value
                                  ? 'border-[#9fe870] bg-[#f4fcf0] text-[#0e0f0c]'
                                  : 'border-[#dfe1dd] bg-white text-[#5b5e5a] hover:bg-[#f0f1ee]'
                              )}
                            >
                              {t(type.ar, type.en)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('مستوى الخبرة', 'Experience Level')}</label>
                        <select
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                          className="h-12 w-full rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
                        >
                          <option value="">{t('اختر المستوى', 'Select Level')}</option>
                          <option value="entry">{t('مبتدئ', 'Entry Level')}</option>
                          <option value="junior">{t('جونيور (1-3 سنوات)', 'Junior (1-3 years)')}</option>
                          <option value="mid">{t('متوسط (3-5 سنوات)', 'Mid-level (3-5 years)')}</option>
                          <option value="senior">{t('سينيور (5+ سنوات)', 'Senior (5+ years)')}</option>
                          <option value="manager">{t('إداري', 'Managerial')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('مكان العمل', 'Work Location')}</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'onsite', ar: 'حضوري', en: 'On-site' },
                            { value: 'hybrid', ar: 'هجين', en: 'Hybrid' },
                            { value: 'remote', ar: 'عن بعد', en: 'Remote' },
                          ].map((loc) => (
                            <button
                              key={loc.value}
                              onClick={() => setWorkLocation(loc.value)}
                              className={cn(
                                'rounded-xl border px-4 py-3 text-sm font-semibold transition-all',
                                workLocation === loc.value
                                  ? 'border-[#9fe870] bg-[#f4fcf0] text-[#0e0f0c]'
                                  : 'border-[#dfe1dd] bg-white text-[#5b5e5a] hover:bg-[#f0f1ee]'
                              )}
                            >
                              {t(loc.ar, loc.en)}
                            </button>
                          ))}
                        </div>
                        {(workLocation === 'onsite' || workLocation === 'hybrid') && (
                          <select
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="mt-3 h-12 w-full rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
                          >
                            <option value="">{t('اختر المدينة', 'Select City')}</option>
                            {cities.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Section 3: Compensation */}
                <AccordionItem value="compensation" className="border-b border-[#dfe1dd]">
                  <AccordionTrigger className="text-base font-bold text-[#0e0f0c] hover:no-underline py-4">
                    {t('الراتب والمزايا', 'Compensation')}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('نطاق الراتب', 'Salary Range')}</label>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              value={salaryFrom}
                              onChange={(e) => setSalaryFrom(e.target.value)}
                              placeholder={t('من', 'From')}
                              className="h-12 w-full rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#828782]">{t('ر.س', 'SAR')}</span>
                          </div>
                          <span className="text-sm text-[#828782]">-</span>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              value={salaryTo}
                              onChange={(e) => setSalaryTo(e.target.value)}
                              placeholder={t('إلى', 'To')}
                              className="h-12 w-full rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#828782]">{t('ر.س', 'SAR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="hide-salary" checked={hideSalary} onCheckedChange={setHideSalary} />
                        <label htmlFor="hide-salary" className="text-sm font-semibold text-[#5b5e5a]">
                          {t('إخفاء الراتب', 'Hide Salary')}
                        </label>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('المزايا', 'Benefits')}</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedBenefits.map((b) => (
                            <span key={b} className="inline-flex items-center gap-1 rounded-full bg-[#E7FDD8] px-3 py-1 text-xs font-semibold text-[#0e0f0c]">
                              {b}
                              <button onClick={() => toggleBenefit(b)} className="hover:text-[#dc2626]"><X size={12} /></button>
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {commonBenefits.map((b) => (
                            <button
                              key={b.en}
                              onClick={() => toggleBenefit(isRTL ? b.ar : b.en)}
                              className={cn(
                                'rounded-full border px-3 py-1 text-xs font-semibold transition-all',
                                selectedBenefits.includes(isRTL ? b.ar : b.en)
                                  ? 'border-[#9fe870] bg-[#E7FDD8] text-[#0e0f0c]'
                                  : 'border-[#dfe1dd] bg-white text-[#5b5e5a] hover:bg-[#f0f1ee]'
                              )}
                            >
                              {isRTL ? b.ar : b.en}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="equity" checked={equity} onCheckedChange={setEquity} />
                        <label htmlFor="equity" className="text-sm font-semibold text-[#5b5e5a]">
                          {t('تضمين أسهم', 'Include Equity')}
                        </label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Section 4: Skills & Screening */}
                <AccordionItem value="skills" className="border-b-0">
                  <AccordionTrigger className="text-base font-bold text-[#0e0f0c] hover:no-underline py-4">
                    {t('المهارات والفرز', 'Skills & Screening')}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('المهارات المطلوبة', 'Required Skills')}</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedSkills.map((s) => (
                            <span key={s} className={cn(
                              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                              aiExtracted && skillSuggestions.includes(s)
                                ? 'bg-[#F3E8FF] text-[#7C3AED] border border-[#A855F7]'
                                : 'bg-[#E7FDD8] text-[#0e0f0c]'
                            )}>
                              {s}
                              <button onClick={() => removeSkill(s)} className="hover:text-[#dc2626]"><X size={12} /></button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                            placeholder={t('أضف مهارة...', 'Add a skill...')}
                            className="h-12 flex-1 rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
                          />
                          <button
                            onClick={addSkill}
                            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#9fe870] px-4 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#80D34F]"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('أسئلة الفرز', 'Screening Questions')}</label>
                        <div className="flex flex-col gap-2">
                          {screeningQuestions.map((sq, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-xl bg-[#f0f1ee] p-3">
                              <input
                                type="text"
                                value={sq.q}
                                onChange={(e) => {
                                  const updated = [...screeningQuestions]
                                  updated[i].q = e.target.value
                                  setScreeningQuestions(updated)
                                }}
                                placeholder={t('اكتب السؤال هنا...', 'Type question here...')}
                                className="flex-1 bg-transparent text-sm font-semibold text-[#0e0f0c] outline-none"
                              />
                              <select
                                value={sq.type}
                                onChange={(e) => {
                                  const updated = [...screeningQuestions]
                                  updated[i].type = e.target.value
                                  setScreeningQuestions(updated)
                                }}
                                className="h-8 rounded-lg border border-[#dfe1dd] bg-white px-2 text-xs font-semibold"
                              >
                                <option value="text">{t('نص', 'Text')}</option>
                                <option value="yesno">{t('نعم/لا', 'Yes/No')}</option>
                                <option value="number">{t('رقم', 'Number')}</option>
                              </select>
                              <button onClick={() => setScreeningQuestions(screeningQuestions.filter((_, idx) => idx !== i))} className="text-[#828782] hover:text-[#dc2626]">
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={addQuestion}
                          className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#dfe1dd] px-4 py-2 text-sm font-semibold text-[#5b5e5a] transition-all hover:bg-[#f0f1ee]"
                        >
                          <Plus size={16} />
                          {t('إضافة سؤال', 'Add Question')}
                        </button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Form Actions */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-[#dfe1dd] bg-white px-6 py-4">
              <button className="inline-flex items-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-6 py-3 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#f0f1ee]">
                {t('حفظ كمسودة', 'Save Draft')}
              </button>
              <button className="inline-flex items-center gap-2 rounded-full bg-[#9fe870] px-6 py-3 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#80D34F] hover:scale-[1.02]">
                <CheckCircle2 size={18} />
                {t('نشر الوظيفة', 'Publish Job')}
              </button>
            </div>
          </ContentCard>

          {/* Right Column: AI Preview + Existing Jobs */}
          <div className="flex flex-col gap-6">
            {/* AI Skill Preview */}
            <ContentCard
              className="border-[#A855F7]/20"
              title={t('معاينة الذكاء الاصطناعي', 'AI Preview')}
              icon={<Sparkles size={20} className="text-[#A855F7]" />}
            >
              {aiLoading ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Sparkles size={32} className="animate-spin text-[#A855F7]" />
                  <p className="text-sm font-semibold text-[#5b5e5a]">{t('جاري التحليل...', 'Analyzing...')}</p>
                </div>
              ) : aiExtracted ? (
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="mb-2 text-sm font-bold text-[#0e0f0c]">{t('المهارات المستخرجة', 'Extracted Skills')}</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map((s) => (
                        <span key={s} className="inline-flex items-center gap-1 rounded-full bg-[#F3E8FF] px-3 py-1 text-xs font-semibold text-[#7C3AED]">
                          {s}
                          <span className="text-[10px] opacity-70">95%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#f0f1ee] p-4">
                    <p className="text-sm font-bold text-[#0e0f0c]">{t('توقع نسبة التطابق', 'Estimated Match Rate')}</p>
                    <MatchScoreRing score={82} size={100} strokeWidth={6} />
                    <p className="text-xs text-center text-[#5b5e5a]">
                      {t('تقدير أولي بناءً على المهارات المطلوبة', 'Initial estimate based on required skills')}
                    </p>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-bold text-[#0e0f0c]">{t('رؤى السوق', 'Market Insights')}</p>
                    <div className="flex flex-col gap-2">
                      <div className="rounded-xl bg-[#f0f1ee] p-3 text-xs font-semibold text-[#5b5e5a]">
                        {t('هذه المهارات مطلوبة في 234 وظيفة حالياً', 'These skills are in demand across 234 current jobs')}
                      </div>
                      <div className="rounded-xl bg-[#f0f1ee] p-3 text-xs font-semibold text-[#5b5e5a]">
                        {t('متوسط الراتب للوظائف المشابهة: 22,000 ر.س', 'Average salary for similar roles: 22,000 SAR')}
                      </div>
                      <div className="rounded-xl bg-[#f0f1ee] p-3 text-xs font-semibold text-[#5b5e5a]">
                        {t('متوسط وقت التوظيف: 21 يوماً', 'Average time to fill: 21 days')}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-bold text-[#0e0f0c]">{t('اقتراحات', 'Suggestions')}</p>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2 rounded-xl bg-[#E7FDD8] p-3 text-xs font-semibold text-[#1ba442]">
                        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                        {t('أضف وصفاً أكثر تفصيلاً لجذب المتقدمين المناسبين', 'Add a more detailed description to attract the right candidates')}
                      </div>
                      <div className="flex items-start gap-2 rounded-xl bg-[#FEF3C7] p-3 text-xs font-semibold text-[#B45309]">
                        <Zap size={14} className="mt-0.5 flex-shrink-0" />
                        {t('حدد مستوى الخبرة المطلوب بدقة', 'Clearly specify the required experience level')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Sparkles size={32} className="text-[#A855F7]/30" />
                  <p className="text-sm text-[#828782]">
                    {t('اكتب وصف الوظيفة واضغط على "استخراج المهارات"', 'Write a job description and click "Extract Skills"')}
                  </p>
                </div>
              )}
            </ContentCard>

            {/* Previously Posted Jobs */}
            <ContentCard
              title={t('وظائف منشورة سابقاً', 'Previously Posted Jobs')}
              icon={<FileText size={20} />}
            >
              <div className="mt-2 flex max-h-[400px] flex-col gap-2 overflow-auto">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 rounded-xl bg-[#f0f1ee] p-3 transition-all hover:bg-[#ebede9]"
                  >
                    <div className={cn('h-2 w-2 flex-shrink-0 rounded-full', job.status === 'active' ? 'bg-[#1ba442]' : 'bg-[#f59e0b]')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0e0f0c] truncate">{job.title}</p>
                      <p className="text-xs text-[#828782]">{job.location} | {job.type}</p>
                    </div>
                    <button className="rounded-full p-2 text-[#828782] hover:bg-white hover:text-[#0e0f0c] transition-colors" title={t('نسخ', 'Duplicate')}>
                      <Copy size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </ContentCard>
          </div>
        </div>
      ) : (
        /* Posted Jobs Tab */
        <ContentCard>
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center gap-4 rounded-2xl bg-[#f0f1ee] p-4 transition-all hover:bg-[#ebede9]"
              >
                <div className={cn('h-2 w-2 flex-shrink-0 rounded-full', job.status === 'active' ? 'bg-[#1ba442]' : 'bg-[#f59e0b]')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0e0f0c]">{job.title}</p>
                  <p className="text-xs text-[#828782]">{job.location} | {job.type} | {job.postedDate}</p>
                </div>
                <span className="text-xs font-semibold text-[#5b5e5a]">{job.applicants} {t('متقدم', 'applicants')}</span>
                <div className="flex items-center gap-1">
                  <button className="rounded-full p-2 text-[#828782] hover:bg-white hover:text-[#0e0f0c] transition-colors">
                    <Eye size={16} />
                  </button>
                  <button className="rounded-full p-2 text-[#828782] hover:bg-white hover:text-[#0e0f0c] transition-colors">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </ContentCard>
      )}
    </PortalLayout>
  )
}
