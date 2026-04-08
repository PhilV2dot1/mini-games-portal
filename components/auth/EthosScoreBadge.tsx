'use client';

// Official Ethos logo SVG (from @thebbz/siwe-ethos-react SDK)
export function EthosLogo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 512 512" className={className} aria-label="Ethos">
      <rect width="512" height="512" fill="currentColor" opacity="0.15" rx="100" />
      <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M255.38 255.189a254.98 254.98 0 0 1-1.935 31.411H101v62.2h136.447a251.522 251.522 0 0 1-35.932 62.2H411v-62.2H237.447a250.584 250.584 0 0 0 15.998-62.2H411v-62.2H253.521a250.604 250.604 0 0 0-15.826-62.2H411V100H202.003a251.526 251.526 0 0 1 35.692 62.2H101v62.2h152.521a255 255 0 0 1 1.859 30.789Z" />
    </svg>
  );
}

interface EthosScoreBadgeProps {
  score: number;
  username?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreTier(score: number): { label: string; color: string; bg: string; border: string } {
  if (score >= 2000) return { label: 'Exemplary',    color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-400' };
  if (score >= 1600) return { label: 'Reputable',    color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-400' };
  if (score >= 1200) return { label: 'Neutral',      color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-400' };
  if (score >= 800)  return { label: 'Questionable', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-400' };
  return               { label: 'Untrusted',    color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-400' };
}

export function EthosScoreBadge({ score, username, size = 'md' }: EthosScoreBadgeProps) {
  const tier = getScoreTier(score);

  const sizeClasses = {
    sm: { wrap: 'px-2 py-1 gap-1.5',   score: 'text-sm font-bold',   label: 'text-xs', icon: 'w-3.5 h-3.5' },
    md: { wrap: 'px-3 py-2 gap-2',     score: 'text-base font-bold', label: 'text-xs', icon: 'w-4 h-4' },
    lg: { wrap: 'px-4 py-3 gap-2.5',   score: 'text-xl font-black',  label: 'text-sm', icon: 'w-5 h-5' },
  }[size];

  return (
    <a
      href={username ? `https://app.ethos.network/profile/${username}` : 'https://app.ethos.network'}
      target="_blank"
      rel="noopener noreferrer"
      title="View Ethos credibility profile"
      className={`inline-flex items-center rounded-lg border-2 ${tier.bg} ${tier.border} ${sizeClasses.wrap} hover:brightness-95 transition-all`}
    >
      <EthosLogo className={`${sizeClasses.icon} flex-shrink-0 ${tier.color}`} />
      <span className={`${sizeClasses.score} ${tier.color}`}>{score}</span>
      <span className={`${sizeClasses.label} ${tier.color} opacity-80`}>{tier.label}</span>
    </a>
  );
}
