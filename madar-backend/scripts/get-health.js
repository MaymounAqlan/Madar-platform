const axios = require('axios');
const BASE = 'http://localhost:3001';
const PASSWORD = process.env.TEST_ACCOUNT_DEFAULT_PASSWORD || 'DevPass123!';

(async () => {
  const login = await axios.post(`${BASE}/api/auth/login`, { email: 'admin.full@madar.test', password: PASSWORD });
  const token = login.data.data.tokens.accessToken;
  const health = await axios.get(`${BASE}/api/admin/health`, { headers: { Authorization: `Bearer ${token}` } });
  console.log(JSON.stringify(health.data, null, 2));
})().catch(e => { console.error(e.response?.data || e.message); process.exit(1); });
