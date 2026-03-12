"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { GAMES } from "@/lib/types";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PlayerLevelBadge } from "@/components/shared/PlayerLevelBadge";
import { CeloIcon } from "@/components/shared/CeloIcon";
import { BaseIcon } from "@/components/shared/BaseIcon";
import { MegaEthIcon } from "@/components/shared/MegaEthIcon";
import { SoneiumIcon } from "@/components/shared/SoneiumIcon";

interface ChallengeEntry {
  rank: number;
  userId: string;
  username: string;
  displayName?: string;
  avatar_type?: string;
  avatar_url?: string;
  completed: number;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName?: string;
  fid: number | null;
  totalPoints?: number;
  xp?: number;
  gamePoints?: number;
  gamesPlayed: number;
  wins: number;
  avatar_type?: 'default' | 'predefined' | 'custom';
  avatar_url?: string;
}

type GameId = 'all' | string;

interface ChainFilter {
  id: number | null;
  label: string;
  icon: React.ReactNode;
}

const CHAIN_FILTERS: ChainFilter[] = [
  { id: null, label: 'All Chains', icon: <span className="text-sm">🌐</span> },
  { id: 42220, label: 'Celo', icon: <CeloIcon size={16} /> },
  { id: 8453, label: 'Base', icon: <BaseIcon size={16} /> },
  { id: 4326, label: 'MegaETH', icon: <MegaEthIcon size={16} /> },
  { id: 1868, label: 'Soneium', icon: <SoneiumIcon size={16} /> },
];

