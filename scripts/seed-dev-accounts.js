// MADAR Development Test Accounts Seed
// Usage: node scripts/seed-dev-accounts.js
// Idempotent, development-only, safe to rerun.

const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';
const PASSWORD = process.env.TEST_PASSWORD || 'Madar@2024';
const BCRYPT_ROUNDS = 10;

const now = () => new Date();
const oid = (id) => new ObjectId(id);
// Use a distinct prefix to avoid colliding with pre-existing seed data.
const UID = (suffix) => new ObjectId('66000000000000000000' + suffix);

async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function seed(db) {
  const hashedPassword = await hashPassword(PASSWORD);

  // ─── Users (idempotent by email) ───
  const users = [
    // Super Admin
    {
      _id: oid('660000000000000000000000'),
      email: 'superadmin@madar.sa',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      firstNameAr: 'المشرف',
      lastNameAr: 'العام',
      userType: 'super_admin',
      status: 'active',
      isEmailVerified: true,
      phone: '+966500000001',
      createdAt: now(),
      updatedAt: now(),
    },
    // Admin
    {
      _id: oid('660000000000000000000001'),
      email: 'admin@madar.sa',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      firstNameAr: 'مدير',
      lastNameAr: 'النظام',
      userType: 'admin',
      status: 'active',
      isEmailVerified: true,
      phone: '+966500000002',
      createdAt: now(),
      updatedAt: now(),
    },
    // Active Student
    {
      _id: oid('660000000000000000000101'),
      email: 'student@madar.sa',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Student',
      firstNameAr: 'طالب',
      lastNameAr: 'تجريبي',
      userType: 'student',
      status: 'active',
      isEmailVerified: true,
      phone: '+966500000003',
      createdAt: now(),
      updatedAt: now(),
    },
    // Active Company
    {
      _id: oid('660000000000000000000201'),
      email: 'company@madar.sa',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Company',
      firstNameAr: 'شركة',
      lastNameAr: 'تجريبية',
      userType: 'company',
      status: 'active',
      isEmailVerified: true,
      phone: '+966500000004',
      createdAt: now(),
      updatedAt: now(),
    },
    // Active University
    {
      _id: oid('660000000000000000000301'),
      email: 'university.active@madar.sa',
      password: hashedPassword,
      firstName: 'Active',
      lastName: 'University',
      firstNameAr: 'جامعة',
      lastNameAr: 'نشطة',
      userType: 'university',
      status: 'active',
      isEmailVerified: true,
      phone: '+966500000005',
      createdAt: now(),
      updatedAt: now(),
    },
    // Pending University
    {
      _id: oid('660000000000000000000302'),
      email: 'university.pending@madar.sa',
      password: hashedPassword,
      firstName: 'Pending',
      lastName: 'University',
      firstNameAr: 'جامعة',
      lastNameAr: 'معلقة',
      userType: 'university',
      status: 'pending_verification',
      isEmailVerified: false,
      phone: '+966500000006',
      createdAt: now(),
      updatedAt: now(),
    },
    // Suspended University
    {
      _id: oid('660000000000000000000303'),
      email: 'university.suspended@madar.sa',
      password: hashedPassword,
      firstName: 'Suspended',
      lastName: 'University',
      firstNameAr: 'جامعة',
      lastNameAr: 'موقوفة',
      userType: 'university',
      status: 'suspended',
      isEmailVerified: true,
      phone: '+966500000007',
      createdAt: now(),
      updatedAt: now(),
    },
    // Active Coordinator
    {
      _id: oid('660000000000000000000401'),
      email: 'coordinator@madar.sa',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Coordinator',
      firstNameAr: 'منسق',
      lastNameAr: 'تجريبي',
      userType: 'coordinator',
      status: 'active',
      isEmailVerified: true,
      phone: '+966500000008',
      createdAt: now(),
      updatedAt: now(),
    },
    // Disabled Staff Account
    {
      _id: oid('660000000000000000000501'),
      email: 'staff.disabled@madar.sa',
      password: hashedPassword,
      firstName: 'Disabled',
      lastName: 'Staff',
      firstNameAr: 'موظف',
      lastNameAr: 'معطل',
      userType: 'coordinator',
      status: 'active',
      isEmailVerified: true,
      phone: '+966500000009',
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  for (const user of users) {
    const { _id, ...userWithoutId } = user;
    await db.collection('users').updateOne(
      { email: user.email },
      { $set: userWithoutId, $setOnInsert: { _id } },
      { upsert: true },
    );
  }
  console.log(`Upserted ${users.length} users`);

  // ─── Universities (idempotent by userId) ───
  await db.collection('universities').replaceOne(
    { userId: oid('660000000000000000000301') },
    {
      userId: oid('660000000000000000000301'),
      name: 'Active Test University',
      nameAr: 'جامعة الاختبار النشطة',
      shortName: 'ATU',
      description: 'Active university for development testing',
      type: 'public',
      status: 'active',
      location: { city: 'Riyadh', country: 'Saudi Arabia', address: 'Riyadh' },
      contactInfo: { email: 'university.active@madar.sa', phone: '+966500000005', website: 'https://atu.madar.sa' },
      colleges: [],
      createdAt: now(),
      updatedAt: now(),
    },
    { upsert: true },
  );

  await db.collection('universities').replaceOne(
    { userId: oid('660000000000000000000302') },
    {
      userId: oid('660000000000000000000302'),
      name: 'Pending Test University',
      nameAr: 'جامعة الاختبار المعلقة',
      shortName: 'PTU',
      description: 'Pending university for development testing',
      type: 'public',
      status: 'pending',
      location: { city: 'Jeddah', country: 'Saudi Arabia', address: 'Jeddah' },
      contactInfo: { email: 'university.pending@madar.sa', phone: '+966500000006', website: 'https://ptu.madar.sa' },
      colleges: [],
      createdAt: now(),
      updatedAt: now(),
    },
    { upsert: true },
  );

  await db.collection('universities').replaceOne(
    { userId: oid('660000000000000000000303') },
    {
      userId: oid('660000000000000000000303'),
      name: 'Suspended Test University',
      nameAr: 'جامعة الاختبار الموقوفة',
      shortName: 'STU',
      description: 'Suspended university for development testing',
      type: 'public',
      status: 'suspended',
      location: { city: 'Dammam', country: 'Saudi Arabia', address: 'Dammam' },
      contactInfo: { email: 'university.suspended@madar.sa', phone: '+966500000007', website: 'https://stu.madar.sa' },
      colleges: [],
      createdAt: now(),
      updatedAt: now(),
    },
    { upsert: true },
  );
  console.log('Upserted 3 universities');

  // ─── Student profile ───
  await db.collection('students').replaceOne(
    { userId: oid('660000000000000000000101') },
    {
      userId: oid('660000000000000000000101'),
      academicInfo: {
        universityId: oid('660000000000000000000301'),
        collegeId: null,
        departmentId: null,
        universityName: 'Active Test University',
        collegeName: 'College of Computer Science',
        departmentName: 'Computer Science',
        studentId: '2024001',
        enrollmentYear: 2024,
        academicLevel: 'senior',
        expectedGraduation: 2028,
        gpa: 3.75,
      },
      personalInfo: { firstName: 'Test', lastName: 'Student', phone: '+966500000003', avatarUrl: '' },
      professionalProfile: { careerInterests: [] },
      skills: [],
      projects: [],
      certifications: [],
      courses: [],
      createdAt: now(),
      updatedAt: now(),
    },
    { upsert: true },
  );
  console.log('Upserted student profile');

  // ─── Company profile ───
  await db.collection('companies').replaceOne(
    { userId: oid('660000000000000000000201') },
    {
      userId: oid('660000000000000000000201'),
      profile: {
        name: 'Test Company',
        legalName: 'Test Company LLC',
        description: 'Development test company',
        industry: 'Technology',
        subIndustries: [],
        companySize: '11-50',
        website: 'https://company.madar.sa',
        logoUrl: '',
        coverImageUrl: '',
      },
      headquarters: { city: 'Riyadh', country: 'Saudi Arabia', address: 'Riyadh' },
      locations: [{ city: 'Riyadh', country: 'Saudi Arabia', address: 'Riyadh', isHeadquarters: true }],
      contactInfo: { email: 'company@madar.sa', phone: '+966500000004', hrEmail: 'company@madar.sa', linkedIn: '', twitter: '' },
      culture: { values: [], benefits: [], workEnvironment: '', diversityStatement: '' },
      recruitmentPreferences: { targetMajors: [] },
      status: 'active',
      createdAt: now(),
      updatedAt: now(),
    },
    { upsert: true },
  );
  console.log('Upserted company profile');

  // ─── College & Department for coordinator ───
  const collegeId = oid('660000000000000000000601');
  const deptId = oid('660000000000000000000701');

  await db.collection('colleges').replaceOne(
    { _id: collegeId },
    {
      _id: collegeId,
      universityId: oid('660000000000000000000301'),
      name: 'College of Engineering',
      nameAr: 'كلية الهندسة',
      description: 'Test college',
      metadata: { status: 'active', code: 'ENG' },
      createdAt: now(),
      updatedAt: now(),
    },
    { upsert: true },
  );

  await db.collection('departments').replaceOne(
    { _id: deptId },
    {
      _id: deptId,
      universityId: oid('660000000000000000000301'),
      collegeId: collegeId,
      name: 'Computer Engineering',
      nameAr: 'هندسة الحاسب',
      description: 'Test department',
      metadata: { status: 'active', code: 'CE' },
      createdAt: now(),
      updatedAt: now(),
    },
    { upsert: true },
  );
  console.log('Upserted college and department');

  // ─── Active Coordinator profile ───
  await db.collection('collegecoordinators').replaceOne(
    { userId: oid('660000000000000000000401') },
    {
      userId: oid('660000000000000000000401'),
      universityId: oid('660000000000000000000301'),
      collegeId: collegeId,
      role: 'coordinator',
      department: deptId.toString(),
      permissions: [
        'dashboard:read',
        'structure:read',
        'students:read',
        'analytics:read',
        'departments:read',
        'study-plans:read',
        'study-plans:write',
        'courses:read',
        'courses:write',
        'course-skills:manage',
        'curriculum-analysis:run',
        'college-reports:read',
      ],
      status: 'active',
      invitationStatus: 'accepted',
      invitedBy: oid('660000000000000000000000'),
      invitedAt: now(),
      lastInvitedAt: now(),
      createdAt: now(),
      updatedAt: now(),
    },
    { upsert: true },
  );
  console.log('Upserted active coordinator profile');

  // ─── Disabled Staff profile ───
  await db.collection('collegecoordinators').replaceOne(
    { userId: oid('660000000000000000000501') },
    {
      userId: oid('660000000000000000000501'),
      universityId: oid('660000000000000000000301'),
      collegeId: collegeId,
      role: 'coordinator',
      department: deptId.toString(),
      permissions: ['dashboard:read'],
      status: 'inactive',
      invitationStatus: 'accepted',
      invitedBy: oid('660000000000000000000000'),
      invitedAt: now(),
      lastInvitedAt: now(),
      createdAt: now(),
      updatedAt: now(),
    },
    { upsert: true },
  );
  console.log('Upserted disabled staff profile');

  console.log('\nSeed completed successfully.');
  console.log('Test password:', PASSWORD);
}

async function cleanup(db) {
  const emails = [
    'superadmin@madar.sa',
    'admin@madar.sa',
    'student@madar.sa',
    'company@madar.sa',
    'university.active@madar.sa',
    'university.pending@madar.sa',
    'university.suspended@madar.sa',
    'coordinator@madar.sa',
    'staff.disabled@madar.sa',
  ];
  const userIds = emails.map((_, i) => oid('650000000000000000000' + ['000','001','101','201','301','302','303','401','501'][i]));

  await db.collection('users').deleteMany({ email: { $in: emails } });
  await db.collection('students').deleteMany({ userId: { $in: userIds } });
  await db.collection('companies').deleteMany({ userId: { $in: userIds } });
  await db.collection('universities').deleteMany({ userId: { $in: userIds } });
  await db.collection('collegecoordinators').deleteMany({ userId: { $in: userIds } });
  await db.collection('colleges').deleteOne({ _id: oid('660000000000000000000601') });
  await db.collection('departments').deleteOne({ _id: oid('660000000000000000000701') });
  console.log('Cleanup completed.');
}

async function main() {
  const args = process.argv.slice(2);
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    if (args.includes('--cleanup')) {
      await cleanup(db);
    } else {
      await seed(db);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
