/**
 * Soneium brand icon - Sony blockchain L2
 * Minimalist "S" mark inspired by Soneium branding
 */
export function SoneiumIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Soneium"
    >
      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
      <path d="M62 35c0-6-5-10-12-10s-12 4-12 10c0 12 24 8 24 22 0 7-5 12-12 12s-12-5-12-12" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}
