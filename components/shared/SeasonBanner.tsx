'use client';

import React from 'react';
import Link from 'next/link';
import { useSeason } from '@/hooks/useSeason';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export function SeasonBanner() {
  const { season, loading } = useSeason();
  const { t } = useLanguage();

  if (loading || !season) return null;

  const pct = (() => {
    const total = new Date(season.ends_at).getTime() - new Date(season.starts_at).getTime();
    const elapsed = Date.now() - new Date(season.starts_at).getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  })();

  return (
    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-800 dark:to-indigo-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏅</span>
          <div>
            <div className="text-white font-black text-sm">
              {t('seasons.current') || season.name}
            </div>
            <div className="text-violet-200 text-xs">
              {season.days_remaining === 0
                ? (t('seasons.lastDay') || 'Last day!')
                : `${season.days_remaining} ${t('seasons.daysLeft') || 'days left'}`}
            </div>
          </div>
        </div>
        <Link
          href="/leaderboard?tab=season"
          className="text-xs font-bold bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          {t('seasons.viewRanking') || 'View Ranking →'}
        </Link>
      </div>
      <div className="w-full bg-white/20 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-1.5 bg-white rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-violet-200 text-xs mt-1">
        <span>{t('seasons.start') || 'Start'}</span>
        <span>{pct}%</span>
        <span>{t('seasons.end') || 'End'}</span>
      </div>
    </div>
  );
}
