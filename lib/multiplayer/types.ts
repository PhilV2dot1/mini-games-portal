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

// Union type for all game states
export type GameState = TicTacToeState | RPSState | ConnectFiveState | Record<string, unknown>;

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
