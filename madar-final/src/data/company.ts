export interface CompanyProfile {
  name: string;
  nameAr: string;
  size: string;
  location: string;
  industry: string;
}

export const companyProfile: CompanyProfile = {
  name: 'TechSol',
  nameAr: 'شركة تك سول',
  size: '250 employees',
  location: 'Riyadh',
  industry: 'Software',
};

export interface Job {
  id: string;
  title: string;
  titleAr: string;
  location: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  type: string;
  department: string;
  status: 'active' | 'closing-soon' | 'draft';
  postedDate: string;
  applicants: number;
  inReview: number;
  interviews: number;
  accepted: number;
  experienceLevel: string;
  salaryMin: number;
  salaryMax: number;
}

export const jobs: Job[] = [
  {
    id: '1',
    title: 'Frontend Developer',
    titleAr: 'مطور واجهات أمامية',
    location: 'Riyadh',
    locationType: 'onsite',
    type: 'Full-time',
    department: 'Engineering',
    status: 'active',
    postedDate: '2026-01-10',
    applicants: 12,
    inReview: 5,
    interviews: 2,
    accepted: 1,
    experienceLevel: 'Mid-level (3-5 years)',
    salaryMin: 15000,
    salaryMax: 22000,
  },
  {
    id: '2',
    title: 'ML Engineer',
    titleAr: 'مهندس تعلم آلي',
    location: 'Riyadh',
    locationType: 'hybrid',
    type: 'Full-time',
    department: 'Engineering',
    status: 'active',
    postedDate: '2026-01-08',
    applicants: 8,
    inReview: 4,
    interviews: 1,
    accepted: 0,
    experienceLevel: 'Senior (5+ years)',
    salaryMin: 20000,
    salaryMax: 30000,
  },
  {
    id: '3',
    title: 'Full Stack Developer',
    titleAr: 'مطور فول ستاك',
    location: 'Riyadh',
    locationType: 'hybrid',
    type: 'Full-time',
    department: 'Engineering',
    status: 'active',
    postedDate: '2026-01-05',
    applicants: 15,
    inReview: 7,
    interviews: 3,
    accepted: 1,
    experienceLevel: 'Mid-level (3-5 years)',
    salaryMin: 16000,
    salaryMax: 24000,
  },
  {
    id: '4',
    title: 'DevOps Engineer',
    titleAr: 'مهندس ديف أوبس',
    location: 'Riyadh',
    locationType: 'remote',
    type: 'Full-time',
    department: 'Engineering',
    status: 'active',
    postedDate: '2026-01-03',
    applicants: 6,
    inReview: 3,
    interviews: 1,
    accepted: 0,
    experienceLevel: 'Senior (5+ years)',
    salaryMin: 18000,
    salaryMax: 26000,
  },
  {
    id: '5',
    title: 'Backend Developer',
    titleAr: 'مطور باك إند',
    location: 'Riyadh',
    locationType: 'onsite',
    type: 'Full-time',
    department: 'Engineering',
    status: 'closing-soon',
    postedDate: '2025-12-20',
    applicants: 10,
    inReview: 6,
    interviews: 2,
    accepted: 1,
    experienceLevel: 'Junior (1-3 years)',
    salaryMin: 12000,
    salaryMax: 18000,
  },
  {
    id: '6',
    title: 'Mobile Developer',
    titleAr: 'مطور تطبيقات الجوال',
    location: 'Riyadh',
    locationType: 'hybrid',
    type: 'Full-time',
    department: 'Engineering',
    status: 'active',
    postedDate: '2026-01-12',
    applicants: 5,
    inReview: 2,
    interviews: 1,
    accepted: 0,
    experienceLevel: 'Mid-level (3-5 years)',
    salaryMin: 15000,
    salaryMax: 22000,
  },
];

export interface Candidate {
  id: string;
  name: string;
  nameAr: string;
  matchScore: number;
  skills: string[];
  university: string;
  universityAr: string;
  major: string;
  majorAr: string;
  gpa: number;
  experience: number;
  appliedJob: string;
  appliedJobId: string;
  status: 'new' | 'in-review' | 'interview' | 'accepted' | 'rejected';
  appliedDate: string;
  email: string;
  phone: string;
  location: string;
  graduationYear: number;
  availability: string;
  languages: string[];
}

