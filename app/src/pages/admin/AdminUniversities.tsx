import { useState } from 'react';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { AlertTriangle, Archive, Building2, CheckCircle2, ChevronLeft, ChevronRight, Eye, Loader2, PauseCircle, Pencil, Plus, RefreshCw, RotateCcw, Search, XCircle } from 'lucide-react';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUniversities, useReviewUniversity, useSaveDirectoryUniversity, useSoftDeleteDirectoryUniversity } from '@/hooks/useAdmin';
import type { AdminUniversity, DirectoryUniversityInput } from '@/types/admin-university.types';
import DevelopmentAutofillButton from '@/components/DevelopmentAutofillButton';
import { generateRejectionReason, generateSuspensionReason } from '@/utils/testDataGenerator';
import { adminApi } from '@/services/adminApi';
import { useQuery } from '@tanstack/react-query';

type ReviewAction = 'approve' | 'reject' | 'suspend' | 'reactivate';
type AcademicEditor = { kind: 'college' | 'department' | 'major'; parentId: string; parentName: string };

const emptyDirectoryForm: DirectoryUniversityInput = { nameAr: '', nameEn: '', slug: '', institutionType: 'public_university', ownership: 'public', governorate: '', city: '', website: '', officialEmail: '', phoneNumbers: [], sourceUrls: [], verificationStatus: 'unverified', accreditationStatus: 'unknown', isActive: true };

function resolveAssetUrl(value?: string | null) {
  if (!value || typeof window === 'undefined') return '';
  if (/^https?:/i.test(value)) return value;
  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const origin = /^https?:/i.test(apiBase) ? new URL(apiBase).origin : window.location.origin;
  return new URL(value, `${origin}/`).toString();
}

const statusColors: Record<string, { bg: string; color: string }> = {
  pending: { bg: '#FEF3C7', color: '#B45309' },
  active: { bg: '#E7FDD8', color: '#1ba442' },
  inactive: { bg: '#FEE2E2', color: '#B91C1C' },
  suspended: { bg: '#FEE2E2', color: '#B91C1C' },
};

function errorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : typeof message === 'string' ? message : fallback;
}

