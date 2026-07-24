// MADAR Platform - Comprehensive Seed Data Script
// Usage: node scripts/seed-data.js
// Requires: MONGODB_URI environment variable or default connection

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';
const BCRYPT_ROUNDS = 10;

// Helper functions
const now = () => new Date();
const oid = (id) => new ObjectId(id);
const hashPassword = async (password) => bcrypt.hash(password, BCRYPT_ROUNDS);
const normalizeSkillName = (name) => name.toLowerCase().trim().replace(/\s+/g, ' ');
const dropIndexIfExists = async (collection, indexName) => {
  try {
    await collection.dropIndex(indexName);
  } catch (error) {
    if (error.codeName !== 'IndexNotFound') {
      throw error;
    }
  }
};

// Seed data generators
async function seedRoles(db) {
  console.log('Seeding roles...');
  const roles = [
    { _id: oid('000000000000000000000001'), name: 'super_admin', nameAr: 'المشرف العام', permissions: ['*'], isSystem: true, createdAt: now(), updatedAt: now() },
    { _id: oid('000000000000000000000002'), name: 'admin', nameAr: 'مسؤول النظام', permissions: ['users:read', 'users:write', 'jobs:read', 'jobs:write', 'analytics:read', 'system:manage'], isSystem: true, createdAt: now(), updatedAt: now() },
    { _id: oid('000000000000000000000003'), name: 'student', nameAr: 'طالب', permissions: ['profile:read', 'profile:write', 'jobs:read', 'applications:read', 'applications:write'], isSystem: true, createdAt: now(), updatedAt: now() },
    { _id: oid('000000000000000000000004'), name: 'company', nameAr: 'شركة', permissions: ['company:read', 'company:write', 'jobs:read', 'jobs:write', 'candidates:read', 'analytics:read'], isSystem: true, createdAt: now(), updatedAt: now() },
    { _id: oid('000000000000000000000005'), name: 'university', nameAr: 'جامعة', permissions: ['university:read', 'university:write', 'students:read', 'analytics:read', 'structure:manage'], isSystem: true, createdAt: now(), updatedAt: now() },
    { _id: oid('000000000000000000000006'), name: 'coordinator', nameAr: 'منسق', permissions: ['students:read', 'analytics:read', 'reports:generate'], isSystem: true, createdAt: now(), updatedAt: now() },
  ];
  await db.collection('roles').deleteMany({});
  await db.collection('roles').insertMany(roles);
  console.log(`  Inserted ${roles.length} roles`);
}

async function seedPermissions(db) {
  console.log('Seeding permissions...');
  const permissions = [
    { _id: oid('000000000000000000000010'), name: 'users:read', description: 'Read users', module: 'users', createdAt: now() },
    { _id: oid('000000000000000000000011'), name: 'users:write', description: 'Write users', module: 'users', createdAt: now() },
    { _id: oid('000000000000000000000012'), name: 'jobs:read', description: 'Read jobs', module: 'jobs', createdAt: now() },
    { _id: oid('000000000000000000000013'), name: 'jobs:write', description: 'Write jobs', module: 'jobs', createdAt: now() },
    { _id: oid('000000000000000000000014'), name: 'analytics:read', description: 'Read analytics', module: 'analytics', createdAt: now() },
    { _id: oid('000000000000000000000015'), name: 'system:manage', description: 'Manage system', module: 'system', createdAt: now() },
    { _id: oid('000000000000000000000016'), name: 'profile:read', description: 'Read profile', module: 'profile', createdAt: now() },
    { _id: oid('000000000000000000000017'), name: 'profile:write', description: 'Write profile', module: 'profile', createdAt: now() },
    { _id: oid('000000000000000000000018'), name: 'applications:read', description: 'Read applications', module: 'applications', createdAt: now() },
    { _id: oid('000000000000000000000019'), name: 'applications:write', description: 'Write applications', module: 'applications', createdAt: now() },
    { _id: oid('00000000000000000000001a'), name: 'company:read', description: 'Read company', module: 'company', createdAt: now() },
    { _id: oid('00000000000000000000001b'), name: 'company:write', description: 'Write company', module: 'company', createdAt: now() },
    { _id: oid('00000000000000000000001c'), name: 'candidates:read', description: 'Read candidates', module: 'candidates', createdAt: now() },
    { _id: oid('00000000000000000000001d'), name: 'university:read', description: 'Read university', module: 'university', createdAt: now() },
    { _id: oid('00000000000000000000001e'), name: 'university:write', description: 'Write university', module: 'university', createdAt: now() },
    { _id: oid('00000000000000000000001f'), name: 'students:read', description: 'Read students', module: 'students', createdAt: now() },
    { _id: oid('000000000000000000000020'), name: 'structure:manage', description: 'Manage structure', module: 'structure', createdAt: now() },
    { _id: oid('000000000000000000000021'), name: 'reports:generate', description: 'Generate reports', module: 'reports', createdAt: now() },
  ];
  await db.collection('permissions').deleteMany({});
  await db.collection('permissions').insertMany(permissions);
  console.log(`  Inserted ${permissions.length} permissions`);
}

