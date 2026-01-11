"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface DiceBoardProps {
  dice: number[];
  heldDice: boolean[];
  onToggleHold: (index: number) => void;
  disabled?: boolean;
}

interface DieProps {
  value: number;
  isHeld: boolean;
  isRolling: boolean;
  onToggleHold: () => void;
  disabled: boolean;
}

// Dice dot positions (percentage based)
const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

function DiceDots({ value }: { value: number }) {
  const positions = DOT_POSITIONS[value] || [];

  return (
    <>
      {positions.map(([x, y], i) => (
        <div
          key={i}
          className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full"
          style={{
            left: `${x}%`,
            top: `${y}%`,
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(circle at 35% 35%, #374151, #111827)",
            boxShadow: "inset -2px -2px 3px rgba(0,0,0,0.6), inset 1px 1px 2px rgba(255,255,255,0.1), 0 1px 2px rgba(0,0,0,0.3)",
          }}
        />
      ))}
    </>
  );
}

function RollingParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: "radial-gradient(circle, #ffd700, #ffa500)",
            boxShadow: "0 0 4px rgba(255, 215, 0, 0.6)",
          }}
          initial={{
            x: "50%",
            y: "50%",
            opacity: 1,
            scale: 1,
          }}
          animate={{
            x: `${50 + (Math.random() - 0.5) * 180}%`,
            y: `${50 + (Math.random() - 0.5) * 180}%`,
            opacity: 0,
            scale: 0.2,
          }}
          transition={{
            duration: 0.9,
            delay: i * 0.06,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

function Die({ value, isHeld, isRolling, onToggleHold, disabled }: DieProps) {
  return (
    <motion.button
      onClick={!disabled ? onToggleHold : undefined}
      disabled={disabled}
      className={`
        relative flex items-center justify-center
        w-20 h-20 sm:w-24 sm:h-24
        rounded-xl
        transition-all duration-200
        ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        }
      `}
      style={{
        willChange: isRolling ? "transform" : "auto",
        transformStyle: "preserve-3d",
        background: isHeld
          ? "linear-gradient(145deg, #ffd700, #ffa500)"
          : "linear-gradient(145deg, #ffffff, #f0f0f0)",
        boxShadow: isHeld
          ? "0 10px 30px rgba(252, 204, 22, 0.4), 0 6px 15px rgba(0, 0, 0, 0.2), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(0, 0, 0, 0.15)"
          : "0 10px 30px rgba(0, 0, 0, 0.2), 0 6px 15px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -2px 4px rgba(0, 0, 0, 0.15)",
        border: isHeld ? "2px solid #ffa500" : "1px solid rgba(0, 0, 0, 0.1)",
      }}
      animate={
        isHeld
          ? {
              scale: [1, 1.05, 1],
              y: [0, -6, 0],
            }
          : {
              scale: 1,
              y: 0,
            }
      }
      transition={{
        duration: 0.6,
        repeat: isHeld ? Infinity : 0,
        repeatDelay: 0.3,
        ease: "easeInOut",
      }}
      whileHover={!disabled && !isRolling ? { scale: 1.08, y: -4 } : {}}
      whileTap={!disabled && !isRolling ? { scale: 0.95 } : {}}
      aria-label={`Die ${value}${isHeld ? " (held)" : ""}`}
    >
      <DiceDots value={value} />
      {isRolling && <RollingParticles />}
      {isHeld && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
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
    </motion.button>
  );
}

export function DiceBoard({
  dice,
  heldDice,
  onToggleHold,
  disabled = false,
}: DiceBoardProps) {
  const [rollingDice, setRollingDice] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [prevDice, setPrevDice] = useState<number[]>(dice);
  const [isAllRolling, setIsAllRolling] = useState(false);

  // Detect dice value changes to trigger rolling animation
  useEffect(() => {
    const hasChanged = dice.some((value, index) => value !== prevDice[index] && !heldDice[index]);

    if (hasChanged) {
      // Set rolling state for changed dice
      const newRolling = dice.map(
        (value, index) => value !== prevDice[index] && !heldDice[index]
      );
      setRollingDice(newRolling);

      // Only trigger group animation if ALL dice are rolling (first roll)
      const allDiceRolling = newRolling.every((rolling, index) => rolling || heldDice[index]);
      setIsAllRolling(allDiceRolling && newRolling.some(r => r));

      // Clear rolling state after animation
      const timer = setTimeout(() => {
        setRollingDice([false, false, false, false, false]);
        setIsAllRolling(false);
      }, 1400);

      setPrevDice(dice);

      return () => clearTimeout(timer);
    }
  }, [dice, prevDice, heldDice]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* 3D Perspective Container */}
      <div
        className="relative p-6"
        style={{
          perspective: '1500px',
          perspectiveOrigin: 'center center',
        }}
      >
        {/* Synchronized Dice Group - rotates all dice together only on first roll */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 sm:gap-6"
          style={{
            transformStyle: 'preserve-3d',
          }}
          animate={
            isAllRolling
              ? {
                  rotateX: [0, 15, -10, 20, -15, 0],
                  rotateY: [0, -20, 25, -15, 10, 0],
                  rotateZ: [0, 5, -8, 12, -5, 0],
                  y: [0, -20, -10, -15, -5, 0],
                }
              : {
                  rotateX: 0,
                  rotateY: 0,
                  rotateZ: 0,
                  y: 0,
                }
          }
          transition={
            isAllRolling
              ? {
                  duration: 1.2,
                  times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                  ease: [0.43, 0.13, 0.23, 0.96],
                }
              : {
                  duration: 0.4,
                  ease: "easeOut",
                }
          }
        >
          {dice.map((value, index) => (
            <motion.div
              key={index}
              animate={
                rollingDice[index]
                  ? {
                      rotateX: [0, 360, 720, 1080],
                      rotateY: [0, 360, 720, 1080],
                      rotateZ: [0, 180, 360, 540],
                    }
                  : {
                      rotateX: 0,
                      rotateY: 0,
                      rotateZ: 0,
                    }
              }
              transition={{
                duration: 1.2,
                ease: "easeOut",
              }}
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              <Die
                value={value}
                isHeld={heldDice[index]}
                isRolling={rollingDice[index]}
                onToggleHold={() => onToggleHold(index)}
                disabled={disabled}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        <p className="font-medium">Click dice to hold them between rolls</p>
        {heldDice.some((held) => held) && (
          <motion.p
            className="text-celo font-bold text-base mt-1"
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
