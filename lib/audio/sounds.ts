/**
 * Audio Library - Sound definitions and configuration
 * Centralized sound management for all games
 */

// Sound categories
export type SoundCategory = 'ui' | 'game' | 'win' | 'lose' | 'action';

// Sound definition interface
export interface SoundDefinition {
  path: string;
  category: SoundCategory;
  volume?: number; // 0-1, default 1
  preload?: boolean; // default true for common sounds
}

// Global UI sounds (shared across all games)
export const UI_SOUNDS = {
  click: { path: '/audio/ui/click.mp3', category: 'ui' as const, preload: true, volume: 0.5 },
  hover: { path: '/audio/ui/hover.mp3', category: 'ui' as const, volume: 0.2 },
  toggle: { path: '/audio/ui/toggle.mp3', category: 'ui' as const, volume: 0.4 },
  success: { path: '/audio/ui/success.mp3', category: 'win' as const, preload: true },
  error: { path: '/audio/ui/error.mp3', category: 'lose' as const },
  notification: { path: '/audio/ui/notification.mp3', category: 'ui' as const },
} as const;

// Game-specific sounds
export const GAME_SOUNDS = {
  // Snake
  snake: {
    eat: { path: '/audio/snake/eat.mp3', category: 'action' as const },
    move: { path: '/audio/snake/move.mp3', category: 'action' as const, volume: 0.2 },
    crash: { path: '/audio/snake/crash.mp3', category: 'lose' as const },
    levelUp: { path: '/audio/snake/levelup.mp3', category: 'win' as const },
  },

  // Connect Five
  connectfive: {
    drop: { path: '/audio/connectfive/drop.mp3', category: 'action' as const },
    win: { path: '/audio/connectfive/win.mp3', category: 'win' as const },
    lose: { path: '/audio/connectfive/lose.mp3', category: 'lose' as const },
  },

  // Rock Paper Scissors
  rps: {
    select: { path: '/audio/rps/select.mp3', category: 'action' as const },
    reveal: { path: '/audio/rps/reveal.mp3', category: 'action' as const },
    win: { path: '/audio/rps/win.mp3', category: 'win' as const },
    lose: { path: '/audio/rps/lose.mp3', category: 'lose' as const },
    tie: { path: '/audio/rps/tie.mp3', category: 'game' as const },
  },

  // Yahtzee
  yahtzee: {
    roll: { path: '/audio/yahtzee/roll.mp3', category: 'action' as const },
    hold: { path: '/audio/yahtzee/hold.mp3', category: 'action' as const, volume: 0.5 },
    score: { path: '/audio/yahtzee/score.mp3', category: 'action' as const },
    yahtzee: { path: '/audio/yahtzee/yahtzee.mp3', category: 'win' as const },
    bonus: { path: '/audio/yahtzee/bonus.mp3', category: 'win' as const },
  },

  // Sudoku
  sudoku: {
    place: { path: '/audio/sudoku/place.mp3', category: 'action' as const },
    erase: { path: '/audio/sudoku/erase.mp3', category: 'action' as const },
    hint: { path: '/audio/sudoku/hint.mp3', category: 'ui' as const },
    error: { path: '/audio/sudoku/error.mp3', category: 'lose' as const, volume: 0.7 },
    complete: { path: '/audio/sudoku/complete.mp3', category: 'win' as const },
  },

  // Minesweeper
  minesweeper: {
    click: { path: '/audio/minesweeper/click.mp3', category: 'action' as const },
    reveal: { path: '/audio/minesweeper/reveal.mp3', category: 'action' as const },
    flag: { path: '/audio/minesweeper/flag.mp3', category: 'action' as const },
    explosion: { path: '/audio/minesweeper/explosion.mp3', category: 'lose' as const },
    victory: { path: '/audio/minesweeper/victory.mp3', category: 'win' as const },
  },

  // Tic Tac Toe
  tictactoe: {
    place: { path: '/audio/tictactoe/place.mp3', category: 'action' as const },
    win: { path: '/audio/tictactoe/win.mp3', category: 'win' as const },
    lose: { path: '/audio/tictactoe/lose.mp3', category: 'lose' as const },
    tie: { path: '/audio/tictactoe/tie.mp3', category: 'game' as const },
  },

  // 2048
  '2048': {
    move: { path: '/audio/2048/move.mp3', category: 'action' as const, volume: 0.3 },
    merge: { path: '/audio/2048/merge.mp3', category: 'action' as const },
    win: { path: '/audio/2048/win.mp3', category: 'win' as const },
    lose: { path: '/audio/2048/lose.mp3', category: 'lose' as const },
  },

  // Blackjack
  blackjack: {
    deal: { path: '/audio/blackjack/deal.mp3', category: 'action' as const },
    hit: { path: '/audio/blackjack/hit.mp3', category: 'action' as const },
    win: { path: '/audio/blackjack/win.mp3', category: 'win' as const },
    lose: { path: '/audio/blackjack/lose.mp3', category: 'lose' as const },
    blackjack: { path: '/audio/blackjack/blackjack.mp3', category: 'win' as const },
  },

  // Solitaire
  solitaire: {
    flip: { path: '/audio/solitaire/flip.mp3', category: 'action' as const },
    place: { path: '/audio/solitaire/place.mp3', category: 'action' as const },
    win: { path: '/audio/solitaire/win.mp3', category: 'win' as const },
  },

  // Memory
  memory: {
    flip: { path: '/audio/memory/flip.mp3', category: 'action' as const },
    match: { path: '/audio/memory/match.mp3', category: 'win' as const },
    noMatch: { path: '/audio/memory/nomatch.mp3', category: 'game' as const },
    win: { path: '/audio/memory/win.mp3', category: 'win' as const },
  },

  // Maze
  maze: {
    move: { path: '/audio/maze/move.mp3', category: 'action' as const, volume: 0.3 },
    wall: { path: '/audio/maze/wall.mp3', category: 'action' as const, volume: 0.4 },
    win: { path: '/audio/maze/win.mp3', category: 'win' as const },
  },

  // Mastermind
  mastermind: {
    place: { path: '/audio/mastermind/place.mp3', category: 'action' as const },
    check: { path: '/audio/mastermind/check.mp3', category: 'action' as const },
    win: { path: '/audio/mastermind/win.mp3', category: 'win' as const },
    lose: { path: '/audio/mastermind/lose.mp3', category: 'lose' as const },
  },

  // Jackpot
  jackpot: {
    spin: { path: '/audio/jackpot/spin.mp3', category: 'action' as const },
    stop: { path: '/audio/jackpot/stop.mp3', category: 'action' as const },
    win: { path: '/audio/jackpot/win.mp3', category: 'win' as const },
    jackpot: { path: '/audio/jackpot/jackpot.mp3', category: 'win' as const },
  },
} as const;

// Type helpers
export type UISound = keyof typeof UI_SOUNDS;
export type GameId = keyof typeof GAME_SOUNDS;
export type GameSound<T extends GameId> = keyof (typeof GAME_SOUNDS)[T];

// Get all sounds for a game (for preloading)
export function getGameSounds(gameId: GameId): SoundDefinition[] {
  const gameSounds = GAME_SOUNDS[gameId];
  if (!gameSounds) return [];
  return Object.values(gameSounds) as SoundDefinition[];
}

// Get sound definition
export function getSoundDefinition(
  gameId: GameId | 'ui',
  soundName: string
): SoundDefinition | undefined {
  if (gameId === 'ui') {
    return UI_SOUNDS[soundName as UISound];
  }
  const gameSounds = GAME_SOUNDS[gameId];
  if (!gameSounds) return undefined;
  return gameSounds[soundName as keyof typeof gameSounds] as SoundDefinition | undefined;
}

// Get all game IDs
export function getAllGameIds(): GameId[] {
  return Object.keys(GAME_SOUNDS) as GameId[];
}
