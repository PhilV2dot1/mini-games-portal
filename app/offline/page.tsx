'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gray-900">
      <div className="text-7xl mb-6">🎮</div>
      <h1 className="text-3xl font-bold text-white mb-3">You&apos;re Offline</h1>
      <p className="text-gray-400 mb-2 max-w-sm">
        Free-play games work offline.
      </p>
      <p className="text-gray-500 mb-8 max-w-sm text-sm">
        On-chain and multiplayer modes require an internet connection.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-6 py-3 bg-yellow-300 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