async function seedUsers(db) {
  console.log('Seeding users...');
  const hashedPassword = await hashPassword('Madar@2024');
  const users = [
    // Super Admin
    { _id: oid('650000000000000000000001'), email: 'admin@madar.sa', password: hashedPassword, firstName: 'System', lastName: 'Administrator', firstNameAr: 'النظام', lastNameAr: 'المشرف', role: 'admin', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    // Students
    { _id: oid('650000000000000000000101'), email: 'ahmed@student.ksu.edu.sa', password: hashedPassword, firstName: 'Ahmed', lastName: 'Al-Rashid', firstNameAr: 'أحمد', lastNameAr: 'الراشد', role: 'student', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    { _id: oid('650000000000000000000102'), email: 'sara@student.kau.edu.sa', password: hashedPassword, firstName: 'Sara', lastName: 'Al-Qahtani', firstNameAr: 'سارة', lastNameAr: 'القحطاني', role: 'student', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    { _id: oid('650000000000000000000103'), email: 'khalid@student.kfupm.edu.sa', password: hashedPassword, firstName: 'Khalid', lastName: 'Al-Otaibi', firstNameAr: 'خالد', lastNameAr: 'العتيبي', role: 'student', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    { _id: oid('650000000000000000000104'), email: 'noura@student.imamu.edu.sa', password: hashedPassword, firstName: 'Noura', lastName: 'Al-Farsi', firstNameAr: 'نورة', lastNameAr: 'الفارسي', role: 'student', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    { _id: oid('650000000000000000000105'), email: 'fahad@student.ksu.edu.sa', password: hashedPassword, firstName: 'Fahad', lastName: 'Al-Zahrani', firstNameAr: 'فهد', lastNameAr: 'الزهراني', role: 'student', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    // Companies
    { _id: oid('650000000000000000000201'), email: 'hr@aramco.com', password: hashedPassword, firstName: 'Saudi', lastName: 'Aramco', firstNameAr: 'أرامكو', lastNameAr: 'السعودية', role: 'company', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    { _id: oid('650000000000000000000202'), email: 'recruitment@stc.com.sa', password: hashedPassword, firstName: 'STC', lastName: 'Group', firstNameAr: 'مجموعة', lastNameAr: 'الاتصالات', role: 'company', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    { _id: oid('650000000000000000000203'), email: 'careers@sabic.com', password: hashedPassword, firstName: 'SABIC', lastName: 'Company', firstNameAr: 'سابك', lastNameAr: 'الشركة', role: 'company', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    { _id: oid('650000000000000000000204'), email: 'hr@acwa.com', password: hashedPassword, firstName: 'ACWA', lastName: 'Power', firstNameAr: 'أكوا', lastNameAr: 'باور', role: 'company', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    { _id: oid('650000000000000000000205'), email: 'jobs@neom.com', password: hashedPassword, firstName: 'NEOM', lastName: 'Project', firstNameAr: 'نيوم', lastNameAr: 'المشروع', role: 'company', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    // Universities
    { _id: oid('650000000000000000000301'), email: 'cs@ksu.edu.sa', password: hashedPassword, firstName: 'King Saud', lastName: 'University', firstNameAr: 'جامعة', lastNameAr: 'الملك سعود', role: 'university', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    { _id: oid('650000000000000000000302'), email: 'it@kfupm.edu.sa', password: hashedPassword, firstName: 'KFUPM', lastName: 'University', firstNameAr: 'جامعة', lastNameAr: 'الملك فهد', role: 'university', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    { _id: oid('650000000000000000000303'), email: 'admin@kau.edu.sa', password: hashedPassword, firstName: 'King Abdulaziz', lastName: 'University', firstNameAr: 'جامعة', lastNameAr: 'الملك عبدالعزيز', role: 'university', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
    // Coordinators
    { _id: oid('650000000000000000000401'), email: 'coordinator@ksu.edu.sa', password: hashedPassword, firstName: 'Mohammed', lastName: 'Al-Coordinat', firstNameAr: 'محمد', lastNameAr: 'المنسق', role: 'coordinator', emailVerified: true, isActive: true, lastLogin: now(), createdAt: now(), updatedAt: now() },
  ];
  await db.collection('users').deleteMany({});
  await db.collection('users').insertMany(users);
  console.log(`  Inserted ${users.length} users`);
}

async function seedStudents(db) {
  console.log('Seeding students...');
  const students = [
    { userId: oid('650000000000000000000101'), university: oid('650000000000000000000301'), college: 'College of Computer and Information Sciences', collegeAr: 'كلية علوم الحاسب والمعلومات', department: 'Computer Science', departmentAr: 'علوم الحاسب', major: 'Computer Science', majorAr: 'علوم الحاسب', gpa: 3.75, gpaScale: 4.0, graduationYear: 2025, enrollmentYear: 2021, academicLevel: 'senior', skills: [
      { name: 'Python', category: 'technical', proficiency: 0.9 }, { name: 'JavaScript', category: 'technical', proficiency: 0.85 },
      { name: 'React', category: 'technical', proficiency: 0.8 }, { name: 'Node.js', category: 'technical', proficiency: 0.75 },
      { name: 'Machine Learning', category: 'technical', proficiency: 0.7 }, { name: 'SQL', category: 'technical', proficiency: 0.85 },
      { name: 'Git', category: 'technical', proficiency: 0.9 }, { name: 'Docker', category: 'technical', proficiency: 0.6 },
      { name: 'Problem Solving', category: 'soft', proficiency: 0.9 }, { name: 'Teamwork', category: 'soft', proficiency: 0.85 },
      { name: 'Communication', category: 'soft', proficiency: 0.8 }, { name: 'Arabic', category: 'language', proficiency: 1.0 },
      { name: 'English', category: 'language', proficiency: 0.85 }
    ], projects: [
      { title: 'AI-based Job Matching System', description: 'Built a recommendation system for matching students with jobs', technologies: ['Python', 'TensorFlow', 'React'], url: 'https://github.com/ahmed/job-matcher' },
      { title: 'E-commerce Platform', description: 'Full-stack e-commerce application with payment integration', technologies: ['Node.js', 'React', 'MongoDB'], url: 'https://github.com/ahmed/ecommerce' }
    ], certifications: [
      { name: 'AWS Certified Developer', issuer: 'Amazon Web Services', issueDate: new Date('2024-01-15'), expiryDate: new Date('2027-01-15'), credentialId: 'AWS-DEV-12345' },
      { name: 'Google Data Analytics', issuer: 'Google', issueDate: new Date('2023-06-01'), credentialId: 'GDA-67890' }
    ], cvUrl: 'https://storage.madar.sa/cvs/ahmed-alrashid.pdf', cvParsedData: { skills: ['Python', 'JavaScript', 'React', 'Node.js', 'SQL'], experience: ['Software Engineering Intern at STC'] }, careerInterests: ['Software Engineering', 'Data Science', 'AI/ML'], preferredLocations: ['Riyadh', 'Dammam'], employmentType: 'full_time', profileComplete: true, profileCompletionPercentage: 95, createdAt: now(), updatedAt: now() },
    { userId: oid('650000000000000000000102'), university: oid('650000000000000000000303'), college: 'Faculty of Engineering', collegeAr: 'كلية الهندسة', department: 'Software Engineering', departmentAr: 'هندسة البرمجيات', major: 'Software Engineering', majorAr: 'هندسة البرمجيات', gpa: 3.9, gpaScale: 4.0, graduationYear: 2025, enrollmentYear: 2021, academicLevel: 'senior', skills: [
      { name: 'Java', category: 'technical', proficiency: 0.95 }, { name: 'Spring Boot', category: 'technical', proficiency: 0.85 },
      { name: 'Python', category: 'technical', proficiency: 0.8 }, { name: 'Microservices', category: 'technical', proficiency: 0.75 },
      { name: 'Kubernetes', category: 'technical', proficiency: 0.7 }, { name: 'AWS', category: 'technical', proficiency: 0.8 },
      { name: 'CI/CD', category: 'technical', proficiency: 0.85 }, { name: 'SQL', category: 'technical', proficiency: 0.9 },
      { name: 'Leadership', category: 'soft', proficiency: 0.85 }, { name: 'Problem Solving', category: 'soft', proficiency: 0.9 },
      { name: 'Arabic', category: 'language', proficiency: 1.0 }, { name: 'English', category: 'language', proficiency: 0.9 }
    ], projects: [
      { title: 'Microservices-based Banking API', description: 'Designed microservices architecture for digital banking', technologies: ['Java', 'Spring Boot', 'Kubernetes'], url: 'https://github.com/sara/banking-api' },
      { title: 'Cloud Infrastructure Automation', description: 'Automated cloud deployment with Terraform and Ansible', technologies: ['AWS', 'Terraform', 'Python'], url: 'https://github.com/sara/cloud-auto' }
    ], certifications: [
      { name: 'CKA - Certified Kubernetes Administrator', issuer: 'CNCF', issueDate: new Date('2024-03-01'), expiryDate: new Date('2027-03-01'), credentialId: 'CKA-54321' },
      { name: 'AWS Solutions Architect', issuer: 'Amazon Web Services', issueDate: new Date('2024-02-01'), expiryDate: new Date('2027-02-01'), credentialId: 'AWS-SAA-11111' }
    ], cvUrl: 'https://storage.madar.sa/cvs/sara-alqahtani.pdf', cvParsedData: { skills: ['Java', 'Spring Boot', 'Kubernetes', 'AWS'], experience: ['DevOps Intern at Aramco'] }, careerInterests: ['Backend Engineering', 'DevOps', 'Cloud Architecture'], preferredLocations: ['Riyadh', 'Jeddah'], employmentType: 'full_time', profileComplete: true, profileCompletionPercentage: 90, createdAt: now(), updatedAt: now() },
    { userId: oid('650000000000000000000103'), university: oid('650000000000000000000302'), college: 'College of Computer Sciences and Engineering', collegeAr: 'كلية علوم وهندسة الحاسب', department: 'Computer Engineering', departmentAr: 'هندسة الحاسب', major: 'Computer Engineering', majorAr: 'هندسة الحاسب', gpa: 3.5, gpaScale: 4.0, graduationYear: 2026, enrollmentYear: 2022, academicLevel: 'junior', skills: [
      { name: 'C++', category: 'technical', proficiency: 0.85 }, { name: 'Python', category: 'technical', proficiency: 0.75 },
      { name: 'Embedded Systems', category: 'technical', proficiency: 0.8 }, { name: 'IoT', category: 'technical', proficiency: 0.7 },
      { name: 'MATLAB', category: 'technical', proficiency: 0.65 }, { name: 'Problem Solving', category: 'soft', proficiency: 0.8 },
      { name: 'Arabic', category: 'language', proficiency: 1.0 }, { name: 'English', category: 'language', proficiency: 0.75 }
    ], projects: [
      { title: 'Smart Home Automation', description: 'IoT-based home automation system with Raspberry Pi', technologies: ['Python', 'IoT', 'MQTT'], url: 'https://github.com/khalid/smarthome' }
    ], certifications: [], cvUrl: 'https://storage.madar.sa/cvs/khalid-alotaibi.pdf', cvParsedData: { skills: ['C++', 'Python', 'Embedded Systems'] }, careerInterests: ['Embedded Systems', 'IoT', 'Hardware Engineering'], preferredLocations: ['Dhahran', 'Riyadh'], employmentType: 'internship', profileComplete: true, profileCompletionPercentage: 75, createdAt: now(), updatedAt: now() },
    { userId: oid('650000000000000000000104'), university: oid('650000000000000000000301'), college: 'College of Computer and Information Sciences', collegeAr: 'كلية علوم الحاسب والمعلومات', department: 'Information Systems', departmentAr: 'نظم المعلومات', major: 'Information Systems', majorAr: 'نظم المعلومات', gpa: 3.65, gpaScale: 4.0, graduationYear: 2025, enrollmentYear: 2021, academicLevel: 'senior', skills: [
      { name: 'SQL', category: 'technical', proficiency: 0.9 }, { name: 'Python', category: 'technical', proficiency: 0.8 },
      { name: 'Power BI', category: 'technical', proficiency: 0.85 }, { name: 'Tableau', category: 'technical', proficiency: 0.8 },
      { name: 'Data Analysis', category: 'technical', proficiency: 0.85 }, { name: 'Excel', category: 'technical', proficiency: 0.95 },
      { name: 'Communication', category: 'soft', proficiency: 0.9 }, { name: 'Arabic', category: 'language', proficiency: 1.0 },
      { name: 'English', category: 'language', proficiency: 0.85 }
    ], projects: [
      { title: 'Business Intelligence Dashboard', description: 'BI dashboard for retail analytics', technologies: ['Power BI', 'SQL', 'Python'], url: 'https://github.com/noura/bi-dashboard' }
    ], certifications: [
      { name: 'Microsoft Power BI Data Analyst', issuer: 'Microsoft', issueDate: new Date('2024-01-01'), credentialId: 'PL-300-99999' }
    ], cvUrl: 'https://storage.madar.sa/cvs/noura-alfarsi.pdf', cvParsedData: { skills: ['SQL', 'Power BI', 'Data Analysis'] }, careerInterests: ['Data Analytics', 'Business Intelligence', 'Data Engineering'], preferredLocations: ['Riyadh'], employmentType: 'full_time', profileComplete: true, profileCompletionPercentage: 88, createdAt: now(), updatedAt: now() },
    { userId: oid('650000000000000000000105'), university: oid('650000000000000000000302'), college: 'College of Computer Sciences and Engineering', collegeAr: 'كلية علوم وهندسة الحاسب', department: 'Computer Science', departmentAr: 'علوم الحاسب', major: 'Computer Science', majorAr: 'علوم الحاسب', gpa: 3.8, gpaScale: 4.0, graduationYear: 2025, enrollmentYear: 2021, academicLevel: 'senior', skills: [
      { name: 'React', category: 'technical', proficiency: 0.95 }, { name: 'TypeScript', category: 'technical', proficiency: 0.9 },
      { name: 'Next.js', category: 'technical', proficiency: 0.85 }, { name: 'Tailwind CSS', category: 'technical', proficiency: 0.9 },
      { name: 'Node.js', category: 'technical', proficiency: 0.8 }, { name: 'Figma', category: 'technical', proficiency: 0.75 },
      { name: 'UI/UX Design', category: 'soft', proficiency: 0.85 }, { name: 'Creativity', category: 'soft', proficiency: 0.9 },
      { name: 'Arabic', category: 'language', proficiency: 1.0 }, { name: 'English', category: 'language', proficiency: 0.8 }
    ], projects: [
      { title: 'MADAR Platform UI', description: 'Complete UI/UX design and frontend implementation', technologies: ['React', 'TypeScript', 'Tailwind'], url: 'https://github.com/fahad/madar-ui' },
      { title: 'Portfolio Generator', description: 'Dynamic portfolio generator for developers', technologies: ['Next.js', 'Tailwind', 'Vercel'], url: 'https://github.com/fahad/portfolio-gen' }
    ], certifications: [
      { name: 'Meta Frontend Developer', issuer: 'Meta', issueDate: new Date('2024-04-01'), credentialId: 'META-FE-77777' }
    ], cvUrl: 'https://storage.madar.sa/cvs/fahad-alzahrani.pdf', cvParsedData: { skills: ['React', 'TypeScript', 'Next.js', 'Tailwind'] }, careerInterests: ['Frontend Engineering', 'UI/UX Design', 'Full Stack Development'], preferredLocations: ['Riyadh', 'Jeddah', 'Dammam'], employmentType: 'full_time', profileComplete: true, profileCompletionPercentage: 92, createdAt: now(), updatedAt: now() },
  ];
  await db.collection('students').deleteMany({});
  await db.collection('students').insertMany(students);
  console.log(`  Inserted ${students.length} students`);
}

async function seedCompanies(db) {
  console.log('Seeding companies...');
  const companies = [
    { userId: oid('650000000000000000000201'), name: 'Saudi Aramco', nameAr: 'أرامكو السعودية', industry: 'Oil & Gas', industryAr: 'النفط والغاز', description: 'World\'s largest oil and gas company, leading energy and chemicals production.', descriptionAr: 'أكبر شركة نفط وغاز في العالم، رائدة في إنتاج الطاقة والمواد الكيميائية.', website: 'https://www.aramco.com', size: '10000+', founded: 1933, headquarters: 'Dhahran', logo: 'https://logo.clearbit.com/aramco.com', verificationStatus: 'verified', saudiNationality: true, jobsPosted: 3, createdAt: now(), updatedAt: now() },
    { userId: oid('650000000000000000000202'), name: 'STC Group', nameAr: 'مجموعة الاتصالات السعودية', industry: 'Telecommunications', industryAr: 'الاتصالات', description: 'Leading digital enabler providing comprehensive telecom and ICT services.', descriptionAr: 'الممكن الرقمي الرائد الذي يقدم خدمات شاملة للاتصالات وتقنية المعلومات.', website: 'https://www.stc.com.sa', size: '5000-10000', founded: 1998, headquarters: 'Riyadh', logo: 'https://logo.clearbit.com/stc.com.sa', verificationStatus: 'verified', saudiNationality: true, jobsPosted: 3, createdAt: now(), updatedAt: now() },
    { userId: oid('650000000000000000000203'), name: 'SABIC', nameAr: 'سابك', industry: 'Chemicals & Manufacturing', industryAr: 'المواد الكيميائية والتصنيع', description: 'Global leader in diversified chemicals headquartered in Riyadh.', descriptionAr: 'شركة عالمية رائدة في مجال المواد الكيميائية المتنوعة مقرها الرياض.', website: 'https://www.sabic.com', size: '10000+', founded: 1976, headquarters: 'Riyadh', logo: 'https://logo.clearbit.com/sabic.com', verificationStatus: 'verified', saudiNationality: true, jobsPosted: 2, createdAt: now(), updatedAt: now() },
    { userId: oid('650000000000000000000204'), name: 'ACWA Power', nameAr: 'أكوا باور', industry: 'Energy & Utilities', industryAr: 'الطاقة والمرافق', description: 'Developer, investor and operator of power generation and desalinated water plants.', descriptionAr: 'مطور ومستثمر ومشغل لمحطات توليد الطاقة وتحلية المياه.', website: 'https://www.acwapower.com', size: '1000-5000', founded: 2004, headquarters: 'Riyadh', logo: 'https://logo.clearbit.com/acwapower.com', verificationStatus: 'verified', saudiNationality: true, jobsPosted: 2, createdAt: now(), updatedAt: now() },
    { userId: oid('650000000000000000000205'), name: 'NEOM', nameAr: 'نيوم', industry: 'Smart City Development', industryAr: 'تطوير المدن الذكية', description: 'Giga-project building a new model for sustainable living and working.', descriptionAr: 'مشروع ضخم لبناء نموذج جديد للحياة والعمل المستدامة.', website: 'https://www.neom.com', size: '5000-10000', founded: 2017, headquarters: 'NEOM', logo: 'https://logo.clearbit.com/neom.com', verificationStatus: 'verified', saudiNationality: true, jobsPosted: 2, createdAt: now(), updatedAt: now() },
  ];
  await db.collection('companies').deleteMany({});
  await db.collection('companies').insertMany(companies);
  console.log(`  Inserted ${companies.length} companies`);
}

async function seedUniversities(db) {
  console.log('Seeding universities...');
  const universities = [
    { userId: oid('650000000000000000000301'), name: 'King Saud University', nameAr: 'جامعة الملك سعود', type: 'public', typeAr: 'حكومية', established: 1957, location: 'Riyadh', website: 'https://ksu.edu.sa', logo: 'https://logo.clearbit.com/ksu.edu.sa', accreditations: ['NCAAA', 'ABET'], ranking: 1, totalStudents: 45000, employmentRate: 78.5, verified: true, createdAt: now(), updatedAt: now() },
    { userId: oid('650000000000000000000302'), name: 'King Fahd University of Petroleum and Minerals', nameAr: 'جامعة الملك فهد للبترول والمعادن', type: 'public', typeAr: 'حكومية', established: 1963, location: 'Dhahran', website: 'https://kfupm.edu.sa', logo: 'https://logo.clearbit.com/kfupm.edu.sa', accreditations: ['NCAAA', 'ABET', 'AACSB'], ranking: 2, totalStudents: 18000, employmentRate: 85.2, verified: true, createdAt: now(), updatedAt: now() },
    { userId: oid('650000000000000000000303'), name: 'King Abdulaziz University', nameAr: 'جامعة الملك عبدالعزيز', type: 'public', typeAr: 'حكومية', established: 1967, location: 'Jeddah', website: 'https://kau.edu.sa', logo: 'https://logo.clearbit.com/kau.edu.sa', accreditations: ['NCAAA', 'ABET'], ranking: 3, totalStudents: 55000, employmentRate: 72.8, verified: true, createdAt: now(), updatedAt: now() },
  ];
  await db.collection('universities').deleteMany({});
  await db.collection('universities').insertMany(universities);
  console.log(`  Inserted ${universities.length} universities`);
}

async function seedSkills(db) {
  console.log('Seeding skills...');
  const skills = [
    // Programming Languages
    { name: 'Python', category: 'technical', subcategory: 'Programming Language', aliases: ['py'], industryDemand: 95, createdAt: now() },
    { name: 'JavaScript', category: 'technical', subcategory: 'Programming Language', aliases: ['js'], industryDemand: 98, createdAt: now() },
    { name: 'TypeScript', category: 'technical', subcategory: 'Programming Language', aliases: ['ts'], industryDemand: 88, createdAt: now() },
    { name: 'Java', category: 'technical', subcategory: 'Programming Language', aliases: [], industryDemand: 90, createdAt: now() },
    { name: 'C++', category: 'technical', subcategory: 'Programming Language', aliases: ['cpp'], industryDemand: 75, createdAt: now() },
    { name: 'C#', category: 'technical', subcategory: 'Programming Language', aliases: ['csharp'], industryDemand: 80, createdAt: now() },
    { name: 'Go', category: 'technical', subcategory: 'Programming Language', aliases: ['golang'], industryDemand: 70, createdAt: now() },
    { name: 'Rust', category: 'technical', subcategory: 'Programming Language', aliases: [], industryDemand: 60, createdAt: now() },
    { name: 'Swift', category: 'technical', subcategory: 'Programming Language', aliases: [], industryDemand: 55, createdAt: now() },
    { name: 'Kotlin', category: 'technical', subcategory: 'Programming Language', aliases: [], industryDemand: 65, createdAt: now() },
    { name: 'PHP', category: 'technical', subcategory: 'Programming Language', aliases: [], industryDemand: 72, createdAt: now() },
    { name: 'Ruby', category: 'technical', subcategory: 'Programming Language', aliases: [], industryDemand: 50, createdAt: now() },
    { name: 'Scala', category: 'technical', subcategory: 'Programming Language', aliases: [], industryDemand: 45, createdAt: now() },
    { name: 'R', category: 'technical', subcategory: 'Programming Language', aliases: [], industryDemand: 58, createdAt: now() },
    { name: 'MATLAB', category: 'technical', subcategory: 'Programming Language', aliases: [], industryDemand: 40, createdAt: now() },
    // Web Frameworks
    { name: 'React', category: 'technical', subcategory: 'Frontend Framework', aliases: ['reactjs'], industryDemand: 95, createdAt: now() },
    { name: 'Next.js', category: 'technical', subcategory: 'Frontend Framework', aliases: ['nextjs'], industryDemand: 82, createdAt: now() },
    { name: 'Vue.js', category: 'technical', subcategory: 'Frontend Framework', aliases: ['vue'], industryDemand: 68, createdAt: now() },
    { name: 'Angular', category: 'technical', subcategory: 'Frontend Framework', aliases: [], industryDemand: 75, createdAt: now() },
    { name: 'Node.js', category: 'technical', subcategory: 'Backend Framework', aliases: ['node'], industryDemand: 92, createdAt: now() },
    { name: 'Express.js', category: 'technical', subcategory: 'Backend Framework', aliases: ['express'], industryDemand: 78, createdAt: now() },
    { name: 'NestJS', category: 'technical', subcategory: 'Backend Framework', aliases: ['nest'], industryDemand: 72, createdAt: now() },
    { name: 'Django', category: 'technical', subcategory: 'Backend Framework', aliases: [], industryDemand: 70, createdAt: now() },
    { name: 'Spring Boot', category: 'technical', subcategory: 'Backend Framework', aliases: ['spring'], industryDemand: 80, createdAt: now() },
    { name: 'Flask', category: 'technical', subcategory: 'Backend Framework', aliases: [], industryDemand: 60, createdAt: now() },
    { name: 'FastAPI', category: 'technical', subcategory: 'Backend Framework', aliases: [], industryDemand: 75, createdAt: now() },
    { name: '.NET Core', category: 'technical', subcategory: 'Backend Framework', aliases: ['dotnet'], industryDemand: 78, createdAt: now() },
    // Databases
    { name: 'SQL', category: 'technical', subcategory: 'Database', aliases: [], industryDemand: 93, createdAt: now() },
    { name: 'PostgreSQL', category: 'technical', subcategory: 'Database', aliases: ['postgres'], industryDemand: 85, createdAt: now() },
    { name: 'MongoDB', category: 'technical', subcategory: 'Database', aliases: ['mongo'], industryDemand: 78, createdAt: now() },
    { name: 'MySQL', category: 'technical', subcategory: 'Database', aliases: [], industryDemand: 82, createdAt: now() },
    { name: 'Redis', category: 'technical', subcategory: 'Database', aliases: [], industryDemand: 75, createdAt: now() },
    { name: 'Elasticsearch', category: 'technical', subcategory: 'Database', aliases: ['elastic'], industryDemand: 65, createdAt: now() },
    // Cloud & DevOps
    { name: 'AWS', category: 'technical', subcategory: 'Cloud', aliases: ['amazon web services'], industryDemand: 90, createdAt: now() },
    { name: 'Azure', category: 'technical', subcategory: 'Cloud', aliases: ['microsoft azure'], industryDemand: 78, createdAt: now() },
    { name: 'Google Cloud', category: 'technical', subcategory: 'Cloud', aliases: ['gcp', 'google cloud platform'], industryDemand: 72, createdAt: now() },
    { name: 'Docker', category: 'technical', subcategory: 'DevOps', aliases: [], industryDemand: 85, createdAt: now() },
    { name: 'Kubernetes', category: 'technical', subcategory: 'DevOps', aliases: ['k8s'], industryDemand: 80, createdAt: now() },
    { name: 'CI/CD', category: 'technical', subcategory: 'DevOps', aliases: ['cicd'], industryDemand: 82, createdAt: now() },
    { name: 'Terraform', category: 'technical', subcategory: 'DevOps', aliases: [], industryDemand: 68, createdAt: now() },
    { name: 'Jenkins', category: 'technical', subcategory: 'DevOps', aliases: [], industryDemand: 65, createdAt: now() },
    { name: 'GitHub Actions', category: 'technical', subcategory: 'DevOps', aliases: [], industryDemand: 78, createdAt: now() },
    // AI/ML
    { name: 'Machine Learning', category: 'technical', subcategory: 'AI/ML', aliases: ['ml'], industryDemand: 85, createdAt: now() },
    { name: 'Deep Learning', category: 'technical', subcategory: 'AI/ML', aliases: ['dl'], industryDemand: 75, createdAt: now() },
    { name: 'TensorFlow', category: 'technical', subcategory: 'AI/ML', aliases: ['tf'], industryDemand: 72, createdAt: now() },
    { name: 'PyTorch', category: 'technical', subcategory: 'AI/ML', aliases: [], industryDemand: 75, createdAt: now() },
    { name: 'Scikit-learn', category: 'technical', subcategory: 'AI/ML', aliases: ['sklearn'], industryDemand: 70, createdAt: now() },
    { name: 'NLP', category: 'technical', subcategory: 'AI/ML', aliases: ['natural language processing'], industryDemand: 78, createdAt: now() },
    { name: 'Computer Vision', category: 'technical', subcategory: 'AI/ML', aliases: ['cv'], industryDemand: 70, createdAt: now() },
    { name: 'Data Science', category: 'technical', subcategory: 'AI/ML', aliases: [], industryDemand: 82, createdAt: now() },
    // Data & Analytics
    { name: 'Data Analysis', category: 'technical', subcategory: 'Data', aliases: ['data analytics'], industryDemand: 85, createdAt: now() },
    { name: 'Power BI', category: 'technical', subcategory: 'Data', aliases: [], industryDemand: 78, createdAt: now() },
    { name: 'Tableau', category: 'technical', subcategory: 'Data', aliases: [], industryDemand: 72, createdAt: now() },
    { name: 'Apache Spark', category: 'technical', subcategory: 'Data', aliases: ['spark'], industryDemand: 68, createdAt: now() },
    { name: 'Hadoop', category: 'technical', subcategory: 'Data', aliases: [], industryDemand: 55, createdAt: now() },
    { name: 'Kafka', category: 'technical', subcategory: 'Data', aliases: ['apache kafka'], industryDemand: 72, createdAt: now() },
    // Mobile
    { name: 'React Native', category: 'technical', subcategory: 'Mobile', aliases: [], industryDemand: 70, createdAt: now() },
    { name: 'Flutter', category: 'technical', subcategory: 'Mobile', aliases: [], industryDemand: 75, createdAt: now() },
    { name: 'iOS Development', category: 'technical', subcategory: 'Mobile', aliases: [], industryDemand: 60, createdAt: now() },
    { name: 'Android Development', category: 'technical', subcategory: 'Mobile', aliases: [], industryDemand: 65, createdAt: now() },
    // Security
    { name: 'Cybersecurity', category: 'technical', subcategory: 'Security', aliases: ['security'], industryDemand: 88, createdAt: now() },
    { name: 'Penetration Testing', category: 'technical', subcategory: 'Security', aliases: ['pentesting'], industryDemand: 75, createdAt: now() },
    // Tools
    { name: 'Git', category: 'technical', subcategory: 'Tools', aliases: ['github', 'gitlab'], industryDemand: 95, createdAt: now() },
    { name: 'Jira', category: 'technical', subcategory: 'Tools', aliases: [], industryDemand: 80, createdAt: now() },
    { name: 'Figma', category: 'technical', subcategory: 'Tools', aliases: [], industryDemand: 78, createdAt: now() },
    { name: 'Linux', category: 'technical', subcategory: 'Tools', aliases: ['unix'], industryDemand: 85, createdAt: now() },
    { name: 'Agile', category: 'technical', subcategory: 'Methodology', aliases: ['scrum', 'kanban'], industryDemand: 88, createdAt: now() },
    { name: 'Microservices', category: 'technical', subcategory: 'Architecture', aliases: [], industryDemand: 82, createdAt: now() },
    { name: 'REST API', category: 'technical', subcategory: 'Architecture', aliases: ['restful'], industryDemand: 92, createdAt: now() },
    { name: 'GraphQL', category: 'technical', subcategory: 'Architecture', aliases: [], industryDemand: 65, createdAt: now() },
    // Soft Skills
    { name: 'Problem Solving', category: 'soft', subcategory: 'Critical Thinking', aliases: [], industryDemand: 98, createdAt: now() },
    { name: 'Communication', category: 'soft', subcategory: 'Interpersonal', aliases: [], industryDemand: 96, createdAt: now() },
    { name: 'Teamwork', category: 'soft', subcategory: 'Interpersonal', aliases: [], industryDemand: 95, createdAt: now() },
    { name: 'Leadership', category: 'soft', subcategory: 'Management', aliases: [], industryDemand: 90, createdAt: now() },
    { name: 'Critical Thinking', category: 'soft', subcategory: 'Critical Thinking', aliases: [], industryDemand: 93, createdAt: now() },
    { name: 'Time Management', category: 'soft', subcategory: 'Personal', aliases: [], industryDemand: 92, createdAt: now() },
    { name: 'Adaptability', category: 'soft', subcategory: 'Personal', aliases: [], industryDemand: 91, createdAt: now() },
    { name: 'Creativity', category: 'soft', subcategory: 'Personal', aliases: [], industryDemand: 88, createdAt: now() },
    { name: 'Emotional Intelligence', category: 'soft', subcategory: 'Interpersonal', aliases: ['eq'], industryDemand: 87, createdAt: now() },
    { name: 'Project Management', category: 'soft', subcategory: 'Management', aliases: ['pm'], industryDemand: 90, createdAt: now() },
    // Languages
    { name: 'Arabic', category: 'language', subcategory: 'Language', aliases: ['العربية'], industryDemand: 85, createdAt: now() },
    { name: 'English', category: 'language', subcategory: 'Language', aliases: ['الإنجليزية'], industryDemand: 95, createdAt: now() },
  ];
  await db.collection('skills').deleteMany({});
  await db.collection('skills').insertMany(skills.map((skill) => ({
    ...skill,
    normalizedName: normalizeSkillName(skill.name),
  })));
  console.log(`  Inserted ${skills.length} skills`);
}

async function seedJobs(db) {
  console.log('Seeding jobs...');
  const jobs = [
    { company: oid('650000000000000000000201'), title: 'Software Engineer - AI/ML', titleAr: 'مهندس برمجيات - ذكاء اصطناعي', description: 'Develop and deploy machine learning models for predictive analytics and natural language processing applications.', descriptionAr: 'تطوير ونشر نماذج التعلم الآلي لتحليلات التنبؤ وتطبيقات معالجة اللغة الطبيعية.', requirements: ['Bachelor\'s in CS or related field', 'Strong Python programming skills', 'Experience with TensorFlow or PyTorch', 'Knowledge of NLP techniques'], requirementsAr: ['بكالوريوس في علوم الحاسب أو مجال ذي صلة', 'مهارات برمجية قوية في Python', 'خبرة مع TensorFlow أو PyTorch', 'معرفة بتقنيات معالجة اللغة الطبيعية'], skills: ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'NLP', 'SQL', 'Git'], experienceLevel: 'entry', location: 'Dhahran', locationAr: 'الظهران', type: 'full_time', typeAr: 'دوام كامل', salary: { min: 15000, max: 22000, currency: 'SAR' }, benefits: ['Health insurance', 'Housing allowance', 'Annual bonus', 'Professional development'], status: 'active', views: 342, applicationsCount: 28, createdAt: now(), updatedAt: now(), expiresAt: new Date('2025-12-31') },
    { company: oid('650000000000000000000201'), title: 'Full Stack Developer', titleAr: 'مطور Full Stack', description: 'Build scalable web applications using React and Node.js for internal digital transformation projects.', descriptionAr: 'بناء تطبيقات ويب قابلة للتوسع باستخدام React و Node.js لمشاريع التحول الرقمي الداخلية.', requirements: ['Bachelor\'s in CS or Software Engineering', '3+ years experience with React', 'Experience with Node.js and Express', 'Knowledge of MongoDB or PostgreSQL'], requirementsAr: ['بكالوريوس في علوم الحاسب أو هندسة البرمجيات', '3+ سنوات خبرة مع React', 'خبرة مع Node.js و Express', 'معرفة بـ MongoDB أو PostgreSQL'], skills: ['JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'SQL', 'Git', 'Docker'], experienceLevel: 'mid', location: 'Dhahran', locationAr: 'الظهران', type: 'full_time', typeAr: 'دوام كامل', salary: { min: 18000, max: 28000, currency: 'SAR' }, benefits: ['Health insurance', 'Housing allowance', 'Annual bonus', 'Stock options'], status: 'active', views: 523, applicationsCount: 45, createdAt: now(), updatedAt: now(), expiresAt: new Date('2025-12-31') },
    { company: oid('650000000000000000000201'), title: 'Data Engineer', titleAr: 'مهندس بيانات', description: 'Design and maintain data pipelines for large-scale oil and gas analytics platform.', descriptionAr: 'تصميم وصيانة خطوط أنابيب البيانات لمنصة تحليلات النفط والغاز واسعة النطاق.', requirements: ['Bachelor\'s in CS or Data Engineering', 'Experience with Apache Spark', 'Strong SQL skills', 'Knowledge of cloud platforms (AWS/Azure)'], requirementsAr: ['بكالوريوس في علوم الحاسب أو هندسة البيانات', 'خبرة مع Apache Spark', 'مهارات SQL قوية', 'معرفة بمنصات السحابة (AWS/Azure)'], skills: ['Python', 'SQL', 'Apache Spark', 'AWS', 'PostgreSQL', 'Kafka', 'Docker', 'Kubernetes'], experienceLevel: 'mid', location: 'Dhahran', locationAr: 'الظهران', type: 'full_time', typeAr: 'دوام كامل', salary: { min: 20000, max: 32000, currency: 'SAR' }, benefits: ['Health insurance', 'Housing allowance', 'Annual bonus', 'Professional certification support'], status: 'active', views: 289, applicationsCount: 19, createdAt: now(), updatedAt: now(), expiresAt: new Date('2025-12-31') },
    { company: oid('650000000000000000000202'), title: 'Frontend Developer (React)', titleAr: 'مطور Frontend (React)', description: 'Create modern, responsive user interfaces for STC digital products and customer portals.', descriptionAr: 'إنشاء واجهات مستخدم حديثة ومتجاوبة لمنتجات STC الرقمية وبوابات العملاء.', requirements: ['Bachelor\'s in CS or related field', 'Strong JavaScript/TypeScript skills', 'Experience with React and Next.js', 'Knowledge of CSS frameworks (Tailwind)'], requirementsAr: ['بكالوريوس في علوم الحاسب أو مجال ذي صلة', 'مهارات قوية في JavaScript/TypeScript', 'خبرة مع React و Next.js', 'معرفة بإطارات CSS (Tailwind)'], skills: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'Git', 'REST API'], experienceLevel: 'entry', location: 'Riyadh', locationAr: 'الرياض', type: 'full_time', typeAr: 'دوام كامل', salary: { min: 12000, max: 20000, currency: 'SAR' }, benefits: ['Health insurance', 'Phone allowance', 'Gym membership', 'Training budget'], status: 'active', views: 678, applicationsCount: 52, createdAt: now(), updatedAt: now(), expiresAt: new Date('2025-12-31') },
    { company: oid('650000000000000000000202'), title: 'Backend Developer (Java/Spring)', titleAr: 'مطور Backend (Java/Spring)', description: 'Develop microservices architecture for STC\'s next-generation telecom platform.', descriptionAr: 'تطوير بنية الخدمات المصغرة لمنصة الاتصالات الجيل التالي لـ STC.', requirements: ['Bachelor\'s in CS or Software Engineering', 'Experience with Java and Spring Boot', 'Knowledge of microservices architecture', 'Experience with message queues (Kafka)'], requirementsAr: ['بكالوريوس في علوم الحاسب أو هندسة البرمجيات', 'خبرة مع Java و Spring Boot', 'معرفة ببنية الخدمات المصغرة', 'خبرة مع قوائم الانتظار (Kafka)'], skills: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'SQL', 'Docker', 'Kubernetes', 'REST API'], experienceLevel: 'mid', location: 'Riyadh', locationAr: 'الرياض', type: 'full_time', typeAr: 'دوام كامل', salary: { min: 18000, max: 28000, currency: 'SAR' }, benefits: ['Health insurance', 'Phone allowance', 'Annual bonus', 'Professional development'], status: 'active', views: 412, applicationsCount: 31, createdAt: now(), updatedAt: now(), expiresAt: new Date('2025-12-31') },
    { company: oid('650000000000000000000202'), title: 'DevOps Engineer', titleAr: 'مهندس DevOps', description: 'Manage CI/CD pipelines, cloud infrastructure, and Kubernetes deployments for STC digital services.', descriptionAr: 'إدارة خطوط CI/CD، البنية التحتية السحابية، ونشر Kubernetes لخدمات STC الرقمية.', requirements: ['Bachelor\'s in CS or related field', 'Experience with Kubernetes and Docker', 'Knowledge of CI/CD tools (Jenkins/GitHub Actions)', 'Cloud platform experience (AWS/Azure)'], requirementsAr: ['بكالوريوس في علوم الحاسب أو مجال ذي صلة', 'خبرة مع Kubernetes و Docker', 'معرفة بأدوات CI/CD (Jenkins/GitHub Actions)', 'خبرة مع منصات السحابة (AWS/Azure)'], skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Jenkins', 'GitHub Actions', 'Terraform', 'Linux'], experienceLevel: 'mid', location: 'Riyadh', locationAr: 'الرياض', type: 'full_time', typeAr: 'دوام كامل', salary: { min: 20000, max: 30000, currency: 'SAR' }, benefits: ['Health insurance', 'Phone allowance', 'Annual bonus', 'Certification support'], status: 'active', views: 356, applicationsCount: 24, createdAt: now(), updatedAt: now(), expiresAt: new Date('2025-12-31') },
    { company: oid('650000000000000000000203'), title: 'Chemical Process Engineer', titleAr: 'مهندس عمليات كيميائية', description: 'Optimize chemical manufacturing processes and implement digital solutions for SABIC production facilities.', descriptionAr: 'تحسين عمليات التصنيع الكيميائي وتنفيذ الحلول الرقمية لمنشآت إنتاج سابك.', requirements: ['Bachelor\'s in Chemical Engineering', 'Knowledge of process simulation software', 'Experience with industrial automation', 'Understanding of safety protocols'], requirementsAr: ['بكالوريوس في الهندسة الكيميائية', 'معرفة ببرامج محاكاة العمليات', 'خبرة مع الأتمتة الصناعية', 'فهم بروتوكولات السلامة'], skills: ['MATLAB', 'Data Analysis', 'Problem Solving', 'Project Management', 'Communication'], experienceLevel: 'mid', location: 'Jubail', locationAr: 'الجبيل', type: 'full_time', typeAr: 'دوام كامل', salary: { min: 18000, max: 28000, currency: 'SAR' }, benefits: ['Health insurance', 'Housing', 'Annual bonus', 'Career growth'], status: 'active', views: 198, applicationsCount: 15, createdAt: now(), updatedAt: now(), expiresAt: new Date('2025-12-31') },
    { company: oid('650000000000000000000203'), title: 'IT Solutions Architect', titleAr: 'مهندس حلول تقنية المعلومات', description: 'Design enterprise IT architecture and digital transformation strategies for SABIC global operations.', descriptionAr: 'تصميم بنية تقنية المعلومات للمؤسسات واستراتيجيات التحول الرقمي لعمليات سابك العالمية.', requirements: ['Bachelor\'s in CS or IT', 'Experience with enterprise architecture', 'Knowledge of cloud platforms', 'Strong stakeholder management'], requirementsAr: ['بكالوريوس في علوم الحاسب أو تقنية المعلومات', 'خبرة مع بنية المؤسسات', 'معرفة بمنصات السحابة', 'إدارة أصحاب المصلحة بقوة'], skills: ['AWS', 'Azure', 'Microservices', 'Project Management', 'Communication', 'Problem Solving', 'Agile'], experienceLevel: 'senior', location: 'Riyadh', locationAr: 'الرياض', type: 'full_time', typeAr: 'دوام كامل', salary: { min: 25000, max: 40000, currency: 'SAR' }, benefits: ['Health insurance', 'Housing', 'Annual bonus', 'Stock options'], status: 'active', views: 267, applicationsCount: 22, createdAt: now(), updatedAt: now(), expiresAt: new Date('2025-12-31') },
    { company: oid('650000000000000000000204'), title: 'Renewable Energy Engineer', titleAr: 'مهندس طاقة متجددة', description: 'Design and implement renewable energy solutions for ACWA Power solar and wind projects.', descriptionAr: 'تصميم وتنفيذ حلول الطاقة المتجددة لمشاريع الطاقة الشمسية ورياح ACWA Power.', requirements: ['Bachelor\'s in Electrical or Mechanical Engineering', 'Experience with renewable energy systems', 'Knowledge of power systems', 'Project management skills'], requirementsAr: ['بكالوريوس في الهندسة الكهربائية أو الميكانيكية', 'خبرة مع أنظمة الطاقة المتجددة', 'معرفة بأنظمة الطاقة', 'مهارات إدارة المشاريع'], skills: ['MATLAB', 'Data Analysis', 'Project Management', 'Problem Solving', 'Communication'], experienceLevel: 'mid', location: 'Riyadh', locationAr: 'الرياض', type: 'full_time', typeAr: 'دوام كامل', salary: { min: 20000, max: 32000, currency: 'SAR' }, benefits: ['Health insurance', 'Housing', 'Annual bonus', 'International exposure'], status: 'active', views: 234, applicationsCount: 18, createdAt: now(), updatedAt: now(), expiresAt: new Date('2025-12-31') },
    { company: oid('650000000000000000000204'), title: 'Data Scientist', titleAr: 'عالم بيانات', description: 'Build predictive models for energy optimization and operational efficiency across ACWA Power plants.', descriptionAr: 'بناء نماذج تنبؤية لتحسين الطاقة والكفاءة التشغيلية عبر محطات ACWA Power.', requirements: ['Master\'s or PhD in Data Science, CS, or Statistics', 'Experience with machine learning frameworks', 'Strong Python and SQL skills', 'Domain knowledge in energy sector'], requirementsAr: ['ماجستير أو دكتوراه في علم البيانات أو علوم الحاسب أو الإحصاء', 'خبرة مع إطارات التعلم الآلي', 'مهارات Python و SQL قوية', 'معرفة بمجال الطاقة'], skills: ['Python', 'Machine Learning', 'SQL', 'Data Analysis', 'TensorFlow', 'Power BI', 'Problem Solving'], experienceLevel: 'senior', location: 'Riyadh', locationAr: 'الرياض', type: 'full_time', typeAr: 'دوام كامل', salary: { min: 25000, max: 38000, currency: 'SAR' }, benefits: ['Health insurance', 'Housing', 'Annual bonus', 'Conference attendance'], status: 'active', views: 312, applicationsCount: 26, createdAt: now(), updatedAt: now(), expiresAt: new Date('2025-12-31') },
    { company: oid('650000000000000000000205'), title: 'Smart City IoT Engineer', titleAr: 'مهندس إنترنت الأشياء للمدن الذكية', description: 'Develop IoT solutions for NEOM\'s smart city infrastructure including sensors, connectivity, and data platforms.', descriptionAr: 'تطوير حلول إنترنت الأشياء لبنية المدينة الذكية في نيوم بما في ذلك المستشعرات والاتصال ومنصات البيانات.', requirements: ['Bachelor\'s in Computer Engineering or IoT', 'Experience with IoT protocols (MQTT, CoAP)', 'Knowledge of embedded systems', 'Experience with cloud IoT platforms'], requirementsAr: ['بكالوريوس في هندسة الحاسب أو إنترنت الأشياء', 'خبرة مع بروتوكولات IoT (MQTT, CoAP)', 'معرفة بالأنظمة المدمجة', 'خبرة مع منصات IoT السحابية'], skills: ['Python', 'C++', 'IoT', 'Embedded Systems', 'AWS', 'Docker', 'Problem Solving'], experienceLevel: 'mid', location: 'NEOM', locationAr: 'نيوم', type: 'full_time', typeAr: 'دوام كامل', salary: { min: 22000, max: 35000, currency: 'SAR' }, benefits: ['Housing provided', 'Health insurance', 'Annual bonus', 'Relocation support'], status: 'active', views: 445, applicationsCount: 38, createdAt: now(), updatedAt: now(), expiresAt: new Date('2025-12-31') },
    { company: oid('650000000000000000000205'), title: 'Cloud Infrastructure Engineer', titleAr: 'مهندس بنية سحابية', description: 'Design and manage NEOM\'s cloud-native infrastructure using AWS, Kubernetes, and Terraform.', descriptionAr: 'تصميم وإدارة البنية التحتية السحابية لنيوم باستخدام AWS و Kubernetes و Terraform.', requirements: ['Bachelor\'s in CS or related field', 'Experience with AWS and Kubernetes', 'Knowledge of Infrastructure as Code', 'Strong Linux skills'], requirementsAr: ['بكالوريوس في علوم الحاسب أو مجال ذي صلة', 'خبرة مع AWS و Kubernetes', 'معرفة بالبنية التحتية ككود', 'مهارات Linux قوية'], skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Linux', 'CI/CD', 'Python', 'Problem Solving'], experienceLevel: 'mid', location: 'NEOM', locationAr: 'نيوم', type: 'full_time', typeAr: 'دوام كامل', salary: { min: 25000, max: 38000, currency: 'SAR' }, benefits: ['Housing provided', 'Health insurance', 'Annual bonus', 'Stock options'], status: 'active', views: 389, applicationsCount: 29, createdAt: now(), updatedAt: now(), expiresAt: new Date('2025-12-31') },
  ];
  await db.collection('jobs').deleteMany({});
  await db.collection('jobs').insertMany(jobs);
  console.log(`  Inserted ${jobs.length} jobs`);
}

async function seedApplications(db) {
  console.log('Seeding applications...');
  const applications = [
    { student: oid('650000000000000000000101'), job: oid('650000000000000000000001'), status: 'submitted', matchScore: 87.5, notes: 'Strong candidate with relevant AI/ML background', coverLetter: 'I am excited to apply for this position...', timeline: [{ status: 'submitted', date: now(), note: 'Application submitted' }], createdAt: now(), updatedAt: now() },
    { student: oid('650000000000000000000101'), job: oid('650000000000000000000002'), status: 'interview', matchScore: 91.2, notes: 'Excellent full-stack skills', coverLetter: 'With my experience in React and Node.js...', timeline: [{ status: 'submitted', date: new Date(Date.now() - 7 * 86400000), note: 'Application submitted' }, { status: 'reviewed', date: new Date(Date.now() - 5 * 86400000), note: 'Resume reviewed - strong candidate' }, { status: 'interview', date: new Date(Date.now() - 2 * 86400000), note: 'Technical interview scheduled' }], createdAt: new Date(Date.now() - 7 * 86400000), updatedAt: now() },
    { student: oid('650000000000000000000102'), job: oid('650000000000000000000005'), status: 'submitted', matchScore: 78.4, notes: '', coverLetter: '', timeline: [{ status: 'submitted', date: now(), note: 'Application submitted' }], createdAt: now(), updatedAt: now() },
    { student: oid('650000000000000000000102'), job: oid('650000000000000000000006'), status: 'reviewed', matchScore: 82.7, notes: 'Good DevOps background', coverLetter: 'My experience with Kubernetes...', timeline: [{ status: 'submitted', date: new Date(Date.now() - 10 * 86400000), note: 'Application submitted' }, { status: 'reviewed', date: new Date(Date.now() - 8 * 86400000), note: 'Under review' }], createdAt: new Date(Date.now() - 10 * 86400000), updatedAt: now() },
    { student: oid('650000000000000000000103'), job: oid('650000000000000000000011'), status: 'submitted', matchScore: 65.3, notes: '', coverLetter: '', timeline: [{ status: 'submitted', date: now(), note: 'Application submitted' }], createdAt: now(), updatedAt: now() },
    { student: oid('650000000000000000000104'), job: oid('650000000000000000000010'), status: 'interview', matchScore: 85.1, notes: 'Strong data analysis skills', coverLetter: 'My background in BI and analytics...', timeline: [{ status: 'submitted', date: new Date(Date.now() - 14 * 86400000), note: 'Application submitted' }, { status: 'reviewed', date: new Date(Date.now() - 12 * 86400000), note: 'Resume shortlisted' }, { status: 'interview', date: new Date(Date.now() - 5 * 86400000), note: 'Interview completed - awaiting decision' }], createdAt: new Date(Date.now() - 14 * 86400000), updatedAt: now() },
    { student: oid('650000000000000000000105'), job: oid('650000000000000000000004'), status: 'accepted', matchScore: 93.8, notes: 'Outstanding frontend skills', coverLetter: 'As a passionate frontend developer...', timeline: [{ status: 'submitted', date: new Date(Date.now() - 21 * 86400000), note: 'Application submitted' }, { status: 'reviewed', date: new Date(Date.now() - 18 * 86400000), note: 'Portfolio reviewed - excellent work' }, { status: 'interview', date: new Date(Date.now() - 10 * 86400000), note: 'Technical interview passed' }, { status: 'accepted', date: new Date(Date.now() - 3 * 86400000), note: 'Offer accepted!' }], createdAt: new Date(Date.now() - 21 * 86400000), updatedAt: now() },
  ];
  const applicationsCollection = db.collection('applications');
  await applicationsCollection.deleteMany({});
  await dropIndexIfExists(applicationsCollection, 'student_1_opportunity_1');
  await applicationsCollection.insertMany(applications.map(({ student, job, ...application }) => ({
    ...application,
    studentId: student,
    jobId: job,
  })));
  console.log(`  Inserted ${applications.length} applications`);
}

async function seedMatchResults(db) {
  console.log('Seeding match results...');
  const matchResults = [
    { student: oid('650000000000000000000101'), job: oid('650000000000000000000001'), overallScore: 87.5, skillScore: 90.0, experienceScore: 75.0, educationScore: 85.0, semanticScore: 88.0, factorBreakdown: { skills: { weight: 0.6, score: 90 }, experience: { weight: 0.2, score: 75 }, projects: { weight: 0.1, score: 85 }, semantic: { weight: 0.1, score: 88 } }, skillMatches: [{ skill: 'Python', jobRequired: true, studentLevel: 0.9, importance: 0.95, matchScore: 94 }, { skill: 'Machine Learning', jobRequired: true, studentLevel: 0.7, importance: 0.9, matchScore: 78 }, { skill: 'TensorFlow', jobRequired: true, studentLevel: 0.6, importance: 0.85, matchScore: 71 }, { skill: 'NLP', jobRequired: true, studentLevel: 0.5, importance: 0.8, matchScore: 63 }], missingSkills: [{ skill: 'Deep Learning', importance: 0.8, studentLevel: 0, gap: 1.0 }], recommendations: ['Complete a Deep Learning specialization course', 'Practice TensorFlow with real projects'], calculatedAt: now(), createdAt: now(), updatedAt: now() },
    { student: oid('650000000000000000000101'), job: oid('650000000000000000000002'), overallScore: 91.2, skillScore: 95.0, experienceScore: 80.0, educationScore: 90.0, semanticScore: 92.0, factorBreakdown: { skills: { weight: 0.6, score: 95 }, experience: { weight: 0.2, score: 80 }, projects: { weight: 0.1, score: 90 }, semantic: { weight: 0.1, score: 92 } }, skillMatches: [{ skill: 'JavaScript', jobRequired: true, studentLevel: 0.85, importance: 0.98, matchScore: 87 }, { skill: 'React', jobRequired: true, studentLevel: 0.8, importance: 0.95, matchScore: 84 }, { skill: 'Node.js', jobRequired: true, studentLevel: 0.75, importance: 0.92, matchScore: 82 }, { skill: 'MongoDB', jobRequired: true, studentLevel: 0.7, importance: 0.78, matchScore: 90 }], missingSkills: [{ skill: 'Docker', importance: 0.85, studentLevel: 0.6, gap: 0.29 }], recommendations: ['Improve Docker skills with hands-on projects'], calculatedAt: now(), createdAt: now(), updatedAt: now() },
    { student: oid('650000000000000000000105'), job: oid('650000000000000000000004'), overallScore: 93.8, skillScore: 96.0, experienceScore: 85.0, educationScore: 92.0, semanticScore: 95.0, factorBreakdown: { skills: { weight: 0.6, score: 96 }, experience: { weight: 0.2, score: 85 }, projects: { weight: 0.1, score: 92 }, semantic: { weight: 0.1, score: 95 } }, skillMatches: [{ skill: 'React', jobRequired: true, studentLevel: 0.95, importance: 0.95, matchScore: 100 }, { skill: 'TypeScript', jobRequired: true, studentLevel: 0.9, importance: 0.88, matchScore: 97 }, { skill: 'JavaScript', jobRequired: true, studentLevel: 0.9, importance: 0.98, matchScore: 92 }, { skill: 'Next.js', jobRequired: false, studentLevel: 0.85, importance: 0.82, matchScore: 96 }], missingSkills: [], recommendations: ['Excellent match! Consider applying for senior roles too'], calculatedAt: now(), createdAt: now(), updatedAt: now() },
  ];
  const matchResultsCollection = db.collection('matchresults');
  await matchResultsCollection.deleteMany({});
  await dropIndexIfExists(matchResultsCollection, 'ix_match_student_job_unique');
  await matchResultsCollection.insertMany(matchResults);
  console.log(`  Inserted ${matchResults.length} match results`);
}

async function seedNotifications(db) {
  console.log('Seeding notifications...');
  const notifications = [
    { user: oid('650000000000000000000101'), type: 'match', title: 'New Job Match!', titleAr: 'تطابق وظيفي جديد!', message: 'You have a 91% match with Full Stack Developer at Aramco', messageAr: 'لديك تطابق 91% مع وظيفة مطور Full Stack في أرامكو', read: false, data: { jobId: oid('650000000000000000000002'), matchScore: 91.2 }, createdAt: now(), updatedAt: now() },
    { user: oid('650000000000000000000101'), type: 'application_update', title: 'Interview Scheduled', titleAr: 'تم تحديد موعد المقابلة', message: 'Your interview for Full Stack Developer is scheduled for tomorrow', messageAr: 'مقابلتك لوظيفة مطور Full Stack مجدولة لغداً', read: false, data: { applicationId: oid('650000000000000000000001'), status: 'interview' }, createdAt: now(), updatedAt: now() },
    { user: oid('650000000000000000000105'), type: 'application_update', title: 'Application Accepted!', titleAr: 'تم قبول طلبك!', message: 'Congratulations! Your application for Frontend Developer at STC has been accepted', messageAr: 'تهانينا! تم قبول طلبك لوظيفة مطور Frontend في STC', read: true, data: { applicationId: oid('650000000000000000000007'), status: 'accepted' }, createdAt: new Date(Date.now() - 3 * 86400000), updatedAt: now() },
    { user: oid('650000000000000000000201'), type: 'application', title: 'New Application', titleAr: 'طلب جديد', message: 'Ahmed Al-Rashid applied for Software Engineer - AI/ML position', messageAr: 'قدم أحمد الراشد على وظيفة مهندس برمجيات - ذكاء اصطناعي', read: false, data: { applicationId: oid('650000000000000000000001'), studentId: oid('650000000000000000000101') }, createdAt: now(), updatedAt: now() },
    { user: oid('650000000000000000000301'), type: 'system', title: 'Monthly Report Ready', titleAr: 'التقرير الشهري جاهز', message: 'Your university employment report for June 2025 is now available', messageAr: 'تقرير التوظيف الشهري لشهر يونيو 2025 متاح الآن', read: false, data: { reportType: 'monthly', month: 'June' }, createdAt: now(), updatedAt: now() },
  ];
  await db.collection('notifications').deleteMany({});
  await db.collection('notifications').insertMany(notifications);
  console.log(`  Inserted ${notifications.length} notifications`);
}

async function seedAuditLogs(db) {
  console.log('Seeding audit logs...');
  const auditLogs = [
    { user: oid('650000000000000000000001'), action: 'USER_LOGIN', resource: 'auth', resourceId: '650000000000000000000001', details: { ip: '192.168.1.1', userAgent: 'Mozilla/5.0' }, severity: 'info', createdAt: new Date(Date.now() - 1 * 3600000) },
    { user: oid('650000000000000000000101'), action: 'APPLICATION_SUBMIT', resource: 'applications', resourceId: 'app-001', details: { jobId: 'job-001' }, severity: 'info', createdAt: new Date(Date.now() - 2 * 3600000) },
    { user: oid('650000000000000000000201'), action: 'JOB_POSTED', resource: 'jobs', resourceId: 'job-001', details: { title: 'Software Engineer - AI/ML' }, severity: 'info', createdAt: new Date(Date.now() - 24 * 3600000) },
    { user: oid('650000000000000000000001'), action: 'USER_ROLE_UPDATED', resource: 'users', resourceId: '650000000000000000000401', details: { oldRole: 'student', newRole: 'coordinator' }, severity: 'warning', createdAt: new Date(Date.now() - 48 * 3600000) },
    { user: null, action: 'FAILED_LOGIN', resource: 'auth', resourceId: null, details: { email: 'unknown@email.com', ip: '10.0.0.1', reason: 'Invalid credentials' }, severity: 'warning', createdAt: new Date(Date.now() - 0.5 * 3600000) },
  ];
  await db.collection('auditlogs').deleteMany({});
  await db.collection('auditlogs').insertMany(auditLogs);
  console.log(`  Inserted ${auditLogs.length} audit logs`);
}

async function seedMarketData(db) {
  console.log('Seeding market data...');
  const marketData = [
    { skill: 'Python', demandTrend: 'up', demandScore: 95, supplyScore: 72, salaryRange: { min: 18000, max: 45000, currency: 'SAR' }, jobCount: 1245, growthRate: 15.2, region: 'KSA', period: '2025-Q2', createdAt: now() },
    { skill: 'JavaScript', demandTrend: 'up', demandScore: 98, supplyScore: 85, salaryRange: { min: 15000, max: 38000, currency: 'SAR' }, jobCount: 2100, growthRate: 12.8, region: 'KSA', period: '2025-Q2', createdAt: now() },
    { skill: 'React', demandTrend: 'up', demandScore: 95, supplyScore: 80, salaryRange: { min: 16000, max: 40000, currency: 'SAR' }, jobCount: 1680, growthRate: 14.3, region: 'KSA', period: '2025-Q2', createdAt: now() },
    { skill: 'Machine Learning', demandTrend: 'up', demandScore: 85, supplyScore: 45, salaryRange: { min: 20000, max: 50000, currency: 'SAR' }, jobCount: 890, growthRate: 22.5, region: 'KSA', period: '2025-Q2', createdAt: now() },
    { skill: 'Data Science', demandTrend: 'up', demandScore: 82, supplyScore: 50, salaryRange: { min: 19000, max: 48000, currency: 'SAR' }, jobCount: 756, growthRate: 18.7, region: 'KSA', period: '2025-Q2', createdAt: now() },
    { skill: 'AWS', demandTrend: 'up', demandScore: 90, supplyScore: 55, salaryRange: { min: 20000, max: 52000, currency: 'SAR' }, jobCount: 1120, growthRate: 16.4, region: 'KSA', period: '2025-Q2', createdAt: now() },
    { skill: 'Cybersecurity', demandTrend: 'up', demandScore: 88, supplyScore: 40, salaryRange: { min: 22000, max: 55000, currency: 'SAR' }, jobCount: 678, growthRate: 25.3, region: 'KSA', period: '2025-Q2', createdAt: now() },
    { skill: 'Java', demandTrend: 'stable', demandScore: 90, supplyScore: 78, salaryRange: { min: 18000, max: 42000, currency: 'SAR' }, jobCount: 1560, growthRate: 8.2, region: 'KSA', period: '2025-Q2', createdAt: now() },
    { skill: 'SQL', demandTrend: 'stable', demandScore: 93, supplyScore: 82, salaryRange: { min: 16000, max: 38000, currency: 'SAR' }, jobCount: 1890, growthRate: 6.5, region: 'KSA', period: '2025-Q2', createdAt: now() },
    { skill: 'DevOps', demandTrend: 'up', demandScore: 86, supplyScore: 48, salaryRange: { min: 20000, max: 48000, currency: 'SAR' }, jobCount: 945, growthRate: 19.8, region: 'KSA', period: '2025-Q2', createdAt: now() },
  ];
  await db.collection('marketdatas').deleteMany({});
  await db.collection('marketdatas').insertMany(marketData);
  console.log(`  Inserted ${marketData.length} market data entries`);
}

async function seedColleges(db) {
  console.log('Seeding colleges...');
  const colleges = [
    { university: oid('650000000000000000000301'), name: 'College of Computer and Information Sciences', nameAr: 'كلية علوم الحاسب والمعلومات', code: 'CCIS', description: 'Leading computing education in KSA', established: 1984, dean: 'Dr. Abdullah Al-Subaihi', studentCount: 5200, employmentRate: 82.5, createdAt: now(), updatedAt: now() },
    { university: oid('650000000000000000000301'), name: 'College of Engineering', nameAr: 'كلية الهندسة', code: 'CE', description: 'Premier engineering college', established: 1957, dean: 'Dr. Faisal Al-Faisal', studentCount: 6800, employmentRate: 79.2, createdAt: now(), updatedAt: now() },
    { university: oid('650000000000000000000302'), name: 'College of Computer Sciences and Engineering', nameAr: 'كلية علوم وهندسة الحاسب', code: 'CCSE', description: 'Computing and engineering excellence', established: 1974, dean: 'Dr. Khalid Al-Angari', studentCount: 3200, employmentRate: 88.7, createdAt: now(), updatedAt: now() },
    { university: oid('650000000000000000000303'), name: 'Faculty of Engineering', nameAr: 'كلية الهندسة', code: 'FE', description: 'Engineering education pioneer', established: 1967, dean: 'Dr. Mohammed Al-Atiq', studentCount: 7500, employmentRate: 76.3, createdAt: now(), updatedAt: now() },
    { university: oid('650000000000000000000303'), name: 'Faculty of Computing and Information Technology', nameAr: 'كلية الحاسبات وتقنية المعلومات', code: 'FCIT', description: 'Modern computing programs', established: 2002, dean: 'Dr. Sami Al-Salamah', studentCount: 4100, employmentRate: 71.8, createdAt: now(), updatedAt: now() },
  ];
  await db.collection('colleges').deleteMany({});
  await db.collection('colleges').insertMany(colleges);
  console.log(`  Inserted ${colleges.length} colleges`);
}

async function seedMessages(db) {
  console.log('Seeding messages...');
  const messages = [
    { sender: oid('650000000000000000000201'), receiver: oid('650000000000000000000101'), content: 'Thank you for applying to the Software Engineer position. We would like to schedule an interview.', contentAr: 'شكراً لتقديمك على وظيفة مهندس البرمجيات. نود تحديد موعد لمقابلة.', read: true, createdAt: new Date(Date.now() - 2 * 86400000) },
    { sender: oid('650000000000000000000101'), receiver: oid('650000000000000000000201'), content: 'I am available for an interview on Sunday or Monday. Thank you for the opportunity!', contentAr: 'أنا متاح للمقابلة يوم الأحد أو الاثنين. شكراً على الفرصة!', read: true, createdAt: new Date(Date.now() - 1.5 * 86400000) },
    { sender: oid('650000000000000000000201'), receiver: oid('650000000000000000000101'), content: 'Great! We have scheduled your technical interview for Sunday at 10:00 AM.', contentAr: 'ممتاز! لقد حددنا مقابلتك التقنية يوم الأحد الساعة 10:00 صباحاً.', read: false, createdAt: new Date(Date.now() - 1 * 86400000) },
    { sender: oid('650000000000000000000301'), receiver: oid('650000000000000000000101'), content: 'Your graduation documents have been verified successfully.', contentAr: 'تم التحقق من مستندات تخرجك بنجاح.', read: true, createdAt: new Date(Date.now() - 5 * 86400000) },
  ];
  await db.collection('messages').deleteMany({});
  await db.collection('messages').insertMany(messages);
  console.log(`  Inserted ${messages.length} messages`);
}

// Main seed function
async function seed() {
  if (process.env.ENABLE_LEGACY_DESTRUCTIVE_SEED !== 'true') {
    throw new Error('This destructive legacy seed is disabled. Use madar-backend npm run seed:yemen-universities for the verified academic directory, or seed:test-accounts for isolated development accounts.');
  }
  console.log('\n========================================');
  console.log('  MADAR Platform - Seed Data');
  console.log('========================================\n');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db();

    // Seed all collections
    await seedRoles(db);
    await seedPermissions(db);
    await seedUsers(db);
    await seedStudents(db);
    await seedCompanies(db);
    // Deliberately do not restore the obsolete hard-coded university directory.
    await seedSkills(db);
    // Colleges are imported with their verified university hierarchy by seed:yemen-universities.
    await seedJobs(db);
    await seedApplications(db);
    await seedMatchResults(db);
    await seedNotifications(db);
    await seedAuditLogs(db);
    await seedMarketData(db);
    await seedMessages(db);

    console.log('\n========================================');
    console.log('  Seed completed successfully!');
    console.log('========================================');
    console.log('\nLogin credentials for testing:');
    console.log('  Admin:     admin@madar.sa / Madar@2024');
    console.log('  Student 1: ahmed@student.ksu.edu.sa / Madar@2024');
    console.log('  Student 2: sara@student.kau.edu.sa / Madar@2024');
    console.log('  Company:   hr@aramco.com / Madar@2024');
    console.log('  University: cs@ksu.edu.sa / Madar@2024');
    console.log('  Coordinator: coordinator@ksu.edu.sa / Madar@2024');
    console.log('========================================\n');

  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

// Run seed
seed();
