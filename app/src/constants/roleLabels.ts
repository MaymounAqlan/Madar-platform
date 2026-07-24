export const ROLE_LABELS: Record<
  string,
  { ar: string; en: string }
> = {
  student: { ar: 'طالب', en: 'Student' },
  company: { ar: 'شركة', en: 'Company' },
  university: { ar: 'مسؤول الجامعة', en: 'University Manager' },
  coordinator: { ar: 'منسق كلية', en: 'College Coordinator' },
  university_viewer: { ar: 'قارئ الجامعة', en: 'University Viewer' },
  data_officer: { ar: 'مسؤول بيانات', en: 'Data Officer' },
  quality_officer: { ar: 'مسؤول جودة', en: 'Quality Officer' },
  academic_development_officer: { ar: 'مسؤول تطوير أكاديمي', en: 'Academic Development Officer' },
  admin: { ar: 'مدير النظام', en: 'System Admin' },
  super_admin: { ar: 'المدير الأعلى', en: 'Super Admin' },
};

export function getRoleLabel(role?: string | null, language: 'ar' | 'en' = 'ar'): string {
  if (!role) return language === 'ar' ? 'مستخدم' : 'User';
  return ROLE_LABELS[role]?.[language] || role;
}
