"use client";

/**
 * PlayingCard — renders a French-style SVG card using htdebeer/svg-cards sprite.
 *
 * Each card in the sprite has a translate(tx, ty) that positions it in the global
 * canvas. To show only that card, the SVG viewBox must be set to "-tx -ty 169.075 244.640".
 *
 * Suit symbols → svg-cards suit names:
 *   ♠ → spade  ♥ → heart  ♦ → diamond  ♣ → club
 *
 * Value mapping:
 *   1  → 1 (Ace)   2–10 → 2–10   11 → jack   12 → queen   13 → king
 */

// Card natural dimensions from the SVG sprite
const CARD_W = 169.075;
const CARD_H = 244.640;

// Per-card viewBox offsets extracted from the sprite's transform="translate(tx,ty)"
// viewBox = "-tx -ty 169.075 244.640"
const CARD_OFFSETS: Record<string, [number, number]> = {
  club_1:      [-1.25,       -236.52],
  club_2:      [166.325,     -236.52],
  club_3:      [333.9,       -236.52],
  club_4:      [501.475,     -236.52],
  club_5:      [669.05,      -236.52],
  club_6:      [836.625,     -236.52],
  club_7:      [1004.2,      -236.52],
  club_8:      [1171.77,     -236.52],
  club_9:      [1339.35,     -236.52],
  club_10:     [1506.92,     -236.52],
  club_jack:   [1674.5,      -236.52],
  club_queen:  [1842.07,     -236.52],
  club_king:   [2009.65,     -236.52],

  diamond_1:   [-1.25,       6.617],
  diamond_2:   [166.325,     6.617],
  diamond_3:   [333.9,       6.617],
  diamond_4:   [501.475,     6.617],
  diamond_5:   [669.05,      6.617],
  diamond_6:   [836.625,     6.617],
  diamond_7:   [1004.2,      6.617],
  diamond_8:   [1171.77,     6.617],
  diamond_9:   [1339.35,     6.617],
  diamond_10:  [1506.92,     6.617],
  diamond_jack:[1674.5,      6.617],
  diamond_queen:[1842.07,    6.617],
  diamond_king:[2009.65,     6.617],

  heart_1:     [-1.25,       249.755],
  heart_2:     [166.325,     249.755],
  heart_3:     [333.9,       249.755],
  heart_4:     [501.475,     249.755],
  heart_5:     [669.05,      249.755],
  heart_6:     [836.625,     249.755],
  heart_7:     [1004.2,      249.755],
  heart_8:     [1171.77,     249.755],
  heart_9:     [1339.35,     249.755],
  heart_10:    [1506.92,     249.755],
  heart_jack:  [1674.5,      249.755],
  heart_queen: [1842.07,     249.755],
  heart_king:  [2009.65,     249.755],

  spade_1:     [-1.25,       492.892],
  spade_2:     [166.325,     492.892],
  spade_3:     [333.9,       492.892],
  spade_4:     [501.475,     492.892],
  spade_5:     [669.05,      492.892],
  spade_6:     [836.625,     492.892],
  spade_7:     [1004.2,      492.892],
  spade_8:     [1171.77,     492.892],
  spade_9:     [1339.35,     492.892],
  spade_10:    [1506.92,     492.892],
  spade_jack:  [1674.5,      492.892],
  spade_queen: [1842.07,     492.892],
  spade_king:  [2009.65,     492.892],

  joker_black: [-1.25,       736.03],
  joker_red:   [166.325,     736.03],
  back:        [333.9,       736.03],
};

const SUIT_MAP: Record<string, string> = {
  "♠": "spade",
  "♥": "heart",
  "♦": "diamond",
  "♣": "club",
};

function toCardId(suit: string, value: number | string): string {
  const suitName = SUIT_MAP[suit] ?? suit;
  const v = typeof value === "string" ? parseInt(value, 10) : value;
  let valueName: string;
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
  /** "sm" = history strip, "md" = medium, "lg" = main card (default) */
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
  const cardId = faceDown ? "back" : toCardId(suit, value);
  const offset = CARD_OFFSETS[cardId] ?? [0, 0];
  const [ox, oy] = offset;
  const viewBox = `${ox} ${oy} ${CARD_W} ${CARD_H}`;

  const glowClass = glow === "green"
    ? "drop-shadow-[0_0_12px_rgba(74,222,128,0.8)]"
    : glow === "red"
    ? "drop-shadow-[0_0_12px_rgba(248,113,113,0.8)]"
    : glow === "yellow"
    ? "drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]"
    : "drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)]";

  // Pixel dimensions preserving card aspect ratio (169.075 × 244.640 ≈ 0.691)
  const sizes = {
    sm: { w: 56,  h: 81  },
    md: { w: 80,  h: 116 },
    lg: { w: 112, h: 162 },
  };
  const { w, h } = sizes[size];

  return (
    <div
      className={`${glowClass} ${className} select-none shrink-0`}
      style={{ width: w, height: h }}
    >
      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        width={w}
        height={h}
        style={{ display: "block" }}
      >
        <use href={`#${cardId}`} />
      </svg>
    </div>
  );
}
