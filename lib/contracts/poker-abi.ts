/**
 * Poker Contract ABI — Texas Hold'em Solo (vs dealer)
 * Pattern: startGame() → play client-side → endGame(outcome, handRank)
 * Deploy on Celo, Base, MegaETH to enable onchain mode.
 */
export const POKER_ABI = [
  // ── Write functions ──────────────────────────────────────────────────────────
  {
    name: 'startGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'endGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'outcome', type: 'uint8' }, // 0=WIN 1=LOSE 2=SPLIT
      { name: 'handRank', type: 'uint8' }, // 0–9
    ],
    outputs: [],
  },
  {
    name: 'abandonGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  // ── View functions ───────────────────────────────────────────────────────────
  {
    name: 'getPlayerStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'handsPlayed', type: 'uint256' },
      { name: 'handsWon', type: 'uint256' },
      { name: 'handsSplit', type: 'uint256' },
      { name: 'bestHandRank', type: 'uint256' },
      { name: 'winRate', type: 'uint256' },
    ],
  },
  {
    name: 'isGameActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  // ── Events ───────────────────────────────────────────────────────────────────
  {
    name: 'GameStarted',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'GameEnded',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'outcome', type: 'uint8', indexed: false },   // 0=WIN 1=LOSE 2=SPLIT
      { name: 'handRank', type: 'uint8', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'GameAbandoned',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;
