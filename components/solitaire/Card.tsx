import React from "react";
import { useDrag } from "react-dnd";
import { Card as CardType, isRed, getSuitSymbol } from "@/hooks/useSolitaire";
import { cn } from "@/lib/utils";

interface DragData {
  card: CardType;
  fromWaste?: boolean;
  fromTableau?: number;
  fromTableauIndex?: number;
}

interface CardProps {
  card: CardType;
  isDraggable?: boolean;
  isTopCard?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  dragData?: DragData;
}

export function Card({ card, isDraggable = false, isTopCard = true, onClick, style, dragData }: CardProps) {
  const [{ isDragging }, drag] = useDrag<DragData, unknown, { isDragging: boolean }>({
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
          "w-14 h-20 rounded-md border border-slate-700 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900",
          "flex items-center justify-center cursor-default shadow-sm",
          "relative"
        )}
        style={style}
      >
        <div className="absolute inset-0 rounded-md overflow-hidden">
          <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,0.05)_5px,rgba(255,255,255,0.05)_10px)]" />
        </div>
        <div className="text-xl font-bold text-blue-400 opacity-30 z-10">C</div>
      </div>
    );
  }

  const isRedCard = isRed(card.suit);
  const color = isRedCard ? "text-red-600" : "text-gray-900";
  const bgColor = "bg-white";

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={cn(
        "w-14 h-20 rounded-md border border-gray-300 shadow-sm",
        bgColor,
        "flex flex-col relative",
        "transition-all duration-150",
        isDragging && "opacity-30",
        isDraggable && isTopCard && "cursor-move hover:scale-105 hover:shadow-md hover:z-10",
        !isDraggable && "cursor-default"
      )}
      style={style}
      onClick={onClick}
    >
      {/* Top left corner */}
      <div className={cn("absolute top-0.5 left-1 flex flex-col items-center", color)}>
        <div className="text-xs font-bold leading-none">{card.rank}</div>
        <div className="text-sm leading-none">{getSuitSymbol(card.suit)}</div>
      </div>

      {/* Center symbol */}
      <div className={cn("flex-1 flex items-center justify-center", color)}>
        <div className="text-2xl">{getSuitSymbol(card.suit)}</div>
      </div>

      {/* Bottom right corner (rotated) */}
      <div className={cn("absolute bottom-0.5 right-1 flex flex-col items-center rotate-180", color)}>
        <div className="text-xs font-bold leading-none">{card.rank}</div>
        <div className="text-sm leading-none">{getSuitSymbol(card.suit)}</div>
      </div>
    </div>
  );
}
