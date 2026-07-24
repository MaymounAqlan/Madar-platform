import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLanguage } from '@/hooks/useLanguage'
import PortalLayout from '@/components/PortalLayout'
import ContentCard from '@/components/ContentCard'
import MatchScoreRing from '@/components/MatchScoreRing'
import { useCompanyJobs, useCreateJob, useUpdateJob, useDeleteJob } from '@/hooks/useCompany'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Sparkles,
  Plus,
  Copy,
  CheckCircle2,
  Eye,
  FileText,
  Zap,
  X,
  Loader2,
} from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Switch } from '@/components/ui/switch'
import apiClient from '@/services/api'

const commonBenefits = [
  { ar: 'تأمين طبي', en: 'Health Insurance' },
  { ar: 'بدل نقل', en: 'Transport Allowance' },
  { ar: 'عمل عن بعد', en: 'Remote Work' },
  { ar: 'تدريب', en: 'Training' },
  { ar: 'مكافأة سنوية', en: 'Annual Bonus' },
]
const departments = ['IT', 'HR', 'Finance', 'Engineering', 'Marketing', 'Operations']
const cities = ['Riyadh', 'Jeddah', 'Dhahran', 'Dammam', 'Makkah', 'Madinah']

const sampleJobTemplates = [
  {
    title: 'AI Engineer',
    description: 'Build production AI services, develop model evaluation pipelines, and integrate NLP features with backend APIs.',
    responsibilities: 'Design NLP services\nCreate embedding pipelines\nMonitor model quality\nCollaborate with product and backend teams',
    requirements: 'Bachelor degree in Computer Science or related field\nExperience with Python and ML frameworks\nStrong understanding of REST APIs',
    department: 'Engineering',
    employmentType: 'full-time',
    experienceLevel: 'mid',
    workLocation: 'hybrid',
    skills: ['Python', 'Machine Learning', 'NLP', 'FastAPI', 'Docker'],
    benefits: ['Health Insurance', 'Training', 'Annual Bonus'],
    salary: [18000, 28000],
  },
  {
    title: 'Frontend Developer',
    description: 'Develop responsive React interfaces, improve user workflows, and connect UI components to live backend APIs.',
    responsibilities: 'Build reusable React components\nFix UI bugs and accessibility issues\nIntegrate REST APIs\nOptimize frontend performance',
    requirements: 'Strong React and TypeScript experience\nGood CSS and responsive design skills\nExperience with API integration',
    department: 'IT',
    employmentType: 'full-time',
    experienceLevel: 'junior',
    workLocation: 'onsite',
    skills: ['React', 'TypeScript', 'CSS', 'REST API', 'Problem Solving'],
    benefits: ['Health Insurance', 'Transport Allowance', 'Training'],
    salary: [9000, 16000],
  },
  {
    title: 'Cyber Security Engineer',
    description: 'Protect cloud and application environments through security monitoring, vulnerability assessment, and incident response.',
    responsibilities: 'Run vulnerability assessments\nMonitor security alerts\nImprove access controls\nPrepare security reports',
    requirements: 'Knowledge of network security and cloud controls\nExperience with SIEM tools\nUnderstanding of secure development practices',
    department: 'IT',
    employmentType: 'full-time',
    experienceLevel: 'mid',
    workLocation: 'hybrid',
    skills: ['Cyber Security', 'Networking', 'AWS', 'Linux', 'Incident Response'],
    benefits: ['Health Insurance', 'Remote Work', 'Training'],
    salary: [16000, 26000],
  },
  {
    title: 'Business Analyst',
    description: 'Analyze business processes, document requirements, and support delivery teams with clear product specifications.',
    responsibilities: 'Gather stakeholder requirements\nPrepare process maps\nWrite user stories\nSupport acceptance testing',
    requirements: 'Strong communication skills\nExperience with requirements analysis\nAbility to work with technical and business teams',
    department: 'Operations',
    employmentType: 'contract',
    experienceLevel: 'entry',
    workLocation: 'onsite',
    skills: ['Business Analysis', 'Communication', 'SQL', 'Excel', 'Problem Solving'],
    benefits: ['Training', 'Transport Allowance'],
    salary: [8000, 14000],
  },
]

