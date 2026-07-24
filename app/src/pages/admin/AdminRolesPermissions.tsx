import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useAdminRoles, useAdminPermissions,
  useCreateRole, useUpdateRole, useDeleteRole,
  useCreatePermission, useUpdatePermission, useDeletePermission,
} from '@/hooks/useAdmin';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import {
  Shield, Plus, Save, X, ChevronDown, ChevronLeft, Pencil, Trash2, AlertTriangle, CheckSquare, Square, ShieldAlert,
  Key, Settings, Cpu, Mail, HardDrive, Eye, Briefcase, FileText, BarChart3, GraduationCap, Award, ShieldCheck, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ───────── Fine-grained System Modules and Contextual Actions ───────── */
const MODULES_REGISTRY: Record<string, {
  ar: string;
  descAr: string;
  icon: React.ReactNode;
  allowedActions: { value: string; labelAr: string }[];
}> = {
  'system': {
    ar: 'إدارة وتوجيه النظام (system)',
    descAr: 'التحكم العام بالخوادم، والعمليات الأساسية، والمهام التشغيلية الحساسة',
    icon: <Settings size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'manage', labelAr: 'إدارة وصيانة النظام (manage)' }
    ]
  },
  'profile': {
    ar: 'الملف الشخصي والحساب (profile)',
    descAr: 'إدارة الحسابات الشخصية ومعدلات الأمان وتحديث كلمات المرور للمسؤولين',
    icon: <Key size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'قراءة الملف الشخصي (read)' },
      { value: 'write', labelAr: 'تحديث بيانات الملف (write)' }
    ]
  },
  'users': {
    ar: 'إدارة المستخدمين (users)',
    descAr: 'التحكم بحسابات الطلاب، الشركات، المنسقين والمسؤولين وتغيير حالتهم',
    icon: <Shield size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'قراءة واستعلام (read)' },
      { value: 'write', labelAr: 'إضافة وتعديل بيانات (write)' },
      { value: 'status', labelAr: 'تحديث حالة الحساب (status)' },
      { value: 'sessions', labelAr: 'إبطال وإنهاء الجلسات (sessions)' }
    ]
  },
  'admin_accounts': {
    ar: 'الحسابات الإدارية (admin_accounts)',
    descAr: 'تعيين المشرفين وتخصيص الصلاحيات الفردية وحذف الحسابات الإدارية',
    icon: <ShieldCheck size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض الحسابات الإدارية (read)' },
      { value: 'write', labelAr: 'إدارة وتحديث المشرفين (write)' }
    ]
  },
  'roles': {
    ar: 'قوالب الرتب والأدوار (roles)',
    descAr: 'تعديل الصلاحيات الممنوحة للمشرفين وصياغة أدوار جديدة',
    icon: <ShieldCheck size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض الأدوار (read)' },
      { value: 'write', labelAr: 'تحديث وتعديل الأدوار (write)' }
    ]
  },
  'jobs': {
    ar: 'فرص العمل والتدريب (jobs)',
    descAr: 'مراجعة وتعديل وحذف الفرص الوظيفية المنشورة بواسطة الشركات',
    icon: <Briefcase size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض الوظائف (read)' },
      { value: 'write', labelAr: 'تعديل وحذف الوظائف (write)' }
    ]
  },
  'applications': {
    ar: 'طلبات التوظيف والترشيحات (applications)',
    descAr: 'تتبع ومراقبة طلبات التوظيف ومتابعة حركة تقدم الطلاب للفرص',
    icon: <FileText size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض الطلبات والترشيحات (read)' },
      { value: 'write', labelAr: 'إدارة وتحديث الطلبات (write)' }
    ]
  },
  'candidates': {
    ar: 'المرشحون للوظائف (candidates)',
    descAr: 'الاطلاع على قائمة المرشحين الأنسب للفرص وحساب نسب التوافق',
    icon: <Award size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض قائمة المرشحين (read)' },
      { value: 'write', labelAr: 'إدارة وتعيين المرشحين (write)' }
    ]
  },
  'students': {
    ar: 'ملفات الطلاب وسيرهم الذاتية (students)',
    descAr: 'الاطلاع على السير الذاتية ومؤشرات التوافق المهني للطلاب',
    icon: <GraduationCap size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض ملفات الطلاب (read)' },
      { value: 'write', labelAr: 'تعديل أو تحديث البيانات (write)' }
    ]
  },
  'universities': {
    ar: 'الجامعات والكليات (universities)',
    descAr: 'اعتماد وقبول الكليات الأكاديمية والمنسقين والخطط الدراسية',
    icon: <GraduationCap size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض سجلات الجامعات (read)' },
      { value: 'write', labelAr: 'إدارة وتفعيل الشركاء (write)' }
    ]
  },
  'companies': {
    ar: 'الشركات وجهات التوظيف (companies)',
    descAr: 'التحقق من حسابات جهات التوظيف وقبول طلبات التسجيل',
    icon: <Briefcase size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض سجلات الشركات (read)' },
      { value: 'write', labelAr: 'الموافقة والترخيص (write)' }
    ]
  },
  'structure': {
    ar: 'هيكلية المنصة (structure)',
    descAr: 'تعديل بنية وتصنيف المنصة الإدارية والتخصصات التابعة لها',
    icon: <Settings size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض بنية المنصة (read)' },
      { value: 'write', labelAr: 'تعديل الهيكل والتخصصات (write)' }
    ]
  },
  'reports': {
    ar: 'التقارير الإدارية (reports)',
    descAr: 'تصدير البيانات بصيغة ملفات واستصدار تقارير مخصصة للمؤسسات',
    icon: <BarChart3 size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض واستخراج التقارير (read)' },
      { value: 'write', labelAr: 'تصدير وتعديل التقارير (write)' }
    ]
  },
  'ai': {
    ar: 'خوارزمية الذكاء الاصطناعي (ai)',
    descAr: 'مراقبة وتعديل أوزان معايير المطابقة وسيرفرات الذكاء الاصطناعي',
    icon: <Cpu size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض لوحة الذكاء الاصطناعي (read)' },
      { value: 'write', labelAr: 'تعديل أوزان المطابقة والتشغيل (write)' }
    ]
  },
  'backup': {
    ar: 'الأمان والنسخ الاحتياطي (backup)',
    descAr: 'أخذ نسخ احتياطية واسترجاعها وفحص سلامة خادم البيانات',
    icon: <HardDrive size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'create', labelAr: 'إنشاء نسخة احتياطية (create)' },
      { value: 'restore', labelAr: 'استرجاع نسخة سابقة (restore)' },
      { value: 'verify', labelAr: 'التحقق من سلامة النسخ (verify)' }
    ]
  },
  'email': {
    ar: 'إشعارات البريد الإلكتروني (email)',
    descAr: 'مراقبة سجلات البريد الصادرة وإجراء اختبارات SMTP الفنية',
    icon: <Mail size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'مشاهدة سجلات البريد (read)' },
      { value: 'test', labelAr: 'إرسال بريد تجريبي (test)' },
      { value: 'retry', labelAr: 'إعادة إرسال الرسائل الفاشلة (retry)' }
    ]
  },
  'audit': {
    ar: 'سجل العمليات والتدقيق (audit)',
    descAr: 'مراجعة وتتبع كافة الإجراءات المتخذة من قبل مسؤولي المنصة',
    icon: <Eye size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض سجل التدقيق الأمني (read)' }
    ]
  },
  'security_alerts': {
    ar: 'التنبيهات الأمنية والوقاية (security_alerts)',
    descAr: 'رصد الهجمات الإلكترونية ومحاولات تسجيل الدخول المشبوهة',
    icon: <ShieldAlert size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض التنبيهات الأمنية (read)' },
      { value: 'write', labelAr: 'اتخاذ إجراءات الحظر والوقاية (write)' }
    ]
  },
  'analytics': {
    ar: 'التقارير والإحصائيات (analytics)',
    descAr: 'إصدار تقارير الاستخدام، ومؤشرات التوظيف والتوافق العام',
    icon: <BarChart3 size={20} className="text-emerald-600" />,
    allowedActions: [
      { value: 'read', labelAr: 'عرض وتصدير التحليلات (read)' }
    ]
  }
};