export default function LeaderboardPage() {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'scores' | 'challenges'>('scores');
  const [selectedGame, setSelectedGame] = useState<GameId>('all');
  const [selectedChain, setSelectedChain] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [challengeBoard, setChallengeBoard] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const games = Object.values(GAMES);

  useEffect(() => {
    if (viewMode === 'challenges') {
      setLoading(true);
      setError(null);
      fetch('/api/leaderboard/challenges?limit=50')
        .then(r => r.ok ? r.json() : Promise.reject('Failed'))
        .then(data => setChallengeBoard(data.leaderboard || []))
        .catch(err => setError(err instanceof Error ? err.message : 'An error occurred'))
        .finally(() => setLoading(false));
      return;
    }

    async function fetchLeaderboard() {
      setLoading(true);
      setError(null);

      try {
        const chainQuery = selectedChain !== null ? `&chain=${selectedChain}` : '';
        const url = selectedGame === 'all'
          ? `/api/leaderboard/global?limit=50${chainQuery}`
          : `/api/leaderboard/game/${selectedGame}?limit=50${chainQuery}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [selectedGame, selectedChain, viewMode]);

  const activeChain = CHAIN_FILTERS.find(c => c.id === selectedChain);

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Back to Home */}
        <Link
          href="/"
          className="inline-block mb-6 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold transition-colors"
        >
          ← {t('back') || 'Back'} to Games
        </Link>

        {/* Page Title */}
        <div
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 mb-6 shadow-xl border-2 border-chain text-center"
        >
          <div className="text-5xl mb-2">🏆</div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            {t('leaderboard.title') || 'Leaderboard'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('leaderboard.subtitle') || 'Top players across all games on Mini Games Portal'}
          </p>
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode('scores')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              viewMode === 'scores'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
            }`}
          >
            🏆 {t('leaderboard.scores') || 'Scores'}
          </button>
          <button
            onClick={() => setViewMode('challenges')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              viewMode === 'challenges'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
            }`}
          >
            🎯 {t('leaderboard.challenges') || 'Daily Challenges'}
          </button>
        </div>

        {/* Challenge Leaderboard */}
        {viewMode === 'challenges' && (
          <>
            {loading ? (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">{t('leaderboard.loadingLeaderboard') || 'Loading...'}</p>
              </div>
            ) : error ? (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg p-12 text-center">
                <p className="text-red-600 dark:text-red-400 font-semibold">Error: {error}</p>
              </div>
            ) : challengeBoard.length === 0 ? (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg p-12 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  {t('leaderboard.noChallenges') || 'No challenge completions yet. Be the first!'}
                </p>
              </div>
            ) : (
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                  <h2 className="font-black text-gray-900 dark:text-white text-lg">
                    🎯 {t('leaderboard.challengeRanking') || 'Challenge Ranking'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('leaderboard.challengeRankingDesc') || 'Players ranked by number of daily challenges completed'}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {t('leaderboard.rank') || 'Rank'}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          {t('leaderboard.player') || 'Player'}
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          🎯 {t('leaderboard.completed') || 'Completed'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {challengeBoard.map((entry, index) => (
                        <tr
                          key={entry.userId}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${index < 3 ? 'bg-yellow-50/30 dark:bg-yellow-900/10' : ''}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {entry.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                              {entry.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                              {entry.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                              <span className="text-lg font-black text-gray-900 dark:text-white">#{entry.rank}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 flex-shrink-0">
                                <div className="relative w-full h-full rounded-full overflow-hidden border-2 shadow-sm" style={{ borderColor: 'var(--chain-primary)' }}>
                                  <Image
                                    src={entry.avatar_url || '/avatars/predefined/default-player.svg'}
                                    alt={entry.username}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              </div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {entry.displayName || entry.username}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className="text-lg font-black" style={{ color: 'var(--chain-primary)' }}>
                              {entry.completed}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              {entry.completed === 1 ? (t('daily.title') || 'challenge') : (t('leaderboard.challengesCount') || 'challenges')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Scores leaderboard — only show when in scores mode */}
        {viewMode === 'scores' && <>

        {/* Chain Filter Tabs */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 mb-4 shadow-lg">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Filter by Chain
          </p>
          <div className="flex flex-wrap gap-2">
            {CHAIN_FILTERS.map((chain) => (
              <button
                key={chain.id ?? 'all'}
                onClick={() => setSelectedChain(chain.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedChain === chain.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg scale-105'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {chain.icon}
                <span>{chain.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Game Filter Tabs */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-4 mb-6 shadow-lg">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Filter by Game
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setSelectedGame('all')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                selectedGame === 'all'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg scale-105'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              🌍 All Games
            </button>
            {games.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  selectedGame === game.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg scale-105'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {game.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading / Error States */}
        {loading ? (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t('leaderboard.loadingLeaderboard') || 'Loading leaderboard...'}</p>
          </div>
        ) : error ? (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg p-12 text-center">
            <p className="text-red-600 dark:text-red-400 font-semibold">Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {selectedChain !== null
                ? `No players yet on ${activeChain?.label}. Be the first to play on-chain!`
                : 'No players yet. Be the first to play!'}
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* 2nd Place */}
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 shadow-lg border-2 border-gray-400 dark:border-gray-500 transform md:translate-y-4">
                  <div className="text-center">
                    <div className="text-6xl mb-2">🥈</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white mb-3">#{leaderboard[1].rank}</div>
                    <div className="flex justify-center mb-3">
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-gray-400 dark:border-gray-500 shadow-md">
                        <Image
                          src={leaderboard[1].avatar_url || '/avatars/predefined/default-player.svg'}
                          alt={leaderboard[1].username}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{leaderboard[1].displayName || leaderboard[1].username}</div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white mb-1">
                      {(selectedGame === 'all' ? leaderboard[1].totalPoints : leaderboard[1].gamePoints)?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{t('leaderboard.points') || 'points'}</div>
                    <div className="flex justify-center gap-4 text-sm">
                      <div>
                        <div className="font-black text-gray-700 dark:text-gray-200">{leaderboard[1].gamesPlayed}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('leaderboard.gamesPlayed') || 'Games'}</div>
                      </div>
                      <div>
                        <div className="font-black text-green-600 dark:text-green-400">{leaderboard[1].wins}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('leaderboard.wins') || 'Wins'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="bg-gradient-to-br from-chain/20 to-chain/30 dark:from-gray-600 dark:to-gray-700 rounded-xl p-6 shadow-2xl border-4 border-chain transform scale-105">
                  <div className="text-center">
                    <div className="text-7xl mb-2">🥇</div>
                    <div className="text-3xl font-black text-gray-900 dark:text-white mb-3">#{leaderboard[0].rank}</div>
                    <div className="flex justify-center mb-3">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-chain shadow-lg">
                        <Image
                          src={leaderboard[0].avatar_url || '/avatars/predefined/default-player.svg'}
                          alt={leaderboard[0].username}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="text-xl font-black text-gray-900 dark:text-white mb-3">{leaderboard[0].displayName || leaderboard[0].username}</div>
                    <div className="text-4xl font-black text-gray-900 dark:text-white mb-1">
                      {(selectedGame === 'all' ? leaderboard[0].totalPoints : leaderboard[0].gamePoints)?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300 mb-3 font-bold">{t('leaderboard.points') || 'points'}</div>
                    <div className="flex justify-center gap-6 text-sm">
                      <div>
                        <div className="font-black text-gray-900 dark:text-white text-lg">{leaderboard[0].gamesPlayed}</div>
                        <div className="text-xs text-gray-700 dark:text-gray-300 font-semibold">{t('leaderboard.gamesPlayed') || 'Games'}</div>
                      </div>
                      <div>
                        <div className="font-black text-green-700 dark:text-green-400 text-lg">{leaderboard[0].wins}</div>
                        <div className="text-xs text-gray-700 dark:text-gray-300 font-semibold">{t('leaderboard.wins') || 'Wins'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="bg-gradient-to-br from-chain/10 to-chain/20 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 shadow-lg border-2 border-chain transform md:translate-y-8">
                  <div className="text-center">
                    <div className="text-5xl mb-2">🥉</div>
                    <div className="text-xl font-black text-gray-900 dark:text-white mb-3">#{leaderboard[2].rank}</div>
                    <div className="flex justify-center mb-3">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-chain shadow-md">
                        <Image
                          src={leaderboard[2].avatar_url || '/avatars/predefined/default-player.svg'}
                          alt={leaderboard[2].username}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                    <div className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2">{leaderboard[2].displayName || leaderboard[2].username}</div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white mb-1">
                      {(selectedGame === 'all' ? leaderboard[2].totalPoints : leaderboard[2].gamePoints)?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">{t('leaderboard.points') || 'points'}</div>
                    <div className="flex justify-center gap-4 text-sm">
                      <div>
                        <div className="font-black text-gray-700 dark:text-gray-200">{leaderboard[2].gamesPlayed}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('leaderboard.gamesPlayed') || 'Games'}</div>
                      </div>
                      <div>
                        <div className="font-black text-green-600 dark:text-green-400">{leaderboard[2].wins}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t('leaderboard.wins') || 'Wins'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Full Leaderboard Table */}
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {t('leaderboard.rank') || 'Rank'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {t('leaderboard.player') || 'Player'}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {t('leaderboard.points') || 'Points'}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {t('leaderboard.gamesPlayed') || 'Games'}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {t('leaderboard.wins') || 'Wins'}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      {t('stats.winRate') || 'Win Rate'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {leaderboard.map((entry, index) => {
                    const winRate = entry.gamesPlayed > 0
                      ? ((entry.wins / entry.gamesPlayed) * 100).toFixed(0)
                      : '0';

                    const points = selectedGame === 'all' ? entry.totalPoints : entry.gamePoints;

                    return (
                      <tr
                        key={entry.userId}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                          index < 3 ? 'bg-chain/5/50 dark:bg-gray-700/30' : ''
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {entry.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                            {entry.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                            {entry.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                            <span className="text-lg font-black text-gray-900 dark:text-white">
                              #{entry.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="relative w-10 h-10 flex-shrink-0">
                              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-chain shadow-sm">
                                <Image
                                  src={entry.avatar_url || '/avatars/predefined/default-player.svg'}
                                  alt={entry.username}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </div>
                            {/* Display Name */}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  {entry.displayName || entry.username}
                                </span>
                                {entry.xp !== undefined && (
                                  <PlayerLevelBadge xp={entry.xp} variant="compact" />
                                )}
                              </div>
                              {entry.fid && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  FID: {entry.fid}
                                </div>
                              )}
                            </div>
                            {/* Active chain badge */}
                            {selectedChain !== null && activeChain && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-600 dark:text-gray-300">
                                {activeChain.icon}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-lg font-black text-gray-900 dark:text-white">
                            {points?.toLocaleString() || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {entry.gamesPlayed}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {entry.wins}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {winRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          </>
        )}

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Rankings update automatically as players compete across games</p>
        </div>

        </> /* end viewMode === 'scores' */}
      </div>
    </main>
  );
}
