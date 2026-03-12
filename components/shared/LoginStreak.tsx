'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoginStreak } from '@/hooks/useLoginStreak';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAccount } from 'wagmi';

// Milestone thresholds and their icons
const MILESTONES = [
  { days: 30, icon: '👑', label: '30' },
  { days: 14, icon: '💎', label: '14' },
  { days: 7,  icon: '🔥', label: '7'  },
  { days: 3,  icon: '⚡', label: '3'  },
  { days: 1,  icon: '✨', label: '1'  },
];

function getNextMilestone(streak: number) {
  return MILESTONES.find(m => m.days > streak) ?? MILESTONES[MILESTONES.length - 1];
}

function getCurrentIcon(streak: number) {
  for (const m of MILESTONES) {
    if (streak >= m.days) return m.icon;
  }
  return '✨';
}

function getBonusForDay(streak: number) {
  if (streak >= 30) return 500;
  if (streak >= 14) return 200;
  if (streak >= 7)  return 100;
  if (streak >= 3)  return 30;
  return 10;
}

export function LoginStreak() {
  const { isAuthenticated } = useAuth();
  const { isConnected } = useAccount();
  const { t } = useLanguage();
  const streak = useLoginStreak();
  const toastShownRef = useRef(false);

  // Only show for authenticated/wallet users
  if (!isAuthenticated && !isConnected) return null;
  if (streak.loading) return null;
  if (streak.currentStreak === 0) return null;

  const icon = getCurrentIcon(streak.currentStreak);
  const next = getNextMilestone(streak.currentStreak);
  const daysToNext = next.days - streak.currentStreak;
  const nextBonus = getBonusForDay(next.days);

  return (
    <>
      {/* Bonus earned toast — shown once per day */}
      <AnimatePresence>
        {streak.bonusPointsEarned && !toastShownRef.current && (
          <motion.div
            key="streak-toast"
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.4 }}
            onAnimationComplete={() => { toastShownRef.current = true; }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-2xl shadow-2xl border-2 flex items-center gap-3 pointer-events-none"
            style={{ borderColor: 'var(--chain-primary, #FCFF52)' }}
            data-testid="streak-bonus-toast"
          >
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="font-black text-sm">
                🔥 {t('streak.day')} {streak.currentStreak} — +{streak.bonusPointsEarned} {t('home.points') || 'pts'}!
              </div>
              <div className="text-xs opacity-70">{t('streak.loginBonus') || 'Daily login bonus'}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak card */}
      <div
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 shadow-lg"
        data-testid="login-streak-card"
      >
        <div className="flex items-center justify-between">
          {/* Left: streak count */}
          <div className="flex items-center gap-3">
            <motion.span
              key={streak.currentStreak}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-4xl"
            >
              {icon}
            </motion.span>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  {streak.currentStreak}
                </span>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {streak.currentStreak === 1 ? t('streak.day') || 'day' : t('streak.days') || 'days'}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {t('streak.title') || 'Login Streak'}
              </div>
            </div>
          </div>

          {/* Right: next milestone */}
          <div className="text-right">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
              {t('streak.nextReward') || 'Next reward'}
            </div>
            <div className="text-sm font-black" style={{ color: 'var(--chain-primary, #FCFF52)' }}>
              {next.icon} +{nextBonus} pts
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              {daysToNext === 1
                ? t('streak.tomorrowReach') || 'Tomorrow!'
                : `${t('streak.inDays') || 'in'} ${daysToNext} ${t('streak.days') || 'days'}`
              }
            </div>
          </div>
        </div>

        {/* Progress bar toward next milestone */}
        <div className="mt-3">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, ((streak.currentStreak % next.days) / next.days) * 100 || (streak.currentStreak >= next.days ? 100 : (streak.currentStreak / next.days) * 100))}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'var(--chain-primary, #FCFF52)' }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{streak.currentStreak}</span>
            <span>{next.days} {next.icon}</span>
          </div>
        </div>

        {/* Best streak */}
        {streak.bestStreak > streak.currentStreak && (
          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 text-right">
            {t('streak.best') || 'Best'}: {streak.bestStreak} 🏆
          </div>
        )}
      </div>
    </>
  );
}
