// ============================================
// University Mock Data — King Saud University
// ============================================

export interface UniversityProfile {
  nameAr: string;
  nameEn: string;
  totalStudents: number;
  totalColleges: number;
  location: string;
  academicYear: string;
}

export const universityProfile: UniversityProfile = {
  nameAr: 'جامعة الملك سعود',
  nameEn: 'King Saud University',
  totalStudents: 40000,
  totalColleges: 25,
  location: 'Riyadh',
  academicYear: '2024-2025',
};

// ─── Colleges ───

export interface Department {
  id: string;
  nameAr: string;
  nameEn: string;
  studentCount: number;
  coordinator: string;
  coursesCount: number;
  employmentRate: number;
  programs: string[];
}

export interface College {
  id: string;
  nameAr: string;
  nameEn: string;
  dean: string;
  studentCount: number;
  employmentRate: number;
  avgSalary: number;
  graduates: number;
  employed: number;
  activeCompanies: number;
  departments: Department[];
  iconColor: string;
}

export const colleges: College[] = [
  {
    id: 'cs',
    nameAr: 'كلية علوم الحاسب والمعلومات',
    nameEn: 'Computer Science',
    dean: 'Dr. Ahmad Al-Salem',
    studentCount: 520,
    employmentRate: 90,
    avgSalary: 15200,
    graduates: 520,
    employed: 468,
    activeCompanies: 45,
    iconColor: '#3b82f6',
    departments: [
      { id: 'cs-dept', nameAr: 'علوم الحاسب', nameEn: 'Computer Science', studentCount: 180, coordinator: 'Dr. Nasser Al-Harbi', coursesCount: 24, employmentRate: 88, programs: ['Computer Science BS', 'Computer Science MS'] },
      { id: 'se', nameAr: 'هندسة البرمجيات', nameEn: 'Software Engineering', studentCount: 150, coordinator: 'Dr. Fahad Al-Shehri', coursesCount: 22, employmentRate: 92, programs: ['Software Engineering BS'] },
      { id: 'is', nameAr: 'نظم المعلومات', nameEn: 'Information Systems', studentCount: 120, coordinator: 'Dr. Saad Al-Qahtani', coursesCount: 20, employmentRate: 85, programs: ['Information Systems BS'] },
      { id: 'ds', nameAr: 'علم البيانات', nameEn: 'Data Science', studentCount: 70, coordinator: 'Dr. Laila Al-Rashid', coursesCount: 18, employmentRate: 86, programs: ['Data Science BS'] },
    ],
  },
  {
    id: 'eng',
    nameAr: 'كلية الهندسة',
    nameEn: 'Engineering',
    dean: 'Dr. Khalid Al-Omari',
    studentCount: 680,
    employmentRate: 86,
    avgSalary: 14800,
    graduates: 680,
    employed: 585,
    activeCompanies: 52,
    iconColor: '#9fe870',
    departments: [
      { id: 'ee', nameAr: 'الهندسة الكهربائية', nameEn: 'Electrical Engineering', studentCount: 200, coordinator: 'Dr. Waleed Al-Ahmari', coursesCount: 26, employmentRate: 87, programs: ['Electrical Engineering BS'] },
      { id: 'me', nameAr: 'الهندسة الميكانيكية', nameEn: 'Mechanical Engineering', studentCount: 180, coordinator: 'Dr. Bandar Al-Zahrani', coursesCount: 24, employmentRate: 85, programs: ['Mechanical Engineering BS'] },
      { id: 'ce', nameAr: 'الهندسة المدنية', nameEn: 'Civil Engineering', studentCount: 150, coordinator: 'Dr. Turki Al-Shammari', coursesCount: 22, employmentRate: 84, programs: ['Civil Engineering BS'] },
      { id: 'che', nameAr: 'الهندسة الكيميائية', nameEn: 'Chemical Engineering', studentCount: 100, coordinator: 'Dr. Meshari Al-Otaibi', coursesCount: 20, employmentRate: 88, programs: ['Chemical Engineering BS'] },
      { id: 'ie', nameAr: 'الهندسة الصناعية', nameEn: 'Industrial Engineering', studentCount: 50, coordinator: 'Dr. Faisal Al-Dosari', coursesCount: 18, employmentRate: 89, programs: ['Industrial Engineering BS'] },
    ],
  },
  {
    id: 'bus',
    nameAr: 'كلية إدارة الأعمال',
    nameEn: 'Business',
    dean: 'Dr. Fatima Al-Zahrani',
    studentCount: 890,
    employmentRate: 80,
    avgSalary: 11200,
    graduates: 890,
    employed: 712,
    activeCompanies: 60,
    iconColor: '#a855f7',
    departments: [
      { id: 'acc', nameAr: 'المحاسبة', nameEn: 'Accounting', studentCount: 220, coordinator: 'Dr. Maha Al-Saud', coursesCount: 20, employmentRate: 82, programs: ['Accounting BS'] },
      { id: 'fin', nameAr: 'المالية', nameEn: 'Finance', studentCount: 180, coordinator: 'Dr. Ibrahim Al-Rajhi', coursesCount: 20, employmentRate: 81, programs: ['Finance BS', 'Finance MS'] },
      { id: 'mkt', nameAr: 'التسويق', nameEn: 'Marketing', studentCount: 160, coordinator: 'Dr. Norah Al-Tamimi', coursesCount: 18, employmentRate: 78, programs: ['Marketing BS'] },
      { id: 'mgmt', nameAr: 'الإدارة', nameEn: 'Management', studentCount: 200, coordinator: 'Dr. Abdulaziz Al-Jasser', coursesCount: 19, employmentRate: 80, programs: ['Management BS', 'MBA'] },
      { id: 'mis', nameAr: 'نظم المعلومات الإدارية', nameEn: 'MIS', studentCount: 130, coordinator: 'Dr. Hana Al-Olayan', coursesCount: 18, employmentRate: 79, programs: ['MIS BS'] },
    ],
  },
  {
    id: 'med',
    nameAr: 'كلية الطب',
    nameEn: 'Medicine',
    dean: 'Dr. Yasser Al-Farsi',
    studentCount: 320,
    employmentRate: 84,
    avgSalary: 18500,
    graduates: 320,
    employed: 268,
    activeCompanies: 15,
    iconColor: '#f59e0b',
    departments: [
      { id: 'gen-med', nameAr: 'الطب العام', nameEn: 'General Medicine', studentCount: 200, coordinator: 'Dr. Sami Al-Habib', coursesCount: 40, employmentRate: 88, programs: ['MD'] },
      { id: 'surg', nameAr: 'الجراحة', nameEn: 'Surgery', studentCount: 70, coordinator: 'Dr. Hatem Al-Amri', coursesCount: 35, employmentRate: 85, programs: ['Surgery Residency'] },
      { id: 'peds', nameAr: 'طب الأطفال', nameEn: 'Pediatrics', studentCount: 50, coordinator: 'Dr. Manal Al-Sharif', coursesCount: 32, employmentRate: 87, programs: ['Pediatrics Residency'] },
    ],
  },
  {
    id: 'arts',
    nameAr: 'كلية الآداب',
    nameEn: 'Arts',
    dean: 'Dr. Salman Al-Dossary',
    studentCount: 380,
    employmentRate: 70,
    avgSalary: 9500,
    graduates: 380,
    employed: 266,
    activeCompanies: 20,
    iconColor: '#ec4899',
    departments: [
      { id: 'arabic', nameAr: 'اللغة العربية', nameEn: 'Arabic Language', studentCount: 120, coordinator: 'Dr. Bassam Al-Rashid', coursesCount: 20, employmentRate: 65, programs: ['Arabic Literature BA'] },
      { id: 'eng-lit', nameAr: 'الأدب الإنجليزي', nameEn: 'English Literature', studentCount: 100, coordinator: 'Dr. Raymond Thomas', coursesCount: 18, employmentRate: 68, programs: ['English Literature BA'] },
      { id: 'media', nameAr: 'الإعلام', nameEn: 'Media', studentCount: 100, coordinator: 'Dr. Khaled Al-Mutairi', coursesCount: 16, employmentRate: 75, programs: ['Media BA'] },
      { id: 'design', nameAr: 'التصميم', nameEn: 'Design', studentCount: 60, coordinator: 'Dr. Reem Al-Bassam', coursesCount: 18, employmentRate: 78, programs: ['Graphic Design BA'] },
    ],
  },
  {
    id: 'sci',
    nameAr: 'كلية العلوم',
    nameEn: 'Sciences',
    dean: 'Dr. Turki Al-Sultan',
    studentCount: 450,
    employmentRate: 76,
    avgSalary: 10800,
    graduates: 450,
    employed: 342,
    activeCompanies: 30,
    iconColor: '#3b82f6',
    departments: [
      { id: 'math', nameAr: 'الرياضيات', nameEn: 'Mathematics', studentCount: 100, coordinator: 'Dr. Saleh Al-Daher', coursesCount: 20, employmentRate: 74, programs: ['Mathematics BS', 'Mathematics MS'] },
      { id: 'phys', nameAr: 'الفيزياء', nameEn: 'Physics', studentCount: 80, coordinator: 'Dr. Adel Al-Meshari', coursesCount: 22, employmentRate: 72, programs: ['Physics BS'] },
      { id: 'chem', nameAr: 'الكيمياء', nameEn: 'Chemistry', studentCount: 90, coordinator: 'Dr. Huda Al-Arifi', coursesCount: 22, employmentRate: 78, programs: ['Chemistry BS'] },
      { id: 'bio', nameAr: 'الأحياء', nameEn: 'Biology', studentCount: 110, coordinator: 'Dr. Mutaz Al-Marri', coursesCount: 24, employmentRate: 80, programs: ['Biology BS'] },
      { id: 'geo', nameAr: 'الجيولوجيا', nameEn: 'Geology', studentCount: 70, coordinator: 'Dr. Ziyad Al-Shehri', coursesCount: 18, employmentRate: 72, programs: ['Geology BS'] },
    ],
  },
];

