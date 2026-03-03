import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { celo, base } from "wagmi/chains";
import { defineChain, type Chain } from "viem";

type ChainWithIcon = Chain & { iconUrl?: string; iconBackground?: string };
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  walletConnectWallet,
  injectedWallet,
  rabbyWallet,
  braveWallet,
  metaMaskWallet,
  phantomWallet,
  valoraWallet,
} from "@rainbow-me/rainbowkit/wallets";

const celoRpcUrl = "https://forno.celo.org";
const baseRpcUrl = "https://mainnet.base.org";
const megaethRpcUrl = "https://mainnet.megaeth.com/rpc";
const soneiumRpcUrl = "https://rpc.soneium.org";

export const megaeth: ChainWithIcon = {
  ...defineChain({
    id: 4326,
    name: "MegaETH",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [megaethRpcUrl] } },
    blockExplorers: {
      default: { name: "MegaETH Explorer", url: "https://megaeth.blockscout.com" },
    },
  }),
  iconUrl: "/icons/megaeth.png",
};

export const soneium: ChainWithIcon = {
  ...defineChain({
    id: 1868,
    name: "Soneium",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [soneiumRpcUrl] } },
    blockExplorers: {
      default: { name: "Blockscout", url: "https://soneium.blockscout.com" },
    },
  }),
  iconUrl: "data:image/png;base64,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",
  iconBackground: "#000000",
};

function getAppUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
}

// WalletConnect project ID - get one from https://cloud.walletconnect.com
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'PLACEHOLDER';

const connectors = connectorsForWallets(
  [
    {
      groupName: "Popular",
      wallets: [
        coinbaseWallet,
        metaMaskWallet,
        rabbyWallet,
        braveWallet,
        valoraWallet,
      ],
    },
    {
      groupName: "More",
      wallets: [
        walletConnectWallet,
        phantomWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: "Mini Games Portal",
    projectId: walletConnectProjectId,
    appDescription: "Play 15 mini-games on Celo, Base, MegaETH & Soneium! Blackjack, RPS, TicTacToe, Solitaire, and more.",
    appUrl: getAppUrl(),
    appIcon: `${getAppUrl()}/icon.png`,
  }
);

export const config = createConfig({
  chains: [celo, base, megaeth, soneium],
  connectors: [
    // Farcaster Mini App connector (only active inside Farcaster/Warpcast)
    farcasterMiniApp(),
    ...connectors,
  ],
  transports: {
    [celo.id]: http(celoRpcUrl, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10_000,
    }),
    [base.id]: http(baseRpcUrl, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10_000,
    }),
    [megaeth.id]: http(megaethRpcUrl, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10_000,
    }),
    [soneium.id]: http(soneiumRpcUrl, {
      batch: true,
      retryCount: 3,
      retryDelay: 1000,
      timeout: 10_000,
    }),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
