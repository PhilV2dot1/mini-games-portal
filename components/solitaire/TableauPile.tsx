import React from "react";
import { useDrop } from "react-dnd";
import { Card as CardComponent } from "./Card";
import { Card as CardType, canPlaceOnTableau } from "@/hooks/useSolitaire";
import { cn } from "@/lib/utils";

interface DragItem {
  card: CardType;
  fromTableau?: number;
  fromTableauIndex?: number;
}

interface TableauPileProps {
  column: CardType[];
  columnIndex: number;
  onCardClick: (cardIndex: number) => void;
  onDrop: (item: DragItem, targetColumnIndex: number) => void;
}

export function TableauPile({ column, columnIndex, onCardClick, onDrop }: TableauPileProps) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "CARD",
    drop: (item: DragItem) => {
      onDrop(item, columnIndex);
    },
    canDrop: (item: DragItem) => {
      // Don't allow dropping on the same column at the same position
      if (item.fromTableau === columnIndex) return false;

      return canPlaceOnTableau(item.card, column);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Find the first face-up card index
  const firstFaceUpIndex = column.findIndex(card => card.faceUp);

  return (
    <div
      ref={drop as any}
      className={cn(
        "relative w-24 min-h-48 rounded-lg",
        "transition-all duration-150",
        isOver && canDrop && "bg-green-200 ring-2 ring-green-500",
        isOver && !canDrop && "bg-red-200 ring-2 ring-red-500"
      )}
      style={{ minHeight: "180px" }}
    >
      {column.length === 0 ? (
        <div className="w-24 h-36 rounded-lg border-2 border-dashed border-gray-400 bg-gray-100 flex items-center justify-center">
          <span className="text-5xl font-bold text-gray-300">K</span>
        </div>
      ) : (
        <div className="relative">
          {column.map((card, index) => {
            const isDraggable = card.faceUp && (index >= firstFaceUpIndex);

            return (
              <div
                key={card.id}
                className="absolute"
                style={{
                  top: `${index * 36}px`,
                  zIndex: index,
                }}
              >
                <CardComponent
                  card={card}
                  isDraggable={isDraggable}
                  isTopCard={index >= firstFaceUpIndex}
                  onClick={() => onCardClick(index)}
                  dragData={{
                    card,
                    fromTableau: columnIndex,
                    fromTableauIndex: index,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
