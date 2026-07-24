import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services';
import {
  useAdminAccounts,
  useCreateAdminAccount,
  useUpdateAdminAccount,
  useDisableAdminAccount,
  useReactivateAdminAccount,
  useInvalidateUserSessions,
  useResendVerification,
  useSendResetPassword,
} from '@/hooks/useAdmin';
import PortalLayout from '@/components/PortalLayout';
import StatusBadge from '@/components/StatusBadge';
import {
  Sliders,
  Search,
  Plus,
  PauseCircle,
  Play,
  Save,
  X,
  MoreHorizontal,
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  RotateCcw,
  Ban,
  Key,
  LogOut,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Languages,
  Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

// All Permissions List
const allPermissions = [
  'admin:read', 'admin:write', 'users:read', 'users:write', 'users:status',
  'roles:read', 'roles:write', 'permissions:read', 'audit:read',
  'monitoring:read', 'ai:read', 'ai:write', 'email:read', 'email:test',
  'backup:create', 'backup:restore', 'backup:read', 'security:read', 'security:write',
  'settings:read', 'settings:write',
];

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

export default function AdminAccounts() {
  const { t, isRTL } = useLanguage();
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  // Actions State
  const [detailUser, setDetailUser] = useState<any | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; userId: string; userName: string } | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  // Dialog / Form States
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    firstNameAr: '',
    lastNameAr: '',
    email: '',
    password: '',
    phone: '',
    status: 'active',
    language: 'ar',
    permissions: [] as string[],
    sendInvitation: true,
    forcePasswordChange: false,
  });

  // Fetch paginated accounts
  const { data, isLoading, refetch } = useAdminAccounts({
    search: searchQuery || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page: currentPage,
    limit: perPage,
  });

  // Query all accounts for metrics cards (total, active, suspended, invited)
  const { data: allAdminsData, refetch: refetchMetrics } = useQuery({
    queryKey: ['admin', 'admin-accounts-metrics'],
    queryFn: () => adminApi.getAdminAccounts({ limit: 1000 }),
    staleTime: 30 * 1000,
  });

  // Mutators
  const createAccount = useCreateAdminAccount();
  const updateAccount = useUpdateAdminAccount();
  const disableAccount = useDisableAdminAccount();
  const reactivateAccount = useReactivateAdminAccount();
  const invalidateSessions = useInvalidateUserSessions();
  const resendVerification = useResendVerification();
  const sendResetPassword = useSendResetPassword();

  const accounts = (data?.items ?? []).map((user: any) => ({
    id: user.id ?? user._id,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    nameAr: [user.firstNameAr, user.lastNameAr].filter(Boolean).join(' ') || '',
    email: user.email,
    phone: user.phone || '',
    status: user.status || 'active',
    permissions: user.permissions || [],
    roleName: user.roleId?.name || 'مخصص',
    lastLoginAt: user.lastLoginAt,
    createdBy: user.createdBy || 'النظام',
    createdAt: user.createdAt,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    firstNameAr: user.firstNameAr || '',
    lastNameAr: user.lastNameAr || '',
    language: user.preferences?.language || 'ar',
  }));

  const totalPages = data?.pagination.totalPages ?? 1;
  const totalItems = data?.pagination.total ?? 0;

  // Compute metrics
  const allAdmins = allAdminsData?.items ?? [];
  const metrics = {
    total: allAdmins.length,
    active: allAdmins.filter((u: any) => u.status === 'active').length,
    suspended: allAdmins.filter((u: any) => u.status === 'suspended' || u.status === 'banned').length,
    invited: allAdmins.filter((u: any) => u.status === 'pending_verification' || u.status === 'inactive').length,
  };

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      firstNameAr: '',
      lastNameAr: '',
      email: '',
      password: '',
      phone: '',
      status: 'active',
      language: 'ar',
      permissions: [],
      sendInvitation: true,
      forcePasswordChange: false,
    });
    setShowCreateDialog(false);
    setEditUser(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const handleOpenEdit = (user: any) => {
    setEditUser(user);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      firstNameAr: user.firstNameAr,
      lastNameAr: user.lastNameAr,
      email: user.email,
      password: '',
      phone: user.phone,
      status: user.status,
      language: user.language,
      permissions: user.permissions,
      sendInvitation: false,
      forcePasswordChange: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editUser) {
        await updateAccount.mutateAsync({
          userId: editUser.id,
          data: {
            firstName: form.firstName,
            lastName: form.lastName,
            firstNameAr: form.firstNameAr,
            lastNameAr: form.lastNameAr,
            phone: form.phone,
            preferences: { language: form.language },
            permissions: form.permissions,
          },
        });
        toast.success(t('تم تحديث حساب المسؤول بنجاح', 'Admin account updated successfully'));
      } else {
        await createAccount.mutateAsync({
          ...form,
          role: 'admin',
          userType: 'admin',
        });
        toast.success(t('تم إنشاء حساب المسؤول بنجاح وإرسال التفاصيل', 'Admin account created successfully'));
      }
      resetForm();
      refetch();
      refetchMetrics();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('حدث خطأ أثناء حفظ البيانات', 'Error saving details'));
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, userId } = confirmAction;

    try {
      if (type === 'suspend') await disableAccount.mutateAsync(userId);
      if (type === 'activate') await reactivateAccount.mutateAsync(userId);
      if (type === 'invalidate') await invalidateSessions.mutateAsync(userId);
      if (type === 'resend') await resendVerification.mutateAsync(userId);
      if (type === 'reset') await sendResetPassword.mutateAsync(userId);

      toast.success(t('تم تنفيذ العملية بنجاح', 'Action completed successfully'));
      refetch();
      refetchMetrics();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('فشل تنفيذ العملية', 'Action failed'));
    } finally {
      setConfirmAction(null);
      setSuspendReason('');
    }
  };

  const togglePermission = (permission: string) => {
    setForm(prev =>
      prev.permissions.includes(permission)
        ? { ...prev, permissions: prev.permissions.filter(p => p !== permission) }
        : { ...prev, permissions: [...prev.permissions, permission] }
    );
  };

  const handleSelectAllPermissions = () => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.length === allPermissions.length ? [] : [...allPermissions],
    }));
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AD';
  };

  return (
    <PortalLayout
      title={t('الحسابات الإدارية', 'Operational Admins')}
      subtitle={t('إدارة وتفويض الصلاحيات التشغيلية لمسؤولي المنصة', 'Manage operational admin accounts and delegates')}
    >
      <div className={cn("space-y-6 pb-12", isRTL ? "rtl" : "ltr")} dir={isRTL ? "rtl" : "ltr"}>
        
        {/* Header Button row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: COLORS.dark }}>{t('الحسابات الإدارية', 'Admin Accounts')}</h1>
            <p className="text-sm font-semibold" style={{ color: COLORS.muted }}>{t('إدارة حسابات المشرفين وتعديل الصلاحيات الفردية لها.', 'Configure and manage access permissions for operational staff.')}</p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold transition-all shadow-md cursor-pointer hover:opacity-95"
            style={{ background: COLORS.primary, color: COLORS.dark }}
          >
            <Plus size={16} />
            <span>{t('إنشاء حساب مسؤول جديد', 'Create Operational Admin')}</span>
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-3xl border p-5 shadow-xs transition-all bg-white" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl" style={{ background: COLORS.bgLight }}>
                <User size={20} style={{ color: COLORS.dark }} />
              </div>
              <span className="text-xs font-bold" style={{ color: COLORS.muted }}>{t('إجمالي المسؤولين', 'Total Admins')}</span>
            </div>
            <p className="text-3xl font-black" style={{ color: COLORS.dark }}>{metrics.total}</p>
          </div>

          <div className="rounded-3xl border p-5 shadow-xs transition-all bg-white" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl" style={{ background: '#E7FDD8' }}>
                <UserCheck size={20} style={{ color: '#1ba442' }} />
              </div>
              <span className="text-xs font-bold" style={{ color: COLORS.muted }}>{t('نشطين حالياً', 'Active Admins')}</span>
            </div>
            <p className="text-3xl font-black" style={{ color: '#1ba442' }}>{metrics.active}</p>
          </div>

          <div className="rounded-3xl border p-5 shadow-xs transition-all bg-white" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl" style={{ background: '#FEE2E2' }}>
                <Ban size={20} style={{ color: '#B91C1C' }} />
              </div>
              <span className="text-xs font-bold" style={{ color: COLORS.muted }}>{t('حسابات موقوفة', 'Suspended Admins')}</span>
            </div>
            <p className="text-3xl font-black" style={{ color: '#B91C1C' }}>{metrics.suspended}</p>
          </div>

          <div className="rounded-3xl border p-5 shadow-xs transition-all bg-white" style={{ borderColor: COLORS.border }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl" style={{ background: '#FEF3C7' }}>
                <Clock size={20} style={{ color: '#D97706' }} />
              </div>
              <span className="text-xs font-bold" style={{ color: COLORS.muted }}>{t('بانتظار التوثيق', 'Pending Verification')}</span>
            </div>
            <p className="text-3xl font-black" style={{ color: '#D97706' }}>{metrics.invited}</p>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="rounded-3xl border p-5 shadow-xs bg-white space-y-4" style={{ borderColor: COLORS.border }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search size={18} className={cn("absolute top-1/2 -translate-y-1/2", isRTL ? "right-4" : "left-4")} style={{ color: COLORS.lightMuted }} />
              <input
                type="text"
                placeholder={t('ابحث بالاسم أو البريد الإلكتروني...', 'Search by name or email...')}
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className={cn("h-12 w-full rounded-full border text-sm font-semibold outline-none focus:ring-2", isRTL ? "pr-11 pl-4" : "pl-11 pr-4")}
                style={{ background: COLORS.bgLight, borderColor: COLORS.border, color: COLORS.dark }}
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="h-12 w-full rounded-full border px-4 text-sm font-semibold outline-none focus:ring-2"
                style={{ background: COLORS.bgLight, borderColor: COLORS.border, color: COLORS.dark }}
              >
                <option value="all">{t('جميع الحالات', 'All Statuses')}</option>
                <option value="active">{t('نشط', 'Active')}</option>
                <option value="suspended">{t('معلق / موقوف', 'Suspended')}</option>
                <option value="pending_verification">{t('بانتظار التأكيد', 'Pending Verification')}</option>
              </select>
            </div>

            <div>
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="h-12 w-full rounded-full border px-4 text-sm font-semibold outline-none focus:ring-2"
                style={{ background: COLORS.bgLight, borderColor: COLORS.border, color: COLORS.dark }}
              >
                <option value="all">{t('جميع الصلاحيات', 'All Permission Layouts')}</option>
                <option value="full">{t('صلاحيات كاملة', 'Full Access')}</option>
                <option value="custom">{t('صلاحيات مخصصة', 'Custom Permissions')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Operational Table */}
        <div className="rounded-3xl border shadow-xs bg-white overflow-hidden" style={{ borderColor: COLORS.border }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin" size={32} style={{ color: COLORS.dark }} />
              <p className="text-sm font-semibold" style={{ color: COLORS.muted }}>{t('جاري تحميل قائمة المسؤولين...', 'Loading operational accounts...')}</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <User size={48} className="mb-3" style={{ color: COLORS.lightMuted }} />
              <p className="text-base font-bold" style={{ color: COLORS.dark }}>{t('لا توجد حسابات إدارية مطابقة', 'No operational accounts found')}</p>
              <p className="text-xs font-semibold" style={{ color: COLORS.muted }}>{t('تأكد من شروط البحث أو الفلاتر المحددة.', 'Refine your search parameters or add a new operational account.')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr style={{ background: COLORS.bgLight, borderBottom: `1px solid ${COLORS.border}` }}>
                      <th className="px-6 py-4 text-xs font-bold" style={{ color: COLORS.muted }}>{t('المسؤول', 'Admin Account')}</th>
                      <th className="px-6 py-4 text-xs font-bold" style={{ color: COLORS.muted }}>{t('قالب الصلاحيات', 'Permissions Template')}</th>
                      <th className="px-6 py-4 text-xs font-bold" style={{ color: COLORS.muted }}>{t('عدد الصلاحيات', 'Count')}</th>
                      <th className="px-6 py-4 text-xs font-bold" style={{ color: COLORS.muted }}>{t('الحالة', 'Status')}</th>
                      <th className="px-6 py-4 text-xs font-bold" style={{ color: COLORS.muted }}>{t('آخر دخول', 'Last Login')}</th>
                      <th className="px-6 py-4 text-xs font-bold" style={{ color: COLORS.muted }}>{t('المنشئ', 'Created By')}</th>
                      <th className="px-6 py-4 text-xs font-bold" style={{ color: COLORS.muted }}>{t('تاريخ الإنشاء', 'Date Created')}</th>
                      <th className="px-6 py-4 text-xs font-bold" style={{ color: COLORS.muted }}>{t('العمليات', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {accounts.map((account) => (
                      <tr key={account.id} className="transition-colors hover:bg-neutral-50/70">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: COLORS.dark }}>
                              {getInitials(account.nameAr || account.name)}
                            </div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: COLORS.dark }}>{account.nameAr || account.name}</p>
                              <p className="text-xs font-semibold" style={{ color: COLORS.muted }}>{account.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm font-bold" style={{ color: COLORS.dark }}>
                          {account.permissions.length === allPermissions.length ? (
                            <span className="text-[#1ba442] font-black">{t('صلاحيات كاملة', 'Full Admin')}</span>
                          ) : (
                            <span style={{ color: COLORS.muted }}>{t('صلاحيات مخصصة', 'Custom Scope')}</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm font-bold" style={{ color: COLORS.dark }}>
                          <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: COLORS.bgLight, color: COLORS.dark }}>
                            {account.permissions.length} / {allPermissions.length}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge
                            label={t(
                              account.status === 'active' ? 'نشط' : account.status === 'suspended' || account.status === 'banned' ? 'معلق' : 'بانتظار التأكيد',
                              account.status
                            )}
                            variant={
                              account.status === 'active' ? 'success' : account.status === 'suspended' || account.status === 'banned' ? 'error' : 'warning'
                            }
                          />
                        </td>

                        <td className="px-6 py-4 text-xs font-semibold" style={{ color: COLORS.muted }}>
                          {account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString('ar-SA') : '-'}
                        </td>

                        <td className="px-6 py-4 text-xs font-bold" style={{ color: COLORS.dark }}>
                          {account.createdBy}
                        </td>

                        <td className="px-6 py-4 text-xs font-semibold" style={{ color: COLORS.muted }}>
                          {account.createdAt ? new Date(account.createdAt).toLocaleDateString('ar-SA') : '-'}
                        </td>

                        <td className="px-6 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="rounded-full p-2 hover:bg-neutral-100 cursor-pointer outline-none transition-all">
                              <MoreHorizontal size={18} style={{ color: COLORS.dark }} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 font-semibold shadow-md rounded-2xl p-1 text-right">
                              <DropdownMenuItem onClick={() => setDetailUser(account)} className="flex items-center gap-2 p-2.5 text-xs rounded-xl cursor-pointer">
                                <User size={14} />
                                <span>{t('عرض التفاصيل والنشاط', 'View Details & Logs')}</span>
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handleOpenEdit(account)} className="flex items-center gap-2 p-2.5 text-xs rounded-xl cursor-pointer">
                                <Save size={14} />
                                <span>{t('تعديل الحساب والصلاحيات', 'Edit Account & Scope')}</span>
                              </DropdownMenuItem>

                              {account.status === 'active' ? (
                                <DropdownMenuItem onClick={() => setConfirmAction({ type: 'suspend', userId: account.id, userName: account.nameAr || account.name })} className="flex items-center gap-2 p-2.5 text-xs rounded-xl text-red-600 cursor-pointer hover:bg-red-50">
                                  <PauseCircle size={14} />
                                  <span>{t('إيقاف مؤقت لحساب مسؤول', 'Suspend Account')}</span>
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setConfirmAction({ type: 'activate', userId: account.id, userName: account.nameAr || account.name })} className="flex items-center gap-2 p-2.5 text-xs rounded-xl text-green-600 cursor-pointer hover:bg-green-50">
                                  <Play size={14} />
                                  <span>{t('تنشيط حساب مسؤول', 'Activate Account')}</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => setConfirmAction({ type: 'reset', userId: account.id, userName: account.nameAr || account.name })} className="flex items-center gap-2 p-2.5 text-xs rounded-xl cursor-pointer">
                                <Key size={14} />
                                <span>{t('إرسال رابط استعادة كلمة المرور', 'Password Reset')}</span>
                              </DropdownMenuItem>

                              {account.status === 'pending_verification' && (
                                <DropdownMenuItem onClick={() => setConfirmAction({ type: 'resend', userId: account.id, userName: account.nameAr || account.name })} className="flex items-center gap-2 p-2.5 text-xs rounded-xl cursor-pointer">
                                  <RotateCcw size={14} />
                                  <span>{t('إعادة إرسال البريد الترحيبي', 'Resend Invitation')}</span>
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => setConfirmAction({ type: 'invalidate', userId: account.id, userName: account.nameAr || account.name })} className="flex items-center gap-2 p-2.5 text-xs rounded-xl text-orange-600 cursor-pointer hover:bg-orange-50">
                                <LogOut size={14} />
                                <span>{t('إبطال جميع الجلسات النشطة', 'Force Logout All')}</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: COLORS.border }}>
                  <span className="text-xs font-semibold" style={{ color: COLORS.muted }}>
                    {t(`عرض صفحة ${currentPage} من أصل ${totalPages}`, `Showing page ${currentPage} of ${totalPages}`)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-full border p-2 hover:bg-neutral-100 disabled:opacity-50 cursor-pointer transition-all"
                      style={{ borderColor: COLORS.border }}
                    >
                      {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-full border p-2 hover:bg-neutral-100 disabled:opacity-50 cursor-pointer transition-all"
                      style={{ borderColor: COLORS.border }}
                    >
                      {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Details Drawer */}
        <Sheet open={!!detailUser} onOpenChange={(open) => !open && setDetailUser(null)}>
          <SheetContent side={isRTL ? "right" : "left"} className={cn("w-full sm:max-w-md overflow-y-auto", isRTL ? "rtl text-right" : "ltr")} style={{ background: '#ffffff' }}>
            <SheetHeader className="pb-4 border-b" style={{ borderColor: COLORS.border }}>
              <SheetTitle className="text-xl font-bold flex items-center gap-2" style={{ color: COLORS.dark }}>
                <User size={20} />
                <span>{t('تفاصيل الحساب الإداري', 'Admin Details')}</span>
              </SheetTitle>
              <SheetDescription className="text-xs font-semibold" style={{ color: COLORS.muted }}>
                {t('عرض كامل الصلاحيات وسجلات النشاط للمشرف المختار.', 'Comprehensive operational views and audit log trails.')}
              </SheetDescription>
            </SheetHeader>

            {detailUser && (
              <div className="space-y-6 pt-5">
                {/* Basic Card */}
                <div className="p-4 rounded-2xl border flex items-center gap-4 bg-neutral-50/50" style={{ borderColor: COLORS.border }}>
                  <div className="h-14 w-14 rounded-full flex items-center justify-center text-lg font-black text-white" style={{ background: COLORS.dark }}>
                    {getInitials(detailUser.nameAr || detailUser.name)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold" style={{ color: COLORS.dark }}>{detailUser.nameAr || detailUser.name}</h3>
                    <p className="text-xs font-semibold" style={{ color: COLORS.muted }}>{detailUser.email}</p>
                    <span className="inline-block mt-2">
                      <StatusBadge
                        label={t(detailUser.status === 'active' ? 'نشط' : 'معلق', detailUser.status)}
                        variant={detailUser.status === 'active' ? 'success' : 'error'}
                      />
                    </span>
                  </div>
                </div>

                {/* Details list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>{t('بيانات الحساب الأساسية', 'Account Meta')}</h4>
                  <div className="rounded-2xl border p-4 space-y-3 bg-white" style={{ borderColor: COLORS.border }}>
                    <div className="flex justify-between text-xs font-bold">
                      <span style={{ color: COLORS.muted }}>{t('رقم الهاتف:', 'Phone:')}</span>
                      <span style={{ color: COLORS.dark }}>{detailUser.phone || '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span style={{ color: COLORS.muted }}>{t('اللغة المفضلة:', 'Language:')}</span>
                      <span style={{ color: COLORS.dark }}>{detailUser.language === 'ar' ? 'العربية (AR)' : 'الإنجليزية (EN)'}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span style={{ color: COLORS.muted }}>{t('الحساب بواسطة:', 'Created By:')}</span>
                      <span style={{ color: COLORS.dark }}>{detailUser.createdBy}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span style={{ color: COLORS.muted }}>{t('تاريخ الإنشاء:', 'Joined Date:')}</span>
                      <span style={{ color: COLORS.dark }}>{detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleString('ar-SA') : '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Scope permissions */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>{t('قائمة الصلاحيات الممنوحة', 'Permissions Granted')}</h4>
                    <span className="text-xs font-bold" style={{ color: COLORS.dark }}>{detailUser.permissions.length} / {allPermissions.length}</span>
                  </div>
                  <div className="rounded-2xl border p-4 bg-white max-h-40 overflow-y-auto space-y-1.5" style={{ borderColor: COLORS.border }}>
                    {detailUser.permissions.map((perm: string) => (
                      <div key={perm} className="flex items-center gap-2 text-xs font-semibold py-1 border-b last:border-0" style={{ borderColor: '#f5f5f5', color: COLORS.dark }}>
                        <Shield size={12} className="text-[#1ba442]" />
                        <span>{perm}</span>
                      </div>
                    ))}
                    {detailUser.permissions.length === 0 && (
                      <p className="text-xs font-semibold text-center py-2" style={{ color: COLORS.muted }}>{t('لا توجد صلاحيات ممنوحة.', 'No permissions assigned.')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Create / Edit Dialog */}
        <Dialog open={showCreateDialog || !!editUser} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className={cn("sm:max-w-2xl overflow-y-auto max-h-[90vh]", isRTL ? "rtl text-right" : "ltr")} dir={isRTL ? "rtl" : "ltr"} style={{ borderRadius: '24px', background: '#ffffff' }}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2" style={{ color: COLORS.dark }}>
                <Plus size={20} />
                <span>{editUser ? t('تعديل حساب مسؤول وصلاحياته', 'Edit Admin Account & Scope') : t('إنشاء حساب مسؤول إداري جديد', 'Create New Operational Admin')}</span>
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold" style={{ color: COLORS.muted }}>
                {t('قم بملء البيانات الأساسية للمشرف وتفويض الصلاحيات الفردية المناسبة.', 'Configure names, contact info, and security role scopes.')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('الاسم الأول (بالإنجليزي)', 'First Name (EN)')}</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                    style={{ borderColor: COLORS.border, background: COLORS.bgLight, color: COLORS.dark }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('الاسم الأخير (بالإنجليزي)', 'Last Name (EN)')}</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                    style={{ borderColor: COLORS.border, background: COLORS.bgLight, color: COLORS.dark }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('الاسم الأول (بالعربي)', 'First Name (AR)')}</label>
                  <input
                    type="text"
                    required
                    value={form.firstNameAr}
                    onChange={(e) => setForm({ ...form, firstNameAr: e.target.value })}
                    className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                    style={{ borderColor: COLORS.border, background: COLORS.bgLight, color: COLORS.dark }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('الاسم الأخير (بالعربي)', 'Last Name (AR)')}</label>
                  <input
                    type="text"
                    required
                    value={form.lastNameAr}
                    onChange={(e) => setForm({ ...form, lastNameAr: e.target.value })}
                    className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                    style={{ borderColor: COLORS.border, background: COLORS.bgLight, color: COLORS.dark }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('البريد الإلكتروني', 'Email Address')}</label>
                  <input
                    type="email"
                    required
                    disabled={!!editUser}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2 disabled:opacity-50"
                    style={{ borderColor: COLORS.border, background: COLORS.bgLight, color: COLORS.dark }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('رقم الهاتف', 'Phone Number')}</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                    style={{ borderColor: COLORS.border, background: COLORS.bgLight, color: COLORS.dark }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('اللغة المفضلة للمسؤول', 'Preferred Language')}</label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                    style={{ borderColor: COLORS.border, background: COLORS.bgLight, color: COLORS.dark }}
                  >
                    <option value="ar">{t('العربية (AR)', 'Arabic')}</option>
                    <option value="en">{t('الإنجليزية (EN)', 'English')}</option>
                  </select>
                </div>
                {!editUser && (
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: COLORS.muted }}>{t('كلمة المرور المؤقتة', 'Temporary Password')}</label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="6 خانات على الأقل..."
                      className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                      style={{ borderColor: COLORS.border, background: COLORS.bgLight, color: COLORS.dark }}
                    />
                  </div>
                )}
              </div>

              {/* Toggles for create */}
              {!editUser && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer" style={{ color: COLORS.muted }}>
                    <input
                      type="checkbox"
                      checked={form.sendInvitation}
                      onChange={(e) => setForm({ ...form, sendInvitation: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 focus:ring-0"
                    />
                    <span>{t('إرسال دعوة بالبريد الإلكتروني', 'Send Welcome Invite')}</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer" style={{ color: COLORS.muted }}>
                    <input
                      type="checkbox"
                      checked={form.forcePasswordChange}
                      onChange={(e) => setForm({ ...form, forcePasswordChange: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 focus:ring-0"
                    />
                    <span>{t('فرض تغيير كلمة المرور عند أول دخول', 'Force Password Change')}</span>
                  </label>
                </div>
              )}

              {/* Permissions scope checkboxes */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-black uppercase tracking-wider" style={{ color: COLORS.dark }}>{t('تحديد الصلاحيات الممنوحة للحساب', 'Permissions Delegation Scope')}</label>
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="text-xs font-bold underline cursor-pointer"
                    style={{ color: COLORS.muted }}
                  >
                    {form.permissions.length === allPermissions.length ? t('إلغاء تحديد الكل', 'Clear All') : t('تحديد الكل', 'Grant Full Access')}
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 rounded-2xl border bg-white max-h-52 overflow-y-auto" style={{ borderColor: COLORS.border }}>
                  {allPermissions.map((permission) => (
                    <label
                      key={permission}
                      className={cn(
                        "flex items-center gap-2 p-2 border text-xs font-bold rounded-xl cursor-pointer transition-all hover:bg-neutral-50",
                        form.permissions.includes(permission) ? "bg-[#E7FDD8] border-[#1ba442] text-[#1ba442]" : "bg-white border-neutral-200 text-neutral-600"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={form.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="hidden"
                      />
                      <span>{permission}</span>
                    </label>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4 gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full px-6 py-2.5 text-xs font-bold border transition-all hover:bg-[#f0f1ee] cursor-pointer"
                  style={{ borderColor: COLORS.border, color: COLORS.dark, background: '#ffffff' }}
                >
                  {t('إلغاء', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createAccount.isPending || updateAccount.isPending}
                  className="rounded-full px-6 py-2.5 text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center text-white cursor-pointer hover:opacity-90"
                  style={{ background: COLORS.dark }}
                >
                  {(createAccount.isPending || updateAccount.isPending) && (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  )}
                  {t('حفظ البيانات والتفويض', 'Confirm & Delegate')}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog for Sensitive Actions */}
        <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
          <DialogContent className={isRTL ? "rtl text-right" : "ltr"} dir={isRTL ? "rtl" : "ltr"} style={{ borderRadius: '24px', background: '#ffffff' }}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold" style={{ color: COLORS.dark }}>
                {confirmAction?.type === 'suspend' && t('تأكيد إيقاف حساب المسؤول', 'Confirm Suspension')}
                {confirmAction?.type === 'activate' && t('تأكيد إعادة تفعيل حساب المسؤول', 'Confirm Activation')}
                {confirmAction?.type === 'invalidate' && t('تأكيد إبطال الجلسات النشطة', 'Confirm Force Logout')}
                {confirmAction?.type === 'resend' && t('تأكيد إعادة إرسال الدعوة', 'Confirm Resend Invite')}
                {confirmAction?.type === 'reset' && t('تأكيد إرسال رابط كلمة المرور', 'Confirm Password Reset')}
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold" style={{ color: COLORS.muted }}>
                {confirmAction?.type === 'suspend' && t(`هل أنت متأكد من تعليق حساب المسؤول "${confirmAction.userName}"؟ سيتم منعه من استخدام الصلاحيات فوراً.`, `Are you sure you want to suspend "${confirmAction.userName}"?`)}
                {confirmAction?.type === 'activate' && t(`هل تريد إعادة تفعيل حساب المسؤول "${confirmAction.userName}" وتمكينه من الدخول مجدداً؟`, `Reactivate operational access for "${confirmAction.userName}"?`)}
                {confirmAction?.type === 'invalidate' && t(`سيتم إبطال جميع الجلسات النشطة وتسجيل خروج المسؤول "${confirmAction.userName}" من كافة أجهزته.`, `Force logout "${confirmAction.userName}" from all logged-in devices?`)}
                {confirmAction?.type === 'resend' && t(`هل ترغب في إعادة إرسال البريد الإلكتروني الترحيبي إلى الحساب "${confirmAction.userName}"؟`, `Send welcome invite email again to "${confirmAction.userName}"?`)}
                {confirmAction?.type === 'reset' && t(`هل تريد إرسال بريد إعادة تعيين كلمة المرور إلى البريد الإلكتروني للمسؤول "${confirmAction.userName}"؟`, `Send password recovery link to "${confirmAction.userName}"?`)}
              </DialogDescription>
            </DialogHeader>

            {confirmAction?.type === 'suspend' && (
              <div className="py-2">
                <label className="mb-2 block text-xs font-bold" style={{ color: COLORS.muted }}>{t('سبب الإيقاف المؤقت (مطلوب)', 'Suspension Reason (Required)')}</label>
                <input
                  type="text"
                  required
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder={t('أدخل سبب إيقاف الحساب هنا...', 'Type reason here...')}
                  className="w-full rounded-full border p-3 text-sm font-semibold focus:outline-none focus:ring-2"
                  style={{ borderColor: COLORS.border, background: COLORS.bgLight, color: COLORS.dark }}
                />
              </div>
            )}

            <DialogFooter className="mt-6 gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="rounded-full px-6 py-2.5 text-xs font-bold transition-all hover:bg-[#f0f1ee] border cursor-pointer"
                style={{ borderColor: COLORS.border, color: COLORS.dark, background: '#ffffff' }}
              >
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={disableAccount.isPending || reactivateAccount.isPending || invalidateSessions.isPending || resendVerification.isPending || sendResetPassword.isPending}
                className="rounded-full px-6 py-2.5 text-xs font-bold transition-all shadow-xs inline-flex items-center justify-center text-white cursor-pointer hover:opacity-90"
                style={{
                  background: confirmAction?.type === 'suspend' ? '#B91C1C' : COLORS.dark,
                }}
              >
                {(disableAccount.isPending || reactivateAccount.isPending || invalidateSessions.isPending || resendVerification.isPending || sendResetPassword.isPending) && (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                )}
                {t('تأكيد الإجراء', 'Confirm Action')}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </PortalLayout>
  );
}
