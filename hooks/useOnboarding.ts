'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useAccount } from 'wagmi';

interface UseOnboardingReturn {
  showOnboarding: boolean;
  xpJustAwarded: number | null;
  completeOnboarding: () => Promise<void>;
}

/**
 * Detects if the current user needs onboarding and provides a completeOnboarding() function.
 * Shows onboarding modal once per user (idempotent on backend).
 */
export function useOnboarding(): UseOnboardingReturn {
  const { user, isAuthenticated } = useAuth();
  const { address: walletAddress } = useAccount();
  const [userId, setUserId] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [xpJustAwarded, setXpJustAwarded] = useState<number | null>(null);
  const checkedRef = useRef(false);

  // Resolve userId
  useEffect(() => {
    if (user?.id) { setUserId(user.id); return; }
    if (walletAddress) {
      fetch(`/api/user/profile?wallet=${walletAddress.toLowerCase()}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.user?.id) setUserId(d.user.id); })
        .catch(() => {});
    }
  }, [user?.id, walletAddress]);

  // Check if onboarding is needed
  useEffect(() => {
    if (!userId || checkedRef.current) return;
    checkedRef.current = true;

    fetch(`/api/user/onboarding?userId=${userId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && !data.onboardingCompleted) {
          setShowOnboarding(true);
        }
      })
      .catch(() => {});
  }, [userId]);

  const completeOnboarding = async () => {
    if (!userId) return;

    setShowOnboarding(false);

    try {
      const res = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (!data.alreadyCompleted && data.xpAwarded > 0) {
          setXpJustAwarded(data.xpAwarded);
          setTimeout(() => setXpJustAwarded(null), 5000);
        }
      }
    } catch (err) {
      console.error('[useOnboarding] complete error:', err);
    }
  };

  return { showOnboarding, xpJustAwarded, completeOnboarding };
}
