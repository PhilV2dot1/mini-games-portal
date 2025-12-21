'use client';

import { useAccount, useSignMessage } from 'wagmi';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { setUser } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async () => {
    if (!address || !isConnected) {
      setError('No wallet connected');
      return false;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      // Create message to sign
      const message = `Sign this message to authenticate with Celo Games Portal.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;

      // Request signature from user
      const signature = await signMessageAsync({ message });

      // Call authentication API
      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          signature,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Update AuthProvider with user data
      if (data.user) {
        setUser(data.user);
      }

      return true;
    } catch (err) {
      console.error('Wallet authentication error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [address, isConnected, signMessageAsync, setUser]);

  // Auto-authenticate when wallet connects
  useEffect(() => {
    if (isConnected && address && !isAuthenticating) {
      authenticate();
    }
  }, [isConnected, address]); // Note: intentionally not including authenticate to avoid loops

  return {
    authenticate,
    isAuthenticating,
    error,
    isConnected,
    address,
  };
}
