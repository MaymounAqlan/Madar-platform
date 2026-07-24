import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { AlertTriangle, ArrowRight, BookOpen, FileText, GraduationCap, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import PortalLayout from '@/components/PortalLayout';
import MetricCard from '@/components/MetricCard';
import ContentCard from '@/components/ContentCard';
import { useRecommendedJobs, useRefreshRecommendations, useStudentApplications, useStudentProfile } from '@/hooks/useStudent';
import { cn } from '@/lib/utils';

function LoadingSpinner() {
  return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#9fe870]" />
    </div>
  );
}

export default function StudentDashboard() {
  const { t, isRTL } = useLanguage();
  const { data: student, isLoading } = useStudentProfile();
  const { data: jobsData } = useRecommendedJobs({ page: 1, limit: 5, sortBy: 'match' });
  const { data: appsData } = useStudentApplications();
  const refreshRecommendations = useRefreshRecommendations();

  if (isLoading || !student) return <LoadingSpinner />;

  const recommendedJobs = (jobsData?.data ?? []).slice(0, 5);
  const recentApplications = (appsData?.data ?? []).slice(0, 3);
  const profileCompletion = student.profileCompletion ?? 0;
  const welcomeName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';

  return (
    <PortalLayout title={t('لوحة التحكم', 'Dashboard')}>
      <div className={cn('space-y-6', isRTL ? 'rtl' : 'ltr')}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[24px] p-6 sm:p-8"
          style={{ background: 'linear-gradient(135deg, #9fe870 0%, #7dd455 100%)' }}
        >
          <h2 className="text-xl font-black text-[#0e0f0c] sm:text-2xl" style={{ fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif" }}>
            {t(`أهلًا بك، ${welcomeName}!`, `Welcome back, ${welcomeName}!`)}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#0e0f0c] opacity-70 sm:text-base">
            {[
              student.university || t('جامعة غير محددة', 'University not set'),
              student.college || t('كلية غير محددة', 'College not set'),
              student.department || t('قسم غير محدد', 'Department not set'),
            ].join(' - ')}
          </p>
        </motion.div>

        {profileCompletion < 100 && (
          <div className="flex items-start gap-3 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-[#B45309]" />
            <div>
              <p className="text-sm font-bold text-[#92400E]">
                {t('أكمل ملفك الشخصي لتحسين التوصيات', 'Complete your profile to improve recommendations')}
              </p>
              <p className="text-xs text-[#92400E]/80">
                {t(`نسبة الإكمال الحالية ${profileCompletion}%`, `Current completion is ${profileCompletion}%`)}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard icon={<GraduationCap size={22} style={{ color: '#7C3AED' }} />} iconBg="#F3E8FF" value={student.university || '-'} label={t('الجامعة', 'University')} valueColor="#7C3AED" />
          <MetricCard icon={<BookOpen size={22} style={{ color: '#1D4ED8' }} />} iconBg="#DBEAFE" value={student.college || '-'} label={t('الكلية', 'College')} valueColor="#1D4ED8" />
          <MetricCard icon={<Sparkles size={22} style={{ color: '#1ba442' }} />} iconBg="#E7FDD8" value={recommendedJobs.length} label={t('الوظائف الموصى بها', 'Recommended Jobs')} valueColor="#1ba442" />
          <MetricCard icon={<FileText size={22} style={{ color: '#B45309' }} />} iconBg="#FEF3C7" value={`${profileCompletion}%`} label={t('اكتمال الملف', 'Profile Completion')} valueColor="#B45309" />
        </div>

        <ContentCard
          title={t('أعلى التوصيات', 'Top Recommendations')}
          icon={<Sparkles size={20} style={{ color: '#1ba442' }} />}
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  refreshRecommendations.mutateAsync().catch(() => {
                    toast.error(t('تعذر تحديث التوصيات', 'Failed to refresh recommendations'));
                  });
                }}
                disabled={refreshRecommendations.isPending}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe1dd] bg-white px-3 py-1.5 text-xs font-semibold text-[#0e0f0c] disabled:opacity-50"
              >
                {refreshRecommendations.isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                {t('تحديث', 'Refresh')}
              </button>
              <Link
                to="/student/recommendations"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-[#0e0f0c]"
                style={{ background: '#9fe870' }}
              >
                {t('عرض الكل', 'View all')}
                <ArrowRight size={12} />
              </Link>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-3">
            {recommendedJobs.length > 0 ? (
              recommendedJobs.map((job: any) => (
                <div key={job.id} className="flex flex-col gap-2 rounded-2xl border border-[#dfe1dd] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0e0f0c]">{job.title}</p>
                    <p className="truncate text-xs font-semibold text-[#5b5e5a]">{job.company}</p>
                    <p className="mt-1 text-xs text-[#828782]">{job.recommendation || t('مطابقة مبنية على الملف الحالي', 'Match based on current profile')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[#F4FCF0] px-3 py-1 text-xs font-bold text-[#1ba442]">{job.matchScore ?? 0}%</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#828782]">{t('لا توجد توصيات بعد', 'No recommendations yet')}</p>
            )}
          </div>
        </ContentCard>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ContentCard title={t('البيانات الأكاديمية', 'Academic Information')} icon={<GraduationCap size={20} style={{ color: '#1ba442' }} />}>
            <div className="grid grid-cols-1 gap-3">
              {[
                { labelAr: 'الاسم', labelEn: 'Name', value: welcomeName },
                { labelAr: 'الجامعة', labelEn: 'University', value: student.university || '-' },
                { labelAr: 'الكلية', labelEn: 'College', value: student.college || '-' },
                { labelAr: 'القسم', labelEn: 'Department', value: student.department || '-' },
              ].map((item) => (
                <div key={item.labelEn} className="rounded-xl bg-[#f0f1ee] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#828782]">{isRTL ? item.labelAr : item.labelEn}</p>
                  <p className="mt-1 text-sm font-bold text-[#0e0f0c]">{item.value}</p>
                </div>
              ))}
            </div>
          </ContentCard>

          <ContentCard title={t('أحدث الطلبات', 'Recent Applications')} icon={<FileText size={20} style={{ color: '#1D4ED8' }} />}>
            <div className="mt-2 flex flex-col gap-3">
              {recentApplications.length > 0 ? (
                recentApplications.map((app: any) => (
                  <div key={app.id} className="flex items-center gap-3 rounded-2xl bg-[#f0f1ee] p-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#DBEAFE]">
                      <FileText size={18} style={{ color: '#1D4ED8' }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#0e0f0c]">{app.jobTitle || 'Job Application'}</p>
                      <p className="truncate text-xs text-[#5b5e5a]">{app.company || 'Company'} - {app.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#828782]">{t('لا توجد طلبات حتى الآن', 'No applications yet')}</p>
              )}
            </div>
          </ContentCard>
        </div>
      </div>
    </PortalLayout>
  );
}
