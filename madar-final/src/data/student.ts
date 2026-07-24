export interface StudentProfile {
  nameAr: string;
  nameEn: string;
  universityAr: string;
  universityEn: string;
  collegeAr: string;
  collegeEn: string;
  departmentAr: string;
  departmentEn: string;
  gpa: number;
  year: number;
  yearLabelAr: string;
  yearLabelEn: string;
  projectsCount: number;
  skillsCount: number;
  certificationsCount: number;
  email: string;
  phone: string;
  locationAr: string;
  locationEn: string;
  bioAr: string;
  bioEn: string;
  avatar: string;
  expectedGraduation: string;
}

export const studentProfile: StudentProfile = {
  nameAr: 'أحمد محمد',
  nameEn: 'Ahmed Mohammed',
  universityAr: 'جامعة الملك سعود',
  universityEn: 'King Saud University',
  collegeAr: 'علوم الحاسب',
  collegeEn: 'Computer Science',
  departmentAr: 'هندسة البرمجيات',
  departmentEn: 'Software Engineering',
  gpa: 3.6,
  year: 4,
  yearLabelAr: 'السنة الرابعة',
  yearLabelEn: '4th Year',
  projectsCount: 5,
  skillsCount: 15,
  certificationsCount: 3,
  email: 'ahmed.mohammed@ksu.edu.sa',
  phone: '+966 50 123 4567',
  locationAr: 'الرياض، المملكة العربية السعودية',
  locationEn: 'Riyadh, Saudi Arabia',
  bioAr: 'طالب هندسة برمجيات متحمس مع خبرة في تطوير الويب والتطبيقات. أبحث عن فرصة للتدريب العملي في بيئة تقنية مبتكرة.',
  bioEn: 'Passionate software engineering student with experience in web and app development. Seeking a hands-on internship opportunity in an innovative tech environment.',
  avatar: '/avatar-student.jpg',
  expectedGraduation: 'يونيو 2026',
};

export interface Job {
  id: string;
  titleAr: string;
  titleEn: string;
  companyAr: string;
  companyEn: string;
  locationAr: string;
  locationEn: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  type: string;
  matchScore: number;
  skills: string[];
  salaryMin: number;
  salaryMax: number;
  postedDate: string;
  descriptionAr: string;
  descriptionEn: string;
  experienceLevel: string;
  bookmarked: boolean;
}

