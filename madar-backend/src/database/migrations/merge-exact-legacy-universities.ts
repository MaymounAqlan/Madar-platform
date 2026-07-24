import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import mongoose from 'mongoose';

const normalize = (value: unknown) => String(value || '').normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();

async function main() {
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection is not ready');
  const universities = db.collection('universities');
  const canonical = await universities.find({ isSeedData: true, isDemo: false, deletedAt: { $exists: false } }).toArray();
  const legacy = await universities.find({ isSeedData: { $ne: true }, isDemo: { $ne: true }, deletedAt: { $exists: false } }).toArray();
  const matches: any[] = [];
  for (const source of legacy) {
    const sourceNames = new Set([source.name, source.nameAr, source.nameEn, ...(source.aliases || [])].map(normalize).filter(Boolean));
    const candidates = canonical.filter((target) => [target.name, target.nameAr, target.nameEn, ...(target.aliases || [])].map(normalize).some((name) => sourceNames.has(name)));
    if (candidates.length === 1) matches.push({ source, target: candidates[0] });
  }
  const report: any = { dryRun: !apply, generatedAt: new Date().toISOString(), matches: matches.map(({ source, target }) => ({ source: { id: source._id, name: source.name, userId: source.userId }, target: { id: target._id, nameAr: target.nameAr, slug: target.slug, userId: target.userId } })), applied: [], skipped: [] };
  if (apply) {
    for (const { source, target } of matches) {
      if (source.userId && target.userId) { report.skipped.push({ sourceId: source._id, reason: 'Both records have institutional accounts' }); continue; }
      const sourceColleges = await db.collection('colleges').find({ universityId: source._id, deletedAt: { $exists: false } }).toArray();
      const duplicateCollege = await db.collection('colleges').findOne({ universityId: target._id, slug: { $in: sourceColleges.map((item) => item.slug).filter(Boolean) }, deletedAt: { $exists: false } });
      if (duplicateCollege) { report.skipped.push({ sourceId: source._id, reason: 'Overlapping college slugs require manual review' }); continue; }
      const now = new Date();
      if (source.userId && !target.userId) {
        await universities.updateOne({ _id: source._id }, { $unset: { userId: 1 } });
        try { await universities.updateOne({ _id: target._id }, { $set: { userId: source.userId } }); }
        catch (error) { await universities.updateOne({ _id: source._id }, { $set: { userId: source.userId } }); throw error; }
      }
      await Promise.all([
        db.collection('students').updateMany({ 'academicInfo.universityId': source._id }, { $set: { 'academicInfo.universityId': target._id, 'academicInfo.universityName': target.nameAr || target.name } }),
        db.collection('colleges').updateMany({ universityId: source._id }, { $set: { universityId: target._id } }),
        db.collection('departments').updateMany({ universityId: source._id }, { $set: { universityId: target._id } }),
        db.collection('academicprograms').updateMany({ universityId: source._id }, { $set: { universityId: target._id } }),
        db.collection('studentaffiliations').updateMany({ universityId: source._id }, { $set: { universityId: target._id } }),
        db.collection('collegecoordinators').updateMany({ universityId: source._id }, { $set: { universityId: target._id } }),
        universities.updateOne({ _id: source._id }, { $set: { isActive: false, status: 'inactive', deletedAt: now, mergedIntoId: target._id } }),
      ]);
      report.applied.push({ sourceId: source._id, targetId: target._id, userTransferred: Boolean(source.userId && !target.userId) });
    }
  }
  const directory = join(process.cwd(), 'migration-reports');
  await mkdir(directory, { recursive: true });
  const path = join(directory, `exact-legacy-university-merge-${apply ? 'applied' : 'dry-run'}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(path, JSON.stringify(report, null, 2), 'utf8');
  process.stdout.write(`${JSON.stringify({ reportPath: path, ...report }, null, 2)}\n`);
  await mongoose.disconnect();
}

main().catch(async (error) => { process.stderr.write(`${error?.stack || error}\n`); await mongoose.disconnect().catch(() => undefined); process.exitCode = 1; });
