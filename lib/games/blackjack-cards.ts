export interface Card {
  value: number;    // 1-13 (Ace=1, Jack=11, Queen=12, King=13)
  suit: '♠' | '♥' | '♦' | '♣';
  display: string;  // 'A', '2'-'10', 'J', 'Q', 'K'
}

export type Outcome = 'win' | 'lose' | 'push' | 'blackjack';

export function createShuffledDeck(): Card[] {
  const suits: Card['suit'][] = ['♠', '♥', '♦', '♣'];
  const displays = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const deck: Card[] = [];
  for (const suit of suits) {
    for (let value = 1; value <= 13; value++) {
      deck.push({
        value,
        suit,
        display: displays[value - 1]
      });
    }
  }

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function convertToCard(value: number): Card {
  const suits: Card['suit'][] = ['♠', '♥', '♦', '♣'];
  const displays = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  const cardValue = ((value - 1) % 13) + 1;
  const suitIndex = Math.floor((value - 1) / 13) % 4;

  return {
    value: cardValue,
    suit: suits[suitIndex],
    display: displays[cardValue - 1]
  };
}

export function determineWinner(
  playerTotal: number,
  dealerTotal: number,
  isTwoCards: boolean
): Outcome {
  if (playerTotal > 21) return 'lose';

  if (playerTotal === 21 && isTwoCards) {
    return dealerTotal === 21 ? 'push' : 'blackjack';
  }

  if (dealerTotal > 21) return 'win';
  if (playerTotal > dealerTotal) return 'win';
  if (playerTotal < dealerTotal) return 'lose';
  return 'push';
}