export const jobs: Job[] = [
  {
    id: '1',
    titleAr: 'مطور واجهات أمامية',
    titleEn: 'Frontend Developer',
    companyAr: 'شركة تك سول',
    companyEn: 'TechSol',
    locationAr: 'الرياض',
    locationEn: 'Riyadh',
    locationType: 'hybrid',
    type: 'Full-time',
    matchScore: 92,
    skills: ['React', 'TypeScript', 'Tailwind CSS'],
    salaryMin: 12000,
    salaryMax: 18000,
    postedDate: '2026-01-14',
    descriptionAr: 'تطوير واجهات المستخدم باستخدام React وTypeScript',
    descriptionEn: 'Develop user interfaces using React and TypeScript',
    experienceLevel: 'Junior (1-3 years)',
    bookmarked: false,
  },
  {
    id: '2',
    titleAr: 'مطور باك إند',
    titleEn: 'Backend Developer',
    companyAr: 'شركة نجمة التقنية',
    companyEn: 'Najma Tech',
    locationAr: 'جدة',
    locationEn: 'Jeddah',
    locationType: 'onsite',
    type: 'Full-time',
    matchScore: 85,
    skills: ['Node.js', 'Python', 'PostgreSQL'],
    salaryMin: 15000,
    salaryMax: 22000,
    postedDate: '2026-01-12',
    descriptionAr: 'بناء وصيانة APIs وقواعد البيانات',
    descriptionEn: 'Build and maintain APIs and databases',
    experienceLevel: 'Mid-level (3-5 years)',
    bookmarked: true,
  },
  {
    id: '3',
    titleAr: 'مهندس تعلم آلي',
    titleEn: 'ML Engineer',
    companyAr: 'ذكاء للحلول الذكية',
    companyEn: 'Thaka AI',
    locationAr: 'الرياض',
    locationEn: 'Riyadh',
    locationType: 'remote',
    type: 'Full-time',
    matchScore: 78,
    skills: ['Python', 'TensorFlow', 'ML'],
    salaryMin: 18000,
    salaryMax: 28000,
    postedDate: '2026-01-10',
    descriptionAr: 'تطوير نماذج تعلم آلي للتطبيقات العملية',
    descriptionEn: 'Develop machine learning models for practical applications',
    experienceLevel: 'Senior (5+ years)',
    bookmarked: false,
  },
  {
    id: '4',
    titleAr: 'مطور تطبيقات الجوال',
    titleEn: 'Mobile Developer',
    companyAr: 'تطبيقات المستقبل',
    companyEn: 'Future Apps',
    locationAr: 'الدمام',
    locationEn: 'Dhahran',
    locationType: 'hybrid',
    type: 'Full-time',
    matchScore: 72,
    skills: ['Flutter', 'Dart', 'Firebase'],
    salaryMin: 13000,
    salaryMax: 20000,
    postedDate: '2026-01-08',
    descriptionAr: 'تطوير تطبيقات الجوال باستخدام Flutter',
    descriptionEn: 'Develop mobile applications using Flutter',
    experienceLevel: 'Junior (1-3 years)',
    bookmarked: false,
  },
  {
    id: '5',
    titleAr: 'مهندس دوكس',
    titleEn: 'DevOps Engineer',
    companyAr: 'سحابة العرب',
    companyEn: 'Arab Cloud',
    locationAr: 'الرياض',
    locationEn: 'Riyadh',
    locationType: 'onsite',
    type: 'Full-time',
    matchScore: 65,
    skills: ['Docker', 'Kubernetes', 'AWS'],
    salaryMin: 16000,
    salaryMax: 25000,
    postedDate: '2026-01-06',
    descriptionAr: 'إدارة البنية التحتية والنشر المستمر',
    descriptionEn: 'Manage infrastructure and continuous deployment',
    experienceLevel: 'Mid-level (3-5 years)',
    bookmarked: true,
  },
  {
    id: '6',
    titleAr: 'مطور فول ستاك',
    titleEn: 'Full Stack Developer',
    companyAr: 'حلول رقمية',
    companyEn: 'Digital Solutions',
    locationAr: 'مكة',
    locationEn: 'Makkah',
    locationType: 'remote',
    type: 'Contract',
    matchScore: 88,
    skills: ['React', 'Node.js', 'MongoDB'],
    salaryMin: 14000,
    salaryMax: 21000,
    postedDate: '2026-01-04',
    descriptionAr: 'تطوير تطبيقات ويب كاملة من الواجهة للخادم',
    descriptionEn: 'Develop full web applications from frontend to backend',
    experienceLevel: 'Mid-level (3-5 years)',
    bookmarked: false,
  },
  {
    id: '7',
    titleAr: 'محلل بيانات',
    titleEn: 'Data Analyst',
    companyAr: 'بيانات الذكية',
    companyEn: 'Smart Data',
    locationAr: 'الرياض',
    locationEn: 'Riyadh',
    locationType: 'hybrid',
    type: 'Full-time',
    matchScore: 58,
    skills: ['SQL', 'Python', 'Tableau'],
    salaryMin: 11000,
    salaryMax: 17000,
    postedDate: '2026-01-02',
    descriptionAr: 'تحليل البيانات وإنشاء تقارير تنفيذية',
    descriptionEn: 'Analyze data and create executive reports',
    experienceLevel: 'Entry-level (0-1 years)',
    bookmarked: false,
  },
  {
    id: '8',
    titleAr: 'مهندس أمن سيبراني',
    titleEn: 'Cybersecurity Engineer',
    companyAr: 'درع رقمي',
    companyEn: 'Digital Shield',
    locationAr: 'جدة',
    locationEn: 'Jeddah',
    locationType: 'onsite',
    type: 'Full-time',
    matchScore: 45,
    skills: ['Network Security', 'Python', 'Linux'],
    salaryMin: 17000,
    salaryMax: 26000,
    postedDate: '2025-12-28',
    descriptionAr: 'حماية الأنظمة والشبكات من التهديدات السيبرانية',
    descriptionEn: 'Protect systems and networks from cyber threats',
    experienceLevel: 'Senior (5+ years)',
    bookmarked: false,
  },
];

