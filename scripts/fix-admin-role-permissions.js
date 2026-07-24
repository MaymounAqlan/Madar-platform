#!/usr/bin/env node
/**
 * Idempotent migration: ensure system and test admin roles use the canonical
 * AdminPermission registry. Does not delete or weaken Super Admin.
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/madar';

const ALL_ADMIN_PERMISSIONS = [
  'users:read', 'users:write', 'users:status', 'users:sessions',
  'admin_accounts:read', 'admin_accounts:write',
  'roles:read', 'roles:write',
  'backup:create', 'backup:restore', 'backup:verify',
  'settings:read', 'settings:write',
  'ai:read', 'ai:write',
  'email:read', 'email:test', 'email:retry',
  'audit:read',
  'security_alerts:read', 'security_alerts:write',
  'universities:read', 'companies:read',
];

const READONLY_PERMISSIONS = [
  'users:read', 'roles:read', 'audit:read', 'ai:read', 'email:read',
  'backup:create', 'backup:verify', 'settings:read', 'security_alerts:read',
  'universities:read', 'companies:read',
];

const LIMITED_PERMISSIONS = ALL_ADMIN_PERMISSIONS.filter(
  (p) => p !== 'admin_accounts:write' && p !== 'roles:write',
);

async function main() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const roles = db.collection('roles');

    const updates = [
      {
        filter: { name: 'admin' },
        update: { $set: { permissions: ALL_ADMIN_PERMISSIONS, updatedAt: new Date() } },
      },
      {
        filter: { name: 'admin_full_test' },
        update: { $set: { permissions: ALL_ADMIN_PERMISSIONS, updatedAt: new Date() } },
      },
      {
        filter: { name: 'admin_readonly_test' },
        update: { $set: { permissions: READONLY_PERMISSIONS, updatedAt: new Date() } },
      },
      {
        filter: { name: 'admin_limited_test' },
        update: { $set: { permissions: LIMITED_PERMISSIONS, updatedAt: new Date() } },
      },
    ];

    for (const { filter, update } of updates) {
      const result = await roles.updateMany(filter, update);
      console.log(`Updated ${result.modifiedCount} role(s) matching`, filter);
    }

    // Safety: never add write permissions to super_admin; it already has ['*'].
    const superAdmin = await roles.findOne({ name: 'super_admin' });
    if (superAdmin && !superAdmin.permissions.includes('*')) {
      await roles.updateOne({ name: 'super_admin' }, { $set: { permissions: ['*'], updatedAt: new Date() } });
      console.log('Restored super_admin wildcard permissions');
    }

    console.log('Admin role permission migration complete.');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
