"use client";

import { Position } from "@/hooks/useSnake";
import { cn } from "@/lib/utils";

const CRYPTO_ICON_URL = (symbol: string) =>
  `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@latest/svg/color/${symbol}.svg`;

interface SnakeBoardProps {
  snake: Position[];
  food: Position;
  foodSymbol: string;
  gridSize: number;
}

export function SnakeBoard({ snake, food, foodSymbol, gridSize }: SnakeBoardProps) {
  const isSnakeSegment = (x: number, y: number) => {
    return snake.some((segment) => segment.x === x && segment.y === y);
  };

  const isSnakeHead = (x: number, y: number) => {
    return snake[0].x === x && snake[0].y === y;
  };

  const isFood = (x: number, y: number) => {
    return food.x === x && food.y === y;
  };

  const getCellClass = (x: number, y: number) => {
    if (isSnakeHead(x, y)) {
      return "bg-gradient-to-br from-green-600 to-green-700 border-green-800 shadow-lg";
    }
    if (isSnakeSegment(x, y)) {
      return "bg-gradient-to-br from-green-400 to-green-500 border-green-600";
    }
    if (isFood(x, y)) {
      return "bg-white border-yellow-400 shadow-lg animate-pulse flex items-center justify-center";
    }
    return "bg-gray-100 border-gray-200";
  };

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-4 shadow-2xl border-4 border-chain">
      <div
        className="grid gap-0.5 bg-gray-300 p-0.5 rounded-lg"
        data-testid="snake-board"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          aspectRatio: "1/1",
        }}
      >
        {Array.from({ length: gridSize }).map((_, y) =>
          Array.from({ length: gridSize }).map((_, x) => (
            <div
              key={`${x}-${y}`}
              className={cn(
                "aspect-square rounded-sm border transition-all duration-100",
                getCellClass(x, y)
              )}
            >
              {isFood(x, y) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={CRYPTO_ICON_URL(foodSymbol)}
                  alt={foodSymbol.toUpperCase()}
                  className="w-full h-full object-contain p-px"
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
