"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePoker } from "@/hooks/usePoker";
import { usePokerMultiplayer } from "@/hooks/usePokerMultiplayer";
import { useLocalStats } from "@/hooks/useLocalStats";
import { useGameAudio } from "@/lib/audio/AudioContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useChainTheme } from "@/hooks/useChainTheme";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { getContractAddress, getExplorerAddressUrl, getExplorerName, isGameAvailableOnChain } from "@/lib/contracts/addresses";
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
  const { theme } = useChainTheme();
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
          <div className="text-5xl mb-2">🃏</div>
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

            {/* Deal / New Hand buttons */}
            <div className="flex justify-center">
              {solo.phase === 'betting' && (
                mode === 'onchain' ? (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={solo.playOnChain}
                    disabled={!solo.isConnected || !solo.gameAvailable || solo.isPending || solo.isConfirming}
                    className="px-8 py-3 rounded-xl font-black shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: theme.primary, color: theme.contrastText }}
                  >
                    {solo.isPending || solo.isConfirming ? '⏳ Confirming...' : '⛓️ Play On-Chain'}
                  </motion.button>
                ) : (
                  <motion.button
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
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: solo.isRecording ? 1 : 1.05 }}
                  onClick={solo.newHand}
                  disabled={solo.isRecording}
                  className="px-8 py-3 rounded-xl font-black shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: theme.primary, color: theme.contrastText }}
                >
                  {solo.isRecording
                    ? '⏳ Recording on-chain...'
                    : mode === 'onchain' && solo.pendingEnd
                    ? '⛓️ Record & New Hand →'
                    : `${t('games.poker.newHand')} →`}
                </motion.button>
              )}
            </div>

            {/* Stats */}
            <GameStats stats={solo.stats} mode={solo.mode} />

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
                gameId="poker"
                onFindMatch={mp.findMatch}
                onCreatePrivateRoom={mp.createPrivateRoom}
                onJoinByCode={() => setShowJoinCode(true)}
                isSearching={mp.status === 'searching'}
                onCancelSearch={mp.cancelSearch}
              />
            )}

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
    </main>
  );
}