export const candidates: Candidate[] = [
  {
    id: '1',
    name: 'Mohammed Al-Salem',
    nameAr: 'محمد السالم',
    matchScore: 94,
    skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    university: 'King Saud University',
    universityAr: 'جامعة الملك سعود',
    major: 'Software Engineering',
    majorAr: 'هندسة البرمجيات',
    gpa: 4.32,
    experience: 3,
    appliedJob: 'Frontend Developer',
    appliedJobId: '1',
    status: 'new',
    appliedDate: '2026-01-14T10:00:00',
    email: 'mohammed.alsalem@email.com',
    phone: '+966 50 123 4567',
    location: 'Riyadh',
    graduationYear: 2023,
    availability: 'Immediate',
    languages: ['Arabic', 'English'],
  },
  {
    id: '2',
    name: 'Fatima Al-Zahrani',
    nameAr: 'فاطمة الزهراني',
    matchScore: 88,
    skills: ['Python', 'TensorFlow', 'ML', 'SQL'],
    university: 'KFUPM',
    universityAr: 'جامعة الملك فهد',
    major: 'Computer Science',
    majorAr: 'علوم الحاسب',
    gpa: 4.15,
    experience: 4,
    appliedJob: 'ML Engineer',
    appliedJobId: '2',
    status: 'in-review',
    appliedDate: '2026-01-14T08:00:00',
    email: 'fatima.zahrani@email.com',
    phone: '+966 50 234 5678',
    location: 'Dhahran',
    graduationYear: 2022,
    availability: '2 weeks',
    languages: ['Arabic', 'English'],
  },
  {
    id: '3',
    name: 'Khaled Al-Omari',
    nameAr: 'خالد العمري',
    matchScore: 85,
    skills: ['React', 'Node.js', 'MongoDB', 'Docker'],
    university: 'King Saud University',
    universityAr: 'جامعة الملك سعود',
    major: 'Information Systems',
    majorAr: 'نظم المعلومات',
    gpa: 3.89,
    experience: 3,
    appliedJob: 'Full Stack Developer',
    appliedJobId: '3',
    status: 'interview',
    appliedDate: '2026-01-13T14:00:00',
    email: 'khaled.omari@email.com',
    phone: '+966 50 345 6789',
    location: 'Riyadh',
    graduationYear: 2023,
    availability: '1 month',
    languages: ['Arabic', 'English'],
  },
  {
    id: '4',
    name: 'Noura Al-Ghamdi',
    nameAr: 'نورة الغامدي',
    matchScore: 79,
    skills: ['Python', 'TensorFlow', 'PyTorch', 'NLP'],
    university: 'Princess Nourah University',
    universityAr: 'جامعة الأميرة نورة',
    major: 'Artificial Intelligence',
    majorAr: 'الذكاء الاصطناعي',
    gpa: 4.5,
    experience: 2,
    appliedJob: 'ML Engineer',
    appliedJobId: '2',
    status: 'new',
    appliedDate: '2026-01-13T09:00:00',
    email: 'noura.ghamdi@email.com',
    phone: '+966 50 456 7890',
    location: 'Riyadh',
    graduationYear: 2024,
    availability: 'Immediate',
    languages: ['Arabic', 'English'],
  },
  {
    id: '5',
    name: 'Abdullah Al-Qahtani',
    nameAr: 'عبدالله القحطاني',
    matchScore: 92,
    skills: ['Node.js', 'React', 'PostgreSQL', 'AWS'],
    university: 'Umm Al-Qura University',
    universityAr: 'جامعة أم القرى',
    major: 'Software Engineering',
    majorAr: 'هندسة البرمجيات',
    gpa: 4.1,
    experience: 4,
    appliedJob: 'Full Stack Developer',
    appliedJobId: '3',
    status: 'in-review',
    appliedDate: '2026-01-12T11:00:00',
    email: 'abdullah.qahtani@email.com',
    phone: '+966 50 567 8901',
    location: 'Makkah',
    graduationYear: 2022,
    availability: '2 weeks',
    languages: ['Arabic', 'English'],
  },
  {
    id: '6',
    name: 'Sara Al-Rashid',
    nameAr: 'سارة الرشيد',
    matchScore: 76,
    skills: ['Docker', 'Kubernetes', 'AWS', 'Terraform'],
    university: 'King Saud University',
    universityAr: 'جامعة الملك سعود',
    major: 'Computer Engineering',
    majorAr: 'هندسة الحاسب',
    gpa: 3.95,
    experience: 5,
    appliedJob: 'DevOps Engineer',
    appliedJobId: '4',
    status: 'new',
    appliedDate: '2026-01-14T15:00:00',
    email: 'sara.rashid@email.com',
    phone: '+966 50 678 9012',
    location: 'Riyadh',
    graduationYear: 2021,
    availability: '1 month',
    languages: ['Arabic', 'English'],
  },
  {
    id: '7',
    name: 'Omar Al-Harbi',
    nameAr: 'عمر الحربي',
    matchScore: 82,
    skills: ['Python', 'Django', 'PostgreSQL', 'Redis'],
    university: 'KFUPM',
    universityAr: 'جامعة الملك فهد',
    major: 'Computer Science',
    majorAr: 'علوم الحاسب',
    gpa: 3.78,
    experience: 2,
    appliedJob: 'Backend Developer',
    appliedJobId: '5',
    status: 'interview',
    appliedDate: '2026-01-11T13:00:00',
    email: 'omar.harbi@email.com',
    phone: '+966 50 789 0123',
    location: 'Dhahran',
    graduationYear: 2024,
    availability: 'Immediate',
    languages: ['Arabic', 'English'],
  },
  {
    id: '8',
    name: 'Layan Al-Mutairi',
    nameAr: 'ليان المطيري',
    matchScore: 90,
    skills: ['React', 'TypeScript', 'Flutter', 'Firebase'],
    university: 'Imam University',
    universityAr: 'جامعة الإمام',
    major: 'Software Engineering',
    majorAr: 'هندسة البرمجيات',
    gpa: 4.22,
    experience: 3,
    appliedJob: 'Mobile Developer',
    appliedJobId: '6',
    status: 'new',
    appliedDate: '2026-01-14T12:00:00',
    email: 'layan.mutairi@email.com',
    phone: '+966 50 890 1234',
    location: 'Riyadh',
    graduationYear: 2023,
    availability: '2 weeks',
    languages: ['Arabic', 'English'],
  },
  {
    id: '9',
    name: 'Youssef Al-Dosari',
    nameAr: 'يوسف الدوسري',
    matchScore: 73,
    skills: ['Java', 'Spring', 'MySQL', 'Docker'],
    university: 'Qassim University',
    universityAr: 'جامعة القصيم',
    major: 'Computer Science',
    majorAr: 'علوم الحاسب',
    gpa: 3.65,
    experience: 1,
    appliedJob: 'Backend Developer',
    appliedJobId: '5',
    status: 'in-review',
    appliedDate: '2026-01-10T09:00:00',
    email: 'youssef.dosari@email.com',
    phone: '+966 50 901 2345',
    location: 'Qassim',
    graduationYear: 2024,
    availability: 'Immediate',
    languages: ['Arabic'],
  },
  {
    id: '10',
    name: 'Reem Al-Shammari',
    nameAr: 'ريم الشمري',
    matchScore: 68,
    skills: ['React', 'Vue.js', 'CSS', 'Figma'],
    university: 'Princess Nourah University',
    universityAr: 'جامعة الأميرة نورة',
    major: 'Information Technology',
    majorAr: 'تقنية المعلومات',
    gpa: 3.88,
    experience: 2,
    appliedJob: 'Frontend Developer',
    appliedJobId: '1',
    status: 'new',
    appliedDate: '2026-01-13T10:00:00',
    email: 'reem.shammari@email.com',
    phone: '+966 50 012 3456',
    location: 'Riyadh',
    graduationYear: 2023,
    availability: '1 month',
    languages: ['Arabic', 'English'],
  },
  {
    id: '11',
    name: 'Fahad Al-Bedah',
    nameAr: 'فهد البيدح',
    matchScore: 95,
    skills: ['Python', 'TensorFlow', 'Deep Learning', 'Computer Vision'],
    university: 'KAUST',
    universityAr: 'جامعة كاوست',
    major: 'Computer Science',
    majorAr: 'علوم الحاسب',
    gpa: 4.65,
    experience: 6,
    appliedJob: 'ML Engineer',
    appliedJobId: '2',
    status: 'accepted',
    appliedDate: '2026-01-08T08:00:00',
    email: 'fahad.bedah@email.com',
    phone: '+966 51 123 4567',
    location: 'Thuwal',
    graduationYear: 2020,
    availability: 'Immediate',
    languages: ['Arabic', 'English'],
  },
  {
    id: '12',
    name: 'Maha Al-Shehri',
    nameAr: 'مها الشهري',
    matchScore: 71,
    skills: ['Docker', 'Jenkins', 'AWS', 'Linux'],
    university: 'Taif University',
    universityAr: 'جامعة الطائف',
    major: 'Computer Engineering',
    majorAr: 'هندسة الحاسب',
    gpa: 3.55,
    experience: 2,
    appliedJob: 'DevOps Engineer',
    appliedJobId: '4',
    status: 'rejected',
    appliedDate: '2026-01-09T11:00:00',
    email: 'maha.shehri@email.com',
    phone: '+966 51 234 5678',
    location: 'Taif',
    graduationYear: 2023,
    availability: '2 weeks',
    languages: ['Arabic', 'English'],
  },
  {
    id: '13',
    name: 'Ahmad Al-Malki',
    nameAr: 'أحمد المالكي',
    matchScore: 87,
    skills: ['React', 'Next.js', 'GraphQL', 'TailwindCSS'],
    university: 'King Abdulaziz University',
    universityAr: 'جامعة الملك عبدالعزيز',
    major: 'Software Engineering',
    majorAr: 'هندسة البرمجيات',
    gpa: 4.05,
    experience: 3,
    appliedJob: 'Frontend Developer',
    appliedJobId: '1',
    status: 'interview',
    appliedDate: '2026-01-11T09:00:00',
    email: 'ahmad.malki@email.com',
    phone: '+966 51 345 6789',
    location: 'Jeddah',
    graduationYear: 2023,
    availability: '1 month',
    languages: ['Arabic', 'English'],
  },
  {
    id: '14',
    name: 'Hind Al-Subaie',
    nameAr: 'هند السبيعي',
    matchScore: 65,
    skills: ['Swift', 'Kotlin', 'Firebase', 'UI/UX'],
    university: 'Imam University',
    universityAr: 'جامعة الإمام',
    major: 'Information Systems',
    majorAr: 'نظم المعلومات',
    gpa: 3.45,
    experience: 1,
    appliedJob: 'Mobile Developer',
    appliedJobId: '6',
    status: 'new',
    appliedDate: '2026-01-14T08:00:00',
    email: 'hind.subaie@email.com',
    phone: '+966 51 456 7890',
    location: 'Riyadh',
    graduationYear: 2024,
    availability: 'Immediate',
    languages: ['Arabic'],
  },
  {
    id: '15',
    name: 'Talal Al-Rashidi',
    nameAr: 'طلال الرشيدي',
    matchScore: 91,
    skills: ['Python', 'Django', 'React', 'PostgreSQL'],
    university: 'Shaqra University',
    universityAr: 'جامعة شقراء',
    major: 'Computer Science',
    majorAr: 'علوم الحاسب',
    gpa: 4.2,
    experience: 5,
    appliedJob: 'Full Stack Developer',
    appliedJobId: '3',
    status: 'in-review',
    appliedDate: '2026-01-12T14:00:00',
    email: 'talal.rashidi@email.com',
    phone: '+966 51 567 8901',
    location: 'Shaqra',
    graduationYear: 2021,
    availability: '2 weeks',
    languages: ['Arabic', 'English'],
  },
];

