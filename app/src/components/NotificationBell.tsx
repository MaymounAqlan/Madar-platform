import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Dices, Loader2, MailOpen, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { notificationApi } from '@/services/notificationApi';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { isDevelopmentTestDataEnabled } from '@/utils/testDataGenerator';
import type { NotificationItem } from '@/types/api.types';
import { getNotificationTarget } from '@/utils/notificationNavigation';

interface NotificationBellProps {
  notificationPath: string | null;
}

function timeAgo(date: string, language: 'ar' | 'en'): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return language === 'ar' ? 'الآن' : 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return language === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return language === 'ar' ? `منذ ${hours} ساعة` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return language === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
}

function getNotificationIcon(type: NotificationItem['type']) {
  switch (type) {
    case 'match': return <span className="text-blue-600">●</span>;
    case 'application_update': return <span className="text-purple-600">●</span>;
    case 'message': return <span className="text-indigo-600">●</span>;
    case 'alert': return <span className="text-red-600">●</span>;
    case 'reminder': return <span className="text-yellow-600">●</span>;
    default: return <span className="text-green-600">●</span>;
  }
}

export default function NotificationBell({ notificationPath }: NotificationBellProps) {
  const { t, language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [detailItem, setDetailItem] = useState<NotificationItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => notificationApi.getMyNotifications({ read: false, limit: 100 }),
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const recentQuery = useQuery({
    queryKey: ['notifications', 'recent', activeTab],
    queryFn: async () => notificationApi.getMyNotifications({ limit: 30, read: activeTab === 'read' }),
    enabled: open,
    staleTime: 15000,
    refetchInterval: open ? 15000 : false,
    refetchOnWindowFocus: true,
  });

  const markReadMutation = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'notifications'] });
      queryClient.invalidateQueries({ queryKey: ['institutional-notifications'] });
    },
    onError: () => {
      toast.error(t('تعذر تحديث الإشعار', 'Unable to update notification'));
    },
  });

  const markAllMutation = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'notifications'] });
      queryClient.invalidateQueries({ queryKey: ['institutional-notifications'] });
      toast.success(t('تم تعليم جميع الإشعارات كمقروءة', 'All notifications marked as read'));
    },
    onError: () => {
      toast.error(t('تعذر تحديث الإشعارات', 'Unable to update notifications'));
    },
  });

  const { user } = useAuth();
  const generateTestMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('No user');
      const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const types: NotificationItem['type'][] = ['system', 'alert', 'reminder', 'application_update', 'message', 'match'];
      const type = types[Math.floor(Math.random() * types.length)];
      return notificationApi.create({
        userId: user.id,
        type,
        title: `Test notification ${id.slice(-4)}`,
        titleAr: `إشعار تجريبي ${id.slice(-4)}`,
        message: 'This is a test notification generated for development testing.',
        messageAr: 'هذا إشعار تجريبي مولّد لأغراض الاختبار والتطوير.',
        read: false,
        actionUrl: notificationPath || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'notifications'] });
      queryClient.invalidateQueries({ queryKey: ['institutional-notifications'] });
      toast.success(t('تم إنشاء إشعار تجريبي', 'Test notification created'));
    },
    onError: () => {
      toast.error(t('تعذر إنشاء الإشعار التجريبي', 'Unable to create test notification'));
    },
  });

  const unreadCount = unreadQuery.data?.pagination?.total ?? 0;
  const recentItems = recentQuery.data?.data ?? [];

  const filteredItems = recentItems;

  const handleItemClick = async (item: NotificationItem) => {
    const id = item.id || item._id || '';
    if (!item.read && id) {
      try {
        await markReadMutation.mutateAsync(id);
      } catch {
        // The mutation already reports the error; navigation should remain available.
      }
    }
    const target = getNotificationTarget(item, notificationPath);
    setOpen(false);
    setDetailItem(null);
    if (target) navigate(target);
  };

  const handleAction = (item: NotificationItem) => {
    setOpen(false);
    setDetailItem(null);
    const target = getNotificationTarget(item, notificationPath);
    if (target) navigate(target);
  };

  const handleViewAll = () => {
    setOpen(false);
    if (notificationPath) navigate(notificationPath);
  };

  const handleMarkAll = () => {
    markAllMutation.mutate(undefined, {
      onSuccess: () => {
        setActiveTab('read');
      },
    });
  };

  const titleText = language === 'ar' ? (detailItem?.titleAr || detailItem?.title) : detailItem?.title;
  const messageText = language === 'ar' ? (detailItem?.messageAr || detailItem?.message) : detailItem?.message;

  const tabClass = (tab: 'all' | 'unread' | 'read') =>
    `flex-1 rounded-lg px-2 py-1.5 text-xs font-bold transition-colors ${
      activeTab === tab
        ? 'bg-[#9fe870] text-[#0e0f0c]'
        : 'text-[#5b5e5a] hover:bg-[#f0f1ee]'
    }`;

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        title={
          !notificationPath
            ? language === 'ar'
              ? `لديك ${unreadCount} إشعار${unreadCount === 1 ? '' : 'ات'} غير مقروءة`
              : `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
            : language === 'ar'
              ? `لديك ${unreadCount} إشعار${unreadCount === 1 ? '' : 'ات'} غير مقروءة`
              : `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
        }
        className="relative flex h-11 w-11 items-center justify-center rounded-full border bg-white p-2 text-[#0e0f0c] shadow-md transition-all hover:border-[#9fe870] hover:bg-[#f7fff2] hover:text-[#1ba442] hover:shadow-lg"
        style={{ borderColor: '#dfe1dd' }}
      >
        <Bell size={22} strokeWidth={2} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#9fe870] shadow-sm" />
        )}
      </button>

      {open && (
        <div
          className="absolute z-50 mt-2 w-80 overflow-hidden rounded-2xl border bg-white shadow-xl sm:w-96"
          style={{
            borderColor: '#dfe1dd',
            [isRTL ? 'left' : 'right']: 0,
          }}
        >
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: '#dfe1dd' }}>
            <h3 className="text-sm font-bold text-[#0e0f0c]">{t('الإشعارات', 'Notifications')}</h3>
            <div className="flex items-center gap-1">
              {isDevelopmentTestDataEnabled && (
                <button
                  onClick={() => generateTestMutation.mutate()}
                  disabled={generateTestMutation.isPending}
                  className="rounded-lg p-1.5 text-xs font-semibold text-[#B45309] transition-colors hover:bg-[#FEF3C7] disabled:opacity-50"
                  title={t('إنشاء إشعار تجريبي', 'Generate test notification')}
                >
                  {generateTestMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Dices size={14} />}
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  disabled={markAllMutation.isPending}
                  className="rounded-lg p-1.5 text-xs font-semibold text-[#5b5e5a] transition-colors hover:bg-[#f0f1ee] disabled:opacity-50"
                  title={t('تعليم الكل كمقروء', 'Mark all as read')}
                >
                  {markAllMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-[#5b5e5a] transition-colors hover:bg-[#f0f1ee]"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex gap-1 border-b bg-[#f7f8f6] px-3 py-2" style={{ borderColor: '#f0f1ee' }}>
            <button className={tabClass('unread')} onClick={() => setActiveTab('unread')}>
              {t('غير مقروء', 'Unread')}
              {unreadCount > 0 && (
                <span className="mr-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button className={tabClass('read')} onClick={() => setActiveTab('read')}>
              {t('مقروء', 'Read')}
            </button>
            <button className={tabClass('all')} onClick={() => setActiveTab('all')}>
              {t('الكل', 'All')}
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {recentQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-[#9fe870]" />
              </div>
            ) : recentQuery.isError ? (
              <div className="px-4 py-6 text-center text-sm text-[#5b5e5a]">
                {t('تعذر تحميل الإشعارات', 'Unable to load notifications')}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center px-4 py-8 text-center text-sm text-[#828782]">
                <Bell size={32} className="mb-2 text-[#dfe1dd]" />
                {activeTab === 'unread'
                  ? t('لا توجد إشعارات غير مقروءة', 'No unread notifications')
                  : activeTab === 'read'
                    ? t('لا توجد إشعارات مقروءة', 'No read notifications')
                    : t('لا توجد إشعارات', 'No notifications')}
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#f0f1ee' }}>
                {filteredItems.map((item) => {
                  const itemTitle = language === 'ar' ? (item.titleAr || item.title) : item.title;
                  const itemMessage = language === 'ar' ? (item.messageAr || item.message) : item.message;
                  return (
                    <button
                      key={item.id}
                      onClick={() => void handleItemClick(item)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-start transition-colors hover:bg-[#f7f8f6]"
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                          item.read ? 'bg-[#f0f1ee] text-[#828782]' : 'bg-[#E7FDD8] text-[#1ba442]'
                        }`}
                      >
                        {getNotificationIcon(item.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-xs font-bold ${item.read ? 'text-[#5b5e5a]' : 'text-[#0e0f0c]'}`}>
                          {itemTitle}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-[#828782]">{itemMessage}</p>
                        <p className="mt-1 text-[10px] text-[#a0a39f]">{timeAgo(item.createdAt, language as 'ar' | 'en')}</p>
                      </div>
                      {!item.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#1ba442]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t px-4 py-2 text-center" style={{ borderColor: '#dfe1dd' }}>
            {notificationPath && (
              <button onClick={handleViewAll} className="text-xs font-bold text-[#1ba442] hover:underline">
                {t('عرض كل الإشعارات', 'View all notifications')}
              </button>
            )}
          </div>
        </div>
      )}

      {detailItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border bg-white p-5 shadow-xl" style={{ borderColor: '#dfe1dd' }}>
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  detailItem.read ? 'bg-[#f0f1ee] text-[#828782]' : 'bg-[#E7FDD8] text-[#1ba442]'
                }`}
              >
                {getNotificationIcon(detailItem.type)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#0e0f0c]">{titleText}</h4>
                <p className="text-[10px] text-[#828782]">
                  {new Date(detailItem.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                </p>
              </div>
            </div>
            <p className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-[#5b5e5a]">{messageText}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDetailItem(null)}
                className="rounded-full border px-4 py-2 text-xs font-semibold transition-colors hover:bg-[#f0f1ee]"
                style={{ borderColor: '#dfe1dd' }}
              >
                {t('إغلاق', 'Close')}
              </button>
              <button
                onClick={() => handleAction(detailItem)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#9fe870] px-4 py-2 text-xs font-bold text-[#0e0f0c] disabled:opacity-50"
                disabled={markReadMutation.isPending && !detailItem.read}
              >
                {markReadMutation.isPending && !detailItem.read ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <MailOpen size={12} />
                )}
                {detailItem.actionUrl ? t('الانتقال', 'Go') : t('عرض الكل', 'View all')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
