// Tic-Tac-Toe Contract ABI
// Contract Address: 0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881
// Deployed and verified on Celo mainnet

export const TICTACTOE_CONTRACT_ADDRESS = "0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881" as const;

export const TICTACTOE_CONTRACT_ABI = [
  {
    type: "function",
    name: "startGame",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "endGame",
    inputs: [
      {
        name: "result",
        type: "uint8",
        internalType: "uint8",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getPlayerStats",
    inputs: [
      {
        name: "player",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "gamesPlayed",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "wins",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "losses",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "draws",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "winRate",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "currentStreak",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "bestStreak",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPlayerGameCount",
    inputs: [
      {
        name: "player",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalGamesPlayed",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "GameStarted",
    inputs: [
      {
        name: "player",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "gameId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
  },
  {
    type: "event",
    name: "GameCompleted",
    inputs: [
      {
        name: "player",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "gameId",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "result",
        type: "uint8",
        indexed: false,
        internalType: "uint8",
      },
    ],
  },
] as const;

// Result constants for endGame function
export const GAME_RESULT = {
  WIN: 1,
  LOSE: 2,
  DRAW: 3,
} as const;

export type GameResult = (typeof GAME_RESULT)[keyof typeof GAME_RESULT];
