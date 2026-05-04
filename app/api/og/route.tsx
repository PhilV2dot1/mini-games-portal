import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const GAMES = [
  'Blackjack', 'Poker', 'Snake', 'Tetris', 'Wordle',
  'Flappy Bird', 'Minesweeper', 'Solitaire', 'Yahtzee', 'Sudoku',
  'Mastermind', 'Connect 5', 'Maze', 'Memory', '2048',
  'Plinko', 'RPS', 'Tic-Tac-Toe', 'Jackpot', 'Brick Breaker',
];

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #0f0c29 0%, #111827 50%, #0f2027 100%)',
          fontFamily: 'sans-serif',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Background grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.07,
          backgroundImage: 'repeating-linear-gradient(0deg, #FCFF52 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #FCFF52 0px, transparent 1px, transparent 40px)',
          display: 'flex',
        }} />

        {/* Top accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '5px',
          background: 'linear-gradient(90deg, #FCFF52, #f59e0b, #10b981, #3b82f6, #a855f7, #FCFF52)',
          display: 'flex',
        }} />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '50px 60px 40px', zIndex: 1 }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '16px',
              background: '#FCFF52', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px',
            }}>🎮</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#FCFF52', fontSize: '16px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' }}>
                MINI GAMES PORTAL
              </span>
              <span style={{ color: '#9ca3af', fontSize: '13px', marginTop: '2px' }}>
                Celo · Base · MegaETH · Soneium
              </span>
            </div>
          </div>

          {/* Main title */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '32px' }}>
            <span style={{
              color: '#ffffff', fontSize: '56px', fontWeight: 900, lineHeight: 1.05,
              letterSpacing: '-1px',
            }}>
              20 Mini-Games.
            </span>
            <span style={{
              fontSize: '56px', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-1px',
              background: 'linear-gradient(90deg, #FCFF52, #f59e0b)',
              color: 'transparent',
              // @ts-ignore
              '-webkit-background-clip': 'text',
              backgroundClip: 'text',
            }}>
              Free, On-Chain & Multiplayer.
            </span>
          </div>

          {/* Game pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '32px' }}>
            {GAMES.slice(0, 14).map((game) => (
              <div key={game} style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(252,255,82,0.25)',
                borderRadius: '20px',
                padding: '5px 14px',
                color: '#e5e7eb',
                fontSize: '13px',
                fontWeight: 600,
              }}>
                {game}
              </div>
            ))}
            <div style={{
              background: 'rgba(252,255,82,0.15)',
              border: '1px solid rgba(252,255,82,0.5)',
              borderRadius: '20px',
              padding: '5px 14px',
              color: '#FCFF52',
              fontSize: '13px',
              fontWeight: 700,
            }}>
              +6 more
            </div>
          </div>

          {/* Bottom row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: 'auto' }}>
            <div style={{
              background: '#FCFF52', borderRadius: '12px',
              padding: '12px 28px', color: '#111827',
              fontSize: '17px', fontWeight: 800,
            }}>
              ▶ Play Now — Free
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['🏆 Leaderboard', '🤝 Multiplayer', '⛓️ On-Chain Scores'].map((badge) => (
                <span key={badge} style={{ color: '#9ca3af', fontSize: '13px', fontWeight: 600 }}>{badge}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right decorative glow */}
        <div style={{
          position: 'absolute', right: '-80px', top: '50%',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(252,255,82,0.15) 0%, transparent 70%)',
          transform: 'translateY(-50%)',
          display: 'flex',
        }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
