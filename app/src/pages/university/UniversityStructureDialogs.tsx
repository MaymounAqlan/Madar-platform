import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type {
  CreateCollegeRequest, CreateDepartmentRequest, UniversityCollege, UniversityDepartment,
  UpdateCollegeRequest, UpdateDepartmentRequest,
} from '@/types/university.types';
import { Loader2 } from 'lucide-react';
import DevelopmentAutofillButton from '@/components/DevelopmentAutofillButton';
import { generateCollegeTestData, generateDepartmentTestData } from '@/utils/testDataGenerator';

const inputClass = 'h-10 w-full rounded-lg border px-3 text-sm outline-none focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]';
const labelClass = 'mb-1.5 block text-xs font-bold text-[#5b5e5a]';

interface CollegeFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: UniversityCollege;
  submitting: boolean;
  serverError: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateCollegeRequest | UpdateCollegeRequest) => Promise<void>;
  t: (ar: string, en: string) => string;
}

export function CollegeFormDialog({ open, mode, initial, submitting, serverError, onOpenChange, onSubmit, t }: CollegeFormDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [dean, setDean] = useState('');
  const [established, setEstablished] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || '');
    setCode(initial?.code || '');
    setDescription(initial?.description || '');
    setDean(initial?.dean || '');
    setEstablished(initial?.established?.toString() || '');
    setNameError('');
  }, [open, initial]);

  const changed = useMemo(() => mode === 'create' || (
    name.trim() !== (initial?.name || '') || code.trim() !== (initial?.code || '') ||
    description.trim() !== (initial?.description || '') || dean.trim() !== (initial?.dean || '') ||
    established.trim() !== (initial?.established?.toString() || '')
  ), [mode, name, code, description, dean, established, initial]);

  const reset = () => {
    setName(initial?.name || ''); setCode(initial?.code || ''); setDescription(initial?.description || '');
    setDean(initial?.dean || ''); setEstablished(initial?.established?.toString() || ''); setNameError('');
  };

  const autofill = () => {
    const data = generateCollegeTestData();
    setName(data.name); setCode(data.code); setDescription(data.description); setDean(data.dean); setEstablished(String(data.established)); setNameError('');
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setNameError(t('اسم الكلية مطلوب', 'College name is required'));
      return;
    }
    setNameError('');
    const all: CreateCollegeRequest = {
      name: cleanName,
      ...(code.trim() ? { code: code.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(dean.trim() ? { dean: dean.trim() } : {}),
      ...(established ? { established: Number(established) } : {}),
    };
    if (mode === 'create') return onSubmit(all);
    const update: UpdateCollegeRequest = {};
    if (all.name !== initial?.name) update.name = all.name;
    if ((all.code || '') !== (initial?.code || '')) update.code = all.code || '';
    if ((all.description || '') !== (initial?.description || '')) update.description = all.description || '';
    if ((all.dean || '') !== (initial?.dean || '')) update.dean = all.dean || '';
    if (all.established !== initial?.established) update.established = all.established;
    await onSubmit(update);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('إضافة كلية', 'Add College') : t('تعديل الكلية', 'Edit College')}</DialogTitle>
          <DialogDescription>{t('أدخل البيانات الأكاديمية المعتمدة للكلية.', 'Enter the official academic information for the college.')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div><label className={labelClass}>{t('اسم الكلية', 'College Name')} *</label><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={160} disabled={submitting} />{nameError && <p className="mt-1 text-xs font-semibold text-red-600">{nameError}</p>}</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={labelClass}>{t('الرمز', 'Code')}</label><input value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} maxLength={30} disabled={submitting} /></div>
            <div><label className={labelClass}>{t('سنة التأسيس', 'Established Year')}</label><input value={established} onChange={(e) => setEstablished(e.target.value)} className={inputClass} type="number" min="1800" max="2100" disabled={submitting} /></div>
          </div>
          <div><label className={labelClass}>{t('العميد', 'Dean')}</label><input value={dean} onChange={(e) => setDean(e.target.value)} className={inputClass} maxLength={160} disabled={submitting} /></div>
          <div><label className={labelClass}>{t('الوصف', 'Description')}</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24 w-full rounded-lg border p-3 text-sm outline-none focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]" maxLength={2000} disabled={submitting} /></div>
          {serverError && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{serverError}</p>}
          <div className="flex flex-wrap gap-2"><DevelopmentAutofillButton onClick={autofill} label={t('تعبئة بيانات تجريبية', 'Fill Test Data')} /><button type="button" onClick={reset} disabled={submitting} className="rounded-full border px-3 py-2 text-xs font-semibold disabled:opacity-50">{mode === 'edit' ? t('استرجاع القيم الأصلية', 'Restore Original Values') : t('مسح الحقول', 'Clear Fields')}</button></div>
          <DialogFooter className="gap-2">
            <button type="button" onClick={() => onOpenChange(false)} disabled={submitting} className="rounded-full border px-5 py-2 text-sm font-semibold disabled:opacity-50">{t('إلغاء', 'Cancel')}</button>
            <button type="submit" disabled={submitting || !changed} className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: '#9fe870', color: '#0e0f0c' }}>{submitting && <Loader2 size={15} className="animate-spin" />}{t('حفظ', 'Save')}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DepartmentFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  collegeName: string;
  initial?: UniversityDepartment;
  submitting: boolean;
  serverError: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: CreateDepartmentRequest | UpdateDepartmentRequest) => Promise<void>;
  t: (ar: string, en: string) => string;
}

