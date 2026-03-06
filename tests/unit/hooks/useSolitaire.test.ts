/**
 * Tests for useSolitaire Hook
 * Comprehensive test suite for Solitaire game logic
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useSolitaire,
  createDeck,
  dealCards,
  canPlaceOnTableau,
  canPlaceOnFoundation,
  checkWinCondition,
  canAutoComplete,
  checkIfBlocked,
  getRankValue,
  isRed,
  isBlack,
  Card,
  SolitaireGameState,
} from '@/hooks/useSolitaire';

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({
    address: undefined,
    isConnected: false,
  })),
  useWriteContract: vi.fn(() => ({
    writeContractAsync: vi.fn(),
  })),
  useReadContract: vi.fn(() => ({
    data: undefined,
    refetch: vi.fn(),
  })),
}));

describe('useSolitaire', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  describe('Utility Functions', () => {
    it('should identify red suits correctly', () => {
      expect(isRed('hearts')).toBe(true);
      expect(isRed('diamonds')).toBe(true);
      expect(isRed('clubs')).toBe(false);
      expect(isRed('spades')).toBe(false);
    });

    it('should identify black suits correctly', () => {
      expect(isBlack('clubs')).toBe(true);
      expect(isBlack('spades')).toBe(true);
      expect(isBlack('hearts')).toBe(false);
      expect(isBlack('diamonds')).toBe(false);
    });

    it('should return correct rank values', () => {
      expect(getRankValue('A')).toBe(1);
      expect(getRankValue('2')).toBe(2);
      expect(getRankValue('10')).toBe(10);
      expect(getRankValue('J')).toBe(11);
      expect(getRankValue('Q')).toBe(12);
      expect(getRankValue('K')).toBe(13);
    });
  });

  // ========================================
  // DECK CREATION
  // ========================================

  describe('Deck Creation', () => {
    it('should create a deck with 52 cards', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should have 13 cards of each suit', () => {
      const deck = createDeck();

      const hearts = deck.filter(card => card.suit === 'hearts');
      const diamonds = deck.filter(card => card.suit === 'diamonds');
      const clubs = deck.filter(card => card.suit === 'clubs');
      const spades = deck.filter(card => card.suit === 'spades');

      expect(hearts).toHaveLength(13);
      expect(diamonds).toHaveLength(13);
      expect(clubs).toHaveLength(13);
      expect(spades).toHaveLength(13);
    });

    it('should have all cards face down initially', () => {
      const deck = createDeck();
      expect(deck.every(card => !card.faceUp)).toBe(true);
    });

    it('should have unique IDs for all cards', () => {
      const deck = createDeck();
      const ids = deck.map(card => card.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(52);
    });
  });

  // ========================================
  // DEAL CARDS
  // ========================================

  describe('Deal Cards', () => {
    it('should create 7 tableau columns', () => {
      const deck = createDeck();
      const gameState = dealCards(deck);

      expect(gameState.tableau).toHaveLength(7);
    });

    it('should deal correct number of cards to each column', () => {
      const deck = createDeck();
      const gameState = dealCards(deck);

      expect(gameState.tableau[0]).toHaveLength(1);
      expect(gameState.tableau[1]).toHaveLength(2);
      expect(gameState.tableau[2]).toHaveLength(3);
      expect(gameState.tableau[3]).toHaveLength(4);
      expect(gameState.tableau[4]).toHaveLength(5);
      expect(gameState.tableau[5]).toHaveLength(6);
      expect(gameState.tableau[6]).toHaveLength(7);
    });

    it('should have only top card face up in each column', () => {
      const deck = createDeck();
      const gameState = dealCards(deck);

      gameState.tableau.forEach((column, index) => {
        column.forEach((card, cardIndex) => {
          if (cardIndex === column.length - 1) {
            expect(card.faceUp).toBe(true);
          } else {
            expect(card.faceUp).toBe(false);
          }
        });
      });
    });

    it('should have 24 cards in stock (52 - 28 tableau)', () => {
      const deck = createDeck();
      const gameState = dealCards(deck);

      expect(gameState.stock).toHaveLength(24);
    });

    it('should have empty waste pile initially', () => {
      const deck = createDeck();
      const gameState = dealCards(deck);

      expect(gameState.waste).toHaveLength(0);
    });

    it('should have empty foundations initially', () => {
      const deck = createDeck();
      const gameState = dealCards(deck);

      expect(gameState.foundations.hearts).toHaveLength(0);
      expect(gameState.foundations.diamonds).toHaveLength(0);
      expect(gameState.foundations.clubs).toHaveLength(0);
      expect(gameState.foundations.spades).toHaveLength(0);
    });

    it('should start with 0 score and 0 moves', () => {
      const deck = createDeck();
      const gameState = dealCards(deck);

      expect(gameState.score).toBe(0);
      expect(gameState.moves).toBe(0);
    });
  });

  // ========================================
  // MOVE VALIDATION - TABLEAU
  // ========================================

  describe('Tableau Move Validation', () => {
    it('should allow King on empty column', () => {
      const king: Card = {
        suit: 'hearts',
        rank: 'K',
        faceUp: true,
        id: 'test-king',
      };

      expect(canPlaceOnTableau(king, [])).toBe(true);
    });

    it('should not allow non-King on empty column', () => {
      const queen: Card = {
        suit: 'hearts',
        rank: 'Q',
        faceUp: true,
        id: 'test-queen',
      };

      expect(canPlaceOnTableau(queen, [])).toBe(false);
    });

    it('should allow opposite color descending rank', () => {
      const redQueen: Card = {
        suit: 'hearts',
        rank: 'Q',
        faceUp: true,
        id: 'test-queen',
      };

      const blackJack: Card = {
        suit: 'spades',
        rank: 'J',
        faceUp: true,
        id: 'test-jack',
      };

      expect(canPlaceOnTableau(blackJack, [redQueen])).toBe(true);
    });

    it('should not allow same color', () => {
      const redQueen: Card = {
        suit: 'hearts',
        rank: 'Q',
        faceUp: true,
        id: 'test-queen',
      };

      const redJack: Card = {
        suit: 'diamonds',
        rank: 'J',
        faceUp: true,
        id: 'test-jack',
      };

      expect(canPlaceOnTableau(redJack, [redQueen])).toBe(false);
    });

    it('should not allow wrong rank order', () => {
      const redQueen: Card = {
        suit: 'hearts',
        rank: 'Q',
        faceUp: true,
        id: 'test-queen',
      };

      const black10: Card = {
        suit: 'spades',
        rank: '10',
        faceUp: true,
        id: 'test-10',
      };

      expect(canPlaceOnTableau(black10, [redQueen])).toBe(false);
    });
  });

  // ========================================
  // MOVE VALIDATION - FOUNDATION
  // ========================================

  describe('Foundation Move Validation', () => {
    it('should allow Ace on empty foundation', () => {
      const ace: Card = {
        suit: 'hearts',
        rank: 'A',
        faceUp: true,
        id: 'test-ace',
      };

      expect(canPlaceOnFoundation(ace, [])).toBe(true);
    });

    it('should not allow non-Ace on empty foundation', () => {
      const two: Card = {
        suit: 'hearts',
        rank: '2',
        faceUp: true,
        id: 'test-2',
      };

      expect(canPlaceOnFoundation(two, [])).toBe(false);
    });

    it('should allow same suit ascending rank', () => {
      const ace: Card = {
        suit: 'hearts',
        rank: 'A',
        faceUp: true,
        id: 'test-ace',
      };

      const two: Card = {
        suit: 'hearts',
        rank: '2',
        faceUp: true,
        id: 'test-2',
      };

      expect(canPlaceOnFoundation(two, [ace])).toBe(true);
    });

    it('should not allow different suit', () => {
      const ace: Card = {
        suit: 'hearts',
        rank: 'A',
        faceUp: true,
        id: 'test-ace',
      };

      const two: Card = {
        suit: 'spades',
        rank: '2',
        faceUp: true,
        id: 'test-2',
      };

      expect(canPlaceOnFoundation(two, [ace])).toBe(false);
    });

    it('should not allow wrong rank order', () => {
      const ace: Card = {
        suit: 'hearts',
        rank: 'A',
        faceUp: true,
        id: 'test-ace',
      };

      const three: Card = {
        suit: 'hearts',
        rank: '3',
        faceUp: true,
        id: 'test-3',
      };

      expect(canPlaceOnFoundation(three, [ace])).toBe(false);
    });
  });

  // ========================================
  // WIN CONDITION
  // ========================================

  describe('Win Condition', () => {
    it('should detect win when all foundations are complete', () => {
      const completeFoundation = Array(13).fill(null).map((_, i) => ({
        suit: 'hearts' as const,
        rank: 'A' as const,
        faceUp: true,
        id: `card-${i}`,
      }));

      const foundations = {
        hearts: completeFoundation,
        diamonds: completeFoundation,
        clubs: completeFoundation,
        spades: completeFoundation,
      };

      expect(checkWinCondition(foundations)).toBe(true);
    });

    it('should not detect win when foundations are incomplete', () => {
      const incompleteFoundation = Array(12).fill(null).map((_, i) => ({
        suit: 'hearts' as const,
        rank: 'A' as const,
        faceUp: true,
        id: `card-${i}`,
      }));

      const foundations = {
        hearts: incompleteFoundation,
        diamonds: [],
        clubs: [],
        spades: [],
      };

      expect(checkWinCondition(foundations)).toBe(false);
    });
  });

  // ========================================
  // AUTO-COMPLETE
  // ========================================

  describe('Auto-Complete', () => {
    it('should allow auto-complete when all tableau cards face up and stock empty', () => {
      const gameState = {
        tableau: [
          [{ suit: 'hearts' as const, rank: 'K' as const, faceUp: true, id: '1' }],
          [{ suit: 'spades' as const, rank: 'Q' as const, faceUp: true, id: '2' }],
          [], [], [], [], []
        ],
        foundations: {
          hearts: [],
          diamonds: [],
          clubs: [],
          spades: [],
        },
        stock: [],
        waste: [],
        moves: 0,
        score: 0,
        startTime: null,
        elapsedTime: 0,
      };

      expect(canAutoComplete(gameState)).toBe(true);
    });

    it('should not allow auto-complete when stock not empty', () => {
      const gameState = {
        tableau: [
          [{ suit: 'hearts' as const, rank: 'K' as const, faceUp: true, id: '1' }],
          [], [], [], [], [], []
        ],
        foundations: {
          hearts: [],
          diamonds: [],
          clubs: [],
          spades: [],
        },
        stock: [{ suit: 'clubs' as const, rank: 'A' as const, faceUp: false, id: '2' }],
        waste: [],
        moves: 0,
        score: 0,
        startTime: null,
        elapsedTime: 0,
      };

      expect(canAutoComplete(gameState)).toBe(false);
    });

    it('should not allow auto-complete when face-down cards exist', () => {
      const gameState = {
        tableau: [
          [
            { suit: 'hearts' as const, rank: 'Q' as const, faceUp: false, id: '1' },
            { suit: 'clubs' as const, rank: 'J' as const, faceUp: true, id: '2' }
          ],
          [], [], [], [], [], []
        ],
        foundations: {
          hearts: [],
          diamonds: [],
          clubs: [],
          spades: [],
        },
        stock: [],
        waste: [],
        moves: 0,
        score: 0,
        startTime: null,
        elapsedTime: 0,
      };

      expect(canAutoComplete(gameState)).toBe(false);
    });
  });

  // ========================================
  // HOOK INTEGRATION
  // ========================================

  describe('Hook Integration', () => {
    it('should initialize with idle status', () => {
      const { result } = renderHook(() => useSolitaire());

      expect(result.current.status).toBe('idle');
    });

    it('should initialize with free mode', () => {
      const { result } = renderHook(() => useSolitaire());

      expect(result.current.mode).toBe('free');
    });

    it('should have initial message', () => {
      const { result } = renderHook(() => useSolitaire());

      expect(result.current.message).toBe('Press Start to begin!');
    });

    it('should start game in free mode', async () => {
      const { result } = renderHook(() => useSolitaire());

      await act(async () => {
        await result.current.startGame();
      });

      expect(result.current.status).toBe('playing');
    });

    it('should initialize game state on start', async () => {
      const { result } = renderHook(() => useSolitaire());

      await act(async () => {
        await result.current.startGame();
      });

      // Check tableau
      expect(result.current.gameState.tableau).toHaveLength(7);

      // Check that cards were dealt
      const totalTableauCards = result.current.gameState.tableau.reduce(
        (sum, col) => sum + col.length,
        0
      );
      expect(totalTableauCards).toBe(28);

      // Check stock
      expect(result.current.gameState.stock).toHaveLength(24);
    });

    it('should reset game correctly', async () => {
      const { result } = renderHook(() => useSolitaire());

      await act(async () => {
        await result.current.startGame();
      });

      await act(async () => {
        result.current.resetGame();
      });

      expect(result.current.status).toBe('idle');
      expect(result.current.gameState.moves).toBe(0);
      expect(result.current.gameState.score).toBe(0);
    });

    it('should not allow undo when no moves made', () => {
      const { result } = renderHook(() => useSolitaire());

      expect(result.current.canUndo).toBe(false);
    });

    it('should switch modes correctly', () => {
      const { result } = renderHook(() => useSolitaire());

      act(() => {
        result.current.switchMode('onchain');
      });

      expect(result.current.mode).toBe('onchain');
    });
  });

  // ========================================
  // BLOCKED GAME DETECTION
  // ========================================

  describe('Blocked Game Detection', () => {
    it('should not be blocked if stock has cards', () => {
      const gameState: SolitaireGameState = {
        tableau: [[], [], [], [], [], [], []],
        foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
        stock: [{ suit: 'hearts', rank: '5', faceUp: false, id: '1' }],
        waste: [],
        moves: 0,
        score: 0,
        startTime: Date.now(),
        elapsedTime: 0,
      };

      expect(checkIfBlocked(gameState)).toBe(false);
    });

    it('should not be blocked if waste card can go to foundation', () => {
      const gameState: SolitaireGameState = {
        tableau: [[], [], [], [], [], [], []],
        foundations: {
          hearts: [],
          diamonds: [],
          clubs: [],
          spades: [],
        },
        stock: [],
        waste: [{ suit: 'hearts', rank: 'A', faceUp: true, id: '1' }],
        moves: 0,
        score: 0,
        startTime: Date.now(),
        elapsedTime: 0,
      };

      expect(checkIfBlocked(gameState)).toBe(false);
    });

    it('should not be blocked if waste card can go to tableau', () => {
      const gameState: SolitaireGameState = {
        tableau: [
          [{ suit: 'hearts', rank: '5', faceUp: true, id: '1' }],
          [],
          [],
          [],
          [],
          [],
          [],
        ],
        foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
        stock: [],
        waste: [{ suit: 'clubs', rank: '4', faceUp: true, id: '2' }],
        moves: 0,
        score: 0,
        startTime: Date.now(),
        elapsedTime: 0,
      };

      expect(checkIfBlocked(gameState)).toBe(false);
    });

    it('should not be blocked if tableau card can go to foundation', () => {
      const gameState: SolitaireGameState = {
        tableau: [
          [{ suit: 'hearts', rank: 'A', faceUp: true, id: '1' }],
          [],
          [],
          [],
          [],
          [],
          [],
        ],
        foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
        stock: [],
        waste: [],
        moves: 0,
        score: 0,
        startTime: Date.now(),
        elapsedTime: 0,
      };

      expect(checkIfBlocked(gameState)).toBe(false);
    });

    it('should not be blocked if tableau cards can move between columns', () => {
      const gameState: SolitaireGameState = {
        tableau: [
          [{ suit: 'hearts', rank: '5', faceUp: true, id: '1' }],
          [{ suit: 'clubs', rank: '4', faceUp: true, id: '2' }],
          [],
          [],
          [],
          [],
          [],
        ],
        foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
        stock: [],
        waste: [],
        moves: 0,
        score: 0,
        startTime: Date.now(),
        elapsedTime: 0,
      };

      expect(checkIfBlocked(gameState)).toBe(false);
    });

    it('should be blocked when no valid moves exist', () => {
      const gameState: SolitaireGameState = {
        tableau: [
          [{ suit: 'hearts', rank: '2', faceUp: true, id: '1' }],
          [{ suit: 'diamonds', rank: '3', faceUp: true, id: '2' }],
          [],
          [],
          [],
          [],
          [],
        ],
        foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
        stock: [],
        waste: [{ suit: 'clubs', rank: '5', faceUp: true, id: '3' }],
        moves: 0,
        score: 0,
        startTime: Date.now(),
        elapsedTime: 0,
      };

      expect(checkIfBlocked(gameState)).toBe(true);
    });

    it('should be blocked with empty stock, waste, and no valid tableau moves', () => {
      const gameState: SolitaireGameState = {
        tableau: [
          [{ suit: 'hearts', rank: '2', faceUp: true, id: '1' }],
          [{ suit: 'diamonds', rank: '2', faceUp: true, id: '2' }],
          [],
          [],
          [],
          [],
          [],
        ],
        foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
        stock: [],
        waste: [],
        moves: 0,
        score: 0,
        startTime: Date.now(),
        elapsedTime: 0,
      };

      expect(checkIfBlocked(gameState)).toBe(true);
    });

    it('should check all tableau columns for possible moves', () => {
      const gameState: SolitaireGameState = {
        tableau: [
          [],
          [],
          [],
          [],
          [],
          [{ suit: 'hearts', rank: '7', faceUp: true, id: '1' }],
          [{ suit: 'clubs', rank: '6', faceUp: true, id: '2' }],
        ],
        foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
        stock: [],
        waste: [],
        moves: 0,
        score: 0,
        startTime: Date.now(),
        elapsedTime: 0,
      };

      expect(checkIfBlocked(gameState)).toBe(false);
    });
  });
});
