export type GameMode = "free" | "onchain";
export type GameId = "blackjack" | "rps" | "tictactoe" | "jackpot" | "2048" | "mastermind" | "connectfive" | "snake" | "solitaire" | "minesweeper" | "yahtzee" | "sudoku" | "memory" | "maze" | "tetris" | "poker";

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
    icon: "/icons/blackjack.png",
    route: "/blackjack",
    contractAddress: "0x6cb9971850767026feBCb4801c0b8a946F28C9Ec",
    color: "from-red-500 to-orange-600",
    hasFee: false,
  },
  rps: {
    id: "rps",
    name: "Rock Paper Scissors",
    description: "Classic hand game!",
    icon: "/icons/rps.png",
    route: "/rps",
    contractAddress: "0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49",
    color: "from-gray-400 to-gray-600",
    hasFee: false,
  },
  tictactoe: {
    id: "tictactoe",
    name: "Tic-Tac-Toe",
    description: "Get three in a row!",
    icon: "/icons/tictactoe.png",
    route: "/tictactoe",
    contractAddress: "0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881",
    color: "from-green-500 to-teal-600",
    hasFee: false,
  },
  jackpot: {
    id: "jackpot",
    name: "Crypto Jackpot",
    description: "Spin the crypto wheel!",
    icon: "/icons/jackpot.png",
    route: "/jackpot",
    contractAddress: "0x07Bc49E8A2BaF7c68519F9a61FCD733490061644",
    color: "from-yellow-500 to-orange-600",
    hasFee: false,
  },
  "2048": {
    id: "2048",
    name: "2048",
    description: "Merge tiles to 2048!",
    icon: "/icons/2048.png",
    route: "/2048",
    contractAddress: "0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1",
    color: "from-pink-500 to-rose-600",
    hasFee: true, // 0.01 CELO per game
  },
  mastermind: {
    id: "mastermind",
    name: "Crypto Mastermind",
    description: "Crack the crypto code!",
    icon: "/icons/mastermind.png",
    route: "/mastermind",
    contractAddress: "0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9",
    color: "from-gray-500 to-gray-700",
    hasFee: true, // 0.01 CELO per game
  },
  connectfive: {
    id: "connectfive",
    name: "Connect 4",
    description: "Align 4 pieces in a row!",
    icon: "/icons/connectfive.png",
    route: "/games/connect-five",
    contractAddress: "0xd00a6170d83b446314b2e79f9603bc0a72c463e6",
    color: "from-blue-500 to-indigo-600",
    hasFee: false,
  },
  snake: {
    id: "snake",
    name: "Snake",
    description: "Eat food and grow long!",
    icon: "/icons/snake.png",
    route: "/games/snake",
    contractAddress: "0x5646fda34aaf8a95b9b0607db5ca02bdee267598",
    color: "from-green-500 to-green-700",
    hasFee: false,
  },
  solitaire: {
    id: "solitaire",
    name: "Solitaire",
    description: "Classic card patience game!",
    icon: "/icons/Solitaire.png",
    route: "/games/solitaire",
    contractAddress: "0x552c22fe8e0dbff856d45bcf32ddf6fe1ccb1525",
    color: "from-purple-500 to-indigo-600",
    hasFee: false,
  },
  minesweeper: {
    id: "minesweeper",
    name: "Minesweeper",
    description: "Classic mine-sweeping puzzle!",
    icon: "/icons/minesweeper.png",
    route: "/games/minesweeper",
    contractAddress: "0x62798e5246169e655901C546c0496bb2C6158041",
    color: "from-gray-500 to-gray-700",
    hasFee: false,
  },
  yahtzee: {
    id: "yahtzee",
    name: "Yahtzee",
    description: "Roll dice and make combos!",
    icon: "/icons/yahtzee.png",
    route: "/games/yahtzee",
    contractAddress: "0xfff18d55e8365a9d60971543d9f7f3541c0a9ce0",
    color: "from-gray-600 to-gray-800",
    hasFee: false,
  },
  sudoku: {
    id: "sudoku",
    name: "Sudoku",
    description: "Fill the 9×9 grid with logic!",
    icon: "/icons/sudoku.png",
    route: "/games/sudoku",
    contractAddress: "0xB404882d0eb3A7c1022071559ab149e38d60cbE1",
    color: "from-orange-500 to-yellow-600",
    hasFee: false,
  },
  memory: {
    id: "memory",
    name: "Memory",
    description: "Match pairs of cards!",
    icon: "/icons/memory.png",
    route: "/games/memory",
    color: "from-purple-400 to-pink-500",
    hasFee: false,
  },
  maze: {
    id: "maze",
    name: "Maze",
    description: "Navigate the labyrinth!",
    icon: "/icons/maze.png",
    route: "/games/maze",
    color: "from-emerald-500 to-teal-600",
    hasFee: false,
  },
  tetris: {
    id: "tetris",
    name: "Tetris",
    description: "Clear lines with falling blocks!",
    icon: "/icons/tetris.png",
    route: "/games/tetris",
    color: "from-cyan-500 to-blue-600",
    hasFee: false,
  },
  poker: {
    id: "poker",
    name: "Poker",
    description: "Texas Hold'em — free play & multiplayer!",
    icon: "/icons/poker.svg",
    route: "/games/poker",
    color: "from-emerald-600 to-green-800",
    hasFee: false,
  },
};
