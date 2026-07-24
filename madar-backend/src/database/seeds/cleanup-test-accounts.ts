import mongoose from 'mongoose';

const emails = [
  'superadmin.test@madar.test', 'university.active@madar.test', 'university.pending@madar.test',
  'university.suspended@madar.test', 'coordinator.test@madar.test', 'viewer.test@madar.test',
  'data.officer.test@madar.test', 'quality.officer.test@madar.test', 'disabled.staff.test@madar.test',
  'academic.development.test@madar.test', 'coordinator.engineering.test@madar.test', 'coordinator.business.test@madar.test',
  'student.ds.test@madar.test', 'student.se.test@madar.test', 'student.ee.test@madar.test', 'student.me.test@madar.test',
  'student.business.test@madar.test', 'student.comp1@madar.test', 'student.comp2@madar.test',
  'company.test@madar.test',
  'admin.full@madar.test', 'admin.readonly@madar.test', 'admin.limited@madar.test', 'admin.disabled@madar.test',
];

async function cleanup(): Promise<void> {
  if (process.env.NODE_ENV === 'production') throw new Error('Test account cleanup is disabled in production');
  if (process.env.ENABLE_TEST_SEED !== 'true') throw new Error('Set ENABLE_TEST_SEED=true to clean development test accounts');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/madar');
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection is unavailable');
  const users = await db.collection('users').find({ email: { $in: emails } }).toArray();
  const userIds = users.map((item) => item._id);
  const universities = await db.collection('universities').find({ userId: { $in: userIds } }).toArray();
  const universityIds = universities.map((item) => item._id);
  const staff = await db.collection('collegecoordinators').find({ universityId: { $in: universityIds } }).toArray();
  const staffIds = staff.map((item) => String(item._id));

  await db.collection('notifications').deleteMany({ userId: { $in: userIds } });
  await db.collection('auditlogs').deleteMany({ $or: [{ actorId: { $in: userIds } }, { userId: { $in: userIds } }, { resourceId: { $in: staffIds } }] });
  const students = await db.collection('students').find({ userId: { $in: userIds } }).toArray();
  const studentIds = students.map((item) => item._id);
  await db.collection('studentaffiliations').deleteMany({ studentId: { $in: studentIds } });
  await db.collection('academicrecommendations').deleteMany({ universityId: { $in: universityIds } });
  await db.collection('courses').deleteMany({ universityId: { $in: universityIds }, 'metadata.testData': true });
  await db.collection('studyplans').deleteMany({ universityId: { $in: universityIds }, 'metadata.testData': true });
  await db.collection('students').deleteMany({ userId: { $in: userIds } });
  await db.collection('collegecoordinators').deleteMany({ universityId: { $in: universityIds } });
  await db.collection('departments').deleteMany({ universityId: { $in: universityIds }, 'metadata.testData': true });
  await db.collection('colleges').deleteMany({ universityId: { $in: universityIds }, 'metadata.testData': true });
  await db.collection('universities').deleteMany({ _id: { $in: universityIds } });
  await db.collection('users').deleteMany({ _id: { $in: userIds }, email: { $in: emails } });
  await db.collection('roles').deleteMany({ name: { $in: ['admin_full_test', 'admin_readonly_test', 'admin_limited_test'] } });
  console.log('Development test accounts and their linked test records were removed.');
}

cleanup().catch((error) => { console.error(`Test cleanup failed: ${error.message}`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
