/**
 * Poker Contract ABI — Texas Hold'em Solo (vs dealer)
 * Deploy on Celo, Base, MegaETH to enable onchain mode.
 */
export const POKER_ABI = [
  {
    name: 'playHand',
    type: 'function',
    stateMutability: 'payable',
    inputs: [],
    outputs: [
      { name: 'holeCards', type: 'uint8[]' },
      { name: 'communityCards', type: 'uint8[]' },
      { name: 'handRank', type: 'uint8' },
      { name: 'outcome', type: 'string' },
    ],
  },
  {
    name: 'getStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'handsPlayed', type: 'uint256' },
      { name: 'handsWon', type: 'uint256' },
      { name: 'biggestPot', type: 'uint256' },
      { name: 'winRate', type: 'uint256' },
    ],
  },
  {
    name: 'HandPlayed',
    type: 'event',
    inputs: [
      { name: 'player', type: 'address', indexed: true },
      { name: 'holeCards', type: 'uint8[]', indexed: false },
      { name: 'communityCards', type: 'uint8[]', indexed: false },
      { name: 'handRank', type: 'uint8', indexed: false },
      { name: 'outcome', type: 'string', indexed: false },
    ],
  },
] as const;
