export type GameMode = "free" | "onchain";
export type GameId = "blackjack" | "rps" | "tictactoe" | "jackpot" | "2048" | "mastermind";

export interface GameMetadata {
  id: GameId;
  name: string;
  description: string;
  icon: string;
  route: string;
  contractAddress?: `0x${string}`;
  color: string;
  hasFee: boolean; // Indicates if game requires 0.01 CELO to play on-chain
}

export const GAMES: Record<GameId, GameMetadata> = {
  blackjack: {
    id: "blackjack",
    name: "Blackjack",
    description: "Beat the dealer to 21!",
    icon: "🃏",
    route: "/blackjack",
    contractAddress: "0x6cb9971850767026feBCb4801c0b8a946F28C9Ec",
    color: "from-red-500 to-orange-600",
    hasFee: false,
  },
  rps: {
    id: "rps",
    name: "Rock Paper Scissors",
    description: "Classic hand game!",
    icon: "✊",
    route: "/rps",
    contractAddress: "0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49",
    color: "from-gray-400 to-gray-600",
    hasFee: false,
  },
  tictactoe: {
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    description: "Get three in a row!",
    icon: "⭕",
    route: "/tictactoe",
    contractAddress: "0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881",
    color: "from-green-500 to-teal-600",
    hasFee: false,
  },
  jackpot: {
    id: "jackpot",
    name: "Solo Jackpot",
    description: "Spin the crypto wheel!",
    icon: "🎰",
    route: "/jackpot",
    contractAddress: "0x07Bc49E8A2BaF7c68519F9a61FCD733490061644",
    color: "from-yellow-500 to-orange-600",
    hasFee: false,
  },
  "2048": {
    id: "2048",
    name: "2048",
    description: "Merge tiles to 2048!",
    icon: "🔢",
    route: "/2048",
    contractAddress: "0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1",
    color: "from-pink-500 to-rose-600",
    hasFee: true, // 0.01 CELO per game
  },
  mastermind: {
    id: "mastermind",
    name: "Mastermind",
    description: "Crack the color code!",
    icon: "🎯",
    route: "/mastermind",
    contractAddress: "0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9",
    color: "from-gray-500 to-gray-700",
    hasFee: true, // 0.01 CELO per game
  },
};
