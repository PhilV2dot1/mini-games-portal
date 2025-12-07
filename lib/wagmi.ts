import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { celo } from "wagmi/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { injected, metaMask, walletConnect } from "wagmi/connectors";

const celoRpcUrl = "https://forno.celo.org";

function getAppUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
}

// WalletConnect project ID (you can get one from https://cloud.walletconnect.com)
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'a01e2f3b4c5d6e7f8a9b0c1d2e3f4a5b';

export const config = createConfig({
  chains: [celo],
  connectors: [
    farcasterMiniApp(),
    walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: "Celo Games Portal",
        description: "Play 6 mini-games on Celo blockchain! Blackjack, RPS, TicTacToe, Jackpot, 2048, and Mastermind.",
        url: getAppUrl(),
        icons: [`${getAppUrl()}/icon.png`],
      },
      showQrModal: true,
    }),
    metaMask({
      dappMetadata: {
        name: "Celo Games Portal",
        url: getAppUrl(),
      },
    }),
    injected({
      target: () => ({
        id: "injected",
        name: "Browser Wallet",
        provider: typeof window !== "undefined" ? window.ethereum : undefined,
      }),
    }),
  ],
  transports: {
    [celo.id]: http(celoRpcUrl, {
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
