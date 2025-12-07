"use client";

import { motion } from "framer-motion";
import { Color, COLOR_CONFIG } from "@/lib/games/mastermind-logic";

interface ColorPegProps {
  color: Color | null;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  showEmpty?: boolean;
}

export function ColorPeg({ color, size = 'medium', onClick, showEmpty = true }: ColorPegProps) {
  const sizeClasses = {
    small: 'w-6 h-6 sm:w-8 sm:h-8',
    medium: 'w-9 h-9 sm:w-11 sm:h-11',
    large: 'w-11 h-11 sm:w-14 sm:h-14',
  };

  if (!color && !showEmpty) return null;

  const config = color ? COLOR_CONFIG[color] : null;

  return (
    <motion.button
      whileHover={onClick ? { scale: 1.1 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      onClick={onClick}
      disabled={!onClick}
      className={`${sizeClasses[size]} rounded-full border-2 sm:border-4 ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={{
        backgroundColor: config?.bg || 'rgba(255, 255, 255, 0.2)',
        borderColor: config?.border || 'rgba(255, 255, 255, 0.4)',
        boxShadow: config ? `0 4px 12px ${config.shadow}` : 'none',
      }}
    />
  );
}
