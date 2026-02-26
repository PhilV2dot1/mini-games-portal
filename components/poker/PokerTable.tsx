"use client";

import { PokerCard } from "./PokerCard";
import { Card } from "@/lib/games/poker-cards";
import { HandResult } from "@/lib/games/poker-evaluator";
import { PokerPhase } from "@/hooks/usePoker";

interface PlayerSeat {
  label: string;
  holeCards: Card[];
  stack: number;
  bet: number;
  status: 'active' | 'folded' | 'all_in';
  isDealer: boolean;
  showCards: boolean;
  handResult?: HandResult | null;
  isCurrentTurn?: boolean;
}

interface PokerTableProps {
  phase: PokerPhase;
  communityCards: Card[];
  pot: number;
  currentBet: number;
  player: PlayerSeat;
  dealer: PlayerSeat;
}

export function PokerTable({ phase, communityCards, pot, currentBet, player, dealer }: PokerTableProps) {
  const showCommunity = phase !== 'betting' && phase !== 'preflop';
  const communityCount = phase === 'flop' ? 3 : phase === 'turn' ? 4 : phase === 'river' || phase === 'showdown' ? 5 : 0;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xl"
      style={{ background: 'radial-gradient(ellipse at center, #166534 0%, #14532d 60%, #0f3b22 100%)' }}>

      {/* Felt texture border */}
      <div className="absolute inset-0 rounded-2xl border-4 border-yellow-800/40 pointer-events-none" />

      <div className="p-4 space-y-3">
        {/* Dealer / Opponent */}
        <SeatRow seat={dealer} align="top" />

        {/* Community cards + pot */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <PokerCard
                key={i}
                card={i < communityCount ? communityCards[i] : undefined}
                size="md"
                faceDown={false}
              />
            ))}
          </div>

          {/* Pot */}
          {pot > 0 && (
            <div className="flex items-center gap-2 bg-black/30 rounded-full px-4 py-1">
              <span className="text-yellow-300 text-xs font-semibold">🏆 Pot:</span>
              <span className="text-white font-bold text-sm">{pot}</span>
              {currentBet > 0 && (
                <span className="text-gray-300 text-xs">• Bet: {currentBet}</span>
              )}
            </div>
          )}

          {/* Phase label */}
          <div className="text-xs text-gray-300 uppercase tracking-widest font-semibold">
            {phase === 'betting' ? 'Place your bet' :
             phase === 'preflop' ? 'Pre-Flop' :
             phase === 'flop' ? 'The Flop' :
             phase === 'turn' ? 'The Turn' :
             phase === 'river' ? 'The River' :
             phase === 'showdown' ? 'Showdown' : ''}
          </div>
        </div>

        {/* Player */}
        <SeatRow seat={player} align="bottom" />
      </div>
    </div>
  );
}

function SeatRow({ seat, align }: { seat: PlayerSeat; align: 'top' | 'bottom' }) {
  const isTop = align === 'top';

  return (
    <div className={`flex items-center justify-between gap-3 ${isTop ? '' : ''}`}>
      {/* Cards */}
      <div className="flex gap-1.5">
        {Array.from({ length: 2 }).map((_, i) => (
          <PokerCard
            key={i}
            card={seat.holeCards[i]}
            faceDown={!seat.showCards}
            size="md"
          />
        ))}
      </div>

      {/* Player info */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-semibold text-sm">{seat.label}</span>
          {seat.isDealer && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-1.5 py-0.5 rounded-full">D</span>
          )}
          {seat.isCurrentTurn && (
            <span className="bg-green-400 text-green-900 text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse">●</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-300 text-xs font-medium">💰 {seat.stack}</span>
          {seat.bet > 0 && (
            <span className="text-orange-300 text-xs">Bet: {seat.bet}</span>
          )}
        </div>
        {seat.status === 'folded' && (
          <span className="text-red-400 text-xs font-semibold">FOLDED</span>
        )}
        {seat.status === 'all_in' && (
          <span className="text-orange-400 text-xs font-semibold animate-pulse">ALL IN</span>
        )}
        {seat.handResult && seat.showCards && (
          <span className="text-yellow-200 text-xs font-semibold bg-black/30 px-2 py-0.5 rounded-full">
            {seat.handResult.label}
          </span>
        )}
      </div>
    </div>
  );
}
