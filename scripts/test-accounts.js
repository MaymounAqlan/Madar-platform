// MADAR Account Smoke Tests
// Usage: node scripts/test-accounts.js

const axios = require('axios');

const API = process.env.API_URL || 'http://localhost:3001/api';
const PASSWORD = process.env.TEST_PASSWORD || 'Madar@2024';

const accounts = [
  { email: 'superadmin@madar.sa', role: 'super_admin', expectedRedirect: '/admin/dashboard', shouldLogin: true },
  { email: 'admin@madar.sa', role: 'admin', expectedRedirect: '/admin/dashboard', shouldLogin: true },
  { email: 'student@madar.sa', role: 'student', expectedRedirect: '/student/dashboard', shouldLogin: true },
  { email: 'company@madar.sa', role: 'company', expectedRedirect: '/company/dashboard', shouldLogin: true },
  { email: 'university.active@madar.sa', role: 'university', expectedRedirect: '/university/dashboard', shouldLogin: true },
  { email: 'university.pending@madar.sa', role: 'university', expectedRedirect: null, shouldLogin: false, expectedStatus: 403 },
  { email: 'university.suspended@madar.sa', role: 'university', expectedRedirect: null, shouldLogin: false, expectedStatus: 401 },
  { email: 'coordinator@madar.sa', role: 'coordinator', expectedRedirect: '/university/dashboard', shouldLogin: true },
  { email: 'staff.disabled@madar.sa', role: 'coordinator', expectedRedirect: null, shouldLogin: false, expectedStatus: 401 },
];

function getDashboardPath(role) {
  if (role === 'admin' || role === 'super_admin') return '/admin/dashboard';
  if (role === 'company') return '/company/dashboard';
  if (role === 'university') return '/university/dashboard';
  if (['coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer'].includes(role)) return '/university/dashboard';
  return '/student/dashboard';
}

async function testAccount(account) {
  const result = {
    email: account.email,
    role: account.role,
    expectedRedirect: account.expectedRedirect || getDashboardPath(account.role),
    loginStatus: null,
    meStatus: null,
    refreshStatus: null,
    logoutStatus: null,
    userStatus: null,
    permissions: null,
    tokensValid: false,
    pass: false,
    error: null,
  };

  try {
    // Login
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: account.email,
      password: PASSWORD,
    });
    result.loginStatus = loginRes.status;

    if (!account.shouldLogin) {
      result.error = `Expected login to be blocked but got ${loginRes.status}`;
      return result;
    }

    const { accessToken, refreshToken } = loginRes.data?.data?.tokens || loginRes.data?.tokens || {};
    if (!accessToken || !refreshToken) {
      result.error = 'Missing tokens in login response';
      return result;
    }
    result.tokensValid = true;

    // Current user
    const meRes = await axios.get(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    result.meStatus = meRes.status;
    result.userStatus = meRes.data?.data?.status || meRes.data?.status;
    result.permissions = meRes.data?.data?.permissions || null;

    // Refresh token
    const refreshRes = await axios.post(`${API}/auth/refresh`, { refreshToken });
    result.refreshStatus = refreshRes.status;
    const newAccessToken = refreshRes.data?.data?.tokens?.accessToken || refreshRes.data?.tokens?.accessToken;

    // Logout
    const logoutRes = await axios.post(`${API}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${newAccessToken || accessToken}` },
    });
    result.logoutStatus = logoutRes.status;

    // Login again
    const loginAgainRes = await axios.post(`${API}/auth/login`, {
      email: account.email,
      password: PASSWORD,
    });
    if (loginAgainRes.status !== 200) {
      result.error = `Re-login failed with ${loginAgainRes.status}`;
      return result;
    }

    result.pass = true;
  } catch (err) {
    const status = err.response?.status;
    result.loginStatus = status || 'ERROR';
    if (!account.shouldLogin && status === account.expectedStatus) {
      result.pass = true;
      result.error = `Correctly blocked (${status})`;
    } else if (!account.shouldLogin) {
      result.error = `Expected block status ${account.expectedStatus} but got ${status}: ${err.response?.data?.message || err.message}`;
    } else {
      result.error = `${err.response?.data?.message || err.message} (status: ${status})`;
    }
  }

  return result;
}

async function main() {
  console.log('Testing accounts against', API);
  const results = [];
  for (const account of accounts) {
    const result = await testAccount(account);
    results.push(result);
    console.log(`\n${result.email} (${result.role}): ${result.pass ? 'PASS' : 'FAIL'}`);
    if (result.error) console.log('  Error:', result.error);
    console.log('  login:', result.loginStatus, '| me:', result.meStatus, '| refresh:', result.refreshStatus, '| logout:', result.logoutStatus);
  }

  const passCount = results.filter((r) => r.pass).length;
  console.log(`\nTotal: ${passCount}/${results.length} passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
