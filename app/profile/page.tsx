"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import Link from "next/link";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned_at?: string;
}

interface GameSession {
  id: string;
  game_id: string;
  mode: string;
  result: string;
  points_earned: number;
  played_at: string;
  games?: {
    name: string;
    icon: string;
  };
}

interface UserProfile {
  user: {
    id: string;
    fid: number | null;
    username: string;
    wallet_address: string | null;
    total_points: number;
    created_at: string;
  };
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  gameStats: Record<string, {
    played: number;
    wins: number;
    points: number;
  }>;
  badges: Badge[];
  recentSessions: GameSession[];
  rank: number | null;
}

export default function ProfilePage() {
  const [identifier, setIdentifier] = useState("");
  const [identifierType, setIdentifierType] = useState<"fid" | "wallet">("fid");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchProfile() {
    if (!identifier.trim()) {
      setError("Please enter a FID or wallet address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Normalize wallet address to lowercase for consistent querying
      const normalizedIdentifier = identifierType === "wallet"
        ? identifier.toLowerCase()
        : identifier;

      const param = identifierType === "fid"
        ? `fid=${normalizedIdentifier}`
        : `wallet=${normalizedIdentifier}`;

      console.log('[Profile Page] Fetching profile with:', param);
      const response = await fetch(`/api/user/profile?${param}`);

      if (!response.ok) {
        throw new Error('User not found');
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfile();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Back to Home */}
        <Link
          href="/"
          className="inline-block mb-6 text-gray-700 hover:text-gray-900 font-semibold transition-colors"
        >
          ← Back to Games
        </Link>

        {/* Page Title */}
        <div className="bg-white/90 backdrop-blur-lg rounded-xl p-6 mb-6 shadow-lg" style={{ border: '3px solid #FCFF52' }}>
          <h1 className="text-3xl font-black text-gray-900 text-center mb-2">
            👤 Player Profile
          </h1>
          <p className="text-center text-gray-600 text-sm">
            View your stats, badges, and game history
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white/90 backdrop-blur-lg rounded-xl p-6 mb-6 shadow-lg">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Search by:
              </label>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="fid"
                    checked={identifierType === "fid"}
                    onChange={(e) => setIdentifierType(e.target.value as "fid")}
                    className="mr-2"
                  />
                  <span className="font-semibold">Farcaster ID (FID)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="wallet"
                    checked={identifierType === "wallet"}
                    onChange={(e) => setIdentifierType(e.target.value as "wallet")}
                    className="mr-2"
                  />
                  <span className="font-semibold">Wallet Address</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={identifierType === "fid" ? "Enter FID (e.g. 12345)" : "Enter wallet address (0x...)"}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-gray-900 focus:outline-none font-mono text-sm"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Search"}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm font-semibold">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Profile Content */}
        {profile && (
          <div className="space-y-6">
            {/* User Stats */}
            <div className="bg-white/90 backdrop-blur-lg rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">
                    {profile.user.username}
                  </h2>
                  {profile.user.fid && (
                    <p className="text-sm text-gray-600">FID: {profile.user.fid}</p>
                  )}
                </div>
                {profile.rank && (
                  <div className="text-right">
                    <div className="text-3xl font-black text-gray-900">#{profile.rank}</div>
                    <div className="text-xs text-gray-600">Global Rank</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-gray-900">{profile.user.total_points}</div>
                  <div className="text-xs text-gray-600 font-semibold">Total Points</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-gray-900">{profile.stats.gamesPlayed}</div>
                  <div className="text-xs text-gray-600 font-semibold">Games Played</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-green-600">{profile.stats.wins}</div>
                  <div className="text-xs text-gray-600 font-semibold">Wins</div>
                </div>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <div className="text-2xl font-black text-gray-900">{profile.stats.winRate}%</div>
                  <div className="text-xs text-gray-600 font-semibold">Win Rate</div>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="bg-white/90 backdrop-blur-lg rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-black text-gray-900 mb-4">
                🏅 Badges ({profile.badges.length})
              </h3>
              {profile.badges.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {profile.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-4 text-center hover:scale-105 transition-transform"
                    >
                      <div className="text-4xl mb-2">{badge.icon}</div>
                      <div className="font-black text-gray-900 text-sm mb-1">{badge.name}</div>
                      <div className="text-xs text-gray-600 mb-2">{badge.description}</div>
                      <div className="text-xs font-bold text-yellow-700">+{badge.points} pts</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No badges earned yet. Keep playing to unlock achievements!
                </p>
              )}
            </div>

            {/* Per-Game Stats */}
            {Object.keys(profile.gameStats).length > 0 && (
              <div className="bg-white/90 backdrop-blur-lg rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-black text-gray-900 mb-4">
                  📊 Per-Game Statistics
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(profile.gameStats).map(([gameId, stats]) => (
                    <div key={gameId} className="bg-gray-100 rounded-lg p-4">
                      <div className="font-black text-gray-900 mb-2 capitalize">{gameId}</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Played:</span>
                          <span className="font-bold">{stats.played}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Wins:</span>
                          <span className="font-bold text-green-600">{stats.wins}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Points:</span>
                          <span className="font-bold">{stats.points}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Games */}
            {profile.recentSessions.length > 0 && (
              <div className="bg-white/90 backdrop-blur-lg rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-black text-gray-900 mb-4">
                  🎮 Recent Games
                </h3>
                <div className="space-y-2">
                  {profile.recentSessions.slice(0, 10).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-gray-100 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-gray-900 capitalize">
                          {session.games?.name || session.game_id}
                        </div>
                        <div className="text-xs text-gray-600">
                          {session.mode}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`font-bold text-sm ${
                          session.result === 'win' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {session.result.toUpperCase()}
                        </div>
                        <div className="font-bold text-sm text-gray-900">
                          +{session.points_earned} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