const permissionMap: Record<string, { ar: string; descAr: string; categoryAr: string }> = {
  // System module
  'system:manage':          { ar: 'إدارة وصيانة النظام العامة',   descAr: 'صلاحية كاملة لإدارة سيرفرات المنصة وتحديث إعداداتها البرمجية', categoryAr: 'إدارة وتوجيه النظام (system)' },
  
  // Profile module
  'profile:read':           { ar: 'عرض بيانات الملف الشخصي',     descAr: 'الاطلاع على معلومات الحساب الشخصي وكلمة المرور المشفرة',       categoryAr: 'الملف الشخصي والحساب (profile)' },
  'profile:write':          { ar: 'تعديل الملف الشخصي',           descAr: 'تحديث الاسم، البريد الشخصي، ومعايير التحقق الثنائي للمستخدم',  categoryAr: 'الملف الشخصي والحساب (profile)' },

  // Users module
  'users:read':             { ar: 'عرض قوائم المستخدمين',         descAr: 'الاطلاع على مستخدمي النظام وحالة حساباتهم',                    categoryAr: 'إدارة المستخدمين (users)' },
  'users:write':            { ar: 'تحديث بيانات المستخدمين',        descAr: 'تعديل أو تعديل صلاحيات حسابات المستخدمين والطلاب',               categoryAr: 'إدارة المستخدمين (users)' },
  'users:status':           { ar: 'تجميد وتفعيل الحسابات',         descAr: 'تعطيل الحسابات المخالفة وتنشيط الحسابات الجديدة',              categoryAr: 'إدارة المستخدمين (users)' },
  'users:sessions':         { ar: 'إنهاء الجلسات النشطة',          descAr: 'تسجيل خروج إجباري للحساب لغايات أمنية',                      categoryAr: 'إدارة المستخدمين (users)' },
  
  // Admin accounts module
  'admin_accounts:read':    { ar: 'عرض الحسابات الإدارية',         descAr: 'مشاهدة حسابات المشرفين الآخرين المسجلين في لوحة التحكم',        categoryAr: 'الحسابات الإدارية (admin_accounts)' },
  'admin_accounts:write':   { ar: 'إدارة المشرفين والمدراء',       descAr: 'إضافة مسؤولين جدد أو تعديل صلاحيات حسابات المسؤولين',          categoryAr: 'الحسابات الإدارية (admin_accounts)' },

  // Roles module
  'roles:read':             { ar: 'عرض أدوار ومجموعات العمل',       descAr: 'الاطلاع على قوالب ومجموعات الرتب والصلاحيات',                 categoryAr: 'قوالب الرتب والأدوار (roles)' },
  'roles:write':            { ar: 'إدارة وتعديل الصلاحيات',         descAr: 'تعديل الصلاحيات الممنوحة للأدوار الإدارية وإنشاء أدوار جديدة',   categoryAr: 'قوالب الرتب والأدوار (roles)' },
  
  // Jobs module
  'jobs:read':              { ar: 'عرض قائمة الوظائف',            descAr: 'الاطلاع على قائمة الفرص الوظيفية المنشورة وتفاصيلها',             categoryAr: 'فرص العمل والتدريب (jobs)' },
  'jobs:write':             { ar: 'مراجعة وتعديل الوظائف',          descAr: 'تعديل الإعلانات الوظيفية المنشورة أو حذفها عند المخالفة',          categoryAr: 'فرص العمل والتدريب (jobs)' },

  // Applications module
  'applications:read':      { ar: 'عرض الترشيحات والتقديمات',      descAr: 'الاطلاع على طلبات التقديم وحالة الترشيح على الفرص الوظيفية',  categoryAr: 'طلبات التوظيف والترشيحات (applications)' },
  'applications:write':     { ar: 'إدارة طلبات التقديم',           descAr: 'تحديث حالة قبول الطلبات والمرفقات المقدمة للوظائف',             categoryAr: 'طلبات التوظيف والترشيحات (applications)' },

  // Candidates module
  'candidates:read':        { ar: 'عرض قوائم المرشحين المقترحين',   descAr: 'مشاهدة الطلاب المقترحين للوظائف بناءً على المطابقة التلقائية',   categoryAr: 'المرشحون للوظائف (candidates)' },
  'candidates:write':       { ar: 'تعديل وتوجيه الترشيحات للشركات', descAr: 'إرسال ملفات المرشحين يدوياً إلى مدراء الشركات وجهات التوظيف',    categoryAr: 'المرشحون للوظائف (candidates)' },

  // Students module
  'students:read':          { ar: 'مشاهدة السير الذاتية للطلاب',     descAr: 'تصفح السير الذاتية والملفات الشخصية للطلاب والخريجين',        categoryAr: 'ملفات الطلاب وسيرهم الذاتية (students)' },
  'students:write':         { ar: 'تحديث ملفات الطلاب الفنية',      descAr: 'تعديل البيانات الأساسية أو الشهادات الأكاديمية والمهارات للطلاب', categoryAr: 'ملفات الطلاب وسيرهم الذاتية (students)' },

  // Universities module
  'universities:read':      { ar: 'عرض سجلات الجامعات',           descAr: 'مشاهدة قائمة الجامعات المسجلة والكليات التابعة لها',             categoryAr: 'الجامعات والكليات (universities)' },
  'universities:write':     { ar: 'إعتماد الجامعات ومنسقيها',       descAr: 'قبول وتفعيل حسابات المنسقين الأكاديميين والخطط الدراسية',       categoryAr: 'الجامعات والكليات (universities)' },

  // Companies module
  'companies:read':         { ar: 'عرض بيانات الشركات شريكة',      descAr: 'تصفح قائمة الشركات وجهات التوظيف والتحقق من هويتها',             categoryAr: 'الشركات وجهات التوظيف (companies)' },
  'companies:write':        { ar: 'تفعيل واعتماد حسابات الشركات',     descAr: 'الموافقة على تسجيل جهات التوظيف لمنحها ميزة نشر الوظائف',        categoryAr: 'الشركات وجهات التوظيف (companies)' },

  // Structure module
  'structure:read':         { ar: 'عرض الهيكل والتقسيم الفني',     descAr: 'مشاهدة هيكل التخصصات المهنية والأكاديمية المعتمدة بالمنصة',     categoryAr: 'هيكلية المنصة (structure)' },
  'structure:write':        { ar: 'تعديل هيكلية التخصصات والتصنيف', descAr: 'إضافة بنى أكاديمية جديدة ومزامنتها مع تصنيف المهارات للمطابقة', categoryAr: 'هيكلية المنصة (structure)' },

  // Reports module
  'reports:read':           { ar: 'عرض لوحة التقارير والبيانات',    descAr: 'تصفح التقارير المجمعة لأنشطة التوظيف والشركات بالمنصة',        categoryAr: 'التقارير الإدارية (reports)' },
  'reports:write':          { ar: 'تصدير التقارير وجداول الإحصاء',   descAr: 'تحميل ملفات Excel/PDF للتقارير والاتفاقيات والجهات الشريكة',   categoryAr: 'التقارير الإدارية (reports)' },

  // AI module
  'ai:read':                { ar: 'عرض عمليات مطابقة الذكاء',       descAr: 'الاطلاع على نسب ومؤشرات التوافق والمهارات المكتشفة',           categoryAr: 'خوارزمية الذكاء الاصطناعي (ai)' },
  'ai:write':               { ar: 'تعديل أوزان المطابقة الآلية',     descAr: 'تخصيص معايير ونسبة التوافق وإعادة تشغيل محرك المطابقة',       categoryAr: 'خوارزمية الذكاء الاصطناعي (ai)' },

  // Backup module
  'backup:create':          { ar: 'أخذ نسخة احتياطية كاملة',       descAr: 'أرشفة وحفظ نسخة كاملة من النظام والملفات وقواعد البيانات',       categoryAr: 'الأمان والنسخ الاحتياطي (backup)' },
  'backup:restore':         { ar: 'استعادة النظام وقواعد البيانات',  descAr: 'استرجاع حالة النظام السابقة بشكل آمن عند حدوث أعطال',            categoryAr: 'الأمان والنسخ الاحتياطي (backup)' },
  'backup:verify':          { ar: 'فحص سلامة ملفات النسخ',          descAr: 'التحقق من خلو النسخ الاحتياطية من أي مشاكل برمجية أو تلف',        categoryAr: 'الأمان والنسخ الاحتياطي (backup)' },

  // Email module
  'email:read':             { ar: 'مراقبة رسائل النظام والبريد',     descAr: 'متابعة حركة الرسائل المرسلة للطلاب والشركات والتأكد من وصولها',   categoryAr: 'إشعارات البريد الإلكتروني (email)' },
  'email:test':             { ar: 'إرسال رسائل بريدية اختبارية',     descAr: 'فحص تكامل خادم البريد SMTP للتأكد من قدرة النظام على الإرسال',   categoryAr: 'إشعارات البريد الإلكتروني (email)' },
  'email:retry':            { ar: 'إعادة توجيه رسائل البريد الفاشلة',descAr: 'تحديد البريد الذي واجه مشكلة تقنية وإعادة محاولة إرساله تلقائياً', categoryAr: 'إشعارات البريد الإلكتروني (email)' },

  // Audit module
  'audit:read':             { ar: 'عرض سجلات التدقيق والعمليات',    descAr: 'سجل متكامل للعمليات الإدارية التي تتم عبر لوحة التحكم',         categoryAr: 'سجل العمليات والتدقيق (audit)' },

  // Security Alerts module
  'security_alerts:read':   { ar: 'عرض التنبيهات الأمنية الفعالة',   descAr: 'الاطلاع على محاولات الاختراق أو الوصول غير المشروع للنظام',     categoryAr: 'التنبيهات الأمنية والوقاية (security_alerts)' },
  'security_alerts:write':  { ar: 'إدارة وإغلاق الثغرات الأمنية',    descAr: 'اتخاذ قرار حظر العناوين المشبوهة وإلغاء صلاحيات حسابات معينة', categoryAr: 'التنبيهات الأمنية والوقاية (security_alerts)' },

  // Analytics module
  'analytics:read':         { ar: 'عرض تقارير الأداء العام',        descAr: 'الاطلاع على إحصائيات التوظيف والتوافق ونشاط المنصة الإجمالي',    categoryAr: 'التقارير والإحصائيات (analytics)' },
};

