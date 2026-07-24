// Runtime regression checks for Google-auth / encoding / University-403 recovery.
// Creates temporary test accounts, exercises the real API, then cleans up.
const API = process.env.API || 'http://localhost:3001/api';
const BASE_EMAIL = process.env.TEST_EMAIL_BASE || `runtime.${Date.now()}@madar.test`;
const PASSWORD = 'RuntimeTestPass123!';

let cleanupEmails = [];
let cleanupUserIds = [];
let testCollegeId = null;

async function http(method, path, token, body) {
  const opts = { method, headers: {} };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API}${path}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, body: json };
}

function data(response) {
  return response.body?.data ?? response.body;
}

function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT FAILED: ${message}`);
}

async function register(email, payload) {
  const reg = await http('POST', '/auth/register', null, { ...payload, email, password: PASSWORD });
  assert(reg.status === 201 || reg.status === 200, `register ${email} -> ${reg.status}: ${JSON.stringify(reg.body)}`);
  cleanupEmails.push(email);
  const userId = data(reg)?.user?._id || data(reg)?.user?.id;
  if (userId) cleanupUserIds.push(userId);
  return data(reg);
}

async function login(email) {
  const login = await http('POST', '/auth/login', null, { email, password: PASSWORD });
  assert(login.status === 200, `login ${email} -> ${login.status}: ${JSON.stringify(login.body)}`);
  return data(login);
}

async function run() {
  const reports = [];

  // 1. Student flow
  const studentEmail = `student.${BASE_EMAIL}`;
  await register(studentEmail, {
    firstName: 'Runtime',
    lastName: 'Student',
    firstNameAr: 'طالب',
    lastNameAr: 'تجريبي',
    phone: '+966500000001',
    role: 'student',
    profile: { university: 'KSU', college: 'CCIS', department: 'CS', academicLevel: 'senior' },
  });
  const student = await login(studentEmail);
  const meStudent = await http('GET', '/auth/me', student.tokens.accessToken);
  assert(meStudent.status === 200 && data(meStudent).role === 'student', 'student /auth/me');
  reports.push({
    label: 'Student login + /auth/me',
    status: 'PASS',
    role: data(meStudent).role,
    arabic: `${data(meStudent).firstNameAr} ${data(meStudent).lastNameAr}`,
    profileCompleted: data(meStudent).profileCompleted,
  });

  // 2. Company flow
  const companyEmail = `company.${BASE_EMAIL}`;
  await register(companyEmail, {
    firstName: 'Runtime',
    lastName: 'Company',
    firstNameAr: 'شركة',
    lastNameAr: 'تجريبية',
    phone: '+966500000002',
    role: 'company',
    profile: { companyName: 'Runtime Test Company', industry: 'Technology', description: 'A temporary test company' },
  });
  const company = await login(companyEmail);
  const meCompany = await http('GET', '/auth/me', company.tokens.accessToken);
  assert(meCompany.status === 200 && data(meCompany).role === 'company', 'company /auth/me');
  reports.push({
    label: 'Company login + /auth/me',
    status: 'PASS',
    role: data(meCompany).role,
    arabic: `${data(meCompany).firstNameAr} ${data(meCompany).lastNameAr}`,
    profileCompleted: data(meCompany).profileCompleted,
  });

  // 3. University Manager flow
  const uniEmail = `university.${BASE_EMAIL}`;
  await register(uniEmail, {
    firstName: 'Runtime',
    lastName: 'University',
    firstNameAr: 'جامعة',
    lastNameAr: 'تجريبية',
    phone: '+966500000003',
    role: 'university',
    profile: { universityName: 'Runtime Test University', universityNameAr: 'جامعة الاختبار التجريبية', city: 'Riyadh', description: 'Temporary test university' },
  });
  const uni = await login(uniEmail);
  const meUni = await http('GET', '/auth/me', uni.tokens.accessToken);
  assert(meUni.status === 200 && data(meUni).role === 'university', 'university /auth/me');

  const statusUniPending = await http('GET', '/universities/me/status', uni.tokens.accessToken);
  assert(statusUniPending.status === 200, `university /universities/me/status -> ${statusUniPending.status}`);
  assert(data(statusUniPending).status === 'pending', 'new university should start pending');
  const accessUniPending = await http('GET', '/universities/staff/me/access', uni.tokens.accessToken);
  assert(accessUniPending.status === 200, `university /universities/staff/me/access -> ${accessUniPending.status}`);
  const dashUniPending = await http('GET', '/universities/dashboard', uni.tokens.accessToken);
  assert(dashUniPending.status === 403, `pending university dashboard should be 403, got ${dashUniPending.status}`);
  reports.push({
    label: 'Pending University Manager status only',
    status: 'PASS',
    role: data(meUni).role,
    statusEndpoint: statusUniPending.status,
    accessEndpoint: accessUniPending.status,
    dashboardEndpoint: dashUniPending.status,
  });

  // Activate the test university and create a college so we can verify coordinator flow
  const { MongoClient, ObjectId } = require('mongodb');
  const client = new MongoClient('mongodb://127.0.0.1:27017/madar');
  await client.connect();
  const db = client.db();
  const testUni = await db.collection('universities').findOne({ userId: new ObjectId(uni.user._id || uni.user.id) });
  if (!testUni) throw new Error('Test university not found');
  await db.collection('universities').updateOne({ _id: testUni._id }, { $set: { status: 'active', reviewedAt: new Date() } });

  const collegeInsert = await db.collection('colleges').insertOne({
    universityId: testUni._id,
    name: 'Runtime College',
    nameAr: 'كلية تجريبية',
    code: `RUN-${Date.now()}`,
    description: 'Temporary college for runtime check',
    metadata: { status: 'active' },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  testCollegeId = collegeInsert.insertedId.toString();

  const statusUni = await http('GET', '/universities/me/status', uni.tokens.accessToken);
  assert(statusUni.status === 200, `university /universities/me/status -> ${statusUni.status}`);
  const accessUni = await http('GET', '/universities/staff/me/access', uni.tokens.accessToken);
  assert(accessUni.status === 200, `university /universities/staff/me/access -> ${accessUni.status}`);
  const dashUni = await http('GET', '/universities/dashboard', uni.tokens.accessToken);
  assert(dashUni.status === 200, `active university /universities/dashboard -> ${dashUni.status}`);
  reports.push({
    label: 'Active University Manager full access',
    status: 'PASS',
    role: data(meUni).role,
    arabic: `${data(meUni).firstNameAr} ${data(meUni).lastNameAr}`,
    statusEndpoint: statusUni.status,
    accessEndpoint: accessUni.status,
    dashboardEndpoint: dashUni.status,
    profileCompleted: data(meUni).profileCompleted,
  });

  // 4. Coordinator invitation flow
  const coordEmail = `coordinator.${BASE_EMAIL}`;
  const invite = await http('POST', '/universities/staff/invite', uni.tokens.accessToken, {
    email: coordEmail,
    name: 'Runtime Coordinator',
    phone: '+966500000004',
    role: 'coordinator',
    collegeId: testCollegeId,
    permissions: ['dashboard:read', 'structure:read', 'students:read'],
  });
  assert(invite.status === 201 || invite.status === 200, `invite coordinator -> ${invite.status}: ${JSON.stringify(invite.body)}`);
  cleanupEmails.push(coordEmail);

  // Set a password for the invited coordinator so we can log in
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(PASSWORD, 10);
  const coordUser = await db.collection('users').findOne({ email: coordEmail });
  if (!coordUser) throw new Error('Invited coordinator user not found');
  cleanupUserIds.push(coordUser._id.toString());
  await db.collection('users').updateOne(
    { _id: coordUser._id },
    { $set: { password: hash, status: 'active', firstNameAr: 'منسق', lastNameAr: 'تجريبي', profileCompleted: true } },
  );
  await db.collection('collegecoordinators').updateOne(
    { userId: coordUser._id },
    { $set: { invitationStatus: 'accepted', status: 'active' } },
  );

  const coordLogin = await http('POST', '/auth/login', null, { email: coordEmail, password: PASSWORD });
  assert(coordLogin.status === 200, `coordinator login -> ${coordLogin.status}`);
  const coordData = data(coordLogin);
  const coordToken = coordData.tokens.accessToken;
  const meCoord = await http('GET', '/auth/me', coordToken);
  assert(meCoord.status === 200 && data(meCoord).role === 'coordinator', 'coordinator /auth/me');
  const accessCoord = await http('GET', '/universities/staff/me/access', coordToken);
  assert(accessCoord.status === 200, `coordinator /universities/staff/me/access -> ${accessCoord.status}`);
  const dashCoord = await http('GET', '/universities/dashboard', coordToken);
  assert(dashCoord.status === 200, `coordinator /universities/dashboard -> ${dashCoord.status}`);
  reports.push({
    label: 'Coordinator full access',
    status: 'PASS',
    role: data(meCoord).role,
    arabic: `${data(meCoord).firstNameAr} ${data(meCoord).lastNameAr}`,
    accessEndpoint: accessCoord.status,
    dashboardEndpoint: dashCoord.status,
    permissions: data(accessCoord).permissions?.join(', ') || data(accessCoord).allowedActions?.join(', '),
    profileCompleted: data(meCoord).profileCompleted,
  });

  // 5. Verify profile APIs exist for both University Manager and Coordinator
  const uniProfile = await http('GET', '/universities/profile', uni.tokens.accessToken);
  assert(uniProfile.status === 200, `university manager profile GET -> ${uniProfile.status}`);
  const coordProfile = await http('GET', '/universities/staff/me/profile', coordToken);
  assert(coordProfile.status === 200, `coordinator profile GET -> ${coordProfile.status}`);
  reports.push({ label: 'Profile APIs reachable', status: 'PASS', uniProfile: uniProfile.status, coordProfile: coordProfile.status });

  // 6. Notification flow
  const createNotif = await http('POST', '/notifications', coordToken, {
    userId: coordUser._id.toString(),
    type: 'system',
    title: 'Runtime test notification',
    titleAr: 'إشعار اختبار runtime',
    message: 'This notification was created by the runtime recovery check.',
    messageAr: 'تم إنشاء هذا الإشعار بواسطة فحص runtime.',
  });
  assert(createNotif.status === 201 || createNotif.status === 200, `create notification -> ${createNotif.status}: ${JSON.stringify(createNotif.body)}`);
  const notificationId = data(createNotif)?.id || data(createNotif)?._id;
  assert(notificationId, 'notification id missing');

  const unreadBefore = await http('GET', '/notifications/mine?read=false&limit=100', coordToken);
  assert(unreadBefore.status === 200, `get unread notifications -> ${unreadBefore.status}`);
  const unreadCountBefore = data(unreadBefore)?.total ?? data(unreadBefore)?.length ?? 0;
  assert(unreadCountBefore >= 1, `expected at least 1 unread notification, got ${unreadCountBefore}`);

  const markRead = await http('PATCH', `/notifications/${notificationId}/read`, coordToken);
  assert(markRead.status === 200, `mark notification read -> ${markRead.status}`);

  const unreadAfter = await http('GET', '/notifications/mine?read=false&limit=100', coordToken);
  const unreadCountAfter = data(unreadAfter)?.total ?? data(unreadAfter)?.length ?? 0;
  assert(unreadCountAfter < unreadCountBefore, `notification should no longer be unread (before=${unreadCountBefore}, after=${unreadCountAfter})`);

  reports.push({
    label: 'Notification create/read/mark-read',
    status: 'PASS',
    create: createNotif.status,
    unreadBefore: unreadCountBefore,
    markRead: markRead.status,
    unreadAfter: unreadCountAfter,
  });

  await client.close();

  // Cleanup
  await cleanup();

  console.table(reports);
  console.log('All runtime recovery checks passed.');
}

async function cleanup() {
  const { MongoClient, ObjectId } = require('mongodb');
  const client = new MongoClient('mongodb://127.0.0.1:27017/madar');
  await client.connect();
  const db = client.db();
  // Remove test college created for the university flow
  if (testCollegeId) {
    try { await db.collection('colleges').deleteOne({ _id: new ObjectId(testCollegeId) }); } catch {}
  }
  for (const email of cleanupEmails) {
    const u = await db.collection('users').findOneAndDelete({ email });
    if (u?._id) {
      const id = u._id;
      await db.collection('students').deleteMany({ userId: id });
      await db.collection('companies').deleteMany({ userId: id });
      await db.collection('universities').deleteMany({ userId: id });
      await db.collection('collegecoordinators').deleteMany({ $or: [{ email }, { userId: id }] });
    }
  }
  for (const id of cleanupUserIds) {
    const oid = new ObjectId(id);
    await db.collection('users').deleteOne({ _id: oid });
    await db.collection('students').deleteMany({ userId: oid });
    await db.collection('companies').deleteMany({ userId: oid });
    await db.collection('universities').deleteMany({ userId: oid });
    await db.collection('collegecoordinators').deleteMany({ userId: oid });
    await db.collection('notifications').deleteMany({ userId: oid });
  }
  await client.close();
}

run().catch(async (e) => {
  console.error('RUNTIME CHECK FAILED:', e.message);
  try { await cleanup(); } catch (c) { console.error('cleanup error', c.message); }
  process.exit(1);
});
