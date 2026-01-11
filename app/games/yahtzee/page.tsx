"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useYahtzee } from "@/hooks/useYahtzee";
import { useLocalStats } from "@/hooks/useLocalStats";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { DiceBoard } from "@/components/yahtzee/DiceBoard";
import { ScoreCard } from "@/components/yahtzee/ScoreCard";
import { GameControls } from "@/components/yahtzee/GameControls";
import { GameStatus } from "@/components/yahtzee/GameStatus";
import { PlayerStats } from "@/components/yahtzee/PlayerStats";
import { DifficultySelector } from "@/components/yahtzee/DifficultySelector";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function YahtzeePage() {
  const {
    // Game State
    dice,
    heldDice,
    rollsRemaining,
    currentTurn,
    scoreCard,
    mode,
    status,
    message,
    stats,

    // AI Mode State
    vsAI,
    aiDifficulty,
    currentPlayer,
    playerScoreCard,
    aiScoreCard,
    winner,

    // Computed Values
    upperSectionTotal,
    hasBonus,
    finalScore,
    averageScore,
    isComplete,

    // AI Mode Computed Values
    playerUpperTotal,
    playerHasBonus,
    playerFinalScore,
    aiUpperTotal,
    aiHasBonus,
    aiFinalScore,

    // Wallet State
    isConnected,
    isProcessing,

    // Actions
    startGame,
    rollDice,
    toggleHold,
    selectCategory,
    resetGame,
    switchMode,
    getPotentialScore,
    setVsAI,
    setAIDifficulty,
  } = useYahtzee();

  const { recordGame } = useLocalStats();
  const { t } = useLanguage();

  // Record game to portal stats when finished
  useEffect(() => {
    if (status === "finished" && isComplete && mode === "free") {
      // Determine result based on score
      const result = finalScore >= 200 ? "win" : "lose";
      recordGame("yahtzee", mode, result);
    }
  }, [status, isComplete, mode, finalScore, recordGame]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 hover:text-celo transition-colors font-bold"
        >
          ← {t("games.backToPortal")}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-celo text-center space-y-1"
        >
          <div className="text-5xl mb-2" role="img" aria-label="Yahtzee game">
            🎲🎯
          </div>
          <h1 className="text-4xl font-black text-gray-900">
            {t("games.yahtzee.title")}
          </h1>
          <p className="text-sm text-gray-600">
            {t("games.yahtzee.subtitle")}
          </p>
          <div className="space-y-2 bg-celo/10 rounded-lg p-3 border-2 border-celo">
            <p className="text-sm font-semibold text-gray-800">
              {t("games.yahtzee.instructions")}
            </p>
          </div>
        </motion.div>

        {/* Mode Toggle & Wallet */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-white/80 backdrop-blur rounded-xl p-4 shadow-lg"
        >
          <ModeToggle mode={mode} onModeChange={switchMode} />
          {mode === "onchain" && <WalletConnect />}
        </motion.div>

        {/* AI Mode Toggle & Difficulty Selector */}
        {status === "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col gap-4 max-w-2xl mx-auto"
          >
            {/* Solo vs AI Toggle */}
            <div className="bg-white/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
                Game Mode
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setVsAI(false)}
                  className={`
                    flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200
                    ${!vsAI
                      ? "bg-celo text-gray-900 shadow-md scale-105"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }
                  `}
                >
                  🎲 Solo Mode
                </button>
                <button
                  onClick={() => setVsAI(true)}
                  disabled={mode === "onchain"}
                  className={`
                    flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200
                    ${vsAI
                      ? "bg-celo text-gray-900 shadow-md scale-105"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }
                    ${mode === "onchain" ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  🤖 vs AI Mode
                </button>
              </div>
              {mode === "onchain" && vsAI && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  AI mode is only available in Free mode
                </p>
              )}
            </div>

            {/* Difficulty Selector (only shown in AI mode) */}
            {vsAI && (
              <DifficultySelector
                difficulty={aiDifficulty}
                onDifficultyChange={setAIDifficulty}
                disabled={status !== "idle"}
              />
            )}
          </motion.div>
        )}

        {/* How to Play Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/90 backdrop-blur rounded-xl p-4 shadow-lg max-w-2xl mx-auto border border-gray-200"
        >
          <h2 className="font-bold text-lg mb-2 text-gray-900">
            {t("games.yahtzee.howToPlay")}
          </h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• {t("games.yahtzee.rule1")}</li>
            <li>• {t("games.yahtzee.rule2")}</li>
            <li>• {t("games.yahtzee.rule3")}</li>
            <li>• {t("games.yahtzee.rule4")}</li>
            <li>• {t("games.yahtzee.rule5")}</li>
          </ul>
        </motion.div>

        {/* Game Status */}
        {status !== "idle" && (
          <GameStatus
            status={status}
            message={message}
            finalScore={status === "finished" && !vsAI ? finalScore : undefined}
            currentPlayer={vsAI ? currentPlayer : undefined}
            winner={vsAI ? winner : undefined}
            playerScore={vsAI ? playerFinalScore : undefined}
            aiScore={vsAI ? aiFinalScore : undefined}
          />
        )}

        {/* Start/Reset Button */}
        {status === "idle" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <button
              onClick={startGame}
              disabled={mode === "onchain" && !isConnected}
              className="px-8 py-4 bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 text-xl font-black rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mode === "onchain" && !isConnected
                ? "Connect Wallet to Start"
                : t("games.startGame")}
            </button>
          </motion.div>
        )}

        {status === "finished" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
          >
            <button
              onClick={resetGame}
              className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              Play Again
            </button>
          </motion.div>
        )}

        {/* Game Area */}
        {status === "playing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Dice Board */}
            <DiceBoard
              dice={dice}
              heldDice={heldDice}
              onToggleHold={toggleHold}
              disabled={rollsRemaining === 0 || isProcessing || (vsAI && currentPlayer === "ai")}
            />

            {/* Game Controls */}
            <GameControls
              onRoll={rollDice}
              rollsRemaining={rollsRemaining}
              currentTurn={currentTurn}
              disabled={rollsRemaining === 0 || (vsAI && currentPlayer === "ai")}
              isProcessing={isProcessing}
            />

            {/* Score Card(s) */}
            {vsAI ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Player Score Card */}
                <ScoreCard
                  scoreCard={playerScoreCard}
                  getPotentialScore={getPotentialScore}
                  onSelectCategory={selectCategory}
                  upperSectionTotal={playerUpperTotal}
                  hasBonus={playerHasBonus}
                  finalScore={playerFinalScore}
                  disabled={isProcessing || currentPlayer === "ai"}
                  player="human"
                  isActive={currentPlayer === "human"}
                />

                {/* AI Score Card */}
                <ScoreCard
                  scoreCard={aiScoreCard}
                  getPotentialScore={() => 0}
                  onSelectCategory={() => {}}
                  upperSectionTotal={aiUpperTotal}
                  hasBonus={aiHasBonus}
                  finalScore={aiFinalScore}
                  disabled={true}
                  player="ai"
                  isActive={currentPlayer === "ai"}
                />
              </div>
            ) : (
              <ScoreCard
                scoreCard={scoreCard}
                getPotentialScore={getPotentialScore}
                onSelectCategory={selectCategory}
                upperSectionTotal={upperSectionTotal}
                hasBonus={hasBonus}
                finalScore={finalScore}
                disabled={isProcessing}
              />
            )}
          </motion.div>
        )}

        {/* Player Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <PlayerStats stats={stats} averageScore={averageScore} mode={mode} />
        </motion.div>

        {/* Footer with Contract Link */}
        {mode === "onchain" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-sm text-gray-500 dark:text-gray-400"
          >
            <p>
              Smart contract powered game on Celo blockchain
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