export interface SkillGap {
  skill: string;
  currentLevel: number;
  marketLevel: number;
  category: string;
}

export const skillGaps: SkillGap[] = [
  { skill: 'Docker', currentLevel: 30, marketLevel: 80, category: 'DevOps' },
  { skill: 'AWS', currentLevel: 20, marketLevel: 75, category: 'Cloud' },
  { skill: 'TypeScript', currentLevel: 60, marketLevel: 90, category: 'Frontend' },
  { skill: 'Python', currentLevel: 45, marketLevel: 85, category: 'Backend' },
  { skill: 'SQL', currentLevel: 50, marketLevel: 80, category: 'Data' },
  { skill: 'Machine Learning', currentLevel: 25, marketLevel: 70, category: 'AI' },
];

export interface Application {
  id: string;
  jobId: string;
  jobTitleAr: string;
  jobTitleEn: string;
  companyAr: string;
  companyEn: string;
  status: 'submitted' | 'in-review' | 'interview' | 'accepted' | 'rejected';
  appliedDate: string;
  matchScore: number;
  timeline: { stage: string; date: string; completed: boolean }[];
}

export const applications: Application[] = [
  {
    id: '1',
    jobId: '1',
    jobTitleAr: 'مطور واجهات أمامية',
    jobTitleEn: 'Frontend Developer',
    companyAr: 'شركة تك سول',
    companyEn: 'TechSol',
    status: 'in-review',
    appliedDate: '2026-01-14',
    matchScore: 92,
    timeline: [
      { stage: 'Submitted', date: '2026-01-14', completed: true },
      { stage: 'In Review', date: '2026-01-16', completed: true },
      { stage: 'Interview', date: '', completed: false },
      { stage: 'Accepted', date: '', completed: false },
    ],
  },
  {
    id: '2',
    jobId: '2',
    jobTitleAr: 'مطور باك إند',
    jobTitleEn: 'Backend Developer',
    companyAr: 'شركة نجمة التقنية',
    companyEn: 'Najma Tech',
    status: 'interview',
    appliedDate: '2026-01-10',
    matchScore: 85,
    timeline: [
      { stage: 'Submitted', date: '2026-01-10', completed: true },
      { stage: 'In Review', date: '2026-01-12', completed: true },
      { stage: 'Interview', date: '2026-01-20', completed: true },
      { stage: 'Accepted', date: '', completed: false },
    ],
  },
  {
    id: '3',
    jobId: '3',
    jobTitleAr: 'مهندس تعلم آلي',
    jobTitleEn: 'ML Engineer',
    companyAr: 'ذكاء للحلول الذكية',
    companyEn: 'Thaka AI',
    status: 'submitted',
    appliedDate: '2026-01-15',
    matchScore: 78,
    timeline: [
      { stage: 'Submitted', date: '2026-01-15', completed: true },
      { stage: 'In Review', date: '', completed: false },
      { stage: 'Interview', date: '', completed: false },
      { stage: 'Accepted', date: '', completed: false },
    ],
  },
  {
    id: '4',
    jobId: '5',
    jobTitleAr: 'مهندس دوكس',
    jobTitleEn: 'DevOps Engineer',
    companyAr: 'سحابة العرب',
    companyEn: 'Arab Cloud',
    status: 'accepted',
    appliedDate: '2026-01-05',
    matchScore: 65,
    timeline: [
      { stage: 'Submitted', date: '2026-01-05', completed: true },
      { stage: 'In Review', date: '2026-01-07', completed: true },
      { stage: 'Interview', date: '2026-01-12', completed: true },
      { stage: 'Accepted', date: '2026-01-18', completed: true },
    ],
  },
  {
    id: '5',
    jobId: '6',
    jobTitleAr: 'مطور فول ستاك',
    jobTitleEn: 'Full Stack Developer',
    companyAr: 'حلول رقمية',
    companyEn: 'Digital Solutions',
    status: 'rejected',
    appliedDate: '2026-01-08',
    matchScore: 88,
    timeline: [
      { stage: 'Submitted', date: '2026-01-08', completed: true },
      { stage: 'In Review', date: '2026-01-10', completed: true },
      { stage: 'Interview', date: '', completed: false },
      { stage: 'Accepted', date: '', completed: false },
    ],
  },
  {
    id: '6',
    jobId: '1',
    jobTitleAr: 'مطور واجهات أمامية',
    jobTitleEn: 'Frontend Developer',
    companyAr: 'شركة تك سول',
    companyEn: 'TechSol',
    status: 'submitted',
    appliedDate: '2026-01-16',
    matchScore: 92,
    timeline: [
      { stage: 'Submitted', date: '2026-01-16', completed: true },
      { stage: 'In Review', date: '', completed: false },
      { stage: 'Interview', date: '', completed: false },
      { stage: 'Accepted', date: '', completed: false },
    ],
  },
  {
    id: '7',
    jobId: '4',
    jobTitleAr: 'مطور تطبيقات الجوال',
    jobTitleEn: 'Mobile Developer',
    companyAr: 'تطبيقات المستقبل',
    companyEn: 'Future Apps',
    status: 'in-review',
    appliedDate: '2026-01-11',
    matchScore: 72,
    timeline: [
      { stage: 'Submitted', date: '2026-01-11', completed: true },
      { stage: 'In Review', date: '2026-01-14', completed: true },
      { stage: 'Interview', date: '', completed: false },
      { stage: 'Accepted', date: '', completed: false },
    ],
  },
  {
    id: '8',
    jobId: '7',
    jobTitleAr: 'محلل بيانات',
    jobTitleEn: 'Data Analyst',
    companyAr: 'بيانات الذكية',
    companyEn: 'Smart Data',
    status: 'in-review',
    appliedDate: '2026-01-09',
    matchScore: 58,
    timeline: [
      { stage: 'Submitted', date: '2026-01-09', completed: true },
      { stage: 'In Review', date: '2026-01-13', completed: true },
      { stage: 'Interview', date: '', completed: false },
      { stage: 'Accepted', date: '', completed: false },
    ],
  },
  {
    id: '9',
    jobId: '2',
    jobTitleAr: 'مطور باك إند',
    jobTitleEn: 'Backend Developer',
    companyAr: 'شركة نجمة التقنية',
    companyEn: 'Najma Tech',
    status: 'submitted',
    appliedDate: '2026-01-17',
    matchScore: 85,
    timeline: [
      { stage: 'Submitted', date: '2026-01-17', completed: true },
      { stage: 'In Review', date: '', completed: false },
      { stage: 'Interview', date: '', completed: false },
      { stage: 'Accepted', date: '', completed: false },
    ],
  },
  {
    id: '10',
    jobId: '3',
    jobTitleAr: 'مهندس تعلم آلي',
    jobTitleEn: 'ML Engineer',
    companyAr: 'ذكاء للحلول الذكية',
    companyEn: 'Thaka AI',
    status: 'interview',
    appliedDate: '2026-01-06',
    matchScore: 78,
    timeline: [
      { stage: 'Submitted', date: '2026-01-06', completed: true },
      { stage: 'In Review', date: '2026-01-08', completed: true },
      { stage: 'Interview', date: '2026-01-19', completed: true },
      { stage: 'Accepted', date: '', completed: false },
    ],
  },
  {
    id: '11',
    jobId: '5',
    jobTitleAr: 'مهندس دوكس',
    jobTitleEn: 'DevOps Engineer',
    companyAr: 'سحابة العرب',
    companyEn: 'Arab Cloud',
    status: 'rejected',
    appliedDate: '2025-12-20',
    matchScore: 65,
    timeline: [
      { stage: 'Submitted', date: '2025-12-20', completed: true },
      { stage: 'In Review', date: '2025-12-25', completed: true },
      { stage: 'Interview', date: '', completed: false },
      { stage: 'Accepted', date: '', completed: false },
    ],
  },
  {
    id: '12',
    jobId: '6',
    jobTitleAr: 'مطور فول ستاك',
    jobTitleEn: 'Full Stack Developer',
    companyAr: 'حلول رقمية',
    companyEn: 'Digital Solutions',
    status: 'submitted',
    appliedDate: '2026-01-15',
    matchScore: 88,
    timeline: [
      { stage: 'Submitted', date: '2026-01-15', completed: true },
      { stage: 'In Review', date: '', completed: false },
      { stage: 'Interview', date: '', completed: false },
      { stage: 'Accepted', date: '', completed: false },
    ],
  },
];

