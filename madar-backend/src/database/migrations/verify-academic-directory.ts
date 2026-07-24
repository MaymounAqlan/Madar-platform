import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import mongoose from 'mongoose';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection is not ready');
  const universities = db.collection('universities');
  const colleges = db.collection('colleges');
  const departments = db.collection('departments');
  const programs = db.collection('academicprograms');
  const students = db.collection('students');

  const [universityIds, collegeIds, departmentIds, programIds] = await Promise.all([
    universities.find({ deletedAt: { $exists: false } }).project({ _id: 1 }).toArray(),
    colleges.find({ deletedAt: { $exists: false } }).project({ _id: 1 }).toArray(),
    departments.find({ deletedAt: { $exists: false } }).project({ _id: 1 }).toArray(),
    programs.find({ deletedAt: { $exists: false } }).project({ _id: 1 }).toArray(),
  ]);
  const universitySet = new Set(universityIds.map((item) => String(item._id)));
  const collegeSet = new Set(collegeIds.map((item) => String(item._id)));
  const departmentSet = new Set(departmentIds.map((item) => String(item._id)));
  const programSet = new Set(programIds.map((item) => String(item._id)));

  const [allColleges, allDepartments, allPrograms, linkedStudents, duplicateSlugs, unverified, hotlinkedLogos, missingSources] = await Promise.all([
    colleges.find({ deletedAt: { $exists: false } }).project({ universityId: 1, nameAr: 1 }).toArray(),
    departments.find({ deletedAt: { $exists: false } }).project({ universityId: 1, collegeId: 1, nameAr: 1 }).toArray(),
    programs.find({ deletedAt: { $exists: false } }).project({ universityId: 1, collegeId: 1, departmentId: 1, nameAr: 1 }).toArray(),
    students.find({ $or: [{ 'academicInfo.universityId': { $exists: true } }, { 'academicInfo.collegeId': { $exists: true } }, { 'academicInfo.departmentId': { $exists: true } }, { 'academicInfo.majorId': { $exists: true } }] }).project({ userId: 1, academicInfo: 1 }).toArray(),
    universities.aggregate([{ $match: { deletedAt: { $exists: false }, slug: { $type: 'string' } } }, { $group: { _id: '$slug', ids: { $push: '$_id' }, count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]).toArray(),
    universities.find({ deletedAt: { $exists: false }, verificationStatus: { $ne: 'verified' } }).project({ nameAr: 1, slug: 1, verificationStatus: 1 }).toArray(),
    universities.find({ deletedAt: { $exists: false }, $or: [{ logoUrl: /^https?:/i }, { logoStorageKey: /^https?:/i }] }).project({ nameAr: 1, slug: 1, logoUrl: 1 }).toArray(),
    universities.find({ deletedAt: { $exists: false }, $or: [{ sourceUrls: { $exists: false } }, { sourceUrls: { $size: 0 } }] }).project({ nameAr: 1, slug: 1 }).toArray(),
  ]);

  const orphanColleges = allColleges.filter((item: any) => item.universityId && !universitySet.has(String(item.universityId)));
  const orphanDepartments = allDepartments.filter((item: any) => !collegeSet.has(String(item.collegeId)) || (item.universityId && !universitySet.has(String(item.universityId))));
  const orphanPrograms = allPrograms.filter((item: any) => !departmentSet.has(String(item.departmentId)) || !collegeSet.has(String(item.collegeId)) || !universitySet.has(String(item.universityId)));
  const orphanStudents = linkedStudents.filter((item: any) => {
    const academic = item.academicInfo || {};
    return (academic.universityId && !universitySet.has(String(academic.universityId))) || (academic.collegeId && !collegeSet.has(String(academic.collegeId))) || (academic.departmentId && !departmentSet.has(String(academic.departmentId))) || (academic.majorId && !programSet.has(String(academic.majorId)));
  });
  const counts = await Promise.all([universities.countDocuments({ deletedAt: { $exists: false } }), colleges.countDocuments({ deletedAt: { $exists: false } }), departments.countDocuments({ deletedAt: { $exists: false } }), programs.countDocuments({ deletedAt: { $exists: false } })]);
  const report = {
    generatedAt: new Date().toISOString(),
    counts: { universities: counts[0], colleges: counts[1], departments: counts[2], majors: counts[3] },
    integrity: { duplicateUniversitySlugs: duplicateSlugs, orphanColleges, orphanDepartments, orphanPrograms, orphanStudents, hotlinkedLogos },
    review: { unverified, missingSources },
    passed: duplicateSlugs.length === 0 && orphanColleges.length === 0 && orphanDepartments.length === 0 && orphanPrograms.length === 0 && orphanStudents.length === 0 && hotlinkedLogos.length === 0,
  };
  const directory = join(process.cwd(), 'migration-reports');
  await mkdir(directory, { recursive: true });
  const path = join(directory, `academic-directory-integrity-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(path, JSON.stringify(report, null, 2), 'utf8');
  process.stdout.write(`${JSON.stringify({ reportPath: path, ...report }, null, 2)}\n`);
  if (!report.passed) process.exitCode = 1;
  await mongoose.disconnect();
}

main().catch(async (error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
