import React from "react";
import { Card as CardType } from "@/hooks/useSolitaire";
import { cn } from "@/lib/utils";

interface StockPileProps {
  cards: CardType[];
  onClick: () => void;
}

export function StockPile({ cards, onClick }: StockPileProps) {
  const hasCards = cards.length > 0;

  return (
    <div
      className={cn(
        "w-24 h-36 rounded-lg border-2 shadow-md",
        "flex items-center justify-center relative",
        "transition-all duration-150",
        hasCards ? "bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 border-slate-700 cursor-pointer hover:scale-105 hover:shadow-lg"
               : "bg-gray-100 border-dashed border-gray-400 cursor-pointer hover:bg-gray-200"
      )}
      onClick={onClick}
    >
      {hasCards ? (
        <>
          {/* Card back pattern */}
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
          </div>
          <div className="text-5xl font-bold text-blue-400 opacity-30 z-10">C</div>

          {/* Card count */}
          <div className="absolute bottom-1.5 right-1.5 bg-slate-900 text-white text-sm px-2 py-1 rounded font-bold z-10">
            {cards.length}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm text-gray-400 font-medium">Recycle</span>
        </div>
      )}
    </div>
  );
}
