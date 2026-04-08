'use client';

import { useState, useEffect } from 'react';
import { SignInWithEthosButton } from '@thebbz/siwe-ethos-react';
import type { AuthResult } from '@thebbz/siwe-ethos-react';
import { supabase } from '@/lib/supabase/client';

interface EthosSignInButtonProps {
  label: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function EthosSignInButton({ label, disabled, onSuccess, onError }: EthosSignInButtonProps) {
  const [authServerUrl, setAuthServerUrl] = useState<string | null>(null);

  useEffect(() => {
    // Pass just the origin — SDK appends /api/auth/nonce, /api/auth/wallet/verify, etc.
    // Those routes proxy to ethos.thebbz.xyz server-side to avoid CORS
    setAuthServerUrl(window.location.origin);
  }, []);

  // Don't render until client-side URL is ready (avoids using direct Ethos URL which blocks due to CORS)
  if (!authServerUrl) return null;

  const handleSuccess = async (result: AuthResult) => {
    try {
      const walletAddress = result.user?.walletAddress;
      if (!walletAddress) {
        onError?.('No wallet address returned from Ethos');
        return;
      }

      // Exchange Ethos auth for a Supabase session
      const res = await fetch('/api/auth/ethos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          ethosUsername: result.user?.name,
          ethosScore: result.user?.ethosScore,
          ethosPicture: result.user?.picture,
        }),
      });

      const data = await res.json();

      if (!data.success || !data.access_token) {
        onError?.(data.error || 'Authentication failed');
        return;
      }

      // Set the session directly from the tokens returned by the server
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
        console.error('Session error:', sessionError);
        onError?.(sessionError.message);
        return;
      }

      onSuccess?.();
    } catch (err) {
      console.error('Ethos sign in error:', err);
      onError?.('Sign in failed');
    }
  };

  return (
    <SignInWithEthosButton
      authServerUrl={authServerUrl}
      onSuccess={handleSuccess}
      onError={(err) => {
        const code = (err as { code?: string })?.code;
        const msg = code === 'unknown_error' || code === 'verify_error'
          ? 'Ethos authentication failed. Make sure your wallet has an Ethos profile at ethos.network.'
          : (err?.message || 'Authentication error');
        onError?.(msg);
      }}
      disabled={disabled}
      className="w-full"
    >
      {label}
    </SignInWithEthosButton>
  );
}
