import React from "react";
import { useDrop } from "react-dnd";
import { Card as CardComponent } from "./Card";
import { Card as CardType, Suit, canPlaceOnFoundation, getSuitSymbol, isRed } from "@/hooks/useSolitaire";
import { cn } from "@/lib/utils";

interface DragItem {
  card: CardType;
}

interface FoundationPileProps {
  suit: Suit;
  cards: CardType[];
  onDrop: (item: DragItem, suit: Suit) => void;
}

export function FoundationPile({ suit, cards, onDrop }: FoundationPileProps) {
  const [{ isOver, canDrop }, drop] = useDrop<DragItem, unknown, { isOver: boolean; canDrop: boolean }>({
    accept: "CARD",
    drop: (item: DragItem) => {
      onDrop(item, suit);
    },
    canDrop: (item: DragItem) => {
      // Check if card suit matches foundation suit
      if (item.card.suit !== suit) return false;

      return canPlaceOnFoundation(item.card, cards);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const topCard = cards[cards.length - 1];
  const isRedSuit = isRed(suit);
  const suitColor = isRedSuit ? "text-red-600" : "text-gray-800";

  return (
    <div
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      className={cn(
        "w-11 h-16 sm:w-12 sm:h-[72px] rounded-md border transition-all duration-150",
        isOver && canDrop && "bg-green-200 ring-2 ring-green-500",
        isOver && !canDrop && "bg-red-200 ring-2 ring-red-500",
        !topCard && "border-dashed border-gray-400 bg-gray-50"
      )}
    >
      {topCard ? (
        <CardComponent card={topCard} isDraggable={false} />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className={cn("text-2xl sm:text-3xl opacity-30", suitColor)}>
            {getSuitSymbol(suit)}
          </span>
        </div>
      )}
    </div>
  );
}
