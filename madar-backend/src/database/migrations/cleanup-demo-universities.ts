import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import mongoose, { Types } from 'mongoose';

const KNOWN_DEMO_NAMES = [
  'King Saud University',
  'King Fahd University of Petroleum and Minerals',
  'King Abdulaziz University',
  'Madar Test University',
  'QA Execution University',
  'جامعة مدار التجريبية 9152',
  'MADAR Flow University',
  'MADAR Competitor University',
  'Active Test University',
  'Pending Test University',
  'Suspended Test University',
  'MADAR Development University',
  'MADAR Pending Test University',
  'MADAR Suspended Test University',
  'Dbg Uni',
  'Dbg Uni3',
];

async function main() {
  const dryRun = !process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection is not ready');

  const universities = db.collection('universities');
  const users = db.collection('users');
  const colleges = db.collection('colleges');
  const departments = db.collection('departments');
  const programs = db.collection('academicprograms');
  const students = db.collection('students');

  const linkedTestUsers = await users.find({ email: /@madar\.test$/i }).project({ _id: 1, email: 1 }).toArray();
  const testUserIds = linkedTestUsers.map((item) => item._id);
  const candidates = await universities.find({
    isSeedData: { $ne: true },
    $or: [
      { isDemo: true },
      { dataSource: /(?:demo|sample|test)/i },
      { name: { $in: KNOWN_DEMO_NAMES } },
      { nameAr: { $in: KNOWN_DEMO_NAMES } },
      { userId: { $in: testUserIds }, name: /(?:test|demo|sample|madar|dbg|qa)/i },
    ],
  }).toArray();

  const report: any = { dryRun, generatedAt: new Date().toISOString(), candidates: [], totals: { universities: candidates.length, colleges: 0, departments: 0, majors: 0, students: 0, users: 0 }, deleted: {}, ignored: [], transaction: dryRun ? 'not_started' : 'pending' };
  for (const university of candidates) {
    const universityId = university._id;
    const relatedColleges = await colleges.find({ universityId }).project({ _id: 1, name: 1, nameAr: 1 }).toArray();
    const collegeIds = relatedColleges.map((item) => item._id);
    const relatedDepartments = await departments.find({ $or: [{ universityId }, { collegeId: { $in: collegeIds } }] }).project({ _id: 1, name: 1, nameAr: 1 }).toArray();
    const departmentIds = relatedDepartments.map((item) => item._id);
    const relatedPrograms = await programs.find({ $or: [{ universityId }, { collegeId: { $in: collegeIds } }, { departmentId: { $in: departmentIds } }] }).project({ _id: 1, nameAr: 1 }).toArray();
    const relatedStudents = await students.find({ $or: [{ 'academicInfo.universityId': universityId }, { 'academicInfo.collegeId': { $in: collegeIds } }, { 'academicInfo.departmentId': { $in: departmentIds } }] }).project({ _id: 1, userId: 1, academicInfo: 1 }).toArray();
    const linkedUser = university.userId ? await users.findOne({ _id: university.userId }, { projection: { email: 1, userType: 1, status: 1 } }) : null;
    report.totals.colleges += relatedColleges.length;
    report.totals.departments += relatedDepartments.length;
    report.totals.majors += relatedPrograms.length;
    report.totals.students += relatedStudents.length;
    report.totals.users += linkedUser ? 1 : 0;
    report.candidates.push({ university: { id: String(universityId), name: university.name, nameAr: university.nameAr, dataSource: university.dataSource, isDemo: university.isDemo }, colleges: relatedColleges, departments: relatedDepartments, majors: relatedPrograms, students: relatedStudents.map((student: any) => ({ id: String(student._id), userId: String(student.userId), academicInfo: student.academicInfo })), linkedUser });
  }

  const reportDirectory = join(process.cwd(), 'migration-reports');
  await mkdir(reportDirectory, { recursive: true });
  const reportPath = join(reportDirectory, `demo-university-cleanup-${dryRun ? 'dry-run' : 'pre-delete'}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');

  if (!dryRun && candidates.length) {
    const universityIds = candidates.map((item) => item._id);
    const relatedColleges = await colleges.find({ universityId: { $in: universityIds } }).project({ _id: 1 }).toArray();
    const collegeIds = relatedColleges.map((item) => item._id);
    const relatedDepartments = await departments.find({ $or: [{ universityId: { $in: universityIds } }, { collegeId: { $in: collegeIds } }] }).project({ _id: 1 }).toArray();
    const departmentIds = relatedDepartments.map((item) => item._id);
    const relatedPrograms = await programs.find({ $or: [{ universityId: { $in: universityIds } }, { collegeId: { $in: collegeIds } }, { departmentId: { $in: departmentIds } }] }).project({ _id: 1 }).toArray();
    const programIds = relatedPrograms.map((item) => item._id);
    const now = new Date();

    const performCleanup = async (session?: mongoose.ClientSession) => {
      const options = session ? { session } : {};
      await students.updateMany(
        { $or: [{ 'academicInfo.universityId': { $in: universityIds } }, { 'academicInfo.collegeId': { $in: collegeIds } }, { 'academicInfo.departmentId': { $in: departmentIds } }, { 'academicInfo.majorId': { $in: programIds } }] },
        [
          { $set: {
            'academicInfo.legacy': { universityId: { $toString: '$academicInfo.universityId' }, collegeId: { $toString: '$academicInfo.collegeId' }, departmentId: { $toString: '$academicInfo.departmentId' }, majorId: { $toString: '$academicInfo.majorId' }, universityName: '$academicInfo.universityName', collegeName: '$academicInfo.collegeName', departmentName: '$academicInfo.departmentName', majorName: '$academicInfo.majorName', migratedAt: now, reason: 'demo_university_removed' },
            'academicInfo.requiresAcademicUpdate': true,
            'academicInfo.universityId': { $cond: [{ $in: ['$academicInfo.universityId', universityIds] }, '$$REMOVE', '$academicInfo.universityId'] },
            'academicInfo.collegeId': { $cond: [{ $in: ['$academicInfo.collegeId', collegeIds] }, '$$REMOVE', '$academicInfo.collegeId'] },
            'academicInfo.departmentId': { $cond: [{ $in: ['$academicInfo.departmentId', departmentIds] }, '$$REMOVE', '$academicInfo.departmentId'] },
            'academicInfo.majorId': { $cond: [{ $in: ['$academicInfo.majorId', programIds] }, '$$REMOVE', '$academicInfo.majorId'] },
          } },
        ],
        options,
      );

      for (const collectionName of ['studentaffiliations', 'collegecoordinators', 'studyplans', 'courses', 'curriculumanalyses']) {
        const collection = db.collection(collectionName);
        const outcome = await collection.deleteMany({ $or: [{ universityId: { $in: universityIds } }, { collegeId: { $in: collegeIds } }, { departmentId: { $in: departmentIds } }] }, options);
        report.deleted[collectionName] = outcome.deletedCount;
      }
      // Remove dependent academic entities before their parent records.
      report.deleted.majors = (await programs.deleteMany({ _id: { $in: programIds } }, options)).deletedCount;
      report.deleted.departments = (await departments.deleteMany({ _id: { $in: departmentIds } }, options)).deletedCount;
      report.deleted.colleges = (await colleges.deleteMany({ _id: { $in: collegeIds } }, options)).deletedCount;
      report.deleted.universities = (await universities.deleteMany({ _id: { $in: universityIds } }, options)).deletedCount;
    };

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => performCleanup(session));
      report.transaction = 'committed';
    } catch (error: any) {
      if (!/Transaction numbers are only allowed|replica set|mongos/i.test(error?.message || '')) throw error;
      report.transaction = 'unavailable_fallback';
      report.ignored.push({ reason: 'MongoDB deployment does not support transactions; ordered cleanup fallback was used' });
      await performCleanup();
    } finally {
      await session.endSession();
    }
  }

  process.stdout.write(`${JSON.stringify({ reportPath, dryRun, totals: report.totals, deleted: report.deleted }, null, 2)}\n`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
