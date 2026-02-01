/**
 * Multiplayer Infrastructure Types
 * Types for real-time multiplayer games
 */

// ============================================
// ROOM TYPES
// ============================================

export type RoomMode = '1v1-ranked' | '1v1-casual' | 'collaborative';
export type RoomStatus = 'waiting' | 'playing' | 'finished' | 'cancelled';
export type ActionType = 'move' | 'chat' | 'ready' | 'surrender' | 'offer_draw' | 'accept_draw' | 'decline_draw' | 'timeout';

export interface MultiplayerRoom {
  id: string;
  game_id: string;
  mode: RoomMode;
  status: RoomStatus;
  max_players: number;
  current_players: number;
  room_code: string | null;
  created_by: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  winner_id: string | null;
  game_state: Record<string, unknown>;
}

export interface RoomPlayer {
  room_id: string;
  user_id: string;
  player_number: number;
  joined_at: string;
  ready: boolean;
  disconnected: boolean;
  disconnected_at: string | null;
  // Joined from users table
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface GameAction {
  id: string;
  room_id: string;
  user_id: string | null;
  action_type: ActionType;
  action_data: Record<string, unknown>;
  created_at: string;
}

export interface MultiplayerStats {
  user_id: string;
  game_id: string;
  mode: '1v1-ranked' | '1v1-casual';
  wins: number;
  losses: number;
  draws: number;
  elo_rating: number;
  highest_elo: number;
  lowest_elo: number;
  total_games: number;
  win_streak: number;
  best_win_streak: number;
  loss_streak: number;
  worst_loss_streak: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// CALLBACK TYPES
// ============================================

export interface RoomCallbacks {
  onPlayerJoin: (player: RoomPlayer) => void;
  onPlayerLeave: (playerId: string) => void;
  onPlayerReady: (playerId: string, ready: boolean) => void;
  onGameStart: () => void;
  onGameStateUpdate: (state: Record<string, unknown>) => void;
  onAction: (action: GameAction) => void;
  onGameEnd: (winnerId: string | null, reason: 'win' | 'draw' | 'surrender' | 'timeout') => void;
  onError?: (error: Error) => void;
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface CreateRoomRequest {
  gameId: string;
  mode: RoomMode;
  isPrivate?: boolean;
}

export interface CreateRoomResponse {
  room: MultiplayerRoom;
  roomCode?: string;
}

export interface JoinRoomRequest {
  roomId?: string;
  roomCode?: string;
}

export interface JoinRoomResponse {
  room: MultiplayerRoom;
  players: RoomPlayer[];
  playerNumber: number;
}

export interface SendActionRequest {
  roomId: string;
  actionType: ActionType;
  actionData: Record<string, unknown>;
}

export interface FindMatchRequest {
  gameId: string;
  mode: 'ranked' | 'casual';
}

export interface FindMatchResponse {
  room: MultiplayerRoom;
  isNewRoom: boolean;
}

// ============================================
// GAME STATE TYPES (Per-Game)
// ============================================

export interface TicTacToeState {
  board: (0 | 1 | 2)[]; // 9 cells: 0=empty, 1=X, 2=O
  currentTurn: 1 | 2; // Player number
  winner?: 0 | 1 | 2; // 0=draw, 1=player1 wins, 2=player2 wins, undefined=ongoing
  winningLine?: number[]; // Indices of winning cells
  moveCount?: number;
}

export interface RPSState {
  round: number;
  maxRounds: number;
  player1Choice: 'rock' | 'paper' | 'scissors' | null;
  player2Choice: 'rock' | 'paper' | 'scissors' | null;
  revealed: boolean;
  scores: [number, number]; // [player1, player2]
  winner: 1 | 2 | 'draw' | null;
}

export interface ConnectFiveState {
  board: (1 | 2 | null)[][]; // 6x7 grid (Connect 4 style), 1 or 2 for player, null for empty
  currentTurn: 1 | 2;
  lastMove: { row: number; col: number } | null;
  winner: 1 | 2 | 'draw' | null;
  winningCells?: { row: number; col: number }[];
}

export interface YahtzeeScoreCard {
  ones: number | null;
  twos: number | null;
  threes: number | null;
  fours: number | null;
  fives: number | null;
  sixes: number | null;
  threeOfKind: number | null;
  fourOfKind: number | null;
  fullHouse: number | null;
  smallStraight: number | null;
  largeStraight: number | null;
  yahtzee: number | null;
  chance: number | null;
}

export interface YahtzeeState {
  currentTurn: 1 | 2; // Which player is currently playing
  turnNumber: number; // 1-13 for each player
  dice: number[]; // 5 dice values
  heldDice: boolean[]; // Which dice are held
  rollsRemaining: number; // 0-3
  player1ScoreCard: YahtzeeScoreCard;
  player2ScoreCard: YahtzeeScoreCard;
  player1FinalScore: number | null;
  player2FinalScore: number | null;
  winner: 1 | 2 | 'draw' | null;
  phase: 'rolling' | 'scoring' | 'finished'; // Current phase of the turn
}

export interface BlackjackState {
  phase: 'waiting' | 'playing' | 'standing' | 'finished';
  currentTurn: 1 | 2;
  deck: number[]; // Shared deck (card indices)
  deckIndex: number; // Next card to deal
  player1Hand: number[]; // Card values
  player2Hand: number[];
  dealerHand: number[];
  player1Total: number;
  player2Total: number;
  dealerTotal: number;
  player1Status: 'playing' | 'standing' | 'bust' | 'blackjack';
  player2Status: 'playing' | 'standing' | 'bust' | 'blackjack';
  showDealerCards: boolean;
  player1Result: 'win' | 'lose' | 'push' | 'blackjack' | null;
  player2Result: 'win' | 'lose' | 'push' | 'blackjack' | null;
  winner: 1 | 2 | 'draw' | null;
}

export interface MastermindState {
  secretCode: number[]; // 4 colors (0-5)
  currentTurn: 1 | 2;
  player1Attempts: number;
  player2Attempts: number;
  player1History: { guess: number[]; exact: number; partial: number }[];
  player2History: { guess: number[]; exact: number; partial: number }[];
  player1Won: boolean | null; // null = still playing
  player2Won: boolean | null;
  player1Score: number;
  player2Score: number;
  phase: 'playing' | 'finished';
  winner: 1 | 2 | 'draw' | null;
}

export interface SolitaireCollaborativeState {
  tableau: { suit: string; rank: string; faceUp: boolean; id: string }[][];
  foundations: {
    hearts: { suit: string; rank: string; faceUp: boolean; id: string }[];
    diamonds: { suit: string; rank: string; faceUp: boolean; id: string }[];
    clubs: { suit: string; rank: string; faceUp: boolean; id: string }[];
    spades: { suit: string; rank: string; faceUp: boolean; id: string }[];
  };
  stock: { suit: string; rank: string; faceUp: boolean; id: string }[];
  waste: { suit: string; rank: string; faceUp: boolean; id: string }[];
  moves: number;
  score: number;
  currentTurn: number; // Player number whose turn it is (1-4)
  maxPlayers: number; // 2-4
  turnTimeLimit: number; // seconds per turn (30)
  turnStartedAt: number | null; // timestamp
  playerMoves: Record<number, number>; // player_number -> move count
  status: 'playing' | 'won' | 'blocked';
}

// Union type for all game states
export type GameState = TicTacToeState | RPSState | ConnectFiveState | YahtzeeState | BlackjackState | MastermindState | SolitaireCollaborativeState | Record<string, unknown>;

// ============================================
// HOOK TYPES
// ============================================

export type MultiplayerStatus = 'idle' | 'searching' | 'waiting' | 'ready' | 'playing' | 'finished';

export interface UseMultiplayerReturn {
  // State
  room: MultiplayerRoom | null;
  players: RoomPlayer[];
  gameState: GameState | null;
  status: MultiplayerStatus;
  myPlayerNumber: number | null;
  isMyTurn: boolean;
  error: string | null;

  // Actions
  findMatch: (mode: 'ranked' | 'casual') => Promise<void>;
  createPrivateRoom: () => Promise<string>; // Returns room code
  joinByCode: (code: string) => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  sendAction: (type: ActionType, data: Record<string, unknown>) => Promise<void>;
  updateGameState: (state: GameState | Record<string, unknown>) => Promise<void>;
  surrender: () => Promise<void>;
  leaveRoom: () => void;

  // Stats
  myStats: MultiplayerStats | null;
  opponentStats: MultiplayerStats | null;
}

// ============================================
// ELO TYPES
// ============================================

export interface EloChange {
  winnerGain: number;
  loserLoss: number;
  winnerNewElo: number;
  loserNewElo: number;
}

export interface MatchResult {
  winnerId: string | null; // null for draw
  loserId: string | null;
  isDraw: boolean;
  gameId: string;
  mode: '1v1-ranked' | '1v1-casual';
}
