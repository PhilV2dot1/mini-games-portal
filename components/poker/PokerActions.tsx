"use client";

import { useState } from "react";
import { PokerPhase } from "@/hooks/usePoker";

interface PokerActionsProps {
  phase: PokerPhase;
  currentBet: number;
  playerBet: number;
  playerStack: number;
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onBet: (amount: number) => void;
  disabled?: boolean;
}

export function PokerActions({
  phase, currentBet, playerBet, playerStack,
  betAmount, onBetAmountChange,
  onFold, onCheck, onCall, onBet, disabled = false,
}: PokerActionsProps) {
  const toCall = Math.max(0, currentBet - playerBet);
  const canCheck = toCall === 0;
  const canCall = toCall > 0 && toCall <= playerStack;
  const canBet = playerStack > 0;
  const minBet = Math.max(currentBet * 2, 100);
  const maxBet = playerStack;

  const isActive = phase !== 'betting' && phase !== 'showdown' && phase !== 'finished';

  if (!isActive) return null;

  return (
    <div className="space-y-3">
      {/* Bet slider */}
      {canBet && (
        <div className="bg-white/5 dark:bg-gray-800/50 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Bet amount</span>
            <span className="font-bold text-white">{betAmount}</span>
          </div>
          <input
            type="range"
            min={minBet}
            max={maxBet}
            step={50}
            value={Math.min(Math.max(betAmount, minBet), maxBet)}
            onChange={(e) => onBetAmountChange(Number(e.target.value))}
            className="w-full accent-yellow-400"
            disabled={disabled}
          />
          {/* Quick bet buttons */}
          <div className="flex gap-2 justify-center">
            {[
              { label: '½ Pot', value: Math.floor(playerStack * 0.25) },
              { label: 'Pot', value: Math.floor(playerStack * 0.5) },
              { label: '2× Pot', value: Math.floor(playerStack * 0.75) },
            ].map(({ label, value }) => (
              <button
                key={label}
                onClick={() => onBetAmountChange(Math.max(minBet, Math.min(value, maxBet)))}
                className="flex-1 py-1 text-xs rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
                disabled={disabled}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {/* Fold */}
        <button
          onClick={onFold}
          disabled={disabled}
          className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-all disabled:opacity-50"
        >
          Fold
        </button>

        {/* Check or Call */}
        {canCheck ? (
          <button
            onClick={onCheck}
            disabled={disabled}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all disabled:opacity-50"
          >
            Check
          </button>
        ) : (
          <button
            onClick={onCall}
            disabled={disabled || !canCall}
            className="flex-1 py-3 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all disabled:opacity-50"
          >
            Call {toCall}
          </button>
        )}

        {/* Bet / Raise */}
        <button
          onClick={() => onBet(betAmount)}
          disabled={disabled || !canBet}
          className="flex-1 py-3 rounded-xl font-bold text-sm bg-yellow-500 hover:bg-yellow-600 active:scale-95 text-gray-900 transition-all disabled:opacity-50"
        >
          {currentBet > 0 ? `Raise ${betAmount}` : `Bet ${betAmount}`}
        </button>

        {/* All-In */}
        <button
          onClick={() => onBet(playerStack)}
          disabled={disabled || playerStack <= 0}
          className="flex-1 py-3 rounded-xl font-bold text-sm bg-orange-500 hover:bg-orange-600 active:scale-95 text-white transition-all disabled:opacity-50"
        >
          All-In
        </button>
      </div>
    </div>
  );
}
