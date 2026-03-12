'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, AppNotification } from '@/lib/notifications/NotificationContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';

function timeAgo(date: Date, t: (k: string) => string): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return t('notifications.justNow');
  if (diff < 3600) return `${Math.floor(diff / 60)}${t('notifications.minAgo')}`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}${t('notifications.hAgo')}`;
  return `${Math.floor(diff / 86400)}${t('notifications.dAgo')}`;
}

function notifIcon(type: AppNotification['type'], icon?: string): string {
  if (icon) return icon;
  switch (type) {
    case 'daily_challenge': return '🎯';
    case 'streak': return '🔥';
    case 'badge': return '🏅';
    case 'points': return '⭐';
    default: return '🔔';
  }
}

export function NotificationCenter() {
  const { notifications, unreadCount, markAllRead, dismiss, clearAll } = useNotifications();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleOpen() {
    setOpen(prev => !prev);
    if (!open && unreadCount > 0) {
      // Mark all read when opening
      setTimeout(markAllRead, 500);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={t('notifications.title')}
        data-testid="notification-bell"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {/* Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-black text-gray-900 rounded-full px-0.5"
              style={{ background: 'var(--chain-primary, #FCFF52)' }}
              data-testid="notification-badge"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            data-testid="notification-dropdown"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <span className="font-bold text-gray-900 dark:text-white text-sm">
                {t('notifications.title')}
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {t('notifications.clearAll')}
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
                  {t('notifications.empty')}
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 group transition-colors ${!notif.read ? 'bg-yellow-50/60 dark:bg-yellow-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                    data-testid="notification-item"
                  >
                    <span className="text-xl shrink-0 mt-0.5">{notifIcon(notif.type, notif.icon)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 dark:text-white leading-snug">
                        {notif.title}
                        {notif.points && (
                          <span className="ml-1.5 font-black text-xs" style={{ color: 'var(--chain-primary, #FCFF52)' }}>
                            +{notif.points} pts
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                        {notif.message}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                        {timeAgo(notif.timestamp, t)}
                      </div>
                    </div>
                    <button
                      onClick={() => dismiss(notif.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all"
                      aria-label={t('toast.closeNotification')}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
