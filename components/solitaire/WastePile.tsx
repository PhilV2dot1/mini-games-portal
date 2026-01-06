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
      <div className="w-24 h-36 rounded-lg border-2 border-dashed border-gray-400 bg-gray-50 flex items-center justify-center">
        <span className="text-sm text-gray-400 font-medium text-center px-1">Empty</span>
      </div>
    );
  }

  return (
    <div className="w-24 h-36 relative">
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
