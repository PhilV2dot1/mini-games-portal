import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// Audio hook
export function useAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    // Load mute preference from localStorage
    const saved = localStorage.getItem("minesweeper_audio_muted");
    if (saved !== null) {
      setIsMuted(JSON.parse(saved));
    }

    // Preload audio files
    const sounds = {
      click: "/audio/minesweeper/click.mp3",
      reveal: "/audio/minesweeper/reveal.mp3",
      flag: "/audio/minesweeper/flag.mp3",
      explosion: "/audio/minesweeper/explosion.mp3",
      victory: "/audio/minesweeper/victory.mp3",
    };

    const loadedAudio: Record<string, HTMLAudioElement> = {};

    Object.entries(sounds).forEach(([key, path]) => {
      try {
        const audio = new Audio(path);
        audio.preload = "auto";
        loadedAudio[key] = audio;
      } catch (error) {
        console.warn(`Failed to load audio: ${key}`, error);
      }
    });

    setAudioElements(loadedAudio);
  }, []);

  const playSound = useCallback(
    (soundName: string) => {
      if (isMuted) return;

      const audio = audioElements[soundName];
      if (!audio) return;

      try {
        // Reset audio to start if already playing
        audio.currentTime = 0;
        audio.play().catch((error) => {
          // Ignore autoplay policy errors
          if (error.name !== "NotAllowedError") {
            console.warn(`Failed to play sound: ${soundName}`, error);
          }
        });
      } catch (error) {
        console.warn(`Error playing sound: ${soundName}`, error);
      }
    },
    [isMuted, audioElements]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      localStorage.setItem("minesweeper_audio_muted", JSON.stringify(newValue));
      return newValue;
    });
  }, []);

  return { isMuted, playSound, toggleMute };
}

// Audio control button component
interface AudioManagerProps {
  isMuted: boolean;
  onToggleMute: () => void;
}

export function AudioManager({ isMuted, onToggleMute }: AudioManagerProps) {
  return (
    <motion.button
      onClick={onToggleMute}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-4 right-4 bg-gradient-to-br from-gray-700 to-gray-800 text-white p-3 rounded-full shadow-lg hover:from-gray-600 hover:to-gray-700 transition-all z-50"
      aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
      title={isMuted ? "Sound Off" : "Sound On"}
    >
      <span className="text-2xl" role="img" aria-hidden="true">
        {isMuted ? "🔇" : "🔊"}
      </span>
    </motion.button>
  );
}
