const suffix = () => `${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;

export const isDevelopmentTestDataEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_TEST_DATA === 'true';

export function generateUniversityTestData() {
  const id = suffix();
  const password = `MadarDev${id.slice(-4)}Aa1`;
  return {
    accountType: 'university' as const,
    fullName: 'مسؤول جامعة تجريبي',
    email: `university.${id}@madar.test`,
    phone: '+966500000010',
    password,
    confirmPassword: password,
    universityName: `جامعة مدار التجريبية ${id.slice(-4)}`,
    universityDescription: 'جامعة تجريبية لاختبار التسجيل وإدارة البوابة المؤسسية.',
    location: 'الرياض، المملكة العربية السعودية',
    universityWebsite: 'https://example.edu',
    officialContact: `office.${id}@madar.test`,
    logo: 'https://placehold.co/256x256/png?text=MADAR',
    jobTitle: 'مدير العلاقات المؤسسية',
    universityNameAr: 'جامعة مدار التجريبية',
    universityType: 'private',
    country: 'المملكة العربية السعودية',
    city: 'الرياض',
    address: 'حي الجامعة، طريق الاختبار',
    universityOfficialEmail: 'registrar@madar.test',
    officialPhone: '+966500000014',
    emailDomain: 'madar.test',
    licenseNumber: 'UNI-TEST',
    accreditationDocumentUrl: 'https://example.edu/accreditation.pdf',
    registrationNotes: 'طلب تجريبي للتحقق من دورة اعتماد الجامعة.',
    acceptedTerms: true,
  };
}

export function generateUniversityProfileTestData() {
  const id = suffix();
  return {
    name: `جامعة مدار للتطوير ${id.slice(-4)}`,
    nameAr: 'جامعة مدار للتطوير',
    type: 'private',
    description: 'ملف جامعة تجريبي للتحقق من تحديث البيانات المؤسسية ونماذج التواصل.',
    city: 'الرياض', country: 'المملكة العربية السعودية', address: 'حي الجامعة، طريق الاختبار',
    website: 'https://example.edu', phone: '+966500000011',
    contactEmail: `contact.${id}@madar.test`, officialContactEmail: `office.${id}@madar.test`,
    officialContactName: 'إدارة العلاقات المؤسسية', officialContactPhone: '+966500000015',
    emailDomain: 'example.edu',
    logoUrl: 'https://placehold.co/256x256/png?text=MADAR',
  };
}

export function generateCollegeTestData() {
  const id = suffix().slice(-6);
  return { name: 'كلية الحوسبة والذكاء الاصطناعي', code: `CAI-${id}`, description: 'كلية تجريبية لاختبار إدارة الهيكل الأكاديمي.', dean: 'د. أحمد التجريبي', established: new Date().getFullYear() };
}

export function generateDepartmentTestData() {
  const id = suffix().slice(-6);
  return { name: 'قسم علوم البيانات', code: `DS-${id}`, description: 'قسم تجريبي لاختبار عمليات الإضافة والتعديل.', head: 'د. سارة التجريبية' };
}

export function generateUniversityStaffTestData(collegeId?: string) {
  const id = suffix();
  return { name: 'منسق كلية تجريبي', email: `coordinator.${id}@madar.test`, phone: '+966500000012', role: 'coordinator' as const, collegeId: collegeId || '', message: 'دعوة تجريبية للتحقق من صلاحيات منسق الكلية.' };
}

export function generateStudyPlanTestData() {
  const id = suffix().slice(-4);
  return { name: 'خطة علوم الحاسب ' + id, nameAr: 'بكالوريوس علوم الحاسب ' + id, description: 'خطة دراسية تجريبية لاختبار إدارة المناهج.', academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1), totalCreditHours: 132 };
}

export function generateCourseTestData() {
  const id = suffix().slice(-4);
  return { code: 'CS-' + id, name: 'تطبيقات الذكاء الاصطناعي', nameAr: 'تطبيقات الذكاء الاصطناعي', description: 'مقرر تجريبي يربط مخرجات التعلم بمتطلبات السوق.', creditHours: 3, level: 7, semester: 1, type: 'required' as const };
}

export function generateAcademicRecommendationTestData() {
  return { title: 'إضافة مشروع تطبيقي في الذكاء الاصطناعي', description: 'تحديث الخطة لزيادة التطبيق العملي للمهارات الأكثر طلبًا.', type: 'add_project', evidence: 'ارتفاع الطلب في بيانات سوق العمل', marketDemand: 85, studentImpact: 'تحسين الجاهزية وملف المشاريع.', priority: 'high' };
}

export function generateCoordinatorProfileTestData() {
  return {
    firstName: 'Ahmad',
    lastName: 'Test Coordinator',
    firstNameAr: 'أحمد',
    lastNameAr: 'منسق تجريبي',
    phone: '+966500000013',
    jobTitle: 'منسق كلية الحاسبات',
    biography: 'منسق تجريبي لاختبار تحديث الملف الشخصي وعرض الصلاحيات المؤسسية.',
    avatar: 'https://placehold.co/256x256/png?text=COORD',
    language: 'ar' as const,
  };
}

export const generateCoordinatorTestData = generateUniversityStaffTestData;
export const generateRejectionReason = () => 'بيانات التواصل الرسمية غير مكتملة في طلب الاختبار.';
export const generateSuspensionReason = () => 'تعليق تجريبي للتحقق من حماية الوصول المؤسسي.';