const arByEnglish: Record<string, string> = {
  'Health Insurance': 'تأمين طبي',
  'Transport Allowance': 'بدل نقل',
  'Remote Work': 'عمل عن بعد',
  Training: 'تدريب',
  'Annual Bonus': 'مكافأة سنوية',
  'Skills extracted successfully': 'تم استخراج المهارات بنجاح',
  'Failed to extract skills': 'فشل استخراج المهارات',
  'Job copied into the form': 'تم نسخ بيانات الوظيفة إلى النموذج',
  'Draft saved on this device': 'تم حفظ المسودة على هذا الجهاز',
  'Sample data generated and ready to edit': 'تم توليد بيانات اختبار قابلة للتعديل',
  'Please write a job description first': 'يرجى كتابة وصف الوظيفة أولاً',
  'Job published successfully': 'تم نشر الوظيفة',
  'Failed to publish': 'فشل النشر',
  'Are you sure you want to delete this job?': 'هل أنت متأكد من حذف الوظيفة؟',
  'Deleted successfully': 'تم الحذف',
  'Failed to delete': 'فشل الحذف',
  'Job Management': 'إدارة الوظائف',
  'Create new jobs and track your active listings': 'أنشئ وظائف جديدة وتابع قائمة وظائفك النشطة',
  'Create Job': 'إنشاء وظيفة',
  'Posted Jobs': 'الوظائف المنشورة',
  'Job Details': 'تفاصيل الوظيفة',
  'Basic Information': 'المعلومات الأساسية',
  'Job Title *': 'مسمى الوظيفة *',
  'Senior Software Developer': 'مطوّر برمجيات أول',
  'Job Description *': 'وصف الوظيفة *',
  'Describe responsibilities and requirements...': 'صف المسؤوليات والمتطلبات...',
  'Analyzing...': 'جاري التحليل...',
  'Extract Skills with AI': 'استخراج المهارات بالذكاء الاصطناعي',
  Requirements: 'المتطلبات',
  'Required qualifications and experience...': 'المؤهلات والخبرات المطلوبة...',
  Responsibilities: 'المسؤوليات',
  Department: 'القسم',
  'Select Department': 'اختر القسم',
  'Employment Type': 'نوع التوظيف',
  'Full-time': 'دوام كامل',
  'Part-time': 'دوام جزئي',
  Contract: 'عقد',
  Internship: 'تدريب',
  'Experience Level': 'مستوى الخبرة',
  'Select Level': 'اختر المستوى',
  'Entry Level': 'مبتدئ',
  'Junior (1-3 years)': 'مبتدئ (1-3 سنوات)',
  'Mid-level (3-5 years)': 'متوسط (3-5 سنوات)',
  'Senior (5+ years)': 'خبير (5+ سنوات)',
  Managerial: 'إداري',
  'Work Location': 'مكان العمل',
  'On-site': 'حضوري',
  Hybrid: 'هجين',
  Remote: 'عن بعد',
  'Select City': 'اختر المدينة',
  Compensation: 'الراتب والمزايا',
  'Salary Range': 'نطاق الراتب',
  From: 'من',
  To: 'إلى',
  SAR: 'ر.س',
  'Hide Salary': 'إخفاء الراتب',
  Benefits: 'المزايا',
  'Include Equity': 'تضمين أسهم',
  'Skills & Screening': 'المهارات والفرز',
  'Required Skills': 'المهارات المطلوبة',
  'Add a skill...': 'أضف مهارة...',
  'Screening Questions': 'أسئلة الفرز',
  'Type question here...': 'اكتب السؤال هنا...',
  Text: 'نص',
  'Yes/No': 'نعم/لا',
  Number: 'رقم',
  'Add Question': 'إضافة سؤال',
  'Generate Sample Data': 'توليد بيانات اختبار',
  'Save Draft': 'حفظ كمسودة',
  'Publish Job': 'نشر الوظيفة',
  'AI Preview': 'معاينة الذكاء الاصطناعي',
  'Extracted Skills': 'المهارات المستخرجة',
  'Estimated Match Rate': 'توقع نسبة التطابق',
  'Initial estimate based on required skills': 'تقدير أولي بناءً على المهارات المطلوبة',
  'Write a job description and click "Extract Skills"': 'اكتب وصف الوظيفة واضغط على "استخراج المهارات"',
  'Previously Posted Jobs': 'وظائف منشورة سابقًا',
  applicants: 'متقدم',
  Duplicate: 'نسخ',
  Preview: 'معاينة',
  Close: 'إغلاق',
  'Job Preview': 'معاينة الوظيفة',
  Description: 'الوصف',
  Skill: 'مهارة',
}

