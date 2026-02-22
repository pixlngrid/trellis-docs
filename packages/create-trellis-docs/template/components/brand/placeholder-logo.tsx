/**
 * Placeholder logo components.
 * Replace these with your own brand SVGs or images.
 */

interface LogoProps {
  className?: string
  size?: number
}

/** Small icon for navbar (default 32px) */
export function PlaceholderIcon({ className, size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="6" fill="currentColor" opacity="0.15" />
      <path
        d="M8 10h16M8 16h12M8 22h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Text wordmark for navbar and hero */
export function PlaceholderWordmark({ className }: { className?: string }) {
  return (
    <span className={className} style={{ fontWeight: 700, fontSize: '1.25rem' }}>
      Docs
    </span>
  )
}
