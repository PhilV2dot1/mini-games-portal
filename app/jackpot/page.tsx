"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useJackpot } from "@/hooks/useJackpot";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { JackpotMachine } from "@/components/jackpot/JackpotMachine";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import { getContractAddress, getExplorerAddressUrl, getExplorerName, isGameAvailableOnChain } from '@/lib/contracts/addresses';

export default function JackpotPage() {
  const {
    state,
    mode,
    setMode,
    spin,
    submitScore,
    lastResult,
    totalScore,
    sessionId,
    isSpinning,
    isConnected,
  } = useJackpot();

  const { chain } = useAccount();
  const contractAddress = getContractAddress('jackpot', chain?.id);
  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { play } = useGameAudio('jackpot');

  const [localSpinning, setLocalSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const spinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    };
  }, []);

  // Record game to portal stats when result is shown
  useEffect(() => {
    if (state === 'result' && lastResult) {
      // Map jackpot result to standard game result
      const result = lastResult.score > 0 ? 'win' : 'lose';
      recordGame('jackpot', mode, result);

      // Play result sound
      if (lastResult.isJackpot) {
        play('jackpot');
      } else if (lastResult.score > 0) {
        play('win');
      }
    }
  }, [state, lastResult, mode, recordGame, play]);

  const handleSpin = async () => {
    if (spinTimeoutRef.current) clearTimeout(spinTimeoutRef.current);
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);

    setLocalSpinning(true);
    setShowResult(false);
    play('spin');

    try {
      await spin();
      spinTimeoutRef.current = setTimeout(() => {
        setLocalSpinning(false);
        spinTimeoutRef.current = null;
      }, 800);
    } catch {
      setLocalSpinning(false);
    }
  };

  const handleSpinComplete = () => {
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);

    if (!localSpinning) {
      play('stop');
      resultTimeoutRef.current = setTimeout(() => {
        setShowResult(true);
        resultTimeoutRef.current = null;
      }, 500);
    }
  };

  const canSpin = state === "idle" || state === "result";

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Back to Portal Link */}
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
          transition={{ duration: 0.3 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl text-center"
          style={{ border: '4px solid var(--chain-primary)' }}
        >
          <div className="text-6xl mb-2">🎰</div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">{t('games.jackpot.title')}</h1>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 font-medium">{t('games.jackpot.subtitle')}</p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>

        {/* Wallet Connect (On-Chain Mode) */}
        {mode === "onchain" && <WalletConnect />}

        {/* Total Score */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 text-center shadow-lg"
          style={{ border: '4px solid var(--chain-primary)' }}
        >
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-medium">{t('games.jackpot.totalScore')}</div>
          <div className="text-4xl font-black text-gray-900 dark:text-white">{totalScore}</div>
        </motion.div>

        {/* Jackpot Machine */}
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl" style={{ border: '4px solid var(--chain-primary)' }}>
          <JackpotMachine
            isSpinning={localSpinning}
            finalValue={lastResult?.score}
            onSpinComplete={handleSpinComplete}
          />

          {/* Result Display */}
          {lastResult && showResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 text-center"
            >
              {lastResult.isJackpot && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-4xl mb-3 font-black text-chain"
                >
                  {t('games.jackpot.jackpotWin')}
                </motion.div>
              )}
              <div className="text-5xl mb-2">
                {lastResult.score > 0 ? "✨" : "😞"}
              </div>
              <div className={`text-4xl font-black mb-1 ${
                lastResult.score > 0 ? "text-chain" : "text-gray-500"
              }`}>
                {lastResult.score}
              </div>
              <div className="text-gray-700 font-semibold">
                {lastResult.score > 0 ? t('games.jackpot.points') : t('games.jackpot.tryAgain')}
              </div>
              {lastResult.badge && (
                <div className="mt-2 text-sm text-gray-900 font-bold">
                  {lastResult.badge} {t('games.jackpot.badge')}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Spin Button */}
        <div className="flex gap-3 justify-center flex-wrap">
          {canSpin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={handleSpin}
              disabled={localSpinning || isSpinning || (mode === "onchain" && !isConnected)}
              className="px-10 py-4 bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 rounded-xl font-black text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {localSpinning || isSpinning ? t('games.jackpot.spinning') : t('games.jackpot.spin')}
            </motion.button>
          )}

          {/* Submit Score Button (On-Chain Mode) */}
          {mode === "onchain" && state === "result" && sessionId && lastResult && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
              onClick={submitScore}
              disabled={isSpinning}
              className="px-8 py-3 bg-white bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSpinning ? t('games.jackpot.submitting') : t('games.jackpot.submitScore')}
            </motion.button>
          )}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-center text-xs text-gray-600 pt-2 space-y-1"
        >
          {isGameAvailableOnChain('jackpot', chain?.id) ? (
            <>
              <p>{t('games.contract')} {contractAddress}</p>
              <p>
                <a
                  href={getExplorerAddressUrl(chain?.id, contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-900 hover:text-chain font-semibold transition-colors underline decoration-chain"
                >
                  {t('games.jackpot.viewOnCeloscan').replace('Celoscan', getExplorerName(chain?.id))}
                </a>
              </p>
            </>
          ) : (
            <p>{t('chain.comingSoon')}</p>
          )}
        </motion.div>
      </div>
    </main>
  );
}
