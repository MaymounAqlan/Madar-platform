import type { UniversityStaffPermission, UniversityStaffRole } from '@/types/university.types';

export const UNIVERSITY_STAFF_PERMISSIONS: readonly UniversityStaffPermission[] = [
  'dashboard:read',
  'structure:read',
  'students:read',
  'analytics:read',
  'departments:read',
  'departments:write',
  'study-plans:read',
  'study-plans:write',
  'courses:read',
  'courses:write',
  'course-skills:manage',
  'curriculum-analysis:run',
  'college-reports:read',
  'college:write',
  'affiliations:write',
  'reports:read',
  'audit:read',
];

export const COORDINATOR_PERMISSION_OPTIONS: Array<{
  value: UniversityStaffPermission;
  labelAr: string;
  labelEn: string;
}> = [
  { value: 'dashboard:read', labelAr: 'عرض لوحة التحكم', labelEn: 'View dashboard' },
  { value: 'structure:read', labelAr: 'عرض الهيكل الأكاديمي', labelEn: 'View academic structure' },
  { value: 'students:read', labelAr: 'عرض الطلاب', labelEn: 'View students' },
  { value: 'analytics:read', labelAr: 'عرض التحليلات', labelEn: 'View analytics' },
  { value: 'departments:read', labelAr: 'عرض الأقسام', labelEn: 'View departments' },
  { value: 'departments:write', labelAr: 'إدارة الأقسام', labelEn: 'Manage departments' },
  { value: 'study-plans:read', labelAr: 'عرض الخطط الدراسية', labelEn: 'View study plans' },
  { value: 'study-plans:write', labelAr: 'إدارة الخطط الدراسية', labelEn: 'Manage study plans' },
  { value: 'courses:read', labelAr: 'عرض المقررات', labelEn: 'View courses' },
  { value: 'courses:write', labelAr: 'إدارة المقررات', labelEn: 'Manage courses' },
  { value: 'course-skills:manage', labelAr: 'إدارة مهارات المقرر', labelEn: 'Manage course skills' },
  { value: 'curriculum-analysis:run', labelAr: 'تحليل ملاءمة المناهج', labelEn: 'Run curriculum analysis' },
  { value: 'college-reports:read', labelAr: 'عرض تقارير الكلية', labelEn: 'View college reports' },
  { value: 'college:write', labelAr: 'تعديل الكلية المخصصة', labelEn: 'Edit assigned college' },
  { value: 'affiliations:write', labelAr: 'إدارة انتماءات الطلاب', labelEn: 'Manage student affiliations' },
  { value: 'reports:read', labelAr: 'عرض التقارير', labelEn: 'View reports' },
  { value: 'audit:read', labelAr: 'عرض سجل التدقيق', labelEn: 'View audit log' },
];

export const DEFAULT_COORDINATOR_PERMISSIONS: UniversityStaffPermission[] = [
  'dashboard:read',
  'structure:read',
  'students:read',
  'analytics:read',
  'departments:read',
  'departments:write',
  'study-plans:read',
  'study-plans:write',
  'courses:read',
  'courses:write',
  'course-skills:manage',
  'curriculum-analysis:run',
  'college-reports:read',
];

export const DEFAULT_VIEWER_PERMISSIONS: UniversityStaffPermission[] = [
  'dashboard:read',
  'structure:read',
  'students:read',
  'analytics:read',
];

export const DEFAULT_DATA_OFFICER_PERMISSIONS: UniversityStaffPermission[] = [
  'dashboard:read',
  'structure:read',
  'students:read',
  'analytics:read',
  'reports:read',
  'audit:read',
  'affiliations:write',
];

export const DEFAULT_QUALITY_OFFICER_PERMISSIONS: UniversityStaffPermission[] = [
  'dashboard:read',
  'structure:read',
  'students:read',
  'analytics:read',
  'college-reports:read',
  'audit:read',
  'reports:read',
];

export const DEFAULT_ACADEMIC_DEVELOPMENT_OFFICER_PERMISSIONS: UniversityStaffPermission[] = [
  'dashboard:read',
  'structure:read',
  'students:read',
  'analytics:read',
  'curriculum-analysis:run',
  'study-plans:read',
  'study-plans:write',
  'courses:read',
  'courses:write',
  'course-skills:manage',
  'college-reports:read',
];

export const ROLE_PERMISSION_TEMPLATES: Record<UniversityStaffRole, UniversityStaffPermission[]> = {
  coordinator: DEFAULT_COORDINATOR_PERMISSIONS,
  university_viewer: DEFAULT_VIEWER_PERMISSIONS,
  data_officer: DEFAULT_DATA_OFFICER_PERMISSIONS,
  quality_officer: DEFAULT_QUALITY_OFFICER_PERMISSIONS,
  academic_development_officer: DEFAULT_ACADEMIC_DEVELOPMENT_OFFICER_PERMISSIONS,
};

export function getDefaultPermissionsForRole(role: UniversityStaffRole): UniversityStaffPermission[] {
  return ROLE_PERMISSION_TEMPLATES[role] || DEFAULT_VIEWER_PERMISSIONS;
}

export function normalizePermissions(permissions?: string[] | null): UniversityStaffPermission[] {
  if (!Array.isArray(permissions)) return [];
  const valid = permissions
    .filter((permission): permission is string => typeof permission === 'string' && permission.trim().length > 0)
    .map((permission) => permission.trim())
    .filter((permission): permission is UniversityStaffPermission =>
      UNIVERSITY_STAFF_PERMISSIONS.includes(permission as UniversityStaffPermission)
    );
  return [...new Set(valid)];
}

export function hasPermission(permissions: string[] | undefined | null, permission: UniversityStaffPermission): boolean {
  if (!permissions) return false;
  return permissions.includes('*') || permissions.includes(permission);
}