export interface FunnelStage {
  name: string;
  nameAr: string;
  count: number;
}

export const funnelStages: FunnelStage[] = [
  { name: 'Applied', nameAr: 'المتقدمين', count: 156 },
  { name: 'Reviewed', nameAr: 'قيد المراجعة', count: 89 },
  { name: 'Interviewed', nameAr: 'المقابلات', count: 34 },
  { name: 'Offered', nameAr: 'العروض', count: 12 },
  { name: 'Hired', nameAr: 'المقبولين', count: 8 },
];

export interface MonthlyApplication {
  month: string;
  monthAr: string;
  total: number;
  qualified: number;
  interviews: number;
}

export const monthlyApplications: MonthlyApplication[] = [
  { month: 'Aug', monthAr: 'أغسطس', total: 45, qualified: 22, interviews: 8 },
  { month: 'Sep', monthAr: 'سبتمبر', total: 52, qualified: 28, interviews: 10 },
  { month: 'Oct', monthAr: 'أكتوبر', total: 38, qualified: 18, interviews: 7 },
  { month: 'Nov', monthAr: 'نوفمبر', total: 61, qualified: 35, interviews: 12 },
  { month: 'Dec', monthAr: 'ديسمبر', total: 48, qualified: 25, interviews: 9 },
  { month: 'Jan', monthAr: 'يناير', total: 73, qualified: 42, interviews: 15 },
];

