import { useEffect, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { Loader2, MailPlus, Pencil, Power, RefreshCw, RotateCcw, Search, Trash2, Users } from 'lucide-react';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  useCancelUniversityStaffInvitation, useInviteUniversityStaff, useResendUniversityStaffInvitation,
  useUniversityStaff, useUniversityStructure, useUpdateUniversityStaff, useUpdateUniversityStaffStatus,
} from '@/hooks/useUniversity';
import type { InviteUniversityStaffRequest, UniversityStaffMember, UniversityStaffQuery, UniversityStaffRole } from '@/types/university.types';
import DevelopmentAutofillButton from '@/components/DevelopmentAutofillButton';
import { generateUniversityStaffTestData } from '@/utils/testDataGenerator';
import {
  COORDINATOR_PERMISSION_OPTIONS,
  getDefaultPermissionsForRole,
  normalizePermissions,
} from '@/constants/permissions';

const roles: UniversityStaffRole[] = ['coordinator', 'university_viewer', 'data_officer', 'quality_officer', 'academic_development_officer'];
const inputClass = 'h-10 w-full rounded-lg border border-[#dfe1dd] bg-white px-3 text-sm outline-none focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]';
const roleLabels: Record<UniversityStaffRole, { ar: string; en: string }> = {
  coordinator: { ar: 'منسق كلية', en: 'College Coordinator' },
  university_viewer: { ar: 'قارئ الجامعة', en: 'University Viewer' },
  data_officer: { ar: 'مسؤول بيانات', en: 'Data Officer' },
  quality_officer: { ar: 'مسؤول جودة', en: 'Quality Officer' },
  academic_development_officer: { ar: 'مسؤول تطوير أكاديمي', en: 'Academic Development Officer' },
};

const codeToMessage: Record<string, { ar: string; en: string }> = {
  INVITATION_ALREADY_PENDING: { ar: 'توجد دعوة معلقة لهذا البريد الإلكتروني.', en: 'There is already a pending invitation for this email.' },
  STAFF_ALREADY_EXISTS: { ar: 'هذا المستخدم مضاف بالفعل ضمن فريق الجامعة.', en: 'This user is already part of the university staff.' },
  USER_ASSOCIATED_WITH_OTHER_UNIVERSITY: { ar: 'هذا المستخدم مرتبط بجهة أخرى.', en: 'This user is associated with another institution.' },
  EMAIL_ALREADY_REGISTERED: { ar: 'البريد الإلكتروني مسجل مسبقًا.', en: 'This email is already registered.' },
  COLLEGE_REQUIRED: { ar: 'يرجى اختيار الكلية الخاصة بمنسق الكلية.', en: 'Please select the college for the coordinator.' },
};

function errorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback;
  const data = error.response?.data;
  const code = data?.code;
  if (code && typeof code === 'string' && codeToMessage[code]) {
    return fallback.startsWith('تعذر') || /^[\u0600-\u06FF]/.test(fallback) ? codeToMessage[code].ar : codeToMessage[code].en;
  }
  const message = data?.message;
  return Array.isArray(message) ? message.join(', ') : typeof message === 'string' ? message : fallback;
}

