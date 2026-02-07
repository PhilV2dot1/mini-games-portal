"use client";

import Link from "next/link";
import { useEffect, useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useYahtzee, type CategoryName, getUpperSectionTotal, hasUpperBonus, getFinalScore } from "@/hooks/useYahtzee";
import { useYahtzeeMultiplayer } from "@/hooks/useYahtzeeMultiplayer";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { GameModeToggle } from "@/components/shared/GameModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { DiceBoard3D } from "@/components/yahtzee/Dice3D";
import { ScoreCard } from "@/components/yahtzee/ScoreCard";
import { GameControls } from "@/components/yahtzee/GameControls";
import { GameStatus } from "@/components/yahtzee/GameStatus";
import { PlayerStats } from "@/components/yahtzee/PlayerStats";
import { DifficultySelector } from "@/components/yahtzee/DifficultySelector";
import {
  MatchmakingButton,
  WaitingRoom,
  GameResult,
  RoomCodeInput,
} from "@/components/multiplayer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import { getContractAddress, getExplorerAddressUrl, isGameAvailableOnChain } from "@/lib/contracts/addresses";
import type { ScoreCard as ScoreCardType } from "@/hooks/useYahtzee";

type GameMode = 'free' | 'onchain' | 'multiplayer';

export default function YahtzeePage() {
  const [mode, setMode] = useState<GameMode>('free');
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Solo game hook
  const soloGame = useYahtzee();

  // Multiplayer hook
  const mp = useYahtzeeMultiplayer();

  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { play } = useGameAudio('yahtzee');
  const { chain } = useAccount();
  const contractAddress = getContractAddress('yahtzee', chain?.id);
  const prevTurn = useRef(soloGame.currentTurn);

  // Wrapper functions with sound effects (solo)
  const handleRollDice = useCallback(() => {
    play('roll');
    soloGame.rollDice();
  }, [play, soloGame]);

  const handleToggleHold = useCallback((index: number) => {
    play('hold');
    soloGame.toggleHold(index);
  }, [play, soloGame]);

  const handleSelectCategory = useCallback((category: CategoryName) => {
    const isYahtzee = category === 'yahtzee' && soloGame.dice.every(d => d === soloGame.dice[0]);
    if (isYahtzee) {
      play('yahtzee');
    } else {
      play('score');
    }
    soloGame.selectCategory(category);
  }, [play, soloGame]);

  // Wrapper functions with sound effects (multiplayer)
  const handleMPRollDice = useCallback(async () => {
    play('roll');
    await mp.rollDice();
  }, [play, mp]);

  const handleMPToggleHold = useCallback((index: number) => {
    play('hold');
    mp.toggleHold(index);
  }, [play, mp]);

  const handleMPSelectCategory = useCallback(async (category: CategoryName) => {
    const isYahtzee = category === 'yahtzee' && mp.dice.every(d => d === mp.dice[0]);
    if (isYahtzee) {
      play('yahtzee');
    } else {
      play('score');
    }
    await mp.selectCategory(category);
  }, [play, mp]);

  // Detect turn change for bonus sound (solo)
  useEffect(() => {
    if (mode !== 'multiplayer' && soloGame.currentTurn > prevTurn.current && soloGame.hasBonus && !prevTurn.current) {
      play('bonus');
    }
    prevTurn.current = soloGame.currentTurn;
  }, [mode, soloGame.currentTurn, soloGame.hasBonus, play]);

  // Record game to portal stats when finished (solo and vs AI)
  const hasRecordedGame = useRef(false);
  useEffect(() => {
    // Reset recording flag when game restarts
    if (soloGame.status === "idle" || soloGame.status === "playing") {
      hasRecordedGame.current = false;
    }

    if (mode !== 'multiplayer' && soloGame.status === "finished" && soloGame.isComplete && !hasRecordedGame.current) {
      // For AI mode, use player's score and win/lose based on AI comparison
      // For solo mode, use finalScore >= 200 as win threshold
      let result: "win" | "lose";
      if (soloGame.vsAI) {
        result = soloGame.winner === "human" ? "win" : "lose";
      } else {
        result = soloGame.finalScore >= 200 ? "win" : "lose";
      }
      console.log("Recording Yahtzee game:", { mode: soloGame.mode, result, vsAI: soloGame.vsAI, isComplete: soloGame.isComplete });
      hasRecordedGame.current = true;
      recordGame("yahtzee", soloGame.mode, result);
    }
  }, [mode, soloGame.status, soloGame.isComplete, soloGame.mode, soloGame.finalScore, soloGame.vsAI, soloGame.winner, recordGame]);

  // Play sound when multiplayer game finishes
  useEffect(() => {
    if (mode === 'multiplayer' && mp.matchResult) {
      if (mp.matchResult === 'win') {
        play('yahtzee');
      }
    }
  }, [mode, mp.matchResult, play]);

  // Switch mode handler
  const handleModeChange = useCallback((newMode: GameMode) => {
    if (mode === 'multiplayer' && newMode !== 'multiplayer') {
      mp.leaveRoom();
    }
    setMode(newMode);
    setShowJoinCode(false);
    setJoinError(null);

    if (newMode === 'free' || newMode === 'onchain') {
      soloGame.switchMode(newMode);
    }
  }, [mode, mp, soloGame]);

  // Handle join by code
  const handleJoinByCode = async (code: string) => {
    try {
      setJoinError(null);
      await mp.joinByCode(code);
      setShowJoinCode(false);
    } catch {
      setJoinError(t('multiplayer.invalidCode') || 'Invalid room code');
    }
  };

  const isMultiplayer = mode === 'multiplayer';

  // Multiplayer game state
  const isMultiplayerPlaying = mp.status === 'playing';
  const isMultiplayerWaiting = mp.status === 'waiting' || mp.status === 'ready';
  const isMultiplayerFinished = mp.status === 'finished';
  const isMultiplayerIdle = mp.status === 'idle';

  const myPlayer = mp.players.find(p => p.player_number === mp.myPlayerNumber);
  const isReady = myPlayer?.ready || false;

  // Computed multiplayer scorecard values
  const mpMyUpperTotal = getUpperSectionTotal(mp.myScoreCard as ScoreCardType);
  const mpMyHasBonus = hasUpperBonus(mp.myScoreCard as ScoreCardType);
  const mpMyFinalScore = getFinalScore(mp.myScoreCard as ScoreCardType);
  const mpOpUpperTotal = getUpperSectionTotal(mp.opponentScoreCard as ScoreCardType);
  const mpOpHasBonus = hasUpperBonus(mp.opponentScoreCard as ScoreCardType);
  const mpOpFinalScore = getFinalScore(mp.opponentScoreCard as ScoreCardType);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-chain transition-colors font-bold"
        >
          ← {t("games.backToPortal")}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-chain text-center space-y-1"
        >
          <div className="text-5xl mb-2" role="img" aria-label="Yahtzee game">
            🎲🎯
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            {t("games.yahtzee.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("games.yahtzee.subtitle")}
          </p>
          <div className="space-y-2 bg-chain/10 dark:bg-chain/20 rounded-lg p-3 border-2 border-chain">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {t("games.yahtzee.instructions")}
            </p>
          </div>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-4 shadow-lg"
        >
          <GameModeToggle mode={mode} onModeChange={handleModeChange} />
          {mode === "onchain" && <WalletConnect />}
        </motion.div>

        {/* ===== SOLO GAME UI ===== */}
        {!isMultiplayer && (
          <>
            {/* AI Mode Toggle & Difficulty Selector */}
            {soloGame.status === "idle" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex flex-col gap-4 max-w-2xl mx-auto"
              >
                {/* Solo vs AI Toggle */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300 dark:border-gray-600">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center">
                    Game Mode
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => soloGame.setVsAI(false)}
                      className={`
                        flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200
                        ${!soloGame.vsAI
                          ? "bg-chain text-gray-900 shadow-md scale-105"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }
                      `}
                    >
                      🎲 Solo Mode
                    </button>
                    <button
                      onClick={() => soloGame.setVsAI(true)}
                      className={`
                        flex-1 py-2 px-4 rounded-lg font-semibold text-sm transition-all duration-200
                        ${soloGame.vsAI
                          ? "bg-chain text-gray-900 shadow-md scale-105"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }
                      `}
                    >
                      🤖 vs AI Mode
                    </button>
                  </div>
                  {soloGame.mode === "onchain" && soloGame.vsAI && (
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Your score will be recorded on-chain (AI plays locally)
                    </p>
                  )}
                </div>

                {/* Difficulty Selector (only shown in AI mode) */}
                {soloGame.vsAI && (
                  <DifficultySelector
                    difficulty={soloGame.aiDifficulty}
                    onDifficultyChange={soloGame.setAIDifficulty}
                    disabled={soloGame.status !== "idle"}
                  />
                )}
              </motion.div>
            )}

            {/* How to Play Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg max-w-2xl mx-auto border border-gray-200 dark:border-gray-700"
            >
              <h2 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                {t("games.yahtzee.howToPlay")}
              </h2>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• {t("games.yahtzee.rule1")}</li>
                <li>• {t("games.yahtzee.rule2")}</li>
              </ul>
            </motion.div>

            {/* Game Status */}
            {soloGame.status !== "idle" && (
              <GameStatus
                status={soloGame.status}
                message={soloGame.message}
                finalScore={soloGame.status === "finished" && !soloGame.vsAI ? soloGame.finalScore : undefined}
                currentPlayer={soloGame.vsAI ? soloGame.currentPlayer : undefined}
                winner={soloGame.vsAI ? soloGame.winner : undefined}
                playerScore={soloGame.vsAI ? soloGame.playerFinalScore : undefined}
                aiScore={soloGame.vsAI ? soloGame.aiFinalScore : undefined}
              />
            )}

            {/* Start/Reset Button */}
            {soloGame.status === "idle" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center"
              >
                <button
                  onClick={soloGame.startGame}
                  disabled={soloGame.mode === "onchain" && !soloGame.isConnected}
                  className="px-8 py-4 bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 text-xl font-black rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {soloGame.mode === "onchain" && !soloGame.isConnected
                    ? "Connect Wallet to Start"
                    : t("games.startGame")}
                </button>
              </motion.div>
            )}

            {soloGame.status === "finished" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center"
              >
                <button
                  onClick={soloGame.resetGame}
                  className="px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white text-xl font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  Play Again
                </button>
              </motion.div>
            )}

            {/* Game Area */}
            {soloGame.status === "playing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-6"
              >
                {/* Dice Board */}
                <DiceBoard3D
                  dice={soloGame.dice}
                  heldDice={soloGame.heldDice}
                  onToggleHold={handleToggleHold}
                  disabled={soloGame.rollsRemaining === 0 || soloGame.isProcessing || (soloGame.vsAI && soloGame.currentPlayer === "ai")}
                />

                {/* Game Controls */}
                <GameControls
                  onRoll={handleRollDice}
                  rollsRemaining={soloGame.rollsRemaining}
                  currentTurn={soloGame.currentTurn}
                  disabled={soloGame.rollsRemaining === 0 || (soloGame.vsAI && soloGame.currentPlayer === "ai")}
                  isProcessing={soloGame.isProcessing}
                />

                {/* Score Card(s) */}
                {soloGame.vsAI ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ScoreCard
                      scoreCard={soloGame.playerScoreCard}
                      getPotentialScore={soloGame.getPotentialScore}
                      onSelectCategory={handleSelectCategory}
                      upperSectionTotal={soloGame.playerUpperTotal}
                      hasBonus={soloGame.playerHasBonus}
                      finalScore={soloGame.playerFinalScore}
                      disabled={soloGame.isProcessing || soloGame.currentPlayer === "ai"}
                      player="human"
                      isActive={soloGame.currentPlayer === "human"}
                    />
                    <ScoreCard
                      scoreCard={soloGame.aiScoreCard}
                      getPotentialScore={() => 0}
                      onSelectCategory={() => {}}
                      upperSectionTotal={soloGame.aiUpperTotal}
                      hasBonus={soloGame.aiHasBonus}
                      finalScore={soloGame.aiFinalScore}
                      disabled={true}
                      player="ai"
                      isActive={soloGame.currentPlayer === "ai"}
                    />
                  </div>
                ) : (
                  <ScoreCard
                    scoreCard={soloGame.scoreCard}
                    getPotentialScore={soloGame.getPotentialScore}
                    onSelectCategory={handleSelectCategory}
                    upperSectionTotal={soloGame.upperSectionTotal}
                    hasBonus={soloGame.hasBonus}
                    finalScore={soloGame.finalScore}
                    disabled={soloGame.isProcessing}
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
              <PlayerStats stats={soloGame.stats} averageScore={soloGame.averageScore} mode={soloGame.mode} />
            </motion.div>

            {/* Footer with Contract Link */}
            {soloGame.mode === "onchain" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center text-sm text-gray-500 dark:text-gray-400"
              >
                {isGameAvailableOnChain('yahtzee', chain?.id) && contractAddress ? (
                  <p>
                    {t('games.contract')}{" "}
                    <a
                      href={getExplorerAddressUrl(chain?.id, contractAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-chain underline transition-colors"
                    >
                      {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                    </a>
                  </p>
                ) : (
                  <p>Coming soon on Base</p>
                )}
              </motion.div>
            )}
          </>
        )}

        {/* ===== MULTIPLAYER UI ===== */}
        {isMultiplayer && (
          <>
            {/* Error display */}
            {mp.error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-700 dark:text-red-300 text-center">
                {mp.error}
              </div>
            )}

            {/* Idle state - Matchmaking buttons */}
            {isMultiplayerIdle && !showJoinCode && (
              <div className="space-y-4 max-w-md mx-auto">
                <MatchmakingButton
                  onFindMatch={mp.findMatch}
                  onCreatePrivate={mp.createPrivateRoom}
                  isSearching={mp.isSearching}
                  onCancel={mp.cancelSearch}
                />
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowJoinCode(true)}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-chain dark:hover:text-chain underline"
                  >
                    {t('multiplayer.haveCode') || 'Have a room code?'}
                  </button>
                </div>
              </div>
            )}

            {/* Join by code */}
            {isMultiplayerIdle && showJoinCode && (
              <div className="flex justify-center">
                <RoomCodeInput
                  onJoin={handleJoinByCode}
                  onCancel={() => {
                    setShowJoinCode(false);
                    setJoinError(null);
                  }}
                  isLoading={mp.isSearching}
                  error={joinError}
                />
              </div>
            )}

            {/* Waiting room */}
            {isMultiplayerWaiting && mp.room && (
              <div className="flex justify-center">
                <WaitingRoom
                  room={mp.room}
                  players={mp.players}
                  myPlayerNumber={mp.myPlayerNumber}
                  isReady={isReady}
                  onSetReady={mp.setReady}
                  onLeave={mp.leaveRoom}
                />
              </div>
            )}

            {/* Playing state */}
            {isMultiplayerPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Turn indicator */}
                <div className={`text-center p-3 rounded-xl font-bold ${
                  mp.isMyTurn
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                }`}>
                  {mp.isMyTurn
                    ? t('multiplayer.yourTurn') || 'Your Turn!'
                    : t('multiplayer.opponentTurn') || "Opponent's Turn..."}
                  <span className="ml-2 text-sm font-normal">
                    ({t('multiplayer.rps.round') || 'Round'} {mp.turnNumber}/13)
                  </span>
                </div>

                {/* Opponent info */}
                {mp.opponent && (
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    {t('multiplayer.vs') || 'vs'} {(mp.opponent as { users?: { display_name?: string } }).users?.display_name || 'Opponent'}
                  </div>
                )}

                {/* Dice Board */}
                <DiceBoard3D
                  dice={mp.dice}
                  heldDice={mp.heldDice}
                  onToggleHold={handleMPToggleHold}
                  disabled={!mp.isMyTurn || mp.rollsRemaining === 0}
                />

                {/* Game Controls */}
                {mp.isMyTurn && (
                  <GameControls
                    onRoll={handleMPRollDice}
                    rollsRemaining={mp.rollsRemaining}
                    currentTurn={mp.turnNumber}
                    disabled={mp.rollsRemaining === 0}
                    isProcessing={false}
                  />
                )}

                {!mp.isMyTurn && (
                  <div className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <p className="text-gray-600 dark:text-gray-400 font-semibold">
                      {t('multiplayer.opponentTurn') || "Waiting for opponent's turn..."}
                    </p>
                  </div>
                )}

                {/* Score Cards - Side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* My Score Card */}
                  <ScoreCard
                    scoreCard={mp.myScoreCard as ScoreCardType}
                    getPotentialScore={mp.getPotentialScore}
                    onSelectCategory={handleMPSelectCategory}
                    upperSectionTotal={mpMyUpperTotal}
                    hasBonus={mpMyHasBonus}
                    finalScore={mpMyFinalScore}
                    disabled={!mp.isMyTurn || mp.rollsRemaining === 3}
                    player="human"
                    isActive={mp.isMyTurn}
                  />

                  {/* Opponent Score Card */}
                  <ScoreCard
                    scoreCard={mp.opponentScoreCard as ScoreCardType}
                    getPotentialScore={() => 0}
                    onSelectCategory={() => {}}
                    upperSectionTotal={mpOpUpperTotal}
                    hasBonus={mpOpHasBonus}
                    finalScore={mpOpFinalScore}
                    disabled={true}
                    player="ai"
                    isActive={!mp.isMyTurn}
                  />
                </div>

                {/* Surrender button */}
                <div className="flex justify-center">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={mp.surrender}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-lg transition-all"
                  >
                    {t('multiplayer.surrender') || 'Surrender'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Game finished */}
            {isMultiplayerFinished && (
              <>
                {/* Final scores summary */}
                {mp.myFinalScore !== null && mp.opponentFinalScore !== null && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl p-6 border-2 border-chain shadow-xl max-w-md mx-auto text-center space-y-3"
                  >
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">
                      {mp.matchResult === 'win'
                        ? '🏆 You Win!'
                        : mp.matchResult === 'lose'
                        ? '😔 You Lose'
                        : '🤝 Draw!'}
                    </h3>
                    <div className="flex justify-center items-center gap-8">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('multiplayer.you') || 'You'}</div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white">{mp.myFinalScore}</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-400">-</div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400">{t('multiplayer.opponent') || 'Opponent'}</div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white">{mp.opponentFinalScore}</div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-center">
                  <GameResult
                    winner={mp.matchResult === 'win' ? (mp.players.find(p => p.player_number === mp.myPlayerNumber) || null) : (mp.opponent || null)}
                    loser={mp.matchResult === 'win' ? (mp.opponent || null) : (mp.players.find(p => p.player_number === mp.myPlayerNumber) || null)}
                    isDraw={mp.matchResult === 'draw'}
                    isWinner={mp.matchResult === 'win' ? true : mp.matchResult === 'lose' ? false : null}
                    myStats={mp.myStats}
                    opponentStats={mp.opponentStats}
                    onPlayAgain={() => {
                      mp.playAgain();
                      mp.leaveRoom();
                    }}
                    onLeave={mp.leaveRoom}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
