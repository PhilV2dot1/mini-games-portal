'use client';

import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Props {
  userId: string | null;
}

export function PushNotificationToggle({ userId }: Props) {
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications(userId);

  if (permission === 'unsupported' || !userId) return null;
  if (permission === 'denied') {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Notifications blocked — enable in browser settings
      </p>
    );
  }

  return (
    <button
      data-testid="push-notification-toggle"
      data-subscribed={isSubscribed ? 'true' : 'false'}
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={isLoading}
      className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors
        border-gray-300 dark:border-gray-600
        hover:bg-gray-100 dark:hover:bg-gray-700
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span>{isSubscribed ? '🔔' : '🔕'}</span>
      <span className="text-gray-700 dark:text-gray-200">
        {isLoading
          ? 'Loading…'
          : isSubscribed
          ? 'Notifications ON'
          : 'Enable Notifications'}
      </span>
    </button>
  );
}
