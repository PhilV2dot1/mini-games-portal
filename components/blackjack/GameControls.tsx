import type { GamePhase } from "@/hooks/useBlackjack";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface GameControlsProps {
  onHit: () => void;
  onStand: () => void;
  onNewGame: () => void;
  onPlayOnChain: () => void;
  gamePhase: GamePhase;
  mode: 'free' | 'onchain';
  disabled: boolean;
}

export function GameControls({
  onHit,
  onStand,
  onNewGame,
  onPlayOnChain,
  gamePhase,
  mode,
  disabled
}: GameControlsProps) {
  const { t } = useLanguage();

  // Show play buttons when in playing phase (both modes)
  const showPlayButtons = gamePhase === 'playing';

  // Show new game button when finished or in betting phase (both modes)
  const showNewGameButton = gamePhase === 'finished' || gamePhase === 'betting';

  // Show play on-chain button label when in betting phase and on-chain mode
  const showOnChainButton = false; // Replaced by unified newGame button

  // Show play again button when finished in on-chain mode
  const showPlayAgainButton = false; // Replaced by unified newGame button

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mt-3 sm:mt-6">
      {showPlayButtons && (
        <>
          <button
            onClick={onHit}
            disabled={disabled}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white/90 hover:bg-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-gray-900 rounded-xl font-bold text-base sm:text-lg shadow-lg border-2 border-gray-300 dark:border-gray-500 hover:border-chain disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 min-w-[100px] sm:min-w-[120px]"
          >
            {t('games.blackjack.hit')}
          </button>
          <button
            onClick={onStand}
            disabled={disabled}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white/90 hover:bg-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-gray-900 rounded-xl font-bold text-base sm:text-lg shadow-lg border-2 border-gray-300 dark:border-gray-500 hover:border-chain disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 min-w-[100px] sm:min-w-[120px]"
          >
            {t('games.blackjack.stand')}
          </button>
        </>
      )}

      {showNewGameButton && (
        <button
          onClick={mode === 'onchain' ? onPlayOnChain : onNewGame}
          disabled={disabled}
          className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-chain to-chain hover:brightness-110 text-gray-900 rounded-xl font-bold text-base sm:text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 min-w-[120px] sm:min-w-[140px]"
        >
          {mode === 'onchain'
            ? (gamePhase === 'finished' ? t('games.blackjack.playAgain') : t('games.blackjack.playOnChain'))
            : t('games.blackjack.newGame')}
        </button>
      )}
    </div>
  );
}
