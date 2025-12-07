import type { GamePhase } from "@/hooks/useBlackjack";

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
  // Show play buttons when in playing phase (free mode only)
  const showPlayButtons = gamePhase === 'playing' && mode === 'free';

  // Show new game button when finished or in betting phase
  const showNewGameButton = (gamePhase === 'finished' || gamePhase === 'betting') && mode === 'free';

  // Show play on-chain button when in betting phase and on-chain mode
  const showOnChainButton = gamePhase === 'betting' && mode === 'onchain';

  // Show play again button when finished in on-chain mode
  const showPlayAgainButton = gamePhase === 'finished' && mode === 'onchain';

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mt-3 sm:mt-6">
      {showPlayButtons && (
        <>
          <button
            onClick={onHit}
            disabled={disabled}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white/90 hover:bg-white text-gray-900 rounded-xl font-bold text-base sm:text-lg shadow-lg border-2 border-gray-300 hover:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 min-w-[100px] sm:min-w-[120px]"
            style={{
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}
          >
            HIT
          </button>
          <button
            onClick={onStand}
            disabled={disabled}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white/90 hover:bg-white text-gray-900 rounded-xl font-bold text-base sm:text-lg shadow-lg border-2 border-gray-300 hover:border-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 min-w-[100px] sm:min-w-[120px]"
            style={{
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
            }}
          >
            STAND
          </button>
        </>
      )}

      {showNewGameButton && (
        <button
          onClick={onNewGame}
          className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95 min-w-[120px] sm:min-w-[140px]"
          style={{
            boxShadow: "0 0 0 2px #FCFF52, 0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}
        >
          NEW GAME
        </button>
      )}

      {showOnChainButton && (
        <button
          onClick={onPlayOnChain}
          disabled={disabled}
          className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 rounded-xl font-bold text-base sm:text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 min-w-[140px] sm:min-w-[160px]"
          style={{
            boxShadow: "0 0 0 2px #FCFF52, 0 10px 15px -3px rgba(0, 0, 0, 0.2)"
          }}
        >
          PLAY ON-CHAIN
        </button>
      )}

      {showPlayAgainButton && (
        <button
          onClick={onPlayOnChain}
          disabled={disabled}
          className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 rounded-xl font-bold text-base sm:text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 min-w-[120px] sm:min-w-[140px]"
          style={{
            boxShadow: "0 0 0 2px #FCFF52, 0 10px 15px -3px rgba(0, 0, 0, 0.2)"
          }}
        >
          PLAY AGAIN
        </button>
      )}
    </div>
  );
}
