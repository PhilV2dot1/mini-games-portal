"use client";

import { useState, useEffect, ReactNode, createContext, useContext } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { config } from "@/lib/wagmi";
import { initializeFarcaster } from "@/lib/farcaster";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { AudioProvider } from "@/lib/audio/AudioContext";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { ToastProvider } from "@/components/ui/Toast";
import { ChainThemeProvider } from "@/components/shared/ChainThemeProvider";
import { NotificationProvider } from "@/lib/notifications/NotificationContext";
import { OnboardingModal } from "@/components/shared/OnboardingModal";
import { BottomNav } from "@/components/layout/BottomNav";

import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      networkMode: 'online',
      gcTime: 1000 * 60 * 5,  // keep cache 5 min
      staleTime: 1000 * 30,   // data fresh for 30s
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
  const [isInFarcaster, setIsInFarcaster] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Fire-and-forget — never blocks render
    const inFC =
      typeof window !== "undefined" &&
      ((window as Window & { fc?: unknown; farcaster?: unknown }).fc !== undefined ||
        (window as Window & { fc?: unknown; farcaster?: unknown }).farcaster !== undefined ||
        document.referrer.includes("warpcast.com"));

    setIsInFarcaster(inFC);

    initializeFarcaster().then((success) => {
      if (!success && inFC) setInitError("SDK initialization failed");
    }).catch((error) => {
      if (inFC) setInitError(error instanceof Error ? error.message : "Unknown error");
    });
  }, []);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AudioProvider>
          <FarcasterContext.Provider value={{ isInFarcaster, isSDKReady: !initError }}>
          <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
              modalSize="wide"
              theme={lightTheme({
                accentColor: '#4B5563',
                accentColorForeground: 'white',
                borderRadius: 'large',
              })}
            >
              <AuthProvider>
                <ChainThemeProvider>
                  <ToastProvider>
                    <NotificationProvider>
                      {initError && isInFarcaster && (
                        <div className="bg-chain/5 border-l-4 border-chain p-3 text-xs text-yellow-700">
                          ⚠️ Farcaster SDK: {initError}
                        </div>
                      )}
                      {children}
                      <OnboardingModal />
                      <BottomNav />
                    </NotificationProvider>
                  </ToastProvider>
                </ChainThemeProvider>
              </AuthProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
          </FarcasterContext.Provider>
        </AudioProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
