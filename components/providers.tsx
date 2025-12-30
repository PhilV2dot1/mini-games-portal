"use client";

import { useState, useEffect, ReactNode, createContext, useContext } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from "@/lib/wagmi";
import { initializeFarcaster } from "@/lib/farcaster";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      // Optimize for blockchain reads
      networkMode: 'online',
      gcTime: 0, // Don't cache blockchain reads globally
      staleTime: 0, // Always consider blockchain data stale
    },
  },
});

// Create context for Farcaster state
interface FarcasterContextType {
  isInFarcaster: boolean;
  isSDKReady: boolean;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isInFarcaster: false,
  isSDKReady: false,
});

export const useFarcaster = () => useContext(FarcasterContext);

export function Providers({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      // Check if in Farcaster context
      const inFC =
        typeof window !== "undefined" &&
        ((window as Window & { fc?: unknown; farcaster?: unknown }).fc !== undefined ||
          (window as Window & { fc?: unknown; farcaster?: unknown }).farcaster !== undefined ||
          document.referrer.includes("warpcast.com"));

      setIsInFarcaster(inFC);

      // ALWAYS initialize Farcaster SDK (it calls ready() to dismiss splash)
      try {
        const success = await initializeFarcaster();
        if (!success && inFC) {
          console.warn("Farcaster SDK initialization returned false");
          setInitError("SDK initialization failed");
        }
      } catch (error) {
        console.error("SDK initialization error:", error);
        if (inFC) {
          setInitError(error instanceof Error ? error.message : "Unknown error");
        }
      }

      // Always set as loaded to allow app to function
      setIsSDKLoaded(true);
    };
    load();
  }, []);

  if (!isSDKLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800">
        <div className="text-center">
          <div className="text-yellow-400 text-xl font-semibold mb-2">Loading...</div>
          <div className="text-sm text-gray-300">Initializing Celo Games Portal</div>
        </div>
      </div>
    );
  }

  return (
    <LanguageProvider>
      <FarcasterContext.Provider value={{ isInFarcaster, isSDKReady: !initError }}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
              modalSize="compact"
              theme={lightTheme({
                accentColor: '#4B5563',
                accentColorForeground: 'white',
                borderRadius: 'large',
              })}
            >
              <AuthProvider>
                {initError && isInFarcaster && (
                  <div className="bg-celo/5 border-l-4 border-celo p-3 text-xs text-yellow-700">
                    ⚠️ Farcaster SDK: {initError}
                  </div>
                )}
                {children}
              </AuthProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </FarcasterContext.Provider>
    </LanguageProvider>
  );
}
