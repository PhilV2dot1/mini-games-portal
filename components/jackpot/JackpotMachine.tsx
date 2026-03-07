"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface JackpotMachineProps {
  isSpinning: boolean;
  finalValue?: number;
  onSpinComplete?: () => void;
}

// Symboles crypto avec valeurs basées sur Market Cap
const CRYPTO_SYMBOLS = [
  {
    id: "bitcoin",
    name: "BTC",
    value: 1000,
    color: "#F7931A",
    logo: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
    rank: 1
  },
  {
    id: "ethereum",
    name: "ETH",
    value: 500,
    color: "#627EEA",
    logo: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    rank: 2
  },
  {
    id: "ripple",
    name: "XRP",
    value: 250,
    color: "#23292F",
    logo: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
    rank: 3
  },
  {
    id: "binancecoin",
    name: "BNB",
    value: 100,
    color: "#F3BA2F",
    logo: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    rank: 4
  },
  {
    id: "solana",
    name: "SOL",
    value: 50,
    color: "#9945FF",
    logo: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
    rank: 5
  },
  {
    id: "celo",
    name: "CELO",
    value: 25,
    color: "#FBCC5C",
    logo: "https://assets.coingecko.com/coins/images/11090/small/InjXBNx9_400x400.jpg",
    rank: 6
  },
  {
    id: "optimism",
    name: "OP",
    value: 10,
    color: "#FF0420",
    logo: "https://assets.coingecko.com/coins/images/25244/small/Optimism.png",
    rank: 7
  },
  {
    id: "miss",
    name: "MISS",
    value: 0,
    color: "#6B7280",
    logo: "",
    rank: 8
  },
];

export function JackpotMachine({ isSpinning, finalValue, onSpinComplete }: JackpotMachineProps) {
  const [reel1, setReel1] = useState(0);
  const [reel2, setReel2] = useState(1);
  const [reel3, setReel3] = useState(2);
  const [isSettling, setIsSettling] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSpinning) {
      setIsSettling(false);
      // Spin rapide pendant le spinning
      interval = setInterval(() => {
        setReel1(Math.floor(Math.random() * CRYPTO_SYMBOLS.length));
        setReel2(Math.floor(Math.random() * CRYPTO_SYMBOLS.length));
        setReel3(Math.floor(Math.random() * CRYPTO_SYMBOLS.length));
      }, 100);
    } else if (finalValue !== undefined && !isSettling) {
      // Arrêt progressif
      setIsSettling(true);
      const symbolIndex = CRYPTO_SYMBOLS.findIndex(s => s.value === finalValue);
      const targetIndex = symbolIndex >= 0 ? symbolIndex : 7; // Default to MISS

      // Reel 1 stops first
      setTimeout(() => setReel1(targetIndex), 300);
      // Reel 2 stops second
      setTimeout(() => setReel2(targetIndex), 600);
      // Reel 3 stops last
      setTimeout(() => {
        setReel3(targetIndex);
        // Notify parent that spin is complete
        setTimeout(() => {
          if (onSpinComplete) onSpinComplete();
        }, 500);
      }, 900);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSpinning, finalValue, isSettling, onSpinComplete]);

  return (
    <div className="relative">
      {/* Machine Frame */}
      <div className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-4 shadow-2xl border-2 border-gray-700 dark:border-gray-600" style={{ boxShadow: '0 0 0 6px var(--chain-primary), 0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        {/* Reels Container */}
        <div className="bg-gradient-to-b from-gray-700 to-gray-800 rounded-xl p-4 shadow-inner border border-gray-600">
          <div className="grid grid-cols-3 gap-4">
            {/* Reel 1 */}
            <CryptoReel
              symbol={CRYPTO_SYMBOLS[reel1]}
              isSpinning={isSpinning}
              delay={0}
            />

            {/* Reel 2 */}
            <CryptoReel
              symbol={CRYPTO_SYMBOLS[reel2]}
              isSpinning={isSpinning}
              delay={0.15}
            />

            {/* Reel 3 */}
            <CryptoReel
              symbol={CRYPTO_SYMBOLS[reel3]}
              isSpinning={isSpinning}
              delay={0.3}
            />
          </div>
        </div>

        {/* Payout Line */}
        <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-chain to-transparent opacity-40 pointer-events-none" />
      </div>
    </div>
  );
}

interface CryptoReelProps {
  symbol: typeof CRYPTO_SYMBOLS[0];
  isSpinning: boolean;
  delay: number;
}

function CryptoReel({ symbol, isSpinning, delay }: CryptoReelProps) {
  // Create repeating array of symbols for continuous scroll effect
  const symbolsToShow = [...CRYPTO_SYMBOLS, ...CRYPTO_SYMBOLS, ...CRYPTO_SYMBOLS];
  const targetIndex = CRYPTO_SYMBOLS.findIndex(s => s.value === symbol.value);

  return (
    <div className="relative bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg overflow-hidden border-2 border-chain h-32">
      {/* Visible window shows middle symbol clearly */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="h-full flex items-center justify-center">
          <div className="w-full h-24 border-y-2 border-chain/50 bg-chain/5"></div>
        </div>
      </div>

      <motion.div
        animate={{
          y: isSpinning ? -1800 : -(targetIndex + CRYPTO_SYMBOLS.length) * 100,
        }}
        transition={{
          duration: isSpinning ? 0.8 : 0.5,
          repeat: isSpinning ? Infinity : 0,
          delay: delay,
          ease: isSpinning ? "linear" : [0.34, 1.56, 0.64, 1],
        }}
        className="flex flex-col"
      >
        {symbolsToShow.map((sym, idx) => (
          <div
            key={`${sym.id}-${idx}`}
            className="h-[100px] flex flex-col items-center justify-center py-2"
            style={{
              filter: isSpinning ? 'blur(0.5px)' : 'blur(0px)',
              opacity: isSpinning ? 0.95 : 1,
            }}
          >
            {/* Logo Crypto */}
            <div className="mb-1 relative w-14 h-14 flex items-center justify-center">
              {sym.logo ? (
                <Image
                  src={sym.logo}
                  alt={sym.name}
                  width={56}
                  height={56}
                  className="rounded-full"
                  style={{
                    boxShadow: `0 0 15px ${sym.color}60`,
                  }}
                  unoptimized
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black text-white"
                  style={{
                    backgroundColor: sym.color,
                    boxShadow: `0 0 15px ${sym.color}60`,
                  }}
                >
                  ✕
                </div>
              )}
            </div>

            {/* Nom de la crypto */}
            <div
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${sym.color}20`,
                color: sym.color,
                border: `1px solid ${sym.color}`,
              }}
            >
              {sym.name}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Shine Effect - seulement si pas en train de spinner */}
      {!isSpinning && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 100, opacity: [0, 0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
          className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-chain to-transparent opacity-30 pointer-events-none"
        />
      )}
    </div>
  );
}
