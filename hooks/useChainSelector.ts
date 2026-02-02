'use client';

import { useCallback, useState, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { celo, base } from 'wagmi/chains';
import { isSupportedChain, getChainName, CHAIN_CONFIG } from '@/lib/contracts/addresses';

const PREFERRED_CHAIN_KEY = 'mini_games_preferred_chain';

/**
 * Hook for multichain support.
 * When a wallet is connected, uses the wallet's active chain.
 * When disconnected, uses a localStorage-backed preferred chain (default: Celo).
 * This allows users to browse game pages on Base/Celo without connecting a wallet.
 */
export function useChainSelector() {
  const { chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  // Preferred chain for disconnected state
  const [preferredChainId, setPreferredChainId] = useState<number>(celo.id);

  // Load preferred chain from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PREFERRED_CHAIN_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed === celo.id || parsed === base.id) {
          setPreferredChainId(parsed);
        }
      }
    }
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
      // Always persist preference
      setPreferredChainId(chainId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(PREFERRED_CHAIN_KEY, String(chainId));
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
