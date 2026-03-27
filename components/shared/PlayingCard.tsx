"use client";

/**
 * PlayingCard — HTML/CSS playing card renderer.
 * Renders all 52 cards with proper pip layout, face cards, and ace.
 * No external dependencies. Works everywhere.
 */

const SUIT_MAP: Record<string, string> = {
  "♠": "spade",
  "♥": "heart",
  "♦": "diamond",
  "♣": "club",
};

// Pip grid positions [col, row] in a 2-col × N-row grid
// col: 0 = left, 0.5 = center, 1 = right
// row: 0..N-1 top to bottom
const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1:  [],  // Ace — big center symbol
  2:  [[0.5,0],[0.5,3]],
  3:  [[0.5,0],[0.5,1.5],[0.5,3]],
  4:  [[0,0],[1,0],[0,3],[1,3]],
  5:  [[0,0],[1,0],[0.5,1.5],[0,3],[1,3]],
  6:  [[0,0],[1,0],[0,1.5],[1,1.5],[0,3],[1,3]],
  7:  [[0,0],[1,0],[0,1.5],[1,1.5],[0.5,0.75],[0,3],[1,3]],
  8:  [[0,0],[1,0],[0,1.5],[1,1.5],[0.5,0.75],[0.5,2.25],[0,3],[1,3]],
  9:  [[0,0],[1,0],[0,1],[1,1],[0.5,1.5],[0,2],[1,2],[0,3],[1,3]],
  10: [[0,0],[1,0],[0,1],[1,1],[0.5,0.5],[0.5,2.5],[0,2],[1,2],[0,3],[1,3]],
};

const FACE_LABELS: Record<number, string> = { 11: "J", 12: "Q", 13: "K" };
const FACE_COLORS: Record<number, string> = {
  11: "#3b82f6",  // Jack — blue
  12: "#ec4899",  // Queen — pink
  13: "#f59e0b",  // King — amber
};

interface PlayingCardProps {
  suit?: string;
  value?: number | string;
  faceDown?: boolean;
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
  const v = typeof value === "string" ? parseInt(value, 10) : value;
  const isRed = suit === "♥" || suit === "♦";
  const suitColor = isRed ? "#dc2626" : "#1a1a2e";

  const dims = {
    sm: { w: 52, h: 75,  rank: 11, pip: 10, cornerPad: 4,  acePip: 28, faceFont: 22 },
    md: { w: 72, h: 104, rank: 13, pip: 12, cornerPad: 5,  acePip: 38, faceFont: 30 },
    lg: { w: 104,h: 150, rank: 16, pip: 14, cornerPad: 7,  acePip: 54, faceFont: 44 },
  }[size];

  const glowStyle: React.CSSProperties =
    glow === "green" ? { boxShadow: "0 0 0 2px #4ade80, 0 0 18px 4px rgba(74,222,128,0.7)" }
    : glow === "red"   ? { boxShadow: "0 0 0 2px #f87171, 0 0 18px 4px rgba(248,113,113,0.7)" }
    : glow === "yellow"? { boxShadow: "0 0 0 2px #facc15, 0 0 18px 4px rgba(250,204,21,0.7)" }
    : { boxShadow: "0 3px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)" };

  const cardStyle: React.CSSProperties = {
    width: dims.w,
    height: dims.h,
    borderRadius: size === "sm" ? 6 : 8,
    border: "1px solid rgba(0,0,0,0.15)",
    position: "relative",
    overflow: "hidden",
    flexShrink: 0,
    userSelect: "none",
    ...glowStyle,
  };

