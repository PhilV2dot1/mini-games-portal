'use client';

import React from 'react';
import { getPlayerLevel, getLevelProgress, PlayerLevel } from '@/lib/levels/levels';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface PlayerLevelBadgeProps {
  xp: number;
  /** 'compact' = icon + level number only, 'full' = icon + name + progress bar */
  variant?: 'compact' | 'full';
  className?: string;
}

export function PlayerLevelBadge({ xp, variant = 'compact', className = '' }: PlayerLevelBadgeProps) {
  const { t } = useLanguage();
  const level = getPlayerLevel(xp);
  const progress = getLevelProgress(xp);

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${level.bgColor} ${level.color} ${className}`}
        title={`${t(`levels.${level.name}`)} — ${xp} XP`}
      >
        <span>{level.icon}</span>
        <span>{t(`levels.${level.name}`)}</span>
      </span>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className={`flex items-center gap-1.5 text-sm font-bold ${level.color}`}>
          <span className="text-base">{level.icon}</span>
          <span>{t(`levels.${level.name}`)}</span>
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{xp} XP</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${level.color.replace('text-', 'bg-')}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