export interface SkillDemand {
  skill: string;
  demand: number;
}

export const topSkills: SkillDemand[] = [
  { skill: 'React', demand: 342 },
  { skill: 'Python', demand: 318 },
  { skill: 'Node.js', demand: 287 },
  { skill: 'TypeScript', demand: 265 },
  { skill: 'AWS', demand: 243 },
  { skill: 'Docker', demand: 198 },
  { skill: 'SQL', demand: 187 },
  { skill: 'TensorFlow', demand: 156 },
  { skill: 'Flutter', demand: 134 },
  { skill: 'Kubernetes', demand: 123 },
];

export interface CandidateSource {
  name: string;
  nameAr: string;
  value: number;
  color: string;
}

export const candidateSources: CandidateSource[] = [
  { name: 'Direct', nameAr: 'مباشر', value: 35, color: '#9fe870' },
  { name: 'University Referral', nameAr: 'إحالة جامعية', value: 25, color: '#3b82f6' },
  { name: 'Platform Search', nameAr: 'البحث في المنصة', value: 20, color: '#a855f7' },
  { name: 'Social Media', nameAr: 'وسائل التواصل', value: 12, color: '#f59e0b' },
  { name: 'Other', nameAr: 'أخرى', value: 8, color: '#ec4899' },
];

