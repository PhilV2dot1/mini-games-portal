import React from "react";
import { Card as CardComponent } from "./Card";
import { Card as CardType } from "@/hooks/useSolitaire";

interface WastePileProps {
  cards: CardType[];
  onClick?: () => void;
}

export function WastePile({ cards, onClick }: WastePileProps) {
  const topCard = cards.length > 0 ? cards[0] : null;

  if (!topCard) {
    return (
      <div className="w-11 h-16 sm:w-12 sm:h-[72px] rounded-md border border-dashed border-gray-400 bg-gray-50 flex items-center justify-center">
        <span className="text-[8px] sm:text-[10px] text-gray-400 font-medium text-center px-0.5">Empty</span>
      </div>
    );
  }

  return (
    <div className="w-11 h-16 sm:w-12 sm:h-[72px] relative">
      <CardComponent
        card={topCard}
        isDraggable={true}
        isTopCard={true}
        onClick={onClick}
        dragData={{
          card: topCard,
          fromWaste: true,
        }}
      />
    </div>
  );
}
