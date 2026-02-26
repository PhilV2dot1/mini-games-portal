/**
 * Texas Hold'em Hand Evaluator
 * Evaluates the best 5-card hand from 2 hole + up to 5 community cards.
 */

import { Card, cardRank } from './poker-cards';

export type HandRank =
  | 'royal_flush'
  | 'straight_flush'
  | 'four_of_a_kind'
  | 'full_house'
  | 'flush'
  | 'straight'
  | 'three_of_a_kind'
  | 'two_pair'
  | 'one_pair'
  | 'high_card';

export interface HandResult {
  rank: HandRank;
  score: number;       // Numeric score for comparison (higher = better)
  label: string;       // Human-readable label
  bestCards: Card[];   // Best 5-card hand
}

const HAND_SCORES: Record<HandRank, number> = {
  royal_flush:    9_000_000,
  straight_flush: 8_000_000,
  four_of_a_kind: 7_000_000,
  full_house:     6_000_000,
  flush:          5_000_000,
  straight:       4_000_000,
  three_of_a_kind:3_000_000,
  two_pair:       2_000_000,
  one_pair:       1_000_000,
  high_card:      0,
};

export const HAND_LABELS: Record<HandRank, string> = {
  royal_flush:    'Royal Flush 👑',
  straight_flush: 'Straight Flush',
  four_of_a_kind: 'Four of a Kind',
  full_house:     'Full House',
  flush:          'Flush',
  straight:       'Straight',
  three_of_a_kind:'Three of a Kind',
  two_pair:       'Two Pair',
  one_pair:       'One Pair',
  high_card:      'High Card',
};

/** Get all combinations of k items from array */
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, k - 1).map(combo => [first, ...combo]);
  const withoutFirst = getCombinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function getRanks(cards: Card[]): number[] {
  return cards.map(cardRank).sort((a, b) => b - a);
}

function isFlush(cards: Card[]): boolean {
  return cards.every(c => c.suit === cards[0].suit);
}

function isStraight(ranks: number[]): boolean {
  const sorted = [...ranks].sort((a, b) => b - a);
  // Normal straight
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i] - sorted[i + 1] !== 1) {
      // Check wheel (A-2-3-4-5)
      if (i === 0 && sorted[0] === 14) {
        const wheel = [5, 4, 3, 2, 1];
        return sorted.slice(1).every((r, i) => r === wheel[i]);
      }
      return false;
    }
  }
  return true;
}

function getStraightHighCard(ranks: number[]): number {
  const sorted = [...ranks].sort((a, b) => b - a);
  // Wheel (A-2-3-4-5): high card is 5
  if (sorted[0] === 14 && sorted[1] === 5) return 5;
  return sorted[0];
}

/** Score a 5-card hand */
function scoreHand(cards: Card[]): HandResult {
  const ranks = getRanks(cards);
  const flush = isFlush(cards);
  const straight = isStraight(ranks);
  const highCard = getStraightHighCard(ranks);

  // Group by rank
  const groups: Record<number, Card[]> = {};
  for (const card of cards) {
    const r = cardRank(card);
    if (!groups[r]) groups[r] = [];
    groups[r].push(card);
  }
  const counts = Object.values(groups).sort((a, b) => b.length - a.length || cardRank(b[0]) - cardRank(a[0]));

  // Royal Flush
  if (flush && straight && highCard === 14 && ranks[0] === 14) {
    return { rank: 'royal_flush', score: HAND_SCORES.royal_flush + highCard, label: HAND_LABELS.royal_flush, bestCards: cards };
  }

  // Straight Flush
  if (flush && straight) {
    return { rank: 'straight_flush', score: HAND_SCORES.straight_flush + highCard, label: HAND_LABELS.straight_flush, bestCards: cards };
  }

  // Four of a Kind
  if (counts[0].length === 4) {
    const quad = cardRank(counts[0][0]);
    const kicker = cardRank(counts[1][0]);
    return { rank: 'four_of_a_kind', score: HAND_SCORES.four_of_a_kind + quad * 100 + kicker, label: HAND_LABELS.four_of_a_kind, bestCards: cards };
  }

  // Full House
  if (counts[0].length === 3 && counts[1].length === 2) {
    const trips = cardRank(counts[0][0]);
    const pair = cardRank(counts[1][0]);
    return { rank: 'full_house', score: HAND_SCORES.full_house + trips * 100 + pair, label: HAND_LABELS.full_house, bestCards: cards };
  }

  // Flush
  if (flush) {
    const tieBreak = ranks.reduce((acc, r, i) => acc + r * Math.pow(15, 4 - i), 0);
    return { rank: 'flush', score: HAND_SCORES.flush + tieBreak, label: HAND_LABELS.flush, bestCards: cards };
  }

  // Straight
  if (straight) {
    return { rank: 'straight', score: HAND_SCORES.straight + highCard, label: HAND_LABELS.straight, bestCards: cards };
  }

  // Three of a Kind
  if (counts[0].length === 3) {
    const trips = cardRank(counts[0][0]);
    const kickers = counts.slice(1).map(g => cardRank(g[0]));
    return { rank: 'three_of_a_kind', score: HAND_SCORES.three_of_a_kind + trips * 10000 + kickers[0] * 100 + kickers[1], label: HAND_LABELS.three_of_a_kind, bestCards: cards };
  }

  // Two Pair
  if (counts[0].length === 2 && counts[1].length === 2) {
    const high = cardRank(counts[0][0]);
    const low = cardRank(counts[1][0]);
    const kicker = cardRank(counts[2][0]);
    return { rank: 'two_pair', score: HAND_SCORES.two_pair + high * 10000 + low * 100 + kicker, label: HAND_LABELS.two_pair, bestCards: cards };
  }

  // One Pair
  if (counts[0].length === 2) {
    const pair = cardRank(counts[0][0]);
    const kickers = counts.slice(1).map(g => cardRank(g[0]));
    return { rank: 'one_pair', score: HAND_SCORES.one_pair + pair * 1000000 + kickers[0] * 10000 + kickers[1] * 100 + kickers[2], label: HAND_LABELS.one_pair, bestCards: cards };
  }

  // High Card
  const tieBreak = ranks.reduce((acc, r, i) => acc + r * Math.pow(15, 4 - i), 0);
  return { rank: 'high_card', score: tieBreak, label: HAND_LABELS.high_card, bestCards: cards };
}

/**
 * Evaluate the best possible 5-card hand from hole + community cards.
 * hole: 2 cards, community: 0–5 cards
 */
export function evaluateBestHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const all = [...holeCards, ...communityCards];
  if (all.length < 5) {
    // Not enough cards yet — return placeholder
    const ranks = getRanks(all);
    return { rank: 'high_card', score: 0, label: '—', bestCards: all };
  }

  const combos = getCombinations(all, 5);
  let best: HandResult | null = null;

  for (const combo of combos) {
    const result = scoreHand(combo);
    if (!best || result.score > best.score) {
      best = result;
    }
  }

  return best!;
}

/**
 * Compare two hands. Returns positive if a wins, negative if b wins, 0 for tie.
 */
export function compareHands(a: HandResult, b: HandResult): number {
  return a.score - b.score;
}

/**
 * Determine winners from array of player results.
 * Returns array of winning player indices.
 */
export function determineWinners(results: HandResult[]): number[] {
  const maxScore = Math.max(...results.map(r => r.score));
  return results.reduce<number[]>((winners, r, i) => {
    if (r.score === maxScore) winners.push(i);
    return winners;
  }, []);
}
