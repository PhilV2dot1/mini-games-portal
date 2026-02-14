import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { celo, base } from "wagmi/chains";
import { defineChain } from "viem";
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

export const megaeth = defineChain({
  id: 4326,
  name: "MegaETH",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [megaethRpcUrl] },
  },
  blockExplorers: {
    default: { name: "MegaETH Explorer", url: "https://megaeth.blockscout.com" },
  },
  iconUrl: "/icons/megaeth.png",
}) as typeof celo;

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
    appDescription: "Play 14 mini-games on Celo, Base & MegaETH! Blackjack, RPS, TicTacToe, Solitaire, and more.",
    appUrl: getAppUrl(),
    appIcon: `${getAppUrl()}/icon.png`,
  }
);

export const config = createConfig({
  chains: [celo, base, megaeth],
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
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
