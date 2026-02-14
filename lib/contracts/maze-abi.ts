/**
 * Maze Smart Contract ABI
 * Deployed on Celo and Base
 */

export const MAZE_CONTRACT_ABI = [
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
      { name: "difficulty", type: "uint8" },
      { name: "timeTaken", type: "uint256" },
      { name: "moves", type: "uint256" },
      { name: "score", type: "uint256" },
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
      { name: "bestTimeEasy", type: "uint256" },
      { name: "bestTimeMedium", type: "uint256" },
      { name: "bestTimeHard", type: "uint256" },
      { name: "bestMovesEasy", type: "uint256" },
      { name: "bestMovesMedium", type: "uint256" },
      { name: "bestMovesHard", type: "uint256" },
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
      { name: "difficulty", type: "uint8", indexed: false },
      { name: "timeTaken", type: "uint256", indexed: false },
      { name: "moves", type: "uint256", indexed: false },
      { name: "score", type: "uint256", indexed: false },
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
