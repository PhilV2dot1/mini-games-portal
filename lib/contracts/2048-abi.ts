// Game2048V2 Smart Contract ABI
// Contract Address (Celo Mainnet): 0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1
// Deployed and verified on Celo Mainnet
// Free to play (gas only)

export const GAME2048_CONTRACT_ADDRESS = "0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1" as `0x${string}`;

export const GAME2048_CONTRACT_ABI = [
  {
    type: "function",
    name: "startGame",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "submitScore",
    inputs: [
      { name: "score", type: "uint256" },
      { name: "reachedGoal", type: "bool" }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "abandonGame",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getStats",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      { name: "highScore", type: "uint256" },
      { name: "wins", type: "uint256" },
      { name: "losses", type: "uint256" },
      { name: "totalGames", type: "uint256" },
      { name: "winRate", type: "uint256" },
      { name: "currentStreak", type: "int256" },
      { name: "bestStreak", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "hasActiveGame",
    inputs: [{ name: "player", type: "address" }],
    outputs: [
      { name: "exists", type: "bool" },
      { name: "startTime", type: "uint256" }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "GameStarted",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "ScoreSubmitted",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "score", type: "uint256", indexed: false },
      { name: "reachedGoal", type: "bool", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  },
  {
    type: "event",
    name: "GameAbandoned",
    inputs: [
      { name: "player", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false }
    ]
  }
] as const;

