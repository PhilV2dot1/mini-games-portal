/**
 * Base brand icon - official Base circle mark
 * Blue circle with white "b" shape
 * Based on official brand kit from base.org
 */
export function BaseIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 111 111"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Base"
    >
      <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF" />
      <path
        d="M55.3909 93.2691C76.1779 93.2691 93.0258 76.4213 93.0258 55.6343C93.0258 34.8473 76.1779 17.9994 55.3909 17.9994C35.6404 17.9994 19.4464 33.2285 18 52.5879H68.2541V58.6807H18C19.4464 78.0401 35.6404 93.2691 55.3909 93.2691Z"
        fill="white"
      />
    </svg>
  );
}
