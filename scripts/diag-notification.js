const API = 'http://localhost:3001/api';
const PASS = 'DiagPass123!';
const email = `diag.${Date.now()}@madar.test`;

async function http(method, path, token, body) {
  const opts = { method, headers: {} };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
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

(async () => {
  const reg = await http('POST', '/auth/register', null, {
    email,
    password: PASS,
    firstName: 'Diag',
    lastName: 'Tester',
    firstNameAr: 'اختبار',
    lastNameAr: 'تشخيص',
    phone: '+966500000999',
    role: 'student',
    profile: { university: 'KSU', college: 'CCIS', department: 'CS', academicLevel: 'senior' },
  });
  console.log('register:', reg.status, JSON.stringify(reg.body, null, 2).slice(0, 500));

  const login = await http('POST', '/auth/login', null, { email, password: PASS });
  console.log('login:', login.status);
  const token = login.body?.data?.tokens?.accessToken;
  if (!token) { console.error('no token'); process.exit(1); }

  const create = await http('POST', '/notifications', token, {
    userId: login.body.data.user._id || login.body.data.user.id,
    type: 'system',
    title: 'Diag notification',
    titleAr: 'إشعار تشخيص',
    message: 'Test.',
    messageAr: 'اختبار.',
  });
  console.log('create notification:', create.status, JSON.stringify(create.body, null, 2).slice(0, 800));

  // cleanup
  const { MongoClient } = require('mongodb');
  const client = new MongoClient('mongodb://127.0.0.1:27017/madar');
  await client.connect();
  const u = await client.db().collection('users').findOneAndDelete({ email });
  if (u?._id) {
    await client.db().collection('students').deleteMany({ userId: u._id });
    await client.db().collection('notifications').deleteMany({ userId: u._id });
  }
  await client.close();
})().catch(e => { console.error(e); process.exit(1); });
