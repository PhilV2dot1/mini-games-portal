import { Card } from "@/lib/games/blackjack-cards";

interface CardDisplayProps {
  card: Card | null;
  faceDown?: boolean;
}

export function CardDisplay({ card, faceDown }: CardDisplayProps) {
  if (faceDown || !card) {
    return (
      <div
        className="w-16 h-24 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-700 rounded-lg border-2 border-gray-800 flex items-center justify-center shadow-lg relative overflow-hidden"
        style={{
          boxShadow: "0 0 0 1px rgba(252, 255, 82, 0.2), 0 4px 6px -1px rgba(0, 0, 0, 0.3)"
        }}
      >
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255, 255, 255, 0.1) 2px, rgba(255, 255, 255, 0.1) 4px)`
          }}
        />
        <div className="text-gray-400 text-3xl relative z-10">🂠</div>
      </div>
    );
  }

  const isRed = card.suit === '♥' || card.suit === '♦';

  return (
    <div
      className="w-16 h-24 bg-white rounded-lg border-2 border-gray-300 p-1 flex flex-col items-center justify-between shadow-lg relative"
      style={{
        boxShadow: "0 0 0 0.5px rgba(252, 255, 82, 0.3), 0 4px 6px -1px rgba(0, 0, 0, 0.2)"
      }}
    >
      {/* Inner border for polish */}
      <div className="absolute inset-1 rounded-md border border-gray-100/50 pointer-events-none" />

      <div className={`text-lg font-bold relative z-10 ${isRed ? 'text-red-600' : 'text-black'}`}>
        {card.display}
      </div>
      <div className={`text-3xl relative z-10 ${isRed ? 'text-red-600' : 'text-black'}`}>
        {card.suit}
      </div>
      <div className={`text-lg font-bold relative z-10 ${isRed ? 'text-red-600' : 'text-black'}`}>
        {card.display}
      </div>
    </div>
  );
}
