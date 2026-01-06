import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";

// ============================================================================
// TYPES
// ============================================================================

export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
export type GameMode = "free" | "onchain";
export type GameStatus = "idle" | "playing" | "processing" | "won" | "gameover";

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  id: string;
}

export interface SolitaireGameState {
  tableau: Card[][]; // 7 columns
  foundations: {
    hearts: Card[];
    diamonds: Card[];
    clubs: Card[];
    spades: Card[];
  };
  stock: Card[];
  waste: Card[];
  moves: number;
  score: number;
  startTime: number | null;
  elapsedTime: number; // seconds
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  bestScore: number;
  fastestWinTime: number; // seconds, 0 = no wins yet
  fewestMoves: number; // 0 = no wins yet
}

export interface Move {
  type: "tableau-to-tableau" | "tableau-to-foundation" | "waste-to-tableau" |
        "waste-to-foundation" | "stock-to-waste" | "foundation-to-tableau" | "recycle-stock";
  from: string;
  to: string;
  cards: Card[];
  flipCard?: { pile: string; cardId: string };
  previousScore: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SOLITAIRE_CONTRACT_ADDRESS = "0x552c22fe8e0dbff856d45bcf32ddf6fe1ccb1525" as `0x${string}`;

const SOLITAIRE_CONTRACT_ABI = [
  {
    type: "function",
    name: "startGame",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "endGame",
    inputs: [
      { name: "score", type: "uint256" },
      { name: "moves", type: "uint256" },
      { name: "timeElapsed", type: "uint256" },
      { name: "won", type: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPlayerStats",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      { name: "gamesPlayed", type: "uint256" },
      { name: "gamesWon", type: "uint256" },
      { name: "totalScore", type: "uint256" },
      { name: "bestScore", type: "uint256" },
      { name: "fastestWinTime", type: "uint256" },
      { name: "fewestMoves", type: "uint256" },
    ],
    stateMutability: "view",
  },
] as const;

const SCORING = {
  WASTE_TO_TABLEAU: 5,
  WASTE_TO_FOUNDATION: 10,
  TABLEAU_TO_FOUNDATION: 10,
  FOUNDATION_TO_TABLEAU: -15,
  STOCK_RECYCLE: -20,
};

const DEFAULT_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalScore: 0,
  bestScore: 0,
  fastestWinTime: 0,
  fewestMoves: 0,
};

// ============================================================================
// UTILITIES
// ============================================================================

export function isRed(suit: Suit): boolean {
  return suit === "hearts" || suit === "diamonds";
}

export function isBlack(suit: Suit): boolean {
  return suit === "clubs" || suit === "spades";
}

export function getRankValue(rank: Rank): number {
  const values: Record<Rank, number> = {
    "A": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 11,
    "Q": 12,
    "K": 13,
  };
  return values[rank];
}

export function getSuitSymbol(suit: Suit): string {
  const symbols = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };
  return symbols[suit];
}

export function createDeck(): Card[] {
  const suits: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
  const ranks: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

  const deck: Card[] = [];
  suits.forEach(suit => {
    ranks.forEach(rank => {
      deck.push({
        suit,
        rank,
        faceUp: false,
        id: `${suit}-${rank}-${Date.now()}-${Math.random()}`,
      });
    });
  });

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck: Card[]): SolitaireGameState {
  const tableau: Card[][] = [[], [], [], [], [], [], []];
  let deckIndex = 0;

  // Deal tableau (1, 2, 3, 4, 5, 6, 7 cards)
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[deckIndex] };
      // Only top card is face up
      card.faceUp = row === col;
      tableau[col].push(card);
      deckIndex++;
    }
  }

  // Remaining cards go to stock
  const stock = deck.slice(deckIndex).map(card => ({ ...card, faceUp: false }));

  return {
    tableau,
    foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
    stock,
    waste: [],
    moves: 0,
    score: 0,
    startTime: null,
    elapsedTime: 0,
  };
}

