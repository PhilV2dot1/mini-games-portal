export interface TokenMeta {
  id: string;       // CoinGecko ID
  name: string;
  symbol: string;
  color: string;    // circle bg
  textColor: string;
  funFact: string;  // max ~80 chars
  celoEco?: boolean;
}

export const TOKENS: TokenMeta[] = [
  // ── Top-cap mainstream ──────────────────────────────────────────────────────
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    color: "#F7931A",
    textColor: "#fff",
    funFact: "The first crypto ever — born Jan 3, 2009 with a single block.",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    color: "#627EEA",
    textColor: "#fff",
    funFact: "Powers more smart contracts than any other blockchain.",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    color: "#9945FF",
    textColor: "#fff",
    funFact: "Processes up to 65,000 transactions per second.",
  },
  {
    id: "binancecoin",
    name: "BNB",
    symbol: "BNB",
    color: "#F3BA2F",
    textColor: "#1a1a1a",
    funFact: "Started as an ERC-20 token before moving to its own chain.",
  },
  {
    id: "ripple",
    name: "XRP",
    symbol: "XRP",
    color: "#00AAE4",
    textColor: "#fff",
    funFact: "Designed to settle bank transactions in under 5 seconds.",
  },
  {
    id: "cardano",
    name: "Cardano",
    symbol: "ADA",
    color: "#0033AD",
    textColor: "#fff",
    funFact: "Built by the co-founder of Ethereum using peer-reviewed research.",
  },
  {
    id: "avalanche-2",
    name: "Avalanche",
    symbol: "AVAX",
    color: "#E84142",
    textColor: "#fff",
    funFact: "Achieves 4,500 TPS with sub-2-second finality.",
  },
  {
    id: "polkadot",
    name: "Polkadot",
    symbol: "DOT",
    color: "#E6007A",
    textColor: "#fff",
    funFact: "Connects different blockchains via its relay chain architecture.",
  },
  {
    id: "chainlink",
    name: "Chainlink",
    symbol: "LINK",
    color: "#2A5ADA",
    textColor: "#fff",
    funFact: "The most widely used oracle network in DeFi.",
  },
  {
    id: "uniswap",
    name: "Uniswap",
    symbol: "UNI",
    color: "#FF007A",
    textColor: "#fff",
    funFact: "Invented the automated market maker (AMM) model for DEXes.",
  },
  // ── Mid-cap ─────────────────────────────────────────────────────────────────
  {
    id: "litecoin",
    name: "Litecoin",
    symbol: "LTC",
    color: "#BFBBBB",
    textColor: "#1a1a1a",
    funFact: "One of the first Bitcoin forks — launched October 2011.",
  },
  {
    id: "stellar",
    name: "Stellar",
    symbol: "XLM",
    color: "#14B6E7",
    textColor: "#fff",
    funFact: "Focuses on fast, cheap cross-border payments for individuals.",
  },
  {
    id: "cosmos",
    name: "Cosmos",
    symbol: "ATOM",
    color: "#2E3148",
    textColor: "#fff",
    funFact: "The \"Internet of Blockchains\" — connects 50+ sovereign chains.",
  },
  {
    id: "near",
    name: "NEAR Protocol",
    symbol: "NEAR",
    color: "#00C08B",
    textColor: "#fff",
    funFact: "Uses human-readable account names instead of hex addresses.",
  },
  {
    id: "algorand",
    name: "Algorand",
    symbol: "ALGO",
    color: "#000000",
    textColor: "#fff",
    funFact: "Claims to be the first carbon-negative blockchain.",
  },
  {
    id: "tron",
    name: "TRON",
    symbol: "TRX",
    color: "#EF0027",
    textColor: "#fff",
    funFact: "Handles more daily transactions than Ethereum.",
  },
  {
    id: "monero",
    name: "Monero",
    symbol: "XMR",
    color: "#FF6600",
    textColor: "#fff",
    funFact: "The most private cryptocurrency — transactions are fully hidden.",
  },
  {
    id: "optimism",
    name: "Optimism",
    symbol: "OP",
    color: "#FF0420",
    textColor: "#fff",
    funFact: "An L2 that reduces Ethereum gas fees by up to 100x.",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    symbol: "ARB",
    color: "#28A0F0",
    textColor: "#fff",
    funFact: "The largest Ethereum L2 by total value locked.",
  },
  // ── Gaming / Metaverse ───────────────────────────────────────────────────────
  {
    id: "the-sandbox",
    name: "The Sandbox",
    symbol: "SAND",
    color: "#00ADEF",
    textColor: "#fff",
    funFact: "Virtual land plots sold for over $4.3M in SAND tokens.",
  },
  {
    id: "decentraland",
    name: "Decentraland",
    symbol: "MANA",
    color: "#FF2D55",
    textColor: "#fff",
    funFact: "A virtual world entirely owned by its users via NFTs.",
  },
  {
    id: "axie-infinity",
    name: "Axie Infinity",
    symbol: "AXS",
    color: "#0055D5",
    textColor: "#fff",
    funFact: "Peaked at 2.7M daily players and sparked the P2E craze.",
  },
  {
    id: "apecoin",
    name: "ApeCoin",
    symbol: "APE",
    color: "#063CFF",
    textColor: "#fff",
    funFact: "Born from the Bored Ape Yacht Club NFT community.",
  },
  // ── L2 / Infrastructure ───────────────────────────────────────────────────────
  {
    id: "matic-network",
    name: "Polygon",
    symbol: "MATIC",
    color: "#8247E5",
    textColor: "#fff",
    funFact: "Processes over 3 million transactions per day for Ethereum.",
  },
  {
    id: "filecoin",
    name: "Filecoin",
    symbol: "FIL",
    color: "#0090FF",
    textColor: "#fff",
    funFact: "A decentralized marketplace for renting unused storage space.",
  },
  {
    id: "vechain",
    name: "VeChain",
    symbol: "VET",
    color: "#15BDFF",
    textColor: "#fff",
    funFact: "Used by BMW and Walmart China to track supply chains.",
  },
  // ── Meme coins ────────────────────────────────────────────────────────────────
  {
    id: "dogecoin",
    name: "Dogecoin",
    symbol: "DOGE",
    color: "#C2A633",
    textColor: "#fff",
    funFact: "Started as a joke in 2013 and now has a $20B+ market cap.",
  },
  {
    id: "shiba-inu",
    name: "Shiba Inu",
    symbol: "SHIB",
    color: "#FFA409",
    textColor: "#fff",
    funFact: "Vitalik Buterin donated 50 trillion SHIB to India COVID relief.",
  },
  {
    id: "pepe",
    name: "Pepe",
    symbol: "PEPE",
    color: "#4CAF50",
    textColor: "#fff",
    funFact: "Reached a $7B market cap in under 2 months after launch.",
  },
  {
    id: "worldcoin",
    name: "Worldcoin",
    symbol: "WLD",
    color: "#000000",
    textColor: "#fff",
    funFact: "Scans irises to prove humanity — 5M+ orb sign-ups to date.",
  },
  // ── Celo ecosystem ─────────────────────────────────────────────────────────
  {
    id: "celo",
    name: "Celo",
    symbol: "CELO",
    color: "#FCFF52",
    textColor: "#1a1a1a",
    funFact: "Mobile-first L1 — phone number = wallet address.",
    celoEco: true,
  },
  {
    id: "celo-dollar",
    name: "Celo Dollar",
    symbol: "cUSD",
    color: "#35D07F",
    textColor: "#fff",
    funFact: "An algorithmic stablecoin pegged to the US dollar on Celo.",
    celoEco: true,
  },
  {
    id: "celo-euro",
    name: "Celo Euro",
    symbol: "cEUR",
    color: "#1E88E5",
    textColor: "#fff",
    funFact: "A stablecoin tracking the Euro — part of Celo's multi-currency vision.",
    celoEco: true,
  },
  {
    id: "moss-carbon-credit",
    name: "Moss Carbon",
    symbol: "MCO2",
    color: "#2E7D32",
    textColor: "#fff",
    funFact: "Each MCO2 token represents 1 tonne of verified CO₂ offset.",
    celoEco: true,
  },
];

// ── Difficulty pools ──────────────────────────────────────────────────────────

export type Difficulty = "easy" | "medium" | "hard";

// Easy: top 10 by rough market cap order (bitcoin through uniswap)
const EASY_IDS = new Set([
  "bitcoin","ethereum","solana","binancecoin","ripple",
  "cardano","avalanche-2","polkadot","chainlink","uniswap",
  "celo","celo-dollar","celo-euro","moss-carbon-credit",
]);

// Medium: easy + mid-cap tokens
const MEDIUM_IDS = new Set([
  ...Array.from(EASY_IDS),
  "litecoin","stellar","cosmos","near","algorand","tron","monero",
  "optimism","arbitrum","matic-network","filecoin","vechain",
]);

export function getPoolForDifficulty(difficulty: Difficulty): TokenMeta[] {
  if (difficulty === "easy") {
    return TOKENS.filter(t => EASY_IDS.has(t.id));
  }
  if (difficulty === "medium") {
    return TOKENS.filter(t => MEDIUM_IDS.has(t.id));
  }
  // hard: all tokens
  return TOKENS;
}
