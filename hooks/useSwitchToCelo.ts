import { useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { celo } from 'wagmi/chains';

/**
 * Hook to automatically switch to Celo network when connected but on wrong chain
 * This ensures all on-chain interactions happen on Celo
 */
export function useSwitchToCelo() {
  const { chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    // If user is connected but not on Celo, automatically switch
    if (isConnected && chain && chain.id !== celo.id && switchChain) {
      console.log(`Wrong network detected: ${chain.name} (${chain.id}). Switching to Celo...`);

      switchChain(
        { chainId: celo.id },
        {
          onSuccess: () => {
            console.log('Successfully switched to Celo network');
          },
          onError: (error) => {
            console.error('Failed to switch to Celo network:', error);
          },
        }
      );
    }
  }, [isConnected, chain, switchChain]);

  return {
    isOnCelo: chain?.id === celo.id,
    currentChain: chain,
    isSwitching: isConnected && chain?.id !== celo.id,
  };
}
