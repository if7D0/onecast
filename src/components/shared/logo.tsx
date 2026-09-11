interface LogoMarkProps {
  className?: string;
}

/**
 * Logo OneCast: sinyal siar (satu titik memencar menjadi banyak) —
 * satu konten menjadi banyak format. Flat 2 warna brand.
 */
export function LogoMark({ className = "h-8 w-8" }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden role="presentation">
      <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
      <circle cx="12" cy="19" r="3.2" fill="var(--color-accent)" />
      <path
        d="M16.5 14.5a7 7 0 0 1 0 9"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M20.5 11a12 12 0 0 1 0 16"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}