function StaffForm({ open, staff, colleges, pending, error, onClose, onSubmit, t }: {
  open: boolean; staff: UniversityStaffMember | null; colleges: Array<{ id: string; name: string }>;
  pending: boolean; error: string; onClose: () => void;
  onSubmit: (data: InviteUniversityStaffRequest & { status?: 'active' | 'inactive' }) => Promise<void>; t: (ar: string, en: string) => string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UniversityStaffRole>('coordinator');
  const [collegeId, setCollegeId] = useState('');
  const [message, setMessage] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [fieldError, setFieldError] = useState('');

  useEffect(() => {
    if (!open) return;
    const initialRole = staff?.role || 'coordinator';
    setName(staff?.name || ''); setEmail(staff?.email || ''); setPhone(staff?.phone || '');
    setRole(initialRole); setCollegeId(staff?.college?.id || ''); setMessage(''); setPermissions(normalizePermissions(staff?.permissions) || getDefaultPermissionsForRole(initialRole)); setStatus(staff?.status || 'active'); setFieldError('');
  }, [open, staff]);

  const reset = () => {
    const initialRole = staff?.role || 'coordinator';
    setName(staff?.name || ''); setEmail(staff?.email || ''); setPhone(staff?.phone || '');
    setRole(initialRole); setCollegeId(staff?.college?.id || ''); setMessage(''); setPermissions(normalizePermissions(staff?.permissions) || getDefaultPermissionsForRole(initialRole)); setStatus(staff?.status || 'active'); setFieldError('');
  };
  const autofill = () => {
    const data = generateUniversityStaffTestData(staff?.college?.id || colleges[0]?.id);
    setName(data.name); if (!staff) setEmail(data.email); setPhone(data.phone); setRole(data.role); setCollegeId(data.collegeId); if (!staff) setMessage(data.message); setStatus('active'); setFieldError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || (!staff && !email.trim())) return setFieldError(t('الاسم والبريد الإلكتروني مطلوبان', 'Name and email are required'));
    if (role === 'coordinator' && !collegeId) return setFieldError(t('يجب اختيار كلية للمنسق', 'A college is required for a coordinator'));
    setFieldError('');
    const cleanedPermissions = normalizePermissions(permissions);
    await onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, role, collegeId: role === 'coordinator' ? collegeId : undefined, permissions: cleanedPermissions, message: !staff && message.trim() ? message.trim() : undefined, status: staff ? status : undefined });
  };

  return <Dialog open={open} onOpenChange={(next) => !next && !pending && onClose()}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader><DialogTitle>{staff ? t('تعديل الموظف', 'Edit Staff Member') : t('دعوة موظف', 'Invite Staff Member')}</DialogTitle><DialogDescription>{t('حدد الدور ونطاق الوصول المؤسسي للموظف.', 'Set the staff role and institutional access scope.')}</DialogDescription></DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="mb-1 block text-xs font-bold text-[#5b5e5a]">{t('الاسم', 'Name')} *</label><input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} disabled={pending} maxLength={160} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs font-bold text-[#5b5e5a]">{t('البريد الإلكتروني', 'Email')} *</label><input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={pending || Boolean(staff)} /></div>
          <div><label className="mb-1 block text-xs font-bold text-[#5b5e5a]">{t('الهاتف', 'Phone')}</label><input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} disabled={pending} maxLength={40} /></div>
        </div>
        <div className="rounded-xl border border-[#dfe1dd] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#0e0f0c]">{t('الدور والصلاحيات', 'Role & Permissions')}</h4>
            <span className="text-xs font-semibold text-[#828782]">{staff ? t('تعديل الدور', 'Edit role') : t('إضافة دور', 'Add role')}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="mb-1 block text-xs font-bold text-[#5b5e5a]">{t('الدور', 'Role')} *</label><select className={inputClass} value={role} onChange={(e) => { const nextRole = e.target.value as UniversityStaffRole; setRole(nextRole); setPermissions(getDefaultPermissionsForRole(nextRole)); }} disabled={pending}>{roles.map((value) => <option key={value} value={value}>{t(roleLabels[value].ar, roleLabels[value].en)}</option>)}</select></div>
            <div><label className="mb-1 block text-xs font-bold text-[#5b5e5a]">{t('الكلية', 'College')} {role === 'coordinator' && '*'}</label><select className={inputClass} value={collegeId} onChange={(e) => setCollegeId(e.target.value)} disabled={pending || role !== 'coordinator'}><option value="">{t('اختر الكلية', 'Select college')}</option>{colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}</select></div>
          </div>
          <fieldset className="mt-4 rounded-lg border border-[#dfe1dd] p-3"><legend className="px-2 text-xs font-bold text-[#5b5e5a]">{t('صلاحيات الدور', 'Role permissions')}</legend><div className="grid gap-2 sm:grid-cols-2">{COORDINATOR_PERMISSION_OPTIONS.map(({ value, labelAr, labelEn }) => <label key={value} className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={permissions.includes(value)} onChange={(event) => setPermissions((current) => event.target.checked ? [...new Set([...current, value])] : current.filter((item) => item !== value))} disabled={pending} />{t(labelAr, labelEn)}</label>)}</div></fieldset>
          <div className="mt-3 flex justify-end"><button type="button" onClick={() => setPermissions(getDefaultPermissionsForRole(role))} disabled={pending} className="text-xs font-semibold text-[#1ba442] hover:underline disabled:opacity-50">{t('تطبيق صلاحيات الدور الافتراضية', 'Apply role default permissions')}</button></div>
        </div>
        {staff && <div><label className="mb-1 block text-xs font-bold text-[#5b5e5a]">{t('الحالة', 'Status')} *</label><select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')} disabled={pending}><option value="active">{t('نشط', 'Active')}</option><option value="inactive">{t('معطل', 'Inactive')}</option></select></div>}
        {!staff && <div><label className="mb-1 block text-xs font-bold text-[#5b5e5a]">{t('رسالة الدعوة', 'Invitation Message')}</label><textarea className="min-h-24 w-full rounded-lg border border-[#dfe1dd] p-3 text-sm outline-none focus:border-[#9fe870]" value={message} onChange={(e) => setMessage(e.target.value)} disabled={pending} maxLength={1000} /></div>}
        {(fieldError || error) && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{fieldError || error}</p>}
        <div className="flex flex-wrap gap-2"><DevelopmentAutofillButton onClick={autofill} label={t('تعبئة بيانات تجريبية', 'Fill Test Data')} /><button type="button" onClick={reset} disabled={pending} className="rounded-full border px-3 py-2 text-xs font-semibold disabled:opacity-50">{staff ? t('استرجاع القيم الأصلية', 'Restore Original Values') : t('مسح الحقول', 'Clear Fields')}</button></div>
        <DialogFooter className="gap-2"><button type="button" onClick={onClose} disabled={pending} className="rounded-full border px-5 py-2 text-sm font-semibold disabled:opacity-50">{t('إلغاء', 'Cancel')}</button><button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-[#9fe870] px-5 py-2 text-sm font-semibold text-[#0e0f0c] disabled:opacity-50">{pending && <Loader2 size={15} className="animate-spin" />}{staff ? t('حفظ', 'Save') : t('إرسال الدعوة', 'Send Invitation')}</button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

export default function UniversityStaff() {
  const { t, language } = useLanguage();
  const [filters, setFilters] = useState<UniversityStaffQuery>({ page: 1, limit: 10 });
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UniversityStaffMember | null>(null);
  const [confirm, setConfirm] = useState<{ action: 'status' | 'cancel'; staff: UniversityStaffMember } | null>(null);
  const [formError, setFormError] = useState('');
  const staffQuery = useUniversityStaff(filters);
  const structureQuery = useUniversityStructure();
  const invite = useInviteUniversityStaff(); const update = useUpdateUniversityStaff(); const changeStatus = useUpdateUniversityStaffStatus();
  const resend = useResendUniversityStaffInvitation(); const cancel = useCancelUniversityStaffInvitation();
  const pending = invite.isPending || update.isPending;
  const actionPending = changeStatus.isPending || cancel.isPending;
  const colleges = structureQuery.data?.colleges.map(({ id, name }) => ({ id, name })) || [];

  const submit = async (data: InviteUniversityStaffRequest & { status?: 'active' | 'inactive' }) => {
    setFormError('');
    const payload = {
      ...data,
      email: data.email.trim().toLowerCase(),
      name: data.name.trim(),
      phone: data.phone?.trim() || undefined,
      message: data.message?.trim() || undefined,
    };
    try {
      if (editing) await update.mutateAsync({ id: editing.id, data: { name: payload.name, phone: payload.phone, role: payload.role, collegeId: payload.collegeId, permissions: payload.permissions, status: payload.status } });
      else await invite.mutateAsync(payload);
      toast.success(editing ? t('تم تحديث الموظف', 'Staff member updated') : t('تم إرسال الدعوة', 'Invitation sent'));
      setFormOpen(false); setEditing(null);
    } catch (error) { setFormError(errorMessage(error, t('تعذر حفظ بيانات الموظف', 'Unable to save staff data'))); }
  };

  const runConfirmation = async () => {
    if (!confirm) return;
    try {
      if (confirm.action === 'cancel') await cancel.mutateAsync(confirm.staff.id);
      else await changeStatus.mutateAsync({ id: confirm.staff.id, status: confirm.staff.status === 'active' ? 'inactive' : 'active' });
      toast.success(confirm.action === 'cancel' ? t('تم إلغاء الدعوة', 'Invitation cancelled') : t('تم تحديث حالة الحساب', 'Account status updated'));
      setConfirm(null);
    } catch (error) { toast.error(errorMessage(error, t('تعذر تنفيذ العملية', 'Unable to complete the action'))); }
  };

  return <PortalLayout title={t('موظفو الجامعة', 'University Staff')} subtitle={t('إدارة الأدوار ونطاق الوصول', 'Manage roles and access scope')}>
    <ContentCard className="mb-6" title={t('الموظفون', 'Staff Members')} icon={<Users size={18} />} action={<button onClick={() => { setEditing(null); setFormError(''); setFormOpen(true); }} className="inline-flex items-center gap-2 rounded-full bg-[#9fe870] px-4 py-2 text-xs font-semibold"><MailPlus size={15} />{t('دعوة موظف', 'Invite Staff')}</button>}>
      <form onSubmit={(e) => { e.preventDefault(); setFilters((old) => ({ ...old, search: search.trim(), page: 1 })); }} className="mb-5 grid gap-3 md:grid-cols-5">
        <div className="relative md:col-span-2"><Search size={16} className="absolute start-3 top-3 text-[#828782]" /><input className={`${inputClass} ps-9`} value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('الاسم أو البريد', 'Name or email')} /></div>
        <select className={inputClass} value={filters.role || ''} onChange={(e) => setFilters((old) => ({ ...old, role: e.target.value as UniversityStaffRole | '', page: 1 }))}><option value="">{t('كل الأدوار', 'All roles')}</option>{roles.map((role) => <option key={role} value={role}>{t(roleLabels[role].ar, roleLabels[role].en)}</option>)}</select>
        <select className={inputClass} value={filters.collegeId || ''} onChange={(e) => setFilters((old) => ({ ...old, collegeId: e.target.value, page: 1 }))}><option value="">{t('كل الكليات', 'All colleges')}</option>{colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}</select>
        <div className="flex gap-2"><select className={inputClass} value={filters.status || ''} onChange={(e) => setFilters((old) => ({ ...old, status: e.target.value, page: 1 }))}><option value="">{t('كل الحالات', 'All statuses')}</option><option value="active">{t('نشط', 'Active')}</option><option value="inactive">{t('معطل', 'Inactive')}</option><option value="pending">{t('دعوة معلقة', 'Pending invite')}</option></select><button type="submit" className="rounded-lg bg-[#0e0f0c] px-3 text-white"><Search size={16} /></button></div>
      </form>
      <div className="mb-4 flex justify-end"><button onClick={() => staffQuery.refetch()} disabled={staffQuery.isFetching} className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold disabled:opacity-50"><RefreshCw size={14} className={staffQuery.isFetching ? 'animate-spin' : ''} />{t('تحديث', 'Refresh')}</button></div>
      {staffQuery.isLoading ? <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-[#9fe870]" /></div> : staffQuery.isError ? <div className="py-16 text-center text-sm font-semibold text-red-700">{t('تعذر تحميل الموظفين', 'Unable to load staff members')}</div> : !staffQuery.data?.items.length ? <div className="py-16 text-center text-sm font-semibold text-[#828782]">{t('لا يوجد موظفون مطابقون', 'No matching staff members')}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[950px] text-sm"><thead><tr className="border-b text-start text-xs text-[#828782]"><th className="p-3 text-start">{t('الموظف', 'Staff')}</th><th className="p-3 text-start">{t('الدور', 'Role')}</th><th className="p-3 text-start">{t('الكلية', 'College')}</th><th className="p-3 text-start">{t('الحالة', 'Status')}</th><th className="p-3 text-start">{t('آخر دخول', 'Last login')}</th><th className="p-3 text-start">{t('تاريخ الإنشاء', 'Created')}</th><th className="p-3 text-start">{t('الإجراءات', 'Actions')}</th></tr></thead><tbody>{staffQuery.data.items.map((staff) => <tr key={staff.id} className="border-b border-[#eef0ec]"><td className="p-3"><p className="font-bold text-[#0e0f0c]">{staff.name}</p><p className="text-xs text-[#828782]">{staff.email}{staff.phone ? ` · ${staff.phone}` : ''}</p></td><td className="p-3">{t(roleLabels[staff.role].ar, roleLabels[staff.role].en)}</td><td className="p-3">{staff.college?.name || '—'}</td><td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${staff.status === 'active' ? 'bg-[#E7FDD8] text-[#167a32]' : 'bg-red-50 text-red-700'}`}>{staff.invitationStatus === 'pending' ? t('بانتظار القبول', 'Invitation pending') : staff.status === 'active' ? t('نشط', 'Active') : t('معطل', 'Inactive')}</span></td><td className="p-3 text-xs">{staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US') : '—'}</td><td className="p-3 text-xs">{staff.createdAt ? new Date(staff.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '—'}</td><td className="p-3"><div className="flex gap-1"><button onClick={() => { setEditing(staff); setFormError(''); setFormOpen(true); }} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-semibold" title={t('تعديل الدور', 'Edit Role')}><Pencil size={13} />{t('تعديل الدور', 'Edit Role')}</button><button onClick={() => setConfirm({ action: 'status', staff })} className="rounded-lg border p-2" title={staff.status === 'active' ? t('تعطيل', 'Deactivate') : t('تفعيل', 'Activate')}><Power size={14} /></button>{staff.invitationStatus === 'pending' && <><button onClick={async () => { try { const result = await resend.mutateAsync(staff.id); toast.success(result.emailSent ? t('أعيد إرسال الدعوة', 'Invitation resent') : t('جددت الدعوة وتعذر إرسال البريد', 'Invitation renewed; email delivery failed')); } catch (error) { toast.error(errorMessage(error, t('تعذر إعادة الدعوة', 'Unable to resend invitation'))); } }} disabled={resend.isPending} className="rounded-lg border p-2" title={t('إعادة الدعوة', 'Resend invitation')}><RotateCcw size={14} /></button><button onClick={() => setConfirm({ action: 'cancel', staff })} className="rounded-lg bg-red-50 p-2 text-red-700" title={t('إلغاء الدعوة', 'Cancel invitation')}><Trash2 size={14} /></button></>}</div></td></tr>)}</tbody></table></div>}
      {staffQuery.data && staffQuery.data.pagination.totalPages > 1 && <div className="mt-5 flex items-center justify-between"><button disabled={staffQuery.data.pagination.page <= 1} onClick={() => setFilters((old) => ({ ...old, page: Math.max((old.page || 1) - 1, 1) }))} className="rounded-full border px-4 py-2 text-xs font-semibold disabled:opacity-40">{t('السابق', 'Previous')}</button><span className="text-xs text-[#5b5e5a]">{staffQuery.data.pagination.page} / {staffQuery.data.pagination.totalPages}</span><button disabled={staffQuery.data.pagination.page >= staffQuery.data.pagination.totalPages} onClick={() => setFilters((old) => ({ ...old, page: (old.page || 1) + 1 }))} className="rounded-full border px-4 py-2 text-xs font-semibold disabled:opacity-40">{t('التالي', 'Next')}</button></div>}
    </ContentCard>
    <StaffForm open={formOpen} staff={editing} colleges={colleges} pending={pending} error={formError} onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={submit} t={t} />
    <Dialog open={Boolean(confirm)} onOpenChange={(next) => !next && !actionPending && setConfirm(null)}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{confirm?.action === 'cancel' ? t('إلغاء الدعوة', 'Cancel Invitation') : confirm?.staff.status === 'active' ? t('تعطيل الحساب', 'Deactivate Account') : t('تفعيل الحساب', 'Activate Account')}</DialogTitle><DialogDescription>{confirm?.action === 'cancel' ? t('سيتم حذف الدعوة غير المستخدمة وحسابها المعلق.', 'The unused invitation and its pending account will be removed.') : t('سيتم تطبيق التغيير فورًا على وصول الموظف.', 'The change will immediately affect staff access.')}</DialogDescription></DialogHeader><DialogFooter className="gap-2"><button onClick={() => setConfirm(null)} disabled={actionPending} className="rounded-full border px-5 py-2 text-sm font-semibold">{t('إلغاء', 'Cancel')}</button><button onClick={runConfirmation} disabled={actionPending} className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{actionPending && <Loader2 size={15} className="animate-spin" />}{t('تأكيد', 'Confirm')}</button></DialogFooter></DialogContent></Dialog>
  </PortalLayout>;
}
