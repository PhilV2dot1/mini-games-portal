import { Card } from "@/lib/games/blackjack-cards";
import { PlayerHand, DealerHand } from "./Hands";

interface BlackjackTableProps {
  playerCards: Card[];
  dealerCards: Card[];
  playerTotal: number;
  dealerTotal: number;
  showDealerCard: boolean;
}

export function BlackjackTable({
  playerCards,
  dealerCards,
  playerTotal,
  dealerTotal,
  showDealerCard
}: BlackjackTableProps) {
  return (
    <div
      className="bg-gradient-to-br from-gray-100 via-gray-50 to-yellow-50/20 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden min-h-[280px] sm:min-h-[320px]"
      style={{
        boxShadow: "0 0 0 3px #FCFF52, 0 10px 15px -3px rgba(0, 0, 0, 0.2)"
      }}
    >
      {/* Glassmorphic overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(252, 255, 82, 0.08) 2%, transparent 0%),
                           radial-gradient(circle at 75px 75px, rgba(252, 255, 82, 0.08) 2%, transparent 0%)`,
          backgroundSize: "100px 100px"
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10">
      {/* Dealer Section */}
      <div className="mb-6 sm:mb-10">
        <DealerHand
          cards={dealerCards}
          total={dealerTotal}
          hideFirstCard={!showDealerCard}
        />
      </div>

      {/* Divider */}
      {playerCards.length > 0 && dealerCards.length > 0 && (
        <div className="border-t-2 border-gray-300/50 my-4 sm:my-6" style={{ boxShadow: '0 1px 0 rgba(252, 255, 82, 0.2)' }}></div>
      )}

      {/* Player Section */}
      <div className="mt-6 sm:mt-10">
        <PlayerHand
          cards={playerCards}
          total={playerTotal}
        />
      </div>
      </div>
    </div>
  );
}