export interface MarketTrend {
  month: string;
  monthAr: string;
  demand: number;
  supply: number;
  yourSkills: number;
}

export const marketTrends: MarketTrend[] = [
  { month: 'Jan', monthAr: 'يناير', demand: 65, supply: 40, yourSkills: 55 },
  { month: 'Feb', monthAr: 'فبراير', demand: 68, supply: 42, yourSkills: 58 },
  { month: 'Mar', monthAr: 'مارس', demand: 72, supply: 45, yourSkills: 60 },
  { month: 'Apr', monthAr: 'أبريل', demand: 70, supply: 48, yourSkills: 62 },
  { month: 'May', monthAr: 'مايو', demand: 75, supply: 50, yourSkills: 63 },
  { month: 'Jun', monthAr: 'يونيو', demand: 78, supply: 52, yourSkills: 65 },
  { month: 'Jul', monthAr: 'يوليو', demand: 82, supply: 55, yourSkills: 67 },
  { month: 'Aug', monthAr: 'أغسطس', demand: 80, supply: 58, yourSkills: 68 },
  { month: 'Sep', monthAr: 'سبتمبر', demand: 85, supply: 60, yourSkills: 70 },
  { month: 'Oct', monthAr: 'أكتوبر', demand: 88, supply: 62, yourSkills: 72 },
  { month: 'Nov', monthAr: 'نوفمبر', demand: 90, supply: 65, yourSkills: 74 },
  { month: 'Dec', monthAr: 'ديسمبر', demand: 92, supply: 68, yourSkills: 76 },
];

