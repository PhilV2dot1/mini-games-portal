'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTournamentList } from '@/hooks/useTournamentList';
import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { CreateTournamentModal } from '@/components/tournaments/CreateTournamentModal';
import { pageEnter } from '@/lib/utils/motion';

const STATUS_FILTERS = ['registration', 'in_progress', 'completed'] as const;

export default function TournamentsPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('registration');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { tournaments, loading, refresh } = useTournamentList(undefined, statusFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-200 to-gray-400 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-xl mx-auto">
        <Header />

        <motion.div {...pageEnter} className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">
              {t('tournament.title')}
            </h2>
            {isAuthenticated && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 font-semibold text-sm rounded-lg transition-colors hover:opacity-90"
                style={{ backgroundColor: 'var(--chain-primary)', color: 'var(--chain-contrast)' }}
                data-testid="create-tournament"
              >
                {t('tournament.create')}
              </button>
            )}
          </div>

          {/* Status Filters */}
          <div className="flex gap-2">
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === status
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {t(`tournament.filters.${status === 'registration' ? 'open' : status === 'in_progress' ? 'inProgress' : 'completed'}` as never)}
              </button>
            ))}
          </div>

          {/* Tournament List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400 dark:text-gray-500">{t('loading')}</p>
            </div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {t('tournament.noTournaments')}
              </p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="tournament-list">
              {tournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}

          {!isAuthenticated && (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('tournament.loginRequired')}
              </p>
            </div>
          )}
        </motion.div>

        {/* Create Tournament Modal */}
        <CreateTournamentModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={refresh}
        />
      </div>
    </div>
  );
}