export function canPlaceOnTableau(card: Card, targetColumn: Card[]): boolean {
  if (targetColumn.length === 0) {
    // Empty column: only Kings can be placed
    return card.rank === "K";
  }

  const topCard = targetColumn[targetColumn.length - 1];

  // Must be opposite color
  const oppositeColor = (isRed(card.suit) && isBlack(topCard.suit)) ||
                        (isBlack(card.suit) && isRed(topCard.suit));

  // Must be one rank lower
  const oneLower = getRankValue(card.rank) === getRankValue(topCard.rank) - 1;

  return oppositeColor && oneLower;
}

export function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean {
  if (foundation.length === 0) {
    // Empty foundation: only Aces
    return card.rank === "A";
  }

  const topCard = foundation[foundation.length - 1];

  // Must be same suit
  const sameSuit = card.suit === topCard.suit;

  // Must be one rank higher
  const oneHigher = getRankValue(card.rank) === getRankValue(topCard.rank) + 1;

  return sameSuit && oneHigher;
}

export function checkWinCondition(foundations: SolitaireGameState["foundations"]): boolean {
  // Win when all 4 foundations have 13 cards (complete suit)
  return Object.values(foundations).every(pile => pile.length === 13);
}

export function canAutoComplete(gameState: SolitaireGameState): boolean {
  // Auto-complete is safe when all cards are face-up and stock/waste are empty
  const allTableauFaceUp = gameState.tableau.every(column =>
    column.every(card => card.faceUp)
  );

  const stockWasteEmpty = gameState.stock.length === 0 && gameState.waste.length === 0;

  return allTableauFaceUp && stockWasteEmpty;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function checkIfBlocked(gameState: SolitaireGameState): boolean {
  // If stock has cards, not blocked (can still draw)
  if (gameState.stock.length > 0) return false;

  // Check if waste card can go anywhere
  if (gameState.waste.length > 0) {
    const wasteCard = gameState.waste[0];

    // Can it go to foundation?
    if (canPlaceOnFoundation(wasteCard, gameState.foundations[wasteCard.suit])) {
      return false;
    }

    // Can it go to any tableau column?
    for (let i = 0; i < 7; i++) {
      if (canPlaceOnTableau(wasteCard, gameState.tableau[i])) {
        return false;
      }
    }
  }

  // Check if any tableau card can move to foundation or another tableau
  for (let i = 0; i < 7; i++) {
    const column = gameState.tableau[i];
    if (column.length === 0) continue;

    const topCard = column[column.length - 1];

    // Can top card go to foundation?
    if (topCard.faceUp && canPlaceOnFoundation(topCard, gameState.foundations[topCard.suit])) {
      return false;
    }

    // Can any face-up cards move to another tableau column?
    const firstFaceUpIndex = column.findIndex(card => card.faceUp);
    if (firstFaceUpIndex >= 0) {
      for (let cardIndex = firstFaceUpIndex; cardIndex < column.length; cardIndex++) {
        const card = column[cardIndex];
        for (let j = 0; j < 7; j++) {
          if (i === j) continue;
          if (canPlaceOnTableau(card, gameState.tableau[j])) {
            return false;
          }
        }
      }
    }
  }

  // If stock is empty but waste has cards, we could recycle
  // But if we already checked all waste/tableau moves, recycling won't help
  // So if we get here, game is blocked
  return true;
}

function createInitialState(): SolitaireGameState {
  return {
    tableau: [[], [], [], [], [], [], []],
    foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
    stock: [],
    waste: [],
    moves: 0,
    score: 0,
    startTime: null,
    elapsedTime: 0,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useSolitaire() {
  // State
  const [gameState, setGameState] = useState<SolitaireGameState>(createInitialState());
  const [mode, setMode] = useState<GameMode>("free");
  const [status, setStatus] = useState<GameStatus>("idle");
  const [moveHistory, setMoveHistory] = useState<Move[]>([]);
  const [message, setMessage] = useState("Press Start to begin!");
  const [stats, setStats] = useState<PlayerStats>(DEFAULT_STATS);
  const [gameStartedOnChain, setGameStartedOnChain] = useState(false);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { data: onChainStats, refetch: refetchStats } = useReadContract({
    address: SOLITAIRE_CONTRACT_ADDRESS,
    abi: SOLITAIRE_CONTRACT_ABI,
    functionName: "getPlayerStats",
    args: address ? [address] : undefined,
    query: { enabled: mode === "onchain" && isConnected && !!address },
  });

  // Load stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("solitaire_celo_stats");
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load stats:", e);
      }
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (status === "playing" && gameState.startTime) {
      timerRef.current = setInterval(() => {
        setGameState(state => ({
          ...state,
          elapsedTime: Math.floor((Date.now() - (state.startTime || Date.now())) / 1000)
        }));
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [status, gameState.startTime]);

  // Handle game win
  const handleGameWin = useCallback(async () => {
    setStatus("won");
    setMessage("Congratulations! You won!");

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const finalScore = gameState.score;

    if (mode === "free") {
      // Update local stats
      const newStats: PlayerStats = {
        gamesPlayed: stats.gamesPlayed + 1,
        gamesWon: stats.gamesWon + 1,
        totalScore: stats.totalScore + finalScore,
        bestScore: Math.max(stats.bestScore, finalScore),
        fastestWinTime: stats.fastestWinTime === 0
          ? gameState.elapsedTime
          : Math.min(stats.fastestWinTime, gameState.elapsedTime),
        fewestMoves: stats.fewestMoves === 0
          ? gameState.moves
          : Math.min(stats.fewestMoves, gameState.moves),
      };
      setStats(newStats);
      localStorage.setItem("solitaire_celo_stats", JSON.stringify(newStats));
    } else {
      // Record on-chain
      if (!gameStartedOnChain) return;

      try {
        setStatus("processing");
        setMessage("Recording win on blockchain...");

        await writeContractAsync({
          address: SOLITAIRE_CONTRACT_ADDRESS,
          abi: SOLITAIRE_CONTRACT_ABI,
          functionName: "endGame",
          args: [
            BigInt(finalScore),
            BigInt(gameState.moves),
            BigInt(gameState.elapsedTime),
            true,
          ],
        });

        setGameStartedOnChain(false);
        await refetchStats();
        setMessage("Win recorded on blockchain!");
        setStatus("won");
      } catch (error) {
        console.error("Failed to record win:", error);
        setMessage("Game won but not recorded on-chain");
        setStatus("won");
      }
    }
  }, [mode, gameState, stats, gameStartedOnChain, writeContractAsync, refetchStats]);

  // Handle game loss (blocked)
  const handleGameLoss = useCallback(async () => {
    setStatus("gameover");
    setMessage("Game blocked - No more moves possible!");

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const finalScore = gameState.score;

    if (mode === "free") {
      // Update local stats (game played but not won)
      const newStats: PlayerStats = {
        gamesPlayed: stats.gamesPlayed + 1,
        gamesWon: stats.gamesWon, // No increment
        totalScore: stats.totalScore + finalScore,
        bestScore: Math.max(stats.bestScore, finalScore),
        fastestWinTime: stats.fastestWinTime,
        fewestMoves: stats.fewestMoves,
      };
      setStats(newStats);
      localStorage.setItem("solitaire_celo_stats", JSON.stringify(newStats));
    } else {
      // Record on-chain
      if (!gameStartedOnChain) return;

      try {
        setStatus("processing");
        setMessage("Recording game on blockchain...");

        await writeContractAsync({
          address: SOLITAIRE_CONTRACT_ADDRESS,
          abi: SOLITAIRE_CONTRACT_ABI,
          functionName: "endGame",
          args: [
            BigInt(finalScore),
            BigInt(gameState.moves),
            BigInt(gameState.elapsedTime),
            false, // won = false
          ],
        });

        setGameStartedOnChain(false);
        await refetchStats();
        setMessage("Game recorded on blockchain!");
        setStatus("gameover");
      } catch (error) {
        console.error("Failed to record game:", error);
        setMessage("Game blocked but not recorded on-chain");
        setStatus("gameover");
      }
    }
  }, [mode, gameState, stats, gameStartedOnChain, writeContractAsync, refetchStats]);

  // Check win condition
  useEffect(() => {
    if (status === "playing" && checkWinCondition(gameState.foundations)) {
      handleGameWin();
    }
  }, [gameState.foundations, status, handleGameWin]);

  // Check blocked condition
  useEffect(() => {
    if (status === "playing" && checkIfBlocked(gameState)) {
      handleGameLoss();
    }
  }, [gameState, status, handleGameLoss]);

  // Start game
  const startGame = useCallback(async () => {
    const deck = createDeck();
    const newState = dealCards(deck);
    newState.startTime = Date.now();

    setGameState(newState);
    setMoveHistory([]);
    setMessage("Good luck!");

    if (mode === "onchain") {
      if (!isConnected || !address) {
        setMessage("Please connect wallet first");
        return;
      }

      try {
        setStatus("processing");
        setMessage("Starting game on blockchain...");

        await writeContractAsync({
          address: SOLITAIRE_CONTRACT_ADDRESS,
          abi: SOLITAIRE_CONTRACT_ABI,
          functionName: "startGame",
        });

        setGameStartedOnChain(true);
        setStatus("playing");
        setMessage("Game started!");
      } catch (error) {
        console.error("Failed to start on-chain game:", error);
        setMessage("Failed to start on-chain game");
        setStatus("idle");
      }
    } else {
      setStatus("playing");
    }
  }, [mode, isConnected, address, writeContractAsync]);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(createInitialState());
    setMoveHistory([]);
    setStatus("idle");
    setMessage("Press Start to begin!");
    setGameStartedOnChain(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  // Switch mode
  const switchMode = useCallback((newMode: GameMode) => {
    setMode(newMode);
    resetGame();
  }, [resetGame]);

  // Draw from stock
  const drawFromStock = useCallback(() => {
    if (status !== "playing") return;

    setGameState(state => {
      if (state.stock.length === 0) {
        // Recycle waste back to stock
        if (state.waste.length === 0) return state;

        const move: Move = {
          type: "recycle-stock",
          from: "waste",
          to: "stock",
          cards: [...state.waste],
          previousScore: state.score,
        };

        setMoveHistory(history => [...history, move]);

        return {
          ...state,
          stock: [...state.waste].reverse().map(card => ({ ...card, faceUp: false })),
          waste: [],
          score: state.score + SCORING.STOCK_RECYCLE,
          moves: state.moves + 1,
        };
      }

      // Draw 1 card
      const card = { ...state.stock[0], faceUp: true };

      const move: Move = {
        type: "stock-to-waste",
        from: "stock",
        to: "waste",
        cards: [card],
        previousScore: state.score,
      };

      setMoveHistory(history => [...history, move]);

      return {
        ...state,
        waste: [card, ...state.waste],
        stock: state.stock.slice(1),
        moves: state.moves + 1,
      };
    });
  }, [status]);

  // Move card from waste to tableau
  const moveWasteToTableau = useCallback((targetColumnIndex: number) => {
    if (status !== "playing" || gameState.waste.length === 0) return false;

    const card = gameState.waste[0];
    const targetColumn = gameState.tableau[targetColumnIndex];

    if (!canPlaceOnTableau(card, targetColumn)) return false;

    setGameState(state => {
      const newTableau = [...state.tableau];
      newTableau[targetColumnIndex] = [...newTableau[targetColumnIndex], card];

      const move: Move = {
        type: "waste-to-tableau",
        from: "waste",
        to: `tableau-${targetColumnIndex}`,
        cards: [card],
        previousScore: state.score,
      };

      setMoveHistory(history => [...history, move]);

      return {
        ...state,
        tableau: newTableau,
        waste: state.waste.slice(1),
        score: state.score + SCORING.WASTE_TO_TABLEAU,
        moves: state.moves + 1,
      };
    });

    return true;
  }, [status, gameState]);

  // Move card from waste to foundation
  const moveWasteToFoundation = useCallback((suit: Suit) => {
    if (status !== "playing" || gameState.waste.length === 0) return false;

    const card = gameState.waste[0];
    const foundation = gameState.foundations[suit];

    if (!canPlaceOnFoundation(card, foundation)) return false;

    setGameState(state => {
      const newFoundations = { ...state.foundations };
      newFoundations[suit] = [...newFoundations[suit], card];

      const move: Move = {
        type: "waste-to-foundation",
        from: "waste",
        to: `foundation-${suit}`,
        cards: [card],
        previousScore: state.score,
      };

      setMoveHistory(history => [...history, move]);

      return {
        ...state,
        foundations: newFoundations,
        waste: state.waste.slice(1),
        score: state.score + SCORING.WASTE_TO_FOUNDATION,
        moves: state.moves + 1,
      };
    });

    return true;
  }, [status, gameState]);

  // Move cards from tableau to tableau
  const moveTableauToTableau = useCallback((fromColumnIndex: number, cardIndex: number, toColumnIndex: number) => {
    if (status !== "playing") return false;

    const fromColumn = gameState.tableau[fromColumnIndex];
    const toColumn = gameState.tableau[toColumnIndex];

    if (cardIndex >= fromColumn.length) return false;
    if (!fromColumn[cardIndex].faceUp) return false;

    const cardsToMove = fromColumn.slice(cardIndex);

    if (!canPlaceOnTableau(cardsToMove[0], toColumn)) return false;

    setGameState(state => {
      const newTableau = [...state.tableau];
      const newFromColumn = [...newTableau[fromColumnIndex]].slice(0, cardIndex);
      const newToColumn = [...newTableau[toColumnIndex], ...cardsToMove];

      newTableau[fromColumnIndex] = newFromColumn;
      newTableau[toColumnIndex] = newToColumn;

      // Check if we need to flip a card
      let flipCard: Move["flipCard"] = undefined;
      if (newFromColumn.length > 0) {
        const topCard = newFromColumn[newFromColumn.length - 1];
        if (!topCard.faceUp) {
          topCard.faceUp = true;
          flipCard = {
            pile: `tableau-${fromColumnIndex}`,
            cardId: topCard.id,
          };
        }
      }

      const move: Move = {
        type: "tableau-to-tableau",
        from: `tableau-${fromColumnIndex}`,
        to: `tableau-${toColumnIndex}`,
        cards: cardsToMove,
        flipCard,
        previousScore: state.score,
      };

      setMoveHistory(history => [...history, move]);

      return {
        ...state,
        tableau: newTableau,
        moves: state.moves + 1,
      };
    });

    return true;
  }, [status, gameState]);

  // Move card from tableau to foundation
  const moveTableauToFoundation = useCallback((columnIndex: number, suit: Suit) => {
    if (status !== "playing") return false;

    const column = gameState.tableau[columnIndex];
    if (column.length === 0) return false;

    const card = column[column.length - 1];
    const foundation = gameState.foundations[suit];

    if (!canPlaceOnFoundation(card, foundation)) return false;

    setGameState(state => {
      const newTableau = [...state.tableau];
      const newColumn = [...newTableau[columnIndex]];
      newColumn.pop();
      newTableau[columnIndex] = newColumn;

      const newFoundations = { ...state.foundations };
      newFoundations[suit] = [...newFoundations[suit], card];

      // Check if we need to flip a card
      let flipCard: Move["flipCard"] = undefined;
      if (newColumn.length > 0) {
        const topCard = newColumn[newColumn.length - 1];
        if (!topCard.faceUp) {
          topCard.faceUp = true;
          flipCard = {
            pile: `tableau-${columnIndex}`,
            cardId: topCard.id,
          };
        }
      }

      const move: Move = {
        type: "tableau-to-foundation",
        from: `tableau-${columnIndex}`,
        to: `foundation-${suit}`,
        cards: [card],
        flipCard,
        previousScore: state.score,
      };

      setMoveHistory(history => [...history, move]);

      return {
        ...state,
        tableau: newTableau,
        foundations: newFoundations,
        score: state.score + SCORING.TABLEAU_TO_FOUNDATION,
        moves: state.moves + 1,
      };
    });

    return true;
  }, [status, gameState]);

  // Move card from foundation to tableau
  const moveFoundationToTableau = useCallback((suit: Suit, targetColumnIndex: number) => {
    if (status !== "playing") return false;

    const foundation = gameState.foundations[suit];
    if (foundation.length === 0) return false;

    const card = foundation[foundation.length - 1];
    const targetColumn = gameState.tableau[targetColumnIndex];

    if (!canPlaceOnTableau(card, targetColumn)) return false;

    setGameState(state => {
      const newFoundations = { ...state.foundations };
      newFoundations[suit] = [...newFoundations[suit]];
      newFoundations[suit].pop();

      const newTableau = [...state.tableau];
      newTableau[targetColumnIndex] = [...newTableau[targetColumnIndex], card];

      const move: Move = {
        type: "foundation-to-tableau",
        from: `foundation-${suit}`,
        to: `tableau-${targetColumnIndex}`,
        cards: [card],
        previousScore: state.score,
      };

      setMoveHistory(history => [...history, move]);

      return {
        ...state,
        foundations: newFoundations,
        tableau: newTableau,
        score: state.score + SCORING.FOUNDATION_TO_TABLEAU,
        moves: state.moves + 1,
      };
    });

    return true;
  }, [status, gameState]);

  // Undo last move
  const undoMove = useCallback(() => {
    if (moveHistory.length === 0 || status !== "playing") return;

    const lastMove = moveHistory[moveHistory.length - 1];

    setGameState(state => {
      let newState = { ...state };

      // Reverse the card flip if one occurred
      if (lastMove.flipCard) {
        const [pileType, indexStr] = lastMove.flipCard.pile.split("-");
        if (pileType === "tableau") {
          const index = parseInt(indexStr);
          const column = [...newState.tableau[index]];
          const cardIndex = column.findIndex(c => c.id === lastMove.flipCard!.cardId);
          if (cardIndex >= 0) {
            column[cardIndex] = { ...column[cardIndex], faceUp: false };
            const newTableau = [...newState.tableau];
            newTableau[index] = column;
            newState.tableau = newTableau;
          }
        }
      }

      // Reverse the move
      switch (lastMove.type) {
        case "stock-to-waste":
          newState.stock = [lastMove.cards[0], ...newState.stock];
          newState.waste = newState.waste.slice(1);
          break;

        case "recycle-stock":
          newState.waste = [...lastMove.cards];
          newState.stock = [];
          break;

        case "waste-to-tableau": {
          const toIndex = parseInt(lastMove.to.split("-")[1]);
          const newTableau = [...newState.tableau];
          newTableau[toIndex] = newTableau[toIndex].slice(0, -1);
          newState.tableau = newTableau;
          newState.waste = [lastMove.cards[0], ...newState.waste];
          break;
        }

        case "waste-to-foundation": {
          const suit = lastMove.to.split("-")[1] as Suit;
          const newFoundations = { ...newState.foundations };
          newFoundations[suit] = newFoundations[suit].slice(0, -1);
          newState.foundations = newFoundations;
          newState.waste = [lastMove.cards[0], ...newState.waste];
          break;
        }

        case "tableau-to-tableau": {
          const fromIndex = parseInt(lastMove.from.split("-")[1]);
          const toIndex = parseInt(lastMove.to.split("-")[1]);
          const newTableau = [...newState.tableau];
          newTableau[toIndex] = newTableau[toIndex].slice(0, -lastMove.cards.length);
          newTableau[fromIndex] = [...newTableau[fromIndex], ...lastMove.cards];
          newState.tableau = newTableau;
          break;
        }

        case "tableau-to-foundation": {
          const fromIndex = parseInt(lastMove.from.split("-")[1]);
          const suit = lastMove.to.split("-")[1] as Suit;
          const newTableau = [...newState.tableau];
          newTableau[fromIndex] = [...newTableau[fromIndex], lastMove.cards[0]];
          newState.tableau = newTableau;
          const newFoundations = { ...newState.foundations };
          newFoundations[suit] = newFoundations[suit].slice(0, -1);
          newState.foundations = newFoundations;
          break;
        }

        case "foundation-to-tableau": {
          const suit = lastMove.from.split("-")[1] as Suit;
          const toIndex = parseInt(lastMove.to.split("-")[1]);
          const newFoundations = { ...newState.foundations };
          newFoundations[suit] = [...newFoundations[suit], lastMove.cards[0]];
          newState.foundations = newFoundations;
          const newTableau = [...newState.tableau];
          newTableau[toIndex] = newTableau[toIndex].slice(0, -1);
          newState.tableau = newTableau;
          break;
        }
      }

      return {
        ...newState,
        score: lastMove.previousScore,
        moves: newState.moves - 1,
      };
    });

    setMoveHistory(history => history.slice(0, -1));
  }, [moveHistory, status]);

  // Auto-complete
  const autoComplete = useCallback(() => {
    if (!canAutoComplete(gameState)) {
      setMessage("Cannot auto-complete yet! Ensure all tableau cards are face-up and stock is empty.");
      return;
    }

    setMessage("Auto-completing...");

    const performAutoComplete = () => {
      setGameState(state => {
        let newState = { ...state };
        let moveMade = true;

        while (moveMade) {
          moveMade = false;

          // Try to move from waste
          if (newState.waste.length > 0) {
            const card = newState.waste[0];
            const foundation = newState.foundations[card.suit];
            if (canPlaceOnFoundation(card, foundation)) {
              const newFoundations = { ...newState.foundations };
              newFoundations[card.suit] = [...newFoundations[card.suit], card];
              newState = {
                ...newState,
                foundations: newFoundations,
                waste: newState.waste.slice(1),
                score: newState.score + SCORING.WASTE_TO_FOUNDATION,
                moves: newState.moves + 1,
              };
              moveMade = true;
              continue;
            }
          }

          // Try to move from tableau
          for (let i = 0; i < 7; i++) {
            const column = newState.tableau[i];
            if (column.length === 0) continue;

            const card = column[column.length - 1];
            const foundation = newState.foundations[card.suit];

            if (canPlaceOnFoundation(card, foundation)) {
              const newTableau = [...newState.tableau];
              newTableau[i] = newTableau[i].slice(0, -1);
              const newFoundations = { ...newState.foundations };
              newFoundations[card.suit] = [...newFoundations[card.suit], card];

              newState = {
                ...newState,
                tableau: newTableau,
                foundations: newFoundations,
                score: newState.score + SCORING.TABLEAU_TO_FOUNDATION,
                moves: newState.moves + 1,
              };
              moveMade = true;
              break;
            }
          }
        }

        return newState;
      });
    };

    performAutoComplete();
  }, [gameState]);

  return {
    // State
    gameState,
    mode,
    status,
    message,
    stats: mode === "onchain" && onChainStats ? {
      gamesPlayed: Number(onChainStats[0]),
      gamesWon: Number(onChainStats[1]),
      totalScore: Number(onChainStats[2]),
      bestScore: Number(onChainStats[3]),
      fastestWinTime: Number(onChainStats[4]),
      fewestMoves: Number(onChainStats[5]),
    } : stats,
    isConnected,
    canUndo: moveHistory.length > 0 && status === "playing",
    canAutoComplete: canAutoComplete(gameState) && status === "playing",

    // Functions
    startGame,
    resetGame,
    switchMode,
    drawFromStock,
    moveWasteToTableau,
    moveWasteToFoundation,
    moveTableauToTableau,
    moveTableauToFoundation,
    moveFoundationToTableau,
    undoMove,
    autoComplete,
  };
}