export interface AIInsight {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  type: 'skill' | 'job' | 'trend' | 'learning';
}

export const aiInsights: AIInsight[] = [
  {
    id: '1',
    titleAr: 'مهارة مطلوبة: Docker',
    titleEn: 'In-Demand Skill: Docker',
    descriptionAr: '80% من الوظائف المطروحة تتطلب خبرة في Docker. يوصى بأخذ دورة تدريبية لتعلمها.',
    descriptionEn: '80% of posted jobs require Docker experience. Consider taking a training course.',
    type: 'skill',
  },
  {
    id: '2',
    titleAr: 'وظيفة مناسبة لك',
    titleEn: 'Perfect Match Job',
    descriptionAr: 'وظيفة مطور واجهات أمامية في تك سول تطابق ملفك بنسبة 92%. قدم الآن!',
    descriptionEn: 'Frontend Developer at TechSol matches your profile at 92%. Apply now!',
    type: 'job',
  },
  {
    id: '3',
    titleAr: 'اتجاه السوق: TypeScript',
    titleEn: 'Market Trend: TypeScript',
    descriptionAr: 'طلب TypeScript في ازدياد بنسبة 35% هذا الربع. تعتبر مهارة قيمة للتعلم.',
    descriptionEn: 'TypeScript demand is up 35% this quarter. A valuable skill to learn.',
    type: 'trend',
  },
];

export interface LearningResource {
  id: string;
  nameAr: string;
  nameEn: string;
  providerAr: string;
  providerEn: string;
  duration: string;
  durationAr: string;
  skills: string[];
  url: string;
  type: 'course' | 'tutorial' | 'book';
}

export const learningResources: LearningResource[] = [
  {
    id: '1',
    nameAr: 'Docker للمبتدئين',
    nameEn: 'Docker for Beginners',
    providerAr: 'كورسيرا',
    providerEn: 'Coursera',
    duration: '4 weeks',
    durationAr: '4 أسابيع',
    skills: ['Docker', 'DevOps'],
    url: '#',
    type: 'course',
  },
  {
    id: '2',
    nameAr: 'TypeScript المتقدم',
    nameEn: 'Advanced TypeScript',
    providerAr: 'يوديمي',
    providerEn: 'Udemy',
    duration: '6 weeks',
    durationAr: '6 أسابيع',
    skills: ['TypeScript', 'Frontend'],
    url: '#',
    type: 'course',
  },
  {
    id: '3',
    nameAr: 'تعلم الآلي العملي',
    nameEn: 'Practical Machine Learning',
    providerAr: 'إدراك',
    providerEn: 'Edraak',
    duration: '8 weeks',
    durationAr: '8 أسابيع',
    skills: ['Python', 'ML', 'TensorFlow'],
    url: '#',
    type: 'course',
  },
  {
    id: '4',
    nameAr: 'AWS Cloud Practitioner',
    nameEn: 'AWS Cloud Practitioner',
    providerAr: 'أكاديمية AWS',
    providerEn: 'AWS Academy',
    duration: '10 weeks',
    durationAr: '10 أسابيع',
    skills: ['AWS', 'Cloud'],
    url: '#',
    type: 'course',
  },
];

