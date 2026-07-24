import { readFile } from 'fs/promises';
import { resolve } from 'path';
import mongoose from 'mongoose';
import { University, UniversitySchema } from '../../universities/schemas/university.schema';
import { College, CollegeSchema } from '../../universities/colleges/schemas/college.schema';
import { Department, DepartmentSchema } from '../../universities/departments/schemas/department.schema';
import { AcademicProgram, AcademicProgramSchema } from '../../universities/academic-programs/schemas/academic-program.schema';
import { UniversityDirectoryService, YemenDirectoryUniversityInput } from '../../universities/university-directory.service';

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = !args.has('--apply');
  const downloadLogos = args.has('--download-logos');
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';
  // Use __dirname to reliably locate the file when compiled to dist
  const dataPath = resolve(__dirname, '..', 'data', 'yemen-universities.json');
  const records = JSON.parse(await readFile(dataPath, 'utf8')) as YemenDirectoryUniversityInput[];

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const universityCollection = mongoose.connection.collection('universities');
  const indexes = await universityCollection.indexes();
  const userIdIndex = indexes.find((index) => index.name === 'userId_1');
  if (userIdIndex && !userIdIndex.partialFilterExpression) {
    await universityCollection.dropIndex('userId_1');
    await universityCollection.createIndex(
      { userId: 1 },
      { name: 'userId_1', unique: true, partialFilterExpression: { userId: { $type: 'objectId' } } },
    );
  }
  const service = new UniversityDirectoryService(
    (mongoose.models[University.name] || mongoose.model(University.name, UniversitySchema)) as any,
    (mongoose.models[College.name] || mongoose.model(College.name, CollegeSchema)) as any,
    (mongoose.models[Department.name] || mongoose.model(Department.name, DepartmentSchema)) as any,
    (mongoose.models[AcademicProgram.name] || mongoose.model(AcademicProgram.name, AcademicProgramSchema)) as any,
  );

  const report = await service.importDirectory(records, { dryRun, downloadLogos });
  process.stdout.write(`${JSON.stringify({ dataPath, ...report }, null, 2)}\n`);
  if (report.failed.length) process.exitCode = 1;
  await mongoose.disconnect();
}

main().catch(async (error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  await mongoose.disconnect().catch(() => undefined);
  process.exitCode = 1;
});
