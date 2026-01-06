import React from "react";
import { useDrag } from "react-dnd";
import { Card as CardType, Suit, getRankValue, isRed, getSuitSymbol } from "@/hooks/useSolitaire";
import { cn } from "@/lib/utils";

interface CardProps {
  card: CardType;
  isDraggable?: boolean;
  isTopCard?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  dragData?: any;
}

export function Card({ card, isDraggable = false, isTopCard = true, onClick, style, dragData }: CardProps) {
  const [{ isDragging }, drag] = useDrag({
    type: "CARD",
    item: () => dragData || { card },
    canDrag: isDraggable && card.faceUp && isTopCard,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  if (!card.faceUp) {
    return (
      <div
        className={cn(
          "w-24 h-36 rounded-lg border-2 border-slate-700 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900",
          "flex items-center justify-center cursor-default shadow-md",
          "relative"
        )}
        style={style}
      >
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.05)_10px,rgba(255,255,255,0.05)_20px)]" />
        </div>
        <div className="text-5xl font-bold text-blue-400 opacity-30 z-10">C</div>
      </div>
    );
  }

  const isRedCard = isRed(card.suit);
  const color = isRedCard ? "text-red-600" : "text-gray-900";
  const bgColor = "bg-white";

  return (
    <div
      ref={drag as any}
      className={cn(
        "w-24 h-36 rounded-lg border-2 border-gray-300 shadow-md",
        bgColor,
        "flex flex-col relative",
        "transition-all duration-150",
        isDragging && "opacity-30",
        isDraggable && isTopCard && "cursor-move hover:scale-105 hover:shadow-lg hover:z-10",
        !isDraggable && "cursor-default"
      )}
      style={style}
      onClick={onClick}
    >
      {/* Top left corner */}
      <div className={cn("absolute top-1.5 left-2 flex flex-col items-center", color)}>
        <div className="text-lg font-bold leading-none">{card.rank}</div>
        <div className="text-xl leading-none">{getSuitSymbol(card.suit)}</div>
      </div>

      {/* Center symbol */}
      <div className={cn("flex-1 flex items-center justify-center", color)}>
        <div className="text-5xl">{getSuitSymbol(card.suit)}</div>
      </div>

      {/* Bottom right corner (rotated) */}
      <div className={cn("absolute bottom-1.5 right-2 flex flex-col items-center rotate-180", color)}>
        <div className="text-lg font-bold leading-none">{card.rank}</div>
        <div className="text-xl leading-none">{getSuitSymbol(card.suit)}</div>
      </div>
    </div>
  );
}