export interface Skill {
  name: string;
  level: 'expert' | 'advanced' | 'intermediate' | 'beginner';
  category: string;
}

export const skills: Skill[] = [
  { name: 'React', level: 'advanced', category: 'Frontend' },
  { name: 'TypeScript', level: 'intermediate', category: 'Frontend' },
  { name: 'Tailwind CSS', level: 'advanced', category: 'Frontend' },
  { name: 'HTML/CSS', level: 'expert', category: 'Frontend' },
  { name: 'JavaScript', level: 'advanced', category: 'Frontend' },
  { name: 'Node.js', level: 'intermediate', category: 'Backend' },
  { name: 'Python', level: 'intermediate', category: 'Backend' },
  { name: 'PostgreSQL', level: 'intermediate', category: 'Backend' },
  { name: 'MongoDB', level: 'beginner', category: 'Backend' },
  { name: 'Express.js', level: 'intermediate', category: 'Backend' },
  { name: 'Git', level: 'advanced', category: 'Tools' },
  { name: 'Figma', level: 'intermediate', category: 'Tools' },
  { name: 'VS Code', level: 'expert', category: 'Tools' },
  { name: 'Jest', level: 'beginner', category: 'Tools' },
  { name: 'REST APIs', level: 'intermediate', category: 'Backend' },
];

export interface Project {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  technologies: string[];
  link: string;
  github: string;
  date: string;
}

export const projects: Project[] = [
  {
    id: '1',
    titleAr: 'منصة التجارة الإلكترونية',
    titleEn: 'E-Commerce Platform',
    descriptionAr: 'منصة كاملة للتجارة الإلكترونية مع لوحة تحكم ونظام دفع',
    descriptionEn: 'Full e-commerce platform with admin dashboard and payment system',
    technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
    link: '#',
    github: '#',
    date: '2025-12',
  },
  {
    id: '2',
    titleAr: 'تطبيق إدارة المهام',
    titleEn: 'Task Management App',
    descriptionAr: 'تطبيق ويب لتنظيم وإدارة المهام مع ميزات التعاون',
    descriptionEn: 'Web app for organizing and managing tasks with collaboration features',
    technologies: ['React', 'TypeScript', 'Firebase'],
    link: '#',
    github: '#',
    date: '2025-10',
  },
  {
    id: '3',
    titleAr: 'نظام توصية بالذكاء الاصطناعي',
    titleEn: 'AI Recommendation System',
    descriptionAr: 'نظام توصية للمنتجات باستخدام التعلم الآلي',
    descriptionEn: 'Product recommendation system using machine learning',
    technologies: ['Python', 'TensorFlow', 'Flask'],
    link: '#',
    github: '#',
    date: '2025-08',
  },
  {
    id: '4',
    titleAr: 'موقع شخصي',
    titleEn: 'Personal Portfolio',
    descriptionAr: 'موقع شخصي لتقديم المشاريع والمهارات',
    descriptionEn: 'Personal website to showcase projects and skills',
    technologies: ['Next.js', 'Tailwind CSS'],
    link: '#',
    github: '#',
    date: '2025-06',
  },
  {
    id: '5',
    titleAr: 'واجهة برمجة الطقس',
    titleEn: 'Weather API',
    descriptionAr: 'واجهة برمجة تطبيقات للحصول على بيانات الطقس',
    descriptionEn: 'API for retrieving weather data',
    technologies: ['Node.js', 'Express', 'OpenWeatherMap API'],
    link: '#',
    github: '#',
    date: '2025-04',
  },
];

export interface Certification {
  id: string;
  nameAr: string;
  nameEn: string;
  issuerAr: string;
  issuerEn: string;
  date: string;
  credentialId: string;
  url: string;
}

