"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useAuth } from "@/components/auth/AuthProvider";

interface MatchmakingButtonProps {
  onFindMatch: (mode: 'ranked' | 'casual') => Promise<void>;
  onCreatePrivate: () => Promise<string>;
  isSearching: boolean;
  onCancel: () => void;
  disabled?: boolean;
  onJoinByCode?: () => void;
}

export function MatchmakingButton({
  onFindMatch,
  onCreatePrivate,
  isSearching,
  onCancel,
  disabled = false,
  onJoinByCode,
}: MatchmakingButtonProps) {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [showOptions, setShowOptions] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          {t('multiplayer.signInRequired') || 'Sign in to play multiplayer'}
        </p>
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
          <span>{t('multiplayer.searching') || 'Searching for opponent...'}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
        >
          {t('common.cancel') || 'Cancel'}
        </Button>
      </div>
    );
  }

  if (showOptions) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl border-2 border-gray-300 dark:border-gray-600 shadow-lg">
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-2">
          {t('multiplayer.selectMode') || 'Select game mode'}
        </p>

        <Button
          variant="celo"
          size="lg"
          onClick={() => {
            setShowOptions(false);
            onFindMatch('ranked');
          }}
          disabled={disabled}
          className="w-full"
        >
          <span className="text-lg mr-2">🏆</span>
          {t('multiplayer.ranked') || 'Ranked Match'}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            setShowOptions(false);
            onFindMatch('casual');
          }}
          disabled={disabled}
          className="w-full"
        >
          <span className="text-lg mr-2">🎮</span>
          {t('multiplayer.casual') || 'Casual Match'}
        </Button>

        <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

        <Button
          variant="outline"
          size="md"
          onClick={async () => {
            setShowOptions(false);
            await onCreatePrivate();
          }}
          disabled={disabled}
          className="w-full"
        >
          <span className="text-lg mr-2">🔒</span>
          {t('multiplayer.createPrivate') || 'Create Private Room'}
        </Button>

        {onJoinByCode && (
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setShowOptions(false);
              onJoinByCode();
            }}
            disabled={disabled}
            className="w-full"
          >
            <span className="text-lg mr-2">🔑</span>
            {t('multiplayer.haveCode') || 'Join with Room Code'}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowOptions(false)}
          className="mt-1"
        >
          {t('common.back') || 'Back'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        variant="celo"
        size="lg"
        onClick={() => setShowOptions(true)}
        disabled={disabled}
        className="px-8"
      >
        <span className="text-lg mr-2">👥</span>
        {t('multiplayer.play') || 'Play Multiplayer'}
      </Button>
      {onJoinByCode && (
        <button
          onClick={onJoinByCode}
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-chain dark:hover:text-chain underline"
        >
          {t('multiplayer.haveCode') || 'Have a room code? Join here'}
        </button>
      )}
    </div>
  );
}

export default MatchmakingButton;
