interface GameControlsProps {
  timer: number;
  hintsRemaining: number;
  formatTime: (seconds: number) => string;
}

export function GameControls({ timer, hintsRemaining, formatTime }: GameControlsProps) {
  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-xl p-4 shadow-lg border-2 border-gray-300">
      <div className="grid grid-cols-2 gap-4">
        {/* Timer */}
        <div className="flex flex-col items-center">
          <div className="text-2xl mb-1" role="img" aria-label="Timer">
            ⏱️
          </div>
          <div className="text-xl font-mono font-bold text-gray-900" aria-live="polite">
            {formatTime(timer)}
          </div>
          <div className="text-xs text-gray-600">Time</div>
        </div>

        {/* Hints Remaining */}
        <div className="flex flex-col items-center">
          <div className="text-2xl mb-1" role="img" aria-label="Hints">
            💡
          </div>
          <div className="text-xl font-bold text-gray-900" aria-live="polite">
            {hintsRemaining} / 3
          </div>
          <div className="text-xs text-gray-600">Hints</div>
        </div>
      </div>
    </div>
  );
}
