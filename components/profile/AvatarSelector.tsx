'use client';

/**
 * AvatarSelector - Grid selector for predefined avatars
 *
 * Displays 30 predefined gaming avatars in a grid.
 * Shows unlock status for custom avatar upload.
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface AvatarSelectorProps {
  currentAvatar?: string;
  onSelect: (avatarUrl: string, type: 'default' | 'predefined') => void;
  canUploadCustom?: boolean;
  onUploadCustomClick?: () => void;
}

// List of all predefined avatars
const PREDEFINED_AVATARS = [
  'default-player',
  'controller',
  'joystick',
  'trophy',
  'crown',
  'star',
  'rocket',
  'gem',
  'flame',
  'lightning',
  'heart',
  'dice',
  'coin',
  'target',
  'bomb',
  'ninja',
  'pirate',
  'wizard',
  'knight',
  'dragon',
  'robot',
  'alien',
  'ghost',
  'skull',
  'moon',
  'sun',
  'planet',
  'phoenix',
  'shield',
  'sword',
];

export function AvatarSelector({
  currentAvatar = '/avatars/predefined/default-player.svg',
  onSelect,
  canUploadCustom = false,
  onUploadCustomClick,
}: AvatarSelectorProps) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(currentAvatar);

  useEffect(() => {
    setSelected(currentAvatar);
  }, [currentAvatar]);

  const handleSelect = (avatarName: string) => {
    const avatarUrl = `/avatars/predefined/${avatarName}.svg`;
    setSelected(avatarUrl);
    onSelect(avatarUrl, avatarName === 'default-player' ? 'default' : 'predefined');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('avatar.chooseAvatar')}
        </h3>
        {canUploadCustom && (
          <button
            onClick={onUploadCustomClick}
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 text-sm font-bold rounded-xl transition-all shadow-md"
          >
            📤 {t('avatar.uploadCustom')}
          </button>
        )}
      </div>

      {/* Unlock notification */}
      {!canUploadCustom && (
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-gray-300 rounded-xl p-3 text-sm">
          <p className="text-gray-700">
            🔒 <span className="font-semibold text-gray-900">{t('avatar.uploadLocked')}</span> {t('avatar.afterGames')}{' '}
            <span className="font-bold text-gray-900">100 {t('avatar.games')}</span> {t('avatar.orBadge')}{' '}
            <span className="font-bold text-yellow-600">{t('avatar.veteran')}</span>
          </p>
        </div>
      )}

      {/* Avatar grid */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {PREDEFINED_AVATARS.map((avatarName) => {
          const avatarUrl = `/avatars/predefined/${avatarName}.svg`;
          const isSelected = selected === avatarUrl;

          return (
            <motion.button
              key={avatarName}
              onClick={() => handleSelect(avatarName)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`relative aspect-square rounded-xl p-2 transition-all ${
                isSelected
                  ? 'bg-white shadow-lg ring-4 ring-yellow-400'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 hover:ring-2 hover:ring-yellow-400'
              }`}
              title={avatarName
                .split('-')
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ')}
            >
              <div className="relative w-full h-full">
                <Image
                  src={avatarUrl}
                  alt={avatarName}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    // Fallback to emoji if image doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<span class="text-2xl">🎮</span>';
                    }
                  }}
                />
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center shadow-md border-2 border-gray-900"
                >
                  <span className="text-gray-900 text-xs font-bold">✓</span>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected avatar name */}
      <div className="text-center bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl py-2 px-4 border-2 border-yellow-400">
        <p className="text-sm text-gray-700">
          {t('avatar.selected')}{' '}
          <span className="font-bold text-gray-900">
            {selected
              .split('/')
              .pop()
              ?.replace('.svg', '')
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' ')}
          </span>
        </p>
      </div>
    </div>
  );
}
