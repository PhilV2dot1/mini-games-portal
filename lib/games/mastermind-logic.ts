// Mastermind Game Logic - Pure TypeScript implementation

// Color palette
export type Color = 'red' | 'blue' | 'green' | 'yellow' | 'orange' | 'purple';
export const COLORS: Color[] = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];

export const COLOR_CONFIG: Record<Color, { bg: string; border: string; shadow: string }> = {
  red: { bg: '#ef4444', border: '#dc2626', shadow: 'rgba(239, 68, 68, 0.5)' },
  blue: { bg: '#3b82f6', border: '#2563eb', shadow: 'rgba(59, 130, 246, 0.5)' },
  green: { bg: '#22c55e', border: '#16a34a', shadow: 'rgba(34, 197, 94, 0.5)' },
  yellow: { bg: '#eab308', border: '#ca8a04', shadow: 'rgba(234, 179, 8, 0.5)' },
  orange: { bg: '#f97316', border: '#ea580c', shadow: 'rgba(249, 115, 22, 0.5)' },
  purple: { bg: '#a855f7', border: '#9333ea', shadow: 'rgba(168, 85, 247, 0.5)' },
};

// Game constants
export const CODE_LENGTH = 4;
export const MAX_ATTEMPTS = 10;

// Types
export type Code = [Color, Color, Color, Color];
export type Guess = [Color | null, Color | null, Color | null, Color | null];
export type Feedback = { blackPegs: number; whitePegs: number };

export interface GameHistory {
  guess: Code;
  feedback: Feedback;
}

// Generate random secret code
export function generateSecretCode(): Code {
  return Array.from(
    { length: CODE_LENGTH },
    () => COLORS[Math.floor(Math.random() * COLORS.length)]
  ) as Code;
}

// Evaluate guess against secret code
export function evaluateGuess(secret: Code, guess: Code): Feedback {
  let blackPegs = 0;
  let whitePegs = 0;

  const secretCopy: (Color | null)[] = [...secret];
  const guessCopy: (Color | null)[] = [...guess];

  // First pass: count black pegs (exact matches)
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guessCopy[i] === secretCopy[i]) {
      blackPegs++;
      secretCopy[i] = null; // Mark as used
      guessCopy[i] = null;
    }
  }

  // Second pass: count white pegs (color exists but wrong position)
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guessCopy[i] !== null) {
      const matchIndex = secretCopy.findIndex(c => c === guessCopy[i]);
      if (matchIndex !== -1) {
        whitePegs++;
        secretCopy[matchIndex] = null; // Mark as used
      }
    }
  }

  return { blackPegs, whitePegs };
}

// Check if guess is valid (all 4 colors selected)
export function isValidGuess(guess: Guess): guess is Code {
  return guess.every(color => color !== null);
}

// Check if player won
export function hasWon(feedback: Feedback): boolean {
  return feedback.blackPegs === CODE_LENGTH;
}

// Calculate score based on attempts used
export function calculateScore(won: boolean, attemptsUsed: number): number {
  if (!won) return 0;
  return Math.max(0, 100 - (attemptsUsed * 10));
}
