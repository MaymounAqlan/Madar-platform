import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useAdminUsers,
  useUpdateUserStatus,
  useInvalidateUserSessions,
  useResendVerification,
  useSendResetPassword,
  useAdminUserView,
  useUpdateAdminUser,
} from '@/hooks/useAdmin';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import StatusBadge from '@/components/StatusBadge';
import {
  Users, Search, PauseCircle, Play, Power, RotateCcw, ShieldAlert,
  Eye, Mail, KeyRound, X, Loader2, MoreVertical, FilterX, Edit, Slash, Calendar, Phone, Activity, LogIn, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roleTabs: { key: string; labelAr: string; labelEn: string }[] = [
  { key: 'all', labelAr: 'الكل', labelEn: 'All' },
  { key: 'student', labelAr: 'طلاب', labelEn: 'Students' },
  { key: 'company', labelAr: 'شركات', labelEn: 'Companies' },
  { key: 'university', labelAr: 'جامعات', labelEn: 'Universities' },
  { key: 'admin', labelAr: 'مديرون', labelEn: 'Admins' },
  { key: 'super_admin', labelAr: 'مديرون علويون', labelEn: 'Super Admins' },
];

function formatDate(value?: string | Date) {
  if (!value) return '-';
  return new Date(value).toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function providerLabel(provider?: string) {
  if (!provider) return 'البريد الإلكتروني';
  const p = provider.toLowerCase();
  if (p === 'google') return 'جوجل';
  if (p === 'linkedin') return 'لينكد إن';
  return provider;
}

// Translations for Roles
function translateRole(role: string): string {
  const r = role.toLowerCase();
  if (r === 'student') return 'طالب';
  if (r === 'company') return 'شركة';
  if (r === 'university') return 'جامعة';
  if (r === 'admin') return 'مدير';
  if (r === 'super_admin') return 'مدير علوي';
  if (r === 'coordinator') return 'منسق';
  if (r === 'university_viewer') return 'مشاهد جامعة';
  if (r === 'data_officer') return 'مسؤول بيانات';
  if (r === 'quality_officer') return 'مسؤول جودة';
  if (r === 'academic_development_officer') return 'مسؤول تطوير أكاديمي';
  return role;
}

// Translations for Statuses
function translateStatus(status: string): string {
  const s = status.toLowerCase();
  if (s === 'active') return 'نشط';
  if (s === 'suspended') return 'معلق';
  if (s === 'banned') return 'محظور';
  if (s === 'inactive') return 'غير نشط';
  if (s === 'pending_verification') return 'بانتظار التأكيد';
  return status;
}

// Translations for Activity Logs
function translateAction(action: string): string {
  const a = action.toUpperCase();
  
  // Route paths handling
  if (action.startsWith('/')) {
    const route = action.toLowerCase();
    if (route.includes('/users') && route.includes('/admin-view')) return 'عرض تفاصيل المستخدم الإدارية';
    if (route.includes('/users') && route.includes('/invalidate-sessions')) return 'إنهاء جلسات المستخدم';
    if (route.includes('/users') && route.includes('/role')) return 'تعيين دور للمستخدم';
    if (route.includes('/users') && route.includes('/status')) return 'تحديث حالة المستخدم';
    if (route.includes('/users') && route.includes('/resend-verification')) return 'إعادة إرسال التحقق';
    if (route.includes('/users') && route.includes('/send-reset-password')) return 'إرسال رابط استعادة كلمة المرور';
    if (route.endsWith('/users')) return 'عرض قائمة المستخدمين';
    if (route.includes('/users/')) return 'تعديل بيانات مستخدم';
    if (route.includes('/roles')) return 'إدارة الصلاحيات';
    if (route.includes('/permissions')) return 'إدارة التصاريح';
    if (route.includes('/backups')) return 'إدارة النسخ الاحتياطي';
    if (route.includes('/settings')) return 'تحديث إعدادات المنصة';
    if (route.includes('/universities')) return 'إدارة الجامعات';
    if (route.includes('/companies')) return 'إدارة الشركات';
  }

  if (a.includes('LOGIN')) return 'تسجيل دخول';
  if (a.includes('LOGOUT')) return 'تسجيل خروج';
  if (a.includes('UNAUTHORIZED') || a.includes('FORBIDDEN')) return 'محاولة وصول غير مصرح بها';
  if (a.includes('REGISTER') || a.includes('SIGNUP')) return 'إنشاء حساب جديد';
  if (a.includes('UPDATE_PROFILE') || a.includes('PROFILE_UPDATE')) return 'تحديث الملف الشخصي';
  if (a.includes('PASSWORD_CHANGE') || a.includes('CHANGE_PASSWORD')) return 'تغيير كلمة المرور';
  if (a.includes('RESET_PASSWORD') || a.includes('SEND_RESET_PASSWORD')) return 'إعادة تعيين كلمة المرور';
  if (a.includes('VERIFY_EMAIL') || a.includes('EMAIL_VERIFICATION') || a.includes('RESEND_VERIFICATION')) return 'إعادة إرسال التحقق';
  if (a.includes('STATUS_UPDATE') || a.includes('UPDATE_STATUS')) return 'تحديث حالة الحساب';
  if (a.includes('INVALIDATE_SESSIONS') || a.includes('SESSION_INVALIDATE')) return 'إنهاء الجلسات النشطة';
  if (a.includes('ASSIGN_ROLE')) return 'تعيين دور/صلاحية';
  if (a.includes('UPDATE_ADMIN_ACCOUNT')) return 'تعديل حساب مسؤول';
  if (a.includes('REACTIVATE_ADMIN_ACCOUNT')) return 'إعادة تنشيط حساب مسؤول';
  if (a.includes('DISABLE_ADMIN_ACCOUNT')) return 'تعطيل حساب مسؤول';
  if (a.includes('CREATE_ADMIN_ACCOUNT')) return 'إنشاء حساب مسؤول';
  if (a.includes('CREATE_ROLE')) return 'إنشاء دور/صلاحية';
  if (a.includes('CREATE_PERMISSION')) return 'إنشاء تصريح جديد';
  if (a.includes('UPDATE_PLATFORM_SETTINGS')) return 'تحديث إعدادات المنصة';
  if (a.includes('CREATE_BACKUP')) return 'إنشاء نسخة احتياطية';
  if (a.includes('RESTORE_BACKUP')) return 'استعادة نسخة احتياطية';
  if (a.includes('VERIFY_BACKUP')) return 'تحقق من نسخة احتياطية';
  return action;
}

function translateDescription(desc: string, action: string): string {
  if (!desc) return translateAction(action);
  let d = desc.toLowerCase();
  
  if (d.includes('assigned role')) {
    const roleMatch = desc.match(/role\s+(\S+)/i);
    const userMatch = desc.match(/user\s+(\S+)/i);
    const roleName = roleMatch ? roleMatch[1] : '';
    const userId = userMatch ? userMatch[1] : '';
    return `تم تعيين الدور/الصلاحية "${roleName}" للمستخدم ${userId} بنجاح.`;
  }

  if (d.includes('updated admin account')) {
    const match = desc.match(/account\s+(\S+)/i);
    const userId = match ? match[1] : '';
    return `تم تحديث بيانات حساب المسؤول ${userId} بنجاح.`;
  }

  if (d.includes('reactivated admin account')) {
    const match = desc.match(/account\s+(\S+)/i);
    const userId = match ? match[1] : '';
    return `تم إعادة تنشيط حساب المسؤول ${userId} وتمكينه من الدخول.`;
  }

  if (d.includes('disabled admin account')) {
    const match = desc.match(/account\s+(\S+)/i);
    const userId = match ? match[1] : '';
    return `تم تعطيل حساب المسؤول ${userId} ومنعه من الدخول.`;
  }

  if (d.includes('created admin account')) {
    const emailMatch = desc.match(/account\s+(\S+)/i);
    const email = emailMatch ? emailMatch[1] : '';
    return `تم إنشاء حساب مسؤول جديد للبريد الإلكتروني: ${email}`;
  }

  if (d.includes('invalidated sessions')) {
    const userIdMatch = desc.match(/user\s+([a-fA-F0-9]+)/i);
    const userId = userIdMatch ? userIdMatch[1] : '';
    return `تم إنهاء جميع الجلسات النشطة للمستخدم ${userId} بنجاح.`;
  }
  
  if (d.includes('resent verification')) {
    const emailMatch = desc.match(/to\s+([^\s]+)/i);
    const email = emailMatch ? emailMatch[1].replace(/\.$/, '') : '';
    return `تم إعادة إرسال بريد التحقق بنجاح إلى البريد الإلكتروني: ${email}`;
  }

  if (d.includes('sent password reset')) {
    const emailMatch = desc.match(/to\s+([^\s]+)/i);
    const email = emailMatch ? emailMatch[1].replace(/\.$/, '') : '';
    return `تم إرسال رابط إعادة تعيين كلمة المرور بنجاح إلى البريد الإلكتروني: ${email}`;
  }

  if (d.includes('logged in')) return 'تم تسجيل الدخول بنجاح إلى المنصة.';
  if (d.includes('logged out')) return 'تم تسجيل الخروج من الحساب.';
  if (d.includes('updated profile') || d.includes('updated their profile')) return 'تم تحديث البيانات الأساسية لملف التعريف.';
  if (d.includes('changed password')) return 'تم تحديث كلمة المرور بنجاح.';
  if (d.includes('email verified')) return 'تم إكمال تأكيد البريد الإلكتروني بنجاح.';
  
  return desc;
}

// Theme Colors
const COLORS = {
  primary: '#9fe870',      // MADAR Accent Green
  dark: '#272925',         // Soft Charcoal/Dark (Not pitch black)
  darker: '#1d1e1c',       // Slightly darker for headers/cards
  muted: '#5e615c',        // Softer gray-green text
  lightMuted: '#848782',   // Light gray-green for borders/hints
  border: '#e1e3df',       // Cohesive border
  bgLight: '#f4f5f2',      // Very light page backdrop
};

export default function AdminUsers() {
  const { t, isRTL } = useLanguage();
  
  // Filters State
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Actions State
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; userId: string; userName: string; isSuperAdmin?: boolean } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Edit / Password Update States
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    firstNameAr: '',
    lastNameAr: '',
    email: '',
    phone: '',
    userType: '',
    status: '',
    isEmailVerified: false,
    profileCompleted: false,
    language: 'ar',
  });

  const [changePasswordUser, setChangePasswordUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading, refetch } = useAdminUsers({
    role: activeTab === 'all' ? undefined : activeTab,
    search: searchQuery || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: currentPage,
    limit: perPage,
  });

  const updateStatus = useUpdateUserStatus();
  const updateDetails = useUpdateAdminUser();
  const invalidateSessions = useInvalidateUserSessions();
  const resendVerification = useResendVerification();
  const sendResetPassword = useSendResetPassword();
  const userView = useAdminUserView(detailUserId ?? undefined);

  const users = (data?.items ?? []).map((user: any) => ({
    id: user.id ?? user._id,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    nameAr: [user.firstNameAr, user.lastNameAr].filter(Boolean).join(' ') || '',
    email: user.email,
    role: user.role ?? user.userType ?? 'student',
    status: user.status ?? 'active',
    isEmailVerified: user.isEmailVerified ?? false,
    provider: providerLabel(user.provider),
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    firstNameAr: user.firstNameAr || '',
    lastNameAr: user.lastNameAr || '',
    phone: user.phone || '',
    profileCompleted: user.profileCompleted ?? false,
    preferences: user.preferences ?? { language: 'ar' },
  }));

  const totalPages = data?.pagination.totalPages ?? 1;
  const totalUsers = data?.pagination.total ?? 0;

  const handleAction = async () => {
    if (!confirmAction) return;
    const { type, userId, isSuperAdmin } = confirmAction;

    if (isSuperAdmin && ['suspend', 'activate', 'ban'].includes(type)) {
      toast.error(t('لا يمكن تعديل حالة المدير العلوي (Super Admin)', 'Cannot modify Super Admin status'));
      setConfirmAction(null);
      return;
    }

    try {
      if (type === 'suspend') await updateStatus.mutateAsync({ userId, status: 'suspended' });
      if (type === 'ban') await updateStatus.mutateAsync({ userId, status: 'banned' });
      if (type === 'activate') await updateStatus.mutateAsync({ userId, status: 'active' });
      if (type === 'invalidate') await invalidateSessions.mutateAsync(userId);
      if (type === 'resend') await resendVerification.mutateAsync(userId);
      if (type === 'reset') await sendResetPassword.mutateAsync(userId);
      
      toast.success(t('تم تنفيذ الإجراء بنجاح', 'Action completed successfully'));
      refetch();
    } catch (error: any) {
      if (error?.response?.status === 403) {
        toast.error(t('عذراً، ليس لديك صلاحية لتنفيذ هذا الإجراء', 'You do not have permission for this action'));
      } else {
        toast.error(error?.response?.data?.message || t('فشل تنفيذ الإجراء', 'Action failed'));
      }
    } finally {
      setConfirmAction(null);
      setSuspendReason('');
    }
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      const { language, ...rest } = editForm;
      await updateDetails.mutateAsync({
        userId: editUser.id,
        data: {
          ...rest,
          preferences: { language },
        }
      });
      toast.success(t('تم تحديث البيانات بنجاح', 'Details updated successfully'));
      setEditUser(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('فشل تحديث البيانات', 'Failed to update details'));
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordUser || !newPassword) return;
    try {
      await updateDetails.mutateAsync({
        userId: changePasswordUser.id,
        data: { password: newPassword }
      });
      toast.success(t('تم تغيير كلمة المرور بنجاح', 'Password changed successfully'));
      setChangePasswordUser(null);
      setNewPassword('');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('فشل تغيير كلمة المرور', 'Failed to change password'));
    }
  };

  const openConfirm = (type: string, user: any) => {
    setConfirmAction({ 
      type, 
      userId: user.id, 
      userName: user.nameAr || user.name,
      isSuperAdmin: user.role === 'super_admin'
    });
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      firstNameAr: user.firstNameAr || '',
      lastNameAr: user.lastNameAr || '',
      email: user.email || '',
      phone: user.phone || '',
      userType: user.role || 'student',
      status: user.status || 'active',
      isEmailVerified: user.isEmailVerified || false,
      profileCompleted: user.profileCompleted || false,
      language: user.preferences?.language || 'ar',
    });
  };

  return (
    <PortalLayout
      title={t('إدارة المستخدمين', 'User Management')}
      subtitle={t('إدارة حسابات المنصة ومتابعة نشاط المستخدمين', 'Manage platform accounts and monitor user activity')}
    >
      <div className={cn("space-y-6 pb-12", isRTL ? "rtl" : "ltr")} dir={isRTL ? "rtl" : "ltr"}>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-3xl border p-5 shadow-xs transition-all" style={{ background: '#ffffff', borderColor: COLORS.border }}>
             <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: COLORS.bgLight, color: COLORS.dark }}>
                   <Users size={20} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>{t('إجمالي المستخدمين', 'Total Users')}</h3>
             </div>
             <p className="text-3xl font-bold" style={{ color: COLORS.dark }}>{totalUsers}</p>
          </div>
        </div>

        <ContentCard
          title={t('قائمة المستخدمين', 'Users List')}
          icon={<Users size={20} style={{ color: COLORS.muted }} />}
          action={
            <button onClick={() => refetch()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold hover:bg-[#f0f1ee] disabled:opacity-50 transition-colors cursor-pointer" style={{ borderColor: COLORS.border, color: COLORS.dark, background: '#ffffff' }}>
              <RotateCcw size={14} className={isLoading ? 'animate-spin' : ''} /> 
              {t('تحديث البيانات', 'Refresh')}
            </button>
          }
        >
          {/* Filters Section */}
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4" style={{ borderColor: COLORS.border }}>
            <div className="flex flex-wrap gap-1 rounded-full p-1" style={{ background: COLORS.bgLight }}>
              {roleTabs.map(tab => (
                <button 
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                  className={cn(
                    "rounded-full px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer", 
                    activeTab === tab.key 
                      ? "text-[#1d1e1c] shadow-xs" 
                      : "text-[#5e615c] hover:text-[#1d1e1c]"
                  )}
                  style={activeTab === tab.key ? { background: '#ffffff' } : {}}
                >
                  {t(tab.labelAr, tab.labelEn)}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative w-full md:w-64">
                <Search size={16} className={cn("absolute top-1/2 -translate-y-1/2", isRTL ? "right-3" : "left-3")} style={{ color: COLORS.lightMuted }} />
                <input 
                  type="text" 
                  placeholder={t('ابحث بالاسم أو البريد...', 'Search by name or email...')}
                  value={searchQuery} 
                  onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className={cn(
                    "h-10 w-full rounded-full border text-sm font-semibold focus:outline-none focus:ring-2 transition-all",
                    isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                  )}
                  style={{ background: '#ffffff', borderColor: COLORS.border, color: COLORS.dark }}
                />
              </div>

              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                <SelectTrigger className="w-36 h-10 rounded-full border text-xs font-bold focus:ring-2" style={{ background: '#ffffff', borderColor: COLORS.border, color: COLORS.dark }}>
                  <SelectValue placeholder={t('الحالة', 'Status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('كل الحالات', 'All Statuses')}</SelectItem>
                  <SelectItem value="active">{t('نشط', 'Active')}</SelectItem>
                  <SelectItem value="suspended">{t('معلق', 'Suspended')}</SelectItem>
                  <SelectItem value="banned">{t('محظور', 'Banned')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Section */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={32} className="animate-spin" style={{ color: COLORS.dark }} />
                <p className="text-sm font-semibold" style={{ color: COLORS.lightMuted }}>{t('جاري تحميل المستخدمين...', 'Loading users...')}</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <div className="rounded-full p-4" style={{ background: COLORS.bgLight }}>
                <FilterX size={32} style={{ color: COLORS.lightMuted }} />
              </div>
              <p className="text-sm font-bold" style={{ color: COLORS.dark }}>{t('لا يوجد مستخدمون', 'No users found')}</p>
              <p className="text-xs" style={{ color: COLORS.lightMuted }}>{t('جرب تغيير إعدادات البحث أو الفلتر', 'Try changing search or filter settings')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border" style={{ borderColor: COLORS.border }}>
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr style={{ background: COLORS.bgLight }}>
                    <th className={cn("py-3.5 px-4 text-xs font-bold uppercase tracking-wider", isRTL ? "text-right" : "text-left")} style={{ color: COLORS.muted }}>{t('المستخدم', 'User')}</th>
                    <th className={cn("py-3.5 px-4 text-xs font-bold uppercase tracking-wider hidden sm:table-cell", isRTL ? "text-right" : "text-left")} style={{ color: COLORS.muted }}>{t('الدور', 'Role')}</th>
                    <th className={cn("py-3.5 px-4 text-xs font-bold uppercase tracking-wider", isRTL ? "text-right" : "text-left")} style={{ color: COLORS.muted }}>{t('الحالة', 'Status')}</th>
                    <th className={cn("py-3.5 px-4 text-xs font-bold uppercase tracking-wider hidden lg:table-cell", isRTL ? "text-right" : "text-left")} style={{ color: COLORS.muted }}>{t('المصدر', 'Source')}</th>
                    <th className={cn("py-3.5 px-4 text-xs font-bold uppercase tracking-wider hidden md:table-cell", isRTL ? "text-right" : "text-left")} style={{ color: COLORS.muted }}>{t('التسجيل', 'Joined')}</th>
                    <th className={cn("py-3.5 px-4 text-xs font-bold uppercase tracking-wider hidden xl:table-cell", isRTL ? "text-right" : "text-left")} style={{ color: COLORS.muted }}>{t('آخر دخول', 'Last Login')}</th>
                    <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-center" style={{ color: COLORS.muted }}>{t('إجراءات', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="transition-colors hover:bg-[#f4f5f2]/50 border-b" style={{ borderColor: COLORS.border }}>
                      <td className="px-4 py-3 border-b" style={{ borderColor: COLORS.border }}>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: COLORS.dark, color: COLORS.primary }}>
                            {(user.nameAr || user.name).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm" style={{ color: COLORS.dark }}>{user.nameAr || user.name}</p>
                            <p className="text-xs" style={{ color: COLORS.lightMuted }}>{user.email}</p>
                            {!user.isEmailVerified && (
                              <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#B45309] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                                <ShieldAlert size={10} /> {t('غير موثق', 'Unverified')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 border-b hidden sm:table-cell" style={{ borderColor: COLORS.border }}>
                        <StatusBadge label={translateRole(user.role)} variant="default" className="text-xs capitalize" />
                      </td>
                      <td className="px-4 py-3 border-b" style={{ borderColor: COLORS.border }}>
                        <StatusBadge
                          label={t(user.status === 'active' ? 'نشط' : user.status === 'banned' ? 'محظور' : user.status === 'suspended' ? 'معلق' : user.status, user.status)}
                          variant={user.status === 'active' ? 'success' : 'error'} 
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold border-b hidden lg:table-cell" style={{ borderColor: COLORS.border, color: COLORS.muted }}>{user.provider}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap border-b hidden md:table-cell" style={{ borderColor: COLORS.border, color: COLORS.lightMuted }}>{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap border-b hidden xl:table-cell" style={{ borderColor: COLORS.border, color: COLORS.lightMuted }}>{formatDate(user.lastLoginAt)}</td>
                      <td className="px-4 py-3 text-center border-b" style={{ borderColor: COLORS.border }}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-8 w-8 rounded-full inline-flex items-center justify-center hover:bg-[#dfe1dd] transition-colors cursor-pointer">
                              <MoreVertical size={16} style={{ color: COLORS.muted }} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-52 font-semibold">
                            <DropdownMenuLabel>{t('إجراءات الحساب', 'Account Actions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDetailUserId(user.id)} className="gap-2 cursor-pointer">
                              <Eye size={14} style={{ color: COLORS.dark }} />
                              {t('عرض التفاصيل', 'View Details')}
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => openEdit(user)} className="gap-2 cursor-pointer">
                              <Edit size={14} style={{ color: COLORS.dark }} />
                              {t('تعديل البيانات', 'Edit Details')}
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => setChangePasswordUser(user)} className="gap-2 cursor-pointer">
                              <KeyRound size={14} style={{ color: COLORS.muted }} />
                              {t('تغيير كلمة المرور', 'Change Password')}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {user.status === 'active' ? (
                              <>
                                <DropdownMenuItem onClick={() => openConfirm('suspend', user)} className="gap-2 cursor-pointer text-[#B91C1C] focus:text-[#B91C1C]">
                                  <PauseCircle size={14} />
                                  {t('تعليق الحساب', 'Suspend Account')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openConfirm('ban', user)} className="gap-2 cursor-pointer text-[#dc2626] focus:text-[#dc2626]">
                                  <Slash size={14} />
                                  {t('حظر الحساب', 'Ban Account')}
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem onClick={() => openConfirm('activate', user)} className="gap-2 cursor-pointer text-[#1ba442] focus:text-[#1ba442]">
                                <Play size={14} />
                                {t('تفعيل الحساب', 'Activate Account')}
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={() => openConfirm('invalidate', user)} className="gap-2 cursor-pointer text-[#B45309] focus:text-[#B45309]">
                              <Power size={14} />
                              {t('إنهاء الجلسات', 'Invalidate Sessions')}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                              onClick={() => openConfirm('resend', user)} 
                              disabled={user.isEmailVerified}
                              className="gap-2 cursor-pointer"
                            >
                              <Mail size={14} style={{ color: COLORS.muted }} />
                              {t('إعادة إرسال التحقق', 'Resend Verification')}
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem onClick={() => openConfirm('reset', user)} className="gap-2 cursor-pointer">
                              <KeyRound size={14} style={{ color: COLORS.muted }} />
                              {t('رابط استعادة كلمة المرور', 'Password Reset Link')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-xs font-semibold" style={{ color: COLORS.lightMuted }}>
                {t(`عرض الصفحة ${currentPage} من ${totalPages}`, `Showing page ${currentPage} of ${totalPages}`)}
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                  className="rounded-full px-4 py-1.5 text-xs font-bold border transition-colors hover:bg-[#f0f1ee] disabled:opacity-30 cursor-pointer"
                  style={{ borderColor: COLORS.border, color: COLORS.dark, background: '#ffffff' }}
                >
                  {isRTL ? 'التالي' : 'Previous'}
                </button>
                
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = currentPage;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    
                    return (
                      <button 
                        key={pageNum} 
                        onClick={() => setCurrentPage(pageNum)} 
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all cursor-pointer", 
                          currentPage === pageNum 
                            ? "shadow-sm scale-105" 
                            : "hover:bg-[#f0f1ee]"
                        )}
                        style={currentPage === pageNum ? { background: COLORS.primary, color: COLORS.dark } : { color: COLORS.muted }}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                  className="rounded-full px-4 py-1.5 text-xs font-bold border transition-colors hover:bg-[#f0f1ee] disabled:opacity-30 cursor-pointer"
                  style={{ borderColor: COLORS.border, color: COLORS.dark, background: '#ffffff' }}
                >
                  {isRTL ? 'السابق' : 'Next'}
                </button>
              </div>
            </div>
          )}
        </ContentCard>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent className={isRTL ? "rtl text-right" : "ltr"} dir={isRTL ? "rtl" : "ltr"} style={{ borderRadius: '24px' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: COLORS.dark }}>
              {confirmAction?.type === 'suspend' && t('تأكيد تعليق الحساب', 'Confirm Account Suspension')}
              {confirmAction?.type === 'ban' && t('تأكيد حظر الحساب', 'Confirm Account Banning')}
              {confirmAction?.type === 'activate' && t('تأكيد تفعيل الحساب', 'Confirm Account Activation')}
              {confirmAction?.type === 'invalidate' && t('تأكيد إنهاء الجلسات', 'Confirm Session Invalidation')}
              {confirmAction?.type === 'resend' && t('تأكيد إعادة إرسال البريد', 'Confirm Resend Email')}
              {confirmAction?.type === 'reset' && t('تأكيد استعادة كلمة المرور', 'Confirm Password Reset')}
            </DialogTitle>
            <DialogDescription className="pt-3 text-sm font-semibold" style={{ color: COLORS.muted }}>
              {confirmAction?.type === 'suspend' && t(`هل أنت متأكد من تعليق حساب "${confirmAction.userName}"؟ لن يتمكن من تسجيل الدخول حتى يتم تفعيله.`, `Are you sure you want to suspend "${confirmAction.userName}"? They won't be able to login.`)}
              {confirmAction?.type === 'ban' && t(`هل أنت متأكد من حظر حساب "${confirmAction.userName}"؟ سيتم منع الحساب بشكل كامل من الوصول للموقع.`, `Are you sure you want to ban "${confirmAction.userName}"? They will be fully restricted.`)}
              {confirmAction?.type === 'activate' && t(`هل تريد إعادة تفعيل حساب "${confirmAction.userName}" وتمكينه من الدخول مجدداً؟`, `Do you want to reactivate "${confirmAction.userName}"?`)}
              {confirmAction?.type === 'invalidate' && t(`هل تريد إنهاء جميع الجلسات النشطة للمستخدم "${confirmAction.userName}" وتسجيل خروجه من جميع الأجهزة؟`, `Invalidate all active sessions for "${confirmAction.userName}" and sign them out from all devices?`)}
              {confirmAction?.type === 'resend' && t(`هل تريد إعادة إرسال رابط تأكيد البريد الإلكتروني للمستخدم "${confirmAction.userName}"؟`, `Resend verification link to "${confirmAction.userName}"?`)}
              {confirmAction?.type === 'reset' && t(`هل تريد إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني للمستخدم "${confirmAction.userName}"؟`, `Send a password reset link to "${confirmAction.userName}"?`)}
            </DialogDescription>
          </DialogHeader>

          {confirmAction?.type === 'suspend' && (
            <div className="py-2">
              <label className="mb-2 block text-xs font-bold" style={{ color: COLORS.muted }}>{t('سبب التعليق (اختياري)', 'Suspension Reason (Optional)')}</label>
              <input
                type="text"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder={t('أدخل السبب هنا...', 'Enter reason here...')}
                className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                style={{ borderColor: COLORS.border, background: COLORS.bgLight, color: COLORS.dark }}
              />
            </div>
          )}

          <DialogFooter className="mt-6 gap-2">
            <button onClick={() => setConfirmAction(null)} className="rounded-full px-6 py-2.5 text-xs font-bold transition-all hover:bg-[#f0f1ee] border cursor-pointer" style={{ borderColor: COLORS.border, color: COLORS.dark, background: '#ffffff' }}>
              {t('إلغاء', 'Cancel')}
            </button>
            <button 
              onClick={handleAction} 
              disabled={updateStatus.isPending || invalidateSessions.isPending || resendVerification.isPending || sendResetPassword.isPending}
              className="rounded-full px-6 py-2.5 text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center cursor-pointer hover:opacity-90"
              style={{ 
                background: confirmAction?.type === 'suspend' || confirmAction?.type === 'ban' || confirmAction?.type === 'invalidate' ? '#B91C1C' : COLORS.primary, 
                color: confirmAction?.type === 'suspend' || confirmAction?.type === 'ban' || confirmAction?.type === 'invalidate' ? '#ffffff' : COLORS.dark 
              }}
            >
              {(updateStatus.isPending || invalidateSessions.isPending || resendVerification.isPending || sendResetPassword.isPending) && (
                <Loader2 size={16} className="mr-2 animate-spin" />
              )}
              {t('تأكيد الإجراء', 'Confirm Action')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Details Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className={isRTL ? "rtl text-right" : "ltr"} dir={isRTL ? "rtl" : "ltr"} style={{ borderRadius: '24px' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: COLORS.dark }}>{t('تعديل بيانات المستخدم', 'Edit User Details')}</DialogTitle>
            <DialogDescription className="text-sm font-semibold" style={{ color: COLORS.muted }}>
              {t('تحديث الاسم ورقم الهاتف والبريد الإلكتروني الأساسي وإعدادات الحساب.', 'Update name, email, phone number, and account settings.')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateDetails} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('الاسم الأول (بالإنجليزي)', 'First Name (EN)')}</label>
                <input
                  type="text"
                  required
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.border, background: '#ffffff', color: COLORS.dark }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('الاسم الأخير (بالإنجليزي)', 'Last Name (EN)')}</label>
                <input
                  type="text"
                  required
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.border, background: '#ffffff', color: COLORS.dark }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('الاسم الأول (بالعربي)', 'First Name (AR)')}</label>
                <input
                  type="text"
                  value={editForm.firstNameAr}
                  onChange={(e) => setEditForm({ ...editForm, firstNameAr: e.target.value })}
                  className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.border, background: '#ffffff', color: COLORS.dark }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('الاسم الأخير (بالعربي)', 'Last Name (AR)')}</label>
                <input
                  type="text"
                  value={editForm.lastNameAr}
                  onChange={(e) => setEditForm({ ...editForm, lastNameAr: e.target.value })}
                  className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.border, background: '#ffffff', color: COLORS.dark }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('البريد الإلكتروني', 'Email Address')}</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.border, background: '#ffffff', color: COLORS.dark }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('رقم الهاتف', 'Phone Number')}</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.border, background: '#ffffff', color: COLORS.dark }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('الدور في المنصة', 'Role')}</label>
                <select
                  value={editForm.userType}
                  onChange={(e) => setEditForm({ ...editForm, userType: e.target.value })}
                  className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.border, background: '#ffffff', color: COLORS.dark }}
                >
                  <option value="student">{t('طالب', 'Student')}</option>
                  <option value="company">{t('شركة', 'Company')}</option>
                  <option value="university">{t('جامعة', 'University')}</option>
                  <option value="admin">{t('مدير', 'Admin')}</option>
                  <option value="super_admin">{t('مدير علوي', 'Super Admin')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('حالة الحساب', 'Status')}</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.border, background: '#ffffff', color: COLORS.dark }}
                >
                  <option value="active">{t('نشط', 'Active')}</option>
                  <option value="suspended">{t('معلق', 'Suspended')}</option>
                  <option value="banned">{t('محظور', 'Banned')}</option>
                  <option value="inactive">{t('غير نشط', 'Inactive')}</option>
                  <option value="pending_verification">{t('بانتظار التأكيد', 'Pending Verification')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('اللغة المفضلة', 'Preferred Language')}</label>
                <select
                  value={editForm.language}
                  onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                  className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.border, background: '#ffffff', color: COLORS.dark }}
                >
                  <option value="ar">{t('العربية', 'Arabic')}</option>
                  <option value="en">{t('الإنجليزية', 'English')}</option>
                </select>
              </div>

              <div className="flex flex-col justify-center gap-2 pt-3">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer" style={{ color: COLORS.muted }}>
                  <input
                    type="checkbox"
                    checked={editForm.isEmailVerified}
                    onChange={(e) => setEditForm({ ...editForm, isEmailVerified: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-0"
                  />
                  <span>{t('موثق البريد الإلكتروني', 'Email Verified')}</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer" style={{ color: COLORS.muted }}>
                  <input
                    type="checkbox"
                    checked={editForm.profileCompleted}
                    onChange={(e) => setEditForm({ ...editForm, profileCompleted: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-0"
                  />
                  <span>{t('الملف الشخصي مكتمل', 'Profile Completed')}</span>
                </label>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <button type="button" onClick={() => setEditUser(null)} className="rounded-full px-6 py-2.5 text-xs font-bold border transition-all hover:bg-[#f0f1ee] cursor-pointer" style={{ borderColor: COLORS.border, color: COLORS.dark, background: '#ffffff' }}>
                {t('إلغاء', 'Cancel')}
              </button>
              <button 
                type="submit"
                disabled={updateDetails.isPending}
                className="rounded-full px-6 py-2.5 text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center text-white cursor-pointer hover:opacity-90"
                style={{ background: COLORS.dark }}
              >
                {updateDetails.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
                {t('حفظ التعديلات', 'Save Changes')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!changePasswordUser} onOpenChange={(open) => !open && setChangePasswordUser(null)}>
        <DialogContent className={isRTL ? "rtl text-right" : "ltr"} dir={isRTL ? "rtl" : "ltr"} style={{ borderRadius: '24px' }}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold" style={{ color: COLORS.dark }}>{t('تغيير كلمة المرور', 'Change Password')}</DialogTitle>
            <DialogDescription className="text-sm font-semibold" style={{ color: COLORS.muted }}>
              {t(`تعيين كلمة مرور جديدة للمستخدم "${changePasswordUser?.nameAr || changePasswordUser?.name}"`, `Set a new password for "${changePasswordUser?.nameAr || changePasswordUser?.name}"`)}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('كلمة المرور الجديدة', 'New Password')}</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('أدخل كلمة المرور الجديدة (6 خانات على الأقل)...', 'Enter new password (min 6 characters)...')}
                className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                style={{ borderColor: COLORS.border, background: '#ffffff', color: COLORS.dark }}
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <button type="button" onClick={() => setChangePasswordUser(null)} className="rounded-full px-6 py-2.5 text-xs font-bold border transition-all hover:bg-[#f0f1ee] cursor-pointer" style={{ borderColor: COLORS.border, color: COLORS.dark, background: '#ffffff' }}>
                {t('إلغاء', 'Cancel')}
              </button>
              <button 
                type="submit"
                disabled={updateDetails.isPending}
                className="rounded-full px-6 py-2.5 text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center text-white cursor-pointer hover:opacity-90"
                style={{ background: COLORS.dark }}
              >
                {updateDetails.isPending && <Loader2 size={16} className="mr-2 animate-spin" />}
                {t('تغيير كلمة المرور', 'Change Password')}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail Drawer - We use a custom drawer structure to not rely on missing Drawer UI components if they don't exist */}
      {detailUserId && (
        <div className={cn("fixed inset-0 z-50 flex bg-black/40 backdrop-blur-sm transition-all", isRTL ? "justify-start" : "justify-end")} dir={isRTL ? "rtl" : "ltr"}>
          <div className="h-full w-full max-w-md animate-in slide-in-from-right-full overflow-y-auto bg-white p-6 shadow-2xl flex flex-col">
            <div className="mb-6 flex items-center justify-between border-b pb-4" style={{ borderColor: COLORS.border }}>
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: COLORS.dark }}>
                <Activity size={20} style={{ color: COLORS.primary }} />
                {t('عرض تفاصيل المستخدم', 'User Profile Details')}
              </h3>
              <button onClick={() => setDetailUserId(null)} className="rounded-full p-2 transition-colors hover:bg-[#f0f1ee] cursor-pointer"><X size={20} style={{ color: COLORS.muted }} /></button>
            </div>
            
            {userView.isLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 size={32} className="animate-spin" style={{ color: COLORS.primary }} />
              </div>
            ) : userView.data ? (
              <div className="space-y-6 flex-1">
                {/* User Header */}
                <div className="rounded-3xl p-6 border" style={{ background: COLORS.bgLight, borderColor: COLORS.border }}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-bold shadow-xs border-2 border-white" style={{ background: COLORS.dark, color: COLORS.primary }}>
                      {(userView.data.user.firstNameAr || userView.data.user.firstName || userView.data.user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-lg font-bold" style={{ color: COLORS.dark }}>
                        {[userView.data.user.firstNameAr, userView.data.user.lastNameAr].filter(Boolean).join(' ') || 
                         [userView.data.user.firstName, userView.data.user.lastName].filter(Boolean).join(' ') || 
                         userView.data.user.email}
                      </p>
                      <p className="text-sm font-semibold" style={{ color: COLORS.muted }}>{userView.data.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t" style={{ borderColor: COLORS.border }}>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.lightMuted }}>{t('الدور في المنصة', 'Platform Role')}</p>
                      <p className="text-sm font-bold capitalize mt-1" style={{ color: COLORS.dark }}>{translateRole(userView.data.user.userType)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.lightMuted }}>{t('حالة الحساب', 'Account Status')}</p>
                      <StatusBadge label={translateStatus(userView.data.user.status)} variant={userView.data.user.status === 'active' ? 'success' : 'error'} className="mt-1" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.lightMuted }}>{t('الاسم الأول (عربي)', 'First Name (AR)')}</p>
                      <p className="text-sm font-bold mt-1" style={{ color: COLORS.dark }}>{userView.data.user.firstNameAr || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.lightMuted }}>{t('الاسم الأخير (عربي)', 'Last Name (AR)')}</p>
                      <p className="text-sm font-bold mt-1" style={{ color: COLORS.dark }}>{userView.data.user.lastNameAr || '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.lightMuted }}>{t('رقم الهاتف', 'Phone Number')}</p>
                      <p className="text-sm font-bold mt-1 flex items-center gap-1.5" style={{ color: COLORS.dark }}>
                        <Phone size={14} style={{ color: COLORS.muted }} />
                        {userView.data.user.phone || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.lightMuted }}>{t('موثق البريد', 'Email Verified')}</p>
                      <p className="text-sm font-bold mt-1" style={{ color: COLORS.dark }}>{userView.data.user.isEmailVerified ? t('نعم', 'Yes') : t('لا', 'No')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.lightMuted }}>{t('مزود التسجيل', 'Auth Provider')}</p>
                      <p className="text-sm font-bold mt-1 capitalize" style={{ color: COLORS.dark }}>{providerLabel(userView.data.user.provider)}</p>
                    </div>
                  </div>
                </div>

                {/* Activity Log */}
                <div>
                  <h4 className="mb-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2" style={{ color: COLORS.muted, borderColor: COLORS.border }}>
                    <Activity size={16} style={{ color: COLORS.primary }} />
                    {t('سجل النشاطات والجلسات الأخير', 'Recent Activity & Sessions')}
                  </h4>
                  {userView.data.recentActivity?.length ? (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-[#dfe1dd]">
                      {userView.data.recentActivity.map((log: any, i: number) => {
                        const isLogin = log.action.toLowerCase().includes('login');
                        return (
                          <div key={log._id || i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className={cn(
                              "flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 shadow-xs transition-transform group-hover:scale-105",
                              isRTL ? "ml-4" : "mr-4"
                            )} style={{ background: isLogin ? COLORS.primary : COLORS.dark, color: isLogin ? COLORS.dark : COLORS.primary }}>
                              {isLogin ? <LogIn size={14} /> : <Activity size={14} />}
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border transition-shadow hover:shadow-xs bg-white" style={{ borderColor: COLORS.border }}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-sm" style={{ color: COLORS.dark }}>
                                  {translateAction(log.action)}
                                </span>
                              </div>
                              <p className="text-xs font-medium mb-2" style={{ color: COLORS.muted }}>
                                {translateDescription(log.description || log.resource, log.action)}
                              </p>
                              <time className="text-[10px] font-bold flex items-center gap-1.5" style={{ color: COLORS.lightMuted }}>
                                <Calendar size={11} />
                                {formatDate(log.timestamp || log.createdAt)}
                              </time>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed p-8 text-center" style={{ borderColor: COLORS.border, background: COLORS.bgLight }}>
                      <p className="text-sm font-bold" style={{ color: COLORS.muted }}>{t('لا توجد نشاطات مسجلة', 'No activities recorded')}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm font-bold" style={{ color: COLORS.muted }}>{t('تعذر تحميل تفاصيل المستخدم', 'Could not load user details')}</p>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t" style={{ borderColor: COLORS.border }}>
              <button className="w-full rounded-full py-3 font-bold transition-all hover:opacity-90 cursor-pointer text-white" style={{ background: COLORS.dark }} onClick={() => setDetailUserId(null)}>
                {t('إغلاق التفاصيل', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
