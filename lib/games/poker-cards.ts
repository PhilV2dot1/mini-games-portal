/**
 * Poker Card Utilities — Texas Hold'em
 * Shared between free play, onchain, and multiplayer modes.
 */

export interface Card {
  value: number;   // 1=Ace, 2-10, 11=Jack, 12=Queen, 13=King
  suit: '♠' | '♥' | '♦' | '♣';
  display: string; // 'A', '2'-'10', 'J', 'Q', 'K'
  faceUp?: boolean;
}

export const SUITS: Card['suit'][] = ['♠', '♥', '♦', '♣'];
export const DISPLAYS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function createShuffledDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let value = 1; value <= 13; value++) {
      deck.push({ value, suit, display: DISPLAYS[value - 1], faceUp: true });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Decode a uint8 card value (same encoding as Blackjack contracts) */
export function convertToCard(value: number): Card {
  const cardValue = ((value - 1) % 13) + 1;
  const suitIndex = Math.floor((value - 1) / 13) % 4;
  return {
    value: cardValue,
    suit: SUITS[suitIndex],
    display: DISPLAYS[cardValue - 1],
    faceUp: true,
  };
}

/** Encode a card back to uint8 */
export function encodeCard(card: Card): number {
  const suitIndex = SUITS.indexOf(card.suit);
  return suitIndex * 13 + card.value;
}

/** Card numeric value for comparison (Ace = 14 high) */
export function cardRank(card: Card): number {
  return card.value === 1 ? 14 : card.value;
}

/** Face card check */
export function isFaceCard(card: Card): boolean {
  return card.value > 10;
}

/** Suit color */
export function isRedSuit(suit: Card['suit']): boolean {
  return suit === '♥' || suit === '♦';
}
