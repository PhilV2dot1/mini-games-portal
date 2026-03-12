'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useDailyChallenge } from '@/hooks/useDailyChallenge';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useNotifications } from '@/lib/notifications/NotificationContext';

const GAME_ROUTES: Record<string, string> = {
  blackjack:      '/blackjack',
  rps:            '/rps',
  tictactoe:      '/tictactoe',
  jackpot:        '/jackpot',
  '2048':         '/2048',
  mastermind:     '/mastermind',
  snake:          '/games/snake',
  minesweeper:    '/games/minesweeper',
  'connect-five': '/games/connect-five',
  solitaire:      '/games/solitaire',
  yahtzee:        '/games/yahtzee',
  sudoku:         '/games/sudoku',
  memory:         '/games/memory',
  maze:           '/games/maze',
  tetris:         '/games/tetris',
  poker:          '/games/poker',
};

const GAME_ICONS: Record<string, string> = {
  blackjack:      '🃏',
  rps:            '✂️',
  tictactoe:      '⭕',
  jackpot:        '🎰',
  '2048':         '🟨',
  mastermind:     '🔵',
  snake:          '🐍',
  minesweeper:    '💣',
  'connect-five': '🟡',
  solitaire:      '♠️',
  yahtzee:        '🎲',
  sudoku:         '🔢',
  memory:         '🧠',
  maze:           '🌀',
  tetris:         '🟦',
  poker:          '♠️',
};

export function DailyChallenge() {
  const { challenge, loading, pointsJustAwarded } = useDailyChallenge();
  const { t, language } = useLanguage();
  const { addNotification } = useNotifications();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (pointsJustAwarded && !notifiedRef.current) {
      notifiedRef.current = true;
      addNotification({
        type: 'daily_challenge',
        title: t('daily.challengeComplete') || 'Challenge Complete!',
        message: t('daily.newChallengeTomorrow') || 'New challenge tomorrow!',
        points: pointsJustAwarded,
        icon: '🎯',
      });
    }
  }, [pointsJustAwarded, addNotification, t]);

  if (loading) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-3" />
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mb-3" />
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full" />
      </div>
    );
  }

  if (!challenge) return null;

  const description = language === 'fr' ? challenge.description_fr : challenge.description;
  const progress = challenge.progress;
  const target = challenge.target;
  const pct = Math.min(100, Math.round((progress / target) * 100));
  const completed = challenge.completed;
  const gameRoute = GAME_ROUTES[challenge.game_id] ?? '/';
  const gameIcon = GAME_ICONS[challenge.game_id] ?? '🎮';

  return (
    <div
      className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 border-2 shadow-lg overflow-hidden"
      style={{ borderColor: completed ? 'var(--chain-primary, #FCFF52)' : undefined }}
      data-testid="daily-challenge-card"
    >
      {/* Completed glow */}
      {completed && (
        <div className="absolute inset-0 pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle at 50% 50%, var(--chain-primary, #FCFF52) 0%, transparent 70%)' }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {t('daily.title') || 'Daily Challenge'}
          </span>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full border"
          style={completed
            ? { backgroundColor: 'var(--chain-primary, #FCFF52)', color: '#111', borderColor: 'transparent' }
            : { borderColor: 'currentColor', color: 'inherit', opacity: 0.6 }
          }
        >
          {completed ? (t('daily.completed') || '✅ Completed') : `+${challenge.bonus_points} pts`}
        </span>
      </div>

      {/* Challenge description */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{gameIcon}</span>
        <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
          {description}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{t('daily.progress') || 'Progress'}</span>
          <span className="font-bold">{progress} / {target}</span>
        </div>
        <div className="h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'var(--chain-primary, #FCFF52)' }}
          />
        </div>
      </div>

      {/* CTA */}
      {!completed && (
        <Link
          href={gameRoute}
          className="block text-center text-xs font-bold py-2 rounded-lg transition-all hover:brightness-110"
          style={{ backgroundColor: 'var(--chain-primary, #FCFF52)', color: '#111' }}
          data-testid="daily-challenge-cta"
        >
          {t('daily.playNow') || 'Play Now →'}
        </Link>
      )}

      {/* Points awarded toast */}
      <AnimatePresence>
        {pointsJustAwarded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl"
          >
            <div className="text-center">
              <div className="text-4xl mb-1">🎉</div>
              <div className="text-white font-black text-lg">
                +{pointsJustAwarded} {t('home.points') || 'Points'}!
              </div>
              <div className="text-yellow-300 text-sm font-semibold mt-1">
                {t('daily.challengeComplete') || 'Challenge Complete!'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
