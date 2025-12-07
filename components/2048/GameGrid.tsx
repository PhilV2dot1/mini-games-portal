import { Grid } from "@/lib/games/2048-logic";
import { Tile } from "./Tile";

interface GameGridProps {
  grid: Grid;
}

export function GameGrid({ grid }: GameGridProps) {
  return (
    <div className="bg-gray-300 p-4 rounded-xl shadow-2xl" style={{ border: '5px solid #FCFF52' }}>
      <div className="grid grid-cols-4 gap-4 w-full max-w-xl mx-auto aspect-square">
        {grid.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <Tile
              key={`${rowIndex}-${colIndex}`}
              value={value}
            />
          ))
        )}
      </div>
    </div>
  );
}