export default function AdminUniversities() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [details, setDetails] = useState<AdminUniversity | null>(null);
  const [review, setReview] = useState<{ university: AdminUniversity; action: ReviewAction } | null>(null);
  const [reason, setReason] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [directoryEditor, setDirectoryEditor] = useState<AdminUniversity | 'new' | null>(null);
  const [directoryForm, setDirectoryForm] = useState<DirectoryUniversityInput>(emptyDirectoryForm);
  const [directoryError, setDirectoryError] = useState('');
  const [directoryLogo, setDirectoryLogo] = useState<File | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<AdminUniversity | null>(null);
  const [academicEditor, setAcademicEditor] = useState<AcademicEditor | null>(null);
  const [academicForm, setAcademicForm] = useState({ nameAr: '', nameEn: '', slug: '', code: '' });
  const [academicError, setAcademicError] = useState('');
  const [academicSaving, setAcademicSaving] = useState(false);
  const query = useAdminUniversities({ status: status === 'all' ? undefined : status, search: search.trim() || undefined, page, limit: 10 });
  const mutation = useReviewUniversity();
  const saveDirectory = useSaveDirectoryUniversity();
  const removeDirectory = useSoftDeleteDirectoryUniversity();
  const isSuperAdmin = user?.role === 'super_admin';
  const structureQuery = useQuery({ queryKey: ['admin', 'university-directory-structure', details?._id], queryFn: () => adminApi.getDirectoryStructure(details!._id), enabled: Boolean(details?._id) });

  const openDirectoryEditor = (university?: AdminUniversity) => {
    setDirectoryEditor(university || 'new');
    setDirectoryError('');
    setDirectoryLogo(null);
    setDirectoryForm(university ? { nameAr: university.nameAr || university.name, nameEn: university.nameEn || '', slug: university.slug || '', aliases: university.aliases || [], institutionType: university.institutionType || 'public_university', ownership: university.ownership || 'public', governorate: university.governorate || university.location?.city || '', city: university.city || '', website: university.website || university.contactInfo?.website || '', officialEmail: university.officialEmail || university.contactInfo?.email || '', phoneNumbers: university.phoneNumbers || [], sourceUrls: university.sourceUrls || [], verificationStatus: university.verificationStatus || 'unverified', accreditationStatus: university.accreditationStatus || 'unknown', isActive: university.isActive !== false } : emptyDirectoryForm);
  };

  const submitDirectory = async () => {
    if (!directoryForm.nameAr.trim() || !directoryForm.slug.trim() || !directoryForm.governorate.trim()) { setDirectoryError(t('الاسم العربي والمعرّف والمحافظة حقول مطلوبة', 'Arabic name, slug, and governorate are required')); return; }
    try {
      const data: DirectoryUniversityInput = { ...directoryForm, nameAr: directoryForm.nameAr.trim(), slug: directoryForm.slug.trim(), governorate: directoryForm.governorate.trim(), nameEn: directoryForm.nameEn?.trim() || undefined, city: directoryForm.city?.trim() || undefined, website: directoryForm.website?.trim() || undefined, officialEmail: directoryForm.officialEmail?.trim() || undefined };
      const saved = await saveDirectory.mutateAsync({ universityId: directoryEditor === 'new' ? undefined : directoryEditor?._id, data });
      if (directoryLogo) await adminApi.uploadUniversityLogo(saved._id, directoryLogo);
      toast.success(t('تم حفظ بيانات الجامعة', 'University directory record saved'));
      setDirectoryEditor(null);
    } catch (error) { setDirectoryError(errorMessage(error, t('تعذر حفظ بيانات الجامعة', 'Unable to save university directory record'))); }
  };

  const softDeleteDirectory = async (university: AdminUniversity) => {
    try { await removeDirectory.mutateAsync(university._id); toast.success(t('تم تعطيل سجل الجامعة', 'University directory record deactivated')); }
    catch (error) { toast.error(errorMessage(error, t('تعذر تعطيل سجل الجامعة', 'Unable to deactivate university directory record'))); }
    finally { setDeleteCandidate(null); }
  };

  const openAcademicEditor = (editor: AcademicEditor) => { setAcademicEditor(editor); setAcademicForm({ nameAr: '', nameEn: '', slug: '', code: '' }); setAcademicError(''); };
  const submitAcademicItem = async () => {
    if (!academicEditor || !academicForm.nameAr.trim() || !academicForm.slug.trim()) { setAcademicError(t('الاسم العربي والمعرّف مطلوبان', 'Arabic name and slug are required')); return; }
    setAcademicSaving(true);
    try {
      const data = { nameAr: academicForm.nameAr.trim(), nameEn: academicForm.nameEn.trim() || undefined, slug: academicForm.slug.trim(), code: academicForm.code.trim() || undefined };
      if (academicEditor.kind === 'college') await adminApi.addDirectoryCollege(academicEditor.parentId, data);
      else if (academicEditor.kind === 'department') await adminApi.addDirectoryDepartment(academicEditor.parentId, data);
      else await adminApi.addDirectoryMajor(academicEditor.parentId, data);
      await structureQuery.refetch();
      toast.success(t('تمت إضافة العنصر الأكاديمي', 'Academic item added'));
      setAcademicEditor(null);
    } catch (error) { setAcademicError(errorMessage(error, t('تعذرت إضافة العنصر الأكاديمي', 'Unable to add academic item'))); }
    finally { setAcademicSaving(false); }
  };

  const statusLabel = (value: string) => ({
    pending: t('قيد المراجعة', 'Pending'), active: t('نشطة', 'Active'), inactive: t('غير مفعلة', 'Inactive'), suspended: t('معلقة', 'Suspended'),
  }[value] || value);

  const openReview = (university: AdminUniversity, action: ReviewAction) => {
    setReview({ university, action });
    setReason('');
    setReviewError('');
  };

  const confirmReview = async () => {
    if (!review) return;
    if ((review.action === 'reject' || review.action === 'suspend') && !reason.trim()) {
      setReviewError(t('السبب مطلوب', 'Reason is required'));
      return;
    }
    try {
      await mutation.mutateAsync({ university: review.university, action: review.action, reason: reason.trim() });
      toast.success(t('تم تحديث حالة الجامعة', 'University status updated'));
      setReview(null);
    } catch (error) {
      setReviewError(errorMessage(error, t('تعذر تحديث حالة الجامعة', 'Unable to update university status')));
    }
  };

  const reviewTitle = review?.action === 'approve' ? t('اعتماد الجامعة', 'Approve University')
    : review?.action === 'reject' ? t('رفض الطلب', 'Reject Application')
      : review?.action === 'suspend' ? t('تعليق الجامعة', 'Suspend University') : t('إعادة تفعيل الجامعة', 'Reactivate University');

  return <PortalLayout title={t('إدارة الجامعات', 'University Management')} subtitle={t('مراجعة واعتماد حسابات الجامعات', 'Review and manage university accounts')}>
    <ContentCard title={t('الجامعات', 'Universities')} icon={<Building2 size={18} className="text-[#5b5e5a]" />} action={<div className="flex items-center gap-2">{isSuperAdmin && <button type="button" onClick={() => openDirectoryEditor()} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#9fe870] px-4 text-sm font-bold text-[#0e0f0c]"><Plus size={16} />{t('إضافة جامعة', 'Add University')}</button>}<button onClick={() => query.refetch()} disabled={query.isFetching} className="rounded-full border p-2 disabled:opacity-50" style={{ borderColor: '#dfe1dd' }} title={t('تحديث', 'Refresh')}><RefreshCw size={15} className={query.isFetching ? 'animate-spin' : ''} /></button></div>}>
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[250px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#828782]" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('ابحث بالاسم أو البريد...', 'Search by name or email...')} className="h-11 w-full rounded-full border pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#9fe870]" style={{ borderColor: '#dfe1dd' }} /></div>
        <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-11 rounded-full border bg-white px-4 text-sm font-semibold" style={{ borderColor: '#dfe1dd' }}><option value="all">{t('كل الحالات', 'All Statuses')}</option><option value="pending">{t('قيد المراجعة', 'Pending')}</option><option value="active">{t('نشطة', 'Active')}</option><option value="inactive">{t('غير مفعلة', 'Inactive')}</option><option value="suspended">{t('معلقة', 'Suspended')}</option></select>
      </div>

      {query.isLoading ? <div className="flex h-72 items-center justify-center"><Loader2 size={30} className="animate-spin text-[#9fe870]" /></div> : query.isError ? <div className="flex h-72 flex-col items-center justify-center gap-3"><AlertTriangle size={30} className="text-red-600" /><p className="text-sm font-semibold text-[#5b5e5a]">{t('تعذر تحميل الجامعات.', 'Unable to load universities.')}</p><button onClick={() => query.refetch()} className="rounded-full bg-[#9fe870] px-4 py-2 text-sm font-bold">{t('إعادة المحاولة', 'Retry')}</button></div> : !query.data?.items.length ? <p className="py-16 text-center text-sm font-semibold text-[#828782]">{t('لا توجد جامعات مطابقة.', 'No universities match the current filters.')}</p> : <div className="overflow-x-auto"><table className="w-full"><thead><tr className="bg-[#f0f1ee]">{[t('الجامعة', 'University'), t('الموقع', 'Location'), t('التسجيل', 'Registered'), t('الحالة', 'Status'), t('الإجراءات', 'Actions')].map((label) => <th key={label} className="px-4 py-3 text-left text-xs font-bold text-[#5b5e5a]">{label}</th>)}</tr></thead><tbody>{query.data.items.map((university) => {
        const colors = statusColors[university.status] || statusColors.pending;
        const email = typeof university.userId === 'object' ? university.userId.email : university.officialEmail || university.contactInfo?.email;
        const location = [university.city || university.governorate || university.location?.city, university.location?.country].filter(Boolean).join(', ') || t('غير محدد', 'Not specified');
        const logo = university.logoUrl || university.branding?.logoUrl;
        return <tr key={university._id} className="border-b" style={{ borderColor: '#dfe1dd' }}><td className="px-4 py-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f0f1ee]">{logo ? <img src={resolveAssetUrl(logo)} alt={t(`شعار ${university.nameAr || university.name}`, `${university.nameEn || university.name} logo`)} className="h-full w-full object-contain p-1" /> : <Building2 size={18} />}</div><div className="min-w-0"><p className="break-words text-sm font-bold">{isRTL ? university.nameAr || university.name : university.nameEn || university.nameAr || university.name}</p><p className="truncate text-xs text-[#828782]">{email || university.verificationStatus || t('غير محدد', 'Not specified')}</p></div></div></td><td className="px-4 py-3 text-sm font-semibold text-[#5b5e5a]">{location}</td><td className="px-4 py-3 text-sm text-[#5b5e5a]">{new Date(university.submittedAt || university.createdAt || '').toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</td><td className="px-4 py-3"><span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: colors.bg, color: colors.color }}>{statusLabel(university.status)}</span></td><td className="px-4 py-3"><div className="flex items-center gap-1"><button onClick={() => setDetails(university)} title={t('التفاصيل', 'Details')} className="rounded-full p-2 hover:bg-[#f0f1ee]"><Eye size={15} /></button>{isSuperAdmin && <button onClick={() => openDirectoryEditor(university)} title={t('تعديل بيانات الدليل', 'Edit directory record')} className="rounded-full p-2 hover:bg-[#f0f1ee]"><Pencil size={15} /></button>}{isSuperAdmin && !university.userId && <button onClick={() => setDeleteCandidate(university)} title={t('تعطيل السجل', 'Deactivate record')} className="rounded-full p-2 text-red-700 hover:bg-red-50"><Archive size={15} /></button>}{isSuperAdmin && university.status === 'pending' && <><button onClick={() => openReview(university, 'approve')} title={t('موافقة', 'Approve')} className="rounded-full bg-[#E7FDD8] p-2 text-[#1ba442]"><CheckCircle2 size={15} /></button><button onClick={() => openReview(university, 'reject')} title={t('رفض', 'Reject')} className="rounded-full bg-[#FEE2E2] p-2 text-[#B91C1C]"><XCircle size={15} /></button></>}{isSuperAdmin && university.status === 'active' && university.userId && <button onClick={() => openReview(university, 'suspend')} title={t('تعليق', 'Suspend')} className="rounded-full bg-[#FEF3C7] p-2 text-[#B45309]"><PauseCircle size={15} /></button>}{isSuperAdmin && (university.status === 'inactive' || university.status === 'suspended') && university.userId && <button onClick={() => openReview(university, 'reactivate')} title={t('إعادة تفعيل', 'Reactivate')} className="rounded-full bg-[#E7FDD8] p-2 text-[#1ba442]"><RotateCcw size={15} /></button>}</div></td></tr>;
      })}</tbody></table></div>}

      {query.data && query.data.pagination.totalPages > 1 && <div className="mt-4 flex items-center justify-between"><span className="text-xs font-semibold text-[#828782]">{t('الصفحة', 'Page')} {page} {t('من', 'of')} {query.data.pagination.totalPages}</span><div className="flex gap-2"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-full border p-2 disabled:opacity-30"><ChevronLeft size={15} /></button><button onClick={() => setPage((value) => Math.min(query.data!.pagination.totalPages, value + 1))} disabled={page === query.data.pagination.totalPages} className="rounded-full border p-2 disabled:opacity-30"><ChevronRight size={15} /></button></div></div>}
    </ContentCard>

    <Dialog open={Boolean(details)} onOpenChange={(open) => !open && setDetails(null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{isRTL ? details?.nameAr || details?.name : details?.nameEn || details?.nameAr || details?.name}</DialogTitle><DialogDescription>{t('بيانات الجامعة ومصدر التحقق', 'University details and verification source')}</DialogDescription></DialogHeader>
        {details && <div className="space-y-4 text-sm">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><p><strong>{t('المحافظة', 'Governorate')}:</strong> {details.governorate || details.location?.city || t('غير محدد', 'Not specified')}</p><p><strong>{t('حالة التحقق', 'Verification')}:</strong> {details.verificationStatus || t('غير موثق', 'Unverified')}</p><p><strong>{t('الموقع الإلكتروني', 'Website')}:</strong> {details.website || details.contactInfo?.website || t('غير محدد', 'Not specified')}</p><p><strong>{t('آخر تحقق', 'Last verified')}:</strong> {details.lastVerifiedAt ? new Date(details.lastVerifiedAt).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : t('غير محدد', 'Not specified')}</p></div>
          <div><strong>{t('المصادر', 'Sources')}:</strong>{details.sourceUrls?.length ? <ul className="mt-2 space-y-1">{details.sourceUrls.map((url) => <li key={url}><a href={url} target="_blank" rel="noreferrer" className="break-all text-[#167c35] underline">{url}</a></li>)}</ul> : <span> {t('غير محدد', 'Not specified')}</span>}</div>
          <div className="border-t border-[#dfe1dd] pt-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{t('الهيكل الأكاديمي', 'Academic Structure')}</h3>{isSuperAdmin && <button type="button" onClick={() => openAcademicEditor({ kind: 'college', parentId: details._id, parentName: details.nameAr || details.name })} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#dfe1dd] px-3 text-xs font-semibold"><Plus size={14} />{t('إضافة كلية', 'Add College')}</button>}</div>
            {structureQuery.isLoading ? <div className="flex min-h-20 items-center justify-center"><Loader2 size={20} className="animate-spin" /></div> : structureQuery.isError ? <button type="button" onClick={() => structureQuery.refetch()} className="min-h-11 rounded-xl border px-4">{t('إعادة تحميل الهيكل', 'Retry structure')}</button> : structureQuery.data?.colleges?.length ? <div className="space-y-3">{structureQuery.data.colleges.map((college: any) => <div key={college.id} className="rounded-xl border border-[#dfe1dd] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{isRTL ? college.nameAr : college.nameEn || college.nameAr}</p>{isSuperAdmin && <button type="button" onClick={() => openAcademicEditor({ kind: 'department', parentId: college.id, parentName: college.nameAr })} className="inline-flex min-h-9 items-center gap-1 rounded-full border px-3 text-xs"><Plus size={13} />{t('قسم', 'Department')}</button>}</div><div className="mt-2 space-y-2">{college.departments?.map((department: any) => <div key={department.id} className="rounded-lg bg-[#f0f1ee] p-2"><div className="flex flex-wrap items-center justify-between gap-2"><span>{isRTL ? department.nameAr : department.nameEn || department.nameAr}</span>{isSuperAdmin && <button type="button" onClick={() => openAcademicEditor({ kind: 'major', parentId: department.id, parentName: department.nameAr })} className="inline-flex min-h-9 items-center gap-1 rounded-full bg-white px-3 text-xs"><Plus size={13} />{t('تخصص', 'Major')}</button>}</div>{department.majors?.length > 0 && <p className="mt-1 text-xs text-[#5b5e5a]">{department.majors.map((major: any) => isRTL ? major.nameAr : major.nameEn || major.nameAr).join('، ')}</p>}</div>)}</div></div>)}</div> : <p className="rounded-xl bg-[#f0f1ee] p-4 text-[#5b5e5a]">{t('لا توجد كليات مسجلة.', 'No colleges are registered.')}</p>}
          </div>
          {details.rejectionReason && <p className="rounded-xl bg-red-50 p-3 text-red-700"><strong>{t('سبب الرفض', 'Rejection Reason')}:</strong> {details.rejectionReason}</p>}{details.suspensionReason && <p className="rounded-xl bg-red-50 p-3 text-red-700"><strong>{t('سبب التعليق', 'Suspension Reason')}:</strong> {details.suspensionReason}</p>}
        </div>}
      </DialogContent>
    </Dialog>

    <Dialog open={Boolean(academicEditor)} onOpenChange={(open) => !open && !academicSaving && setAcademicEditor(null)}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{academicEditor?.kind === 'college' ? t('إضافة كلية', 'Add College') : academicEditor?.kind === 'department' ? t('إضافة قسم', 'Add Department') : t('إضافة تخصص', 'Add Major')}</DialogTitle><DialogDescription>{academicEditor?.parentName}</DialogDescription></DialogHeader><div className="space-y-3"><label><span className="mb-1 block text-xs font-semibold">{t('الاسم العربي', 'Arabic name')} *</span><input value={academicForm.nameAr} onChange={(e) => setAcademicForm((v) => ({ ...v, nameAr: e.target.value }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] px-3" dir="rtl" /></label><label><span className="mb-1 block text-xs font-semibold">{t('الاسم الإنجليزي', 'English name')}</span><input value={academicForm.nameEn} onChange={(e) => setAcademicForm((v) => ({ ...v, nameEn: e.target.value }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] px-3" dir="ltr" /></label><label><span className="mb-1 block text-xs font-semibold">Slug *</span><input value={academicForm.slug} onChange={(e) => setAcademicForm((v) => ({ ...v, slug: e.target.value }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] px-3" dir="ltr" /></label><label><span className="mb-1 block text-xs font-semibold">{t('الرمز', 'Code')}</span><input value={academicForm.code} onChange={(e) => setAcademicForm((v) => ({ ...v, code: e.target.value }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] px-3" dir="ltr" /></label></div>{academicError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{academicError}</p>}<DialogFooter className="gap-2"><button type="button" onClick={() => setAcademicEditor(null)} disabled={academicSaving} className="min-h-11 rounded-full border px-5 text-sm font-semibold disabled:opacity-50">{t('إلغاء', 'Cancel')}</button><button type="button" onClick={submitAcademicItem} disabled={academicSaving} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#9fe870] px-5 text-sm font-bold disabled:opacity-50">{academicSaving && <Loader2 size={15} className="animate-spin" />}{t('إضافة', 'Add')}</button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(directoryEditor)} onOpenChange={(open) => !open && !saveDirectory.isPending && setDirectoryEditor(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{directoryEditor === 'new' ? t('إضافة جامعة', 'Add University') : t('تعديل بيانات الجامعة', 'Edit University')}</DialogTitle><DialogDescription>{t('تُحفظ البيانات في دليل MongoDB وتظهر في التسجيل والملف الشخصي.', 'Data is stored in the MongoDB directory and used by registration and profiles.')}</DialogDescription></DialogHeader><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label><span className="mb-1 block text-xs font-semibold">{t('الاسم العربي', 'Arabic name')} *</span><input value={directoryForm.nameAr} onChange={(e) => setDirectoryForm((v) => ({ ...v, nameAr: e.target.value }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] px-3" dir="rtl" /></label>
      <label><span className="mb-1 block text-xs font-semibold">{t('الاسم الإنجليزي', 'English name')}</span><input value={directoryForm.nameEn || ''} onChange={(e) => setDirectoryForm((v) => ({ ...v, nameEn: e.target.value }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] px-3" dir="ltr" /></label>
      <label><span className="mb-1 block text-xs font-semibold">Slug *</span><input value={directoryForm.slug} onChange={(e) => setDirectoryForm((v) => ({ ...v, slug: e.target.value }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] px-3" dir="ltr" /></label>
      <label><span className="mb-1 block text-xs font-semibold">{t('المحافظة', 'Governorate')} *</span><input value={directoryForm.governorate} onChange={(e) => setDirectoryForm((v) => ({ ...v, governorate: e.target.value }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] px-3" /></label>
      <label><span className="mb-1 block text-xs font-semibold">{t('المدينة', 'City')}</span><input value={directoryForm.city || ''} onChange={(e) => setDirectoryForm((v) => ({ ...v, city: e.target.value }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] px-3" /></label>
      <label><span className="mb-1 block text-xs font-semibold">{t('نوع المؤسسة', 'Institution type')}</span><select value={directoryForm.institutionType} onChange={(e) => setDirectoryForm((v) => ({ ...v, institutionType: e.target.value as DirectoryUniversityInput['institutionType'] }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] bg-white px-3"><option value="public_university">{t('جامعة حكومية', 'Public university')}</option><option value="private_university">{t('جامعة أهلية', 'Private university')}</option><option value="community_college">{t('كلية مجتمع', 'Community college')}</option><option value="university_college">{t('كلية جامعية', 'University college')}</option><option value="institute">{t('معهد', 'Institute')}</option><option value="academy">{t('أكاديمية', 'Academy')}</option></select></label>
      <label><span className="mb-1 block text-xs font-semibold">{t('الملكية', 'Ownership')}</span><select value={directoryForm.ownership} onChange={(e) => setDirectoryForm((v) => ({ ...v, ownership: e.target.value as DirectoryUniversityInput['ownership'] }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] bg-white px-3"><option value="public">{t('حكومية', 'Public')}</option><option value="private">{t('أهلية', 'Private')}</option><option value="mixed">{t('مختلطة', 'Mixed')}</option></select></label>
      <label><span className="mb-1 block text-xs font-semibold">{t('حالة التحقق', 'Verification')}</span><select value={directoryForm.verificationStatus} onChange={(e) => setDirectoryForm((v) => ({ ...v, verificationStatus: e.target.value as DirectoryUniversityInput['verificationStatus'] }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] bg-white px-3"><option value="verified">{t('موثقة', 'Verified')}</option><option value="partially_verified">{t('موثقة جزئياً', 'Partially verified')}</option><option value="unverified">{t('غير موثقة', 'Unverified')}</option></select></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold">{t('الموقع الرسمي', 'Official website')}</span><input value={directoryForm.website || ''} onChange={(e) => setDirectoryForm((v) => ({ ...v, website: e.target.value }))} className="h-11 w-full rounded-xl border border-[#dfe1dd] px-3" dir="ltr" placeholder="https://example.edu" /></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold">{t('روابط المصادر الرسمية، رابط في كل سطر', 'Official source URLs, one per line')}</span><textarea rows={3} value={(directoryForm.sourceUrls || []).join('\n')} onChange={(e) => setDirectoryForm((v) => ({ ...v, sourceUrls: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) }))} className="w-full rounded-xl border border-[#dfe1dd] p-3" dir="ltr" /></label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold">{t('شعار الجامعة', 'University logo')}</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0] || null; if (file && file.size > 5 * 1024 * 1024) { setDirectoryError(t('حجم الشعار يجب ألا يتجاوز 5 ميجابايت', 'Logo must not exceed 5 MB')); e.target.value = ''; return; } setDirectoryLogo(file); setDirectoryError(''); }} className="min-h-11 w-full rounded-xl border border-[#dfe1dd] bg-white p-2 text-sm" /><span className="mt-1 block text-xs text-[#5b5e5a]">PNG, JPEG, WebP - 5 MB</span></label>
    </div>{directoryError && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{directoryError}</p>}<DialogFooter className="gap-2"><button type="button" onClick={() => setDirectoryEditor(null)} disabled={saveDirectory.isPending} className="min-h-11 rounded-full border px-5 text-sm font-semibold">{t('إلغاء', 'Cancel')}</button><button type="button" onClick={submitDirectory} disabled={saveDirectory.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#9fe870] px-5 text-sm font-bold disabled:opacity-50">{saveDirectory.isPending && <Loader2 size={16} className="animate-spin" />}{t('حفظ', 'Save')}</button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(deleteCandidate)} onOpenChange={(open) => !open && !removeDirectory.isPending && setDeleteCandidate(null)}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{t('تعطيل سجل الجامعة', 'Deactivate University Record')}</DialogTitle><DialogDescription>{t('لن يسمح النظام بالتعطيل إذا كان السجل مرتبطاً بطلاب أو حساب جامعة.', 'The system will refuse this action when the record is linked to students or an institutional account.')}</DialogDescription></DialogHeader><p className="font-semibold">{deleteCandidate?.nameAr || deleteCandidate?.name}</p><DialogFooter className="gap-2"><button type="button" onClick={() => setDeleteCandidate(null)} disabled={removeDirectory.isPending} className="min-h-11 rounded-full border px-5 text-sm font-semibold">{t('إلغاء', 'Cancel')}</button><button type="button" onClick={() => deleteCandidate && softDeleteDirectory(deleteCandidate)} disabled={removeDirectory.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-red-700 px-5 text-sm font-semibold text-white disabled:opacity-50">{removeDirectory.isPending && <Loader2 size={16} className="animate-spin" />}{t('تعطيل', 'Deactivate')}</button></DialogFooter></DialogContent></Dialog>

    <Dialog open={Boolean(review)} onOpenChange={(open) => !open && !mutation.isPending && setReview(null)}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{reviewTitle}</DialogTitle><DialogDescription>{review?.university.name}</DialogDescription></DialogHeader>{(review?.action === 'reject' || review?.action === 'suspend') && <div className="space-y-3"><label><span className="mb-2 block text-xs font-bold text-[#5b5e5a]">{t('السبب', 'Reason')} *</span><textarea value={reason} onChange={(event) => { setReason(event.target.value); setReviewError(''); }} rows={4} maxLength={1000} className="w-full rounded-xl border p-3 text-sm outline-none focus:border-[#9fe870]" style={{ borderColor: reviewError ? '#dc2626' : '#dfe1dd' }} /></label><div className="flex flex-wrap gap-2"><DevelopmentAutofillButton onClick={() => setReason(review.action === 'reject' ? generateRejectionReason() : generateSuspensionReason())} label={t('تعبئة سبب تجريبي', 'Fill Test Reason')} /><button type="button" onClick={() => setReason('')} className="rounded-full border px-3 py-2 text-xs font-semibold">{t('مسح', 'Clear')}</button></div></div>}{reviewError && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{reviewError}</p>}<DialogFooter className="gap-2"><button onClick={() => setReview(null)} disabled={mutation.isPending} className="rounded-full border px-5 py-2 text-sm font-semibold disabled:opacity-50">{t('إلغاء', 'Cancel')}</button><button onClick={confirmReview} disabled={mutation.isPending} className="inline-flex items-center gap-2 rounded-full bg-[#9fe870] px-5 py-2 text-sm font-bold disabled:opacity-50">{mutation.isPending && <Loader2 size={15} className="animate-spin" />}{t('تأكيد', 'Confirm')}</button></DialogFooter></DialogContent></Dialog>
  </PortalLayout>;
}