// ─── Study Plans ───

export interface StudyPlan {
  id: string;
  nameAr: string;
  nameEn: string;
  collegeId: string;
  departmentId: string;
  degreeType: 'Bachelor' | 'Master' | 'PhD';
  credits: number;
  duration: number;
  coursesCount: number;
  status: 'active' | 'inactive' | 'under-review';
  studentsCount: number;
  graduatesCount: number;
  employmentRate: number;
}

export const studyPlans: StudyPlan[] = [
  { id: 'sp-1', nameAr: 'هندسة البرمجيات', nameEn: 'Software Engineering', collegeId: 'cs', departmentId: 'se', degreeType: 'Bachelor', credits: 135, duration: 4, coursesCount: 45, status: 'active', studentsCount: 150, graduatesCount: 45, employmentRate: 92 },
  { id: 'sp-2', nameAr: 'علوم الحاسب', nameEn: 'Computer Science', collegeId: 'cs', departmentId: 'cs-dept', degreeType: 'Bachelor', credits: 132, duration: 4, coursesCount: 44, status: 'active', studentsCount: 180, graduatesCount: 52, employmentRate: 88 },
  { id: 'sp-3', nameAr: 'علم البيانات', nameEn: 'Data Science', collegeId: 'cs', departmentId: 'ds', degreeType: 'Bachelor', credits: 136, duration: 4, coursesCount: 42, status: 'active', studentsCount: 70, graduatesCount: 18, employmentRate: 85 },
  { id: 'sp-4', nameAr: 'نظم المعلومات', nameEn: 'Information Systems', collegeId: 'cs', departmentId: 'is', degreeType: 'Bachelor', credits: 130, duration: 4, coursesCount: 40, status: 'active', studentsCount: 120, graduatesCount: 38, employmentRate: 83 },
  { id: 'sp-5', nameAr: 'علوم الحاسب', nameEn: 'Computer Science MS', collegeId: 'cs', departmentId: 'cs-dept', degreeType: 'Master', credits: 42, duration: 2, coursesCount: 14, status: 'active', studentsCount: 35, graduatesCount: 12, employmentRate: 90 },
  { id: 'sp-6', nameAr: 'الهندسة الكهربائية', nameEn: 'Electrical Engineering', collegeId: 'eng', departmentId: 'ee', degreeType: 'Bachelor', credits: 140, duration: 4, coursesCount: 48, status: 'active', studentsCount: 200, graduatesCount: 58, employmentRate: 87 },
  { id: 'sp-7', nameAr: 'الهندسة الميكانيكية', nameEn: 'Mechanical Engineering', collegeId: 'eng', departmentId: 'me', degreeType: 'Bachelor', credits: 140, duration: 4, coursesCount: 46, status: 'active', studentsCount: 180, graduatesCount: 52, employmentRate: 85 },
  { id: 'sp-8', nameAr: 'إدارة الأعمال', nameEn: 'MBA', collegeId: 'bus', departmentId: 'mgmt', degreeType: 'Master', credits: 48, duration: 2, coursesCount: 16, status: 'active', studentsCount: 200, graduatesCount: 80, employmentRate: 87 },
  { id: 'sp-9', nameAr: 'المالية', nameEn: 'Finance', collegeId: 'bus', departmentId: 'fin', degreeType: 'Bachelor', credits: 128, duration: 4, coursesCount: 42, status: 'active', studentsCount: 180, graduatesCount: 55, employmentRate: 81 },
  { id: 'sp-10', nameAr: 'المحاسبة', nameEn: 'Accounting', collegeId: 'bus', departmentId: 'acc', degreeType: 'Bachelor', credits: 126, duration: 4, coursesCount: 40, status: 'active', studentsCount: 220, graduatesCount: 70, employmentRate: 82 },
  { id: 'sp-11', nameAr: 'الطب', nameEn: 'Medicine', collegeId: 'med', departmentId: 'gen-med', degreeType: 'Bachelor', credits: 220, duration: 6, coursesCount: 65, status: 'active', studentsCount: 200, graduatesCount: 45, employmentRate: 88 },
  { id: 'sp-12', nameAr: 'الرياضيات', nameEn: 'Mathematics', collegeId: 'sci', departmentId: 'math', degreeType: 'Bachelor', credits: 120, duration: 4, coursesCount: 40, status: 'active', studentsCount: 100, graduatesCount: 28, employmentRate: 74 },
];

