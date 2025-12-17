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
          Choisir un avatar
        </h3>
        {canUploadCustom && (
          <button
            onClick={onUploadCustomClick}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md"
          >
            📤 Upload personnalisé
          </button>
        )}
      </div>

      {/* Unlock notification */}
      {!canUploadCustom && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-3 text-sm">
          <p className="text-blue-900">
            🔒 <span className="font-semibold">Upload personnalisé</span> débloqué après{' '}
            <span className="font-bold">100 parties</span> ou badge{' '}
            <span className="font-bold">Veteran</span>
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
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg ring-4 ring-yellow-300'
                  : 'bg-gray-100 hover:bg-gray-200'
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
                />
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
                >
                  <svg
                    className="w-3 h-3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected avatar name */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Sélectionné:{' '}
          <span className="font-semibold text-gray-900">
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
