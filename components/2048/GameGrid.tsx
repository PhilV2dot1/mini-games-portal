import { Grid } from "@/lib/games/2048-logic";
import { Tile } from "./Tile";
import { motion } from "framer-motion";

interface GameGridProps {
  grid: Grid;
}

export function GameGrid({ grid }: GameGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full mx-auto"
    >
      <div
        className="grid grid-cols-4 gap-3 p-4 bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border-2 border-gray-700"
        style={{ boxShadow: '0 0 0 6px #FCFF52, 0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      >
        {grid.map((row, rowIndex) =>
          row.map((value, colIndex) => (
            <Tile
              key={`${rowIndex}-${colIndex}`}
              value={value}
              row={rowIndex}
              col={colIndex}
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