// ─── Courses ───

export interface Course {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  departmentId: string;
  collegeId: string;
  credits: number;
  skills: string[];
  marketRelevance: number;
  description: string;
}

export const courses: Course[] = [
  { id: 'c1', code: 'CS 301', nameAr: ' هياكل البيانات والخوارزميات', nameEn: 'Data Structures & Algorithms', departmentId: 'cs-dept', collegeId: 'cs', credits: 3, skills: ['Python', 'Algorithms', 'Problem Solving'], marketRelevance: 92, description: 'Core algorithms and data structures' },
  { id: 'c2', code: 'CS 405', nameAr: 'التعلم الآلي', nameEn: 'Machine Learning', departmentId: 'cs-dept', collegeId: 'cs', credits: 3, skills: ['ML', 'Python', 'Statistics'], marketRelevance: 95, description: 'ML algorithms and applications' },
  { id: 'c3', code: 'SE 201', nameAr: 'مبادئ هندسة البرمجيات', nameEn: 'Software Engineering Principles', departmentId: 'se', collegeId: 'cs', credits: 3, skills: ['Agile', 'Design Patterns', 'UML'], marketRelevance: 78, description: 'Software development methodologies' },
  { id: 'c4', code: 'IS 302', nameAr: 'إدارة قواعد البيانات', nameEn: 'Database Management', departmentId: 'is', collegeId: 'cs', credits: 3, skills: ['SQL', 'Database Design', 'ER Modeling'], marketRelevance: 88, description: 'Relational database design and SQL' },
  { id: 'c5', code: 'CS 401', nameAr: 'الحوسبة السحابية', nameEn: 'Cloud Computing', departmentId: 'cs-dept', collegeId: 'cs', credits: 3, skills: ['AWS', 'Azure', 'DevOps'], marketRelevance: 94, description: 'Cloud platforms and services' },
  { id: 'c6', code: 'CS 410', nameAr: 'أمن المعلومات', nameEn: 'Information Security', departmentId: 'cs-dept', collegeId: 'cs', credits: 3, skills: ['Cybersecurity', 'Network Security', 'Cryptography'], marketRelevance: 90, description: 'Security principles and practices' },
  { id: 'c7', code: 'DS 301', nameAr: 'تعلم الآmlin العميق', nameEn: 'Deep Learning', departmentId: 'ds', collegeId: 'cs', credits: 3, skills: ['TensorFlow', 'PyTorch', 'Neural Networks'], marketRelevance: 93, description: 'Deep learning architectures' },
  { id: 'c8', code: 'SE 305', nameAr: 'تطوير تطبيقات الويب', nameEn: 'Web Application Development', departmentId: 'se', collegeId: 'cs', credits: 3, skills: ['React', 'Node.js', 'REST APIs'], marketRelevance: 91, description: 'Full-stack web development' },
  { id: 'c9', code: 'EE 301', nameAr: 'الدوائر الكهربائية', nameEn: 'Electrical Circuits', departmentId: 'ee', collegeId: 'eng', credits: 3, skills: ['Circuit Design', 'SPICE', 'Analysis'], marketRelevance: 75, description: 'Circuit analysis and design' },
  { id: 'c10', code: 'EE 405', nameAr: 'معالجة الإشارات', nameEn: 'Digital Signal Processing', departmentId: 'ee', collegeId: 'eng', credits: 3, skills: ['MATLAB', 'Signal Processing', 'FFT'], marketRelevance: 80, description: 'Signal processing algorithms' },
  { id: 'c11', code: 'ME 301', nameAr: 'ميكانيكا الموائع', nameEn: 'Fluid Mechanics', departmentId: 'me', collegeId: 'eng', credits: 3, skills: ['Simulation', 'CFD', 'Analysis'], marketRelevance: 72, description: 'Fluid dynamics principles' },
  { id: 'c12', code: 'CE 201', nameAr: 'ميكانيكا الإنشاءات', nameEn: 'Structural Mechanics', departmentId: 'ce', collegeId: 'eng', credits: 3, skills: ['AutoCAD', 'Structural Analysis', 'STAAD'], marketRelevance: 78, description: 'Structural analysis methods' },
  { id: 'c13', code: 'IE 301', nameAr: 'إدارة العمليات', nameEn: 'Operations Management', departmentId: 'ie', collegeId: 'eng', credits: 3, skills: ['Lean', 'Six Sigma', 'Optimization'], marketRelevance: 82, description: 'Operations and supply chain' },
  { id: 'c14', code: 'ACC 301', nameAr: 'المحاسبة المالية', nameEn: 'Financial Accounting', departmentId: 'acc', collegeId: 'bus', credits: 3, skills: ['GAAP', 'Financial Reporting', 'Analysis'], marketRelevance: 76, description: 'Accounting principles' },
  { id: 'c15', code: 'FIN 401', nameAr: 'تحليل الاستثمارات', nameEn: 'Investment Analysis', departmentId: 'fin', collegeId: 'bus', credits: 3, skills: ['Financial Modeling', 'Excel', 'Valuation'], marketRelevance: 85, description: 'Investment and portfolio analysis' },
  { id: 'c16', code: 'MKT 301', nameAr: 'التسويق الرقمي', nameEn: 'Digital Marketing', departmentId: 'mkt', collegeId: 'bus', credits: 3, skills: ['SEO', 'Social Media', 'Analytics'], marketRelevance: 88, description: 'Digital marketing strategies' },
  { id: 'c17', code: 'MGMT 401', nameAr: 'إدارة المشاريع', nameEn: 'Project Management', departmentId: 'mgmt', collegeId: 'bus', credits: 3, skills: ['PMP', 'Agile', 'Risk Management'], marketRelevance: 86, description: 'Project management frameworks' },
  { id: 'c18', code: 'MIS 301', nameAr: 'نظم المعلومات الإدارية', nameEn: 'Management Information Systems', departmentId: 'mis', collegeId: 'bus', credits: 3, skills: ['Business Analysis', 'ERP', 'SQL'], marketRelevance: 84, description: 'MIS design and implementation' },
  { id: 'c19', code: 'MED 401', nameAr: 'الطب الداخلي', nameEn: 'Internal Medicine', departmentId: 'gen-med', collegeId: 'med', credits: 6, skills: ['Diagnostics', 'Patient Care', 'Clinical Reasoning'], marketRelevance: 95, description: 'Internal medicine practice' },
  { id: 'c20', code: 'SURG 301', nameAr: 'أساسيات الجراحة', nameEn: 'Surgery Fundamentals', departmentId: 'surg', collegeId: 'med', credits: 4, skills: ['Surgical Techniques', 'Anatomy', 'Patient Care'], marketRelevance: 94, description: 'Surgical principles' },
  { id: 'c21', code: 'MATH 401', nameAr: 'النمذجة الرياضية', nameEn: 'Mathematical Modeling', departmentId: 'math', collegeId: 'sci', credits: 3, skills: ['Modeling', 'Python', 'Simulation'], marketRelevance: 78, description: 'Applied mathematical modeling' },
  { id: 'c22', code: 'PHYS 301', nameAr: 'ميكانيكا الكم', nameEn: 'Quantum Mechanics', departmentId: 'phys', collegeId: 'sci', credits: 3, skills: ['Physics', 'Mathematics', 'Problem Solving'], marketRelevance: 65, description: 'Quantum physics principles' },
  { id: 'c23', code: 'CHEM 401', nameAr: 'كيمياء عضوية متقدمة', nameEn: 'Advanced Organic Chemistry', departmentId: 'chem', collegeId: 'sci', credits: 3, skills: ['Lab Techniques', 'Synthesis', 'Analysis'], marketRelevance: 72, description: 'Organic chemistry synthesis' },
  { id: 'c24', code: 'BIO 301', nameAr: 'علم الأحياء الجزيئي', nameEn: 'Molecular Biology', departmentId: 'bio', collegeId: 'sci', credits: 3, skills: ['PCR', 'Genetics', 'Lab Techniques'], marketRelevance: 80, description: 'Molecular biology techniques' },
  { id: 'c25', code: 'ART 301', nameAr: 'تصميم الجرافيك', nameEn: 'Graphic Design', departmentId: 'design', collegeId: 'arts', credits: 3, skills: ['Illustrator', 'Photoshop', 'UI Design'], marketRelevance: 82, description: 'Graphic design principles' },
  { id: 'c26', code: 'MED 201', nameAr: 'علم وظائف الأعضاء', nameEn: 'Physiology', departmentId: 'gen-med', collegeId: 'med', credits: 4, skills: ['Human Biology', 'Clinical Skills'], marketRelevance: 88, description: 'Human physiology' },
  { id: 'c27', code: 'CS 201', nameAr: 'أساسيات البرمجة', nameEn: 'Programming Fundamentals', departmentId: 'cs-dept', collegeId: 'cs', credits: 4, skills: ['Python', 'Programming Logic', 'OOP'], marketRelevance: 92, description: 'Introduction to programming' },
  { id: 'c28', code: 'BUS 101', nameAr: 'مبادئ الإدارة', nameEn: 'Principles of Management', departmentId: 'mgmt', collegeId: 'bus', credits: 3, skills: ['Leadership', 'Communication', 'Strategy'], marketRelevance: 70, description: 'Management fundamentals' },
  { id: 'c29', code: 'DS 201', nameAr: 'تحليل البيانات', nameEn: 'Data Analysis', departmentId: 'ds', collegeId: 'cs', credits: 3, skills: ['Pandas', 'SQL', 'Visualization'], marketRelevance: 91, description: 'Data analysis with Python' },
  { id: 'c30', code: 'SE 401', nameAr: 'هندسة DevOps', nameEn: 'DevOps Engineering', departmentId: 'se', collegeId: 'cs', credits: 3, skills: ['Docker', 'Kubernetes', 'CI/CD'], marketRelevance: 94, description: 'DevOps practices and tools' },
];

