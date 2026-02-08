/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useTicTacToe } from "@/hooks/useTicTacToe";
import { useTicTacToeMultiplayer } from "@/hooks/useTicTacToeMultiplayer";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { TicTacToeBoard } from "@/components/tictactoe/TicTacToeBoard";
import { GameStatus } from "@/components/tictactoe/GameStatus";
import { GameModeToggle } from "@/components/shared/GameModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { PlayerStats } from "@/components/tictactoe/PlayerStats";
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

export default function TicTacToePage() {
  const [mode, setMode] = useState<GameMode>('free');
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Solo game hook
  const soloGame = useTicTacToe();

  // Multiplayer hook
  const multiplayer = useTicTacToeMultiplayer();

  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { play } = useGameAudio('tictactoe');
  const { chain } = useAccount();
  const contractAddress = getContractAddress('tictactoe', chain?.id);

  // Translate game messages from hook
  const translateMessage = useCallback((message: string): string => {
    const messageMap: Record<string, string> = {
      'Click Start to begin!': t('games.tictactoe.clickToStart'),
      'Recording game start on blockchain...': t('games.tictactoe.recordingGameStart'),
    };
    return messageMap[message] || message;
  }, [t]);

  // Wrapper for handleMove with sound effect (solo)
  const handleSoloMoveWithSound = useCallback((index: number) => {
    play('place');
    soloGame.handleMove(index);
  }, [play, soloGame]);

  // Wrapper for handleMove with sound effect (multiplayer)
  const handleMultiplayerMoveWithSound = useCallback(async (index: number) => {
    play('place');
    await multiplayer.handleMove(index);
  }, [play, multiplayer]);

  // Play result sound when solo game finishes
  useEffect(() => {
    if (mode !== 'multiplayer' && soloGame.status === 'finished' && soloGame.result) {
      if (soloGame.result === 'win') {
        play('win');
      } else if (soloGame.result === 'lose') {
        play('lose');
      } else if (soloGame.result === 'draw') {
        play('tie');
      }
    }
  }, [mode, soloGame.status, soloGame.result, play]);

  // Play result sound when multiplayer game finishes
  useEffect(() => {
    if (mode === 'multiplayer' && multiplayer.status === 'finished' && multiplayer.result) {
      if (multiplayer.result === 'win') {
        play('win');
      } else if (multiplayer.result === 'lose') {
        play('lose');
      } else if (multiplayer.result === 'draw') {
        play('tie');
      }
    }
  }, [mode, multiplayer.status, multiplayer.result, play]);

  // Record game to portal stats when finished (solo)
  useEffect(() => {
    if (mode !== 'multiplayer' && soloGame.status === 'finished' && soloGame.result) {
      recordGame('tictactoe', soloGame.mode, soloGame.result);
    }
  }, [mode, soloGame.status, soloGame.result, soloGame.mode, recordGame]);

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
  const canPlaySolo = soloGame.status === "playing";
  const isProcessingSolo = soloGame.status === "processing";
  const isFinishedSolo = soloGame.status === "finished";

  // Multiplayer game state
  const isMultiplayerPlaying = multiplayer.status === 'playing';
  const isMultiplayerWaiting = multiplayer.status === 'waiting' || multiplayer.status === 'ready';
  const isMultiplayerFinished = multiplayer.status === 'finished';
  const isMultiplayerIdle = multiplayer.status === 'idle';

  // Get ready status for current player
  const myPlayer = multiplayer.players.find(p => p.player_number === multiplayer.myPlayerNumber);
  const isReady = myPlayer?.ready || false;

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
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-chain text-center space-y-1"
        >
          <div className="text-5xl mb-2" role="img" aria-label={t('games.tictactoe.title')}>
            ⭕
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            {t('games.tictactoe.title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('games.tictactoe.subtitle')}</p>
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
            <GameStatus message={translateMessage(soloGame.message)} result={soloGame.result} />

            {/* Game Board */}
            <TicTacToeBoard
              board={soloGame.board}
              onCellClick={handleSoloMoveWithSound}
              disabled={!canPlaySolo || isProcessingSolo}
            />

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              {soloGame.status === "idle" || isFinishedSolo ? (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={soloGame.startGame}
                  disabled={isProcessingSolo || (mode === "onchain" && !soloGame.isConnected)}
                  className="px-8 py-3 bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingSolo ? t('games.starting') : t('games.startGame')}
                </motion.button>
              ) : (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={soloGame.resetGame}
                  disabled={isProcessingSolo}
                  className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('games.reset')}
                </motion.button>
              )}
            </div>

            {/* Player Stats */}
            <PlayerStats stats={soloGame.stats} />
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
                {/* Turn indicator */}
                <div className={`text-center p-3 rounded-xl font-bold ${
                  multiplayer.isMyTurn
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                }`}>
                  {multiplayer.isMyTurn
                    ? t('multiplayer.yourTurn') || 'Your Turn!'
                    : t('multiplayer.opponentTurn') || "Opponent's Turn..."}
                  <span className="ml-2 text-lg">
                    {multiplayer.mySymbol && `(${t('multiplayer.youAre') || 'You are'} ${multiplayer.mySymbol})`}
                  </span>
                </div>

                {/* Opponent info */}
                {multiplayer.opponent && (
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    {t('multiplayer.vs') || 'vs'} {(multiplayer.opponent as any).users?.display_name || 'Opponent'} ({multiplayer.opponentSymbol})
                  </div>
                )}

                {/* Game Board */}
                <TicTacToeBoard
                  board={multiplayer.board}
                  onCellClick={handleMultiplayerMoveWithSound}
                  disabled={!multiplayer.isMyTurn}
                />

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
                  winner={multiplayer.result === 'win' ? (multiplayer.players.find(p => p.player_number === multiplayer.myPlayerNumber) || null) : (multiplayer.opponent || null)}
                  loser={multiplayer.result === 'win' ? (multiplayer.opponent || null) : (multiplayer.players.find(p => p.player_number === multiplayer.myPlayerNumber) || null)}
                  isDraw={multiplayer.result === 'draw'}
                  isWinner={multiplayer.result === 'win' ? true : multiplayer.result === 'lose' ? false : null}
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
            className="text-center text-xs text-gray-600 pt-2 space-y-1"
          >
            {isGameAvailableOnChain('tictactoe', chain?.id) ? (
              <>
                <p>{t('games.contract')} {contractAddress}</p>
                <p>
                  <a
                    href={getExplorerAddressUrl(chain?.id, contractAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 hover:text-chain font-semibold transition-colors underline decoration-chain"
                  >
                    {t('games.tictactoe.viewOnCeloscan').replace('Celoscan', getExplorerName(chain?.id))}
                  </a>
                </p>
              </>
            ) : (
              <p>Coming soon on Base</p>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
