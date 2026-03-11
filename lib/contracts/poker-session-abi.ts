export const POKER_SESSION_ABI = [
  // ── Write ────────────────────────────────────────────────────────────────
  {
    name: 'startSession',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'endSession',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'handsPlayed',  type: 'uint256' },
      { name: 'handsWon',     type: 'uint256' },
      { name: 'handsSplit',   type: 'uint256' },
      { name: 'bestHandRank', type: 'uint8'   },
    ],
    outputs: [],
  },
  {
    name: 'abandonSession',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },

  // ── Read ─────────────────────────────────────────────────────────────────
  {
    name: 'getPlayerStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'sessionsPlayed',   type: 'uint256' },
      { name: 'totalHandsPlayed', type: 'uint256' },
      { name: 'totalHandsWon',    type: 'uint256' },
      { name: 'totalHandsSplit',  type: 'uint256' },
      { name: 'bestHandRank',     type: 'uint256' },
      { name: 'bestSessionWins',  type: 'uint256' },
      { name: 'winRate',          type: 'uint256' },
    ],
  },
  {
    name: 'isSessionActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },

  // ── Events ───────────────────────────────────────────────────────────────
  {
    name: 'SessionStarted',
    type: 'event',
    inputs: [
      { name: 'player',    type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'SessionEnded',
    type: 'event',
    inputs: [
      { name: 'player',      type: 'address', indexed: true  },
      { name: 'handsPlayed', type: 'uint256', indexed: false },
      { name: 'handsWon',    type: 'uint256', indexed: false },
      { name: 'handsSplit',  type: 'uint256', indexed: false },
      { name: 'bestHandRank',type: 'uint8',   indexed: false },
      { name: 'timestamp',   type: 'uint256', indexed: false },
    ],
  },
  {
    name: 'SessionAbandoned',
    type: 'event',
    inputs: [
      { name: 'player',    type: 'address', indexed: true  },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;