const defaultPermissions = Object.keys(permissionMap);

const COLORS = {
  primary: '#9fe870',      // MADAR Signature Accent Green
  primaryHover: '#8bd95c', // Slightly darker green on hover
  dark: '#272925',         // Soft Charcoal/Dark (MADAR Dark Accent)
  darker: '#1d1e1c',       // Deeper Charcoal for headers/accents
  muted: '#5e615c',        // Muted Gray-Green for labels
  lightMuted: '#848782',   // Light hint text
  border: '#e1e3df',       // Cohesive border color
  bgLight: '#f4f5f2',      // Clean Light Gray-Green page backdrop
  cardBg: '#ffffff',       // Pure white card background
  successBg: '#f0fdf4',    // Soft emerald bg
  successBorder: '#bbf7d0',// Soft emerald border
  successText: '#166534',  // Soft emerald text
  dangerBg: '#fef2f2',     // Red light bg
  dangerText: '#ef4444',   // Red text
};

/* ───────── Accordion Section ───────── */
function AccordionSection({ title, count, children, isSystemRole = false, icon, defaultOpen = false }: { title: string; count?: number; children: React.ReactNode; isSystemRole?: boolean; icon?: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const { isRTL } = useLanguage();

  return (
    <div className={cn("border rounded-3xl overflow-hidden transition-all duration-300 mb-3", isSystemRole ? "border-emerald-200/80 shadow-2xs" : "border-[#e1e3df]", open ? "shadow-md" : "shadow-3xs")} style={{ background: '#fff' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-5 py-4 text-right transition-colors cursor-pointer",
          isSystemRole ? "bg-emerald-50/10 hover:bg-emerald-50/30" : "hover:bg-slate-50/50"
        )}
      >
        <div className="flex items-center gap-3">
          {isRTL
            ? (open ? <ChevronDown size={19} className="text-[#5e615c]" /> : <ChevronLeft size={19} className="text-[#5e615c]" />)
            : (open ? <ChevronDown size={19} className="text-[#5e615c]" /> : <ChevronLeft size={19} className="text-[#5e615c] rotate-180" />)
          }
          <div className="flex items-center gap-2.5">
            {icon}
            <span className="text-xs font-black text-[#1d1e1c] tracking-tight">{title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSystemRole && (
            <span className="rounded-full px-2.5 py-0.5 text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              افتراضي للنظام
            </span>
          )}
          {count !== undefined && (
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-black bg-[#9fe870]/20 text-[#272925] border border-[#9fe870]/30">{count}</span>
          )}
        </div>
      </button>
      {open && (
        <div className="border-t px-5 pb-5 pt-4 bg-[#f4f5f2]/30" style={{ borderColor: COLORS.border }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ───────── Confirm Delete Modal ───────── */
function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 border border-[#e1e3df]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: COLORS.dangerBg }}>
            <AlertTriangle size={20} style={{ color: COLORS.dangerText }} />
          </div>
          <h3 className="text-xs font-black text-[#1d1e1c]">{t('تأكيد الحذف', 'Confirm Delete')}</h3>
        </div>
        <p className="text-[11px] mb-5 leading-relaxed text-[#5e615c] font-bold">{message}</p>
        <div className="flex items-center gap-2 justify-end">
          <button onClick={onCancel} className="rounded-full border px-4 py-2 text-xs font-bold text-[#5e615c] hover:bg-[#f4f5f2] cursor-pointer transition-colors" style={{ borderColor: COLORS.border }}>
            {t('إلغاء', 'Cancel')}
          </button>
          <button onClick={onConfirm} className="rounded-full px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 cursor-pointer" style={{ background: COLORS.dangerText }}>
            {t('حذف نهائياً', 'Delete')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminRolesPermissions() {
  const { t, isRTL } = useLanguage();
  const { data: roles, isLoading: rolesLoading } = useAdminRoles();
  const { data: permissions, isLoading: permsLoading } = useAdminPermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const createPermission = useCreatePermission();
  const updatePermission = useUpdatePermission();
  const deletePermission = useDeletePermission();

  // Navigation tab state: 'roles' | 'permissions'
  const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');

  // Modal forms trigger states
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleForm, setRoleForm] = useState({ name: '', nameAr: '', description: '', permissions: [] as string[] });
  
  const [showPermForm, setShowPermForm] = useState(false);
  const [editingPerm, setEditingPerm] = useState<any>(null);
  const [permForm, setPermForm] = useState({ name: '', description: '', module: Object.keys(MODULES_REGISTRY)[0], actions: '' });
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'role' | 'perm'; id: string; label: string } | null>(null);

  // Dynamic actions selection matching the selected module
  const allowedActionsForSelectedModule = useMemo(() => {
    return MODULES_REGISTRY[permForm.module]?.allowedActions || [];
  }, [permForm.module]);

  // Set default action when module changes
  const handleModuleChange = (newModule: string) => {
    const actions = MODULES_REGISTRY[newModule]?.allowedActions || [];
    const defaultAction = actions[0]?.value || '';
    setPermForm(prev => ({ ...prev, module: newModule, actions: defaultAction }));
  };

  const allPermKeys = Array.isArray(permissions) && permissions.length > 0
    ? permissions.map((p: any) => p.name)
    : defaultPermissions;

  const getPermInfo = (key: string) => {
    if (permissionMap[key]) return permissionMap[key];

    const match = Array.isArray(permissions) ? permissions.find((p: any) => p.name === key) : null;
    if (match) {
      const modInfo = MODULES_REGISTRY[match.module];
      const moduleName = modInfo?.ar || match.module;
      const actionName = modInfo?.allowedActions?.find(a => a.value === match.actions?.[0])?.labelAr || match.actions?.[0] || '';
      return {
        ar: match.description || `${moduleName} (${actionName})`,
        descAr: match.description || '',
        categoryAr: moduleName || t('أخرى', 'Other'),
      };
    }
    return { ar: key, descAr: '', categoryAr: t('أخرى', 'Other') };
  };

  const MODULES_LIST = Object.entries(MODULES_REGISTRY).map(([key, val]) => ({
    value: key,
    labelAr: val.ar,
    labelEn: key.toUpperCase(),
  }));

  const groupedPerms = allPermKeys.reduce((acc: Record<string, any[]>, key: string) => {
    const info = getPermInfo(key);
    if (!acc[info.categoryAr]) acc[info.categoryAr] = [];
    acc[info.categoryAr].push({ key, ...info });
    return acc;
  }, {});

  /* ── Role CRUD handlers ── */
  const openRoleCreate = () => {
    setEditingRole(null);
    setRoleForm({ name: '', nameAr: '', description: '', permissions: [] });
    setShowRoleForm(true);
  };

  const openRoleEdit = (role: any) => {
    setEditingRole(role);
    let initialPermissions = Array.isArray(role.permissions) ? [...role.permissions] : [];
    
    // If it is the system admin role, automatically check all permissions by default
    if (role.isSystem && (role.name === 'admin' || role.name === 'super_admin' || role.name === 'admin.full')) {
      initialPermissions = [...allPermKeys];
    }

    setRoleForm({
      name: role.name || '',
      nameAr: role.nameAr || '',
      description: role.description || '',
      permissions: initialPermissions,
    });
    setShowRoleForm(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.name || !roleForm.nameAr) return;
    if (editingRole) {
      await updateRole.mutateAsync({ roleId: editingRole._id || editingRole.id, data: roleForm });
    } else {
      await createRole.mutateAsync(roleForm);
    }
    setShowRoleForm(false);
    setEditingRole(null);
  };

  const handleDeleteRole = async () => {
    if (!confirmDelete || confirmDelete.type !== 'role') return;
    await deleteRole.mutateAsync(confirmDelete.id);
    setConfirmDelete(null);
  };

  const togglePerm = (p: string) => {
    setRoleForm(prev => prev.permissions.includes(p)
      ? { ...prev, permissions: prev.permissions.filter(x => x !== p) }
      : { ...prev, permissions: [...prev.permissions, p] }
    );
  };

  const selectAllPermissions = () => {
    setRoleForm(prev => ({ ...prev, permissions: [...allPermKeys] }));
  };

  const deselectAllPermissions = () => {
    setRoleForm(prev => ({ ...prev, permissions: [] }));
  };

  /* ── Permission CRUD handlers ── */
  const openPermCreate = () => {
    setEditingPerm(null);
    const firstModule = Object.keys(MODULES_REGISTRY)[0];
    const defaultAction = MODULES_REGISTRY[firstModule]?.allowedActions[0]?.value || '';
    setPermForm({ name: '', description: '', module: firstModule, actions: defaultAction });
    setShowPermForm(true);
  };

  const openPermEdit = (perm: any) => {
    setEditingPerm(perm);
    setPermForm({
      name: perm.name || '',
      description: perm.description || '',
      module: perm.module || Object.keys(MODULES_REGISTRY)[0],
      actions: Array.isArray(perm.actions) ? perm.actions[0] : (perm.actions || ''),
    });
    setShowPermForm(true);
  };

  const handleSavePerm = async () => {
    if (!permForm.module || !permForm.actions) return;
    const technicalName = `${permForm.module}:${permForm.actions}`;
    
    const moduleLabel = MODULES_REGISTRY[permForm.module]?.ar || permForm.module;
    const actionLabel = MODULES_REGISTRY[permForm.module]?.allowedActions?.find(a => a.value === permForm.actions)?.labelAr || permForm.actions;
    const fallbackDesc = `إجراء ${actionLabel} لمدير ${moduleLabel}`;

    const payload = {
      name: technicalName,
      description: permForm.description.trim() || fallbackDesc,
      module: permForm.module,
      actions: [permForm.actions],
    };
    if (editingPerm) {
      await updatePermission.mutateAsync({ permId: editingPerm._id || editingPerm.id, data: payload });
    } else {
      await createPermission.mutateAsync(payload);
    }
    setShowPermForm(false);
    setEditingPerm(null);
  };

  const handleDeletePerm = async () => {
    if (!confirmDelete || confirmDelete.type !== 'perm') return;
    await deletePermission.mutateAsync(confirmDelete.id);
    setConfirmDelete(null);
  };

  const getModuleIcon = (catArName: string) => {
    const match = Object.values(MODULES_REGISTRY).find(v => v.ar === catArName);
    return match?.icon || <Shield size={16} className="text-slate-400" />;
  };

  return (
    <PortalLayout
      title={t('إدارة الصلاحيات والرتب', 'Roles & Access Control')}
      subtitle={t('إعداد صلاحيات المشرفين وتعديل قوالب الأدوار الممنوحة لأقسام المنصة', 'Define role templates, assign permissions and control operational settings')}
    >
      {/* Confirm Dialog */}
      {confirmDelete && (
        <ConfirmDialog
          message={t(
            `هل أنت متأكد من حذف "${confirmDelete.label}"؟ سيؤثر هذا التغيير على أمن النظام والمسؤولين المرتبطين به فوراً.`,
            `Are you sure you want to delete "${confirmDelete.label}"? This change will instantly affect assigned users and security settings.`
          )}
          onConfirm={confirmDelete.type === 'role' ? handleDeleteRole : handleDeletePerm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* ROLE MODAL FORM OVERLAY */}
      {showRoleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="mb-4 flex items-center justify-between border-b pb-3.5">
              <h3 className="text-sm font-black text-slate-800">
                {editingRole ? t('تعديل الرتبة والصلاحيات الممنوحة', 'Edit Role') : t('إنشاء دور إشرافي جديد', 'New Role')}
              </h3>
              <button onClick={() => { setShowRoleForm(false); setEditingRole(null); }} className="hover:bg-slate-100 p-2 rounded-full cursor-pointer transition-colors">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold mb-1.5 text-slate-500">{t('المفتاح التقني للنظام (EN)', 'System Key (EN)')}</label>
                  <input type="text" placeholder="e.g. general_supervisor" value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} disabled={!!editingRole} className="w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[#1ba442]/30 bg-white" style={{ borderColor: COLORS.border, color: COLORS.dark }} />
                </div>
                <div>
                  <label className="block text-xs font-extrabold mb-1.5 text-slate-500">{t('الاسم باللغة العربية', 'Arabic Label')}</label>
                  <input type="text" placeholder="مثال: مشرف عام المنصة" value={roleForm.nameAr} onChange={e => setRoleForm({ ...roleForm, nameAr: e.target.value })} className="w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1ba442]/30 bg-white" style={{ borderColor: COLORS.border, color: COLORS.dark }} />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-500">{t('الوصف الإداري والمهام', 'Duties Description')}</label>
                <textarea rows={2} placeholder={t('تفاصيل المهام والمسؤوليات المخولة له...', 'Duties...')} value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} className="w-full rounded-xl border px-3.5 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1ba442]/30 bg-white" style={{ borderColor: COLORS.border, color: COLORS.dark }} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="block text-xs font-extrabold text-slate-500">{t('اختر الصلاحيات الممنوحة لهذه الرتبة:', 'Select Permissions:')}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={selectAllPermissions} className="text-[11px] font-extrabold text-[#1ba442] hover:underline cursor-pointer">
                      {t('تحديد الكل', 'Select All')}
                    </button>
                    <span className="text-[11px] text-slate-300">|</span>
                    <button type="button" onClick={deselectAllPermissions} className="text-[11px] font-extrabold text-slate-400 hover:underline cursor-pointer">
                      {t('إلغاء تحديد الكل', 'Clear All')}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {Object.entries(groupedPerms).map(([cat, perms]) => {
                    const permList = perms as any[];
                    return (
                      <AccordionSection key={cat} title={cat} icon={getModuleIcon(cat)} count={permList.filter((p: any) => roleForm.permissions.includes(p.key)).length || undefined}>
                        <div className="grid grid-cols-1 gap-2">
                          {permList.map((p: any) => {
                            const isChecked = roleForm.permissions.includes(p.key);
                            return (
                              <div
                                key={p.key}
                                onClick={() => togglePerm(p.key)}
                                className={cn(
                                  "flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 transition-all text-xs text-right",
                                  isChecked ? "border-[#1ba442] bg-emerald-50/10 text-[#1ba442]" : "border-[#e2e8f0] text-slate-500 hover:bg-slate-50"
                                )}
                              >
                                <div className="mt-0.5">
                                  {isChecked ? <CheckSquare size={14} className="text-[#1ba442]" /> : <Square size={14} className="text-slate-400" />}
                                </div>
                                <div className="flex-1">
                                  <span className="font-bold block text-slate-800">{p.ar}</span>
                                  <span className="text-[11px] block mt-0.5 font-semibold text-slate-500">{p.descAr}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionSection>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
              <button onClick={() => { setShowRoleForm(false); setEditingRole(null); }} className="rounded-full border px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer" style={{ borderColor: COLORS.border }}>
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                onClick={handleSaveRole}
                disabled={createRole.isPending || updateRole.isPending}
                className="inline-flex justify-center items-center gap-2 rounded-full px-5 py-2 text-xs font-black text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                style={{ background: COLORS.primary }}
              >
                <Save size={14} /> {editingRole ? t('تأكيد التعديلات', 'Save Changes') : t('إنشاء وحفظ', 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────── */}
      {/* PERMISSION MODAL FORM OVERLAY */}
      {showPermForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="mb-4 flex items-center justify-between border-b pb-3.5">
              <h3 className="text-sm font-black text-slate-800">
                {editingPerm ? t('تعديل الصلاحية المخصصة', 'Edit Permission') : t('إضافة صلاحية جديدة للنظام', 'New Permission')}
              </h3>
              <button onClick={() => { setShowPermForm(false); setEditingPerm(null); }} className="hover:bg-slate-100 p-2 rounded-full cursor-pointer transition-colors">
                <X size={16} className="text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-500">{t('الوحدة / القسم الإداري', 'Module')}</label>
                <select
                  value={permForm.module}
                  onChange={e => handleModuleChange(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1ba442]/30 bg-white"
                  style={{ borderColor: COLORS.border, color: COLORS.dark }}
                >
                  {MODULES_LIST.map(m => (
                    <option key={m.value} value={m.value}>{isRTL ? m.labelAr : m.labelEn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-500">{t('نوع الإجراء المتاح لهذه الوحدة', 'Action Type')}</label>
                <select
                  value={permForm.actions}
                  onChange={e => setPermForm({ ...permForm, actions: e.target.value })}
                  className="w-full rounded-xl border px-3 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1ba442]/30 bg-white"
                  style={{ borderColor: COLORS.border, color: COLORS.dark }}
                >
                  {allowedActionsForSelectedModule.map(a => (
                    <option key={a.value} value={a.value}>{a.labelAr}</option>
                  ))}
                  {allowedActionsForSelectedModule.length === 0 && (
                    <option value="">{t('لا توجد إجراءات متاحة لهذه الوحدة', 'No actions')}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold mb-1.5 text-slate-500">{t('الاسم التوضيحي باللغة العربية', 'Arabic Description')}</label>
                <input
                  type="text"
                  placeholder="مثال: مراجعة وتعديل الفرص الوظيفية للشركات"
                  value={permForm.description}
                  onChange={e => setPermForm({ ...permForm, description: e.target.value })}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1ba442]/30 bg-white"
                  style={{ borderColor: COLORS.border, color: COLORS.dark }}
                />
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border text-[10px] leading-relaxed" style={{ borderColor: COLORS.border }}>
                <span className="font-bold text-slate-400 block mb-1">{t('المفتاح البرمجي المولد للمطورين:', 'Developer technical key:')}</span>
                <code className="font-mono bg-white px-2 py-0.5 rounded border font-bold text-emerald-700">
                  {permForm.module ? `${permForm.module}:${permForm.actions || 'read'}` : '—'}
                </code>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t pt-4">
              <button onClick={() => { setShowPermForm(false); setEditingPerm(null); }} className="rounded-full border px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer" style={{ borderColor: COLORS.border }}>
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                onClick={handleSavePerm}
                disabled={createPermission.isPending || updatePermission.isPending}
                className="inline-flex justify-center items-center gap-2 rounded-full px-5 py-2 text-xs font-black text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                style={{ background: COLORS.primary }}
              >
                <Save size={14} /> {editingPerm ? t('حفظ التعديلات', 'Save Changes') : t('إضافة الصلاحية', 'Create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Header Navigation */}
      <div className="flex flex-wrap gap-1 rounded-full p-1.5 border shadow-2xs mb-6" style={{ borderColor: COLORS.border, background: COLORS.bgLight }}>
        <button
          onClick={() => setActiveTab('roles')}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer",
            activeTab === 'roles' ? "text-[#1d1e1c] shadow-xs" : "text-[#5e615c] hover:text-[#1d1e1c]"
          )}
          style={{
            background: activeTab === 'roles' ? '#ffffff' : 'transparent',
          }}
        >
          <Shield size={16} />
          {t('مجموعات وأدوار المسؤولين', 'Admin Roles')}
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer",
            activeTab === 'permissions' ? "text-[#1d1e1c] shadow-xs" : "text-[#5e615c] hover:text-[#1d1e1c]"
          )}
          style={{
            background: activeTab === 'permissions' ? '#ffffff' : 'transparent',
          }}
        >
          <ShieldCheck size={16} />
          {t('دليل الصلاحيات التفصيلي', 'Detailed Permissions')}
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* TAB 1: ROLES */}
        {activeTab === 'roles' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Main Roles List (12 columns wide - Full screen) */}
            <div className="lg:col-span-12">
              <ContentCard
                title={t('قوالب الرتب الإدارية المتاحة في النظام', 'Defined Admin Roles')}
                icon={<Shield size={20} style={{ color: COLORS.muted }} />}
                action={
                  <button onClick={openRoleCreate} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black transition-all hover:opacity-90 cursor-pointer" style={{ background: COLORS.primary, color: COLORS.dark }}>
                    <Plus size={14} /> {t('إضافة دور جديد', 'Add Role')}
                  </button>
                }
              >
                {rolesLoading ? (
                  <p className="py-8 text-center text-xs text-slate-400">{t('جاري تحميل قائمة الأدوار من قاعدة البيانات...', 'Loading roles...')}</p>
                ) : !Array.isArray(roles) || roles.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed rounded-3xl bg-slate-50/50 border-[#e1e3df]">
                    <Shield size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs text-slate-400">{t('لا توجد أدوار إضافية مخصصة حتى الآن', 'No custom roles found')}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {roles.map((role: any) => (
                      <AccordionSection
                        key={role._id || role.id}
                        title={role.nameAr || role.name}
                        count={(role.permissions || []).length}
                        isSystemRole={role.isSystem}
                        icon={<Shield size={20} className="text-emerald-500" />}
                      >
                        <div className="space-y-4">
                          {role.description && (
                            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                              <span className="text-[10px] font-black text-[#5e615c] block mb-1.5 uppercase tracking-wider">وصف الدور والمسؤوليات :</span>
                              <p className="text-xs text-slate-750 leading-relaxed font-semibold">{role.description}</p>
                            </div>
                          )}

                          {/* Granted permissions */}
                          <div>
                            <span className="text-[10px] font-black mb-2.5 text-[#5e615c] block uppercase tracking-wider">{t('الصلاحيات الممنوحة لهذه الرتبة :', 'Granted Permissions: ')}</span>
                            <div className="flex flex-wrap gap-2">
                              {(role.permissions || []).map((p: string) => {
                                const info = getPermInfo(p);
                                return (
                                  <div key={p} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold bg-[#9fe870]/15 text-[#272925] border border-[#9fe870]/30 shadow-3xs">
                                    <Check size={10} />
                                    <span>{info.ar}</span>
                                  </div>
                                );
                              })}
                              {(!role.permissions || role.permissions.length === 0) && (
                                <span className="text-xs text-slate-400 font-semibold italic">{t('لم يتم إسناد صلاحيات لهذا الدور بعد', 'No permissions assigned')}</span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-3 border-t border-[#e1e3df]">
                            <button onClick={() => openRoleEdit(role)} className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all hover:bg-[#f4f5f2] cursor-pointer border-[#e1e3df] text-[#272925]">
                              <Pencil size={13} className="text-[#5e615c]" /> {t('تعديل الرتبة والصلاحيات', 'Edit')}
                            </button>
                            {!role.isSystem && (
                              <button onClick={() => setConfirmDelete({ type: 'role', id: role._id || role.id, label: role.nameAr || role.name })} className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all hover:bg-red-50 hover:border-red-200 cursor-pointer border-red-100 text-red-600">
                                <Trash2 size={13} className="text-red-400" /> {t('حذف الرتبة', 'Delete')}
                              </button>
                            )}
                          </div>
                        </div>
                      </AccordionSection>
                    ))}
                  </div>
                )}
              </ContentCard>
            </div>
          </div>
        )}

        {/* TAB 2: DETAILED PERMISSIONS */}
        {activeTab === 'permissions' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Catalog list (12 columns wide - Full screen) */}
            <div className="lg:col-span-12">
              <ContentCard
                title={t('دليل وتصنيف الصلاحيات التفصيلي في النظام', 'Detailed Permissions Catalog')}
                icon={<ShieldCheck size={20} style={{ color: COLORS.muted }} />}
                action={
                  <button onClick={openPermCreate} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-black transition-all hover:opacity-90 cursor-pointer" style={{ background: COLORS.primary, color: COLORS.dark }}>
                    <Plus size={14} /> {t('إضافة صلاحية جديدة', 'New Permission')}
                  </button>
                }
              >
                {permsLoading ? (
                  <p className="py-8 text-center text-xs text-slate-400">{t('جاري تحميل الصلاحيات من الخادم...', 'Loading permissions...')}</p>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(groupedPerms).map(([cat, perms], catIdx) => {
                      const permList = perms as any[];
                      return (
                        <AccordionSection key={cat} title={cat} icon={getModuleIcon(cat)} count={permList.length} defaultOpen={catIdx === 0}>
                          <div className="space-y-2">
                            {permList.map((p: any) => {
                              const dbPerm = Array.isArray(permissions) ? permissions.find((pp: any) => pp.name === p.key) : null;
                              return (
                                <div key={p.key} className="flex items-start justify-between gap-4 rounded-3xl border p-4 bg-[#ffffff] hover:bg-slate-50/50 transition-colors" style={{ borderColor: COLORS.border }}>
                                  <div className="flex-1 text-right">
                                    <p className="text-xs font-bold text-[#1d1e1c]">{p.ar}</p>
                                    <p className="text-[11px] mt-1 text-[#5e615c] font-semibold leading-relaxed">{p.descAr}</p>
                                  </div>
                                  <div className="flex items-center gap-2.5 flex-shrink-0">
                                    <span className="rounded-full px-2.5 py-0.5 text-[9px] font-mono font-extrabold bg-[#f4f5f2] text-[#272925] border border-[#e1e3df]">{p.key}</span>
                                    {dbPerm && (
                                      <div className="flex items-center gap-1">
                                        <button onClick={() => openPermEdit(dbPerm)} className="rounded-full p-1.5 hover:bg-slate-100 text-[#848782] hover:text-slate-700 cursor-pointer" title={t('تعديل الصلاحية', 'Edit')}>
                                          <Pencil size={12} />
                                        </button>
                                        <button onClick={() => setConfirmDelete({ type: 'perm', id: dbPerm._id || dbPerm.id, label: p.ar })} className="rounded-full p-1.5 hover:bg-red-50 text-[#848782] hover:text-red-600 cursor-pointer" title={t('حذف الصلاحية', 'Delete')}>
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionSection>
                      );
                    })}
                  </div>
                )}
              </ContentCard>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
