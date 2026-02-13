/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSolitaire, Suit } from "@/hooks/useSolitaire";
import { useSolitaireMultiplayer } from "@/hooks/useSolitaireMultiplayer";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { SolitaireBoard } from "@/components/solitaire/SolitaireBoard";
import { GameStatus } from "@/components/solitaire/GameStatus";
import { PlayerStats } from "@/components/solitaire/PlayerStats";
import { GameControls } from "@/components/solitaire/GameControls";
import { GameModeToggle } from "@/components/shared/GameModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import {
  MatchmakingButton,
  WaitingRoom,
  RoomCodeInput,
} from "@/components/multiplayer";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import { getContractAddress, getExplorerAddressUrl, getExplorerName, isGameAvailableOnChain } from "@/lib/contracts/addresses";

type GameMode = 'free' | 'onchain' | 'multiplayer';

interface DragItem {
  fromWaste?: boolean;
  fromTableau?: number;
  fromTableauIndex?: number;
}

export default function SolitairePage() {
  const [mode, setMode] = useState<GameMode>('free');
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Solo game hook
  const soloGame = useSolitaire();

  // Multiplayer hook
  const mp = useSolitaireMultiplayer();

  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { play } = useGameAudio('solitaire');
  const { chain } = useAccount();
  const contractAddress = getContractAddress('solitaire', chain?.id);

  // Translate game messages from hook
  const translateMessage = useCallback((msg: string): string => {
    const messageMap: Record<string, string> = {
      'Press Start to begin!': t('games.msg.pressStart'),
      'Good luck!': t('games.msg.goodLuck'),
      'Congratulations! You won!': t('games.msg.congratsWin'),
      'Game started!': t('games.msg.gameStarted'),
      'Auto-completing...': t('games.msg.autoCompleting'),
    };
    if (msg.includes('Win recorded on blockchain')) return '✅ ' + t('games.msg.winRecorded');
    if (msg.includes('Game won but not recorded')) return '⚠️ ' + t('games.msg.notRecorded');
    if (msg.includes('No more moves possible')) return t('games.msg.gameBlocked');
    if (msg.includes('Game recorded on blockchain')) return '✅ ' + t('games.msg.gameRecorded');
    if (msg.includes('blocked but not recorded')) return '⚠️ ' + t('games.msg.notRecorded');
    if (msg.includes('connect wallet')) return t('games.msg.connectWallet');
    if (msg.includes('Starting game on blockchain')) return t('games.msg.startingBlockchain');
    if (msg.includes('Failed to start')) return t('games.msg.failedStart');
    if (msg.includes('Cannot auto-complete')) return t('games.msg.cannotAutoComplete');
    return messageMap[msg] || msg;
  }, [t]);

  const isMultiplayer = mode === 'multiplayer';

  // Record game to portal stats when finished (solo)
  useEffect(() => {
    if (!isMultiplayer && soloGame.status === "won") {
      recordGame("solitaire", soloGame.mode, "win");
      play('win');
    }
  }, [isMultiplayer, soloGame.status, soloGame.mode, recordGame, play]);

  // Multiplayer result sounds
  useEffect(() => {
    if (isMultiplayer && mp.result === 'won') {
      play('win');
    }
  }, [isMultiplayer, mp.result, play]);

  // Mode change handler
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

  // Join by code handler
  const handleJoinByCode = async (code: string) => {
    try {
      setJoinError(null);
      await mp.joinByCode(code);
      setShowJoinCode(false);
    } catch {
      setJoinError(t('multiplayer.invalidCode') || 'Invalid room code');
    }
  };

  // Solo game state
  const isPlayingSolo = soloGame.status === "playing";
  const isWonSolo = soloGame.status === "won";

  // Multiplayer game state
  const isMpPlaying = mp.status === 'playing';
  const isMpWaiting = mp.status === 'waiting' || mp.status === 'ready';
  const isMpFinished = mp.result !== null;
  const isMpIdle = mp.status === 'idle';

  // Solo sound wrappers
  const drawFromStockWithSound = useCallback(() => {
    play('flip');
    soloGame.drawFromStock();
  }, [play, soloGame]);

  const handleTableauClick = (columnIndex: number, cardIndex: number) => {
    if (!isPlayingSolo) return;
    const column = soloGame.gameState.tableau[columnIndex];
    if (cardIndex !== column.length - 1) return;
    const card = column[cardIndex];
    play('place');
    soloGame.moveTableauToFoundation(columnIndex, card.suit);
  };

  const handleTableauDrop = (item: DragItem, targetColumnIndex: number) => {
    if (!isPlayingSolo) return;
    play('place');
    if (item.fromWaste) {
      soloGame.moveWasteToTableau(targetColumnIndex);
    } else if (item.fromTableau !== undefined) {
      soloGame.moveTableauToTableau(item.fromTableau, item.fromTableauIndex || 0, targetColumnIndex);
    }
  };

  const handleFoundationDrop = (item: DragItem, suit: Suit) => {
    if (!isPlayingSolo) return;
    if (item.fromWaste) {
      soloGame.moveWasteToFoundation(suit);
    } else if (item.fromTableau !== undefined) {
      soloGame.moveTableauToFoundation(item.fromTableau, suit);
    }
  };

  // Multiplayer sound wrappers
  const mpDrawFromStock = useCallback(async () => {
    play('flip');
    await mp.handleDrawFromStock();
  }, [play, mp]);

  const mpHandleTableauClick = (columnIndex: number, cardIndex: number) => {
    if (!isMpPlaying || !mp.isMyTurn || !mp.gameState) return;
    const column = mp.gameState.tableau[columnIndex];
    if (cardIndex !== column.length - 1) return;
    const card = column[cardIndex];
    play('place');
    mp.handleMoveTableauToFoundation(columnIndex, card.suit as Suit);
  };

  const mpHandleTableauDrop = (item: DragItem, targetColumnIndex: number) => {
    if (!isMpPlaying || !mp.isMyTurn) return;
    play('place');
    if (item.fromWaste) {
      mp.handleMoveWasteToTableau(targetColumnIndex);
    } else if (item.fromTableau !== undefined) {
      mp.handleMoveTableauToTableau(item.fromTableau, item.fromTableauIndex || 0, targetColumnIndex);
    }
  };

  const mpHandleFoundationDrop = (item: DragItem, suit: Suit) => {
    if (!isMpPlaying || !mp.isMyTurn) return;
    if (item.fromWaste) {
      mp.handleMoveWasteToFoundation(suit);
    } else if (item.fromTableau !== undefined) {
      mp.handleMoveTableauToFoundation(item.fromTableau, suit);
    }
  };

  // Get ready status for current player
  const myPlayer = mp.players.find(p => p.player_number === mp.myPlayerNumber);
  const isReady = myPlayer?.ready || false;

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-100 to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Back to Portal Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-purple-700 dark:hover:text-chain transition-colors font-bold"
        >
          {t('games.backToPortal')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-purple-500 text-center space-y-1"
        >
          <div className="text-5xl mb-2" role="img" aria-label={t('games.solitaire.title')}>
            🃏
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">{t('games.solitaire.title')}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isMultiplayer
              ? (t('games.solitaire.collabSubtitle') || 'Collaborative mode - Work together!')
              : t('games.solitaire.subtitle')}
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <div className="flex justify-center">
          <GameModeToggle mode={mode} onModeChange={handleModeChange} />
        </div>

        {/* How to Play Section (solo only) */}
        {!isMultiplayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg max-w-2xl mx-auto border border-gray-200 dark:border-gray-700"
          >
            <h2 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
              {t('games.solitaire.howToPlay')}
            </h2>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• {t('games.solitaire.rule1')}</li>
              <li>• {t('games.solitaire.rule2')}</li>
            </ul>
          </motion.div>
        )}

        {/* Wallet Connect (On-Chain Mode) */}
        {mode === "onchain" && <WalletConnect />}

        {/* ===== SOLO GAME UI ===== */}
        {!isMultiplayer && (
          <>
            <GameStatus
              message={translateMessage(soloGame.message)}
              status={soloGame.status}
              score={soloGame.gameState.score}
              moves={soloGame.gameState.moves}
              elapsedTime={soloGame.gameState.elapsedTime}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border-2 border-purple-300"
            >
              <SolitaireBoard
                gameState={soloGame.gameState}
                onTableauClick={handleTableauClick}
                onTableauDrop={handleTableauDrop}
                onFoundationDrop={handleFoundationDrop}
                onStockClick={drawFromStockWithSound}
              />
            </motion.div>

            <GameControls
              status={soloGame.status}
              canUndo={soloGame.canUndo}
              canAutoComplete={soloGame.canAutoComplete}
              onStart={soloGame.startGame}
              onReset={soloGame.resetGame}
              onUndo={soloGame.undoMove}
              onAutoComplete={soloGame.autoComplete}
            />

            {/* How to Play (idle) */}
            {!isPlayingSolo && !isWonSolo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white/90 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 border-gray-300"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t('games.solitaire.howToPlay')}</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{t('games.solitaire.rule1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{t('games.solitaire.rule2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{t('games.solitaire.rule3')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{t('games.solitaire.rule4')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span>{t('games.solitaire.rule5')}</span>
                  </li>
                </ul>
              </motion.div>
            )}

            <PlayerStats stats={soloGame.stats} />
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
            {isMpIdle && !showJoinCode && (
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg max-w-2xl mx-auto border border-gray-200 dark:border-gray-700"
                >
                  <h2 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">
                    {t('games.solitaire.collabHowToPlay') || 'Collaborative Solitaire'}
                  </h2>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• {t('games.solitaire.collabRule1') || 'Work together with 2-4 players to complete the Solitaire'}</li>
                    <li>• {t('games.solitaire.collabRule2') || 'Take turns making moves (30 seconds per turn)'}</li>
                    <li>• {t('games.solitaire.collabRule3') || 'Everyone wins or loses together!'}</li>
                  </ul>
                </motion.div>

                <MatchmakingButton
                  onFindMatch={mp.findMatch}
                  onCreatePrivate={mp.createPrivateRoom}
                  isSearching={mp.isSearching}
                  onCancel={mp.cancelSearch}
                  onJoinByCode={() => setShowJoinCode(true)}
                />
              </div>
            )}

            {/* Join by code */}
            {isMpIdle && showJoinCode && (
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
            {isMpWaiting && mp.room && (
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
            {isMpPlaying && mp.gameState && (
              <>
                {/* Turn indicator + timer */}
                <div className={`text-center p-3 rounded-xl font-bold ${
                  mp.isMyTurn
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                }`}>
                  <div>
                    {mp.isMyTurn
                      ? (t('multiplayer.yourTurn') || 'Your Turn!')
                      : `${t('multiplayer.playerTurn') || 'Player'} ${mp.currentTurnPlayer}${t('multiplayer.turnSuffix') || "'s Turn..."}`}
                  </div>
                  {mp.turnTimeRemaining !== null && (
                    <div className={`text-sm mt-1 ${mp.turnTimeRemaining <= 5 ? 'text-red-500 dark:text-red-400 animate-pulse' : ''}`}>
                      {mp.turnTimeRemaining}s
                    </div>
                  )}
                </div>

                {/* Player list with move counts */}
                <div className="flex justify-center gap-3 flex-wrap">
                  {mp.players.map(player => (
                    <div
                      key={player.user_id}
                      className={`px-3 py-2 rounded-lg text-sm font-medium ${
                        player.player_number === mp.currentTurnPlayer
                          ? 'bg-chain/20 border-2 border-chain text-gray-900 dark:text-white'
                          : 'bg-white/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <span>
                        {player.player_number === mp.myPlayerNumber
                          ? (t('multiplayer.you') || 'You')
                          : ((player as any).users?.display_name || `Player ${player.player_number}`)}
                      </span>
                      <span className="ml-2 text-xs opacity-70">
                        ({mp.playerMoves[player.player_number] || 0} {t('games.solitaire.movesLabel') || 'moves'})
                      </span>
                    </div>
                  ))}
                </div>

                {/* Score and total moves */}
                <div className="flex justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <span>{t('games.solitaire.scoreLabel') || 'Score'}: {mp.gameState.score}</span>
                  <span>{t('games.solitaire.movesLabel') || 'Moves'}: {mp.gameState.moves}</span>
                </div>

                {/* Game Board */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border-2 ${
                    mp.isMyTurn ? 'border-green-400' : 'border-purple-300 opacity-80'
                  }`}
                >
                  <SolitaireBoard
                    gameState={mp.gameState}
                    onTableauClick={mpHandleTableauClick}
                    onTableauDrop={mpHandleTableauDrop}
                    onFoundationDrop={mpHandleFoundationDrop}
                    onStockClick={mpDrawFromStock}
                  />
                </motion.div>

                {/* Leave button */}
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={mp.leaveRoom}
                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-lg transition-all"
                  >
                    {t('multiplayer.leave') || 'Leave Game'}
                  </motion.button>
                </div>
              </>
            )}

            {/* Game finished */}
            {isMpFinished && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border-2 border-purple-500 text-center space-y-4"
              >
                <div className="text-6xl">
                  {mp.result === 'won' ? '🎉' : '😔'}
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                  {mp.result === 'won'
                    ? (t('games.solitaire.collabWin') || 'You all won together!')
                    : (t('games.solitaire.collabLose') || 'Game blocked - No more moves!')}
                </h2>

                {/* Player contributions */}
                <div className="space-y-2">
                  <h3 className="font-bold text-gray-700 dark:text-gray-300">
                    {t('games.solitaire.contributions') || 'Player Contributions'}
                  </h3>
                  {mp.players.map(player => (
                    <div key={player.user_id} className="flex justify-between max-w-xs mx-auto text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {player.player_number === mp.myPlayerNumber
                          ? (t('multiplayer.you') || 'You')
                          : ((player as any).users?.display_name || `Player ${player.player_number}`)}
                      </span>
                      <span className="font-mono">{mp.playerMoves[player.player_number] || 0} {t('games.solitaire.movesLabel') || 'moves'}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => {
                      mp.playAgain();
                      mp.leaveRoom();
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg transition-all"
                  >
                    {t('multiplayer.playAgain') || 'Play Again'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={mp.leaveRoom}
                    className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg transition-all"
                  >
                    {t('multiplayer.leave') || 'Leave'}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Footer (solo only) */}
        {!isMultiplayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-gray-600 pt-2 space-y-1"
          >
            <p className="font-semibold">
              {t('games.solitaire.footer')}
            </p>
            {isGameAvailableOnChain('solitaire', chain?.id) && contractAddress ? (
              <p className="text-gray-500">
                {t('games.contract')}{" "}
                <a
                  href={getExplorerAddressUrl(chain?.id, contractAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-700 underline transition-colors"
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
                  {t('games.solitaire.viewOnCeloscan').replace('Celoscan', getExplorerName(chain?.id))}
                </a>
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">{t('chain.comingSoon')}</p>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
