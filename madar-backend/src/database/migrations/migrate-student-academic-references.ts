import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import mongoose, { Types } from 'mongoose';
import { Student, StudentSchema } from '../../students/schemas/student.schema';
import { University, UniversitySchema } from '../../universities/schemas/university.schema';
import { College, CollegeSchema } from '../../universities/colleges/schemas/college.schema';
import { Department, DepartmentSchema } from '../../universities/departments/schemas/department.schema';
import { AcademicProgram, AcademicProgramSchema } from '../../universities/academic-programs/schemas/academic-program.schema';

function normalize(value: unknown) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase();
}

function exactMatches<T extends Record<string, any>>(items: T[], value: unknown, fields: Array<keyof T>) {
  const target = normalize(value);
  if (!target) return [];
  return items.filter((item) => fields.some((field) => {
    const candidate = item[field];
    return Array.isArray(candidate) ? candidate.some((entry) => normalize(entry) === target) : normalize(candidate) === target;
  }));
}

async function main() {
  const dryRun = !process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const StudentModel: any = mongoose.models[Student.name] || mongoose.model(Student.name, StudentSchema);
  const UniversityModel: any = mongoose.models[University.name] || mongoose.model(University.name, UniversitySchema);
  const CollegeModel: any = mongoose.models[College.name] || mongoose.model(College.name, CollegeSchema);
  const DepartmentModel: any = mongoose.models[Department.name] || mongoose.model(Department.name, DepartmentSchema);
  const ProgramModel: any = mongoose.models[AcademicProgram.name] || mongoose.model(AcademicProgram.name, AcademicProgramSchema);

  const [students, universities, colleges, departments, programs] = await Promise.all([
    StudentModel.find({ $or: [
      { 'academicInfo.universityName': { $type: 'string', $ne: '' } },
      { 'academicInfo.collegeName': { $type: 'string', $ne: '' } },
      { 'academicInfo.departmentName': { $type: 'string', $ne: '' } },
      { 'academicInfo.majorName': { $type: 'string', $ne: '' } },
    ] }).lean(),
    UniversityModel.find({ isActive: true, isDemo: { $ne: true }, deletedAt: { $exists: false } }).select('name nameAr nameEn aliases slug').lean(),
    CollegeModel.find({ isActive: true, deletedAt: { $exists: false } }).select('universityId name nameAr nameEn slug').lean(),
    DepartmentModel.find({ isActive: true, deletedAt: { $exists: false } }).select('universityId collegeId name nameAr nameEn slug').lean(),
    ProgramModel.find({ isActive: true, deletedAt: { $exists: false } }).select('universityId collegeId departmentId nameAr nameEn slug code').lean(),
  ]);

  const report: any = { dryRun, affected: students.length, confirmed: [], partial: [], ambiguous: [], unmatched: [], errors: [] };
  for (const student of students as any[]) {
    try {
      const info = student.academicInfo || {};
      const universityMatches = exactMatches(universities as any[], info.universityName, ['name', 'nameAr', 'nameEn', 'aliases', 'slug']);
      if (universityMatches.length !== 1) {
        (universityMatches.length > 1 ? report.ambiguous : report.unmatched).push({ studentId: String(student._id), field: 'university', value: info.universityName || null, candidates: universityMatches.map((item: any) => String(item._id)) });
        continue;
      }
      const university = universityMatches[0] as any;
      const collegeMatches = exactMatches((colleges as any[]).filter((item) => String(item.universityId) === String(university._id)), info.collegeName, ['name', 'nameAr', 'nameEn', 'slug']);
      const college = collegeMatches.length === 1 ? collegeMatches[0] as any : null;
      const departmentMatches = college ? exactMatches((departments as any[]).filter((item) => String(item.collegeId) === String(college._id)), info.departmentName, ['name', 'nameAr', 'nameEn', 'slug']) : [];
      const department = departmentMatches.length === 1 ? departmentMatches[0] as any : null;
      const programMatches = department ? exactMatches((programs as any[]).filter((item) => String(item.departmentId) === String(department._id)), info.majorName, ['nameAr', 'nameEn', 'slug', 'code']) : [];
      const program = programMatches.length === 1 ? programMatches[0] as any : null;

      const update: Record<string, any> = { 'academicInfo.universityId': university._id, 'academicInfo.requiresAcademicUpdate': Boolean(info.collegeName && !college) || Boolean(info.departmentName && !department) || Boolean(info.majorName && !program) };
      if (college) update['academicInfo.collegeId'] = college._id;
      if (department) update['academicInfo.departmentId'] = department._id;
      if (program) update['academicInfo.majorId'] = program._id;
      const entry = { studentId: String(student._id), universityId: String(university._id), collegeId: college ? String(college._id) : null, departmentId: department ? String(department._id) : null, majorId: program ? String(program._id) : null };
      (update['academicInfo.requiresAcademicUpdate'] ? report.partial : report.confirmed).push(entry);
      if (!dryRun) await StudentModel.updateOne({ _id: student._id }, { $set: update });
    } catch (error: any) {
      report.errors.push({ studentId: String((student as any)._id), reason: error?.message || String(error) });
    }
  }

  const reportDirectory = join(process.cwd(), 'migration-reports');
  await mkdir(reportDirectory, { recursive: true });
  const reportPath = join(reportDirectory, `student-academic-references-${dryRun ? 'dry-run' : 'applied'}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
  process.stdout.write(`${JSON.stringify({ reportPath, summary: { affected: report.affected, confirmed: report.confirmed.length, partial: report.partial.length, ambiguous: report.ambiguous.length, unmatched: report.unmatched.length, errors: report.errors.length } }, null, 2)}\n`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
