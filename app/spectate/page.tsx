/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useSpectator } from "@/hooks/useSpectator";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { motion } from "framer-motion";
import type { MultiplayerRoom, RoomPlayer } from "@/lib/multiplayer/types";

// Game display names
const GAME_NAMES: Record<string, string> = {
  tictactoe: "Tic-Tac-Toe",
  rps: "Rock Paper Scissors",
  connectfive: "Connect Five",
  yahtzee: "Yahtzee",
  blackjack: "Blackjack",
  mastermind: "Mastermind",
  solitaire: "Solitaire",
};

const GAME_ICONS: Record<string, string> = {
  tictactoe: "⭕",
  rps: "✊",
  connectfive: "🔴",
  yahtzee: "🎲",
  blackjack: "🃏",
  mastermind: "🧩",
  solitaire: "🃏",
};

interface ActiveRoom extends MultiplayerRoom {
  multiplayer_room_players?: (RoomPlayer & {
    users?: {
      username?: string;
      display_name?: string;
      avatar_url?: string;
    };
  })[];
}

export default function SpectatePage() {
  const { t } = useLanguage();
  const spectator = useSpectator();
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // Fetch active (playing) rooms
  const fetchActiveRooms = useCallback(async () => {
    try {
      const url = selectedGame
        ? `/api/multiplayer/rooms?status=playing&gameId=${selectedGame}`
        : `/api/multiplayer/rooms?status=playing`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setActiveRooms(data.rooms || []);
      }
    } catch (err) {
      console.error('Failed to fetch active rooms:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, [selectedGame]);

  // Initial fetch + periodic refresh
  useEffect(() => {
    fetchActiveRooms();
    const interval = setInterval(fetchActiveRooms, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [fetchActiveRooms]);

  // Handle spectating a room
  const handleSpectate = async (roomId: string) => {
    await spectator.spectateRoom(roomId);
  };

  const isSpectating = spectator.room !== null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Back to Portal */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-900 dark:text-white hover:text-chain transition-colors font-bold"
        >
          {t('games.backToPortal')}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-indigo-500 text-center space-y-1"
        >
          <div className="text-5xl mb-2">👁️</div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white">
            {t('spectator.title') || 'Spectate'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('spectator.subtitle') || 'Watch live multiplayer games in real-time'}
          </p>
        </motion.div>

        {/* Spectating a game */}
        {isSpectating ? (
          <>
            {/* Spectating banner */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-indigo-100 dark:bg-indigo-900/30 rounded-xl p-4 text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="font-bold text-indigo-700 dark:text-indigo-300">
                  {t('spectator.liveLabel') || 'LIVE'}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('spectator.watching') || 'Watching'}{" "}
                <span className="font-bold">
                  {GAME_ICONS[spectator.room?.game_id || ''] || '🎮'}{" "}
                  {GAME_NAMES[spectator.room?.game_id || ''] || spectator.room?.game_id}
                </span>
              </p>
            </motion.div>

            {/* Players list */}
            <div className="flex justify-center gap-4 flex-wrap">
              {spectator.players.map((player, i) => (
                <div key={player.user_id} className="bg-white/80 dark:bg-gray-700/80 rounded-lg px-4 py-2 text-sm font-medium">
                  <span className="text-gray-500 dark:text-gray-400">P{player.player_number}:</span>{" "}
                  <span className="text-gray-900 dark:text-white">
                    {(player as any).users?.display_name || `Player ${i + 1}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Game state summary */}
            {spectator.gameState && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl border-2 border-indigo-300"
              >
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">
                  {t('spectator.gameState') || 'Game State'}
                </h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  {'currentTurn' in spectator.gameState && (
                    <p>{t('spectator.currentTurn') || 'Current Turn'}: <span className="font-bold text-gray-900 dark:text-white">Player {(spectator.gameState as any).currentTurn}</span></p>
                  )}
                  {'score' in spectator.gameState && (
                    <p>{t('spectator.score') || 'Score'}: <span className="font-bold text-gray-900 dark:text-white">{(spectator.gameState as any).score}</span></p>
                  )}
                  {'round' in spectator.gameState && (
                    <p>{t('spectator.round') || 'Round'}: <span className="font-bold text-gray-900 dark:text-white">{(spectator.gameState as any).round}/{(spectator.gameState as any).maxRounds}</span></p>
                  )}
                  {'scores' in spectator.gameState && (
                    <p>{t('spectator.scores') || 'Scores'}: <span className="font-bold text-gray-900 dark:text-white">{((spectator.gameState as any).scores || []).join(' - ')}</span></p>
                  )}
                  {spectator.room?.status === 'finished' && (
                    <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-center">
                      <p className="font-bold text-yellow-700 dark:text-yellow-300">
                        {t('spectator.gameFinished') || 'Game Finished!'}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Recent actions feed */}
            {spectator.actions.length > 0 && (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-4 shadow-lg max-h-48 overflow-y-auto">
                <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {t('spectator.recentActions') || 'Recent Actions'}
                </h3>
                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  {spectator.actions.slice().reverse().map((action, i) => (
                    <div key={action.id || i} className="flex gap-2">
                      <span className="text-gray-400">{new Date(action.created_at).toLocaleTimeString()}</span>
                      <span className="font-medium">{action.action_type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stop spectating */}
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={spectator.stopSpectating}
                className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg transition-all"
              >
                {t('spectator.stopWatching') || 'Stop Watching'}
              </motion.button>
            </div>
          </>
        ) : (
          <>
            {/* Game filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedGame(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  !selectedGame
                    ? 'bg-chain text-gray-900 shadow-lg'
                    : 'bg-white/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                }`}
              >
                {t('spectator.allGames') || 'All Games'}
              </button>
              {Object.entries(GAME_NAMES).map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => setSelectedGame(id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedGame === id
                      ? 'bg-chain text-gray-900 shadow-lg'
                      : 'bg-white/60 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                  }`}
                >
                  {GAME_ICONS[id]} {name}
                </button>
              ))}
            </div>

            {/* Active rooms list */}
            {isLoadingRooms ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {t('spectator.loading') || 'Loading active games...'}
              </div>
            ) : activeRooms.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 space-y-3"
              >
                <div className="text-5xl">🏟️</div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  {t('spectator.noGames') || 'No active games right now'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {t('spectator.checkBack') || 'Check back later or start a game yourself!'}
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-3">
                {activeRooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-chain transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{GAME_ICONS[room.game_id] || '🎮'}</span>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {GAME_NAMES[room.game_id] || room.game_id}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              {t('spectator.liveLabel') || 'LIVE'}
                            </span>
                            <span>•</span>
                            <span>{room.mode}</span>
                            <span>•</span>
                            <span>
                              {room.multiplayer_room_players?.length || room.current_players} {t('spectator.playersLabel') || 'players'}
                            </span>
                          </div>
                          {/* Player names */}
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {room.multiplayer_room_players?.map((p, i) => (
                              <span key={p.user_id}>
                                {i > 0 && ' vs '}
                                {(p as any).users?.display_name || `Player ${p.player_number}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        onClick={() => handleSpectate(room.id)}
                        disabled={spectator.isLoading}
                        className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:brightness-110 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
                      >
                        {spectator.isLoading ? '...' : (t('spectator.watch') || 'Watch')}
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Auto-refresh indicator */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              {t('spectator.autoRefresh') || 'Auto-refreshing every 10 seconds'}
            </p>
          </>
        )}

        {/* Error */}
        {spectator.error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-700 dark:text-red-300 text-center">
            {spectator.error}
          </div>
        )}
      </div>
    </main>
  );
}
