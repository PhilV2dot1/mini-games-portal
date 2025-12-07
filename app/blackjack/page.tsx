"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useBlackjack } from "@/hooks/useBlackjack";
import { useLocalStats } from "@/hooks/useLocalStats";
import { BlackjackTable } from "@/components/blackjack/BlackjackTable";
import { GameControls } from "@/components/blackjack/GameControls";
import { GameStats } from "@/components/blackjack/GameStats";
import { GameMessage } from "@/components/blackjack/GameMessage";
import { ModeToggle } from "@/components/shared/ModeToggle";
import { WalletConnect } from "@/components/shared/WalletConnect";

export default function BlackjackPage() {
  const {
    mode,
    gamePhase,
    playerHand,
    dealerHand,
    playerTotal,
    dealerTotal,
    outcome,
    message,
    stats,
    credits,
    isPending,
    showDealerCard,
    isConnected,
    hit,
    stand,
    newGame,
    playOnChain,
    switchMode,
    resetCredits,
  } = useBlackjack();

  const { recordGame } = useLocalStats();

  // Record game to portal stats when finished
  useEffect(() => {
    if (gamePhase === 'finished' && outcome) {
      // Map blackjack outcome to standard game result
      const result = outcome === 'blackjack' || outcome === 'win' ? 'win' : outcome === 'lose' ? 'lose' : 'draw';
      recordGame('blackjack', mode, result);
    }
  }, [gamePhase, outcome, mode, recordGame]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors mb-4"
          >
            ← Back to Portal
          </Link>
          <h1 className="text-4xl sm:text-6xl font-bold text-center text-white mb-2">
            Blackjack on Celo
          </h1>
          <p className="text-center text-gray-300 text-sm sm:text-base">
            Beat the dealer to 21! 🃏
          </p>
        </header>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-6">
          <ModeToggle mode={mode} onModeChange={switchMode} />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Area - Takes 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-4">
            {/* Wallet Connect for on-chain mode */}
            {mode === 'onchain' && !isConnected && (
              <WalletConnect />
            )}

            {/* Game Message */}
            {message && <GameMessage message={message} />}

            {/* Blackjack Table */}
            <BlackjackTable
              playerCards={playerHand}
              dealerCards={dealerHand}
              playerTotal={playerTotal}
              dealerTotal={dealerTotal}
              showDealerCard={showDealerCard}
            />

            {/* Game Controls */}
            <GameControls
              onHit={hit}
              onStand={stand}
              onNewGame={newGame}
              onPlayOnChain={playOnChain}
              gamePhase={gamePhase}
              mode={mode}
              disabled={isPending}
            />
          </div>

          {/* Stats Sidebar */}
          <div className="lg:col-span-1">
            <GameStats
              stats={stats}
              mode={mode}
              credits={credits}
              onResetCredits={resetCredits}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-400 text-sm">
          <p>Contract: 0x6cb9971850767026feBCb4801c0b8a946F28C9Ec</p>
          <p className="mt-1">
            <a
              href="https://celoscan.io/address/0x6cb9971850767026feBCb4801c0b8a946F28C9Ec"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-yellow-400 transition-colors"
            >
              View on Celoscan →
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