// AI Skill Extraction API call
async function extractSkillsFromDescription(description: string): Promise<{ skills: string[]; matchEstimate: number }> {
  const response = await apiClient.post('/ai/extract-skills', { description })
  return response.data.data
}

function LoadingSpinner() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#9fe870]" />
    </div>
  )
}

export default function CompanyJobs() {
  const { dir } = useLanguage()
  const isRTL = dir === 'rtl'
  const t = (_ar: string, en: string) => (isRTL ? arByEnglish[en] || _ar : en)

  const { data: jobsData, isLoading } = useCompanyJobs()
  const createMutation = useCreateJob()
  const updateMutation = useUpdateJob()
  const deleteMutation = useDeleteJob()

  const jobs = jobsData?.data ?? []

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
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
  const [equity, setEquity] = useState(false)
  const [screeningQuestions, setScreeningQuestions] = useState<{ q: string; type: string }[]>([])
  const [aiExtracted, setAiExtracted] = useState(false)
  const [previewJob, setPreviewJob] = useState<any | null>(null)

  // AI Skill Extraction Mutation
  const aiExtractMutation = useMutation({
    mutationFn: extractSkillsFromDescription,
    onSuccess: (data) => {
      if (data.skills?.length > 0) {
        setSelectedSkills(prev => Array.from(new Set([...prev, ...data.skills])))
      }
      setAiExtracted(true)
      toast.success(t('طھظ… ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ…ظ‡ط§ط±ط§طھ ط¨ظ†ط¬ط§ط­', 'Skills extracted successfully'))
    },
    onError: () => {
      toast.error(t('ظپط´ظ„ ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ…ظ‡ط§ط±ط§طھ', 'Failed to extract skills'))
    },
  })

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

  const resetForm = () => {
    setJobTitle('')
    setJobDescription('')
    setRequirements('')
    setResponsibilities('')
    setDepartment('')
    setEmploymentType('')
    setExperienceLevel('')
    setWorkLocation('')
    setCity('')
    setSalaryFrom('')
    setSalaryTo('')
    setHideSalary(false)
    setSelectedSkills([])
    setSelectedBenefits([])
    setScreeningQuestions([])
    setAiExtracted(false)
  }

  const loadJobIntoForm = (job: any) => {
    setJobTitle(`${job.title || ''} Copy`.trim())
    setJobDescription(job.description || job.summary || '')
    setRequirements(Array.isArray(job.requirements) ? job.requirements.join('\n') : job.requirements || '')
    setResponsibilities(Array.isArray(job.responsibilities) ? job.responsibilities.join('\n') : job.responsibilities || '')
    setDepartment(job.department || job.category || '')
    setEmploymentType(job.type || 'full-time')
    setExperienceLevel(job.experienceLevel || job.level || 'entry')
    setWorkLocation(job.locationType || 'hybrid')
    setCity(typeof job.location === 'string' ? job.location.split(',')[0] : job.city || '')
    setSalaryFrom(String(job.salaryMin || job.compensation?.salaryMin || ''))
    setSalaryTo(String(job.salaryMax || job.compensation?.salaryMax || ''))
    setSelectedSkills(Array.isArray(job.requiredSkills) ? job.requiredSkills : [])
    setSelectedBenefits(Array.isArray(job.benefits) ? job.benefits : job.compensation?.benefits || [])
    setActiveTab('create')
    toast.success(t('طھظ… ظ†ط³ط® ط¨ظٹط§ظ†ط§طھ ط§ظ„ظˆط¸ظٹظپط© ط¥ظ„ظ‰ ط§ظ„ظ†ظ…ظˆط°ط¬', 'Job copied into the form'))
  }

  const saveDraft = () => {
    localStorage.setItem('madar_company_job_draft', JSON.stringify({
      jobTitle, jobDescription, requirements, responsibilities, department, employmentType,
      experienceLevel, workLocation, city, salaryFrom, salaryTo, selectedSkills, selectedBenefits,
      screeningQuestions, savedAt: new Date().toISOString(),
    }))
    toast.success(t('طھظ… ط­ظپط¸ ط§ظ„ظ…ط³ظˆط¯ط© ط¹ظ„ظ‰ ظ‡ط°ط§ ط§ظ„ط¬ظ‡ط§ط²', 'Draft saved on this device'))
  }

  const generateSampleData = () => {
    const sample = sampleJobTemplates[Math.floor(Math.random() * sampleJobTemplates.length)]
    const salaryOffset = Math.floor(Math.random() * 2500)
    const randomCity = cities[Math.floor(Math.random() * cities.length)]

    setJobTitle(sample.title)
    setJobDescription(sample.description)
    setResponsibilities(sample.responsibilities)
    setRequirements(sample.requirements)
    setDepartment(sample.department)
    setEmploymentType(sample.employmentType)
    setExperienceLevel(sample.experienceLevel)
    setWorkLocation(sample.workLocation)
    setCity(randomCity)
    setSalaryFrom(String(sample.salary[0] + salaryOffset))
    setSalaryTo(String(sample.salary[1] + salaryOffset))
    setSelectedSkills(sample.skills)
    setSelectedBenefits(sample.benefits)
    setScreeningQuestions([
      { q: 'Describe a project where you used the required skills.', type: 'text' },
      { q: 'Are you available to start within 30 days?', type: 'yesno' },
    ])
    setAiExtracted(false)
    toast.success(t('تم توليد بيانات اختبار قابلة للتعديل', 'Sample data generated and ready to edit'))
  }

  const triggerAI = () => {
    if (!jobDescription.trim()) {
      toast.error(t('ظٹط±ط¬ظ‰ ظƒطھط§ط¨ط© ظˆطµظپ ط§ظ„ظˆط¸ظٹظپط© ط£ظˆظ„ط§ظ‹', 'Please write a job description first'))
      return
    }
    aiExtractMutation.mutate(jobDescription)
  }

  const handlePublish = async () => {
    const jobData = {
      title: jobTitle,
      description: jobDescription,
      requirements,
      responsibilities,
      department,
      type: employmentType,
      experienceLevel,
      locationType: workLocation,
      city,
      salaryMin: Number(salaryFrom) || 0,
      salaryMax: Number(salaryTo) || 0,
      hideSalary,
      skills: selectedSkills,
      benefits: selectedBenefits,
      equity,
      screeningQuestions,
    }
    try {
      await createMutation.mutateAsync(jobData)
      toast.success(t('طھظ… ظ†ط´ط± ط§ظ„ظˆط¸ظٹظپط©', 'Job published successfully'))
      setActiveTab('posted')
      resetForm()
      localStorage.removeItem('madar_company_job_draft')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('ظپط´ظ„ ط§ظ„ظ†ط´ط±', 'Failed to publish'))
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm(t('ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط­ط°ظپ ط§ظ„ظˆط¸ظٹظپط©طں', 'Are you sure you want to delete this job?'))) return
    try {
      await deleteMutation.mutateAsync(jobId)
      toast.success(t('طھظ… ط§ظ„ط­ط°ظپ', 'Deleted successfully'))
    } catch (err: any) {
      toast.error(t('ظپط´ظ„ ط§ظ„ط­ط°ظپ', 'Failed to delete'))
    }
  }

  const isAILoading = aiExtractMutation.isPending

  if (isLoading && activeTab === 'posted') return <LoadingSpinner />

  return (
    <PortalLayout title="Job Management">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-black text-[#0e0f0c]">{t('ط¥ط¯ط§ط±ط© ط§ظ„ظˆط¸ط§ط¦ظپ', 'Job Management')}</h2>
        <p className="mt-1 text-base font-semibold text-[#5b5e5a]">
          {t('ط£ظ†ط´ط¦ ظˆط¸ط§ط¦ظپ ط¬ط¯ظٹط¯ط© ظˆطھط§ط¨ط¹ ظ‚ط§ط¦ظ…ط© ظˆط¸ط§ط¦ظپظƒ ط§ظ„ظ†ط´ط·ط©', 'Create new jobs and track your active listings')}
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
            {t('ط¥ظ†ط´ط§ط، ظˆط¸ظٹظپط©', 'Create Job')}
          </button>
          <button
            onClick={() => setActiveTab('posted')}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-semibold transition-all',
              activeTab === 'posted' ? 'bg-white text-[#0e0f0c] shadow-sm' : 'text-[#5b5e5a] hover:text-[#0e0f0c]'
            )}
          >
            {t('ط§ظ„ظˆط¸ط§ط¦ظپ ط§ظ„ظ…ظ†ط´ظˆط±ط©', 'Posted Jobs')}
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60%_40%]">
          {/* Left: Create Job Form */}
          <ContentCard noPadding>
            <div className="p-6 border-b border-[#dfe1dd]">
              <h3 className="text-xl font-black text-[#0e0f0c]">{t('طھظپط§طµظٹظ„ ط§ظ„ظˆط¸ظٹظپط©', 'Job Details')}</h3>
            </div>

            <div className="p-6">
              <Accordion type="multiple" defaultValue={['basic']} className="w-full">
                {/* Section 1: Basic Information */}
                <AccordionItem value="basic" className="border-b border-[#dfe1dd]">
                  <AccordionTrigger className="text-base font-bold text-[#0e0f0c] hover:no-underline py-4">
                    {t('ط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط£ط³ط§ط³ظٹط©', 'Basic Information')}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                          {t('ظ…ط³ظ…ظ‰ ط§ظ„ظˆط¸ظٹظپط© *', 'Job Title *')}
                        </label>
                        <input
                          type="text"
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder={t('ظ…ط·ظˆط± ط¨ط±ظ…ط¬ظٹط§طھ ط£ظˆظ„', 'Senior Software Developer')}
                          className="h-12 w-full rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                          {t('ظˆطµظپ ط§ظ„ظˆط¸ظٹظپط© *', 'Job Description *')}
                        </label>
                        <textarea
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder={t('طµظپ ط§ظ„ظ…ط³ط¤ظˆظ„ظٹط§طھ ظˆط§ظ„ظ…طھط·ظ„ط¨ط§طھ...', 'Describe responsibilities and requirements...')}
                          rows={4}
                          className="w-full rounded-xl border border-[#dfe1dd] bg-white px-4 py-3 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8] resize-none"
                        />
                        <button
                          onClick={triggerAI}
                          disabled={isAILoading}
                          className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#F3E8FF] px-4 py-2 text-sm font-semibold text-[#7C3AED] transition-all hover:bg-[#ede0fc] disabled:opacity-50"
                        >
                          <Sparkles size={16} className={isAILoading ? 'animate-spin' : ''} />
                          {isAILoading ? t('ط¬ط§ط±ظٹ ط§ظ„طھط­ظ„ظٹظ„...', 'Analyzing...') : t('ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ…ظ‡ط§ط±ط§طھ ط¨ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ', 'Extract Skills with AI')}
                        </button>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                          {t('ط§ظ„ظ…طھط·ظ„ط¨ط§طھ', 'Requirements')}
                        </label>
                        <textarea
                          value={requirements}
                          onChange={(e) => setRequirements(e.target.value)}
                          placeholder={t('ط§ظ„ظ…ط¤ظ‡ظ„ط§طھ ظˆط§ظ„ط®ط¨ط±ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©...', 'Required qualifications and experience...')}
                          rows={3}
                          className="w-full rounded-xl border border-[#dfe1dd] bg-white px-4 py-3 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8] resize-none"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">
                          {t('ط§ظ„ظ…ط³ط¤ظˆظ„ظٹط§طھ', 'Responsibilities')}
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
                    {t('طھظپط§طµظٹظ„ ط§ظ„ظˆط¸ظٹظپط©', 'Job Details')}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('ط§ظ„ظ‚ط³ظ…', 'Department')}</label>
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="h-12 w-full rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
                        >
                          <option value="">{t('ط§ط®طھط± ط§ظ„ظ‚ط³ظ…', 'Select Department')}</option>
                          {departments.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('ظ†ظˆط¹ ط§ظ„طھظˆط¸ظٹظپ', 'Employment Type')}</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'full-time', ar: 'ط¯ظˆط§ظ… ظƒط§ظ…ظ„', en: 'Full-time' },
                            { value: 'part-time', ar: 'ط¯ظˆط§ظ… ط¬ط²ط¦ظٹ', en: 'Part-time' },
                            { value: 'contract', ar: 'ط¹ظ‚ط¯', en: 'Contract' },
                            { value: 'internship', ar: 'طھط¯ط±ظٹط¨', en: 'Internship' },
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
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('ظ…ط³طھظˆظ‰ ط§ظ„ط®ط¨ط±ط©', 'Experience Level')}</label>
                        <select
                          value={experienceLevel}
                          onChange={(e) => setExperienceLevel(e.target.value)}
                          className="h-12 w-full rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
                        >
                          <option value="">{t('ط§ط®طھط± ط§ظ„ظ…ط³طھظˆظ‰', 'Select Level')}</option>
                          <option value="entry">{t('ظ…ط¨طھط¯ط¦', 'Entry Level')}</option>
                          <option value="junior">{t('ط¬ظˆظ†ظٹظˆط± (1-3 ط³ظ†ظˆط§طھ)', 'Junior (1-3 years)')}</option>
                          <option value="mid">{t('ظ…طھظˆط³ط· (3-5 ط³ظ†ظˆط§طھ)', 'Mid-level (3-5 years)')}</option>
                          <option value="senior">{t('ط³ظٹظ†ظٹظˆط± (5+ ط³ظ†ظˆط§طھ)', 'Senior (5+ years)')}</option>
                          <option value="manager">{t('ط¥ط¯ط§ط±ظٹ', 'Managerial')}</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('ظ…ظƒط§ظ† ط§ظ„ط¹ظ…ظ„', 'Work Location')}</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'onsite', ar: 'ط­ط¶ظˆط±ظٹ', en: 'On-site' },
                            { value: 'hybrid', ar: 'ظ‡ط¬ظٹظ†', en: 'Hybrid' },
                            { value: 'remote', ar: 'ط¹ظ† ط¨ط¹ط¯', en: 'Remote' },
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
                            <option value="">{t('ط§ط®طھط± ط§ظ„ظ…ط¯ظٹظ†ط©', 'Select City')}</option>
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
                    {t('ط§ظ„ط±ط§طھط¨ ظˆط§ظ„ظ…ط²ط§ظٹط§', 'Compensation')}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('ظ†ط·ط§ظ‚ ط§ظ„ط±ط§طھط¨', 'Salary Range')}</label>
                        <div className="flex items-center gap-3">
                          <div className="relative flex-1">
                            <input
                              type="number"
                              value={salaryFrom}
                              onChange={(e) => setSalaryFrom(e.target.value)}
                              placeholder={t('ظ…ظ†', 'From')}
                              className="h-12 w-full rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#828782]">{t('ط±.ط³', 'SAR')}</span>
                          </div>
                          <span className="text-sm text-[#828782]">-</span>
                          <div className="relative flex-1">
                            <input
                              type="number"
                              value={salaryTo}
                              onChange={(e) => setSalaryTo(e.target.value)}
                              placeholder={t('ط¥ظ„ظ‰', 'To')}
                              className="h-12 w-full rounded-xl border border-[#dfe1dd] bg-white px-4 text-sm font-semibold text-[#0e0f0c] outline-none transition-all focus:border-[#9fe870] focus:ring-2 focus:ring-[#e7fdd8]"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#828782]">{t('ط±.ط³', 'SAR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="hide-salary" checked={hideSalary} onCheckedChange={setHideSalary} />
                        <label htmlFor="hide-salary" className="text-sm font-semibold text-[#5b5e5a]">
                          {t('ط¥ط®ظپط§ط، ط§ظ„ط±ط§طھط¨', 'Hide Salary')}
                        </label>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('ط§ظ„ظ…ط²ط§ظٹط§', 'Benefits')}</label>
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
                          {t('طھط¶ظ…ظٹظ† ط£ط³ظ‡ظ…', 'Include Equity')}
                        </label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Section 4: Skills & Screening */}
                <AccordionItem value="skills" className="border-b-0">
                  <AccordionTrigger className="text-base font-bold text-[#0e0f0c] hover:no-underline py-4">
                    {t('ط§ظ„ظ…ظ‡ط§ط±ط§طھ ظˆط§ظ„ظپط±ط²', 'Skills & Screening')}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="flex flex-col gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('ط§ظ„ظ…ظ‡ط§ط±ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©', 'Required Skills')}</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedSkills.map((s) => (
                            <span key={s} className={cn(
                              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                              aiExtracted
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
                            placeholder={t('ط£ط¶ظپ ظ…ظ‡ط§ط±ط©...', 'Add a skill...')}
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
                        <label className="mb-2 block text-sm font-semibold text-[#5b5e5a]">{t('ط£ط³ط¦ظ„ط© ط§ظ„ظپط±ط²', 'Screening Questions')}</label>
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
                                placeholder={t('ط§ظƒطھط¨ ط§ظ„ط³ط¤ط§ظ„ ظ‡ظ†ط§...', 'Type question here...')}
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
                                <option value="text">{t('ظ†طµ', 'Text')}</option>
                                <option value="yesno">{t('ظ†ط¹ظ…/ظ„ط§', 'Yes/No')}</option>
                                <option value="number">{t('ط±ظ‚ظ…', 'Number')}</option>
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
                          {t('ط¥ط¶ط§ظپط© ط³ط¤ط§ظ„', 'Add Question')}
                        </button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Form Actions */}
            <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-3 border-t border-[#dfe1dd] bg-white px-6 py-4">
              <button onClick={generateSampleData} className="inline-flex items-center gap-2 rounded-full border border-[#dfe1dd] bg-[#f4fcf0] px-6 py-3 text-sm font-semibold text-[#0e0f0c] transition-all hover:border-[#9fe870] hover:bg-[#e7fdd8]">
                <Zap size={16} />
                {t('توليد بيانات اختبار', 'Generate Sample Data')}
              </button>
              <button onClick={saveDraft} className="inline-flex items-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-6 py-3 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#f0f1ee]">
                {t('ط­ظپط¸ ظƒظ…ط³ظˆط¯ط©', 'Save Draft')}
              </button>
              <button
                onClick={handlePublish}
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-[#9fe870] px-6 py-3 text-sm font-semibold text-[#0e0f0c] transition-all hover:bg-[#80D34F] hover:scale-[1.02] disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {t('ظ†ط´ط± ط§ظ„ظˆط¸ظٹظپط©', 'Publish Job')}
              </button>
            </div>
          </ContentCard>

          {/* Right Column: AI Preview + Existing Jobs */}
          <div className="flex flex-col gap-6">
            {/* AI Skill Preview */}
            <ContentCard
              className="border-[#A855F7]/20"
              title={t('ظ…ط¹ط§ظٹظ†ط© ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ', 'AI Preview')}
              icon={<Sparkles size={20} className="text-[#A855F7]" />}
            >
              {isAILoading ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Sparkles size={32} className="animate-spin text-[#A855F7]" />
                  <p className="text-sm font-semibold text-[#5b5e5a]">{t('ط¬ط§ط±ظٹ ط§ظ„طھط­ظ„ظٹظ„...', 'Analyzing...')}</p>
                </div>
              ) : aiExtracted ? (
                <div className="flex flex-col gap-5">
                  <div>
                    <p className="mb-2 text-sm font-bold text-[#0e0f0c]">{t('ط§ظ„ظ…ظ‡ط§ط±ط§طھ ط§ظ„ظ…ط³طھط®ط±ط¬ط©', 'Extracted Skills')}</p>
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
                    <p className="text-sm font-bold text-[#0e0f0c]">{t('طھظˆظ‚ط¹ ظ†ط³ط¨ط© ط§ظ„طھط·ط§ط¨ظ‚', 'Estimated Match Rate')}</p>
                    <MatchScoreRing score={aiExtractMutation.data?.matchEstimate ?? 82} size={100} strokeWidth={6} />
                    <p className="text-xs text-center text-[#5b5e5a]">
                      {t('طھظ‚ط¯ظٹط± ط£ظˆظ„ظٹ ط¨ظ†ط§ط،ظ‹ ط¹ظ„ظ‰ ط§ظ„ظ…ظ‡ط§ط±ط§طھ ط§ظ„ظ…ط·ظ„ظˆط¨ط©', 'Initial estimate based on required skills')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <Sparkles size={32} className="text-[#A855F7]/30" />
                  <p className="text-sm text-[#828782]">
                    {t('ط§ظƒطھط¨ ظˆطµظپ ط§ظ„ظˆط¸ظٹظپط© ظˆط§ط¶ط؛ط· ط¹ظ„ظ‰ "ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ…ظ‡ط§ط±ط§طھ"', 'Write a job description and click "Extract Skills"')}
                  </p>
                </div>
              )}
            </ContentCard>

            {/* Previously Posted Jobs */}
            <ContentCard
              title={t('ظˆط¸ط§ط¦ظپ ظ…ظ†ط´ظˆط±ط© ط³ط§ط¨ظ‚ط§ظ‹', 'Previously Posted Jobs')}
              icon={<FileText size={20} />}
            >
              <div className="mt-2 flex max-h-[400px] flex-col gap-2 overflow-auto">
                {jobs.map((job: any) => (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 rounded-xl bg-[#f0f1ee] p-3 transition-all hover:bg-[#ebede9]"
                  >
                    <div className={cn('h-2 w-2 flex-shrink-0 rounded-full', job.status === 'active' ? 'bg-[#1ba442]' : 'bg-[#f59e0b]')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#0e0f0c] truncate">{isRTL ? job.titleAr : job.title}</p>
                      <p className="text-xs text-[#828782]">{job.location} | {job.type}</p>
                    </div>
                    <button onClick={() => loadJobIntoForm(job)} className="rounded-full p-2 text-[#828782] hover:bg-white hover:text-[#0e0f0c] transition-colors" title={t('نسخ', 'Duplicate')}>
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
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-[#9fe870]" />
              </div>
            ) : (
              jobs.map((job: any) => (
                <div
                  key={job.id}
                  className="flex items-center gap-4 rounded-2xl bg-[#f0f1ee] p-4 transition-all hover:bg-[#ebede9]"
                >
                  <div className={cn('h-2 w-2 flex-shrink-0 rounded-full', job.status === 'active' ? 'bg-[#1ba442]' : 'bg-[#f59e0b]')} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#0e0f0c]">{job.title}</p>
                    <p className="text-xs text-[#828782]">{job.location} | {job.type} | {job.postedDate}</p>
                  </div>
                  <span className="text-xs font-semibold text-[#5b5e5a]">{job.applicants} {t('ظ…طھظ‚ط¯ظ…', 'applicants')}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewJob(job)}
                      className="rounded-full p-2 text-[#828782] hover:bg-white hover:text-[#0e0f0c] transition-colors"
                      title={t('معاينة', 'Preview')}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => loadJobIntoForm(job)}
                      className="rounded-full p-2 text-[#828782] hover:bg-white hover:text-[#0e0f0c] transition-colors"
                      title={t('نسخ', 'Duplicate')}
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={deleteMutation.isPending}
                      className="rounded-full p-2 text-[#828782] hover:bg-[#FEE2E2] hover:text-[#dc2626] transition-colors disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ContentCard>
      )}

      {previewJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5b5e5a]">
                  {t('معاينة الوظيفة', 'Job Preview')}
                </p>
                <h3 className="mt-1 text-2xl font-black text-[#0e0f0c]">{previewJob.title}</h3>
                <p className="mt-1 text-sm text-[#5b5e5a]">
                  {[previewJob.location, previewJob.type, previewJob.experienceLevel].filter(Boolean).join(' | ')}
                </p>
              </div>
              <button
                onClick={() => setPreviewJob(null)}
                className="rounded-full p-2 text-[#828782] transition-colors hover:bg-[#f0f1ee] hover:text-[#0e0f0c]"
                title={t('إغلاق', 'Close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 space-y-5 text-sm text-[#343633]">
              {previewJob.description && (
                <section>
                  <h4 className="font-bold text-[#0e0f0c]">{t('الوصف', 'Description')}</h4>
                  <p className="mt-2 whitespace-pre-line leading-7">{previewJob.description}</p>
                </section>
              )}

              {Array.isArray(previewJob.requiredSkills) && previewJob.requiredSkills.length > 0 && (
                <section>
                  <h4 className="font-bold text-[#0e0f0c]">{t('المهارات المطلوبة', 'Required Skills')}</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {previewJob.requiredSkills.map((skill: any, index: number) => (
                      <span key={`${typeof skill === 'string' ? skill : skill?.name || 'skill'}-${index}`} className="rounded-full bg-[#e8fbd0] px-3 py-1 text-xs font-semibold text-[#0e0f0c]">
                        {typeof skill === 'string' ? skill : skill?.name || skill?.skill || t('مهارة', 'Skill')}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {Array.isArray(previewJob.benefits) && previewJob.benefits.length > 0 && (
                <section>
                  <h4 className="font-bold text-[#0e0f0c]">{t('المزايا', 'Benefits')}</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {previewJob.benefits.map((benefit: string, index: number) => (
                      <span key={`${benefit}-${index}`} className="rounded-full bg-[#f0f1ee] px-3 py-1 text-xs font-semibold text-[#5b5e5a]">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  )
}

