import React from "react";
import { Button } from "@/components/ui/Button";
import { GameStatus } from "@/hooks/useSolitaire";

interface GameControlsProps {
  status: GameStatus;
  canUndo: boolean;
  canAutoComplete: boolean;
  onStart: () => void;
  onReset: () => void;
  onUndo: () => void;
  onAutoComplete: () => void;
}

export function GameControls({
  status,
  canUndo,
  canAutoComplete,
  onStart,
  onReset,
  onUndo,
  onAutoComplete,
}: GameControlsProps) {
  return (
    <div className="flex gap-3 justify-center">
      {/* Start/Reset Button */}
      {status === "idle" ? (
        <Button
          onClick={onStart}
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white px-8"
        >
          Start Game
        </Button>
      ) : (
        <Button
          onClick={onReset}
          size="lg"
          variant="outline"
          className="px-8"
          disabled={status === "processing"}
        >
          Reset Game
        </Button>
      )}

      {/* Undo Button */}
      <Button
        onClick={onUndo}
        size="lg"
        variant="outline"
        disabled={!canUndo || status !== "playing"}
        className="px-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Undo
      </Button>

      {/* Auto-Complete Button */}
      <Button
        onClick={onAutoComplete}
        size="lg"
        variant="outline"
        disabled={!canAutoComplete || status !== "playing"}
        className="px-6"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Auto-Complete
      </Button>
    </div>
  );
}
