const { MongoClient, ObjectId } = require('mongodb');
async function main() {
  const client = new MongoClient('mongodb://localhost:27017/madar');
  await client.connect();
  const db = client.db();
  await db.collection('users').updateOne(
    { _id: new ObjectId('650000000000000000000301') },
    { $set: { password: '$2b$10$nDHV7GPdoDGBbPIPL2FzJe7mYnJBLo.AtgOA8zu/NLAhwPvx.r8O6', isActive: true, emailVerified: true, status: 'active' } },
    { upsert: true }
  );
  console.log('University user password updated');
  await client.close();
}
main().catch(err => { console.error(err); process.exit(1); });
