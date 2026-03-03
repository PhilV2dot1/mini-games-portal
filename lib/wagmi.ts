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
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPCEtLSBGdWxsIGJsYWNrIG91dGVyIGNpcmNsZSAtLT4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0NCIgZmlsbD0iYmxhY2siLz4KICA8IS0tIElubmVyIHdoaXRlIGNpcmNsZSAoZG9udXQgaG9sZSkgLS0+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMjEiIGZpbGw9IndoaXRlIi8+CiAgPCEtLQogICAgVHdvIHRoaW4gZGlhZ29uYWwgd2hpdGUgY3V0cyDigJQgZWFjaCB+NXB4IHdpZGUg4oCUIHJ1bm5pbmcgZnJvbSB1cHBlci1yaWdodAogICAgdG8gbG93ZXItbGVmdCBhdCB+NDXCsCwgb25lIHRocm91Z2ggdGhlIHRvcCBhcmMgb2YgdGhlIHJpbmcgYW5kIG9uZQogICAgdGhyb3VnaCB0aGUgYm90dG9tIGFyYy4KICAgIFVwcGVyIGN1dDogdG9wLXJpZ2h0IHF1YWRyYW50LCBmcm9tICg1Niw2KeKGkig5NCw0NCkgYWxvbmcgdGhlIG91dGVyIGVkZ2UKICAgIExvd2VyIGN1dDogYm90dG9tLWxlZnQgcXVhZHJhbnQsIGZyb20gKDYsNTYp4oaSKDQ0LDk0KSBhbG9uZyB0aGUgb3V0ZXIgZWRnZQogIC0tPgogIDwhLS0gVXBwZXIgZGlhZ29uYWwgY3V0ICh0b3AtcmlnaHQgYXJjKSAtLT4KICA8cG9seWdvbiBwb2ludHM9IjUzLDYgNTgsNiA5NCw0MiA5NCw0NyIgZmlsbD0id2hpdGUiLz4KICA8IS0tIExvd2VyIGRpYWdvbmFsIGN1dCAoYm90dG9tLWxlZnQgYXJjKSAtLT4KICA8cG9seWdvbiBwb2ludHM9IjYsNTMgNiw1OCA0Nyw5NCA0Miw5NCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==",
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
