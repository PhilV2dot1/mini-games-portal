"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useWordle } from "@/hooks/useWordle";
import { useHaptic } from "@/hooks/useHaptic";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import {
  getContractAddress,
  getExplorerAddressUrl,
  getExplorerName,
  isGameAvailableOnChain,
} from "@/lib/contracts/addresses";

// ─── Letter Cell ──────────────────────────────────────────────────────────────

function LetterCell({
  letter,
  status,
  delay = 0,
  reveal = false,
}: {
  letter: string;
  status: string;
  delay?: number;
  reveal?: boolean;
}) {
  const bgClass: Record<string, string> = {
    correct: "bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 text-white",
    present: "bg-yellow-400 dark:bg-yellow-500 border-yellow-400 dark:border-yellow-500 text-white",
    absent:  "bg-gray-500 dark:bg-gray-600 border-gray-500 dark:border-gray-600 text-white",
    active:  "bg-white dark:bg-gray-700 border-gray-700 dark:border-gray-300 text-gray-900 dark:text-white scale-105",
    empty:   "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white",
  };

  return (
    <motion.div
      initial={reveal ? { rotateX: 0 } : false}
      animate={reveal ? { rotateX: [0, -90, 0] } : {}}
      transition={reveal ? { duration: 0.5, delay, ease: "easeInOut" } : {}}
      className={`w-12 h-12 sm:w-14 sm:h-14 border-2 flex items-center justify-center rounded font-black text-xl sm:text-2xl uppercase transition-transform ${bgClass[status] ?? bgClass.empty}`}
    >
      {letter}
    </motion.div>
  );
}

// ─── Keyboard ─────────────────────────────────────────────────────────────────

const KEYBOARD_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M','⌫'],
];

