import { motion } from "framer-motion";
import { TileValue, TILE_COLORS } from "@/lib/games/2048-logic";

interface TileProps {
  value: TileValue;
}

export function Tile({ value }: TileProps) {
  const colors = TILE_COLORS[value];

  if (value === 0) {
    return (
      <div
        className="rounded-lg"
        style={{
          backgroundColor: colors.bgColor,
        }}
      />
    );
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="rounded-lg flex items-center justify-center font-black text-center select-none"
      style={{
        background: colors.gradient || colors.bgColor,
        color: colors.textColor,
        boxShadow: colors.shadow,
        fontSize: value >= 1024 ? '1.75rem' : value >= 128 ? '2rem' : '2.5rem',
      }}
    >
      {value}
    </motion.div>
  );
}
