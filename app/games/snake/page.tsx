"use client";

import Link from "next/link";
import { useEffect, useCallback, useRef } from "react";
import { useSnake } from "@/hooks/useSnake";
import { useSwipe } from "@/hooks/useSwipe";
import { useHaptic } from "@/hooks/useHaptic";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { SnakeBoard } from "@/components/snake/SnakeBoard";
import { GameStatus } from "@/components/snake/GameStatus";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { PlayerStats } from "@/components/snake/PlayerStats";
import { FarcasterShare } from "@/components/shared/FarcasterShare";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import { getContractAddress, getExplorerAddressUrl, getExplorerName, isGameAvailableOnChain } from '@/lib/contracts/addresses';

export default function SnakePage() {
  const {
    snake,
    food,
    foodSymbol,
    mode,
    status,
    score,
    stats,
    message,
    countdown,
    isConnected,
    gridSize,
    startGame,
    resetGame,
    switchMode,
    changeDirection,
  } = useSnake();

  const { chain } = useAccount();
  const contractAddress = getContractAddress('snake', chain?.id);
  const { recordGame, getStats } = useLocalStats();
  const { t } = useLanguage();
  const { play } = useGameAudio('snake');
  const { vibrate } = useHaptic();

  // Translate game messages from hook
  const translateMessage = useCallback((msg: string): string => {
    const messageMap: Record<string, string> = {
      'Press Start to begin!': t('games.msg.pressStart'),
      'Use arrow keys or WASD to move!': t('games.msg.useArrows'),
    };
    if (msg.includes('Game Over') && msg.includes('crashed')) return t('games.msg.gameOver');
    if (msg.includes('New High Score')) return '🎉 ' + t('games.msg.newHighScore') + msg.replace(/.*New High Score: /, ': ').replace('!', ' !');
    if (msg.includes('Game Over! Score')) return t('games.msg.gameOver') + msg.replace('Game Over! Score', ' Score');
    if (msg.includes('Recording score')) return t('games.msg.recordingScore');
    if (msg.includes('Score recorded on blockchain')) return '✅ ' + t('games.msg.scoreRecorded');
    if (msg.includes('not recorded on-chain')) return '⚠️ ' + t('games.msg.notRecorded');
    if (msg.includes('connect wallet')) return '⚠️ ' + t('games.msg.connectWallet');
    if (msg.startsWith('Starting game on blockchain')) return t('games.msg.startingBlockchain');
    if (msg.includes('Game started! Use arrow')) return t('games.msg.gameStartedArrows');
    if (msg.includes('Failed to start')) return '⚠️ ' + t('games.msg.failedStart');
    return messageMap[msg] || msg;
  }, [t]);
  const prevScore = useRef(score);
  const prevStatus = useRef(status);

  // Play sound effects based on game events
  useEffect(() => {
    // Eating food (score increased)
    if (score > prevScore.current && status === 'playing') {
      play('eat');
    }
    prevScore.current = score;
  }, [score, status, play]);

  useEffect(() => {
    // Game over
    if (status === 'gameover' && prevStatus.current === 'playing') {
      play('crash');
      vibrate(score >= 100 ? 'success' : 'error');
    }
    prevStatus.current = status;
  }, [status, play, vibrate, score]);

  // Record game to portal stats when finished
  useEffect(() => {
    if (status === "gameover") {
      // Convert score to result (above 100 = win, otherwise lose)
      const result = score >= 100 ? "win" : "lose";
      recordGame("snake", mode, result);
    }
  }, [status, score, mode, recordGame]);

  const isPlaying = status === "playing";
  const isProcessing = status === "processing";
  const isCountdown = status === "countdown";
  const isGameOver = status === "gameover";

  // Swipe-to-move on mobile
  const swipeRef = useSwipe({
    onSwipe: (dir) => {
      if (dir === 'up') changeDirection('UP');
      else if (dir === 'down') changeDirection('DOWN');
      else if (dir === 'left') changeDirection('LEFT');
      else if (dir === 'right') changeDirection('RIGHT');
    },
    enabled: isPlaying,
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-300 dark:border-white/20 px-4 py-2 rounded-xl text-sm font-semibold mb-6 transition-all"
        >
          {t('games.backToPortal')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-chain text-center space-y-1"
        >
          <img src="/icons/snake.png" alt="Snake" className="w-14 h-14 mx-auto object-contain mb-2" />
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">{t('games.snake.title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('games.snake.subtitle')}
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={switchMode} />
        </div>

        {/* How to Play Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg max-w-2xl mx-auto border border-gray-200 dark:border-gray-700"
        >
          <h2 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
            {t('games.snake.howToPlay')}
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• {t('games.snake.rule1')}</li>
            <li>• {t('games.snake.rule2')}</li>
          </ul>
        </motion.div>

        {/* Wallet Connect (On-Chain Mode) */}
        {mode === "onchain" && <WalletConnect />}

        {/* Game Status */}
        <GameStatus message={translateMessage(message)} status={status} score={score} />

        {/* Game Board */}
        <div className="relative" ref={swipeRef}>
          <SnakeBoard snake={snake} food={food} foodSymbol={foodSymbol} gridSize={gridSize} />
          {/* Countdown Overlay */}
          {isCountdown && countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 backdrop-blur-sm z-10">
              {countdown > 0 ? (
                <motion.div
                  key={countdown}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-9xl font-black text-chain drop-shadow-[0_0_20px_rgba(252,255,82,0.8)]"
                >
                  {countdown}
                </motion.div>
              ) : (
                <motion.div
                  key="go"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-7xl font-black text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]"
                >
                  GO!
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Controls Info */}
        {(isPlaying || isCountdown) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300 dark:border-gray-600 text-center"
          >
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('games.snake.instructions')}
            </p>
          </motion.div>
        )}

        {/* Direction Buttons (Mobile) */}
        {(isPlaying || isCountdown) && (
          <div className="sm:hidden">
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              <div />
              <button
                data-testid="direction-up"
                onClick={() => changeDirection("UP")}
                className="aspect-square bg-chain hover:brightness-110 rounded-lg font-black text-2xl shadow-md active:scale-95 transition-all"
              >
                ↑
              </button>
              <div />
              <button
                data-testid="direction-left"
                onClick={() => changeDirection("LEFT")}
                className="aspect-square bg-chain hover:brightness-110 rounded-lg font-black text-2xl shadow-md active:scale-95 transition-all"
              >
                ←
              </button>
              <button
                data-testid="direction-down"
                onClick={() => changeDirection("DOWN")}
                className="aspect-square bg-chain hover:brightness-110 rounded-lg font-black text-2xl shadow-md active:scale-95 transition-all"
              >
                ↓
              </button>
              <button
                data-testid="direction-right"
                onClick={() => changeDirection("RIGHT")}
                className="aspect-square bg-chain hover:brightness-110 rounded-lg font-black text-2xl shadow-md active:scale-95 transition-all"
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center">
          {status === "idle" || isGameOver ? (
            <motion.button
              data-testid="start-game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={startGame}
              disabled={isProcessing || (mode === "onchain" && !isConnected)}
              className="px-8 py-3 bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? t('games.starting') : t('games.startGame')}
            </motion.button>
          ) : isCountdown ? null : (
            <motion.button
              data-testid="reset-game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={resetGame}
              disabled={isProcessing}
              className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('games.reset')}
            </motion.button>
          )}
        </div>

        {/* Share on Farcaster (game over) */}
        {isGameOver && (
          <FarcasterShare
            gameName="Snake"
            outcome={score >= 100 ? 'win' : 'lose'}
            stats={getStats('snake') as { played: number; wins: number }}
          />
        )}

        {/* Player Stats */}
        <PlayerStats stats={stats} />

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-600 dark:text-gray-400 pt-2 space-y-1"
        >
          <p className="font-semibold">
            {t('games.snake.footer')}
          </p>
          {isGameAvailableOnChain('snake', chain?.id) && contractAddress ? (
            <p className="text-gray-500 dark:text-gray-500">
              {t('games.contract')}{" "}
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
