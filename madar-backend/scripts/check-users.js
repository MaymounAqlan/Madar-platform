const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/madar');
  const users = await mongoose.connection.collection('users')
    .find({ email: { $regex: /(admin|ahmed|hr|cs|coordinator)@/ } })
    .project({ email: 1, role: 1, status: 1, provider: 1, emailVerified: 1, roleId: 1, universityId: 1, collegeId: 1, companyId: 1 })
    .toArray();
  for (const u of users) {
    console.log(JSON.stringify(u));
  }
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
