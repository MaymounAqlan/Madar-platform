import { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  useEmailMonitoring, useTestSmtpConnection, useEmailTemplates, useEmailTemplate,
  useUpdateEmailTemplate, useRollbackEmailTemplate, useNotificationPolicies,
  useUpdateNotificationPolicy, useNotificationDeliveryLogs, useUpdatePlatformSettings,
  usePlatformSettings, useCreateEmailTemplate, useSendTestEmail,
} from '@/hooks/useAdmin';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import StatusBadge from '@/components/StatusBadge';
import {
  Mail, RefreshCw, Send, FileText, Edit3, Eye, RotateCcw, Save,
  Bell, CheckCircle2, XCircle, ChevronDown, ChevronUp, Settings2,
  Loader2, AlertTriangle, Search, Filter, Plus, Sparkles, Code, Copy, X,
  KeyRound, ShieldCheck, UserPlus, GraduationCap, Building2, FileCheck2,
  Award, ShieldAlert, Cpu, BellRing, Lock, Briefcase, Paintbrush, Moon, Droplets, Sun
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabId = 'templates' | 'smtp' | 'notifications' | 'logs';

export default function AdminEmail() {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabId>('templates');

  const tabs: { id: TabId; label: string; en: string; icon: React.ReactNode }[] = [
    { id: 'templates', label: 'قوالب البريد', en: 'Email Templates', icon: <FileText size={16} /> },
    { id: 'smtp', label: 'إعدادات SMTP', en: 'SMTP Settings', icon: <Settings2 size={16} /> },
    { id: 'notifications', label: 'سياسات الإشعارات', en: 'Notification Policies', icon: <Bell size={16} /> },
    { id: 'logs', label: 'سجلات التسليم', en: 'Delivery Logs', icon: <Search size={16} /> },
  ];

  return (
    <PortalLayout
      title={t('البريد والإشعارات', 'Email & Notifications')}
      subtitle={t('إدارة قوالب البريد وإعدادات الإرسال وسياسات الإشعارات', 'Manage email templates, sending settings, and notification policies')}
    >
      <div className={cn("space-y-6", isRTL ? "rtl" : "ltr")}>
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 rounded-2xl border p-1.5" style={{ borderColor: '#dfe1dd', background: '#f0f1ee' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                activeTab === tab.id
                  ? "shadow-sm"
                  : "hover:bg-white/50"
              )}
              style={{
                background: activeTab === tab.id ? '#ffffff' : 'transparent',
                color: activeTab === tab.id ? '#0e0f0c' : '#5b5e5a',
              }}
            >
              {tab.icon}
              {t(tab.label, tab.en)}
            </button>
          ))}
        </div>

        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'smtp' && <SmtpTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'logs' && <DeliveryLogsTab />}
      </div>
    </PortalLayout>
  );
}

// ==========================================
// Template Icon & Aesthetics Mapping
// ==========================================
function getTemplateIconAndTheme(key: string) {
  switch (key) {
    case 'forgot_password':
      return {
        icon: <KeyRound size={20} className="text-[#d97706]" />,
        bg: 'bg-[#fffbeb]',
        border: 'border-[#fde68a]',
        badge: 'أمان المرور',
      };
    case 'email_verification':
      return {
        icon: <ShieldCheck size={20} className="text-[#12b76a]" />,
        bg: 'bg-[#ecfdf3]',
        border: 'border-[#abefc6]',
        badge: 'التحقق والدخول',
      };
    case 'staff_invitation':
      return {
        icon: <UserPlus size={20} className="text-[#0284c7]" />,
        bg: 'bg-[#f0f9ff]',
        border: 'border-[#b9e6fe]',
        badge: 'دعوة موظفين',
      };
    case 'university_approval':
      return {
        icon: <GraduationCap size={20} className="text-[#2563eb]" />,
        bg: 'bg-[#eff6ff]',
        border: 'border-[#bfdbfe]',
        badge: 'تفعيل أكاديمي',
      };
    case 'company_approval':
      return {
        icon: <Building2 size={20} className="text-[#7c3aed]" />,
        bg: 'bg-[#f5f3ff]',
        border: 'border-[#ddd6fe]',
        badge: 'اعتماد تجاري',
      };
    case 'application_status_change':
      return {
        icon: <FileCheck2 size={20} className="text-[#059669]" />,
        bg: 'bg-[#ecfdf5]',
        border: 'border-[#a7f3d0]',
        badge: 'حالة الطلبات',
      };
    case 'certificate_issued':
      return {
        icon: <Award size={20} className="text-[#d97706]" />,
        bg: 'bg-[#fffbeb]',
        border: 'border-[#fde68a]',
        badge: 'شهادة معتمدة',
      };
    case 'security_alert':
      return {
        icon: <ShieldAlert size={20} className="text-[#dc2626]" />,
        bg: 'bg-[#fef2f2]',
        border: 'border-[#fecaca]',
        badge: 'تنبيه أمني',
      };
    case 'ai_operation_status':
      return {
        icon: <Cpu size={20} className="text-[#9333ea]" />,
        bg: 'bg-[#faf5ff]',
        border: 'border-[#e9d5ff]',
        badge: 'خوارزمية الذكاء',
      };
    case 'general_notification':
    default:
      return {
        icon: <BellRing size={20} className="text-[#272925]" />,
        bg: 'bg-[#f0f1ee]',
        border: 'border-[#dfe1dd]',
        badge: 'إشعار عام',
      };
  }
}

