import { Card } from "@/lib/games/blackjack-cards";
import { PlayingCard } from "@/components/shared/PlayingCard";

interface CardDisplayProps {
  card: Card | null;
  faceDown?: boolean;
}

export function CardDisplay({ card, faceDown }: CardDisplayProps) {
  return (
    <PlayingCard
      suit={card?.suit}
      value={card?.value}
      faceDown={faceDown || !card}
      size="md"
    />
  );
}
