import type { GameStats as Stats } from "@/hooks/useBlackjack";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface GameStatsProps {
  stats: Stats;
  mode: 'free' | 'onchain';
  credits?: number;
  onResetCredits?: () => void;
}

export function GameStats({ stats, mode, credits, onResetCredits }: GameStatsProps) {
  const { t } = useLanguage();
  const totalGames = stats.wins + stats.losses + stats.pushes;
  const winRate = totalGames > 0 ? ((stats.wins / totalGames) * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-lg border-2 border-gray-300">
      <h3 className="text-xl font-bold text-center mb-4 text-gray-900">{t('games.blackjack.statistics')}</h3>

      {/* Free mode credits */}
      {mode === 'free' && credits !== undefined && (
        <div className="mb-4 p-3 bg-gradient-to-r from-chain/10 to-chain/5 rounded-lg border-2 border-chain/50">
          <div className="text-sm text-gray-700 font-medium text-center">{t('games.blackjack.credits')}</div>
          <div className="text-3xl font-bold text-center text-gray-900">{credits}</div>
          {credits < 100 && (
            <button
              onClick={onResetCredits}
              className="mt-2 w-full px-3 py-1 text-xs bg-chain hover:bg-chain/50 text-gray-900 rounded-lg font-semibold transition-all shadow-sm"
            >
              {t('games.blackjack.resetCredits')}
            </button>
          )}
        </div>
      )}

      {/* Game stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatItem label={t('stats.wins')} value={stats.wins} color="text-green-600" />
        <StatItem label={t('stats.losses')} value={stats.losses} color="text-red-600" />
        <StatItem label={t('games.blackjack.pushes')} value={stats.pushes} color="text-gray-600" />
      </div>

      {/* Blackjacks */}
      {stats.blackjacks > 0 && (
        <div className="mb-4 text-center p-2 bg-gradient-to-r from-chain/5 to-chain/5 rounded-lg">
          <div className="text-sm text-gray-600">{t('games.blackjack.blackjacks')}</div>
          <div className="text-2xl font-bold text-orange-600">🃏 {stats.blackjacks}</div>
        </div>
      )}

      {/* Win rate */}
      <div className="pt-4 border-t border-gray-300">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">{t('stats.winRate')}</div>
          <div className="text-3xl font-bold text-gray-900">{winRate}%</div>
        </div>
      </div>

      {/* Streaks (on-chain only) */}
      {mode === 'onchain' && (stats.currentStreak > 0 || stats.bestStreak > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-300">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-xs text-gray-600">{t('stats.current')}</div>
              <div className="text-lg font-bold text-blue-600">{stats.currentStreak}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-600">{t('stats.best')}</div>
              <div className="text-lg font-bold text-gray-700">{stats.bestStreak}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-2 bg-gray-50 rounded-lg">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
