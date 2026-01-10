/**
 * Minesweeper Smart Contract ABI
 * Contract Address: TBD (to be deployed on Celo mainnet)
 */

export const MINESWEEPER_CONTRACT_ADDRESS =
  "0x62798e5246169e655901C546c0496bb2C6158041" as `0x${string}`;

export const MINESWEEPER_CONTRACT_ABI = [
  {
    type: "function",
    name: "startGame",
    inputs: [{ name: "difficulty", type: "uint8" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "endGame",
    inputs: [
      { name: "result", type: "uint8" },
      { name: "difficulty", type: "uint8" },
      { name: "timeTaken", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "abandonGame",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPlayerStats",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      { name: "gamesPlayed", type: "uint256" },
      { name: "wins", type: "uint256" },
      { name: "losses", type: "uint256" },
      { name: "bestTimeEasy", type: "uint256" },
      { name: "bestTimeMedium", type: "uint256" },
      { name: "bestTimeHard", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getActiveGame",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      { name: "isActive", type: "bool" },
      { name: "difficulty", type: "uint8" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isGameActive",
    inputs: [{ name: "player", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalGames",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "GameStarted",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "difficulty", type: "uint8", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "GameEnded",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "result", type: "uint8", indexed: false },
      { name: "difficulty", type: "uint8", indexed: false },
      { name: "timeTaken", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "GameAbandoned",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "difficulty", type: "uint8", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;
