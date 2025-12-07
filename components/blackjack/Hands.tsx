import { Card } from "@/lib/games/blackjack-cards";
import { CardDisplay } from "./CardDisplay";

export function PlayerHand({ cards, total }: { cards: Card[]; total: number }) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="text-center">
      <h3 className="text-gray-900 text-lg font-bold mb-3">Your Hand</h3>
      <div className="flex justify-center gap-2 mb-3">
        {cards.map((card, idx) => (
          <CardDisplay key={idx} card={card} />
        ))}
      </div>
      <div className="text-3xl font-bold text-gray-900 drop-shadow-sm">
        {total}
      </div>
      {total === 21 && cards.length === 2 && (
        <div className="text-yellow-400 text-sm font-semibold mt-1 drop-shadow-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>BLACKJACK!</div>
      )}
      {total > 21 && (
        <div className="text-red-600 text-sm font-semibold mt-1">BUST!</div>
      )}
    </div>
  );
}

export function DealerHand({ cards, total, hideFirstCard }: { cards: Card[]; total: number; hideFirstCard?: boolean }) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="text-center">
      <h3 className="text-gray-900 text-lg font-bold mb-3">Dealer</h3>
      <div className="flex justify-center gap-2 mb-3">
        {cards.map((card, idx) => (
          <CardDisplay
            key={idx}
            card={idx === 0 && hideFirstCard ? null : card}
            faceDown={idx === 0 && hideFirstCard}
          />
        ))}
      </div>
      <div className="text-3xl font-bold text-gray-900 drop-shadow-sm">
        {hideFirstCard ? '?' : total}
      </div>
      {!hideFirstCard && total === 21 && cards.length === 2 && (
        <div className="text-yellow-400 text-sm font-semibold mt-1 drop-shadow-sm" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>BLACKJACK!</div>
      )}
      {!hideFirstCard && total > 21 && (
        <div className="text-red-600 text-sm font-semibold mt-1">BUST!</div>
      )}
    </div>
  );
}
