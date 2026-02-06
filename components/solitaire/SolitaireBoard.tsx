import React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { TableauPile } from "./TableauPile";
import { FoundationPile } from "./FoundationPile";
import { StockPile } from "./StockPile";
import { WastePile } from "./WastePile";
import { SolitaireGameState, Suit, Card } from "@/hooks/useSolitaire";

// Detect touch device
const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

interface DragItem {
  card: Card;
  fromTableau?: number;
  fromTableauIndex?: number;
  fromWaste?: boolean;
}

interface SolitaireBoardProps {
  gameState: SolitaireGameState;
  onTableauClick: (columnIndex: number, cardIndex: number) => void;
  onTableauDrop: (item: DragItem, columnIndex: number) => void;
  onFoundationDrop: (item: DragItem, suit: Suit) => void;
  onStockClick: () => void;
  onWasteClick?: () => void;
}

export function SolitaireBoard({
  gameState,
  onTableauClick,
  onTableauDrop,
  onFoundationDrop,
  onStockClick,
  onWasteClick,
}: SolitaireBoardProps) {
  const Backend = isTouchDevice() ? TouchBackend : HTML5Backend;

  return (
    <DndProvider backend={Backend}>
      <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-3" style={{ minHeight: "400px" }}>
        {/* Top row: Stock, Waste, Spacer, Foundations */}
        <div className="flex justify-between items-start">
          {/* Left side: Stock and Waste */}
          <div className="flex gap-1 sm:gap-2">
            <StockPile cards={gameState.stock} onClick={onStockClick} />
            <WastePile cards={gameState.waste} onClick={onWasteClick} />
          </div>

          {/* Right side: 4 Foundation piles */}
          <div className="flex gap-1 sm:gap-2">
            {(["hearts", "diamonds", "clubs", "spades"] as Suit[]).map(suit => (
              <FoundationPile
                key={suit}
                suit={suit}
                cards={gameState.foundations[suit]}
                onDrop={(item) => onFoundationDrop(item, suit)}
              />
            ))}
          </div>
        </div>

        {/* Tableau: 7 columns */}
        <div className="flex gap-1 sm:gap-2 justify-center" style={{ minHeight: "280px" }}>
          {gameState.tableau.map((column, index) => (
            <TableauPile
              key={index}
              column={column}
              columnIndex={index}
              onCardClick={(cardIndex) => onTableauClick(index, cardIndex)}
              onDrop={(item) => onTableauDrop(item, index)}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
}
