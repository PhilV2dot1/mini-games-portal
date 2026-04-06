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
        }),
      });

      const data = await res.json();

      if (!data.success || !data.token) {
        onError?.(data.error || 'Authentication failed');
        return;
      }

      // Use the hashed token to verify OTP and get a real Supabase session
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: 'magiclink',
      });

      if (otpError) {
        console.error('OTP verify error:', otpError);
        onError?.(otpError.message);
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
