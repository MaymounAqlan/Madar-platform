const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Disabled in production');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/madar');
  const db = mongoose.connection.db;

  const users = await db.collection('users').find({}).toArray();

  // Duplicate emails
  const emailCounts = {};
  for (const u of users) {
    const email = String(u.email || '').toLowerCase();
    emailCounts[email] = (emailCounts[email] || 0) + 1;
  }

  const output = [];
  for (const u of users) {
    const email = String(u.email || '');
    const lowerEmail = email.toLowerCase();
    const hasBom = email.charCodeAt(0) === 0xFEFF;
    const hasWhitespace = email !== email.trim();
    const hasUppercase = /[A-Z]/.test(email);
    const hash = u.password || '';
    const hashFormatValid = typeof hash === 'string' && hash.startsWith('$2') && hash.length >= 50;
    const provider = u.provider || (u.googleId ? 'google' : u.linkedinId ? 'linkedin' : 'local');

    // Determine linked institutional IDs safely
    let universityId = null;
    let collegeId = null;
    let companyId = null;
    if (u.userType === 'student') {
      const student = await db.collection('students').findOne({ userId: u._id });
      if (student?.academicInfo) {
        universityId = String(student.academicInfo.universityId || '');
        collegeId = String(student.academicInfo.collegeId || '');
      }
    } else if (u.userType === 'company') {
      const company = await db.collection('companies').findOne({ userId: u._id });
      if (company) companyId = String(company._id || '');
    } else if (u.userType === 'university') {
      const university = await db.collection('universities').findOne({ userId: u._id });
      if (university) universityId = String(university._id || '');
    } else if (['coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer'].includes(u.userType)) {
      const staff = await db.collection('collegecoordinators').findOne({ userId: u._id });
      if (staff) {
        universityId = String(staff.universityId || '');
        collegeId = String(staff.collegeId || '');
      }
    }

    output.push({
      _id: String(u._id),
      email: lowerEmail,
      originalEmailHasBom: hasBom,
      originalEmailHasWhitespace: hasWhitespace,
      originalEmailHasUppercase: hasUppercase,
      role: u.userType || u.role || 'unknown',
      status: u.status || 'unknown',
      provider,
      googleId: u.googleId ? 'yes' : 'no',
      linkedinId: u.linkedinId ? 'yes' : 'no',
      hasPassword: !!u.password && u.password.length > 0,
      passwordHashFormatValid: hashFormatValid,
      passwordHashPrefix: hash ? hash.slice(0, 7) : 'none',
      emailVerified: u.isEmailVerified || u.emailVerified || false,
      universityId,
      collegeId,
      companyId,
      roleId: u.roleId ? String(u.roleId) : null,
      duplicateEmailCount: emailCounts[lowerEmail] || 0,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt || null,
    });
  }

  console.log(JSON.stringify(output, null, 2));
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