// ==========================================
// Template Card Component (Code, Color Swatches, Inline Preview & Quick Theme Presets)
// ==========================================
function TemplateCard({ tpl, onSelectKey }: { tpl: any; onSelectKey: (key: string) => void }) {
  const { t, isRTL } = useLanguage();
  const updateMutation = useUpdateEmailTemplate();
  const testEmailMutation = useSendTestEmail();

  const [expandedPreview, setExpandedPreview] = useState(false);
  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('admin@madar.sa');

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(t(`تم نسخ المفتاح ${code}`, `Copied key ${code}`));
  };

  const handleApplyPreset = async (preset: any) => {
    try {
      await updateMutation.mutateAsync({
        key: tpl.key,
        data: {
          ...tpl,
          styles: {
            ...tpl.styles,
            ...preset,
          },
        },
      });
      toast.success(t('تم تحديث ألوان القالب بنجاح', 'Template color scheme updated successfully'));
    } catch (e: any) {
      toast.error(t('فشل تحديث الألوان', 'Failed to update colors'));
    }
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    try {
      const res = await testEmailMutation.mutateAsync({ key: tpl.key, email: testEmail });
      toast.success(res.message || t('تم إرسال البريد التجريبي بنجاح!', 'Test email sent successfully!'));
      setShowTestModal(false);
    } catch (e: any) {
      toast.error(t('فشل إرسال البريد التجريبي', 'Failed to send test email'));
    }
  };

  const styles = tpl.styles || {
    backgroundColor: '#f0f1ee',
    cardColor: '#ffffff',
    textColor: '#1d1e1c',
    buttonColor: '#9fe870',
    buttonTextColor: '#272925',
  };

  const subject = previewLang === 'ar' ? (tpl.subjectAr || tpl.name) : (tpl.subjectEn || tpl.name);
  const body = previewLang === 'ar' ? (tpl.bodyAr || '') : (tpl.bodyEn || '');
  const aesthetic = getTemplateIconAndTheme(tpl.key);

  // Split name if it contains slash
  const [nameAr, nameEn] = tpl.name?.split(' / ') || [tpl.name, ''];

  return (
    <div className="rounded-xl border bg-white shadow-xs transition-colors hover:border-[#dfe1dd] group overflow-hidden flex flex-col" style={{ borderColor: '#f0f1ee' }}>
      
      {/* 1. Header (Icon, Names, Status) */}
      <div className="flex items-start justify-between p-4 border-b border-[#f0f1ee]/60">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f9faf8] border border-[#f0f1ee] text-[#5b5e5a] transition-colors group-hover:bg-[#f0f1ee]">
            {aesthetic.icon}
          </div>
          <div className="flex flex-col gap-0.5">
            <h4 className="text-sm font-bold text-[#1d1e1c] leading-tight">{nameAr}</h4>
            {nameEn && <span className="text-xs text-[#828782] font-medium leading-tight" dir="ltr">{nameEn}</span>}
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-[10px] text-[#5b5e5a] bg-[#f9faf8] px-2 py-0.5 rounded border border-[#f0f1ee] flex items-center gap-1">
                {tpl.key}
                <button onClick={() => copyCode(tpl.key)} className="hover:text-[#1d1e1c] cursor-pointer" title={t('نسخ المفتاح', 'Copy')}>
                  <Copy size={10} />
                </button>
              </span>
              <span className="text-[10px] font-medium text-[#828782]">{t('الإصدار', 'v')}{tpl.currentVersion || 1}</span>
              {tpl.isActive ? (
                <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>{t('مفعّل', 'Active')}</span>
              ) : (
                <span className="text-[10px] font-medium text-amber-600 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"/>{t('معطّل', 'Inactive')}</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Dropdown / Secondary Actions can go here if needed, keeping it clean for now */}
        <div className="flex items-center gap-1.5">
           <button
            onClick={() => setExpandedPreview(!expandedPreview)}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#f0f1ee] text-[#828782] hover:bg-[#f9faf8] hover:text-[#1d1e1c] transition-colors cursor-pointer"
            title={expandedPreview ? t('إخفاء المعاينة', 'Hide Preview') : t('معاينة سريعة', 'Quick Preview')}
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#f0f1ee] text-[#828782] hover:bg-emerald-50 hover:border-emerald-100 hover:text-emerald-600 transition-colors cursor-pointer"
            title={t('إرسال تجريبي', 'Test Email')}
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* 2. Template Info (Subjects) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-3 bg-[#f9faf8]/50 text-xs text-[#5b5e5a] border-b border-[#f0f1ee]/60">
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-[#828782]">{t('عنوان البريد (عربي)', 'Subject (AR)')}</span>
          <span className="font-bold text-[#1d1e1c] line-clamp-1">{tpl.subjectAr || '—'}</span>
        </div>
        <div dir="ltr" className="flex flex-col gap-0.5 text-left">
          <span className="font-medium text-[#828782]">Subject (EN)</span>
          <span className="font-bold text-[#1d1e1c] line-clamp-1">{tpl.subjectEn || '—'}</span>
        </div>
      </div>

      {/* 3. Primary Action */}
      <div className="p-3 bg-white flex justify-end">
        <button
          onClick={() => onSelectKey(tpl.key)}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors cursor-pointer bg-[#9fe870] text-[#272925] hover:bg-[#8bd95c]"
        >
          <Edit3 size={14} />
          {t('تخصيص القالب', 'Customize Template')}
        </button>
      </div>

      {/* Expanded Inline Live Preview */}
      {expandedPreview && (
        <div className="bg-[#f0f1ee]/50 border-t border-[#f0f1ee]/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#1d1e1c] flex items-center gap-1.5">
              <Eye size={14} className="text-[#828782]" />
              {t('المعاينة الحية التفاعلية للقالب', 'Interactive Live HTML Preview')}
            </span>
            <div className="flex gap-1 rounded-lg border p-1 bg-white" style={{ borderColor: '#dfe1dd' }}>
              <button onClick={() => setPreviewLang('ar')} className={cn("rounded-md px-3 py-1 text-[11px] font-bold cursor-pointer transition-colors", previewLang === 'ar' ? 'bg-[#f0f1ee] text-[#1d1e1c]' : 'text-[#828782] hover:text-[#1d1e1c]')}>عربي</button>
              <button onClick={() => setPreviewLang('en')} className={cn("rounded-md px-3 py-1 text-[11px] font-bold cursor-pointer transition-colors", previewLang === 'en' ? 'bg-[#f0f1ee] text-[#1d1e1c]' : 'text-[#828782] hover:text-[#1d1e1c]')}>English</button>
            </div>
          </div>

          <div className="rounded-2xl border p-4 shadow-inner" style={{ borderColor: '#dfe1dd', background: styles.backgroundColor }}>
            <div className="mx-auto max-w-md rounded-2xl p-5 shadow-sm" style={{ background: styles.cardColor, fontFamily: 'Tajawal, sans-serif' }}>
              <h4 className="mb-2 text-sm font-black border-b pb-2" style={{ color: styles.textColor, borderColor: '#dfe1dd' }} dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                {subject}
              </h4>
              <p className="whitespace-pre-wrap text-xs font-medium leading-relaxed" style={{ color: styles.textColor }} dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                {body.replace(/\{\{(\w+)\}\}/g, (_: string, name: string) => `[${name}]`)}
              </p>
              <div className="mt-4 text-center">
                <span className="inline-block rounded-xl px-5 py-2 text-xs font-black shadow-2xs cursor-pointer" style={{ background: styles.buttonColor, color: styles.buttonTextColor }}>
                  {previewLang === 'ar' ? 'انقر هنا للانتقال' : 'Click Here'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1e1c]/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4 border border-[#dfe1dd] text-right font-sans">
            <div className="flex items-center justify-between border-b border-[#f0f1ee] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f1ee] text-[#5b5e5a] border border-[#dfe1dd]">
                  <Send size={14} />
                </div>
                <h3 className="text-sm font-bold text-[#1d1e1c]">{t('إرسال بريد تجريبي للقالب', 'Send Test Email for Template')}</h3>
              </div>
              <button onClick={() => setShowTestModal(false)} className="rounded-full p-1.5 hover:bg-[#f0f1ee] text-[#5b5e5a] cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-[#1d1e1c] mb-1">{tpl.name} <code className="text-[#5e615c]">({tpl.key})</code></p>
              <label className="mb-1 block text-xs font-bold text-[#5e615c] mt-2">{t('البريد الإلكتروني للمستلم', 'Recipient Email')}</label>
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="admin@madar.sa"
                className="w-full rounded-xl border px-3 py-2.5 text-xs font-medium" style={{ borderColor: '#dfe1dd' }} dir="ltr"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-[#f0f1ee] pt-4">
              <button
                onClick={() => setShowTestModal(false)}
                className="rounded-lg border px-4 py-2 text-xs font-bold hover:bg-[#f9faf8] cursor-pointer transition-colors"
                style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}
              >
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                onClick={handleSendTest}
                disabled={testEmailMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors bg-[#9fe870] text-[#272925] hover:bg-[#8bd95c] cursor-pointer disabled:opacity-50"
              >
                {testEmailMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {t('إرسال الآن', 'Send Test Email')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const DEFAULT_EMAIL_TEMPLATES = [
  {
    key: 'forgot_password',
    name: 'استعادة كلمة المرور / Password Reset',
    subjectAr: 'طلب استعادة كلمة المرور لمرشح منصة مدار',
    subjectEn: 'MADAR Account Password Reset Request',
    bodyAr: 'مرحباً {{userName}}، تلبيتاً لطلبك، يرجى استكمال عملية تعيين كلمة المرور الجديدة عبر الرابط: {{resetUrl}}',
    bodyEn: 'Hello {{userName}}, please use the link to reset your account password: {{resetUrl}}',
    isActive: true,
    currentVersion: 1,
    styles: { backgroundColor: '#f0f1ee', cardColor: '#ffffff', textColor: '#1d1e1c', buttonColor: '#9fe870', buttonTextColor: '#272925' },
  },
  {
    key: 'email_verification',
    name: 'رمز تأكيد وتفعيل الحساب وتطبيقات الدخول / Account & Login Verification',
    subjectAr: 'رمز التحقق والتفعيل الخاص بحسابك في منصة مدار',
    subjectEn: 'Your MADAR Account Verification Code',
    bodyAr: 'مرحباً {{userName}}، رمز التفعيل والتحقق الخاص بحسابك هو: {{verificationUrl}}',
    bodyEn: 'Hello {{userName}}, your account verification code is: {{verificationUrl}}',
    isActive: true,
    currentVersion: 1,
    styles: { backgroundColor: '#f0f1ee', cardColor: '#ffffff', textColor: '#1d1e1c', buttonColor: '#9fe870', buttonTextColor: '#272925' },
  },
  {
    key: 'staff_invitation',
    name: 'دعوة انضمام موظف / Staff & Faculty Invitation',
    subjectAr: 'دعوة للانضمام إلى منصة مدار الوطنية',
    subjectEn: 'Invitation to Join MADAR National Platform',
    bodyAr: 'مرحباً {{userName}}، تم إرسال دعوة رسمية لك للانضمام إلى {{institutionName}}. لاستكمال التسجيل اضغط هنا: {{actionUrl}}',
    bodyEn: 'Hello {{userName}}, you have been invited to join {{institutionName}}. Click here to proceed: {{actionUrl}}',
    isActive: true,
    currentVersion: 1,
    styles: { backgroundColor: '#f0f1ee', cardColor: '#ffffff', textColor: '#1d1e1c', buttonColor: '#9fe870', buttonTextColor: '#272925' },
  },
  {
    key: 'university_approval',
    name: 'اعتماد وتفعيل حساب الجامعة / University Account Approval',
    subjectAr: 'تم تفعيل حساب الجامعة على منصة مدار',
    subjectEn: 'University Account Successfully Activated',
    bodyAr: 'مرحباً {{userName}}، تم تفعيل حساب جامعة {{institutionName}} بنجاح على المنصة وتأهيل الصلاحيات.',
    bodyEn: 'Hello {{userName}}, the account for {{institutionName}} has been successfully activated on MADAR platform.',
    isActive: true,
    currentVersion: 1,
    styles: { backgroundColor: '#eff6ff', cardColor: '#ffffff', textColor: '#1e3a8a', buttonColor: '#2563eb', buttonTextColor: '#ffffff' },
  },
  {
    key: 'company_approval',
    name: 'اعتماد وتفعيل حساب الشركة / Company Account Approval',
    subjectAr: 'تم اعتماد وتفعيل حساب الشريك التجاري',
    subjectEn: 'Company Partner Account Approved',
    bodyAr: 'مرحباً {{userName}}، نهنئكم بتفعيل حساب شركة {{institutionName}} بنجاح للبدء بطرح الفرص والمطابقة.',
    bodyEn: 'Hello {{userName}}, company account for {{institutionName}} has been approved to publish opportunities.',
    isActive: true,
    currentVersion: 1,
    styles: { backgroundColor: '#f0f1ee', cardColor: '#ffffff', textColor: '#1d1e1c', buttonColor: '#9fe870', buttonTextColor: '#272925' },
  },
  {
    key: 'application_status_change',
    name: 'تحديث حالة طلب التوظيف والتدريب / Application Status Update',
    subjectAr: 'تحديث حالة طلب التقديم الخاص بك',
    subjectEn: 'Application Status Update Notification',
    bodyAr: 'مرحباً {{userName}}، نود إحاطتك بأنه تم تحديث حالة طلبك لدى {{institutionName}} إلى: {{status}}',
    bodyEn: 'Hello {{userName}}, your application status at {{institutionName}} has been updated to: {{status}}',
    isActive: true,
    currentVersion: 1,
    styles: { backgroundColor: '#f0f1ee', cardColor: '#ffffff', textColor: '#1d1e1c', buttonColor: '#9fe870', buttonTextColor: '#272925' },
  },
  {
    key: 'certificate_issued',
    name: 'إشعار صدور الشهادة الوطنية للتدريب / Training Certificate Issued',
    subjectAr: 'تهانينا، تم إصدار شهادتك التدريبية الوطنية بنجاح',
    subjectEn: 'Congratulations, your training certificate is issued',
    bodyAr: 'مرحباً {{userName}}، يسعدنا إعلامك بأنه تم إصدار واعتماد شهادتك لدى {{institutionName}} بنجاح.',
    bodyEn: 'Hello {{userName}}, we are pleased to inform you that your training certificate for {{institutionName}} is now ready.',
    isActive: true,
    currentVersion: 1,
    styles: { backgroundColor: '#fffbeb', cardColor: '#ffffff', textColor: '#78350f', buttonColor: '#f59e0b', buttonTextColor: '#ffffff' },
  },
  {
    key: 'security_alert',
    name: 'تنبيه أمني ودخول من جهاز جديد / Security Alert Notification',
    subjectAr: 'تنبيه أمني عاجل ودخول مريب',
    subjectEn: 'Important Security Alert Notification',
    bodyAr: 'مرحباً {{userName}}، تم رصد نشاط أمني: {{reason}}',
    bodyEn: 'Hello {{userName}}, security action detected: {{reason}}',
    isActive: true,
    currentVersion: 1,
    styles: { backgroundColor: '#181916', cardColor: '#272925', textColor: '#ffffff', buttonColor: '#9fe870', buttonTextColor: '#272925' },
  },
  {
    key: 'ai_operation_status',
    name: 'اكتمال معالجة ومطابقة الذكاء الاصطناعي / AI Task Complete',
    subjectAr: 'اكتملت معالجة خوارزميات المطابقة بالذكاء الاصطناعي',
    subjectEn: 'AI Matching Task Successfully Completed',
    bodyAr: 'مرحباً {{userName}}، تمت معالجة وتحديث نتائج خوارزمية المطابقة بنجاح.',
    bodyEn: 'Hello {{userName}}, AI matching algorithm processing has completed successfully.',
    isActive: true,
    currentVersion: 1,
    styles: { backgroundColor: '#f0f1ee', cardColor: '#ffffff', textColor: '#1d1e1c', buttonColor: '#9fe870', buttonTextColor: '#272925' },
  },
  {
    key: 'general_notification',
    name: 'إشعار عام وتعليمات المنصة / General Platform Notification',
    subjectAr: 'تنبيه هام من منصة مدار الوطنية',
    subjectEn: 'Important Notification from MADAR Platform',
    bodyAr: 'مرحباً {{userName}}، إشعار المنصة: {{reason}}',
    bodyEn: 'Hello {{userName}}, platform notification: {{reason}}',
    isActive: true,
    currentVersion: 1,
    styles: { backgroundColor: '#f0f1ee', cardColor: '#ffffff', textColor: '#1d1e1c', buttonColor: '#9fe870', buttonTextColor: '#272925' },
  },
];

// ==========================================
// Templates Tab
// ==========================================
function TemplatesTab() {
  const { t, isRTL } = useLanguage();
  const { data: templates, isLoading } = useEmailTemplates();
  const createMutation = useCreateEmailTemplate();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTpl, setNewTpl] = useState({
    key: '',
    name: '',
    subjectAr: '',
    subjectEn: '',
    bodyAr: '',
    bodyEn: '',
    isActive: true,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin" size={24} style={{ color: '#5b5e5a' }} /><span className="mr-2 text-sm" style={{ color: '#5b5e5a' }}>{t('جاري التحميل...', 'Loading...')}</span></div>;
  }

  if (selectedKey) {
    return <TemplateEditor templateKey={selectedKey} onBack={() => setSelectedKey(null)} />;
  }

  // Merge any backend templates with DEFAULT_EMAIL_TEMPLATES so ALL 10 templates are ALWAYS available!
  const allTemplatesMap = new Map<string, any>();
  DEFAULT_EMAIL_TEMPLATES.forEach(def => allTemplatesMap.set(def.key, def));
  if (Array.isArray(templates)) {
    templates.forEach((tpl: any) => {
      if (tpl?.key) {
        allTemplatesMap.set(tpl.key, { ...allTemplatesMap.get(tpl.key), ...tpl });
      }
    });
  }
  const allTemplates = Array.from(allTemplatesMap.values());

  const filtered = allTemplates.filter((tpl: any) => {
    const matchesSearch = !search || 
      tpl.name?.toLowerCase().includes(search.toLowerCase()) || 
      tpl.key?.toLowerCase().includes(search.toLowerCase()) ||
      tpl.subjectAr?.toLowerCase().includes(search.toLowerCase()) ||
      tpl.subjectEn?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && tpl.isActive) ||
      (statusFilter === 'inactive' && !tpl.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleCreate = async () => {
    if (!newTpl.key || !newTpl.name || !newTpl.subjectAr) {
      toast.error(t('يرجى تعبئة الحقول الأساسية للقالب', 'Please fill all required template fields'));
      return;
    }

    try {
      await createMutation.mutateAsync(newTpl);
      toast.success(t('تم إنشاء القالب الجديد بنجاح', 'New email template created successfully'));
      setShowCreateModal(false);
      setNewTpl({ key: '', name: '', subjectAr: '', subjectEn: '', bodyAr: '', bodyEn: '', isActive: true });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('فشل إنشاء القالب', 'Failed to create template'));
    }
  };

  return (
    <div className="space-y-4">
      <ContentCard
        title={t('قوالب البريد الإلكتروني والإشعارات', 'Email & Notification Templates')}
        icon={<FileText size={20} style={{ color: '#5b5e5a' }} />}
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer border border-[#9fe870] bg-[#9fe870] text-[#272925]"
          >
            <Plus size={14} className="stroke-[2.5]" />
            {t('إضافة قالب جديد', 'Add New Template')}
          </button>
        }
      >
        {/* Search & Filter Bar */}
        <div className="mb-4 flex flex-wrap gap-2.5 items-center justify-between">
          <div className="flex-1 min-w-[220px] relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#828782]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('بحث باسم القالب، الرمز الكودي، أو العنوان...', 'Search by name, key or subject...')}
              className="w-full rounded-xl border py-2.5 pr-9 pl-4 text-xs font-medium bg-white shadow-2xs focus:ring-2 focus:ring-[#9fe870] outline-none"
              style={{ borderColor: '#dfe1dd' }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="rounded-xl border px-3.5 py-2.5 text-xs font-semibold bg-white shadow-2xs outline-none"
            style={{ borderColor: '#dfe1dd' }}
          >
            <option value="all">{t('جميع الحالات', 'All Statuses')}</option>
            <option value="active">{t('المفعّلة فقط', 'Active Only')}</option>
            <option value="inactive">{t('المعطّلة فقط', 'Inactive Only')}</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.map((tpl: any) => (
            <TemplateCard key={tpl.key} tpl={tpl} onSelectKey={setSelectedKey} />
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center space-y-2 border rounded-2xl bg-white border-dashed" style={{ borderColor: '#dfe1dd' }}>
              <FileText size={32} className="mx-auto text-[#828782]" />
              <p className="text-sm font-bold text-[#1d1e1c]">{t('لا توجد قوالب مطابقة', 'No matching templates found')}</p>
              <p className="text-xs text-[#828782]">{t('جرب البحث بكلمة أخرى أو أنشئ قالباً جديداً', 'Try another search query or add a new template')}</p>
            </div>
          )}
        </div>
      </ContentCard>

      {/* Add New Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1e1c]/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl space-y-4 border border-[#dfe1dd] text-right font-sans">
            <div className="flex items-center justify-between border-b border-[#f0f1ee] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f1ee] text-[#5b5e5a] border border-[#dfe1dd]">
                  <Plus size={14} />
                </div>
                <h3 className="text-sm font-bold text-[#1d1e1c]">{t('إضافة قالب بريد وإشعارات جديد', 'Add New Email & Notification Template')}</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg p-1 hover:bg-[#f9faf8] text-[#828782] cursor-pointer transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#5e615c]">{t('مفتاح القالب (Slug Key)', 'Template Key (Slug)')}</label>
                  <input
                    value={newTpl.key}
                    onChange={e => setNewTpl({ ...newTpl, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. certificate_issued"
                    className="w-full rounded-lg border px-3 py-2 text-xs font-mono bg-[#f9faf8] focus:bg-white focus:border-[#9fe870] outline-none transition-colors" style={{ borderColor: '#dfe1dd' }} dir="ltr"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#5e615c]">{t('اسم القالب الواصف', 'Template Display Name')}</label>
                  <input
                    value={newTpl.name}
                    onChange={e => setNewTpl({ ...newTpl, name: e.target.value })}
                    placeholder="e.g. إشعار صدور الشهادة الوطنية"
                    className="w-full rounded-lg border px-3 py-2 text-xs font-medium bg-[#f9faf8] focus:bg-white focus:border-[#9fe870] outline-none transition-colors" style={{ borderColor: '#dfe1dd' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#5e615c]">{t('العنوان بالعربية', 'Subject (AR)')}</label>
                  <input
                    value={newTpl.subjectAr}
                    onChange={e => setNewTpl({ ...newTpl, subjectAr: e.target.value })}
                    placeholder="تهانينا، تم إصدار شهادتك"
                    className="w-full rounded-lg border px-3 py-2 text-xs font-medium bg-[#f9faf8] focus:bg-white focus:border-[#9fe870] outline-none transition-colors" style={{ borderColor: '#dfe1dd' }} dir="rtl"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[#5e615c]">{t('العنوان بالإنجليزية', 'Subject (EN)')}</label>
                  <input
                    value={newTpl.subjectEn}
                    onChange={e => setNewTpl({ ...newTpl, subjectEn: e.target.value })}
                    placeholder="Congratulations, your certificate is ready"
                    className="w-full rounded-lg border px-3 py-2 text-xs font-medium bg-[#f9faf8] focus:bg-white focus:border-[#9fe870] outline-none transition-colors" style={{ borderColor: '#dfe1dd' }} dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#5e615c]">{t('محتوى الرسالة (عربي)', 'Body Text (AR)')}</label>
                <textarea
                  value={newTpl.bodyAr}
                  onChange={e => setNewTpl({ ...newTpl, bodyAr: e.target.value })}
                  rows={4}
                  placeholder="مرحباً {{userName}}، يسعدنا إعلامك..."
                  className="w-full rounded-lg border px-3 py-2 text-xs font-medium bg-[#f9faf8] focus:bg-white focus:border-[#9fe870] outline-none transition-colors resize-none" style={{ borderColor: '#dfe1dd' }} dir="rtl"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#5e615c]">{t('محتوى الرسالة (إنجليزي)', 'Body Text (EN)')}</label>
                <textarea
                  value={newTpl.bodyEn}
                  onChange={e => setNewTpl({ ...newTpl, bodyEn: e.target.value })}
                  rows={4}
                  placeholder="Hello {{userName}}, we are pleased to inform you..."
                  className="w-full rounded-lg border px-3 py-2 text-xs font-medium bg-[#f9faf8] focus:bg-white focus:border-[#9fe870] outline-none transition-colors resize-none" style={{ borderColor: '#dfe1dd' }} dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-[#f0f1ee] pt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg border px-4 py-2 text-xs font-bold hover:bg-[#f9faf8] cursor-pointer transition-colors"
                style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}
              >
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors bg-[#9fe870] text-[#272925] hover:bg-[#8bd95c] cursor-pointer disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {t('حفظ وإنشاء القالب', 'Create & Save Template')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// Template Editor with Variable Palette & Live Test Email
// ==========================================
function TemplateEditor({ templateKey, onBack }: { templateKey: string; onBack: () => void }) {
  const { t, isRTL } = useLanguage();
  const { data: template, isLoading } = useEmailTemplate(templateKey);
  const updateMutation = useUpdateEmailTemplate();
  const rollbackMutation = useRollbackEmailTemplate();
  const testEmailMutation = useSendTestEmail();

  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar');
  const [showHistory, setShowHistory] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testEmailAddr, setTestEmailAddr] = useState('admin@madar.sa');
  const [showTestModal, setShowTestModal] = useState(false);

  useEffect(() => {
    const activeTpl = template || DEFAULT_EMAIL_TEMPLATES.find(d => d.key === templateKey);
    if (activeTpl && !form) {
      setForm({
        subjectAr: activeTpl.subjectAr || '',
        subjectEn: activeTpl.subjectEn || '',
        bodyAr: activeTpl.bodyAr || '',
        bodyEn: activeTpl.bodyEn || '',
        preheaderAr: activeTpl.preheaderAr || '',
        preheaderEn: activeTpl.preheaderEn || '',
        isActive: activeTpl.isActive ?? true,
        styles: { ...activeTpl.styles },
      });
    }
  }, [template, templateKey, form]);

  const handleSave = useCallback(async () => {
    if (!form) return;
    setMsg(null);
    try {
      await updateMutation.mutateAsync({ key: templateKey, data: form });
      setMsg({ type: 'success', text: t('تم حفظ القالب بنجاح', 'Template saved successfully') });
      setForm(null);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || t('فشل الحفظ', 'Save failed') });
    }
  }, [form, templateKey, updateMutation, t]);

  const handleRollback = useCallback(async (version: number) => {
    setMsg(null);
    try {
      await rollbackMutation.mutateAsync({ key: templateKey, version });
      setMsg({ type: 'success', text: t('تم الرجوع إلى الإصدار السابق', 'Rolled back successfully') });
      setForm(null);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || t('فشل الرجوع', 'Rollback failed') });
    }
  }, [templateKey, rollbackMutation, t]);

  const handleSendTest = async () => {
    if (!testEmailAddr) {
      toast.error(t('يرجى كتابة البريد الإلكتروني للمستلم', 'Please enter recipient email address'));
      return;
    }
    try {
      const res = await testEmailMutation.mutateAsync({ key: templateKey, email: testEmailAddr });
      toast.success(res.message || t('تم إرسال البريد التجريبي بنجاح!', 'Test email sent successfully!'));
      setShowTestModal(false);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('فشل إرسال البريد التجريبي', 'Failed to send test email'));
    }
  };

  const insertVariable = (varName: string, field: 'bodyAr' | 'bodyEn' | 'subjectAr' | 'subjectEn') => {
    if (!form) return;
    const placeholder = `{{${varName}}}`;
    setForm((prev: any) => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]} ${placeholder}` : placeholder,
    }));
    toast.info(t(`تم إدراج المتغير ${placeholder}`, `Inserted variable ${placeholder}`));
  };

  const applyThemePreset = (preset: any) => {
    if (!form) return;
    setForm((prev: any) => ({
      ...prev,
      styles: {
        ...prev.styles,
        ...preset,
      },
    }));
    toast.success(t('تم تطبيق سمة المظهر بنجاح', 'Appearance preset applied successfully'));
  };

  if (isLoading || !form) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin" size={24} style={{ color: '#5b5e5a' }} /></div>;
  }

  const previewSubject = previewLang === 'ar' ? form.subjectAr : form.subjectEn;
  const previewBody = previewLang === 'ar' ? form.bodyAr : form.bodyEn;

  const placeholders = [
    { key: 'userName', ar: 'اسم المستخدم' },
    { key: 'institutionName', ar: 'اسم المؤسسة' },
    { key: 'verificationUrl', ar: 'رابط التحقق' },
    { key: 'resetUrl', ar: 'رابط استعادة المرور' },
    { key: 'actionUrl', ar: 'رابط الإجراء' },
    { key: 'status', ar: 'حالة الطلب' },
    { key: 'reason', ar: 'السبب / التفاصيل' },
  ];

  return (
    <div className="space-y-4 text-right font-sans">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-[#f0f1ee] cursor-pointer" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}>
          ← {t('رجوع للقوالب', 'Back to Templates')}
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTestModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-[#f0f1ee] cursor-pointer shadow-2xs"
            style={{ borderColor: '#dfe1dd', color: '#272925', background: '#ffffff' }}
          >
            <Send size={13} className="text-[#12b76a]" />
            {t('إرسال بريد تجريبي', 'Send Test Email')}
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold hover:bg-[#f0f1ee] cursor-pointer"
            style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}
          >
            <RotateCcw size={13} /> {t('سجل الإصدارات', 'Version History')}
            {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all shadow-xs active:scale-95 border border-[#9fe870] bg-[#9fe870] text-[#272925] hover:bg-[#8bd95c] cursor-pointer disabled:opacity-50"
          >
            {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {t('حفظ ونشر القالب', 'Save & Publish')}
          </button>
        </div>
      </div>

      {msg && (
        <div className={cn("rounded border p-3 text-sm font-bold shadow-xs", msg.type === 'success' ? 'bg-[#E7FDD8] text-[#1ba442] border-[#1ba442]/30' : 'bg-[#FEE2E2] text-[#B91C1C] border-[#B91C1C]/30')}>
          {msg.text}
        </div>
      )}

      {showHistory && template?.versions?.length > 0 && (
        <ContentCard title={t('سجل الإصدارات والتغيرات السابقة', 'Version History & Restores')}>
          <div className="max-h-56 space-y-2.5 overflow-y-auto">
            {template.versions.slice().reverse().map((v: any) => (
              <div key={v.version} className="flex items-center justify-between rounded border p-3.5 bg-white shadow-2xs" style={{ borderColor: '#dfe1dd' }}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1d1e1c]">{t('الإصدار', 'v')}{v.version}</span>
                    <span className="text-[11px] text-[#828782]">{v.updatedAt ? new Date(v.updatedAt).toLocaleString() : ''}</span>
                  </div>
                  {v.note && <p className="text-xs text-[#5e615c] mt-0.5">{v.note}</p>}
                </div>
                <button
                  onClick={() => handleRollback(v.version)}
                  disabled={rollbackMutation.isPending}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-bold hover:bg-[#f0f1ee] cursor-pointer shadow-2xs"
                  style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}
                >
                  <RotateCcw size={11} /> {t('استرجاع الإصدار', 'Restore')}
                </button>
              </div>
            ))}
          </div>
        </ContentCard>
      )}

      {/* Dynamic Placeholder Variables Palette */}
      <div className="rounded-xl border p-4 bg-white shadow-2xs" style={{ borderColor: '#dfe1dd' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#1d1e1c] flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#828782]" />
            {t('لوحة المتغيرات والوسوم الديناميكية:', 'Dynamic Placeholder Variables:')}
          </span>
          <span className="text-[11px] text-[#828782]">{t('انقر فوق المتغير لإدراجه مباشرة في النص', 'Click variable to insert into body')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {placeholders.map(p => (
            <button
              key={p.key}
              onClick={() => insertVariable(p.key, 'bodyAr')}
              className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-mono font-bold bg-[#f0f1ee] hover:bg-[#9fe870] hover:text-[#272925] transition-all cursor-pointer border-[#dfe1dd]"
            >
              <Code size={12} />
              {`{{${p.key}}}`}
              <span className="text-[10px] opacity-75 font-sans font-normal">({p.ar})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Editor */}
        <ContentCard title={t('محرر القالب والمحتوى', 'Template Content Editor')} icon={<Edit3 size={20} style={{ color: '#5b5e5a' }} />}>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded h-4 w-4" />
              <span className="text-xs font-bold text-[#1d1e1c]">{t('تفعيل القالب للإرسال التلقائي', 'Enable Template for Automatic Dispatch')}</span>
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5e615c]">{t('العنوان (عربي)', 'Subject (AR)')}</label>
                <input value={form.subjectAr} onChange={e => setForm({ ...form, subjectAr: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-xs font-medium" style={{ borderColor: '#dfe1dd' }} dir="rtl" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-[#5e615c]">{t('العنوان (إنجليزي)', 'Subject (EN)')}</label>
                <input value={form.subjectEn} onChange={e => setForm({ ...form, subjectEn: e.target.value })} className="w-full rounded-xl border px-3 py-2 text-xs font-medium" style={{ borderColor: '#dfe1dd' }} dir="ltr" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#5e615c]">{t('محتوى الرسالة (عربي)', 'Body (AR)')}</label>
              </div>
              <textarea value={form.bodyAr} onChange={e => setForm({ ...form, bodyAr: e.target.value })} rows={5} className="w-full rounded-xl border px-3 py-2 text-xs font-medium leading-relaxed" style={{ borderColor: '#dfe1dd' }} dir="rtl" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#5e615c]">{t('محتوى الرسالة (إنجليزي)', 'Body (EN)')}</label>
              </div>
              <textarea value={form.bodyEn} onChange={e => setForm({ ...form, bodyEn: e.target.value })} rows={5} className="w-full rounded-xl border px-3 py-2 text-xs font-medium leading-relaxed" style={{ borderColor: '#dfe1dd' }} dir="ltr" />
            </div>

            {/* Presets & Style Palette */}
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: '#dfe1dd', background: '#f0f1ee' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#1d1e1c]">{t('أنماط المظهر الجاهزة (Themes):', 'Appearance Presets:')}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => applyThemePreset({ backgroundColor: '#f0f1ee', cardColor: '#ffffff', textColor: '#1d1e1c', buttonColor: '#9fe870', buttonTextColor: '#272925' })}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border p-2 text-[11px] font-bold bg-white text-[#272925] border-[#9fe870] cursor-pointer hover:scale-[1.02] transition-transform"
                >
                  <Paintbrush size={14} /> هوية مدار الجذابة
                </button>
                <button
                  type="button"
                  onClick={() => applyThemePreset({ backgroundColor: '#181916', cardColor: '#272925', textColor: '#ffffff', buttonColor: '#9fe870', buttonTextColor: '#272925' })}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border p-2 text-[11px] font-bold bg-[#272925] text-white border-[#272925] cursor-pointer hover:scale-[1.02] transition-transform"
                >
                  <Moon size={14} /> الوضع المظلم
                </button>
                <button
                  type="button"
                  onClick={() => applyThemePreset({ backgroundColor: '#eff6ff', cardColor: '#ffffff', textColor: '#1e3a8a', buttonColor: '#2563eb', buttonTextColor: '#ffffff' })}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border p-2 text-[11px] font-bold bg-[#eff6ff] text-[#1e3a8a] border-[#bfdbfe] cursor-pointer hover:scale-[1.02] transition-transform"
                >
                  <Droplets size={14} /> الأزرق الملكي
                </button>
                <button
                  type="button"
                  onClick={() => applyThemePreset({ backgroundColor: '#fffbeb', cardColor: '#ffffff', textColor: '#78350f', buttonColor: '#f59e0b', buttonTextColor: '#ffffff' })}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border p-2 text-[11px] font-bold bg-[#fffbeb] text-[#78350f] border-[#fde68a] cursor-pointer hover:scale-[1.02] transition-transform"
                >
                  <Sun size={14} /> العنبر الدافئ
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 pt-2">
                {[
                  { key: 'backgroundColor', label: 'خلفية البريد', en: 'Background' },
                  { key: 'cardColor', label: 'بطاقة المحتوى', en: 'Card Color' },
                  { key: 'textColor', label: 'لون النص', en: 'Text Color' },
                  { key: 'buttonColor', label: 'زر الإجراء', en: 'Button Color' },
                  { key: 'buttonTextColor', label: 'نص الزر', en: 'Button Text' },
                ].map(({ key, label, en }) => (
                  <div key={key} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.styles?.[key] || '#ffffff'}
                      onChange={e => setForm({ ...form, styles: { ...form.styles, [key]: e.target.value } })}
                      className="h-7 w-7 cursor-pointer rounded-lg border-0"
                    />
                    <span className="text-xs font-semibold text-[#5b5e5a]">{t(label, en)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ContentCard>

        {/* Live Preview */}
        <ContentCard title={t('المعاينة الحية التفاعلية', 'Live Interactive Preview')} icon={<Eye size={20} style={{ color: '#5b5e5a' }} />}
          action={
            <div className="flex gap-1 rounded-lg border p-1 bg-[#f9faf8]" style={{ borderColor: '#dfe1dd' }}>
              <button onClick={() => setPreviewLang('ar')} className={cn("rounded-md px-3 py-1 text-xs font-bold cursor-pointer transition-colors", previewLang === 'ar' ? 'bg-white shadow-xs text-[#1d1e1c] border border-[#f0f1ee]' : 'text-[#828782] hover:text-[#1d1e1c]')}>عربي</button>
              <button onClick={() => setPreviewLang('en')} className={cn("rounded-md px-3 py-1 text-xs font-bold cursor-pointer transition-colors", previewLang === 'en' ? 'bg-white shadow-xs text-[#1d1e1c] border border-[#f0f1ee]' : 'text-[#828782] hover:text-[#1d1e1c]')}>English</button>
            </div>
          }
        >
          <div className="rounded-xl border p-4" style={{ borderColor: '#dfe1dd', background: form.styles?.backgroundColor || '#f4f4f4' }}>
            {form.styles?.logo && (
              <div className="p-4 text-center"><img src={form.styles.logo} alt="Logo" className="mx-auto h-10" /></div>
            )}
            <div className="mx-auto max-w-lg rounded-xl p-6 shadow-xs border border-[#f0f1ee]" style={{ background: form.styles?.cardColor || '#ffffff', fontFamily: form.styles?.fontFamily || 'Tajawal, sans-serif' }}>
              <h3 className="mb-3 text-sm font-bold border-b pb-3" style={{ color: form.styles?.textColor || '#333', borderColor: '#dfe1dd' }} dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                {previewSubject || t('بدون عنوان', 'No Subject')}
              </h3>
              <div className="whitespace-pre-wrap text-xs font-medium leading-relaxed" style={{ color: form.styles?.textColor || '#333' }} dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                {previewBody?.replace(/\{\{(\w+)\}\}/g, (_: string, name: string) => `[${name}]`)}
              </div>
              <div className="mt-5 text-center">
                <span className="inline-block rounded-lg px-6 py-2.5 text-xs font-bold shadow-xs cursor-pointer border border-black/5" style={{ background: form.styles?.buttonColor || '#9fe870', color: form.styles?.buttonTextColor || '#272925' }}>
                  {previewLang === 'ar' ? 'انقر هنا للانتقال' : 'Click Here to Proceed'}
                </span>
              </div>
            </div>
          </div>
        </ContentCard>
      </div>

      {/* Live Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1d1e1c]/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4 border border-[#dfe1dd] text-right font-sans">
            <div className="flex items-center justify-between border-b border-[#f0f1ee] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f1ee] text-[#5b5e5a] border border-[#dfe1dd]">
                  <Send size={14} />
                </div>
                <h3 className="text-sm font-bold text-[#1d1e1c]">{t('إرسال بريد تجريبي مباشر', 'Send Live Test Email')}</h3>
              </div>
              <button onClick={() => setShowTestModal(false)} className="rounded-lg p-1 hover:bg-[#f9faf8] text-[#828782] cursor-pointer transition-colors">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#5e615c]">{t('البريد الإلكتروني للمستلم', 'Recipient Email Address')}</label>
              <input
                type="email"
                value={testEmailAddr}
                onChange={e => setTestEmailAddr(e.target.value)}
                placeholder="admin@madar.sa"
                className="w-full rounded-lg border px-4 py-2 text-xs font-medium bg-[#f9faf8] focus:bg-white focus:border-[#9fe870] outline-none transition-colors" style={{ borderColor: '#dfe1dd' }} dir="ltr"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-[#f0f1ee] pt-4">
              <button
                onClick={() => setShowTestModal(false)}
                className="rounded-lg border px-4 py-2 text-xs font-bold hover:bg-[#f9faf8] cursor-pointer transition-colors"
                style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}
              >
                {t('إلغاء', 'Cancel')}
              </button>
              <button
                onClick={handleSendTest}
                disabled={testEmailMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-colors bg-[#9fe870] text-[#272925] hover:bg-[#8bd95c] cursor-pointer disabled:opacity-50"
              >
                {testEmailMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {t('إرسال الآن', 'Send Test Email')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SMTP Tab
// ==========================================
function SmtpTab() {
  const { t } = useLanguage();
  const { data, isLoading, refetch } = useEmailMonitoring();
  const testSmtp = useTestSmtpConnection();
  const { data: settings } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [smtpForm, setSmtpForm] = useState<any>(null);
  const [smtpMsg, setSmtpMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings && !smtpForm) {
      const smtp = settings['notifications.smtpSettings'] || {};
      setSmtpForm({
        enabled: smtp.enabled ?? true,
        host: smtp.host || '',
        port: smtp.port || 587,
        secure: smtp.secure ?? true,
        user: smtp.user || '',
        password: smtp.password || '',
        senderEmail: smtp.senderEmail || '',
        senderName: smtp.senderName || '',
      });
    }
  }, [settings, smtpForm]);

  const handleTestSmtp = async () => {
    setTestResult(null);
    try {
      const result = await testSmtp.mutateAsync(smtpForm);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, message: e?.response?.data?.message || t('فشل الاتصال', 'Connection failed') });
    }
  };

  const handleSaveSmtp = async () => {
    if (!smtpForm) return;
    setSmtpMsg(null);
    try {
      await updateSettings.mutateAsync({ 'notifications.smtpSettings': smtpForm });
      setSmtpMsg({ type: 'success', text: t('تم حفظ إعدادات SMTP', 'SMTP settings saved') });
    } catch (e: any) {
      setSmtpMsg({ type: 'error', text: e?.response?.data?.message || t('فشل الحفظ', 'Save failed') });
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'نجاح 24 ساعة', en: 'Success (24h)', value: data?.counts24h?.success ?? 0 },
          { label: 'فشل 24 ساعة', en: 'Failure (24h)', value: data?.counts24h?.failure ?? 0 },
          { label: 'نجاح 7 أيام', en: 'Success (7d)', value: data?.counts7d?.success ?? 0 },
          { label: 'فشل 7 أيام', en: 'Failure (7d)', value: data?.counts7d?.failure ?? 0 },
        ].map(item => (
          <div key={item.en} className="rounded-2xl border p-4 text-center" style={{ background: '#ffffff', borderColor: '#dfe1dd' }}>
            <p className="text-2xl font-black" style={{ color: '#0e0f0c' }}>{item.value}</p>
            <p className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t(item.label, item.en)}</p>
          </div>
        ))}
      </div>

      {/* SMTP Config */}
      <ContentCard
        title={t('إعدادات خادم البريد', 'Mail Server Settings')}
        icon={<Settings2 size={20} style={{ color: '#5b5e5a' }} />}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-[#f0f1ee]" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}>
              <RefreshCw size={12} /> {t('تحديث', 'Refresh')}
            </button>
            <button onClick={handleTestSmtp} disabled={testSmtp.isPending} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50" style={{ background: '#0e0f0c', color: '#ffffff' }}>
              {testSmtp.isPending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} {t('اختبار SMTP', 'Test SMTP')}
            </button>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-6"><Loader2 className="animate-spin" size={20} style={{ color: '#5b5e5a' }} /></div>
        ) : smtpForm ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl p-3" style={{ background: '#f0f1ee' }}>
              <span className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('الحالة', 'Status')}</span>
              <StatusBadge label={data?.smtp?.configured ? t('مُكوّن', 'Configured') : t('غير مُكوّن', 'Not Configured')} variant={data?.smtp?.configured ? 'success' : 'warning'} />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('المضيف', 'Host')}</label>
                <input value={smtpForm.host} onChange={e => setSmtpForm({ ...smtpForm, host: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#dfe1dd' }} placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('المنفذ', 'Port')}</label>
                <input type="number" value={smtpForm.port} onChange={e => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#dfe1dd' }} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('المستخدم', 'User')}</label>
                <input value={smtpForm.user} onChange={e => setSmtpForm({ ...smtpForm, user: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#dfe1dd' }} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('كلمة المرور', 'Password')}</label>
                <input type="password" value={smtpForm.password} onChange={e => setSmtpForm({ ...smtpForm, password: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#dfe1dd' }} placeholder="*****" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('بريد المرسل', 'Sender Email')}</label>
                <input value={smtpForm.senderEmail} onChange={e => setSmtpForm({ ...smtpForm, senderEmail: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#dfe1dd' }} placeholder="noreply@madar.sa" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('اسم المرسل', 'Sender Name')}</label>
                <input value={smtpForm.senderName} onChange={e => setSmtpForm({ ...smtpForm, senderName: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#dfe1dd' }} placeholder="MADAR Platform" />
              </div>
              <div className="flex items-end gap-6">
                <label className="flex items-center gap-2 pb-2">
                  <input type="checkbox" checked={smtpForm.secure} onChange={e => setSmtpForm({ ...smtpForm, secure: e.target.checked })} className="rounded" />
                  <span className="text-sm font-semibold" style={{ color: '#0e0f0c' }}>{t('اتصال آمن (TLS)', 'Secure (TLS)')}</span>
                </label>
                <label className="flex items-center gap-2 pb-2">
                  <input type="checkbox" checked={smtpForm.enabled} onChange={e => setSmtpForm({ ...smtpForm, enabled: e.target.checked })} className="rounded" />
                  <span className="text-sm font-semibold" style={{ color: '#0e0f0c' }}>{t('تفعيل (Enabled)', 'Enabled')}</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleSaveSmtp}
                disabled={updateSettings.isPending}
                className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold disabled:opacity-50"
                style={{ background: '#1ba442', color: '#ffffff' }}
              >
                {updateSettings.isPending ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                {t('حفظ الإعدادات', 'Save Settings')}
              </button>
            </div>

            {smtpMsg && (
              <div className={cn("rounded-xl p-3 text-sm font-semibold", smtpMsg.type === 'success' ? 'bg-[#E7FDD8] text-[#1ba442]' : 'bg-[#FEE2E2] text-[#B91C1C]')}>
                {smtpMsg.text}
              </div>
            )}
            {testResult && (
              <div className={cn("rounded-xl p-3 text-sm font-semibold", testResult.success ? 'bg-[#E7FDD8] text-[#1ba442]' : 'bg-[#FEE2E2] text-[#B91C1C]')}>
                {testResult.success ? <CheckCircle2 size={14} className="mb-0.5 inline" /> : <XCircle size={14} className="mb-0.5 inline" />} {testResult.message}
              </div>
            )}
          </div>
        ) : null}
      </ContentCard>
    </div>
  );
}

// ==========================================
// Notifications Tab
// ==========================================
function NotificationsTab() {
  const { t } = useLanguage();
  const { data: policies, isLoading } = useNotificationPolicies();
  const updatePolicy = useUpdateNotificationPolicy();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleEdit = (policy: any) => {
    setEditingCategory(policy.category);
    setEditForm({ ...policy });
    setMsg(null);
  };

  const handleSave = async () => {
    if (!editingCategory || !editForm) return;
    setMsg(null);
    try {
      await updatePolicy.mutateAsync({ category: editingCategory, data: editForm });
      setMsg({ type: 'success', text: t('تم حفظ السياسة', 'Policy saved') });
      setEditingCategory(null);
      setEditForm(null);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || t('فشل الحفظ', 'Save failed') });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin" size={24} style={{ color: '#5b5e5a' }} /></div>;
  }

  return (
    <ContentCard title={t('سياسات الإشعارات', 'Notification Policies')} icon={<Bell size={20} style={{ color: '#5b5e5a' }} />}>
      {msg && (
        <div className={cn("mb-4 rounded-xl p-3 text-sm font-semibold", msg.type === 'success' ? 'bg-[#E7FDD8] text-[#1ba442]' : 'bg-[#FEE2E2] text-[#B91C1C]')}>
          {msg.text}
        </div>
      )}
      <div className="space-y-3">
        {(policies || []).map((pol: any) => (
          <div key={pol.category} className="rounded-xl border p-4" style={{ borderColor: '#dfe1dd' }}>
            {editingCategory === pol.category && editForm ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold" style={{ color: '#0e0f0c' }}>{pol.nameAr || pol.category}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingCategory(null); setEditForm(null); }} className="rounded-full border px-3 py-1 text-xs" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}>{t('إلغاء', 'Cancel')}</button>
                    <button onClick={handleSave} disabled={updatePolicy.isPending} className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold disabled:opacity-50" style={{ background: '#1ba442', color: '#fff' }}>
                      {updatePolicy.isPending ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />} {t('حفظ', 'Save')}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editForm.isActive} onChange={e => setEditForm({ ...editForm, isActive: e.target.checked })} />
                    <span className="text-xs font-semibold">{t('مفعّلة', 'Active')}</span>
                  </label>
                  <div>
                    <label className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('الأولوية', 'Priority')}</label>
                    <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })} className="w-full rounded-lg border px-2 py-1 text-sm" style={{ borderColor: '#dfe1dd' }}>
                      <option value="critical">{t('حرجة', 'Critical')}</option>
                      <option value="high">{t('عالية', 'High')}</option>
                      <option value="medium">{t('متوسطة', 'Medium')}</option>
                      <option value="low">{t('منخفضة', 'Low')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('محاولات الإعادة', 'Retries')}</label>
                    <input type="number" value={editForm.maxRetryCount} onChange={e => setEditForm({ ...editForm, maxRetryCount: parseInt(e.target.value) || 0 })} className="w-full rounded-lg border px-2 py-1 text-sm" style={{ borderColor: '#dfe1dd' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('القنوات', 'Channels')}</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['email', 'in-app', 'sms', 'push'].map(ch => (
                        <label key={ch} className="flex items-center gap-1 text-xs">
                          <input type="checkbox" checked={(editForm.channels || []).includes(ch)} onChange={e => {
                            const chs = new Set(editForm.channels || []);
                            e.target.checked ? chs.add(ch) : chs.delete(ch);
                            setEditForm({ ...editForm, channels: [...chs] });
                          }} />
                          {ch}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold" style={{ color: '#0e0f0c' }}>{pol.nameAr || pol.category}</p>
                  <p className="text-xs" style={{ color: '#828782' }}>
                    {pol.nameEn} · {(pol.channels || []).join(', ')} · {pol.priority}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={pol.isActive ? t('مفعّلة', 'Active') : t('معطّلة', 'Inactive')} variant={pol.isActive ? 'success' : 'warning'} />
                  <button onClick={() => handleEdit(pol)} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-[#f0f1ee]" style={{ borderColor: '#dfe1dd', color: '#5b5e5a' }}>
                    <Edit3 size={12} /> {t('تعديل', 'Edit')}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {(!policies || policies.length === 0) && (
          <p className="py-8 text-center text-sm" style={{ color: '#828782' }}>{t('لا توجد سياسات', 'No policies')}</p>
        )}
      </div>
    </ContentCard>
  );
}

// ==========================================
// Delivery Logs Tab
// ==========================================
function DeliveryLogsTab() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useNotificationDeliveryLogs({ page, limit: 20, search: search || undefined, status: statusFilter || undefined });

  const logs = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <ContentCard title={t('سجلات التسليم', 'Delivery Logs')} icon={<Search size={20} style={{ color: '#5b5e5a' }} />}>
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder={t('بحث بالبريد أو الموضوع...', 'Search by email or subject...')}
          className="flex-1 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#dfe1dd', minWidth: '200px' }}
        />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: '#dfe1dd' }}>
          <option value="">{t('جميع الحالات', 'All Statuses')}</option>
          <option value="sent">{t('مرسل', 'Sent')}</option>
          <option value="delivered">{t('مُسلّم', 'Delivered')}</option>
          <option value="failed">{t('فاشل', 'Failed')}</option>
          <option value="pending">{t('قيد الانتظار', 'Pending')}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin" size={20} style={{ color: '#5b5e5a' }} /></div>
      ) : logs.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: '#828782' }}>{t('لا توجد سجلات', 'No logs found')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: '#f0f1ee' }}>
                <th className="rounded-l-xl px-4 py-3 text-start text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('القناة', 'Channel')}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('الحالة', 'Status')}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('المستلم', 'Recipient')}</th>
                <th className="px-4 py-3 text-start text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('الفئة', 'Category')}</th>
                <th className="rounded-r-xl px-4 py-3 text-start text-xs font-semibold" style={{ color: '#5b5e5a' }}>{t('الوقت', 'Time')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log._id} className="border-b transition-colors hover:bg-[#f0f1ee]" style={{ borderColor: '#dfe1dd' }}>
                  <td className="px-4 py-3 text-sm" style={{ color: '#0e0f0c' }}>{log.channel}</td>
                  <td className="px-4 py-3"><StatusBadge label={log.status} variant={log.status === 'delivered' || log.status === 'sent' ? 'success' : log.status === 'failed' ? 'error' : 'warning'} /></td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#828782' }}>{log.recipientEmail || '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#5b5e5a' }}>{log.category || '-'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#828782' }}>{log.createdAt ? new Date(log.createdAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-full border px-3 py-1 text-xs disabled:opacity-30" style={{ borderColor: '#dfe1dd' }}>←</button>
          <span className="text-xs" style={{ color: '#5b5e5a' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-full border px-3 py-1 text-xs disabled:opacity-30" style={{ borderColor: '#dfe1dd' }}>→</button>
        </div>
      )}
    </ContentCard>
  );
}
