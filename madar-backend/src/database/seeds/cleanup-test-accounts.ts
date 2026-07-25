import 'dotenv/config';
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
  // if (process.env.ENABLE_TEST_SEED !== 'true') throw new Error('Set ENABLE_TEST_SEED=true to clean development test accounts');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/madar');
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection is unavailable');
  const exactEmailsMap: Record<string, { admin: string; coordinator: string }> = {
    'جامعة صنعاء': { admin: 'admin@su.edu.ye', coordinator: 'coordinator@su.edu.ye' },
    'جامعة عدن': { admin: 'admin@aden-univ.net', coordinator: 'coordinator@aden-univ.net' },
    'جامعة حضرموت': { admin: 'admin@hu.edu.ye', coordinator: 'coordinator@hu.edu.ye' },
    'جامعة تعز': { admin: 'admin@taiz.edu.ye', coordinator: 'coordinator@taiz.edu.ye' },
    'جامعة إقليم سبأ': { admin: 'admin@usr.ac', coordinator: 'coordinator@usr.ac' },
    'جامعة سيئون': { admin: 'admin@seiyunu.edu.ye', coordinator: 'coordinator@seiyunu.edu.ye' },
    'جامعة شبوة': { admin: 'admin@shu.edu.ye', coordinator: 'coordinator@shu.edu.ye' },
    'جامعة أبين': { admin: 'admin@abyan-univ.net', coordinator: 'coordinator@abyan-univ.net' },
    'جامعة لحج': { admin: 'admin@lahj-university.edu.ye', coordinator: 'coordinator@lahj-university.edu.ye' },
    'جامعة المهرة': { admin: 'admin@mhru.edu.ye', coordinator: 'coordinator@mhru.edu.ye' },
    'جامعة إب': { admin: 'admin@ibb-university.edu.ye', coordinator: 'coordinator@ibb-university.edu.ye' },
    'جامعة الحديدة': { admin: 'admin@hodeidah-university.edu.ye', coordinator: 'coordinator@hodeidah-university.edu.ye' },
    'جامعة ذمار': { admin: 'admin@thamar-university.edu.ye', coordinator: 'coordinator@thamar-university.edu.ye' },
    'جامعة عمران': { admin: 'admin@amran-university.edu.ye', coordinator: 'coordinator@amran-university.edu.ye' },
    'جامعة حجة': { admin: 'admin@hajjah-university.edu.ye', coordinator: 'coordinator@hajjah-university.edu.ye' },
    'جامعة البيضاء': { admin: 'admin@al-baydha-university.edu.ye', coordinator: 'coordinator@al-baydha-university.edu.ye' },
    'جامعة صعدة': { admin: 'admin@saada-university.edu.ye', coordinator: 'coordinator@saada-university.edu.ye' },
    'جامعة 21 سبتمبر': { admin: 'admin@21-september-university.edu.ye', coordinator: 'coordinator@21-september-university.edu.ye' },
    'جامعة جبلة للعلوم': { admin: 'admin@jiblah-university.edu.ye', coordinator: 'coordinator@jiblah-university.edu.ye' },
    'جامعة العلوم والتكنولوجيا': { admin: 'admin@ust.edu', coordinator: 'coordinator@ust.edu' },
    'جامعة الريان': { admin: 'admin@alrayan-university.edu.ye', coordinator: 'coordinator@alrayan-university.edu.ye' },
    'جامعة ابن خلدون': { admin: 'admin@ik-univ.net', coordinator: 'coordinator@ik-univ.net' },
    'كلية 22 مايو للعلوم الطبية': { admin: 'admin@22may-univ.com', coordinator: 'coordinator@22may-univ.com' },
    'جامعة الإمام الشافعي': { admin: 'admin@imam-shafii.edu.ye', coordinator: 'coordinator@imam-shafii.edu.ye' },
    'جامعة الأحقاف': { admin: 'admin@ahgaff.edu', coordinator: 'coordinator@ahgaff.edu' },
    'جامعة الحكمة': { admin: 'admin@hikma.edu.ye', coordinator: 'coordinator@hikma.edu.ye' },
    'جامعة العادل': { admin: 'admin@al-adel.university.com', coordinator: 'coordinator@al-adel.university.com' },
    'جامعة العرب': { admin: 'admin@alarabuni.com', coordinator: 'coordinator@alarabuni.com' },
    'الجامعة الوطنية': { admin: 'admin@national-univ.net', coordinator: 'coordinator@national-univ.net' },
    'جامعة القرآن الكريم': { admin: 'admin@uqs.me', coordinator: 'coordinator@uqs.me' },
    'جامعة الوسطية الشرعية': { admin: 'admin@wasatiacollege.com', coordinator: 'coordinator@wasatiacollege.com' },
    'جامعة العطاء': { admin: 'admin@alataa-univ.net', coordinator: 'coordinator@alataa-univ.net' },
    'جامعة الجند': { admin: 'admin@just.edu.ye', coordinator: 'coordinator@just.edu.ye' },
    'جامعة الريادة': { admin: 'admin@ru-ye.com', coordinator: 'coordinator@ru-ye.com' },
    'الجامعة اللبنانية الدولية': { admin: 'admin@liuyemen.net', coordinator: 'coordinator@liuyemen.net' },
    'جامعة السعيد': { admin: 'admin@alsaeeduni.net', coordinator: 'coordinator@alsaeeduni.net' },
    'جامعة الرواد': { admin: 'admin@alrowaduni.edu.ye', coordinator: 'coordinator@alrowaduni.edu.ye' },
    'جامعة عدن الألمانية': { admin: 'admin@adengiu.com', coordinator: 'coordinator@adengiu.com' },
    'جامعة الرشيد الذكية': { admin: 'admin@ar-rasheed.edu.ye', coordinator: 'coordinator@ar-rasheed.edu.ye' },
    'جامعة الأندلس': { admin: 'admin@andalus-university.edu.ye', coordinator: 'coordinator@andalus-university.edu.ye' },
    'كلية المجتمع سيئون': { admin: 'admin@syncc.edu.ye', coordinator: 'coordinator@syncc.edu.ye' },
  };

  const allImportedUnis = await db.collection('universities').find({
    name: { $nin: ['MADAR Development University', 'MADAR Competitor University'] }
  }).toArray();
  for (const uni of allImportedUnis) {
    const uniNameAr = (uni.nameAr || uni.name || '').trim();
    if (uniNameAr && exactEmailsMap[uniNameAr]) {
      emails.push(exactEmailsMap[uniNameAr].admin);
      emails.push(exactEmailsMap[uniNameAr].coordinator);
    } else {
      let domain = `${uni.slug}.edu.ye`;
      if (uni.website) {
        try {
          const url = new URL(uni.website.startsWith('http') ? uni.website : `https://${uni.website}`);
          domain = url.hostname.replace('www.', '');
        } catch (e) {}
      }
      emails.push(`admin@${domain}`);
      emails.push(`coordinator@${domain}`);
    }
  }

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
  
  // Hard-delete any orphaned dummy test universities by name to prevent E11000 duplicate key errors
  const dummyUniNames = [
    'MADAR Development University',
    'MADAR Competitor University',
    'MADAR Pending Test University',
    'MADAR Suspended Test University'
  ];
  const orphanedUnis = await db.collection('universities').find({ name: { $in: dummyUniNames } }).toArray();
  if (orphanedUnis.length > 0) {
    const orphanedUniIds = orphanedUnis.map(u => u._id);
    await db.collection('courses').deleteMany({ universityId: { $in: orphanedUniIds } });
    await db.collection('studyplans').deleteMany({ universityId: { $in: orphanedUniIds } });
    await db.collection('departments').deleteMany({ universityId: { $in: orphanedUniIds } });
    await db.collection('colleges').deleteMany({ universityId: { $in: orphanedUniIds } });
    await db.collection('academicrecommendations').deleteMany({ universityId: { $in: orphanedUniIds } });
    await db.collection('collegecoordinators').deleteMany({ universityId: { $in: orphanedUniIds } });
    await db.collection('universities').deleteMany({ _id: { $in: orphanedUniIds } });
  }

  await db.collection('users').deleteMany({ _id: { $in: userIds }, email: { $in: emails } });
  await db.collection('roles').deleteMany({ name: { $in: ['admin_full_test', 'admin_readonly_test', 'admin_limited_test'] } });
  console.log('Development test accounts and their linked test records were removed.');
}

cleanup().catch((error) => { console.error(`Test cleanup failed: ${error.message}`); process.exitCode = 1; }).finally(() => mongoose.disconnect());
