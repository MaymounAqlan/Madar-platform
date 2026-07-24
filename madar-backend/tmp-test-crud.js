const axios = require('axios');

const BASE = 'http://localhost:3001';
let token;

async function login() {
  const res = await axios.post(`${BASE}/api/auth/login`, {
    email: 'coordinator@ksu.edu.sa',
    password: 'Test1234!'
  });
  token = res.data.data.tokens.accessToken;
}

async function test() {
  await login();
  const headers = { Authorization: `Bearer ${token}` };

  // Create study plan
  const planRes = await axios.post(`${BASE}/api/universities/study-plans`, {
    departmentId: '650000000000000000000601',
    name: 'Manual Test Plan',
    nameAr: 'خطة اختبار يدوية',
    academicYear: '2026-2027',
    totalCreditHours: 120,
    levelsCount: 4,
    semestersCount: 2
  }, { headers });
  console.log('Create plan:', planRes.data.success, planRes.data.data?._id || planRes.data.data?.id);
  const planId = planRes.data.data?._id || planRes.data.data?.id;

  // Update plan
  const updRes = await axios.patch(`${BASE}/api/universities/study-plans/${planId}`, {
    nameAr: 'خطة اختبار يدوية محدثة'
  }, { headers });
  console.log('Update plan:', updRes.data.success);

  // Create course
  const courseRes = await axios.post(`${BASE}/api/universities/courses`, {
    studyPlanId: planId,
    code: 'CS301',
    name: 'Algorithms',
    nameAr: 'خوارزميات',
    creditHours: 3,
    level: 3,
    semester: 1,
    type: 'required'
  }, { headers });
  console.log('Create course:', courseRes.data.success, courseRes.data.data?._id || courseRes.data.data?.id);
  const courseId = courseRes.data.data?._id || courseRes.data.data?.id;

  // Get Python skill id
  const skillsRes = await axios.get(`${BASE}/api/skills`, { headers, params: { search: 'Python' } });
  const pythonSkill = skillsRes.data.data?.[0] || skillsRes.data.data?.skills?.[0] || skillsRes.data.data?.find(s => s.name === 'Python');
  const skillId = pythonSkill?._id || pythonSkill?.id;
  console.log('Python skill found:', !!skillId);

  if (skillId) {
    // Link skill
    const skillRes = await axios.post(`${BASE}/api/universities/courses/${courseId}/skills`, {
      skillId,
      coverageLevel: 4,
      coverageType: 'mixed',
      assessmentMethod: 'imported'
    }, { headers });
    console.log('Link skill:', skillRes.data.success, skillRes.data.data?.message || skillRes.data.message);

    // Remove skill
    const remRes = await axios.delete(`${BASE}/api/universities/courses/${courseId}/skills/${skillId}`, { headers });
    console.log('Remove skill:', remRes.data.success);
  }

  // Archive course
  const delRes = await axios.delete(`${BASE}/api/universities/courses/${courseId}`, { headers });
  console.log('Archive course:', delRes.data.success);

  // Restore course
  const restRes = await axios.post(`${BASE}/api/universities/courses/${courseId}/restore`, {}, { headers });
  console.log('Restore course:', restRes.data.success);

  // Submit plan
  const subRes = await axios.post(`${BASE}/api/universities/study-plans/${planId}/submit`, {}, { headers });
  console.log('Submit plan:', subRes.data.success);

  // Archive plan
  const archRes = await axios.delete(`${BASE}/api/universities/study-plans/${planId}`, { headers });
  console.log('Archive plan:', archRes.data.success);
}

test().catch(err => {
  console.error('ERROR:', err.response?.data || err.message);
  process.exit(1);
});
