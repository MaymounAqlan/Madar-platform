const axios = require('axios');

const BASE = 'http://localhost:3001';
const PASSWORD = process.env.TEST_ACCOUNT_DEFAULT_PASSWORD || 'DevPass123!';

const accounts = [
  { email: 'admin.full@madar.test', label: 'full-admin' },
  { email: 'admin.readonly@madar.test', label: 'readonly-admin' },
  { email: 'admin.limited@madar.test', label: 'limited-admin' },
  { email: 'admin.disabled@madar.test', label: 'disabled-admin', expectFail: true },
  { email: 'superadmin.test@madar.test', label: 'super-admin' },
  { email: 'student.ds.test@madar.test', label: 'student' },
  { email: 'company.test@madar.test', label: 'company' },
  { email: 'university.active@madar.test', label: 'active-university' },
  { email: 'university.pending@madar.test', label: 'pending-university' },
  { email: 'coordinator.test@madar.test', label: 'coordinator' },
];

async function run() {
  for (const acc of accounts) {
    try {
      const loginRes = await axios.post(`${BASE}/api/auth/login`, { email: acc.email, password: PASSWORD });
      if (acc.expectFail) {
        console.log(acc.label, acc.email, 'LOGIN', 'UNEXPECTED_SUCCESS', loginRes.status);
        continue;
      }
      const accessToken = loginRes.data?.data?.tokens?.accessToken;
      const refreshToken = loginRes.data?.data?.tokens?.refreshToken;
      console.log(acc.label, acc.email, 'LOGIN', loginRes.status, 'role', loginRes.data?.data?.user?.role || loginRes.data?.data?.user?.userType);
      if (!accessToken || !refreshToken) {
        console.log(acc.label, 'MISSING_TOKENS');
        continue;
      }
      const meRes = await axios.get(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } });
      console.log(acc.label, 'ME', meRes.status, 'role', meRes.data?.data?.role || meRes.data?.data?.userType, 'perms', (meRes.data?.data?.permissions || []).length);
      const refreshRes = await axios.post(`${BASE}/api/auth/refresh`, { refreshToken });
      console.log(acc.label, 'REFRESH', refreshRes.status, 'hasAccess', !!refreshRes.data?.data?.tokens?.accessToken);
      const newAccess = refreshRes.data?.data?.tokens?.accessToken;
      await axios.post(`${BASE}/api/auth/logout`, {}, { headers: { Authorization: `Bearer ${newAccess}` } });
      console.log(acc.label, 'LOGOUT', '200');
    } catch (err) {
      const status = err.response?.status;
      const code = err.response?.data?.code;
      console.log(acc.label, acc.email, acc.expectFail ? 'EXPECTED_FAIL' : 'FAIL', status, code);
    }
  }
}

run().catch(e => { console.error(e); process.exit(1); });
