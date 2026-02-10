"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";

// Dice dot positions (percentage based)
const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

// Rotation to show each face (front=1, back=6, right=3, left=4, top=2, bottom=5)
const FACE_ROTATIONS: Record<number, { rotateX: number; rotateY: number }> = {
  1: { rotateX: 0, rotateY: 0 },      // Front
  2: { rotateX: -90, rotateY: 0 },    // Top
  3: { rotateX: 0, rotateY: -90 },    // Right
  4: { rotateX: 0, rotateY: 90 },     // Left
  5: { rotateX: 90, rotateY: 0 },     // Bottom
  6: { rotateX: 0, rotateY: 180 },    // Back
};

interface DiceFaceProps {
  value: number;
  transform: string;
  isHeld: boolean;
}

function DiceFace({ value, transform, isHeld }: DiceFaceProps) {
  const positions = DOT_POSITIONS[value] || [];

  return (
    <div
      className="absolute w-full h-full rounded-lg backface-visible"
      style={{
        transform,
        backfaceVisibility: "hidden",
        background: isHeld
          ? "linear-gradient(145deg, #ffd700, #f59e0b)"
          : "linear-gradient(145deg, #ffffff, #e5e7eb)",
        boxShadow: "inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -2px 4px rgba(0,0,0,0.1)",
        border: isHeld ? "2px solid #d97706" : "1px solid rgba(0,0,0,0.1)",
      }}
    >
      {positions.map(([x, y], i) => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle at 35% 35%, #374151, #111827)",
            boxShadow: "inset -1px -1px 2px rgba(0,0,0,0.6), inset 1px 1px 1px rgba(255,255,255,0.1)",
          }}
        />
      ))}
    </div>
  );
}

interface Dice3DProps {
  value: number;
  isHeld: boolean;
  isRolling: boolean;
  onToggleHold: () => void;
  disabled: boolean;
  index: number;
}

export function Dice3D({ value, isHeld, isRolling, onToggleHold, disabled, index }: Dice3DProps) {
  const size = 64; // Base size in pixels (w-16 h-16)
  const halfSize = size / 2;

  // Generate random rotation for rolling animation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rollRotation = useMemo(() => ({
    rotateX: Math.floor(Math.random() * 4 + 2) * 360, // 2-5 full rotations
    rotateY: Math.floor(Math.random() * 4 + 2) * 360,
  }), [isRolling]); // isRolling triggers new random values intentionally

  // Final rotation to show the correct face
  const finalRotation = FACE_ROTATIONS[value] || FACE_ROTATIONS[1];

  return (
    <motion.button
      data-testid={`die-${index}`}
      onClick={!disabled ? onToggleHold : undefined}
      disabled={disabled}
      className={cn(
        "relative",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      )}
      style={{
        width: size,
        height: size,
        perspective: "400px",
      }}
      whileHover={!disabled && !isRolling ? { scale: 1.1 } : {}}
      whileTap={!disabled && !isRolling ? { scale: 0.95 } : {}}
      aria-label={`Die ${value}${isHeld ? " (held)" : ""}`}
    >
      {/* 3D Cube Container */}
      <motion.div
        className="w-full h-full relative"
        style={{
          transformStyle: "preserve-3d",
        }}
        animate={
          isRolling
            ? {
                rotateX: [0, rollRotation.rotateX + finalRotation.rotateX],
                rotateY: [0, rollRotation.rotateY + finalRotation.rotateY],
                z: [0, 30, 50, 30, 0],
              }
            : {
                rotateX: finalRotation.rotateX,
                rotateY: finalRotation.rotateY,
                z: 0,
              }
        }
        transition={
          isRolling
            ? {
                duration: 1.0 + index * 0.1,
                ease: [0.25, 0.1, 0.25, 1],
              }
            : {
                duration: 0.3,
                ease: "easeOut",
              }
        }
      >
        {/* Front - 1 */}
        <DiceFace
          value={1}
          transform={`translateZ(${halfSize}px)`}
          isHeld={isHeld}
        />

        {/* Back - 6 */}
        <DiceFace
          value={6}
          transform={`rotateY(180deg) translateZ(${halfSize}px)`}
          isHeld={isHeld}
        />

        {/* Right - 3 */}
        <DiceFace
          value={3}
          transform={`rotateY(90deg) translateZ(${halfSize}px)`}
          isHeld={isHeld}
        />

        {/* Left - 4 */}
        <DiceFace
          value={4}
          transform={`rotateY(-90deg) translateZ(${halfSize}px)`}
          isHeld={isHeld}
        />

        {/* Top - 2 */}
        <DiceFace
          value={2}
          transform={`rotateX(90deg) translateZ(${halfSize}px)`}
          isHeld={isHeld}
        />

        {/* Bottom - 5 */}
        <DiceFace
          value={5}
          transform={`rotateX(-90deg) translateZ(${halfSize}px)`}
          isHeld={isHeld}
        />
      </motion.div>

      {/* Held indicator */}
      {isHeld && (
        <motion.div
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg z-10"
          style={{
            background: "linear-gradient(145deg, #4ade80, #22c55e)",
            color: "white",
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          ✓
        </motion.div>
      )}

      {/* Rolling glow effect */}
      {isRolling && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            boxShadow: "0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)",
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.3,
            repeat: 3,
          }}
        />
      )}
    </motion.button>
  );
}

interface DiceBoard3DProps {
  dice: number[];
  heldDice: boolean[];
  onToggleHold: (index: number) => void;
  disabled?: boolean;
}

export function DiceBoard3D({
  dice,
  heldDice,
  onToggleHold,
  disabled = false,
}: DiceBoard3DProps) {
  const [rollingDice, setRollingDice] = useState<boolean[]>([false, false, false, false, false]);
  const [prevDice, setPrevDice] = useState<number[]>(dice);

  // Detect dice value changes to trigger rolling animation
  useEffect(() => {
    const changedDice = dice.map(
      (value, index) => value !== prevDice[index] && !heldDice[index]
    );

    if (changedDice.some(changed => changed)) {
      setRollingDice(changedDice);

      // Clear rolling state after animation
      const timer = setTimeout(() => {
        setRollingDice([false, false, false, false, false]);
      }, 1200);

      setPrevDice(dice);

      return () => clearTimeout(timer);
    }
  }, [dice, prevDice, heldDice]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Dice container with perspective */}
      <div
        className="relative p-4 sm:p-6"
        style={{
          perspective: "800px",
          perspectiveOrigin: "center center",
        }}
      >
        <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
          {dice.map((value, index) => (
            <Dice3D
              key={index}
              index={index}
              value={value}
              isHeld={heldDice[index]}
              isRolling={rollingDice[index] && !heldDice[index]}
              onToggleHold={() => onToggleHold(index)}
              disabled={disabled}
            />
          ))}
        </div>
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <p className="font-medium">Click dice to hold them between rolls</p>
        {heldDice.some((held) => held) && (
          <motion.p
            className="text-chain font-bold text-base mt-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {heldDice.filter((h) => h).length}{" "}
            {heldDice.filter((h) => h).length === 1 ? "die" : "dice"} held
          </motion.p>
        )}
      </div>
    </div>
  );
}
