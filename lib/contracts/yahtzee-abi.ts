/**
 * Yahtzee Smart Contract ABI
 *
 * Deployed on Celo Mainnet
 * Contract Address: 0xfff18d55e8365a9d60971543d9f7f3541c0a9ce0
 */

export const YAHTZEE_CONTRACT_ADDRESS =
  "0xfff18d55e8365a9d60971543d9f7f3541c0a9ce0" as const;

export const YAHTZEE_CONTRACT_ABI = [
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
        name: "score",
        type: "uint256",
        internalType: "uint256",
      },
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
        name: "totalScore",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "highScore",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAverageScore",
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
    name: "isGameActive",
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
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getGameStartTime",
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
    name: "playerStats",
    inputs: [
      {
        name: "",
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
        name: "totalScore",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "highScore",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "activeGames",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "startTime",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "isActive",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalGames",
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
    type: "function",
    name: "MAX_SCORE",
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
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "GameEnded",
    inputs: [
      {
        name: "player",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "score",
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
    anonymous: false,
  },
  {
    type: "event",
    name: "GameAbandoned",
    inputs: [
      {
        name: "player",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "timestamp",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "GameAlreadyActive",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidScore",
    inputs: [],
  },
  {
    type: "error",
    name: "NoActiveGame",
    inputs: [],
  },
] as const;
