'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { celo, base } from 'wagmi/chains';
import { isSupportedChain, getChainName, CHAIN_CONFIG } from '@/lib/contracts/addresses';

const PREFERRED_CHAIN_KEY = 'mini_games_preferred_chain';
const CHAIN_CHANGE_EVENT = 'mini_games_chain_change';

function getStoredChainId(): number {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(PREFERRED_CHAIN_KEY);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (parsed === celo.id || parsed === base.id) {
        return parsed;
      }
    }
  }
  return celo.id;
}

/**
 * Hook for multichain support.
 * When a wallet is connected, uses the wallet's active chain.
 * When disconnected, uses a localStorage-backed preferred chain (default: Celo).
 * This allows users to browse game pages on Base/Celo without connecting a wallet.
 *
 * Uses a custom DOM event to sync all hook instances when the preferred chain changes,
 * so components like ChainThemeProvider update immediately.
 */
export function useChainSelector() {
  const { chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  // Preferred chain for disconnected state
  const [preferredChainId, setPreferredChainId] = useState<number>(getStoredChainId);

  // Listen for chain change events from other hook instances
  useEffect(() => {
    const handler = (e: Event) => {
      const chainId = (e as CustomEvent<number>).detail;
      setPreferredChainId(chainId);
    };
    window.addEventListener(CHAIN_CHANGE_EVENT, handler);
    return () => window.removeEventListener(CHAIN_CHANGE_EVENT, handler);
  }, []);

  // Sync preferred chain when wallet chain changes
  useEffect(() => {
    if (isConnected && chain?.id && isSupportedChain(chain.id)) {
      setPreferredChainId(chain.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PREFERRED_CHAIN_KEY, String(chain.id));
      }
    }
  }, [isConnected, chain?.id]);

  // Active chain: wallet chain if connected, preferred chain otherwise
  const currentChainId = isConnected ? chain?.id : preferredChainId;
  const isSupported = currentChainId ? isSupportedChain(currentChainId) : false;
  const currentChainName = currentChainId ? getChainName(currentChainId) : null;

  const switchToChain = useCallback(
    (chainId: number) => {
      // Always persist preference and notify all hook instances
      setPreferredChainId(chainId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PREFERRED_CHAIN_KEY, String(chainId));
        window.dispatchEvent(new CustomEvent(CHAIN_CHANGE_EVENT, { detail: chainId }));
      }

      // If wallet connected, also switch the wallet chain
      if (isConnected && switchChain) {
        switchChain(
          { chainId },
          {
            onSuccess: () => {
              const name = getChainName(chainId);
              console.log(`Switched to ${name} network`);
            },
            onError: (error) => {
              console.error(`Failed to switch network:`, error);
            },
          }
        );
      }
    },
    [isConnected, switchChain]
  );

  const switchToCelo = useCallback(() => switchToChain(celo.id), [switchToChain]);
  const switchToBase = useCallback(() => switchToChain(base.id), [switchToChain]);

  return {
    currentChain: chain,
    currentChainId,
    currentChainName,
    currentChainConfig: currentChainName ? CHAIN_CONFIG[currentChainName] : null,
    isSupportedChain: isSupported,
    isOnCelo: currentChainId === celo.id,
    isOnBase: currentChainId === base.id,
    isConnected,
    switchToChain,
    switchToCelo,
    switchToBase,
  };
}
