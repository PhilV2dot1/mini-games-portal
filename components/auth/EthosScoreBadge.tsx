'use client';

interface EthosScoreBadgeProps {
  score: number;
  username?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreTier(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 2000) return { label: 'Exemplary', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-400' };
  if (score >= 1600) return { label: 'Reputable', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-400' };
  if (score >= 1200) return { label: 'Neutral',   color: 'text-blue-700',  bg: 'bg-blue-50',  border: 'border-blue-400' };
  if (score >= 800)  return { label: 'Questionable', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-400' };
  return               { label: 'Untrusted',  color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-400' };
}

export function EthosScoreBadge({ score, username, size = 'md' }: EthosScoreBadgeProps) {
  const tier = getScoreTier(score);

  const sizeClasses = {
    sm: { wrap: 'px-2 py-1 gap-1.5', score: 'text-sm font-bold', label: 'text-xs', icon: 'w-3 h-3' },
    md: { wrap: 'px-3 py-2 gap-2',   score: 'text-base font-bold', label: 'text-xs', icon: 'w-4 h-4' },
    lg: { wrap: 'px-4 py-3 gap-2.5', score: 'text-xl font-black', label: 'text-sm', icon: 'w-5 h-5' },
  }[size];

  return (
    <a
      href={username ? `https://app.ethos.network/profile/${username}` : 'https://app.ethos.network'}
      target="_blank"
      rel="noopener noreferrer"
      title="View Ethos credibility profile"
      className={`inline-flex items-center rounded-lg border-2 ${tier.bg} ${tier.border} ${sizeClasses.wrap} hover:brightness-95 transition-all`}
    >
      {/* Ethos logo */}
      <svg className={`${sizeClasses.icon} flex-shrink-0 ${tier.color}`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
      </svg>
      <span className={`${sizeClasses.score} ${tier.color}`}>{score}</span>
      <span className={`${sizeClasses.label} ${tier.color} opacity-80`}>{tier.label}</span>
    </a>
  );
}
