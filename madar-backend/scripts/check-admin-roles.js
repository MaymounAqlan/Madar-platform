const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/madar');
  const roles = await mongoose.connection.collection('roles')
    .find({ name: { $in: ['admin_readonly_test', 'admin_limited_test', 'admin_full_test'] } })
    .toArray();
  for (const r of roles) {
    console.log('---', r.name, '---');
    console.log((r.permissions || []).sort().join('\n'));
  }
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
