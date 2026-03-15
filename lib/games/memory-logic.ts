// ========================================
// MEMORY GAME LOGIC
// ========================================

export interface Card {
  id: number;
  emoji: string; // crypto ticker symbol (e.g. "btc", "eth")
  isFlipped: boolean;
  isMatched: boolean;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface DifficultyConfig {
  pairs: number;
  cols: number;
  label: string;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { pairs: 6, cols: 3, label: "Easy (3×4)" },
  medium: { pairs: 8, cols: 4, label: "Medium (4×4)" },
  hard: { pairs: 10, cols: 5, label: "Hard (5×4)" },
};

// Top 20 cryptocurrencies by market cap (cryptofonts.com tickers)
const EMOJI_POOL = [
  "btc", "eth", "usdt", "bnb", "sol", "xrp", "usdc", "ada",
  "avax", "doge", "trx", "dot", "link", "matic", "shib",
  "ltc", "atom", "xlm", "algo", "celo",
];

/**
 * Generate a shuffled board of card pairs
 */
export function generateBoard(pairs: number): Card[] {
  const emojis = EMOJI_POOL.slice(0, pairs);
  const cards: Card[] = [];

  emojis.forEach((emoji, i) => {
    cards.push({ id: i * 2, emoji, isFlipped: false, isMatched: false });
    cards.push({ id: i * 2 + 1, emoji, isFlipped: false, isMatched: false });
  });

  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  return cards;
}

/**
 * Check if two cards match
 */
export function checkMatch(card1: Card, card2: Card): boolean {
  return card1.emoji === card2.emoji;
}

/**
 * Check if all pairs have been found
 */
export function isBoardComplete(board: Card[]): boolean {
  return board.every((card) => card.isMatched);
}

/**
 * Calculate score based on moves and time
 * Lower moves + lower time = higher score
 */
export function calculateScore(pairs: number, moves: number, timeSeconds: number): number {
  const perfectMoves = pairs; // minimum possible moves
  const moveScore = Math.max(0, 100 - (moves - perfectMoves) * 5);
  const timeScore = Math.max(0, 100 - timeSeconds);
  return Math.round((moveScore + timeScore) / 2);
}
