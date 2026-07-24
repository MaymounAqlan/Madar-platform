import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Bell, CheckCheck, Loader2, MailOpen, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import PortalLayout from '@/components/PortalLayout';
import ContentCard from '@/components/ContentCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/hooks/useStudent';
import { cn } from '@/lib/utils';
import { notificationApi } from '@/services';
import type { NotificationItem } from '@/types/api.types';
import { getNotificationTarget } from '@/utils/notificationNavigation';

type NotificationView = 'all' | 'read';

function displayText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim();
    return text === '[object Object]' ? '' : text;
  }
  if (Array.isArray(value)) return value.map(displayText).filter(Boolean).join(', ');
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return displayText(record.title ?? record.message ?? record.text ?? record.name ?? record.description);
  }
  return '';
}

export default function StudentNotifications() {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<NotificationView>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  // In this inbox, "All" means all new notifications. Read notifications live
  // in their own view so an item moves as soon as the user reads it.
  const query = useNotifications({ limit: 100, read: view === 'read' });
  const unreadQuery = useNotifications({ limit: 1, read: false });
  const notifications = query.data?.data ?? [];
  const unreadCount = unreadQuery.data?.pagination?.total ?? 0;

  const groupedNotifications = notifications.reduce<Record<string, NotificationItem[]>>((groups, item) => {
    const group = displayText(item.type) || t('عام', 'General');
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});

  const refreshNotificationCaches = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['student', 'notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      queryClient.invalidateQueries({ queryKey: ['institutional-notifications'] }),
    ]);
  };

  const handleMarkRead = async (id: string) => {
    setUpdatingId(id);
    try {
      await notificationApi.markRead(id);
      await refreshNotificationCaches();
      toast.success(t('تم نقل الإشعار إلى المقروءة', 'Notification moved to Read'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      toast.error(message || t('تعذر تحديث الإشعار', 'Failed to update notification'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllRead();
      await refreshNotificationCaches();
      toast.success(t('تم نقل جميع الإشعارات إلى المقروءة', 'All notifications moved to Read'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      toast.error(message || t('تعذر تحديث الإشعارات', 'Failed to update notifications'));
    } finally {
      setMarkingAll(false);
    }
  };

  const handleOpenNotification = async (item: NotificationItem) => {
    const id = item.id || item._id || '';
    if (!item.read && id) await handleMarkRead(id);
    const target = getNotificationTarget(item);
    if (target) navigate(target);
  };

  return (
    <PortalLayout title={t('الإشعارات', 'Notifications')}>
      <div className={cn('space-y-5', isRTL ? 'rtl' : 'ltr')}>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2" role="tablist" aria-label={t('تصفية الإشعارات', 'Filter notifications')}>
            {(['all', 'read'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={view === filter}
                onClick={() => setView(filter)}
                className={cn(
                  'rounded-full px-4 py-2 text-xs font-semibold transition-colors',
                  view === filter
                    ? 'bg-[#9fe870] text-[#0e0f0c]'
                    : 'border border-[#dfe1dd] bg-white text-[#5b5e5a]',
                )}
              >
                {filter === 'all' ? t('الكل', 'All') : t('المقروءة', 'Read')}
              </button>
            ))}
          </div>

          <span className="rounded-full bg-[#E7FDD8] px-3 py-1 text-xs font-bold text-[#1ba442]">
            {t('الجديدة', 'New')}: {unreadCount}
          </span>

          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              title={t('تحديث', 'Refresh')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dfe1dd] bg-white text-[#5b5e5a] hover:bg-[#f0f1ee] disabled:opacity-50"
            >
              <RefreshCw size={15} className={query.isFetching ? 'animate-spin' : undefined} />
            </button>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={markingAll || unreadCount === 0}
              className="inline-flex items-center gap-2 rounded-full border border-[#dfe1dd] bg-white px-4 py-2 text-sm font-semibold text-[#0e0f0c] hover:bg-[#f0f1ee] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingAll ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
              {t('تعليم الكل كمقروء', 'Mark all read')}
            </button>
          </div>
        </div>

        {query.isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={30} className="animate-spin text-[#1ba442]" />
          </div>
        ) : query.isError ? (
          <NotificationState
            text={t('تعذر تحميل الإشعارات', 'Unable to load notifications')}
            actionLabel={t('إعادة المحاولة', 'Retry')}
            onAction={() => query.refetch()}
          />
        ) : notifications.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(groupedNotifications).map(([group, items]) => (
              <section key={group} className="space-y-3">
                <p className="px-1 text-xs font-bold text-[#5b5e5a]">{group}</p>
                {items.map((item) => {
                  const id = item.id || item._id || '';
                  return (
                    <ContentCard key={id} className={cn('border transition-all', item.read ? 'border-[#dfe1dd]' : 'border-[#9fe870]')}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => void handleOpenNotification(item)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            void handleOpenNotification(item);
                          }
                        }}
                        className="flex cursor-pointer items-start gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#9fe870]"
                      >
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', item.read ? 'bg-[#f0f1ee]' : 'bg-[#F4FCF0]')}>
                          <Bell size={18} className={item.read ? 'text-[#5b5e5a]' : 'text-[#1ba442]'} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-[#0e0f0c]">{displayText(item.title) || t('إشعار', 'Notification')}</h3>
                            {!item.read && <span className="rounded-full bg-[#E7FDD8] px-2 py-0.5 text-[10px] font-semibold text-[#1ba442]">{t('جديد', 'New')}</span>}
                          </div>
                          <p className="mt-1 text-xs font-semibold text-[#5b5e5a]">{displayText(item.message)}</p>
                          <p className="mt-2 text-[10px] font-semibold text-[#828782]">
                            {new Date(item.createdAt).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                        {!item.read && id && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleMarkRead(id);
                            }}
                            disabled={updatingId === id}
                            className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[#9fe870] px-3 py-1.5 text-xs font-semibold text-[#0e0f0c] disabled:opacity-50"
                          >
                            {updatingId === id ? <Loader2 size={12} className="animate-spin" /> : <MailOpen size={12} />}
                            {t('مقروء', 'Read')}
                          </button>
                        )}
                      </div>
                    </ContentCard>
                  );
                })}
              </section>
            ))}
          </div>
        ) : (
          <NotificationState
            text={view === 'all' ? t('لا توجد إشعارات جديدة', 'No new notifications') : t('لا توجد إشعارات مقروءة', 'No read notifications')}
          />
        )}
      </div>
    </PortalLayout>
  );
}

function NotificationState({ text, actionLabel, onAction }: { text: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-[#dfe1dd] bg-white py-16">
      <Bell size={40} className="text-[#dfe1dd]" />
      <p className="mt-3 text-sm font-semibold text-[#828782]">{text}</p>
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="mt-4 rounded-full bg-[#9fe870] px-4 py-2 text-xs font-bold text-[#0e0f0c]">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
