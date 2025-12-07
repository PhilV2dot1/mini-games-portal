"use client";

import { GameHistory as GameHistoryType } from "@/lib/games/mastermind-logic";
import { GuessRow } from "./GuessRow";

interface GameHistoryProps {
  history: GameHistoryType[];
  maxAttempts: number;
}

export function GameHistory({ history, maxAttempts }: GameHistoryProps) {
  const emptyRows = maxAttempts - history.length;

  return (
    <div className="space-y-1 sm:space-y-2 max-h-[400px] overflow-y-auto bg-white/60 backdrop-blur-sm rounded-lg p-1.5 sm:p-3">
      {history.map((entry, i) => (
        <GuessRow
          key={i}
          guess={entry.guess}
          feedback={entry.feedback}
        />
      ))}
      {Array.from({ length: emptyRows }).map((_, i) => (
        <div key={`empty-${i}`} className="h-10 sm:h-14 bg-white/40 rounded-lg border border-gray-200" />
      ))}
    </div>
  );
}