export function DepartmentFormDialog({ open, mode, collegeName, initial, submitting, serverError, onOpenChange, onSubmit, t }: DepartmentFormDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [head, setHead] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name || '');
    setCode(initial?.code || '');
    setDescription(initial?.description || '');
    setHead(initial?.head || '');
    setNameError('');
  }, [open, initial]);

  const changed = mode === 'create' || name.trim() !== (initial?.name || '') || code.trim() !== (initial?.code || '') || description.trim() !== (initial?.description || '') || head.trim() !== (initial?.head || '');
  const reset = () => { setName(initial?.name || ''); setCode(initial?.code || ''); setDescription(initial?.description || ''); setHead(initial?.head || ''); setNameError(''); };
  const autofill = () => { const data = generateDepartmentTestData(); setName(data.name); setCode(data.code); setDescription(data.description); setHead(data.head); setNameError(''); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setNameError(t('اسم القسم مطلوب', 'Department name is required'));
      return;
    }
    setNameError('');
    const all: CreateDepartmentRequest = { name: name.trim(), ...(code.trim() ? { code: code.trim() } : {}), ...(description.trim() ? { description: description.trim() } : {}), ...(head.trim() ? { head: head.trim() } : {}) };
    if (mode === 'create') return onSubmit(all);
    const update: UpdateDepartmentRequest = {};
    if (all.name !== initial?.name) update.name = all.name;
    if ((all.code || '') !== (initial?.code || '')) update.code = all.code || '';
    if ((all.description || '') !== (initial?.description || '')) update.description = all.description || '';
    if ((all.head || '') !== (initial?.head || '')) update.head = all.head || '';
    await onSubmit(update);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>{mode === 'create' ? t('إضافة قسم', 'Add Department') : t('تعديل القسم', 'Edit Department')}</DialogTitle><DialogDescription>{collegeName}</DialogDescription></DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div><label className={labelClass}>{t('اسم القسم', 'Department Name')} *</label><input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={160} disabled={submitting} />{nameError && <p className="mt-1 text-xs font-semibold text-red-600">{nameError}</p>}</div>
          <div><label className={labelClass}>{t('الرمز', 'Code')}</label><input value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} maxLength={30} disabled={submitting} /></div>
          <div><label className={labelClass}>{t('رئيس القسم', 'Department Head')}</label><input value={head} onChange={(e) => setHead(e.target.value)} className={inputClass} maxLength={160} disabled={submitting} /></div>
          <div><label className={labelClass}>{t('الوصف', 'Description')}</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24 w-full rounded-lg border p-3 text-sm outline-none focus:border-[#9fe870] focus:ring-2 focus:ring-[#E7FDD8]" maxLength={2000} disabled={submitting} /></div>
          {serverError && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{serverError}</p>}
          <div className="flex flex-wrap gap-2"><DevelopmentAutofillButton onClick={autofill} label={t('تعبئة بيانات تجريبية', 'Fill Test Data')} /><button type="button" onClick={reset} disabled={submitting} className="rounded-full border px-3 py-2 text-xs font-semibold disabled:opacity-50">{mode === 'edit' ? t('استرجاع القيم الأصلية', 'Restore Original Values') : t('مسح الحقول', 'Clear Fields')}</button></div>
          <DialogFooter className="gap-2"><button type="button" onClick={() => onOpenChange(false)} disabled={submitting} className="rounded-full border px-5 py-2 text-sm font-semibold disabled:opacity-50">{t('إلغاء', 'Cancel')}</button><button type="submit" disabled={submitting || !changed} className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50" style={{ background: '#9fe870', color: '#0e0f0c' }}>{submitting && <Loader2 size={15} className="animate-spin" />}{t('حفظ', 'Save')}</button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  submitting: boolean;
  error: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  cancelLabel: string;
  destructive?: boolean;
}

export function ConfirmActionDialog({ open, title, description, confirmLabel, submitting, error, onOpenChange, onConfirm, cancelLabel, destructive = true }: ConfirmActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>{error && <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<DialogFooter className="gap-2"><button onClick={() => onOpenChange(false)} disabled={submitting} className="rounded-full border px-5 py-2 text-sm font-semibold disabled:opacity-50">{cancelLabel}</button><button onClick={onConfirm} disabled={submitting} className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50 ${destructive ? 'bg-red-600 text-white' : 'bg-[#9fe870] text-[#0e0f0c]'}`}>{submitting && <Loader2 size={15} className="animate-spin" />}{confirmLabel}</button></DialogFooter></DialogContent>
    </Dialog>
  );
}
