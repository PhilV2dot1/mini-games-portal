import { createConfig, http, cookieStorage, createStorage } from "wagmi";
import { celo, base } from "wagmi/chains";
import { farcasterMiniApp } from "@farcaster/miniapp-wagmi-connector";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const celoRpcUrl = "https://forno.celo.org";
const baseRpcUrl = "https://mainnet.base.org";

function getAppUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
}

// WalletConnect project ID - get one from https://cloud.walletconnect.com
// Without a valid project ID, WalletConnect and Coinbase Wallet will not work
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

export const config = createConfig({
  chains: [celo, base],
  connectors: [
    // Farcaster Mini App connector (only active inside Farcaster/Warpcast)
    farcasterMiniApp(),
    // Injected wallet: auto-detects MetaMask, Rabby, Trust Wallet, Brave, etc.
    // This must come before specific connectors to avoid provider conflicts
    injected(),
    // Coinbase Wallet / Base Wallet - important for Base chain users
    coinbaseWallet({
      appName: "Mini Games Portal",
      appLogoUrl: `${getAppUrl()}/icon.png`,
    }),
    // WalletConnect - QR code scanning for mobile wallets
    ...(walletConnectProjectId ? [walletConnect({
      projectId: walletConnectProjectId,
      metadata: {
        name: "Mini Games Portal",
        description: "Play 12 mini-games on Celo & Base! Blackjack, RPS, TicTacToe, Solitaire, and more.",
        url: getAppUrl(),
        icons: [`${getAppUrl()}/icon.png`],
      },
      showQrModal: true,
    })] : []),
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
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});
