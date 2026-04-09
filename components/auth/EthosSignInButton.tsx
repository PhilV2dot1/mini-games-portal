'use client';

import { useState, useEffect } from 'react';
import { EthosAuthModal } from '@thebbz/siwe-ethos-react';
import type { AuthResult } from '@thebbz/siwe-ethos-react';
import { supabase } from '@/lib/supabase/client';
import { EthosLogo } from '@/components/auth/EthosScoreBadge';

interface EthosSignInButtonProps {
  label: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function EthosSignInButton({ label, disabled, onSuccess, onError }: EthosSignInButtonProps) {
  const [authServerUrl, setAuthServerUrl] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setAuthServerUrl(window.location.origin);
  }, []);

  if (!authServerUrl) return null;

  const handleSuccess = async (result: AuthResult) => {
    setIsOpen(false);
    try {
      const walletAddress = result.user?.walletAddress;
      if (!walletAddress) {
        onError?.('No wallet address returned from Ethos');
        return;
      }

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

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (sessionError) {
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
    <>
      {/* Custom styled button matching Google/Twitter/Discord buttons */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
        style={{ backgroundColor: '#6366f1' }}
        onMouseEnter={e => { if (!disabled) (e.currentTarget.style.backgroundColor = '#4f46e5'); }}
        onMouseLeave={e => { (e.currentTarget.style.backgroundColor = '#6366f1'); }}
      >
        <EthosLogo className="w-5 h-5 text-white flex-shrink-0" />
        {label}
      </button>

      {/* SDK modal handles the actual auth flow */}
      <EthosAuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
        onError={(err) => {
          const code = (err as { code?: string })?.code;
          const msg = code === 'unknown_error' || code === 'verify_error'
            ? 'Ethos authentication failed. Make sure your wallet has an Ethos profile at ethos.network.'
            : (err?.message || 'Authentication error');
          onError?.(msg);
        }}
        authServerUrl={authServerUrl}
      />
    </>
  );
}
