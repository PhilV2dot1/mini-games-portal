'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTournament } from '@/hooks/useTournament';
import { TournamentBracket } from '@/components/tournaments/TournamentBracket';
import { TournamentLobby } from '@/components/tournaments/TournamentLobby';
import { pageEnter } from '@/lib/utils/motion';

const GAME_ROUTES: Record<string, string> = {
  tictactoe: '/tictactoe',
  rps: '/rps',
  connectfive: '/games/connect-five',
  yahtzee: '/games/yahtzee',
  blackjack: '/blackjack',
  mastermind: '/mastermind',
};

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [creatingRoom, setCreatingRoom] = useState(false);

  const {
    tournament,
    participants,
    matches,
    myMatch,
    isJoined,
    loading,
    joinTournament,
    leaveTournament,
  } = useTournament(tournamentId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
        <div className="max-w-xl mx-auto">
          <Header />
          <div className="text-center py-12">
            <p className="text-gray-400 dark:text-gray-500">{t('loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
        <div className="max-w-xl mx-auto">
          <Header />
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Tournament not found</p>
            <Link href="/tournaments" className="text-sm mt-2 inline-block" style={{ color: 'var(--chain-primary)' }}>
              {t('back')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const gameRoute = GAME_ROUTES[tournament.game_id] || '/';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto">
        <Header />

        <motion.div {...pageEnter} className="space-y-6">
          {/* Back link */}
          <Link
            href="/tournaments"
            className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            &larr; {t('tournament.title')}
          </Link>

          {/* Tournament Header */}
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {tournament.name}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="capitalize">{tournament.game_id}</span>
              <span>&middot;</span>
              <span>{t('tournament.singleElimination')}</span>
              <span>&middot;</span>
              <span>{tournament.prize_points} pts {t('tournament.prize').toLowerCase()}</span>
            </div>
          </div>

          {/* My current match - action card */}
          {myMatch && tournament.status === 'in_progress' && (
            <div className="p-4 rounded-lg border-2" style={{ borderColor: 'var(--chain-primary)', backgroundColor: 'color-mix(in srgb, var(--chain-primary) 5%, transparent)' }}>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                {t('tournament.yourMatch')}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                {myMatch.player1_username || '...'} vs {myMatch.player2_username || '...'}
              </p>
              {myMatch.room_id ? (
                <Link
                  href={`${gameRoute}?mode=multiplayer&roomId=${myMatch.room_id}`}
                  className="inline-block px-4 py-2 font-semibold text-sm rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: 'var(--chain-primary)', color: 'var(--chain-contrast)' }}
                >
                  {t('tournament.playNow')}
                </Link>
              ) : (
                <button
                  disabled={creatingRoom}
                  onClick={async () => {
                    if (!user?.id || !myMatch.id) return;
                    setCreatingRoom(true);
                    try {
                      const res = await fetch(`/api/tournaments/${tournamentId}/match/${myMatch.id}/room`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: user.id }),
                      });
                      const data = await res.json();
                      if (data.success && data.room) {
                        router.push(`${gameRoute}?mode=multiplayer&roomId=${data.room.id}`);
                      }
                    } catch {
                      // ignore
                    } finally {
                      setCreatingRoom(false);
                    }
                  }}
                  className="inline-block px-4 py-2 font-semibold text-sm rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--chain-primary)', color: 'var(--chain-contrast)' }}
                >
                  {creatingRoom ? '...' : t('tournament.playNow')}
                </button>
              )}
            </div>
          )}

          {/* Winner banner */}
          {tournament.status === 'completed' && tournament.winner_id && (
            <div className="p-4 rounded-lg text-center" style={{ backgroundColor: 'color-mix(in srgb, var(--chain-primary) 15%, transparent)' }}>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('tournament.tournamentComplete')}</p>
              <p className="text-lg font-black mt-1" style={{ color: 'var(--chain-primary)' }}>
                {t('tournament.winner')}: {participants.find(p => p.user_id === tournament.winner_id)?.display_name || participants.find(p => p.user_id === tournament.winner_id)?.username || '...'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                +{tournament.prize_points} pts
              </p>
            </div>
          )}

          {/* Registration / Bracket */}
          {tournament.status === 'registration' ? (
            isAuthenticated ? (
              <TournamentLobby
                tournament={tournament}
                participants={participants}
                isJoined={isJoined}
                onJoin={joinTournament}
                onLeave={leaveTournament}
                loading={loading}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('tournament.loginRequired')}
                </p>
              </div>
            )
          ) : (
            <section>
              <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">
                {t('tournament.bracket')}
              </h3>
              <TournamentBracket
                matches={matches}
                maxPlayers={tournament.max_players}
                currentUserId={participants.find(() => isJoined)?.user_id}
              />
            </section>
          )}
        </motion.div>
      </div>
    </div>
  );
}
