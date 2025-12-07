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
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 mb-8 shadow-xl" style={{ border: '4px solid #FCFF52' }}>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">How to Play</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-gray-700">
            <div>
              <div className="font-semibold text-gray-900 mb-1">🆓 Free Mode</div>
              <p className="text-sm">Play without connecting a wallet. Stats saved locally.</p>
            </div>
            <div>
              <div className="font-semibold text-gray-900 mb-1">⛓️ On-Chain Mode</div>
              <p className="text-sm">Connect wallet to save scores on Celo blockchain.</p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(252, 255, 82, 0.4)', border: '4px solid #FCFF52' }}>
            <p className="text-sm text-gray-900 font-bold">
              <strong>Note:</strong> 2048 and Mastermind require 0.01 CELO per on-chain game.
            </p>
          </div>
        </div>

        {/* Game Grid */}
        <GameGrid games={games} />

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>Built on Celo blockchain • Powered by Farcaster</p>
          <p className="mt-2">
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
