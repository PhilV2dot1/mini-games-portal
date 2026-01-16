'use client';

/**
 * Audio Controls Component
 * Toggle button for header with optional volume slider
 * Pattern: Similar to LanguageSwitcher.tsx
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudio } from '@/lib/audio/AudioContext';
import { useShouldAnimate } from '@/lib/utils/motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface AudioControlsProps {
  showVolumeSlider?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function AudioControls({
  showVolumeSlider = false,
  size = 'md',
}: AudioControlsProps) {
  const { isMuted, volume, toggleMute, setVolume, playUISound, isLoaded } = useAudio();
  const shouldAnimate = useShouldAnimate();
  const { t } = useLanguage();
  const [showSlider, setShowSlider] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-10 h-10 text-xl',
    lg: 'w-12 h-12 text-2xl',
  };

  const handleToggle = () => {
    toggleMute();
    // Play toggle sound if unmuting
    if (isMuted) {
      // Small delay to let the state update
      setTimeout(() => playUISound('toggle'), 50);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  const getIcon = () => {
    if (isMuted) return '🔇';
    if (volume > 0.66) return '🔊';
    if (volume > 0.33) return '🔉';
    return '🔈';
  };

  // Don't render until audio settings are loaded
  if (!isLoaded) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <span className="text-gray-300">🔊</span>
      </div>
    );
  }

  const muteLabel = isMuted ? t('audio.unmute') : t('audio.mute');
  const volumePercent = Math.round(volume * 100);
  const titleText = isMuted
    ? t('audio.soundOff')
    : `${t('audio.soundOn')} (${volumePercent}%)`;

  return (
    <div className="relative flex items-center gap-2">
      <motion.button
        onClick={handleToggle}
        onMouseEnter={() => showVolumeSlider && setShowSlider(true)}
        whileHover={shouldAnimate ? { scale: 1.05 } : {}}
        whileTap={shouldAnimate ? { scale: 0.95 } : {}}
        className={`
          ${sizeClasses[size]}
          flex items-center justify-center
          bg-white/80 backdrop-blur-sm
          border-2 border-gray-300 rounded-xl
          transition-colors hover:border-gray-400
          focus:outline-none focus:ring-2 focus:ring-offset-2
        `}
        style={{
          // Focus ring with Celo color
          // @ts-expect-error CSS custom property
          '--tw-ring-color': '#FCFF52',
        }}
        aria-label={muteLabel}
        title={titleText}
        aria-pressed={!isMuted}
      >
        <span role="img" aria-hidden="true">
          {getIcon()}
        </span>
      </motion.button>

      {/* Volume slider (optional) */}
      {showVolumeSlider && (
        <AnimatePresence>
          {showSlider && (
            <motion.div
              initial={shouldAnimate ? { opacity: 0, x: -10, width: 0 } : {}}
              animate={shouldAnimate ? { opacity: 1, x: 0, width: 'auto' } : {}}
              exit={shouldAnimate ? { opacity: 0, x: -10, width: 0 } : {}}
              onMouseLeave={() => setShowSlider(false)}
              className="absolute left-full ml-2 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-gray-200 z-50"
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                disabled={isMuted}
                className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                style={{
                  accentColor: '#FCFF52',
                }}
                aria-label={t('audio.volume')}
              />
              <span className="text-xs font-medium text-gray-600 w-8">
                {volumePercent}%
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