export interface TimeToFill {
  jobTitle: string;
  days: number;
  industryAvg: number;
}

export const timeToFillData: TimeToFill[] = [
  { jobTitle: 'Frontend Dev', days: 14, industryAvg: 21 },
  { jobTitle: 'ML Engineer', days: 28, industryAvg: 25 },
  { jobTitle: 'Full Stack', days: 18, industryAvg: 20 },
  { jobTitle: 'DevOps', days: 22, industryAvg: 24 },
  { jobTitle: 'Backend', days: 16, industryAvg: 19 },
  { jobTitle: 'Mobile Dev', days: 20, industryAvg: 22 },
];

export interface Interview {
  id: string;
  candidateName: string;
  candidateNameAr: string;
  jobTitle: string;
  date: string;
  time: string;
  type: 'online' | 'in-person';
}

export const upcomingInterviews: Interview[] = [
  {
    id: '1',
    candidateName: 'Mohammed Al-Salem',
    candidateNameAr: 'محمد السالم',
    jobTitle: 'Frontend Developer',
    date: '2026-01-16',
    time: '10:00 AM',
    type: 'online',
  },
  {
    id: '2',
    candidateName: 'Fatima Al-Zahrani',
    candidateNameAr: 'فاطمة الزهراني',
    jobTitle: 'ML Engineer',
    date: '2026-01-17',
    time: '2:00 PM',
    type: 'in-person',
  },
  {
    id: '3',
    candidateName: 'Noura Al-Ghamdi',
    candidateNameAr: 'نورة الغامدي',
    jobTitle: 'ML Engineer',
    date: '2026-01-18',
    time: '11:00 AM',
    type: 'online',
  },
];

export const recruitmentMetrics = {
  totalJobs: { value: 6, trend: '+2', label: 'Total Jobs', labelAr: 'إجمالي الوظائف' },
  totalApplicants: { value: 48, trend: '+15', label: 'Total Applicants', labelAr: 'إجمالي المتقدمين' },
  hires: { value: 8, trend: '+3', label: 'Hires', labelAr: 'المعينين' },
  avgTimeToFill: { value: 18, trend: '-3 days', label: 'Avg. Days to Fill', labelAr: 'متوسط أيام التوظيف' },
  avgMatchScore: { value: 78, trend: '+3', label: 'Avg. Match Score', labelAr: 'متوسط نسبة التطابق' },
  offerAcceptanceRate: { value: 72, trend: '+5%', label: 'Offer Acceptance Rate', labelAr: 'معدل قبول العروض' },
  acceptanceRate: { value: 72, trend: '+5%', label: 'Acceptance Rate', labelAr: 'معدل القبول' },
};

export const dashboardMetrics = [
  {
    icon: 'Briefcase',
    value: 6,
    trend: '+2',
    label: 'Active Jobs',
    labelAr: 'وظائف نشطة',
    iconBg: '#E7FDD8',
  },
  {
    icon: 'Users',
    value: 48,
    trend: '+15',
    label: 'Total Applicants',
    labelAr: 'إجمالي المتقدمين',
    iconBg: '#DBEAFE',
  },
  {
    icon: 'CheckCircle2',
    value: 72,
    trend: '+5%',
    label: 'Acceptance Rate',
    labelAr: 'معدل القبول',
    iconBg: '#D1FAE5',
  },
  {
    icon: 'TrendingUp',
    value: 78,
    trend: '+3',
    label: 'Avg Match Score',
    labelAr: 'متوسط التطابق',
    iconBg: '#FEF3C7',
  },
];
