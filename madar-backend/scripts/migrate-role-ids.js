const mongoose = require('mongoose');

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Disabled in production');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/madar');
  const db = mongoose.connection.db;

  const roles = await db.collection('roles').find({}).toArray();
  const roleMap = {};
  for (const r of roles) {
    roleMap[r.name] = r._id;
  }

  const users = await db.collection('users').find({}).toArray();
  let updated = 0;
  let skipped = 0;

  for (const u of users) {
    if (u.roleId) {
      skipped++;
      continue;
    }
    const roleName = u.userType || u.role;
    const roleId = roleMap[roleName];
    if (roleId) {
      await db.collection('users').updateOne({ _id: u._id }, { $set: { roleId } });
      updated++;
    } else {
      console.log(`No role found for userType: ${roleName} (user ${u.email})`);
    }
  }

  console.log(`Updated ${updated} users with missing roleId, skipped ${skipped} users that already had roleId.`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
