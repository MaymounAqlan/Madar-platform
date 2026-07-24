const { MongoClient, ObjectId } = require('mongodb');
const uri = 'mongodb://localhost:27017/madar';

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const userId = new ObjectId('650000000000000000000301');
  const coordinatorUserId = new ObjectId('650000000000000000000401');

  const university = await db.collection('universities').findOneAndUpdate(
    { userId },
    { $set: { status: 'active', updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  const universityId = university._id;
  console.log('Activated university', universityId.toString());

  const collegeId = new ObjectId('650000000000000000000501');
  const departmentId = new ObjectId('650000000000000000000601');

  await db.collection('colleges').updateOne(
    { _id: collegeId },
    {
      $setOnInsert: { createdAt: new Date() },
      $set: {
        universityId,
        name: 'College of Engineering',
        nameAr: 'كلية الهندسة',
        code: 'ENG',
        status: 'active',
        description: 'Verification college',
        metadata: { status: 'active' },
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  await db.collection('departments').updateOne(
    { _id: departmentId },
    {
      $setOnInsert: { createdAt: new Date() },
      $set: {
        universityId,
        collegeId,
        name: 'Computer Science',
        nameAr: 'علوم الحاسب',
        code: 'CS',
        status: 'active',
        description: 'Verification department',
        metadata: { status: 'active' },
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  await db.collection('users').updateOne(
    { _id: coordinatorUserId },
    { $set: { isActive: true, emailVerified: true, status: 'active' } },
  );

  await db.collection('collegecoordinators').updateOne(
    { userId: coordinatorUserId },
    {
      $setOnInsert: { createdAt: new Date() },
      $set: {
        universityId,
        collegeId,
        userId: coordinatorUserId,
        role: 'coordinator',
        name: 'Mohammed Al-Coordinat',
        email: 'coordinator@ksu.edu.sa',
        status: 'active',
        invitationStatus: 'accepted',
        permissions: ['study-plans:write', 'courses:write', 'course-skills:manage'],
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  await db.collection('skills').updateOne(
    { name: { $regex: '^python$', $options: 'i' } },
    {
      $setOnInsert: { createdAt: new Date() },
      $set: {
        name: 'Python',
        nameAr: 'بايثون',
        category: 'programming',
        description: 'Programming language',
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );

  console.log('Verification seed complete');
  console.log({ universityId: universityId.toString(), collegeId: collegeId.toString(), departmentId: departmentId.toString() });
  await client.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
