// Blackjack contract deployed on Celo Mainnet
// Verified at: https://celoscan.io/address/0x6cb9971850767026feBCb4801c0b8a946F28C9Ec
export const CONTRACT_ADDRESS = "0x6cb9971850767026feBCb4801c0b8a946F28C9Ec" as `0x${string}`;

export const CONTRACT_ABI = [
  {
    "type": "function",
    "name": "playGame",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "playerCards", "type": "uint8[]" },
          { "name": "dealerCards", "type": "uint8[]" },
          { "name": "playerTotal", "type": "uint8" },
          { "name": "dealerTotal", "type": "uint8" },
          { "name": "outcome", "type": "string" }
        ]
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getStats",
    "inputs": [],
    "outputs": [
      { "name": "wins", "type": "uint256" },
      { "name": "losses", "type": "uint256" },
      { "name": "pushes", "type": "uint256" },
      { "name": "blackjacks", "type": "uint256" },
      { "name": "totalGames", "type": "uint256" },
      { "name": "winRate", "type": "uint256" },
      { "name": "currentStreak", "type": "int256" },
      { "name": "bestStreak", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "GamePlayed",
    "inputs": [
      { "name": "player", "type": "address", "indexed": true },
      { "name": "playerCards", "type": "uint8[]", "indexed": false },
      { "name": "dealerCards", "type": "uint8[]", "indexed": false },
      { "name": "playerTotal", "type": "uint8", "indexed": false },
      { "name": "dealerTotal", "type": "uint8", "indexed": false },
      { "name": "outcome", "type": "string", "indexed": false }
    ],
    "anonymous": false
  }
] as const;
