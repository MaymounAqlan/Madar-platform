import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import mongoose from 'mongoose';

async function main() {
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection is not ready');
  const universities = db.collection('universities');
  const colleges = db.collection('colleges');
  const departments = db.collection('departments');
  const programs = db.collection('academicprograms');
  const students = db.collection('students');
  const activeUniversities = new Set((await universities.find({ deletedAt: { $exists: false } }).project({ _id: 1 }).toArray()).map((item) => String(item._id)));
  const activeColleges = await colleges.find({ deletedAt: { $exists: false } }).toArray();
  const orphanColleges = activeColleges.filter((item: any) => item.universityId && !activeUniversities.has(String(item.universityId)));
  const orphanCollegeIds = new Set(orphanColleges.map((item) => String(item._id)));
  const activeDepartments = await departments.find({ deletedAt: { $exists: false } }).toArray();
  const validCollegeIds = new Set(activeColleges.filter((item: any) => !orphanCollegeIds.has(String(item._id))).map((item) => String(item._id)));
  const orphanDepartments = activeDepartments.filter((item: any) => !validCollegeIds.has(String(item.collegeId)) || (item.universityId && !activeUniversities.has(String(item.universityId))));
  const orphanDepartmentIds = new Set(orphanDepartments.map((item) => String(item._id)));
  const activePrograms = await programs.find({ deletedAt: { $exists: false } }).toArray();
  const validDepartmentIds = new Set(activeDepartments.filter((item: any) => !orphanDepartmentIds.has(String(item._id))).map((item) => String(item._id)));
  const orphanPrograms = activePrograms.filter((item: any) => !validDepartmentIds.has(String(item.departmentId)) || !validCollegeIds.has(String(item.collegeId)) || !activeUniversities.has(String(item.universityId)));
  const validProgramIds = new Set(activePrograms.filter((item: any) => !orphanPrograms.some((orphan) => String(orphan._id) === String(item._id))).map((item) => String(item._id)));
  const linkedStudents = await students.find({ $or: [{ 'academicInfo.universityId': { $exists: true } }, { 'academicInfo.collegeId': { $exists: true } }, { 'academicInfo.departmentId': { $exists: true } }, { 'academicInfo.majorId': { $exists: true } }] }).toArray();
  const orphanStudents = linkedStudents.filter((item: any) => {
    const academic = item.academicInfo || {};
    return (academic.universityId && !activeUniversities.has(String(academic.universityId))) || (academic.collegeId && !validCollegeIds.has(String(academic.collegeId))) || (academic.departmentId && !validDepartmentIds.has(String(academic.departmentId))) || (academic.majorId && !validProgramIds.has(String(academic.majorId)));
  });
  const report: any = { dryRun: !apply, generatedAt: new Date().toISOString(), orphanColleges, orphanDepartments, orphanPrograms, orphanStudents: orphanStudents.map((student: any) => ({ _id: student._id, userId: student.userId, academicInfo: student.academicInfo })), applied: null };
  const directory = join(process.cwd(), 'migration-reports');
  await mkdir(directory, { recursive: true });
  const path = join(directory, `orphan-academic-references-${apply ? 'applied' : 'dry-run'}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(path, JSON.stringify(report, null, 2), 'utf8');
  if (apply) {
    const now = new Date();
    for (const student of orphanStudents as any[]) {
      const academic = student.academicInfo || {};
      await students.updateOne({ _id: student._id }, { $set: { 'academicInfo.requiresAcademicUpdate': true, 'academicInfo.legacy.orphanedReferences': { universityId: academic.universityId || null, collegeId: academic.collegeId || null, departmentId: academic.departmentId || null, majorId: academic.majorId || null, capturedAt: now } }, $unset: { 'academicInfo.universityId': 1, 'academicInfo.collegeId': 1, 'academicInfo.departmentId': 1, 'academicInfo.majorId': 1 } });
    }
    const programIds = orphanPrograms.map((item) => item._id);
    const departmentIds = orphanDepartments.map((item) => item._id);
    const collegeIds = orphanColleges.map((item) => item._id);
    const [programResult, departmentResult, collegeResult] = await Promise.all([
      programs.updateMany({ _id: { $in: programIds } }, { $set: { isActive: false, deletedAt: now } }),
      departments.updateMany({ _id: { $in: departmentIds } }, { $set: { isActive: false, deletedAt: now, 'metadata.status': 'archived' } }),
      colleges.updateMany({ _id: { $in: collegeIds } }, { $set: { isActive: false, deletedAt: now, 'metadata.status': 'archived' } }),
    ]);
    report.applied = { studentsCleared: orphanStudents.length, programsArchived: programResult.modifiedCount, departmentsArchived: departmentResult.modifiedCount, collegesArchived: collegeResult.modifiedCount };
    await writeFile(path, JSON.stringify(report, null, 2), 'utf8');
  }
  process.stdout.write(`${JSON.stringify({ reportPath: path, ...report }, null, 2)}\n`);
  await mongoose.disconnect();
}

main().catch(async (error) => { process.stderr.write(`${error?.stack || error}\n`); await mongoose.disconnect().catch(() => undefined); process.exitCode = 1; });
