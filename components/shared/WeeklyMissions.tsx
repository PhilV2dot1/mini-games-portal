'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWeeklyMissions } from '@/hooks/useWeeklyMissions';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';
import { MISSION_ICONS, getDaysUntilReset } from '@/lib/missions/missions';

export function WeeklyMissions() {
  const { missions, loading, xpJustAwarded } = useWeeklyMissions();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (xpJustAwarded) {
      addNotification({
        type: 'badge',
        title: t('missions.missionComplete') || 'Mission Complete!',
        message: t('missions.xpAwarded') || '+100 XP',
        points: xpJustAwarded,
        icon: '🎯',
      });
    }
  }, [xpJustAwarded, addNotification, t]);

  if (loading) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-3" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 dark:bg-gray-600 rounded mb-2" />
        ))}
      </div>
    );
  }

  if (!missions.length) return null;

  const completedCount = missions.filter(m => m.completed).length;
  const daysLeft = getDaysUntilReset();

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <h3 className="font-black text-gray-900 dark:text-white text-sm">
            {t('missions.title') || 'Weekly Missions'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {completedCount}/5
          </span>
          <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold">
            {daysLeft}d
          </span>
        </div>
      </div>

      {/* XP awarded toast */}
      <AnimatePresence>
        {xpJustAwarded && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-3 bg-purple-100 dark:bg-purple-900/40 rounded-lg px-3 py-2 text-center"
          >
            <span className="text-purple-700 dark:text-purple-300 font-black text-sm">
              ✨ +{xpJustAwarded} XP — {t('missions.missionComplete') || 'Mission Complete!'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission list */}
      <div className="space-y-2">
        {missions.map((mission) => {
          const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
          const icon = MISSION_ICONS[mission.type] ?? '🎯';

          return (
            <div
              key={mission.mission_id}
              className={`rounded-lg p-2.5 transition-all ${
                mission.completed
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{icon}</span>
                  <span className={`text-xs font-semibold ${
                    mission.completed
                      ? 'text-green-700 dark:text-green-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {t(`missions.type.${mission.type}`) || mission.type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {mission.progress}/{mission.target}
                  </span>
                  {mission.completed ? (
                    <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
                  ) : (
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                      +{mission.xp_reward} XP
                    </span>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className={`h-1.5 rounded-full ${
                    mission.completed
                      ? 'bg-green-500'
                      : 'bg-purple-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
