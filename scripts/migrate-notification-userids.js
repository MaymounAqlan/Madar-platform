const { MongoClient, ObjectId } = require('mongodb');

(async () => {
  const client = new MongoClient('mongodb://127.0.0.1:27017/madar');
  await client.connect();
  const col = client.db().collection('notifications');
  const docs = await col.find({ userId: { $type: 'string' } }).toArray();
  let migrated = 0;
  for (const d of docs) {
    try {
      await col.updateOne({ _id: d._id }, { $set: { userId: new ObjectId(d.userId) } });
      migrated++;
    } catch (e) {
      console.log('skip', d._id.toString(), e.message);
    }
  }
  console.log(`Migrated ${migrated} notification userId strings to ObjectId.`);
  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
