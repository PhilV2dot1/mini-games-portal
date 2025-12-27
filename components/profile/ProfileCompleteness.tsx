'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  calculateProfileCompleteness,
  getLevelBadge,
  getMotivationalMessage,
} from '@/lib/utils/profileCompleteness';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ProfileCompletenessProps {
  profile: {
    display_name?: string;
    username?: string;
    bio?: string;
    avatar_type?: 'default' | 'predefined' | 'custom';
    social_links?: {
      twitter?: string;
      farcaster?: string;
      discord?: string;
    };
    total_points?: number;
    stats?: {
      gamesPlayed?: number;
    };
  };
  compact?: boolean; // If true, show only progress bar without checklist
}

export function ProfileCompleteness({ profile, compact = false }: ProfileCompletenessProps) {
  const { t } = useLanguage();
  const completeness = calculateProfileCompleteness(profile, t);
  const levelBadge = getLevelBadge(completeness.level, t);
  const message = getMotivationalMessage(completeness.percentage, t);

  // Color based on completion percentage
  const getProgressColor = (percentage: number): string => {
    if (percentage === 100) return 'bg-yellow-500';
    if (percentage >= 70) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-green-500';
    return 'bg-gray-400';
  };

  const progressColor = getProgressColor(completeness.percentage);

  if (compact) {
    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl border-2 border-gray-300 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{levelBadge.emoji}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{t('profile.completion.profile') || 'Profile'}</h3>
              <p className={`text-xs font-medium ${levelBadge.color}`}>
                {levelBadge.text}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{completeness.percentage}%</p>
            <p className="text-xs text-gray-600">
              {completeness.completedChecks}/{completeness.totalChecks} {t('profile.completion.completed') || 'completed'}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completeness.percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full ${progressColor} rounded-full`}
          />
        </div>

        {completeness.percentage < 100 && completeness.nextAction && (
          <p className="text-xs text-gray-600 mt-2">
            <span className="font-semibold">{t('profile.completion.nextStep') || 'Next step'}:</span> {completeness.nextAction}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-xl border-2 border-gray-300 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{levelBadge.emoji}</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('profile.completion.title') || 'Profile Completion'}</h2>
            <p className={`text-sm font-medium ${levelBadge.color}`}>
              {levelBadge.text}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold text-gray-900">{completeness.percentage}%</p>
          <p className="text-sm text-gray-600">
            {completeness.completedChecks}/{completeness.totalChecks} {t('profile.completion.completed') || 'completed'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completeness.percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full ${progressColor} rounded-full shadow-lg`}
          />
        </div>
        <p className="text-center text-sm text-gray-700 mt-2 font-medium">{message}</p>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {t('profile.completion.actionsToComplete') || 'Actions to complete'}
        </h3>
        {completeness.checks.map((check, index) => (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
              check.completed
                ? 'bg-green-50 border-2 border-green-300'
                : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Checkbox */}
            <div className="flex-shrink-0 mt-0.5">
              {check.completed ? (
                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border-2 border-gray-400 bg-white" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4
                  className={`font-semibold text-sm ${
                    check.completed ? 'text-green-900 line-through' : 'text-gray-900'
                  }`}
                >
                  {check.label}
                </h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    check.completed
                      ? 'bg-green-200 text-green-800'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  +{check.weight}%
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{check.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Call to action */}
      {completeness.percentage < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl"
        >
          <p className="text-sm text-gray-900">
            <span className="font-semibold">💡 {t('profile.completion.tip') || 'Tip'}:</span> {t('profile.completion.tipMessage') || 'A complete profile helps you stand out and gain the trust of the community!'}
          </p>
        </motion.div>
      )}

      {/* Celebration for 100% */}
      {completeness.percentage === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400 rounded-xl text-center"
        >
          <p className="text-2xl mb-2">🎉 🏆 🎉</p>
          <p className="text-lg font-bold text-gray-900">{t('profile.completion.complete') || '100% Complete Profile!'}</p>
          <p className="text-sm text-gray-700 mt-1">
            {t('profile.completion.completeMessage') || 'You are now an exemplary member of the community!'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
