/**
 * Soneium brand icon - uses the official Soneium.png logo
 */
export function SoneiumIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <img
      src="/icons/Soneium.png"
      alt="Soneium"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', borderRadius: '50%' }}
    />
  );
}
