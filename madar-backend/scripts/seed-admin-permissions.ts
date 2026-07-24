/**
 * Idempotent migration: seed canonical admin permissions and default admin role templates.
 * Safe to run multiple times.
 */

import * as mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Load env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

import {
  AdminPermission,
  ADMIN_PERMISSION_DEFINITIONS,
  ALL_ADMIN_PERMISSIONS,
} from '../src/users/permissions/permission.registry';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';

const ROLE_TEMPLATES = [
  {
    name: 'Admin - Full Access',
    nameAr: 'مدير نظام - وصول كامل',
    description: 'Full administrative access except Super Admin operations',
    descriptionAr: 'وصول إداري كامل باستثناء عمليات المدير الأعلى',
    permissions: ALL_ADMIN_PERMISSIONS,
  },
  {
    name: 'Admin - Read Only',
    nameAr: 'مدير نظام - قراءة فقط',
    description: 'View-only access to admin dashboards and logs',
    descriptionAr: 'وصول للقراءة فقط للوحات الإدارة والسجلات',
    permissions: [
      AdminPermission.USERS_READ,
      AdminPermission.ADMIN_ACCOUNTS_READ,
      AdminPermission.ROLES_READ,
      AdminPermission.SETTINGS_READ,
      AdminPermission.AI_READ,
      AdminPermission.EMAIL_READ,
      AdminPermission.AUDIT_READ,
      AdminPermission.SECURITY_ALERTS_READ,
      AdminPermission.UNIVERSITIES_READ,
      AdminPermission.COMPANIES_READ,
    ],
  },
  {
    name: 'Admin - User Manager',
    nameAr: 'مدير نظام - إدارة المستخدمين',
    description: 'Manage users, sessions, and verifications',
    descriptionAr: 'إدارة المستخدمين والجلسات والتحقق',
    permissions: [
      AdminPermission.USERS_READ,
      AdminPermission.USERS_WRITE,
      AdminPermission.USERS_STATUS,
      AdminPermission.USERS_SESSIONS,
      AdminPermission.AUDIT_READ,
    ],
  },
  {
    name: 'Admin - Operations',
    nameAr: 'مدير نظام - العمليات',
    description: 'Manage backups, email, settings, and AI operations',
    descriptionAr: 'إدارة النسخ الاحتياطي والبريد والإعدادات وعمليات الذكاء الاصطناعي',
    permissions: [
      AdminPermission.BACKUP_CREATE,
      AdminPermission.BACKUP_RESTORE,
      AdminPermission.BACKUP_VERIFY,
      AdminPermission.SETTINGS_READ,
      AdminPermission.SETTINGS_WRITE,
      AdminPermission.EMAIL_READ,
      AdminPermission.EMAIL_TEST,
      AdminPermission.EMAIL_RETRY,
      AdminPermission.AI_READ,
      AdminPermission.AI_WRITE,
      AdminPermission.AUDIT_READ,
    ],
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const permissionModel = mongoose.model(
    'Permission',
    new mongoose.Schema(
      {
        name: { type: String, required: true, unique: true },
        description: String,
        descriptionAr: String,
        module: String,
        actions: [String],
        metadata: Object,
      },
      { timestamps: true },
    ),
  );

  const roleModel = mongoose.model(
    'Role',
    new mongoose.Schema(
      {
        name: { type: String, required: true, unique: true },
        nameAr: String,
        description: String,
        permissions: [String],
        isSystem: { type: Boolean, default: false },
        metadata: Object,
      },
      { timestamps: true },
    ),
  );

  const userModel = mongoose.model(
    'User',
    new mongoose.Schema(
      {
        email: { type: String, required: true },
        userType: { type: String, required: true },
        roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
      },
      { timestamps: true },
    ),
  );

  // Snapshot existing roles for rollback
  const existingRoles = await roleModel.find({ name: { $in: ROLE_TEMPLATES.map((r) => r.name) } }).lean();
  const rollbackPath = path.join(__dirname, `../backups/admin-permissions-rollback-${Date.now()}.json`);
  fs.writeFileSync(
    rollbackPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        roles: existingRoles,
      },
      null,
      2,
    ),
  );
  console.log(`Rollback snapshot saved to ${rollbackPath}`);

  // Seed permissions
  for (const def of ADMIN_PERMISSION_DEFINITIONS) {
    await permissionModel.findOneAndUpdate(
      { name: def.name },
      {
        $set: {
          description: def.description,
          descriptionAr: def.descriptionAr,
          module: def.module,
          actions: [def.name.split(':')[1] || 'read'],
        },
      },
      { upsert: true, new: true },
    );
  }
  console.log(`Seeded ${ADMIN_PERMISSION_DEFINITIONS.length} permissions`);

  // Seed role templates
  for (const template of ROLE_TEMPLATES) {
    await roleModel.findOneAndUpdate(
      { name: template.name },
      {
        $set: {
          nameAr: template.nameAr,
          description: template.description,
          permissions: template.permissions,
          isSystem: true,
        },
      },
      { upsert: true, new: true },
    );
  }
  console.log(`Seeded ${ROLE_TEMPLATES.length} role templates`);

  // Assign Full Access to existing admin accounts without roleId
  const fullAccessRole = await roleModel.findOne({ name: 'Admin - Full Access' }).lean();
  if (fullAccessRole) {
    const result = await userModel.updateMany(
      { userType: 'admin', $or: [{ roleId: { $exists: false } }, { roleId: null }] },
      { $set: { roleId: fullAccessRole._id } },
    );
    console.log(`Assigned Admin - Full Access to ${result.modifiedCount} existing admin accounts`);
  }

  // Verify
  const adminCount = await userModel.countDocuments({ userType: 'admin' });
  const adminsWithRole = await userModel.countDocuments({ userType: 'admin', roleId: { $exists: true, $ne: null } });
  console.log(`Admin accounts: ${adminsWithRole}/${adminCount} have a role template`);

  await mongoose.disconnect();
  console.log('Migration complete');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
