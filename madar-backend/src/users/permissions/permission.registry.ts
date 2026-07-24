/**
 * Canonical admin permission registry.
 * This is the single source of truth for admin/operational permissions.
 * Backend guards and frontend permission checks must use these keys.
 */

export const AdminPermission = {
  // Users
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_STATUS: 'users:status',
  USERS_SESSIONS: 'users:sessions',

  // Admin accounts
  ADMIN_ACCOUNTS_READ: 'admin_accounts:read',
  ADMIN_ACCOUNTS_WRITE: 'admin_accounts:write',

  // Roles (operational templates)
  ROLES_READ: 'roles:read',
  ROLES_WRITE: 'roles:write',

  // Backup
  BACKUP_CREATE: 'backup:create',
  BACKUP_RESTORE: 'backup:restore',
  BACKUP_VERIFY: 'backup:verify',

  // Platform settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  // AI
  AI_READ: 'ai:read',
  AI_WRITE: 'ai:write',

  // Email
  EMAIL_READ: 'email:read',
  EMAIL_WRITE: 'email:write',
  EMAIL_TEST: 'email:test',
  EMAIL_RETRY: 'email:retry',

  // Audit
  AUDIT_READ: 'audit:read',

  // Security alerts
  SECURITY_ALERTS_READ: 'security_alerts:read',
  SECURITY_ALERTS_WRITE: 'security_alerts:write',

  // Universities/companies (view only for Admin)
  UNIVERSITIES_READ: 'universities:read',
  COMPANIES_READ: 'companies:read',
} as const;

export type AdminPermissionValue = (typeof AdminPermission)[keyof typeof AdminPermission];

export const ALL_ADMIN_PERMISSIONS: AdminPermissionValue[] = Object.values(AdminPermission);

export const PERMISSION_CATEGORIES: Record<string, AdminPermissionValue[]> = {
  users: [
    AdminPermission.USERS_READ,
    AdminPermission.USERS_WRITE,
    AdminPermission.USERS_STATUS,
    AdminPermission.USERS_SESSIONS,
  ],
  admin_accounts: [
    AdminPermission.ADMIN_ACCOUNTS_READ,
    AdminPermission.ADMIN_ACCOUNTS_WRITE,
  ],
  roles: [AdminPermission.ROLES_READ, AdminPermission.ROLES_WRITE],
  backup: [
    AdminPermission.BACKUP_CREATE,
    AdminPermission.BACKUP_RESTORE,
    AdminPermission.BACKUP_VERIFY,
  ],
  settings: [AdminPermission.SETTINGS_READ, AdminPermission.SETTINGS_WRITE],
  ai: [AdminPermission.AI_READ, AdminPermission.AI_WRITE],
  email: [AdminPermission.EMAIL_READ, AdminPermission.EMAIL_WRITE, AdminPermission.EMAIL_TEST, AdminPermission.EMAIL_RETRY],
  audit: [AdminPermission.AUDIT_READ],
  security_alerts: [
    AdminPermission.SECURITY_ALERTS_READ,
    AdminPermission.SECURITY_ALERTS_WRITE,
  ],
  institutions: [
    AdminPermission.UNIVERSITIES_READ,
    AdminPermission.COMPANIES_READ,
  ],
};

export interface PermissionDefinition {
  name: AdminPermissionValue;
  description: string;
  descriptionAr: string;
  module: string;
}

