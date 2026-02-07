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
      <div className="w-14 h-20 rounded-md border border-dashed border-gray-400 bg-gray-50 flex items-center justify-center">
        <span className="text-[10px] text-gray-400 font-medium text-center px-0.5">Empty</span>
      </div>
    );
  }

  return (
    <div className="w-14 h-20 relative">
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