export const certifications: Certification[] = [
  {
    id: '1',
    nameAr: 'React Developer',
    nameEn: 'React Developer',
    issuerAr: 'Meta',
    issuerEn: 'Meta',
    date: '2025-11',
    credentialId: 'META-REACT-2025-8842',
    url: '#',
  },
  {
    id: '2',
    nameAr: 'JavaScript Algorithms',
    nameEn: 'JavaScript Algorithms',
    issuerAr: 'freeCodeCamp',
    issuerEn: 'freeCodeCamp',
    date: '2025-09',
    credentialId: 'FCC-JS-ALGO-7621',
    url: '#',
  },
  {
    id: '3',
    nameAr: 'AWS Cloud Foundations',
    nameEn: 'AWS Cloud Foundations',
    issuerAr: 'Amazon Web Services',
    issuerEn: 'Amazon Web Services',
    date: '2025-07',
    credentialId: 'AWS-CF-2025-5510',
    url: '#',
  },
];

export interface RadarSkill {
  subject: string;
  subjectAr: string;
  yourSkills: number;
  marketDemand: number;
  fullMark: number;
}

export const radarSkills: RadarSkill[] = [
  { subject: 'React', subjectAr: 'رياكت', yourSkills: 85, marketDemand: 90, fullMark: 100 },
  { subject: 'Python', subjectAr: 'بايثون', yourSkills: 45, marketDemand: 85, fullMark: 100 },
  { subject: 'ML', subjectAr: 'تعلم آلي', yourSkills: 25, marketDemand: 75, fullMark: 100 },
  { subject: 'Docker', subjectAr: 'دوكر', yourSkills: 30, marketDemand: 80, fullMark: 100 },
  { subject: 'AWS', subjectAr: 'AWS', yourSkills: 20, marketDemand: 78, fullMark: 100 },
  { subject: 'TypeScript', subjectAr: 'تايب سكريبت', yourSkills: 60, marketDemand: 88, fullMark: 100 },
  { subject: 'Node.js', subjectAr: 'نود جي أس', yourSkills: 70, marketDemand: 82, fullMark: 100 },
  { subject: 'SQL', subjectAr: 'SQL', yourSkills: 50, marketDemand: 80, fullMark: 100 },
];

export interface CareerPath {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  readiness: number;
  skillsNeeded: string[];
}

export const careerPaths: CareerPath[] = [
  {
    id: '1',
    titleAr: 'مطور واجهات أمامية متقدم',
    titleEn: 'Senior Frontend Developer',
    descriptionAr: 'مسار مهني يركز على تطوير واجهات المستخدم المتقدمة مع خبرة عميقة في React والأدوات الحديثة.',
    descriptionEn: 'Career path focusing on advanced UI development with deep React and modern tooling expertise.',
    readiness: 85,
    skillsNeeded: ['React', 'TypeScript', 'Next.js'],
  },
  {
    id: '2',
    titleAr: 'مطور فول ستاك',
    titleEn: 'Full Stack Developer',
    descriptionAr: 'مسار شامل يغطي تطوير الواجهات الأمامية والخلفية مع القدرة على بناء تطبيقات كاملة.',
    descriptionEn: 'Comprehensive path covering both frontend and backend development with full application building capability.',
    readiness: 72,
    skillsNeeded: ['Node.js', 'React', 'Database'],
  },
  {
    id: '3',
    titleAr: 'مهندس ذكاء اصطناعي',
    titleEn: 'AI Engineer',
    descriptionAr: 'مسار متخصص في تطوير نماذج التعلم الآلي وحلول الذكاء الاصطناعي.',
    descriptionEn: 'Specialized path in developing machine learning models and AI solutions.',
    readiness: 45,
    skillsNeeded: ['Python', 'ML', 'TensorFlow'],
  },
];

export const dashboardMetrics = {
  matchScore: { value: 85, trend: 12, trendLabelAr: 'هذا الشهر', trendLabelEn: 'this month' },
  applications: { value: 12, trend: 3, trendLabelAr: 'جديد', trendLabelEn: 'new' },
  skills: { value: 15, trend: 2, trendLabelAr: 'مضاف حديثاً', trendLabelEn: 'recently added' },
  profileViews: { value: 48, trend: 18, trendLabelAr: 'هذا الأسبوع', trendLabelEn: 'this week' },
};
