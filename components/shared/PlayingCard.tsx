"use client";

/**
 * PlayingCard — renders a French-style SVG card using htdebeer/svg-cards sprite.
 *
 * Suit symbols → svg-cards suit names:
 *   ♠ → spade  ♥ → heart  ♦ → diamond  ♣ → club
 *
 * Value mapping:
 *   1  → 1 (Ace)
 *   2–10 → 2–10
 *   11 → jack
 *   12 → queen
 *   13 → king
 */

const SUIT_MAP: Record<string, string> = {
  "♠": "spade",
  "♥": "heart",
  "♦": "diamond",
  "♣": "club",
};

function toSvgId(suit: string, value: number | string): string {
  const suitName = SUIT_MAP[suit] ?? suit;
  let valueName: string;
  const v = typeof value === "string" ? parseInt(value, 10) : value;
  if (v === 11) valueName = "jack";
  else if (v === 12) valueName = "queen";
  else if (v === 13) valueName = "king";
  else valueName = String(v);
  return `${suitName}_${valueName}`;
}

interface PlayingCardProps {
  suit?: string;
  value?: number | string;
  faceDown?: boolean;
  /** "sm" = history strip size, "lg" = main card size (default) */
  size?: "sm" | "md" | "lg";
  glow?: "green" | "red" | "yellow";
  className?: string;
}

export function PlayingCard({
  suit = "♠",
  value = 1,
  faceDown = false,
  size = "lg",
  glow,
  className = "",
}: PlayingCardProps) {
  const cardId = faceDown ? "back" : toSvgId(suit, value);

  const glowClass = glow === "green"
    ? "drop-shadow-[0_0_12px_rgba(74,222,128,0.8)]"
    : glow === "red"
    ? "drop-shadow-[0_0_12px_rgba(248,113,113,0.8)]"
    : glow === "yellow"
    ? "drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]"
    : "drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]";

  // Card natural dimensions: 169.075 × 244.640 → aspect ratio ≈ 0.691
  const sizes = {
    sm: { w: 56,  h: 81  },   // ~w-14
    md: { w: 80,  h: 116 },   // ~w-20
    lg: { w: 112, h: 162 },   // ~w-28
  };
  const { w, h } = sizes[size];

  return (
    <div
      className={`${glowClass} ${className} select-none shrink-0`}
      style={{ width: w, height: h }}
    >
      <svg
        viewBox="0 0 169.075 244.640"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width={w}
        height={h}
        style={{ display: "block" }}
      >
        <use href={`/svg-cards.svg#${cardId}`} />
      </svg>
    </div>
  );
}
