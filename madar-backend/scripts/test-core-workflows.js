const axios = require('axios');

const BASE = 'http://localhost:3001';
const PASSWORD = process.env.TEST_ACCOUNT_DEFAULT_PASSWORD || 'DevPass123!';

async function login(email) {
  const res = await axios.post(`${BASE}/api/auth/login`, { email, password: PASSWORD });
  return res.data.data.tokens.accessToken;
}

async function get(url, token) {
  return axios.get(`${BASE}${url}`, { headers: { Authorization: `Bearer ${token}` } });
}

async function test() {
  const results = [];
  const check = (label, status) => results.push({ label, status });

  // Student
  try {
    const t = await login('student.ds.test@madar.test');
    const profile = await get('/api/students/profile', t);
    check('student-profile', profile.status);
    const recs = await get('/api/students/recommended-jobs', t);
    check('student-recommendations', recs.status);
  } catch (e) { check('student-workflow', e.response?.status || 'ERR'); }

  // Company
  try {
    const t = await login('company.test@madar.test');
    const dash = await get('/api/companies/dashboard', t);
    check('company-dashboard', dash.status);
    const jobs = await get('/api/companies/jobs', t);
    check('company-jobs', jobs.status);
  } catch (e) { check('company-workflow', e.response?.status || 'ERR'); }

  // University
  try {
    const t = await login('university.active@madar.test');
    const dash = await get('/api/universities/dashboard', t);
    check('university-dashboard', dash.status);
    const struct = await get('/api/universities/structure', t);
    check('university-structure', struct.status);
    const students = await get('/api/universities/students', t);
    check('university-students', students.status);
    const staff = await get('/api/universities/staff', t);
    check('university-staff', staff.status);
  } catch (e) { check('university-workflow', e.response?.status || 'ERR'); }

  // Pending university
  try {
    const t = await login('university.pending@madar.test');
    const status = await get('/api/universities/me/status', t);
    check('pending-university-status', status.status);
  } catch (e) { check('pending-university-workflow', e.response?.status || 'ERR'); }

  // Coordinator
  try {
    const t = await login('coordinator.test@madar.test');
    const dash = await get('/api/universities/dashboard', t);
    check('coordinator-dashboard', dash.status);
    // This coordinator belongs to computing college; engineering should be forbidden
    try {
      const eng = await get('/api/universities/colleges', t);
      check('coordinator-colleges', eng.status);
    } catch (e2) { check('coordinator-colleges', e2.response?.status || 'ERR'); }
  } catch (e) { check('coordinator-workflow', e.response?.status || 'ERR'); }

  // Admin full
  try {
    const t = await login('admin.full@madar.test');
    const dash = await get('/api/admin/dashboard-metrics', t);
    check('admin-dashboard', dash.status);
    const users = await get('/api/admin/users?page=1&limit=5', t);
    check('admin-users', users.status);
  } catch (e) { check('admin-workflow', e.response?.status || 'ERR'); }

  // Admin limited missing admin:write
  try {
    const t = await login('admin.limited@madar.test');
    const dash = await get('/api/admin/dashboard-metrics', t);
    check('limited-admin-dashboard', dash.status);
    // Try to create another admin account (POST /api/admin/admin-accounts) - should be 403 because limited lacks admin:write
    try {
      await axios.post(`${BASE}/api/admin/admin-accounts`, { email: 'test.forbidden@madar.test', firstName: 'T', lastName: 'F', roleId: '000000000000000000000002' }, { headers: { Authorization: `Bearer ${t}` } });
      check('limited-admin-create-admin-account', 'UNEXPECTED_SUCCESS');
    } catch (e2) { check('limited-admin-create-admin-account', e2.response?.status); }
  } catch (e) { check('limited-admin-workflow', e.response?.status || 'ERR'); }

  // Super Admin restricted actions (should succeed)
  try {
    const t = await login('superadmin.test@madar.test');
    const unis = await get('/api/admin/universities/pending', t);
    check('super-admin-pending-universities', unis.status);
    const companies = await get('/api/admin/companies?status=pending', t);
    check('super-admin-pending-companies', companies.status);
  } catch (e) { check('super-admin-workflow', e.response?.status || 'ERR'); }

  console.log(JSON.stringify(results, null, 2));
}

test().catch(e => { console.error(e); process.exit(1); });
