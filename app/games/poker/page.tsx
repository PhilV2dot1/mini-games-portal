"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { usePoker } from "@/hooks/usePoker";
import { usePokerMultiplayer } from "@/hooks/usePokerMultiplayer";
import type { PokerPhase } from "@/hooks/usePoker";
import type { Card } from "@/lib/games/poker-cards";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useChainTheme } from "@/hooks/useChainTheme";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { getContractAddress, getExplorerAddressUrl, getExplorerName, isGameAvailableOnChain } from "@/lib/contracts/addresses";
import { GameModeToggle } from "@/components/shared/GameModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";
import { FarcasterShare } from "@/components/shared/FarcasterShare";
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
  const { t } = useLanguage();
  const { chain } = useAccount();
  const { theme } = useChainTheme();
  const { recordGame, getStats } = useLocalStats();
  const contractAddress = getContractAddress('poker', chain?.id);
  const recordedHandRef = useRef<string | null>(null);

  // Record each completed hand to portal stats — guard against duplicate triggers
  useEffect(() => {
    if (solo.phase === 'showdown' && solo.outcome) {
      if (recordedHandRef.current === solo.outcome + solo.pot) return;
      recordedHandRef.current = solo.outcome + solo.pot;
      const result = solo.outcome === 'win' ? 'win' : solo.outcome === 'split' ? 'draw' : 'lose';
      recordGame('poker', solo.mode, result);
    } else if (solo.phase === 'betting') {
      recordedHandRef.current = null;
    }
  }, [solo.phase, solo.outcome, solo.pot, solo.mode, recordGame]);

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

  const myPlayer = mp.players?.find(p => p.player_number === mp.myPlayerNumber);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Back link */}
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
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 text-center space-y-1"
          style={{ borderColor: theme.primary }}
        >
          <img src="/icons/poker.png" alt="Poker" className="w-14 h-14 mx-auto object-contain mb-2" />
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            {t('games.poker.title') || 'Poker'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('games.poker.subtitle')}
          </p>
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-center py-3 px-4 rounded-xl font-semibold shadow-lg ${
                  solo.outcome === 'win'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-400'
                    : solo.outcome === 'lose'
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-400'
                    : 'bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border-2'
                }`}
                style={!solo.outcome || solo.phase !== 'showdown'
                  ? { borderColor: theme.primary }
                  : undefined}
              >
                {solo.message}
              </motion.div>
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

            {/* Result banner */}
            {solo.phase === 'showdown' && solo.outcome && (
              <motion.div
                data-testid="poker-result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-center py-3 px-4 rounded-xl font-bold text-lg border-2 ${
                  solo.outcome === 'win'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-400'
                    : solo.outcome === 'split'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-400'
                }`}
              >
                {solo.outcome === 'win' ? '🎉 You Win!' : solo.outcome === 'split' ? '🤝 Split Pot' : '😔 Dealer Wins'}
                {solo.playerHand && (
                  <div className="text-sm font-normal mt-1 opacity-80">
                    Your hand: {solo.playerHand.label}
                    {solo.dealerHand && ` · Dealer: ${solo.dealerHand.label}`}
                  </div>
                )}
              </motion.div>
            )}

            {/* Unfinished on-chain session warning */}
            {mode === 'onchain' && solo.phase === 'betting' && solo.hasActiveOnChainGame && !solo.sessionActive && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3 bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-400 rounded-xl p-4 text-center"
              >
                <p className="text-orange-800 dark:text-orange-300 font-semibold text-sm">
                  {t('games.poker.unfinishedSession')}
                </p>
                <button
                  onClick={solo.abandonGame}
                  disabled={solo.isPending || solo.isConfirming}
                  className="px-6 py-2 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 active:scale-95 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {solo.isPending || solo.isConfirming ? t('games.poker.abandoning') : t('games.poker.abandonSession')}
                </button>
              </motion.div>
            )}

            {/* On-chain session stats bar */}
            {mode === 'onchain' && solo.sessionActive && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-gray-800/60 border border-gray-600 rounded-xl px-4 py-2 text-sm"
              >
                <div className="flex gap-4 text-gray-300">
                  <span>🃏 <strong className="text-white">{solo.sessionStats.handsPlayed}</strong> {t('games.poker.handsLabel')}</span>
                  <span>🏆 <strong className="text-green-400">{solo.sessionStats.handsWon}</strong> {t('games.poker.wonLabel')}</span>
                  <span>💰 <strong className="text-yellow-400">{solo.player.stack}</strong> chips</span>
                </div>
                <button
                  onClick={solo.endOnChainSession}
                  disabled={solo.isRecording || solo.sessionStats.handsPlayed === 0}
                  className="px-3 py-1 rounded-lg font-bold text-xs bg-yellow-400 hover:bg-yellow-500 text-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {solo.isRecording ? t('games.poker.recording') : t('games.poker.endSession')}
                </button>
              </motion.div>
            )}

            {/* Deal / New Hand buttons */}
            <div className="flex justify-center">
              {solo.phase === 'betting' && (
                mode === 'onchain' ? (
                  solo.sessionActive ? (
                    // Session active → deal next hand
                    <motion.button
                      data-testid="poker-deal"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      onClick={solo.startHand}
                      disabled={solo.isPending || solo.isConfirming}
                      className="px-8 py-3 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: theme.primary, color: theme.contrastText }}
                    >
                      🃏 {t('games.poker.dealCards')}
                    </motion.button>
                  ) : (
                    // No session → start one
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: solo.hasActiveOnChainGame ? 1 : 1.05 }}
                      onClick={solo.startOnChainSession}
                      disabled={!solo.isConnected || !solo.gameAvailable || solo.isPending || solo.isConfirming || solo.hasActiveOnChainGame}
                      className="px-8 py-3 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: theme.primary, color: theme.contrastText }}
                    >
                      {solo.isPending || solo.isConfirming ? t('games.poker.confirming') : t('games.poker.startSession')}
                    </motion.button>
                  )
                ) : (
                  <motion.button
                    data-testid="poker-deal"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={solo.startHand}
                    className="px-8 py-3 rounded-xl font-black shadow-lg transition-all"
                    style={{ background: theme.primary, color: theme.contrastText }}
                  >
                    🃏 {t('games.poker.dealCards')}
                  </motion.button>
                )
              )}

              {solo.phase === 'showdown' && (
                <motion.button
                  data-testid="poker-new-hand"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={solo.newHand}
                  className="px-8 py-3 rounded-xl font-black shadow-lg transition-all"
                  style={{ background: theme.primary, color: theme.contrastText }}
                >
                  {`${t('games.poker.newHand')} →`}
                </motion.button>
              )}
            </div>

            {/* Stats */}
            <GameStats stats={solo.stats} mode={solo.mode} />

            {/* Share on Farcaster after showdown */}
            {solo.phase === 'showdown' && solo.outcome && (
              <FarcasterShare
                gameName="Poker"
                outcome={solo.outcome === 'split' ? 'draw' : solo.outcome}
                stats={getStats('poker') as { played: number; wins: number }}
              />
            )}

            {/* How to play */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <details>
                <summary className="font-bold text-lg cursor-pointer text-gray-900 dark:text-white">
                  {t('games.poker.howToPlay')}
                </summary>
                <ul className="mt-3 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• {t('games.poker.rule1')}</li>
                  <li>• {t('games.poker.rule2')}</li>
                  <li>• {t('games.poker.rule3')}</li>
                  <li>• {t('games.poker.rule4')}</li>
                </ul>
              </details>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-xs text-gray-600 dark:text-gray-400 pt-2 space-y-1"
            >
              <p className="font-semibold">{t('games.poker.footer') || 'Texas Hold\'em with blockchain integration'}</p>
              {isGameAvailableOnChain('poker', chain?.id) && contractAddress ? (
                <p className="text-gray-500 dark:text-gray-500">
                  {t('games.contract')}{' '}
                  <a
                    href={getExplorerAddressUrl(chain?.id, contractAddress)}
                    target="_blank" rel="noopener noreferrer"
                    className="hover:text-chain underline transition-colors"
                  >
                    {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                  </a>
                  {' | '}
                  <a
                    href={getExplorerAddressUrl(chain?.id, contractAddress)}
                    target="_blank" rel="noopener noreferrer"
                    className="hover:text-chain underline transition-colors"
                  >
                    {t('games.tetris.viewOnCeloscan')?.replace('Celoscan', getExplorerName(chain?.id)) || `View on ${getExplorerName(chain?.id)}`}
                  </a>
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">{t('chain.comingSoon')}</p>
              )}
            </motion.div>

          </motion.div>
        )}

        {/* ─── MULTIPLAYER MODE ────────────────────────────────────────── */}
        {mode === 'multiplayer' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {mpIdle && !showJoinCode && (
              <MatchmakingButton
                onFindMatch={mp.findMatch}
                onCreatePrivate={mp.createPrivateRoom}
                onJoinByCode={() => setShowJoinCode(true)}
                isSearching={mp.status === 'searching'}
                onCancel={mp.cancelSearch}
              />
            )}

            {mpIdle && showJoinCode && (
              <RoomCodeInput
                onJoin={async (code) => {
                  setJoinError(null);
                  try { await mp.joinByCode(code); }
                  catch (e) { setJoinError((e as Error).message || 'Failed to join'); }
                }}
                onCancel={() => setShowJoinCode(false)}
                error={joinError}
              />
            )}

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

            {mpPlaying && mp.gameState && (
              <div className="space-y-4">
                <div className={`text-center py-2 rounded-xl text-sm font-semibold border-2 ${
                  mp.isMyTurn
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-400 animate-pulse'
                    : 'bg-white/90 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                }`}>
                  {mp.isMyTurn ? '🎯 Your turn!' : '⏳ Waiting for opponent...'}
                </div>

                <PokerTable
                  phase={mp.gameState.phase as PokerPhase}
                  communityCards={mp.gameState.communityCards as unknown as Card[]}
                  pot={mp.gameState.pot}
                  currentBet={mp.gameState.currentBet}
                  player={{
                    label: 'You',
                    holeCards: mp.myHoleCards,
                    stack: mp.myStack,
                    bet: mp.myBet,
                    status: mp.myStatus as 'active' | 'folded' | 'all_in' | 'allin' | 'out',
                    isDealer: mp.isDealer,
                    showCards: true,
                    isCurrentTurn: mp.isMyTurn,
                  }}
                  dealer={{
                    label: 'Opponent',
                    holeCards: mp.opponentHoleCards,
                    stack: mp.opponentStack,
                    bet: mp.opponentBet,
                    status: mp.opponentStatus as 'active' | 'folded' | 'all_in' | 'allin' | 'out',
                    isDealer: !mp.isDealer,
                    showCards: mp.gameState.phase === 'showdown',
                    handResult: mp.gameState.phase === 'showdown' ? mp.opponentHandResult : undefined,
                  }}
                />

                {mp.isMyTurn && (
                  <PokerActions
                    phase={mp.gameState.phase as PokerPhase}
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

                <div className="flex justify-center">
                  <button
                    onClick={mp.surrender}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors px-4 py-2"
                  >
                    {t('multiplayer.surrender')}
                  </button>
                </div>
              </div>
            )}

            {mpFinished && (
              <GameResult
                winner={mp.players?.find(p => p.player_number === (mp.matchResult === 'win' ? mp.myPlayerNumber : (mp.myPlayerNumber === 1 ? 2 : 1))) || null}
                loser={mp.players?.find(p => p.player_number === (mp.matchResult === 'lose' ? mp.myPlayerNumber : (mp.myPlayerNumber === 1 ? 2 : 1))) || null}
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
    </main>
  );
}
