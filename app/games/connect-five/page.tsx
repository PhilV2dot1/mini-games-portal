/**
 * Connect Five Game Page
 * Play Connect Five (Connect Four) on Celo blockchain
 */

import type { Metadata } from 'next';
import { ConnectFive } from '@/components/games/ConnectFive';

export const metadata: Metadata = {
  title: 'Connect Five | Celo Games Portal',
  description: 'Play Connect Five (Connect Four) - Connect 4 pieces in a row to win! Classic strategy game on the Celo blockchain.',
  keywords: ['connect five', 'connect four', 'strategy game', 'celo', 'blockchain game', 'web3 game'],
};

export default function ConnectFivePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Connect Five
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect 4 pieces in a row - horizontally, vertically, or diagonally - to win this classic strategy game!
          </p>
        </div>

        {/* Game Component */}
        <ConnectFive />

        {/* Game Info */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Game Rules */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Game Rules</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Players take turns dropping pieces into columns</li>
                <li>• Pieces fall to the lowest available position</li>
                <li>• First player to connect 4 pieces wins</li>
                <li>• Can connect horizontally, vertically, or diagonally</li>
                <li>• Game ends in a draw if board fills completely</li>
              </ul>
            </div>

            {/* Strategy Tips */}
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Strategy Tips</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Control the center columns</li>
                <li>• Create multiple winning opportunities</li>
                <li>• Block your opponent&apos;s connections</li>
                <li>• Think several moves ahead</li>
                <li>• Watch for diagonal opportunities</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
