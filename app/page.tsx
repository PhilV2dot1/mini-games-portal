"use client";

import { Header } from "@/components/layout/Header";
import { GameGrid } from "@/components/games/GameGrid";
import { GAMES } from "@/lib/types";

export default function Home() {
  const games = Object.values(GAMES);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Instructions */}
        <div className="bg-white/90 backdrop-blur-lg rounded-xl p-4 mb-6 shadow-lg" style={{ border: '3px solid #FCFF52' }}>
          <h2 className="text-lg font-bold text-gray-900 mb-2">How to Play</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-gray-700">
            <div>
              <div className="font-semibold text-gray-900 mb-0.5 text-sm">🆓 Free Mode</div>
              <p className="text-xs">Play without wallet. Stats saved locally.</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-0.5 text-sm">⛓️ On-Chain Mode</div>
              <p className="text-xs">Connect wallet to save on Celo.</p>
            </div>
          </div>
        </div>

        {/* Game Grid */}
        <GameGrid games={games} />

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-600 text-xs">
          <p>Built on Celo blockchain • Powered by Farcaster</p>
          <p className="mt-1">
            <a
              href="https://celo.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-900 hover:text-celo font-semibold transition-colors underline decoration-celo"
            >
              Learn more about Celo
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
