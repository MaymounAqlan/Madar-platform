const { MongoClient, ObjectId } = require('mongodb');
async function main() {
  const client = new MongoClient('mongodb://localhost:27017/madar');
  await client.connect();
  const db = client.db();
  const plan = await db.collection('studyplans').findOne({ _id: new ObjectId('6a5574e38ddc3a74eb51ef65') });
  console.log('Plan:', JSON.stringify({ name: plan?.name, status: plan?.status, courses: plan?.courses?.length, totalCredits: plan?.totalCredits, academicYear: plan?.academicYear }, null, 2));
  const courses = await db.collection('courses').find({ studyPlanId: new ObjectId('6a5574e38ddc3a74eb51ef65') }).toArray();
  console.log('Courses count:', courses.length);
  for (const c of courses) {
    const prereqs = await db.collection('courses').find({ _id: { $in: c.prerequisites || [] } }).toArray();
    console.log(`  ${c.code}: ${c.nameEn} | credits=${c.credits} | year=${c.year} | sem=${c.semester} | prereqs=${prereqs.map(p => p.code).join(',')}`);
  }
  await client.close();
}
main().catch(err => { console.error(err); process.exit(1); });