function Keyboard({
  usedLetters,
  onLetter,
  onEnter,
  onDelete,
  disabled,
}: {
  usedLetters: Record<string, string>;
  onLetter: (l: string) => void;
  onEnter: () => void;
  onDelete: () => void;
  disabled: boolean;
}) {
  const bgClass = (letter: string): string => {
    const status = usedLetters[letter];
    if (status === 'correct') return 'bg-green-500 text-white';
    if (status === 'present') return 'bg-yellow-400 text-white';
    if (status === 'absent')  return 'bg-gray-500 dark:bg-gray-600 text-white';
    return 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white';
  };

  return (
    <div className="space-y-1.5">
      {KEYBOARD_ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1">
          {row.map((key) => {
            return (
              <button
                key={key}
                onClick={() => {
                  if (disabled) return;
                  if (key === '⌫') onDelete();
                  else onLetter(key);
                }}
                disabled={disabled}
                className={
                  key === '⌫'
                    ? `px-2 sm:px-3 h-12 sm:h-14 text-sm font-bold rounded transition-colors active:scale-95 disabled:opacity-50 ${bgClass(key)}`
                    : `w-8 sm:w-9 h-12 sm:h-14 font-bold rounded transition-colors active:scale-95 disabled:opacity-50 ${bgClass(key)}`
                }
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
      {/* ENTER button on its own row */}
      <div className="flex justify-center">
        <button
          onClick={() => { if (!disabled) onEnter(); }}
          disabled={disabled}
          className="w-full max-w-xs h-12 sm:h-14 text-base sm:text-lg font-black rounded transition-colors active:scale-95 disabled:opacity-50 bg-green-500 hover:bg-green-400 text-white"
        >
          ENTER
        </button>
      </div>
    </div>
  );
}

// ─── Stats Distribution ───────────────────────────────────────────────────────

function StatsPanel({ stats }: { stats: ReturnType<typeof useWordle>['stats'] }) {
  const maxVal = Math.max(...Object.values(stats.distribution), 1);
  const winRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 space-y-3">
      <div className="grid grid-cols-4 gap-2 text-center text-sm">
        <div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.games}</div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">Played</div>
        </div>
        <div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{winRate}%</div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">Win %</div>
        </div>
        <div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.streak}</div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">Streak</div>
        </div>
        <div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.bestStreak}</div>
          <div className="text-gray-500 dark:text-gray-400 text-xs">Best</div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Guess distribution</p>
        {([1,2,3,4,5,6] as const).map((n) => (
          <div key={n} className="flex items-center gap-2">
            <span className="text-xs w-3 text-gray-600 dark:text-gray-400">{n}</span>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded h-5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(stats.distribution[n] / maxVal) * 100}%` }}
                transition={{ duration: 0.5, delay: n * 0.05 }}
                className="h-full bg-green-500 rounded flex items-center justify-end pr-1"
                style={{ minWidth: stats.distribution[n] > 0 ? '1.5rem' : 0 }}
              >
                {stats.distribution[n] > 0 && (
                  <span className="text-xs text-white font-bold">{stats.distribution[n]}</span>
                )}
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WordlePage() {
  const { chain } = useAccount();
  const contractAddress = getContractAddress("wordle", chain?.id);
  const { t } = useLanguage();
  const { play } = useGameAudio("wordle");
  const { vibrate } = useHaptic();
  const { recordGame } = useLocalStats();

  const {
    mode,
    status,
    grid,
    currentRow,
    message,
    invalidWord,
    usedLetters,
    revealRow,
    stats,
    isConnected,
    startGame,
    resetGame,
    switchMode,
    submitGuess,
    addLetter,
    removeLetter,
  } = useWordle(contractAddress);

  const prevStatus = useRef(status);
  const prevRow = useRef(currentRow);

  // Sound effects
  useEffect(() => {
    if (currentRow > prevRow.current && status === 'playing') {
      play('type');
    }
    prevRow.current = currentRow;
  }, [currentRow, status, play]);

  useEffect(() => {
    if (status === 'won' && prevStatus.current !== 'won') {
      play('win');
      vibrate('success');
      recordGame('wordle', mode, 'win');
    }
    if (status === 'lost' && prevStatus.current !== 'lost') {
      play('lose');
      vibrate('error');
      recordGame('wordle', mode, 'lose');
    }
    prevStatus.current = status;
  }, [status, play, vibrate, mode, recordGame]);

  const isIdle = status === 'idle';
  const isPlaying = status === 'playing';
  const isFinished = status === 'won' || status === 'lost';

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-chain transition-colors font-bold"
        >
          {t('games.backToPortal')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-chain text-center space-y-1"
        >
          <div className="text-5xl mb-2" role="img" aria-label={t('games.wordle.title')}>🟩</div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">{t('games.wordle.title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('games.wordle.subtitle')}</p>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">{t('games.wordle.wordsInEnglish')}</p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={switchMode} />
        </div>

        {/* How to Play */}
        {isIdle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
          >
            <h2 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{t('games.wordle.howToPlay')}</h2>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• {t('games.wordle.rule1')}</li>
              <li>• {t('games.wordle.rule2')}</li>
              <li>• {t('games.wordle.rule3')}</li>
              <li className="flex items-center gap-2 mt-2">
                <span className="inline-block w-5 h-5 rounded bg-green-500" />
                <span>{t('games.wordle.ruleGreen')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 rounded bg-yellow-400" />
                <span>{t('games.wordle.ruleYellow')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="inline-block w-5 h-5 rounded bg-gray-500" />
                <span>{t('games.wordle.ruleGray')}</span>
              </li>
            </ul>
          </motion.div>
        )}

        {/* Wallet Connect */}
        {mode === "onchain" && <WalletConnect />}

        {/* Message Toast */}
        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              key={message}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <span className="inline-block bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold px-4 py-2 rounded-xl text-sm shadow-lg">
                {message}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        {!isIdle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-1.5"
          >
            {grid.map((row, rIdx) => (
              <motion.div
                key={rIdx}
                animate={invalidWord && rIdx === currentRow ? {
                  x: [0, -8, 8, -8, 8, -4, 4, 0],
                } : {}}
                transition={{ duration: 0.5 }}
                className="flex gap-1.5"
              >
                {row.map((cell, cIdx) => (
                  <LetterCell
                    key={cIdx}
                    letter={cell.letter}
                    status={cell.status}
                    reveal={revealRow === rIdx}
                    delay={cIdx * 0.1}
                  />
                ))}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Keyboard */}
        {isPlaying && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Keyboard
              usedLetters={usedLetters}
              onLetter={addLetter}
              onEnter={submitGuess}
              onDelete={removeLetter}
              disabled={status !== 'playing'}
            />
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {isIdle || isFinished ? (
            <motion.button
              data-testid="start-game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={startGame}
              disabled={mode === 'onchain' && !isConnected}
              className="px-8 py-3 bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFinished ? t('games.playAgain') : t('games.startGame')}
            </motion.button>
          ) : null}

          {isPlaying && (
            <motion.button
              data-testid="reset-game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={resetGame}
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg transition-all"
            >
              {t('games.reset')}
            </motion.button>
          )}
        </div>

        {/* Stats */}
        {stats.games > 0 && <StatsPanel stats={stats} />}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-600 dark:text-gray-400 pt-2 space-y-1"
        >
          <p className="font-semibold">{t('games.wordle.footer')}</p>
          {isGameAvailableOnChain('wordle', chain?.id) && contractAddress ? (
            <p className="text-gray-500 dark:text-gray-500">
              {t('games.contract')}{' '}
              <a
                href={getExplorerAddressUrl(chain?.id, contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-chain underline transition-colors"
              >
                {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
              </a>
              {' | '}
              <a
                href={getExplorerAddressUrl(chain?.id, contractAddress)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-chain underline transition-colors"
              >
                {t('games.snake.viewOnCeloscan').replace('Celoscan', getExplorerName(chain?.id))}
              </a>
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">{t('chain.comingSoon')}</p>
          )}
        </motion.div>
      </div>
    </main>
  );
}
