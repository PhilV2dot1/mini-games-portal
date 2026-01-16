'use client';

/**
 * Audio Context Provider
 * Global audio management with localStorage persistence
 * Pattern: Similar to LanguageContext.tsx
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { UI_SOUNDS, GAME_SOUNDS, SoundDefinition, GameId, UISound } from './sounds';

// ========================================
// TYPES
// ========================================

interface AudioContextType {
  // State
  isMuted: boolean;
  volume: number; // 0-1

  // Actions
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  playSound: (soundId: string, gameId?: GameId) => void;
  playUISound: (soundId: UISound) => void;
  preloadSounds: (gameId: GameId) => void;

  // Utility
  isLoaded: boolean;
}

const STORAGE_KEY = 'celo_games_audio_settings';
const DEFAULT_VOLUME = 0.7;

// ========================================
// CONTEXT
// ========================================

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// ========================================
// PROVIDER
// ========================================

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);
  const [isLoaded, setIsLoaded] = useState(false);

  // Audio cache: preloaded HTMLAudioElement instances
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        setIsMuted(settings.isMuted ?? false);
        setVolumeState(settings.volume ?? DEFAULT_VOLUME);
      } catch (error) {
        console.warn('Failed to load audio settings:', error);
      }
    }

    // Preload UI sounds that have preload flag
    Object.entries(UI_SOUNDS).forEach(([, def]) => {
      if ('preload' in def && def.preload) {
        preloadSound(def.path);
      }
    });

    setIsLoaded(true);
  }, []);

  // Preload a single sound
  const preloadSound = useCallback((path: string) => {
    if (typeof window === 'undefined') return;
    if (audioCache.current.has(path)) return;

    try {
      const audio = new Audio(path);
      audio.preload = 'auto';
      audioCache.current.set(path, audio);
    } catch (error) {
      // Silently fail - audio file might not exist yet
      console.debug(`Audio not available: ${path}`);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((muted: boolean, vol: number) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isMuted: muted,
        volume: vol,
      })
    );
  }, []);

  // Preload all sounds for a game
  const preloadSounds = useCallback(
    (gameId: GameId) => {
      const gameSounds = GAME_SOUNDS[gameId];
      if (!gameSounds) return;

      Object.values(gameSounds).forEach((def) => {
        const soundDef = def as SoundDefinition;
        preloadSound(soundDef.path);
      });
    },
    [preloadSound]
  );

  // Play a sound
  const playSound = useCallback(
    (soundId: string, gameId?: GameId) => {
      if (isMuted) return;
      if (typeof window === 'undefined') return;

      let soundDef: SoundDefinition | undefined;

      if (gameId) {
        const gameSounds = GAME_SOUNDS[gameId];
        if (gameSounds) {
          soundDef = gameSounds[soundId as keyof typeof gameSounds] as SoundDefinition | undefined;
        }
      } else {
        soundDef = UI_SOUNDS[soundId as UISound];
      }

      if (!soundDef) {
        console.debug(`Sound not found: ${gameId ? `${gameId}/` : ''}${soundId}`);
        return;
      }

      const path = soundDef.path;
      let audio = audioCache.current.get(path);

      if (!audio) {
        // Lazy load if not preloaded
        try {
          audio = new Audio(path);
          audioCache.current.set(path, audio);
        } catch (error) {
          console.debug(`Failed to create audio: ${path}`);
          return;
        }
      }

      // Set volume (base volume * sound-specific volume)
      const soundVolume = soundDef.volume ?? 1;
      audio.volume = volume * soundVolume;

      // Reset and play
      audio.currentTime = 0;
      audio.play().catch((error) => {
        // Ignore autoplay policy errors (common on first interaction)
        if (error.name !== 'NotAllowedError') {
          console.debug(`Failed to play sound: ${soundId}`, error);
        }
      });
    },
    [isMuted, volume]
  );

  // Play UI sound (convenience method)
  const playUISound = useCallback(
    (soundId: UISound) => {
      playSound(soundId);
    },
    [playSound]
  );

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      saveSettings(newValue, volume);
      return newValue;
    });
  }, [volume, saveSettings]);

  // Set volume
  const setVolume = useCallback(
    (newVolume: number) => {
      const clampedVolume = Math.max(0, Math.min(1, newVolume));
      setVolumeState(clampedVolume);
      saveSettings(isMuted, clampedVolume);

      // Update volume on all cached audio elements
      audioCache.current.forEach((audio) => {
        audio.volume = clampedVolume;
      });
    },
    [isMuted, saveSettings]
  );

  return (
    <AudioContext.Provider
      value={{
        isMuted,
        volume,
        toggleMute,
        setVolume,
        playSound,
        playUISound,
        preloadSounds,
        isLoaded,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

// ========================================
// HOOKS
// ========================================

/**
 * Main audio hook
 * Usage: const { playUISound, toggleMute, isMuted } = useAudio();
 */
export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

/**
 * Game-specific audio hook with automatic preloading
 * Usage: const { play } = useGameAudio('snake');
 *        play('eat'); // Plays snake eat sound
 */
export function useGameAudio<T extends GameId>(gameId: T) {
  const { playSound, preloadSounds, isMuted, volume } = useAudio();

  // Preload game sounds on mount
  useEffect(() => {
    preloadSounds(gameId);
  }, [gameId, preloadSounds]);

  const play = useCallback(
    (soundId: keyof (typeof GAME_SOUNDS)[T]) => {
      playSound(soundId as string, gameId);
    },
    [gameId, playSound]
  );

  return { play, isMuted, volume };
}

/**
 * Optional audio hook that doesn't throw if used outside provider
 * Useful for components that might be used with or without audio
 */
export function useOptionalAudio() {
  const context = useContext(AudioContext);
  return context;
}
