"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { motion } from "framer-motion";
import { useFarcaster } from "../providers";
import { useSwitchToCelo } from "@/hooks/useSwitchToCelo";
import { Button } from "@/components/ui/Button";

const CONNECTOR_ICONS: Record<string, string> = {
  "Farcaster Wallet": "🔵",
  "WalletConnect": "🔗",
  "MetaMask": "🦊",
  "Browser Wallet": "💼",
};

const CONNECTOR_DESCRIPTIONS: Record<string, string> = {
  "Farcaster Wallet": "Connect with your Farcaster wallet",
  "WalletConnect": "Connect with any mobile wallet",
  "MetaMask": "Connect with MetaMask",
  "Browser Wallet": "Connect with your browser wallet",
};

export function WalletConnect() {
  const { address, isConnected, connector: activeConnector } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { isInFarcaster, isSDKReady } = useFarcaster();

  // Automatically switch to Celo network when connected
  const { isOnCelo, isSwitching } = useSwitchToCelo();

  // Filter connectors based on context
  const availableConnectors = connectors.filter((connector) => {
    // If not in Farcaster, hide Farcaster connector
    if (connector.name === "Farcaster Wallet" && !isInFarcaster) {
      return false;
    }
    return true;
  });

  if (isConnected && address) {
    return (
      <div className="space-y-2">
        {/* Switching Network Warning */}
        {isSwitching && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-celo/10 border-2 border-celo rounded-xl p-3 flex items-center gap-3"
          >
            <div className="w-4 h-4 border-2 border-celo border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-gray-900">
              Switching to Celo network...
            </span>
          </motion.div>
        )}

        {/* Connected Wallet Display */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-celo/30 to-gray-100 border-2 border-celo rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isOnCelo ? 'bg-green-500' : 'bg-orange-500'}`} />
            <div className="flex flex-col">
              <span className="font-mono text-sm font-semibold text-gray-800">
                {address.slice(0, 6)}...{address.slice(-4)}
              </span>
              {activeConnector && (
                <span className="text-xs text-gray-600">
                  via {activeConnector.name}
                </span>
              )}
            </div>
          </div>
          <Button
            onClick={() => disconnect()}
            variant="primary"
            size="sm"
            ariaLabel="Disconnect wallet"
          >
            Disconnect
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-celo rounded-xl p-4">
      <p className="text-sm sm:text-base mb-3 text-center text-white font-semibold">
        Connect your wallet to play on-chain
      </p>

      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-lg text-xs text-red-700">
          {error.message}
        </div>
      )}

      {isInFarcaster && !isSDKReady && (
        <div className="mb-3 p-2 bg-celo/10 border border-celo/30 rounded-lg text-xs text-gray-900">
          Farcaster SDK not ready. Some features may not work.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {availableConnectors.map((connector) => {
          const icon = CONNECTOR_ICONS[connector.name] || "🔗";
          const description = CONNECTOR_DESCRIPTIONS[connector.name] || `Connect with ${connector.name}`;

          return (
            <Button
              key={connector.uid}
              variant="celo"
              size="lg"
              fullWidth
              onClick={() => connect({ connector })}
              disabled={isPending}
              loading={isPending}
              ariaLabel={description}
              leftIcon={!isPending ? <span className="text-xl">{icon}</span> : undefined}
              className="flex-col gap-1 min-h-[56px]"
            >
              {!isPending && (
                <>
                  <span>{connector.name}</span>
                  <span className="text-xs text-gray-700">{description}</span>
                </>
              )}
            </Button>
          );
        })}
      </div>

      {availableConnectors.length === 0 && (
        <div className="text-center text-sm text-gray-300 py-4">
          No wallet connectors available
        </div>
      )}
    </div>
  );
}
