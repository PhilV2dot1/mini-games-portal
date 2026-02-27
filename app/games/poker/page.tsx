"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePoker } from "@/hooks/usePoker";
import { usePokerMultiplayer } from "@/hooks/usePokerMultiplayer";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { getContractAddress, getExplorerAddressUrl, getExplorerName } from "@/lib/contracts/addresses";
import { GameModeToggle } from "@/components/shared/GameModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { MatchmakingButton, WaitingRoom, GameResult, RoomCodeInput } from "@/components/multiplayer";
import { PokerTable } from "@/components/poker/PokerTable";
import { PokerActions } from "@/components/poker/PokerActions";
import { GameStats } from "@/components/poker/GameStats";

type GameMode = 'free' | 'onchain' | 'multiplayer';

export default function PokerPage() {
  const [mode, setMode] = useState<GameMode>('free');
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const solo = usePoker();
  const mp = usePokerMultiplayer();
  const { recordGame } = useLocalStats();
  const { t } = useLanguage();
  const { chain } = useAccount();
  const { play } = useGameAudio('poker');
  const contractAddress = getContractAddress('poker', chain?.id);

  // Record completed solo hands
  useEffect(() => {
    if (solo.phase === 'showdown' && solo.outcome) {
      const result = solo.outcome === 'win' ? 'win' : solo.outcome === 'split' ? 'draw' : 'lose';
      recordGame('poker', solo.mode, result);
    }
  }, [solo.phase, solo.outcome, solo.mode, recordGame]);

  // Audio effects
  useEffect(() => {
    if (solo.phase === 'preflop') play('deal');
  }, [solo.phase, play]);

  useEffect(() => {
    if (solo.outcome === 'win') play('win');
    else if (solo.outcome === 'lose') play('lose');
  }, [solo.outcome, play]);

  // Record multiplayer result
  useEffect(() => {
    if (mp.status === 'finished' && mp.matchResult) {
      recordGame('poker', 'free', mp.matchResult);
    }
  }, [mp.status, mp.matchResult, recordGame]);

  const handleModeChange = useCallback((newMode: GameMode) => {
    if (newMode === 'multiplayer') {
      solo.switchMode('free');
    } else {
      mp.leaveRoom?.();
      solo.switchMode(newMode as 'free' | 'onchain');
    }
    setMode(newMode);
    setShowJoinCode(false);
    setJoinError(null);
  }, [solo, mp]);

  // Multiplayer status flags
  const mpIdle = mp.status === 'idle';
  const mpWaiting = mp.status === 'waiting' || mp.status === 'ready';
  const mpPlaying = mp.status === 'playing';
  const mpFinished = mp.status === 'finished';

  // My player in multiplayer
  const myPlayer = mp.players?.find(p => p.player_number === mp.myPlayerNumber);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-gray-950 to-gray-900 p-4 sm:p-6">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <span className="text-4xl">🃏</span>
            <h1 className="text-3xl font-black text-white">Poker</h1>
          </div>
          <p className="text-gray-400 text-sm">{t('games.poker.subtitle')}</p>
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← {t('games.backToPortal')}
          </Link>
        </motion.div>

        {/* Mode toggle */}
        <div className="flex justify-center">
          <GameModeToggle mode={mode} onModeChange={handleModeChange} showMultiplayer />
        </div>

        {/* ─── SOLO / ONCHAIN MODE ─────────────────────────────────────── */}
        {mode !== 'multiplayer' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Wallet connect prompt for onchain */}
            {mode === 'onchain' && !solo.isConnected && (
              <WalletConnect />
            )}

            {/* Game message */}
            {solo.message && (
              <div className="text-center py-2 px-4 rounded-xl bg-white/5 text-sm text-gray-200">
                {solo.message}
              </div>
            )}

            {/* Poker table */}
            {solo.phase !== 'betting' && (
              <PokerTable
                phase={solo.phase}
                communityCards={solo.communityCards}
                pot={solo.pot}
                currentBet={solo.currentBet}
                player={{
                  label: t('games.poker.yourHand'),
                  holeCards: solo.player.holeCards,
                  stack: solo.player.stack,
                  bet: solo.player.bet,
                  status: solo.player.status,
                  isDealer: solo.player.isDealer,
                  showCards: true,
                  handResult: solo.playerHand,
                  isCurrentTurn: true,
                }}
                dealer={{
                  label: t('games.poker.dealerHand'),
                  holeCards: solo.dealer.holeCards,
                  stack: solo.dealer.stack,
                  bet: solo.dealer.bet,
                  status: solo.dealer.status,
                  isDealer: solo.dealer.isDealer,
                  showCards: solo.showDealerCards,
                  handResult: solo.dealerHand,
                }}
              />
            )}

            {/* Actions */}
            {(solo.phase === 'preflop' || solo.phase === 'flop' || solo.phase === 'turn' || solo.phase === 'river') && (
              <PokerActions
                phase={solo.phase}
                currentBet={solo.currentBet}
                playerBet={solo.player.bet}
                playerStack={solo.player.stack}
                betAmount={solo.betAmount}
                onBetAmountChange={solo.setBetAmount}
                onFold={solo.fold}
                onCheck={solo.check}
                onCall={solo.call}
                onBet={solo.bet}
                disabled={solo.isPending || solo.isConfirming}
              />
            )}

            {/* Deal / New Hand buttons */}
            {solo.phase === 'betting' && (
              <div className="flex justify-center">
                {mode === 'onchain' ? (
                  <button
                    onClick={solo.playOnChain}
                    disabled={!solo.isConnected || !solo.gameAvailable || solo.isPending || solo.isConfirming}
                    className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-xl text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                  >
                    {solo.isPending || solo.isConfirming ? '⏳ Confirming...' : '⛓️ Play On-Chain'}
                  </button>
                ) : (
                  <button
                    onClick={solo.startHand}
                    className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl text-base transition-all active:scale-95"
                  >
                    🃏 {t('games.poker.dealCards')}
                  </button>
                )}
              </div>
            )}

            {/* Result banner */}
            {solo.phase === 'showdown' && solo.outcome && (
              <div className={`text-center py-3 px-4 rounded-xl font-bold text-lg ${
                solo.outcome === 'win'
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : solo.outcome === 'split'
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'bg-red-600/30 text-red-300 border border-red-500/40'
              }`}>
                {solo.outcome === 'win' ? '🎉 You Win!' : solo.outcome === 'split' ? '🤝 Split Pot' : '😔 Dealer Wins'}
                {solo.playerHand && (
                  <div className="text-sm font-normal mt-1 opacity-80">
                    Your hand: {solo.playerHand.label}
                    {solo.dealerHand && ` · Dealer: ${solo.dealerHand.label}`}
                  </div>
                )}
              </div>
            )}

            {/* New Hand after showdown */}
            {solo.phase === 'showdown' && (
              <div className="flex justify-center">
                <button
                  onClick={solo.newHand}
                  disabled={solo.isRecording}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-base transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {solo.isRecording
                    ? '⏳ Recording on-chain...'
                    : mode === 'onchain' && solo.pendingEnd
                    ? '⛓️ Record & New Hand →'
                    : `${t('games.poker.newHand')} →`}
                </button>
              </div>
            )}

            {/* Stats */}
            <GameStats stats={solo.stats} mode={solo.mode} />

            {/* How to play */}
            <details className="bg-white/5 rounded-xl p-4 text-sm text-gray-400 cursor-pointer">
              <summary className="font-semibold text-gray-300 cursor-pointer">
                {t('games.poker.howToPlay')}
              </summary>
              <ul className="mt-3 space-y-1 list-disc list-inside">
                <li>{t('games.poker.rule1')}</li>
                <li>{t('games.poker.rule2')}</li>
                <li>{t('games.poker.rule3')}</li>
                <li>{t('games.poker.rule4')}</li>
              </ul>
            </details>

            {/* Contract footer */}
            {contractAddress && (
              <footer className="text-center text-xs text-gray-500 pt-2">
                <p>{t('games.contract')}{' '}
                  <a
                    href={getExplorerAddressUrl(chain?.id, contractAddress)}
                    target="_blank" rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 underline"
                  >
                    {contractAddress.slice(0, 6)}…{contractAddress.slice(-4)}
                  </a>
                </p>
                <p className="mt-1">
                  <a
                    href={getExplorerAddressUrl(chain?.id, contractAddress)}
                    target="_blank" rel="noopener noreferrer"
                    className="hover:text-gray-300 transition-colors"
                  >
                    {t('games.poker.viewOnExplorer').replace('Explorer', getExplorerName(chain?.id))}
                  </a>
                </p>
              </footer>
            )}
            {!contractAddress && mode === 'onchain' && (
              <p className="text-center text-xs text-gray-500">{t('chain.onchainDev')}</p>
            )}
          </motion.div>
        )}

        {/* ─── MULTIPLAYER MODE ────────────────────────────────────────── */}
        {mode === 'multiplayer' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Idle — matchmaking */}
            {mpIdle && !showJoinCode && (
              <MatchmakingButton
                gameId="poker"
                onFindMatch={mp.findMatch}
                onCreatePrivateRoom={mp.createPrivateRoom}
                onJoinByCode={() => setShowJoinCode(true)}
                isSearching={mp.status === 'searching'}
                onCancelSearch={mp.cancelSearch}
              />
            )}

            {/* Idle — join by code */}
            {mpIdle && showJoinCode && (
              <RoomCodeInput
                onJoin={async (code) => {
                  setJoinError(null);
                  try { await mp.joinByCode(code); }
                  catch (e) { setJoinError((e as Error).message || 'Failed to join'); }
                }}
                onBack={() => setShowJoinCode(false)}
                error={joinError}
              />
            )}

            {/* Waiting room */}
            {mpWaiting && mp.room && (
              <WaitingRoom
                room={mp.room}
                players={mp.players}
                myPlayerNumber={mp.myPlayerNumber}
                isReady={myPlayer?.ready || false}
                onSetReady={mp.setReady}
                onLeave={mp.leaveRoom}
              />
            )}

            {/* Playing — multiplayer table */}
            {mpPlaying && mp.gameState && (
              <div className="space-y-4">
                {/* Turn indicator */}
                <div className={`text-center py-2 rounded-xl text-sm font-semibold ${
                  mp.isMyTurn
                    ? 'bg-emerald-600/30 text-emerald-300 animate-pulse'
                    : 'bg-gray-800/50 text-gray-400'
                }`}>
                  {mp.isMyTurn ? '🎯 Your turn!' : '⏳ Waiting for opponent...'}
                </div>

                {/* Table */}
                <PokerTable
                  phase={mp.gameState.phase}
                  communityCards={mp.gameState.communityCards}
                  pot={mp.gameState.pot}
                  currentBet={mp.gameState.currentBet}
                  player={{
                    label: 'You',
                    holeCards: mp.myHoleCards,
                    stack: mp.myStack,
                    bet: mp.myBet,
                    status: mp.myStatus,
                    isDealer: mp.isDealer,
                    showCards: true,
                    isCurrentTurn: mp.isMyTurn,
                  }}
                  dealer={{
                    label: 'Opponent',
                    holeCards: mp.opponentHoleCards,
                    stack: mp.opponentStack,
                    bet: mp.opponentBet,
                    status: mp.opponentStatus,
                    isDealer: !mp.isDealer,
                    showCards: mp.gameState.phase === 'showdown',
                    handResult: mp.gameState.phase === 'showdown' ? mp.opponentHandResult : undefined,
                  }}
                />

                {/* Actions */}
                {mp.isMyTurn && (
                  <PokerActions
                    phase={mp.gameState.phase}
                    currentBet={mp.gameState.currentBet}
                    playerBet={mp.myBet}
                    playerStack={mp.myStack}
                    betAmount={mp.betAmount}
                    onBetAmountChange={mp.setBetAmount}
                    onFold={mp.fold}
                    onCheck={mp.check}
                    onCall={mp.call}
                    onBet={mp.bet}
                  />
                )}

                {/* Surrender */}
                <div className="flex justify-center">
                  <button
                    onClick={mp.surrender}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors px-4 py-2"
                  >
                    Abandon
                  </button>
                </div>
              </div>
            )}

            {/* Finished */}
            {mpFinished && (
              <GameResult
                winner={mp.winner || null}
                loser={mp.loser || null}
                isDraw={mp.matchResult === 'draw'}
                isWinner={mp.matchResult === 'win'}
                myStats={mp.myStats}
                opponentStats={mp.opponentStats}
                onPlayAgain={() => {
                  mp.leaveRoom();
                  setMode('multiplayer');
                }}
                onLeave={() => {
                  mp.leaveRoom();
                  setMode('free');
                }}
              />
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}
