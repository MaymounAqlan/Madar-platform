import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Disabled in production');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/madar');
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection unavailable');
  const password = process.env.TEST_ACCOUNT_DEFAULT_PASSWORD || '';
  if (!password) throw new Error('Set TEST_ACCOUNT_DEFAULT_PASSWORD');
  const hash = await bcrypt.hash(password, 10);
  const result = await db.collection('users').updateOne(
    { email: 'company.test@madar.test' },
    { $set: { password: hash } },
  );
  console.log(`Updated ${result.modifiedCount} user(s)`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
