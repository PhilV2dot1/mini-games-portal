"use client";

import Link from "next/link";
import { useEffect, useCallback, useState } from "react";
import { useRockPaperScissors, type Choice } from "@/hooks/useRockPaperScissors";
import { useRPSMultiplayer, type RPSChoice } from "@/hooks/useRPSMultiplayer";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { GameBoard } from "@/components/rps/GameBoard";
import { GameStatus } from "@/components/rps/GameStatus";
import { PlayerStats } from "@/components/rps/PlayerStats";
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
import { useAccount } from "wagmi";
import { getContractAddress, getExplorerAddressUrl, getExplorerName, isGameAvailableOnChain } from '@/lib/contracts/addresses';

type GameMode = 'free' | 'onchain' | 'multiplayer';

const CHOICES_EMOJI: Record<RPSChoice, string> = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️',
};

export default function RockPaperScissorsPage() {
  const [mode, setMode] = useState<GameMode>('free');
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Solo game hook
  const soloGame = useRockPaperScissors();

  // Multiplayer hook
  const multiplayer = useRPSMultiplayer();

  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { play: playSound } = useGameAudio('rps');
  const { chain } = useAccount();
  const contractAddress = getContractAddress('rps', chain?.id);

  // Translate game messages from hook
  const translateMessage = useCallback((message: string): string => {
    if (message.startsWith('🎉 You Win')) return '🎉 ' + t('games.msg.youWin');
    if (message.startsWith('😞 You Lose')) return '😞 ' + t('games.msg.youLose');
    if (message.startsWith('🤝')) return '🤝 ' + t('games.msg.itsTie');
    if (message.startsWith('❌ Please connect')) return '❌ ' + t('games.msg.connectWallet');
    if (message.startsWith('⏳ Please wait')) return '⏳ ' + t('games.msg.processing');
    if (message.startsWith('⏳ Sending')) return '⏳ ' + t('games.msg.processing');
    if (message.startsWith('⏳ Waiting')) return '⏳ ' + t('games.msg.processing');
    if (message.startsWith('✅ Transaction confirmed')) return '✅ ' + t('games.msg.gameRecorded');
    if (message.startsWith('❌ Transaction failed')) return '❌ ' + t('games.msg.txFailed');
    return message;
  }, [t]);

  // Wrapper for play with sound effects (solo)
  const handleSoloChoice = useCallback((choice: Choice) => {
    playSound('select');
    soloGame.play(choice);
  }, [playSound, soloGame]);

  // Wrapper for play with sound effects (multiplayer)
  const handleMultiplayerChoice = useCallback(async (choice: Choice) => {
    playSound('select');
    const rpsChoice: RPSChoice = choice === 0 ? 'rock' : choice === 1 ? 'paper' : 'scissors';
    await multiplayer.makeChoice(rpsChoice);
  }, [playSound, multiplayer]);

  // Play result sound when solo game finishes
  useEffect(() => {
    if (mode !== 'multiplayer' && soloGame.status === 'finished' && soloGame.lastResult) {
      // Short delay for reveal sound
      playSound('reveal');

      // Play result sound after a brief delay
      const timer = setTimeout(() => {
        if (soloGame.lastResult?.result === 'win') {
          playSound('win');
        } else if (soloGame.lastResult?.result === 'lose') {
          playSound('lose');
        } else {
          playSound('tie');
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [mode, soloGame.status, soloGame.lastResult, playSound]);

  // Play result sound when multiplayer round finishes
  useEffect(() => {
    if (mode === 'multiplayer' && multiplayer.revealed && multiplayer.roundResult) {
      playSound('reveal');

      const timer = setTimeout(() => {
        if (multiplayer.roundResult === 'win') {
          playSound('win');
        } else if (multiplayer.roundResult === 'lose') {
          playSound('lose');
        } else {
          playSound('tie');
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [mode, multiplayer.revealed, multiplayer.roundResult, playSound]);

  // Record game to portal stats when finished (solo)
  useEffect(() => {
    if (mode !== 'multiplayer' && soloGame.status === 'finished' && soloGame.lastResult) {
      // Map RPS result to standard game result ('tie' in RPS = 'draw' in portal)
      const result = soloGame.lastResult.result === 'tie' ? 'draw' : soloGame.lastResult.result;
      recordGame('rps', soloGame.mode, result);
    }
  }, [mode, soloGame.status, soloGame.lastResult, soloGame.mode, recordGame]);

  // Switch mode handler
  const handleModeChange = useCallback((newMode: GameMode) => {
    // Leave multiplayer room if switching away
    if (mode === 'multiplayer' && newMode !== 'multiplayer') {
      multiplayer.leaveRoom();
    }
    setMode(newMode);
    setShowJoinCode(false);
    setJoinError(null);

    // Reset solo game when switching to solo modes
    if (newMode === 'free' || newMode === 'onchain') {
      soloGame.switchMode(newMode);
    }
  }, [mode, multiplayer, soloGame]);

  // Handle join by code
  const handleJoinByCode = async (code: string) => {
    try {
      setJoinError(null);
      await multiplayer.joinByCode(code);
      setShowJoinCode(false);
    } catch {
      setJoinError(t('multiplayer.invalidCode') || 'Invalid room code');
    }
  };

  // Determine if it's a multiplayer game
  const isMultiplayer = mode === 'multiplayer';

  // Solo game state
  const isProcessingSolo = soloGame.status === "processing";

  // Multiplayer game state
  const isMultiplayerPlaying = multiplayer.status === 'playing';
  const isMultiplayerWaiting = multiplayer.status === 'waiting' || multiplayer.status === 'ready';
  const isMultiplayerFinished = multiplayer.status === 'finished';
  const isMultiplayerIdle = multiplayer.status === 'idle';

  // Get ready status for current player
  const myPlayer = multiplayer.players.find(p => p.player_number === multiplayer.myPlayerNumber);
  const isReady = myPlayer?.ready || false;

  return (
    <main
      className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8"
      style={{
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <div className="max-w-xl mx-auto space-y-4 sm:space-y-5">
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
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-chain text-center space-y-2"
        >
          <div className="text-5xl mb-2" role="img" aria-label={t('games.rps.title')}>
            ✊
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
            {t('games.rps.title')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-semibold">
            {t('games.rps.subtitle')}
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <GameModeToggle mode={mode} onModeChange={handleModeChange} />
        </div>

        {/* Wallet Connect (On-Chain Mode) */}
        {mode === "onchain" && <WalletConnect />}

        {/* ===== SOLO GAME UI ===== */}
        {!isMultiplayer && (
          <>
            {/* Game Status */}
            <GameStatus result={soloGame.lastResult} message={translateMessage(soloGame.message)} />

            {/* Game Board */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-lg border-2 border-gray-300 dark:border-gray-600"
            >
              <GameBoard onChoice={handleSoloChoice} disabled={isProcessingSolo} />
            </motion.div>

            {/* Player Stats */}
            <PlayerStats stats={soloGame.stats} onReset={soloGame.mode === 'free' ? soloGame.resetStats : undefined} />
          </>
        )}

        {/* ===== MULTIPLAYER UI ===== */}
        {isMultiplayer && (
          <>
            {/* Error display */}
            {multiplayer.error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-700 dark:text-red-300 text-center">
                {multiplayer.error}
              </div>
            )}

            {/* Idle state - Matchmaking buttons */}
            {isMultiplayerIdle && !showJoinCode && (
              <div className="space-y-4">
                <MatchmakingButton
                  onFindMatch={multiplayer.findMatch}
                  onCreatePrivate={multiplayer.createPrivateRoom}
                  isSearching={multiplayer.isSearching}
                  onCancel={multiplayer.cancelSearch}
                  onJoinByCode={() => setShowJoinCode(true)}
                />
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
                  isLoading={multiplayer.isSearching}
                  error={joinError}
                />
              </div>
            )}

            {/* Waiting room */}
            {isMultiplayerWaiting && multiplayer.room && (
              <div className="flex justify-center">
                <WaitingRoom
                  room={multiplayer.room}
                  players={multiplayer.players}
                  myPlayerNumber={multiplayer.myPlayerNumber}
                  isReady={isReady}
                  onSetReady={multiplayer.setReady}
                  onLeave={multiplayer.leaveRoom}
                />
              </div>
            )}

            {/* Playing state */}
            {isMultiplayerPlaying && (
              <>
                {/* Round indicator */}
                <div className="text-center p-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {t('multiplayer.rps.round') || 'Round'} {multiplayer.round} / {multiplayer.maxRounds}
                </div>

                {/* Score display */}
                <div className="flex justify-center items-center gap-6 p-4 bg-white/90 dark:bg-gray-800/90 rounded-xl">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('multiplayer.you') || 'You'}</div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">{multiplayer.scores[multiplayer.myPlayerNumber === 1 ? 0 : 1]}</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-400">-</div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400">{t('multiplayer.opponent') || 'Opponent'}</div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white">{multiplayer.scores[multiplayer.myPlayerNumber === 1 ? 1 : 0]}</div>
                  </div>
                </div>

                {/* Choice status */}
                {!multiplayer.revealed && (
                  <div className={`text-center p-3 rounded-xl font-bold ${
                    multiplayer.hasChosen
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {multiplayer.hasChosen
                      ? (multiplayer.opponentHasChosen
                          ? t('multiplayer.rps.revealing') || 'Revealing...'
                          : t('multiplayer.rps.waitingOpponent') || 'Waiting for opponent...')
                      : t('multiplayer.rps.makeChoice') || 'Make your choice!'}
                  </div>
                )}

                {/* Round result */}
                {multiplayer.revealed && multiplayer.myChoice && multiplayer.opponentChoice && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-2xl p-4 border-2 border-gray-700 dark:border-gray-600 shadow-xl"
                  >
                    <div className="flex items-center justify-center gap-4 mb-3">
                      <div className="text-center">
                        <div className="text-5xl mb-1">
                          {CHOICES_EMOJI[multiplayer.myChoice]}
                        </div>
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t('multiplayer.you') || 'You'}</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-400">vs</div>
                      <div className="text-center">
                        <div className="text-5xl mb-1">
                          {CHOICES_EMOJI[multiplayer.opponentChoice]}
                        </div>
                        <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t('multiplayer.opponent') || 'Opponent'}</div>
                      </div>
                    </div>
                    <div
                      className={`text-center text-lg font-bold py-2 px-4 rounded-xl ${
                        multiplayer.roundResult === "win"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                          : multiplayer.roundResult === "lose"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                          : "bg-chain/10 text-yellow-800 dark:text-yellow-300"
                      }`}
                    >
                      {multiplayer.roundResult === 'win'
                        ? t('multiplayer.rps.youWinRound') || 'You win this round!'
                        : multiplayer.roundResult === 'lose'
                        ? t('multiplayer.rps.youLoseRound') || 'You lose this round!'
                        : t('multiplayer.rps.draw') || "It's a tie!"}
                    </div>
                  </motion.div>
                )}

                {/* Game Board (disabled if already chosen this round) */}
                {!multiplayer.revealed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-4 sm:p-6 shadow-lg border-2 border-gray-300 dark:border-gray-600"
                  >
                    <GameBoard
                      onChoice={handleMultiplayerChoice}
                      disabled={multiplayer.hasChosen}
                    />
                  </motion.div>
                )}

                {/* Your choice indicator (when waiting for opponent) */}
                {multiplayer.hasChosen && !multiplayer.revealed && multiplayer.myChoice && (
                  <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <span className="text-gray-600 dark:text-gray-400">{t('multiplayer.rps.yourChoice') || 'Your choice'}:</span>
                    <span className="ml-2 text-2xl">{CHOICES_EMOJI[multiplayer.myChoice]}</span>
                  </div>
                )}

                {/* Surrender button */}
                <div className="flex justify-center">
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={multiplayer.surrender}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-lg transition-all"
                  >
                    {t('multiplayer.surrender') || 'Surrender'}
                  </motion.button>
                </div>
              </>
            )}

            {/* Game finished */}
            {isMultiplayerFinished && (
              <div className="flex justify-center">
                <GameResult
                  winner={multiplayer.matchResult === 'win' ? (multiplayer.players.find(p => p.player_number === multiplayer.myPlayerNumber) || null) : (multiplayer.opponent || null)}
                  loser={multiplayer.matchResult === 'win' ? (multiplayer.opponent || null) : (multiplayer.players.find(p => p.player_number === multiplayer.myPlayerNumber) || null)}
                  isDraw={multiplayer.matchResult === 'draw'}
                  isWinner={multiplayer.matchResult === 'win' ? true : multiplayer.matchResult === 'lose' ? false : null}
                  myStats={multiplayer.myStats}
                  opponentStats={multiplayer.opponentStats}
                  onPlayAgain={() => {
                    multiplayer.playAgain();
                    multiplayer.leaveRoom();
                  }}
                  onLeave={multiplayer.leaveRoom}
                />
              </div>
            )}
          </>
        )}

        {/* Footer (only show on solo modes) */}
        {!isMultiplayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 pt-2 space-y-1"
          >
            {isGameAvailableOnChain('rps', chain?.id) ? (
              <>
                <p>{t('games.contract')} {contractAddress}</p>
                <p>
                  <a
                    href={getExplorerAddressUrl(chain?.id, contractAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 dark:text-white hover:text-chain font-semibold transition-colors underline decoration-chain"
                  >
                    {t('games.rps.viewOnCeloscan').replace('Celoscan', getExplorerName(chain?.id))}
                  </a>
                </p>
              </>
            ) : (
              <p>{t('chain.comingSoon')}</p>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
