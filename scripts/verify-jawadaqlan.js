// Temporary verification for jawadaqlan@gmail.com after staff-record fix.
// Sets a temporary password, logs in, tests key endpoints, then restores the original password hash.
const API = 'http://localhost:3001/api';
const TMP_PASSWORD = 'TempVerifyPass123!';

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

async function main() {
  const { MongoClient } = require('mongodb');
  const bcrypt = require('bcryptjs');
  const client = new MongoClient('mongodb://127.0.0.1:27017/madar');
  await client.connect();
  const db = client.db();

  const user = await db.collection('users').findOne({ email: 'jawadaqlan@gmail.com' });
  if (!user) throw new Error('User not found');
  const originalPassword = user.password;

  // Set temporary password
  const tmpHash = await bcrypt.hash(TMP_PASSWORD, 10);
  await db.collection('users').updateOne({ _id: user._id }, { $set: { password: tmpHash } });

  const results = [];
  try {
    const login = await http('POST', '/auth/login', null, { email: 'jawadaqlan@gmail.com', password: TMP_PASSWORD });
    if (login.status !== 200) throw new Error(`Login failed: ${login.status} ${JSON.stringify(login.body)}`);
    const token = data(login).tokens.accessToken;

    const me = await http('GET', '/auth/me', token);
    results.push({ endpoint: '/auth/me', status: me.status, role: data(me)?.role, universityId: data(me)?.universityId, collegeId: data(me)?.collegeId });

    const access = await http('GET', '/universities/staff/me/access', token);
    results.push({ endpoint: '/universities/staff/me/access', status: access.status, permissions: data(access)?.permissions?.length });

    const dashboard = await http('GET', '/universities/dashboard', token);
    results.push({ endpoint: '/universities/dashboard', status: dashboard.status });

    const structure = await http('GET', '/universities/structure', token);
    results.push({ endpoint: '/universities/structure', status: structure.status });

    const students = await http('GET', '/universities/students?page=1&limit=20', token);
    results.push({ endpoint: '/universities/students', status: students.status });

    const statistics = await http('GET', '/universities/students/statistics', token);
    results.push({ endpoint: '/universities/students/statistics', status: statistics.status });

    const studyPlans = await http('GET', '/universities/study-plans?includeArchived=true', token);
    results.push({ endpoint: '/universities/study-plans', status: studyPlans.status });

    const courses = await http('GET', '/universities/courses?includeArchived=true', token);
    results.push({ endpoint: '/universities/courses', status: courses.status });

    const profile = await http('GET', '/universities/staff/me/profile', token);
    results.push({ endpoint: '/universities/staff/me/profile', status: profile.status });
  } finally {
    // Restore original password
    await db.collection('users').updateOne({ _id: user._id }, { $set: { password: originalPassword } });
  }

  console.table(results);
  const failed = results.filter((r) => r.status !== 200);
  if (failed.length) {
    console.error('FAILED endpoints:', failed.map((r) => r.endpoint).join(', '));
    process.exit(1);
  }
  console.log('All jawadaqlan@gmail.com endpoint checks passed.');
  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
