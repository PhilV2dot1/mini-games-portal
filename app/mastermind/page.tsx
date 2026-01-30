"use client";

import Link from "next/link";
import { useEffect, useCallback, useState } from "react";
import { useMastermind } from "@/hooks/useMastermind";
import { useMastermindMultiplayer } from "@/hooks/useMastermindMultiplayer";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { MAX_ATTEMPTS, type Color } from "@/lib/games/mastermind-logic";
import { ColorPalette } from "@/components/mastermind/ColorPalette";
import { CurrentGuess } from "@/components/mastermind/CurrentGuess";
import { GameHistory } from "@/components/mastermind/GameHistory";
import { FeedbackLegend } from "@/components/mastermind/FeedbackLegend";
import { GameModeToggle } from "@/components/shared/GameModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import {
  MatchmakingButton,
  WaitingRoom,
  GameResult,
  RoomCodeInput,
} from "@/components/multiplayer";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type GameMode = 'free' | 'onchain' | 'multiplayer';

export default function MastermindPage() {
  const [mode, setMode] = useState<GameMode>('free');
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Solo game hook
  const soloGame = useMastermind();

  // Multiplayer hook
  const mp = useMastermindMultiplayer();

  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { play } = useGameAudio('mastermind');

  // Wrappers with sound effects (solo)
  const updateGuessWithSound = useCallback((position: number, color: Color | null) => {
    play('place');
    soloGame.updateGuess(position, color);
  }, [play, soloGame]);

  const submitGuessWithSound = useCallback(() => {
    play('check');
    soloGame.submitGuess();
  }, [play, soloGame]);

  // Play result sound when solo game finishes
  useEffect(() => {
    if (mode !== 'multiplayer') {
      if (soloGame.gamePhase === "won") {
        play('win');
      } else if (soloGame.gamePhase === "lost") {
        play('lose');
      }
    }
  }, [mode, soloGame.gamePhase, play]);

  // Record game when finished (solo)
  useEffect(() => {
    if (mode !== 'multiplayer' && (soloGame.gamePhase === "won" || soloGame.gamePhase === "lost")) {
      const result = soloGame.gamePhase === "won" ? "win" : "lose";
      recordGame("mastermind", soloGame.mode, result);
    }
  }, [mode, soloGame.gamePhase, soloGame.mode, recordGame]);

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

  // Multiplayer guess submit with sound
  const handleMpSubmitGuess = useCallback(async () => {
    play('check');
    await mp.submitGuess();
  }, [play, mp]);

  // Multiplayer guess update with sound
  const handleMpUpdateGuess = useCallback((position: number, color: Color | null) => {
    play('place');
    mp.updateGuess(position, color);
  }, [play, mp]);

  const isMultiplayer = mode === 'multiplayer';
  const isMultiplayerPlaying = mp.status === 'playing';
  const isMultiplayerWaiting = mp.status === 'waiting' || mp.status === 'ready';
  const isMultiplayerFinished = mp.status === 'finished';
  const isMultiplayerIdle = mp.status === 'idle';

  const myPlayer = mp.players.find(p => p.player_number === mp.myPlayerNumber);
  const isReady = myPlayer?.ready || false;

  // Solo state
  const firstEmptyPosition = soloGame.currentGuess.findIndex(color => color === null);
  // Multiplayer state
  const mpFirstEmptyPosition = mp.currentGuess.findIndex(color => color === null);

  // Convert multiplayer history to GameHistory format for the component
  const mpMyHistoryFormatted = mp.myHistory.map(h => ({
    guess: h.guess,
    feedback: h.feedback,
  }));
  const mpOpHistoryFormatted = mp.opponentHistory.map(h => ({
    guess: h.guess,
    feedback: h.feedback,
  }));

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-celo transition-colors font-bold"
        >
          {t('games.backToPortal')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl text-center"
          style={{ border: '4px solid #FCFF52' }}
        >
          <div className="text-6xl mb-2">🎯</div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">{t('games.mastermind.title')}</h1>
          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 font-medium">{t('games.mastermind.subtitle')}</p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <GameModeToggle mode={mode} onModeChange={handleModeChange} />
        </div>

        {/* ===== SOLO GAME UI ===== */}
        {!isMultiplayer && (
          <>
            {/* Wallet Connect (On-Chain Mode) */}
            {soloGame.mode === "onchain" && <WalletConnect />}

            {/* Fee Warning for On-Chain Mode */}
            {soloGame.mode === "onchain" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="rounded-lg p-3 text-center"
                style={{ backgroundColor: 'rgba(252, 255, 82, 0.4)', border: '4px solid #FCFF52' }}
              >
                <p className="text-gray-900 text-sm font-bold">
                  {t('games.mastermind.onChainFeeWarning').split('0.01 CELO')[0]}
                  <span className="font-black">0.01 CELO</span>
                  {t('games.mastermind.onChainFeeWarning').split('0.01 CELO')[1]}
                </p>
              </motion.div>
            )}

            {/* Game Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white/90 backdrop-blur-lg rounded-xl p-4 grid grid-cols-3 gap-4 shadow-lg"
              style={{ border: '4px solid #FCFF52' }}
            >
              <div className="text-center">
                <div className="text-sm text-gray-600 font-medium">{t('games.mastermind.attempts')}</div>
                <div className="text-3xl font-black text-gray-900">
                  {soloGame.attempts}/{MAX_ATTEMPTS}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 font-medium">{t('games.mastermind.wins')}</div>
                <div className="text-2xl font-bold text-gray-900">{soloGame.stats.wins}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 font-medium">{t('games.mastermind.bestScore')}</div>
                <div className="text-2xl font-bold text-gray-900">{soloGame.stats.bestScore}</div>
              </div>
            </motion.div>

            {/* Feedback Legend */}
            <FeedbackLegend />

            {/* Game History */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <GameHistory history={soloGame.history} maxAttempts={MAX_ATTEMPTS} />
            </motion.div>

            {/* Current Guess */}
            {soloGame.gamePhase === "playing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <CurrentGuess
                  guess={soloGame.currentGuess}
                  onClearPosition={(pos) => updateGuessWithSound(pos, null)}
                  disabled={soloGame.isPending}
                />
              </motion.div>
            )}

            {/* Color Palette */}
            {soloGame.gamePhase === "playing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ColorPalette
                  onSelectColor={(color) => {
                    if (firstEmptyPosition !== -1) {
                      updateGuessWithSound(firstEmptyPosition, color);
                    }
                  }}
                  disabled={soloGame.isPending}
                />
              </motion.div>
            )}

            {/* Message Display */}
            {soloGame.message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 backdrop-blur-lg rounded-lg p-3 text-center text-gray-900 font-semibold shadow-lg"
                style={{ border: '3px solid #FCFF52' }}
              >
                {soloGame.message}
              </motion.div>
            )}

            {/* Game Controls */}
            <div className="flex gap-3 justify-center flex-wrap">
              {soloGame.gamePhase === "playing" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={submitGuessWithSound}
                  disabled={soloGame.currentGuess.some(c => c === null) || soloGame.isPending}
                  className="px-8 py-3 bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {t('games.mastermind.submitGuess')}
                </motion.button>
              )}

              {soloGame.mode === "free" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={soloGame.newGame}
                  className="px-8 py-3 bg-white bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg transition-all"
                >
                  {t('games.mastermind.newGame')}
                </motion.button>
              )}

              {soloGame.mode === "onchain" && (
                <>
                  {!soloGame.hasActiveOnChainGame && soloGame.gamePhase !== "won" && soloGame.gamePhase !== "lost" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      onClick={soloGame.playOnChain}
                      disabled={soloGame.isPending || !soloGame.isConnected}
                      className="px-8 py-3 bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {soloGame.isPending ? t('games.mastermind.starting') : t('games.mastermind.startOnChainGame')}
                    </motion.button>
                  )}

                  {soloGame.shouldShowSubmitButton && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      onClick={soloGame.submitScoreOnChain}
                      disabled={soloGame.isPending}
                      className="px-8 py-3 bg-gradient-to-r from-green-400 to-green-500 hover:brightness-110 text-white rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {soloGame.isPending ? t('games.mastermind.submitting') : t('games.mastermind.submitScoreOnChain')}
                    </motion.button>
                  )}

                  {soloGame.hasActiveOnChainGame && soloGame.gamePhase === "playing" && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      onClick={soloGame.abandonGame}
                      disabled={soloGame.isPending}
                      className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {soloGame.isPending ? t('games.mastermind.abandoning') : t('games.mastermind.abandonGame')}
                    </motion.button>
                  )}
                </>
              )}
            </div>
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
              <div className="space-y-4">
                <MatchmakingButton
                  onFindMatch={mp.findMatch}
                  onCreatePrivate={mp.createPrivateRoom}
                  isSearching={mp.isSearching}
                  onCancel={mp.cancelSearch}
                />
                <div className="flex justify-center">
                  <button
                    onClick={() => setShowJoinCode(true)}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-celo dark:hover:text-celo underline"
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
              <>
                {/* Turn indicator */}
                <div className={`text-center p-3 rounded-xl font-bold ${
                  mp.isMyTurn
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                }`}>
                  {mp.isMyTurn
                    ? (t('multiplayer.yourTurn') || 'Your turn!')
                    : (t('multiplayer.opponentTurn') || "Opponent's turn...")}
                </div>

                {/* Attempts counter */}
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 grid grid-cols-2 gap-4 shadow-lg" style={{ border: '4px solid #FCFF52' }}>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('multiplayer.you') || 'You'}</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{mp.myAttempts}/{MAX_ATTEMPTS}</div>
                    {mp.myWon === true && <span className="text-green-600 font-bold text-sm">Cracked!</span>}
                    {mp.myWon === false && <span className="text-red-600 font-bold text-sm">Failed</span>}
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">{t('multiplayer.opponent') || 'Opponent'}</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{mp.opponentAttempts}/{MAX_ATTEMPTS}</div>
                    {mp.opponentWon === true && <span className="text-green-600 font-bold text-sm">Cracked!</span>}
                    {mp.opponentWon === false && <span className="text-red-600 font-bold text-sm">Failed</span>}
                  </div>
                </div>

                {/* Feedback Legend */}
                <FeedbackLegend />

                {/* My History */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {t('multiplayer.you') || 'You'} - {t('games.mastermind.attempts') || 'Attempts'}
                  </h3>
                  <GameHistory history={mpMyHistoryFormatted} maxAttempts={MAX_ATTEMPTS} />
                </div>

                {/* Current Guess (only on my turn and not finished) */}
                {mp.isMyTurn && mp.myWon === null && (
                  <>
                    <CurrentGuess
                      guess={mp.currentGuess}
                      onClearPosition={(pos) => handleMpUpdateGuess(pos, null)}
                      disabled={false}
                    />
                    <ColorPalette
                      onSelectColor={(color) => {
                        if (mpFirstEmptyPosition !== -1) {
                          handleMpUpdateGuess(mpFirstEmptyPosition, color);
                        }
                      }}
                      disabled={false}
                    />
                    <div className="flex justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleMpSubmitGuess}
                        disabled={mp.currentGuess.some(c => c === null)}
                        className="px-8 py-3 bg-gradient-to-r from-celo to-celo hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {t('games.mastermind.submitGuess')}
                      </motion.button>
                    </div>
                  </>
                )}

                {/* Opponent History (visible) */}
                {mpOpHistoryFormatted.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                      {t('multiplayer.opponent') || 'Opponent'} - {t('games.mastermind.attempts') || 'Attempts'}
                    </h3>
                    <GameHistory history={mpOpHistoryFormatted} maxAttempts={MAX_ATTEMPTS} />
                  </div>
                )}

                {/* Surrender button */}
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={mp.surrender}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-lg transition-all"
                  >
                    {t('multiplayer.surrender') || 'Surrender'}
                  </motion.button>
                </div>
              </>
            )}

            {/* Game finished */}
            {isMultiplayerFinished && (
              <>
                {/* Secret code reveal */}
                {mp.secretCode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/95 dark:bg-gray-800/95 rounded-2xl p-4 shadow-xl text-center"
                    style={{ border: '4px solid #FCFF52' }}
                  >
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Secret Code</h3>
                    <div className="flex gap-2 justify-center">
                      {mp.secretCode.map((color, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full border-2 border-gray-300"
                          style={{
                            backgroundColor: color === 'btc' ? '#F7931A' :
                              color === 'eth' ? '#D1D5DB' :
                              color === 'avax' ? '#E84142' :
                              color === 'celo' ? '#FBCC5C' :
                              color === 'near' ? '#00C08B' : '#60A5FA',
                          }}
                          title={color.toUpperCase()}
                        />
                      ))}
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

        {/* Footer (solo modes only) */}
        {!isMultiplayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-center text-xs text-gray-600 pt-2 space-y-1"
          >
            <p>{t('games.contract')} 0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9</p>
            <p>
              <a
                href="https://celoscan.io/address/0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 hover:text-celo font-semibold transition-colors underline decoration-celo"
              >
                {t('games.mastermind.viewOnCeloscan')}
              </a>
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
