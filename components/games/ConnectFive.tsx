/**
 * ConnectFive Component
 * Interactive Connect Five (Connect Four) game
 * Uses Design System components and animations
 */

'use client';

import { motion } from 'framer-motion';
import { useConnectFive, ROWS, COLS, Player } from '@/hooks/useConnectFive';
import { useShouldAnimate } from '@/lib/utils/motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// ========================================
// TYPES
// ========================================

interface ConnectFiveProps {
  className?: string;
}

// ========================================
// COMPONENTS
// ========================================

/**
 * Individual cell in the grid
 */
function Cell({
  player,
  isWinning,
  onClick,
  isPlayable,
}: {
  player: Player | null;
  isWinning: boolean;
  onClick: () => void;
  isPlayable: boolean;
}) {
  const shouldAnimate = useShouldAnimate();

  const cellClasses = cn(
    'relative w-full aspect-square rounded-full',
    'transition-all duration-200',
    'border-4',
    !player && 'bg-gray-100 border-gray-300',
    player === 1 && 'bg-red-500 border-red-600',
    player === 2 && 'bg-yellow-400 border-yellow-500',
    isWinning && 'ring-4 ring-white ring-opacity-80',
    isPlayable && !player && 'cursor-pointer hover:bg-gray-200'
  );

  const pieceVariants = {
    initial: { scale: 0, y: -100, opacity: 0 },
    animate: {
      scale: 1,
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 15,
        duration: 0.5,
      },
    },
    tap: { scale: 0.95 },
  };

  if (shouldAnimate && player) {
    return (
      <motion.div
        className={cellClasses}
        variants={pieceVariants}
        initial="initial"
        animate="animate"
        whileTap="tap"
      />
    );
  }

  return <div className={cellClasses} onClick={onClick} />;
}

/**
 * Column hover indicator
 */
function ColumnHover({
  currentPlayer,
  isPlayable,
}: {
  currentPlayer: Player;
  isPlayable: boolean;
}) {
  const shouldAnimate = useShouldAnimate();

  if (!isPlayable) return null;

  const hoverClasses = cn(
    'absolute -top-16 left-1/2 -translate-x-1/2',
    'w-12 h-12 rounded-full',
    'opacity-0 group-hover:opacity-100',
    'transition-opacity duration-200',
    'pointer-events-none',
    currentPlayer === 1 ? 'bg-red-500/50' : 'bg-yellow-400/50'
  );

  if (shouldAnimate) {
    return (
      <motion.div
        className={hoverClasses}
        initial={{ y: -20, opacity: 0 }}
        whileHover={{ y: 0, opacity: 1 }}
      />
    );
  }

  return <div className={hoverClasses} />;
}

// ========================================
// MAIN COMPONENT
// ========================================

export function ConnectFive({ className }: ConnectFiveProps) {
  const {
    board,
    currentPlayer,
    status,
    winner,
    winningLine,
    moveCount,
    dropPiece,
    reset,
    isColumnPlayable,
  } = useConnectFive();

  const handleColumnClick = (col: number) => {
    if (isColumnPlayable(col)) {
      dropPiece(col);
    }
  };

  const isWinningCell = (row: number, col: number): boolean => {
    if (!winningLine) return false;
    return winningLine.positions.some(([r, c]) => r === row && c === col);
  };

  return (
    <Card className={cn('max-w-2xl mx-auto', className)} padding="lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Connect Five</h2>

        {/* Status Badge */}
        {status === 'playing' && (
          <Badge variant={currentPlayer === 1 ? 'danger' : 'warning'}>
            Player {currentPlayer}&apos;s Turn
          </Badge>
        )}

        {status === 'won' && (
          <Badge variant={winner === 1 ? 'danger' : 'warning'}>
            Player {winner} Wins! 🎉
          </Badge>
        )}

        {status === 'draw' && (
          <Badge variant="secondary">
            Draw! 🤝
          </Badge>
        )}
      </div>

      {/* Game Board */}
      <div className="bg-blue-600 rounded-2xl p-4 shadow-lg mb-6">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {/* Render columns */}
          {Array.from({ length: COLS }).map((_, col) => (
            <div key={col} className="relative group">
              {/* Column hover indicator */}
              <ColumnHover
                currentPlayer={currentPlayer}
                isPlayable={isColumnPlayable(col)}
              />

              {/* Column clickable area */}
              <div
                className={cn(
                  'space-y-3 p-1 rounded-lg',
                  isColumnPlayable(col) && 'cursor-pointer hover:bg-blue-500/30'
                )}
                onClick={() => handleColumnClick(col)}
              >
                {/* Render cells in column (top to bottom) */}
                {Array.from({ length: ROWS }).map((_, row) => (
                  <Cell
                    key={`${row}-${col}`}
                    player={board[row][col]}
                    isWinning={isWinningCell(row, col)}
                    onClick={() => handleColumnClick(col)}
                    isPlayable={isColumnPlayable(col)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Moves: <span className="font-semibold">{moveCount}</span>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={reset}
          ariaLabel="Reset game"
        >
          New Game
        </Button>
      </div>

      {/* Game Instructions */}
      {status === 'playing' && moveCount === 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">How to Play:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click on a column to drop your piece</li>
            <li>• Connect 4 pieces horizontally, vertically, or diagonally to win</li>
            <li>• Player 1 (Red) goes first</li>
          </ul>
        </div>
      )}
    </Card>
  );
}

export default ConnectFive;
