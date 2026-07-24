const { MongoClient, ObjectId } = require('mongodb');

(async () => {
  const client = new MongoClient('mongodb://127.0.0.1:27017/madar');
  await client.connect();
  const db = client.db();
  const users = await db.collection('users').find({ $or: [{ role: { $exists: false } }, { role: null }, { role: '' }] }).toArray();
  console.log(`Found ${users.length} users without a role.`);
  let fixed = 0;
  for (const u of users) {
    const staff = await db.collection('collegecoordinators').findOne({ userId: u._id });
    const uni = await db.collection('universities').findOne({ userId: u._id });
    let role = u.userType;
    if (!role) {
      if (staff) role = 'coordinator';
      else if (uni) role = 'university';
    }
    if (role) {
      await db.collection('users').updateOne({ _id: u._id }, { $set: { role } });
      console.log(`Set role=${role} for ${u.email}`);
      fixed++;
    } else {
      console.log(`Could not infer role for ${u.email}`);
    }
  }
  console.log(`Fixed ${fixed} users.`);
  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
