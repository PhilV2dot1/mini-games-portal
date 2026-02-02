"use client";

import Link from "next/link";
import { useEffect, useCallback, useRef, useState } from "react";
import { useBlackjack } from "@/hooks/useBlackjack";
import { useBlackjackMultiplayer } from "@/hooks/useBlackjackMultiplayer";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { BlackjackTable } from "@/components/blackjack/BlackjackTable";
import { GameControls } from "@/components/blackjack/GameControls";
import { GameStats } from "@/components/blackjack/GameStats";
import { GameMessage } from "@/components/blackjack/GameMessage";
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

export default function BlackjackPage() {
  const [mode, setMode] = useState<GameMode>('free');
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Solo game hook
  const soloGame = useBlackjack();

  // Multiplayer hook
  const mp = useBlackjackMultiplayer();

  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { chain } = useAccount();
  const contractAddress = getContractAddress('blackjack', chain?.id);
  const { play } = useGameAudio('blackjack');
  const prevHandLength = useRef(soloGame.playerHand.length);

  // Wrappers with sound effects (solo)
  const hitWithSound = useCallback(() => {
    play('hit');
    soloGame.hit();
  }, [play, soloGame]);

  const newGameWithSound = useCallback(() => {
    play('deal');
    soloGame.newGame();
  }, [play, soloGame]);

  // Play sound when cards are dealt (hand length increases) - solo
  useEffect(() => {
    if (mode !== 'multiplayer' && soloGame.playerHand.length > prevHandLength.current) {
      play('deal');
    }
    prevHandLength.current = soloGame.playerHand.length;
  }, [mode, soloGame.playerHand.length, play]);

  // Play result sound when solo game finishes
  useEffect(() => {
    if (mode !== 'multiplayer' && soloGame.gamePhase === 'finished' && soloGame.outcome) {
      if (soloGame.outcome === 'blackjack') {
        play('blackjack');
      } else if (soloGame.outcome === 'win') {
        play('win');
      } else if (soloGame.outcome === 'lose') {
        play('lose');
      }
    }
  }, [mode, soloGame.gamePhase, soloGame.outcome, play]);

  // Record game to portal stats when finished (solo)
  useEffect(() => {
    if (mode !== 'multiplayer' && soloGame.gamePhase === 'finished' && soloGame.outcome) {
      const result = soloGame.outcome === 'blackjack' || soloGame.outcome === 'win' ? 'win' : soloGame.outcome === 'lose' ? 'lose' : 'draw';
      recordGame('blackjack', soloGame.mode, result);
    }
  }, [mode, soloGame.gamePhase, soloGame.outcome, soloGame.mode, recordGame]);

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
  const isMultiplayerPlaying = mp.status === 'playing';
  const isMultiplayerWaiting = mp.status === 'waiting' || mp.status === 'ready';
  const isMultiplayerFinished = mp.status === 'finished';
  const isMultiplayerIdle = mp.status === 'idle';

  const myPlayer = mp.players.find(p => p.player_number === mp.myPlayerNumber);
  const isReady = myPlayer?.ready || false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-chain transition-colors font-bold mb-4"
          >
            {t('games.backToPortal')}
          </Link>
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-chain text-center mb-4">
            <div className="text-6xl mb-2">🃏</div>
            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white mb-2">
              Blackjack
            </h1>
            <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base font-medium">
              Beat the dealer to 21!
            </p>
          </div>
        </header>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
          <GameModeToggle mode={mode} onModeChange={handleModeChange} />
        </div>

        {/* ===== SOLO GAME UI ===== */}
        {!isMultiplayer && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {soloGame.mode === 'onchain' && !soloGame.isConnected && (
                <WalletConnect />
              )}
              {soloGame.message && <GameMessage message={soloGame.message} />}
              <BlackjackTable
                playerCards={soloGame.playerHand}
                dealerCards={soloGame.dealerHand}
                playerTotal={soloGame.playerTotal}
                dealerTotal={soloGame.dealerTotal}
                showDealerCard={soloGame.showDealerCard}
              />
              <GameControls
                onHit={hitWithSound}
                onStand={soloGame.stand}
                onNewGame={newGameWithSound}
                onPlayOnChain={soloGame.playOnChain}
                gamePhase={soloGame.gamePhase}
                mode={soloGame.mode}
                disabled={soloGame.isPending}
              />
            </div>
            <div className="lg:col-span-1">
              <GameStats
                stats={soloGame.stats}
                mode={soloGame.mode}
                credits={soloGame.credits}
                onResetCredits={soloGame.resetCredits}
              />
            </div>
          </div>
        )}

        {/* ===== MULTIPLAYER UI ===== */}
        {isMultiplayer && (
          <div className="max-w-2xl mx-auto space-y-4">
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

                {/* Dealer hand (shared) */}
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-4 shadow-lg border-2 border-gray-300 dark:border-gray-600">
                  <h3 className="text-center font-bold text-gray-700 dark:text-gray-300 mb-2">Dealer</h3>
                  <BlackjackTable
                    playerCards={[]}
                    dealerCards={mp.dealerHand}
                    playerTotal={0}
                    dealerTotal={mp.dealerTotal}
                    showDealerCard={mp.showDealerCards}
                  />
                </div>

                {/* My hand */}
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-4 shadow-lg border-2 border-green-400 dark:border-green-600">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-green-700 dark:text-green-300">
                      {t('multiplayer.you') || 'You'} ({mp.myTotal})
                    </h3>
                    <span className={`text-sm font-semibold px-2 py-1 rounded ${
                      mp.myStatus === 'bust' ? 'bg-red-200 text-red-700' :
                      mp.myStatus === 'blackjack' ? 'bg-yellow-200 text-yellow-700' :
                      mp.myStatus === 'standing' ? 'bg-blue-200 text-blue-700' :
                      'bg-green-200 text-green-700'
                    }`}>
                      {mp.myStatus === 'bust' ? 'BUST' :
                       mp.myStatus === 'blackjack' ? 'BLACKJACK' :
                       mp.myStatus === 'standing' ? 'STAND' : 'Playing'}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-center">
                    {mp.myHand.map((card, i) => (
                      <div key={i} className="w-16 h-24 bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-center shadow">
                        <span className={`text-lg font-bold ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-gray-900'}`}>
                          {card.display}
                        </span>
                        <span className={`text-xl ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-gray-900'}`}>
                          {card.suit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opponent hand */}
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl p-4 shadow-lg border-2 border-red-400 dark:border-red-600">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-red-700 dark:text-red-300">
                      {t('multiplayer.opponent') || 'Opponent'} ({mp.opponentTotal})
                    </h3>
                    <span className={`text-sm font-semibold px-2 py-1 rounded ${
                      mp.opponentStatus === 'bust' ? 'bg-red-200 text-red-700' :
                      mp.opponentStatus === 'blackjack' ? 'bg-yellow-200 text-yellow-700' :
                      mp.opponentStatus === 'standing' ? 'bg-blue-200 text-blue-700' :
                      'bg-green-200 text-green-700'
                    }`}>
                      {mp.opponentStatus === 'bust' ? 'BUST' :
                       mp.opponentStatus === 'blackjack' ? 'BLACKJACK' :
                       mp.opponentStatus === 'standing' ? 'STAND' : 'Playing'}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-center">
                    {mp.opponentHand.map((card, i) => (
                      <div key={i} className="w-16 h-24 bg-white rounded-lg border-2 border-gray-300 flex flex-col items-center justify-center shadow">
                        <span className={`text-lg font-bold ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-gray-900'}`}>
                          {card.display}
                        </span>
                        <span className={`text-xl ${card.suit === '♥' || card.suit === '♦' ? 'text-red-500' : 'text-gray-900'}`}>
                          {card.suit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                {mp.isMyTurn && mp.myStatus === 'playing' && (
                  <div className="flex gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { play('hit'); mp.hit(); }}
                      className="px-8 py-3 bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 rounded-xl font-black shadow-lg transition-all"
                    >
                      HIT
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => mp.stand()}
                      className="px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-black shadow-lg transition-all"
                    >
                      STAND
                    </motion.button>
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

            {/* Game finished - show results */}
            {isMultiplayerFinished && (
              <>
                {/* Final results panel */}
                {mp.phase === 'finished' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/95 dark:bg-gray-800/95 rounded-2xl p-6 shadow-xl border-2 border-chain"
                  >
                    <h3 className="text-center text-xl font-black text-gray-900 dark:text-white mb-4">Results</h3>
                    <div className="grid grid-cols-2 gap-4 text-center mb-4">
                      <div>
                        <div className="text-sm text-gray-500">{t('multiplayer.you') || 'You'}</div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white">{mp.myTotal}</div>
                        <div className={`text-sm font-bold ${
                          mp.myResult === 'win' || mp.myResult === 'blackjack' ? 'text-green-600' :
                          mp.myResult === 'lose' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {mp.myResult === 'blackjack' ? 'BLACKJACK!' : mp.myResult?.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">{t('multiplayer.opponent') || 'Opponent'}</div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white">{mp.opponentTotal}</div>
                        <div className={`text-sm font-bold ${
                          mp.opponentResult === 'win' || mp.opponentResult === 'blackjack' ? 'text-green-600' :
                          mp.opponentResult === 'lose' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {mp.opponentResult === 'blackjack' ? 'BLACKJACK!' : mp.opponentResult?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-500">
                      Dealer: {mp.dealerTotal}
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
          </div>
        )}

        {/* Footer (solo modes only) */}
        {!isMultiplayer && (
          <footer className="mt-12 text-center text-gray-600 text-sm">
            {isGameAvailableOnChain('blackjack', chain?.id) && contractAddress ? (
              <>
                <p>Contract: {contractAddress}</p>
                <p className="mt-1">
                  <a
                    href={getExplorerAddressUrl(chain?.id, contractAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-900 hover:text-chain font-semibold transition-colors underline decoration-chain"
                  >
                    View on {getExplorerName(chain?.id)} →
                  </a>
                </p>
              </>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Coming soon on Base</p>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