export const ADMIN_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  { name: AdminPermission.USERS_READ, description: 'View users', descriptionAr: 'عرض المستخدمين', module: 'users' },
  { name: AdminPermission.USERS_WRITE, description: 'Modify users', descriptionAr: 'تعديل المستخدمين', module: 'users' },
  { name: AdminPermission.USERS_STATUS, description: 'Suspend/activate users', descriptionAr: 'تعليق/تفعيل المستخدمين', module: 'users' },
  { name: AdminPermission.USERS_SESSIONS, description: 'Invalidate user sessions', descriptionAr: 'إبطال جلسات المستخدمين', module: 'users' },
  { name: AdminPermission.ADMIN_ACCOUNTS_READ, description: 'View admin accounts', descriptionAr: 'عرض الحسابات الإدارية', module: 'admin_accounts' },
  { name: AdminPermission.ADMIN_ACCOUNTS_WRITE, description: 'Manage admin accounts', descriptionAr: 'إدارة الحسابات الإدارية', module: 'admin_accounts' },
  { name: AdminPermission.ROLES_READ, description: 'View role templates', descriptionAr: 'عرض قوالب الأدوار', module: 'roles' },
  { name: AdminPermission.ROLES_WRITE, description: 'Manage role templates', descriptionAr: 'إدارة قوالب الأدوار', module: 'roles' },
  { name: AdminPermission.BACKUP_CREATE, description: 'Create backups', descriptionAr: 'إنشاء نسخ احتياطية', module: 'backup' },
  { name: AdminPermission.BACKUP_RESTORE, description: 'Restore backups', descriptionAr: 'استعادة النسخ الاحتياطية', module: 'backup' },
  { name: AdminPermission.BACKUP_VERIFY, description: 'Verify backups', descriptionAr: 'التحقق من النسخ الاحتياطية', module: 'backup' },
  { name: AdminPermission.SETTINGS_READ, description: 'View platform settings', descriptionAr: 'عرض إعدادات المنصة', module: 'settings' },
  { name: AdminPermission.SETTINGS_WRITE, description: 'Update platform settings', descriptionAr: 'تحديث إعدادات المنصة', module: 'settings' },
  { name: AdminPermission.AI_READ, description: 'View AI operations', descriptionAr: 'عرض عمليات الذكاء الاصطناعي', module: 'ai' },
  { name: AdminPermission.AI_WRITE, description: 'Retry/manage AI operations', descriptionAr: 'إعادة/إدارة عمليات الذكاء الاصطناعي', module: 'ai' },
  { name: AdminPermission.EMAIL_READ, description: 'View email monitoring', descriptionAr: 'عرض مراقبة البريد', module: 'email' },
  { name: AdminPermission.EMAIL_WRITE, description: 'Manage email templates', descriptionAr: 'إدارة قوالب البريد', module: 'email' },
  { name: AdminPermission.EMAIL_TEST, description: 'Send test emails', descriptionAr: 'إرسال رسائل اختبار', module: 'email' },
  { name: AdminPermission.EMAIL_RETRY, description: 'Retry failed emails', descriptionAr: 'إعادة محاولة الرسائل الفاشلة', module: 'email' },
  { name: AdminPermission.AUDIT_READ, description: 'View audit logs', descriptionAr: 'عرض سجلات التدقيق', module: 'audit' },
  { name: AdminPermission.SECURITY_ALERTS_READ, description: 'View security alerts', descriptionAr: 'عرض التنبيهات الأمنية', module: 'security_alerts' },
  { name: AdminPermission.SECURITY_ALERTS_WRITE, description: 'Manage security alerts', descriptionAr: 'إدارة التنبيهات الأمنية', module: 'security_alerts' },
  { name: AdminPermission.UNIVERSITIES_READ, description: 'View universities', descriptionAr: 'عرض الجامعات', module: 'institutions' },
  { name: AdminPermission.COMPANIES_READ, description: 'View companies', descriptionAr: 'عرض الشركات', module: 'institutions' },
];

export function isValidAdminPermission(permission: string): permission is AdminPermissionValue {
  return ALL_ADMIN_PERMISSIONS.includes(permission as AdminPermissionValue) || /^[a-z0-9_]+:[a-z0-9_]+$/.test(permission);
}

export function validatePermissions(permissions: string[]): { valid: AdminPermissionValue[]; invalid: string[] } {
  const valid: AdminPermissionValue[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  for (const p of permissions) {
    const trimmed = typeof p === 'string' ? p.trim() : '';
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    if (isValidAdminPermission(trimmed)) {
      valid.push(trimmed);
    } else {
      invalid.push(trimmed);
    }
  }
  return { valid, invalid };
}
