'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi, NotificationItem } from '@/lib/api';
import { useRouter } from '@/i18n/routing';
import { Check } from 'lucide-react';

interface Props {
  onClose: () => void;
  locale: 'en' | 'ar';
}

export function NotificationPanel({ onClose, locale }: Props) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then((r) => r.data),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markRead.mutate(item.id);
    }
    if (item.link) {
      router.push(item.link as any);
    }
    onClose();
  };

  const notifications = data?.data ?? [];

  return (
    <div className="ehms-notification-panel">
      <div className="ehms-notification-panel-header">
        <span>{locale === 'ar' ? 'الإشعارات' : 'Notifications'}</span>
        {notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            className="ehms-notification-mark-all"
            onClick={() => markAllRead.mutate()}
          >
            <Check size={12} aria-hidden />
            {locale === 'ar' ? 'تعليم الكل مقروءاً' : 'Mark all read'}
          </button>
        )}
      </div>

      <div className="ehms-notification-list">
        {isLoading && (
          <div className="ehms-notification-empty">
            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="ehms-notification-empty">
            {locale === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
          </div>
        )}

        {notifications.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`ehms-notification-item ${item.isRead ? 'is-read' : 'is-unread'}`}
            onClick={() => handleItemClick(item)}
          >
            <div className="ehms-notification-item-title">
              {item.title[locale] ?? item.title.en}
            </div>
            <div className="ehms-notification-item-body">
              {item.body[locale] ?? item.body.en}
            </div>
            <div className="ehms-notification-item-time">
              {new Date(item.createdAt).toLocaleDateString(
                locale === 'ar' ? 'ar-SA' : 'en-US',
                {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                },
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