// ─── Students ───

export type EmploymentStatus = 'employed' | 'seeking' | 'interviewing' | 'not-interested' | 'further-studies' | 'unknown';

export interface Student {
  id: string;
  nameAr: string;
  nameEn: string;
  collegeId: string;
  departmentId: string;
  gpa: number;
  graduationYear: number;
  employmentStatus: EmploymentStatus;
  skills: string[];
  company: string | null;
  role: string | null;
  salary: number | null;
  placementDate: string | null;
}

function generateStudents(): Student[] {
  const students: Student[] = [];
  const firstNames = ['Mohammed', 'Fatima', 'Khalid', 'Noura', 'Abdullah', 'Sara', 'Ahmad', 'Laila', 'Faisal', 'Reem', 'Saad', 'Hana', 'Omar', 'Maha', 'Yousef', 'Aisha', 'Ibrahim', 'Noor', 'Turki', 'Amal', 'Hassan', 'Latifa', 'Bandar', 'Salma', 'Fahad', 'Nada', 'Ziyad', 'Ghada', 'Mansour', 'Wafa', 'Sami', 'Samira', 'Kareem', 'Rania', 'Tariq', 'Basma', 'Nasser', 'Dina', 'Jasser', 'Huda', 'Majed', 'Mona', 'Anas', 'Eman', 'Badr', 'Rasha', 'Sultan', 'Heba', 'Meshari', 'Amani'];
  const lastNames = ['Al-Salem', 'Al-Zahrani', 'Al-Omari', 'Al-Rashid', 'Al-Harbi', 'Al-Qahtani', 'Al-Shehri', 'Al-Otaibi', 'Al-Farsi', 'Al-Dosari', 'Al-Bassam', 'Al-Shammari', 'Al-Ahmari', 'Al-Jasser', 'Al-Marri', 'Al-Habib', 'Al-Mutairi', 'Al-Tamimi', 'Al-Sharif', 'Al-Dossary', 'Al-Meshari', 'Al-Arifi', 'Al-Daher', 'Al-Shehri', 'Al-Olayan', 'Al-Rajhi', 'Al-Mutlaq', 'Al-Saud', 'Al-Faisal', 'Al-Nasser'];
  const allSkills = ['Python', 'JavaScript', 'React', 'SQL', 'AWS', 'Azure', 'Machine Learning', 'Data Analysis', 'Project Management', 'Excel', 'CAD', 'MATLAB', 'Agile', 'TensorFlow', 'Node.js', 'Docker', 'Kubernetes', 'UI/UX', 'Financial Modeling', 'Marketing', 'Java', 'C++', 'Cloud Computing', 'Cybersecurity', 'Deep Learning', 'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Research'];
  const companies = ['STC', 'Aramco', 'SABIC', 'Ministry of Health', 'Elm Company', 'Saudi National Bank', 'Mobily', 'Zain', 'MAERSK', 'NEOM', 'Red Sea Global', 'Al Rajhi Bank', 'Riyad Bank', 'Lucid Motors', 'Tuwaiq Academy'];
  const roles = ['Software Developer', 'Data Analyst', 'Project Manager', 'Business Analyst', 'Network Engineer', 'Research Scientist', 'Product Manager', 'UI/UX Designer', 'DevOps Engineer', 'ML Engineer', 'Doctor', 'Financial Analyst', 'Marketing Specialist', 'System Administrator', 'QA Engineer'];

  let id = 1;
  for (const college of colleges) {
    for (const dept of college.departments) {
      const deptStudents = Math.floor(Math.random() * 8) + 5;
      for (let i = 0; i < deptStudents; i++) {
        const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
        const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
        const gpa = Math.round((2.5 + Math.random() * 2.0) * 100) / 100;
        const gradYear = 2022 + Math.floor(Math.random() * 4);
        const statusRoll = Math.random();
        let status: EmploymentStatus;
        let company: string | null = null;
        let role: string | null = null;
        let salary: number | null = null;
        let placementDate: string | null = null;

        if (statusRoll < 0.35) {
          status = 'employed';
          company = companies[Math.floor(Math.random() * companies.length)];
          role = roles[Math.floor(Math.random() * roles.length)];
          salary = 8000 + Math.floor(Math.random() * 12000);
          placementDate = `2025-${String(Math.floor(Math.random() * 6) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
        } else if (statusRoll < 0.55) { status = 'seeking'; }
        else if (statusRoll < 0.68) { status = 'interviewing'; }
        else if (statusRoll < 0.80) { status = 'further-studies'; }
        else if (statusRoll < 0.90) { status = 'not-interested'; }
        else { status = 'unknown'; }

        const numSkills = 2 + Math.floor(Math.random() * 4);
        const shuffled = [...allSkills].sort(() => Math.random() - 0.5);
        const studentSkills = shuffled.slice(0, numSkills);

        students.push({
          id: String(id).padStart(6, '0'),
          nameAr: `${fn} ${ln}`,
          nameEn: `${fn} ${ln}`,
          collegeId: college.id,
          departmentId: dept.id,
          gpa,
          graduationYear: gradYear,
          employmentStatus: status,
          skills: studentSkills,
          company,
          role,
          salary,
          placementDate,
        });
        id++;
      }
    }
  }
  return students;
}

export const students: Student[] = generateStudents();

// ─── Employment KPIs ───

export interface EmploymentKPIs {
  employmentRate: number;
  employmentRateChange: number;
  avgTimeToEmployment: number;
  avgTimeToEmploymentChange: number;
  totalStudents: number;
  totalGraduates: number;
  skillAlignment: number;
  skillAlignmentChange: number;
  topEmployerMatches: number;
  avgSalary: number;
  avgSalaryChange: number;
  activeCompanies: number;
  activeCompaniesChange: number;
}

export const employmentKPIs: EmploymentKPIs = {
  employmentRate: 78,
  employmentRateChange: 5,
  avgTimeToEmployment: 3.2,
  avgTimeToEmploymentChange: -0.4,
  totalStudents: 8450,
  totalGraduates: 1200,
  skillAlignment: 82,
  skillAlignmentChange: 3,
  topEmployerMatches: 340,
  avgSalary: 12500,
  avgSalaryChange: 1500,
  activeCompanies: 145,
  activeCompaniesChange: 23,
};

// ─── Employment Trends (5 years) ───

export interface YearlyTrend {
  year: string;
  employed: number;
  pursuingEducation: number;
  seeking: number;
  cs: number;
  engineering: number;
  business: number;
  medicine: number;
  universityAverage: number;
}

export const employmentTrends: YearlyTrend[] = [
  { year: '2020-2021', employed: 62, pursuingEducation: 18, seeking: 20, cs: 78, engineering: 72, business: 60, medicine: 80, universityAverage: 62 },
  { year: '2021-2022', employed: 66, pursuingEducation: 17, seeking: 17, cs: 82, engineering: 76, business: 65, medicine: 82, universityAverage: 66 },
  { year: '2022-2023', employed: 70, pursuingEducation: 16, seeking: 14, cs: 85, engineering: 79, business: 70, medicine: 83, universityAverage: 70 },
  { year: '2023-2024', employed: 73, pursuingEducation: 15, seeking: 12, cs: 88, engineering: 82, business: 74, medicine: 84, universityAverage: 73 },
  { year: '2024-2025', employed: 78, pursuingEducation: 14, seeking: 8, cs: 90, engineering: 86, business: 80, medicine: 84, universityAverage: 78 },
];

// ─── Skill Gap Data ───

export interface SkillGap {
  skill: string;
  studentAverage: number;
  marketRequired: number;
  gap: number;
  affectedColleges: string[];
}

export const skillGaps: SkillGap[] = [
  { skill: 'Cloud Computing (AWS/Azure)', studentAverage: 28, marketRequired: 78, gap: 50, affectedColleges: ['Computer Science', 'Engineering'] },
  { skill: 'Machine Learning', studentAverage: 32, marketRequired: 72, gap: 40, affectedColleges: ['Computer Science', 'Engineering', 'Sciences'] },
  { skill: 'Data Visualization', studentAverage: 38, marketRequired: 70, gap: 32, affectedColleges: ['Computer Science', 'Business'] },
  { skill: 'Project Management', studentAverage: 42, marketRequired: 68, gap: 26, affectedColleges: ['Business', 'Engineering'] },
  { skill: 'Cybersecurity', studentAverage: 25, marketRequired: 50, gap: 25, affectedColleges: ['Computer Science', 'Engineering'] },
  { skill: 'UI/UX Design', studentAverage: 35, marketRequired: 58, gap: 23, affectedColleges: ['Computer Science', 'Arts'] },
  { skill: 'DevOps / CI-CD', studentAverage: 30, marketRequired: 65, gap: 35, affectedColleges: ['Computer Science'] },
  { skill: 'Financial Modeling', studentAverage: 36, marketRequired: 62, gap: 26, affectedColleges: ['Business'] },
  { skill: 'Data Engineering', studentAverage: 34, marketRequired: 70, gap: 36, affectedColleges: ['Computer Science', 'Sciences'] },
  { skill: 'Mobile Development', studentAverage: 40, marketRequired: 60, gap: 20, affectedColleges: ['Computer Science', 'Engineering'] },
];

// ─── Top Employers ───

export interface TopEmployer {
  rank: number;
  name: string;
  hires: number;
  avgSalary: number;
  matchRate: number;
}

export const topEmployers: TopEmployer[] = [
  { rank: 1, name: 'STC', hires: 78, avgSalary: 14500, matchRate: 92 },
  { rank: 2, name: 'Aramco', hires: 65, avgSalary: 18200, matchRate: 88 },
  { rank: 3, name: 'SABIC', hires: 52, avgSalary: 16800, matchRate: 85 },
  { rank: 4, name: 'Ministry of Health', hires: 48, avgSalary: 15000, matchRate: 90 },
  { rank: 5, name: 'Elm Company', hires: 41, avgSalary: 13500, matchRate: 87 },
  { rank: 6, name: 'Saudi National Bank', hires: 35, avgSalary: 14000, matchRate: 84 },
];

// ─── Recent Placements ───

export interface Placement {
  id: string;
  studentName: string;
  collegeId: string;
  collegeName: string;
  company: string;
  role: string;
  date: string;
  daysAgo: number;
}

export const recentPlacements: Placement[] = [
  { id: 'p1', studentName: 'Ahmed Al-Rashid', collegeId: 'cs', collegeName: 'Computer Science', company: 'STC', role: 'Software Developer', date: '2025-06-28', daysAgo: 3 },
  { id: 'p2', studentName: 'Sara Al-Qahtani', collegeId: 'eng', collegeName: 'Engineering', company: 'Aramco', role: 'Process Engineer', date: '2025-06-27', daysAgo: 4 },
  { id: 'p3', studentName: 'Khalid Al-Otaibi', collegeId: 'bus', collegeName: 'Business', company: 'SABIC', role: 'Business Analyst', date: '2025-06-26', daysAgo: 5 },
  { id: 'p4', studentName: 'Noura Al-Zahrani', collegeId: 'med', collegeName: 'Medicine', company: 'Ministry of Health', role: 'Resident Doctor', date: '2025-06-23', daysAgo: 8 },
  { id: 'p5', studentName: 'Faisal Al-Harbi', collegeId: 'cs', collegeName: 'Computer Science', company: 'Elm Company', role: 'Frontend Developer', date: '2025-06-23', daysAgo: 8 },
  { id: 'p6', studentName: 'Laila Al-Saud', collegeId: 'sci', collegeName: 'Sciences', company: 'SABIC', role: 'Research Scientist', date: '2025-06-21', daysAgo: 10 },
  { id: 'p7', studentName: 'Omar Al-Dosari', collegeId: 'eng', collegeName: 'Engineering', company: 'NEOM', role: 'Civil Engineer', date: '2025-06-20', daysAgo: 11 },
];

// ─── Employment Status Distribution ───

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export const employmentStatusDistribution: StatusDistribution[] = [
  { name: 'Employed', value: 35, color: '#1ba442' },
  { name: 'Seeking', value: 26, color: '#9fe870' },
  { name: 'Further Studies', value: 22, color: '#3b82f6' },
  { name: 'Interviewing', value: 10, color: '#f59e0b' },
  { name: 'Not Interested', value: 7, color: '#dfe1dd' },
];

// ─── Top Skills Distribution ───

export interface SkillDistribution {
  skill: string;
  count: number;
}

export const topSkillsDistribution: SkillDistribution[] = [
  { skill: 'Python', count: 342 },
  { skill: 'SQL', count: 298 },
  { skill: 'Project Management', count: 276 },
  { skill: 'JavaScript', count: 254 },
  { skill: 'Excel', count: 231 },
  { skill: 'Data Analysis', count: 218 },
  { skill: 'Communication', count: 205 },
  { skill: 'Java', count: 198 },
  { skill: 'React', count: 185 },
  { skill: 'Machine Learning', count: 167 },
];

// ─── Employment Timeline ───

export interface EmploymentTimeline {
  month: string;
  currentYear: number;
  previousYear: number;
}

export const employmentTimeline: EmploymentTimeline[] = [
  { month: 'Sep', currentYear: 45, previousYear: 38 },
  { month: 'Oct', currentYear: 62, previousYear: 52 },
  { month: 'Nov', currentYear: 78, previousYear: 65 },
  { month: 'Dec', currentYear: 95, previousYear: 80 },
  { month: 'Jan', currentYear: 120, previousYear: 98 },
  { month: 'Feb', currentYear: 145, previousYear: 118 },
  { month: 'Mar', currentYear: 168, previousYear: 142 },
  { month: 'Apr', currentYear: 155, previousYear: 130 },
  { month: 'May', currentYear: 185, previousYear: 155 },
  { month: 'Jun', currentYear: 210, previousYear: 172 },
  { month: 'Jul', currentYear: 68, previousYear: 55 },
  { month: 'Aug', currentYear: 42, previousYear: 35 },
];

// ─── Helper Functions ───

export function getCollegeById(id: string): College | undefined {
  return colleges.find(c => c.id === id);
}

export function getDepartmentById(id: string): Department | undefined {
  for (const college of colleges) {
    const dept = college.departments.find(d => d.id === id);
    if (dept) return dept;
  }
  return undefined;
}

export function getStatusLabel(status: EmploymentStatus): string {
  const labels: Record<EmploymentStatus, string> = {
    employed: 'Employed',
    seeking: 'Seeking',
    interviewing: 'Interviewing',
    'not-interested': 'Not Interested',
    'further-studies': 'Further Studies',
    unknown: 'Unknown',
  };
  return labels[status];
}

export function getStatusColor(status: EmploymentStatus): string {
  const colors: Record<EmploymentStatus, string> = {
    employed: '#1ba442',
    seeking: '#9fe870',
    interviewing: '#f59e0b',
    'not-interested': '#dfe1dd',
    'further-studies': '#3b82f6',
    unknown: '#828782',
  };
  return colors[status];
}
