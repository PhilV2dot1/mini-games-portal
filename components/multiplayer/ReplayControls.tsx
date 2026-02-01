/**
 * ReplayControls Component
 * Transport controls for replaying completed multiplayer games
 */

'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { ReplaySpeed, ReplayStatus } from '@/hooks/useReplay';

interface ReplayControlsProps {
  status: ReplayStatus;
  progress: number;
  currentIndex: number;
  totalActions: number;
  speed: ReplaySpeed;
  onPlay: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSeek: (index: number) => void;
  onSetSpeed: (speed: ReplaySpeed) => void;
  onReset: () => void;
}

const SPEEDS: ReplaySpeed[] = [0.5, 1, 2, 4];

export function ReplayControls({
  status,
  progress,
  currentIndex,
  totalActions,
  speed,
  onPlay,
  onPause,
  onStepForward,
  onStepBackward,
  onSeek,
  onSetSpeed,
  onReset,
}: ReplayControlsProps) {
  const { t } = useLanguage();

  const isPlaying = status === 'playing';
  const isReady = status === 'ready' || status === 'paused' || status === 'finished';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-gray-200 dark:border-gray-700 space-y-3"
    >
      {/* Replay label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔄</span>
          <span className="font-bold text-sm text-gray-900 dark:text-white">
            {t('replay.title') || 'Replay'}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {currentIndex + 1} / {totalActions} {t('replay.actions') || 'actions'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <input
          type="range"
          min={-1}
          max={totalActions - 1}
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-indigo-500"
        />
        <div
          className="absolute top-0 left-0 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full pointer-events-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-2">
        {/* Step backward */}
        <button
          onClick={onStepBackward}
          disabled={currentIndex <= -1}
          className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors disabled:opacity-30 text-sm"
          title={t('replay.stepBack') || 'Step Back'}
        >
          ⏮
        </button>

        {/* Play / Pause */}
        <button
          onClick={isPlaying ? onPause : onPlay}
          disabled={!isReady && !isPlaying}
          className="w-12 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:brightness-110 text-white flex items-center justify-center transition-all disabled:opacity-50 text-lg shadow-lg"
        >
          {isPlaying ? '⏸' : '▶️'}
        </button>

        {/* Step forward */}
        <button
          onClick={onStepForward}
          disabled={currentIndex >= totalActions - 1}
          className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors disabled:opacity-30 text-sm"
          title={t('replay.stepForward') || 'Step Forward'}
        >
          ⏭
        </button>
      </div>

      {/* Speed and reset */}
      <div className="flex items-center justify-between">
        {/* Speed buttons */}
        <div className="flex gap-1">
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => onSetSpeed(s)}
              className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
                speed === s
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={onReset}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          {t('replay.exit') || 'Exit Replay'}
        </button>
      </div>

      {/* Status indicator */}
      {status === 'finished' && (
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg py-1">
          {t('replay.replayFinished') || 'Replay finished'}
        </div>
      )}
    </motion.div>
  );
}

export default ReplayControls;
