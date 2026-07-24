const { MongoClient, ObjectId } = require('mongodb');

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27017/madar');
  await client.connect();
  const db = client.db();

  const KSU_ID = '6a4d62929ade653e05e0718f';
  const COLLEGE_ID = '6a4d62929ade653e05e071e4';
  const USER_EMAIL = 'jawadaqlan@gmail.com';

  const user = await db.collection('users').findOne({ email: USER_EMAIL });
  if (!user) throw new Error('User not found');

  // Ensure the college is linked to KSU
  await db.collection('colleges').updateOne(
    { _id: new ObjectId(COLLEGE_ID) },
    { $set: { universityId: new ObjectId(KSU_ID), updatedAt: new Date() } },
  );

  // Update user institutional links
  await db.collection('users').updateOne(
    { _id: user._id },
    { $set: { universityId: new ObjectId(KSU_ID), collegeId: new ObjectId(COLLEGE_ID), updatedAt: new Date() } },
  );

  // Remove any stale staff records for this user
  await db.collection('collegecoordinators').deleteMany({ userId: user._id });

  // Create accepted coordinator staff record
  await db.collection('collegecoordinators').insertOne({
    userId: user._id,
    universityId: new ObjectId(KSU_ID),
    collegeId: new ObjectId(COLLEGE_ID),
    role: 'coordinator',
    permissions: [
      'dashboard:read', 'structure:read', 'students:read', 'analytics:read',
      'departments:read', 'study-plans:read', 'study-plans:write',
      'courses:read', 'courses:write', 'course-skills:manage',
      'curriculum-analysis:run', 'college-reports:read', 'college:write',
      'affiliations:write', 'reports:read', 'audit:read',
    ],
    status: 'active',
    invitationStatus: 'accepted',
    invitedBy: user._id,
    invitedAt: new Date(),
    lastInvitedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Audit log
  await db.collection('auditlogs').insertOne({
    actorId: user._id,
    actorModel: 'User',
    action: 'RECOVERY_FIX_JAWADAQLAN',
    targetId: user._id,
    targetModel: 'User',
    details: { universityId: KSU_ID, collegeId: COLLEGE_ID, role: 'coordinator' },
    createdAt: new Date(),
  });

  console.log('Fixed jawadaqlan@gmail.com');
  await client.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
