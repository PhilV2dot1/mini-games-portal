// Sudoku Smart Contract ABI
// Deployed and verified on Celo mainnet
export const SUDOKU_CONTRACT_ADDRESS = "0xB404882d0eb3A7c1022071559ab149e38d60cbE1" as const;

export const SUDOKU_CONTRACT_ABI = [
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "enum Sudoku.Difficulty", name: "difficulty", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "GameStarted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "enum Sudoku.GameResult", name: "result", type: "uint8" },
      { indexed: false, internalType: "enum Sudoku.Difficulty", name: "difficulty", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "timeTaken", type: "uint256" },
      { indexed: false, internalType: "uint8", name: "hintsUsed", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "GameEnded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "player", type: "address" },
      { indexed: false, internalType: "enum Sudoku.Difficulty", name: "difficulty", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "GameAbandoned",
    type: "event",
  },
  // Functions
  {
    inputs: [{ internalType: "enum Sudoku.Difficulty", name: "difficulty", type: "uint8" }],
    name: "startGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "enum Sudoku.GameResult", name: "result", type: "uint8" },
      { internalType: "enum Sudoku.Difficulty", name: "difficulty", type: "uint8" },
      { internalType: "uint256", name: "timeTaken", type: "uint256" },
      { internalType: "uint8", name: "hintsUsed", type: "uint8" },
    ],
    name: "endGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "abandonGame",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getPlayerStats",
    outputs: [
      { internalType: "uint256", name: "gamesPlayed", type: "uint256" },
      { internalType: "uint256", name: "wins", type: "uint256" },
      { internalType: "uint256", name: "bestTimeEasy", type: "uint256" },
      { internalType: "uint256", name: "bestTimeMedium", type: "uint256" },
      { internalType: "uint256", name: "bestTimeHard", type: "uint256" },
      { internalType: "uint256", name: "perfectGames", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "getActiveGame",
    outputs: [
      { internalType: "bool", name: "isActive", type: "bool" },
      { internalType: "enum Sudoku.Difficulty", name: "difficulty", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "player", type: "address" }],
    name: "isGameActive",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
