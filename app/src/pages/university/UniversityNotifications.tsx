import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Bell, CheckCheck, Loader2, MailOpen, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { notificationApi } from '@/services/notificationApi';
import { getNotificationTarget } from '@/utils/notificationNavigation';

type NotificationView = 'all' | 'read';

export default function UniversityNotifications() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthenticated, isUniversityPortalUser } = useAuth();
  const queryClient = useQueryClient();
  const [view, setView] = useState<NotificationView>('all');
  const queryEnabled = !authLoading && isAuthenticated && isUniversityPortalUser;

  const query = useQuery({
    queryKey: ['institutional-notifications', view],
    queryFn: () => notificationApi.getMyNotifications({ limit: 100, read: view === 'read' }),
    enabled: queryEnabled,
    retry: false,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const unreadQuery = useQuery({
    queryKey: ['institutional-notifications', 'unread-count'],
    queryFn: () => notificationApi.getMyNotifications({ limit: 1, read: false }),
    enabled: queryEnabled,
    retry: false,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['institutional-notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['student', 'notifications'] }),
    ]);
  };

  const markRead = useMutation({
    mutationFn: notificationApi.markRead,
    retry: false,
    onSuccess: async () => {
      await refresh();
      toast.success(t('تم نقل الإشعار إلى المقروءة', 'Notification moved to Read'));
    },
    onError: () => toast.error(t('تعذر تحديث الإشعار', 'Unable to update notification')),
  });

  const markAll = useMutation({
    mutationFn: notificationApi.markAllRead,
    retry: false,
    onSuccess: async () => {
      await refresh();
      toast.success(t('تم نقل جميع الإشعارات إلى المقروءة', 'All notifications moved to Read'));
    },
    onError: () => toast.error(t('تعذر تحديث الإشعارات', 'Unable to update notifications')),
  });

  const items = query.data?.items ?? [];
  const unreadCount = unreadQuery.data?.pagination?.total ?? 0;

  const openNotification = async (item: (typeof items)[number]) => {
    const id = item.id || item._id || '';
    if (!item.read && id) {
      try {
        await markRead.mutateAsync(id);
      } catch {
        // The read-state error is already shown by the mutation handler.
      }
    }
    const target = getNotificationTarget(item);
    if (target) navigate(target);
  };

  return (
    <PortalLayout
      title={t('الإشعارات والتنبيهات', 'Notifications and Alerts')}
      subtitle={t('قرارات الخطط والتوصيات ونتائج التحليل التلقائي', 'Plan decisions, recommendations, and automatic analysis results')}
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-2" role="tablist" aria-label={t('تصفية الإشعارات', 'Filter notifications')}>
          {(['all', 'read'] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={view === value}
              onClick={() => setView(value)}
              className="rounded-full border border-[#dfe1dd] px-4 py-2 text-xs font-bold"
              style={{ background: view === value ? '#9fe870' : '#fff' }}
            >
              {value === 'all' ? t('الكل', 'All') : t('المقروءة', 'Read')}
            </button>
          ))}
        </div>

        <span className="rounded-full bg-[#E7FDD8] px-3 py-1 text-xs font-bold text-[#1ba442]">
          {t('الجديدة', 'New')}: {unreadCount}
        </span>

        <button
          type="button"
          onClick={() => markAll.mutate()}
          disabled={markAll.isPending || unreadCount === 0}
          className="ms-auto inline-flex items-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {markAll.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
          {t('تعليم الكل كمقروء', 'Mark all read')}
        </button>
        <button
          type="button"
          onClick={() => query.refetch()}
          disabled={query.isFetching}
          className="rounded-full border border-[#dfe1dd] bg-white p-2 disabled:opacity-50"
          title={t('تحديث', 'Refresh')}
        >
          <RefreshCw size={15} className={query.isFetching ? 'animate-spin' : undefined} />
        </button>
      </div>

      {query.isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#1ba442]" /></div>
      ) : query.isError ? (
        <State
          text={t('تعذر تحميل الإشعارات', 'Unable to load notifications')}
          actionLabel={t('إعادة المحاولة', 'Retry')}
          onAction={() => query.refetch()}
        />
      ) : items.length ? (
        <div className="space-y-3">
          {items.map((item, index) => {
            const id = item.id || item._id || '';
            return (
              <ContentCard key={id || `notification-${index}`} className={item.read ? '' : 'border-[#9fe870]'}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => void openNotification(item)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      void openNotification(item);
                    }
                  }}
                  className="flex cursor-pointer items-start gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                >
                  <div className={`rounded-full p-3 ${item.read ? 'bg-[#f0f1ee]' : 'bg-[#E7FDD8]'}`}><Bell size={17} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <b className="text-sm">{language === 'ar' ? item.titleAr || item.title : item.title}</b>
                      {!item.read && <span className="rounded-full bg-[#E7FDD8] px-2 py-0.5 text-[10px] font-bold text-[#1ba442]">{t('جديد', 'New')}</span>}
                    </div>
                    <p className="mt-1 text-sm text-[#5b5e5a]">{language === 'ar' ? item.messageAr || item.message : item.message}</p>
                    <p className="mt-2 text-xs text-[#828782]">{new Date(item.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                  </div>
                  {!item.read && id && (
                    <button
                      type="button"
                      disabled={markRead.isPending}
                      onClick={(event) => {
                        event.stopPropagation();
                        markRead.mutate(id);
                      }}
                      className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[#9fe870] px-3 py-1.5 text-xs font-bold disabled:opacity-50"
                    >
                      {markRead.isPending && markRead.variables === id ? <Loader2 size={12} className="animate-spin" /> : <MailOpen size={12} />}
                      {t('مقروء', 'Read')}
                    </button>
                  )}
                </div>
              </ContentCard>
            );
          })}
        </div>
      ) : (
        <State text={view === 'all' ? t('لا توجد إشعارات جديدة', 'No new notifications') : t('لا توجد إشعارات مقروءة', 'No read notifications')} />
      )}
    </PortalLayout>
  );
}

function State({ text, actionLabel, onAction }: { text: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#dfe1dd] bg-white py-16 text-[#828782]">
      <Bell />
      <p className="mt-3 text-sm font-semibold">{text}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="mt-4 rounded-full bg-[#9fe870] px-4 py-2 text-xs font-bold text-[#0e0f0c]">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