  // ── Face-down card ──────────────────────────────────────────────────────────
  if (faceDown) {
    return (
      <div style={{ ...cardStyle, background: "linear-gradient(145deg,#1e3a8a,#1d4ed8,#1e3a8a)" }} className={className}>
        <div style={{
          position: "absolute", inset: 4, borderRadius: size === "sm" ? 4 : 6,
          border: "1px solid rgba(255,255,255,0.25)",
          backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(255,255,255,0.07) 4px,rgba(255,255,255,0.07) 8px)",
        }}/>
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: size === "sm" ? 18 : size === "md" ? 24 : 32,
          opacity: 0.4, color: "white",
        }}>♦</div>
      </div>
    );
  }

  const rankLabel = v <= 10 ? (v === 1 ? "A" : String(v)) : FACE_LABELS[v];

  // Corner label (top-left + bottom-right rotated)
  const Corner = ({ rotate }: { rotate?: boolean }) => (
    <div style={{
      position: "absolute",
      ...(rotate ? { bottom: dims.cornerPad, right: dims.cornerPad, transform: "rotate(180deg)" } : { top: dims.cornerPad, left: dims.cornerPad }),
      display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1,
    }}>
      <span style={{ fontSize: dims.rank, fontWeight: 900, color: suitColor, fontFamily: "Georgia,serif", lineHeight: 1 }}>
        {rankLabel}
      </span>
      <span style={{ fontSize: dims.rank - 2, color: suitColor, lineHeight: 1 }}>
        {suit}
      </span>
    </div>
  );

  // ── Center area ─────────────────────────────────────────────────────────────
  const centerPadH = dims.cornerPad + dims.rank * 2 + 4;
  const centerH = dims.h - centerPadH * 2;
  const centerW = dims.w - dims.cornerPad * 2 - 6;

  let center: React.ReactNode;

  if (v === 1) {
    // Ace — large suit symbol
    center = (
      <span style={{ fontSize: dims.acePip, color: suitColor, lineHeight: 1, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}>
        {suit}
      </span>
    );
  } else if (v >= 11) {
    // Face card — colored initial in styled box
    const bg = `${FACE_COLORS[v]}18`;
    const border = `${FACE_COLORS[v]}40`;
    center = (
      <div style={{
        width: centerW - 4, height: centerH - 4,
        borderRadius: size === "sm" ? 3 : 5,
        background: `linear-gradient(135deg, ${bg}, ${FACE_COLORS[v]}28)`,
        border: `1px solid ${border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontSize: dims.faceFont, fontWeight: 900,
          color: FACE_COLORS[v], fontFamily: "Georgia,serif",
          textShadow: `0 1px 4px ${FACE_COLORS[v]}80`,
        }}>
          {FACE_LABELS[v]}
        </span>
      </div>
    );
  } else {
    // Number card — pip grid
    const pips = PIP_LAYOUTS[v] ?? [];
    const cols = 2;
    const rows = 3;
    const colStep = centerW / cols;
    const rowStep = centerH / rows;

    center = (
      <div style={{ position: "relative", width: centerW, height: centerH }}>
        {pips.map(([col, row], i) => {
          const x = col * colStep - dims.pip / 2 + (col === 0.5 ? colStep / 2 : col === 0 ? dims.pip * 0.3 : colStep - dims.pip * 1.3);
          const y = (row / 3) * centerH - dims.pip / 2;
          // Flip pips in bottom half
          const flipY = row > 1.5;
          return (
            <span key={i} style={{
              position: "absolute",
              left: col === 0.5 ? "50%" : col === 0 ? dims.pip * 0.1 : undefined,
              right: col === 1 ? dims.pip * 0.1 : undefined,
              top: `${(row / 3) * 100}%`,
              transform: `translate(${col === 0.5 ? "-50%" : "0"}, -50%) ${flipY ? "rotate(180deg)" : ""}`,
              fontSize: dims.pip,
              color: suitColor,
              lineHeight: 1,
            }}>
              {suit}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ ...cardStyle, background: "linear-gradient(150deg,#ffffff,#f8f8f8,#f0f0f0)" }} className={className}>
      {/* Subtle inner shine */}
      <div style={{ position:"absolute",inset:0,background:"linear-gradient(135deg,rgba(255,255,255,0.6) 0%,transparent 50%)", pointerEvents:"none" }}/>
      <Corner />
      <div style={{
        position: "absolute",
        top: centerPadH, left: dims.cornerPad + 3,
        width: centerW, height: centerH,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {center}
      </div>
      <Corner rotate />
    </div>
  );
}
