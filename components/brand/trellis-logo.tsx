/**
 * Trellis brand logo components.
 *
 * Variations: Icon, Stacked, Horizontal, Wordmark
 * Each accepts standard SVG/HTML attributes (className, width, height, etc.)
 */

import React from 'react'

/* ─── Brand palette (extracted from logo) ─────────────────────────── */

export const brand = {
  navyDark: '#1a3b5c',
  navyMid: '#2a5a82',
  blueMid: '#7ba4c4',
  blueLight: '#a3c4db',
  olive: '#a2b53a',
  oliveLight: '#b8c960',
  white: '#ffffff',
  subtitle: '#5a7a96',
} as const

/* ─── Shared mark (the circular icon) ─────────────────────────────── */

function Mark({ size = 120 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
    >
      {/* Background circle — split dark/light */}
      <clipPath id="trellis-circle">
        <circle cx="60" cy="60" r="56" />
      </clipPath>
      <g clipPath="url(#trellis-circle)">
        <rect x="0" y="0" width="60" height="120" fill={brand.navyDark} />
        <rect x="60" y="0" width="60" height="120" fill={brand.blueMid} />
      </g>
      <circle cx="60" cy="60" r="56" stroke={brand.navyDark} strokeWidth="1.5" fill="none" />

      {/* Lattice grid (white bars) */}
      <g stroke={brand.white} strokeWidth="4" strokeLinecap="round">
        {/* Horizontal bars */}
        <line x1="16" y1="36" x2="104" y2="36" />
        <line x1="16" y1="60" x2="104" y2="60" />
        <line x1="16" y1="84" x2="104" y2="84" />
        {/* Vertical bars */}
        <line x1="36" y1="12" x2="36" y2="108" />
        <line x1="60" y1="12" x2="60" y2="108" />
        <line x1="84" y1="12" x2="84" y2="108" />
      </g>

      {/* Lattice node squares at intersections */}
      <g fill={brand.white}>
        <rect x="33" y="33" width="6" height="6" rx="1" />
        <rect x="57" y="33" width="6" height="6" rx="1" />
        <rect x="81" y="33" width="6" height="6" rx="1" />
        <rect x="33" y="57" width="6" height="6" rx="1" />
        <rect x="57" y="57" width="6" height="6" rx="1" />
        <rect x="81" y="57" width="6" height="6" rx="1" />
        <rect x="33" y="81" width="6" height="6" rx="1" />
        <rect x="57" y="81" width="6" height="6" rx="1" />
        <rect x="81" y="81" width="6" height="6" rx="1" />
      </g>

      {/* Code symbols (olive/lime green) */}
      <g
        fontFamily="'Segoe UI', system-ui, monospace"
        fontWeight="700"
        fill={brand.olive}
      >
        {/* Row 1 */}
        <text x="21" y="30" fontSize="14">&lt;</text>
        <text x="44" y="30" fontSize="14">-</text>
        <text x="66" y="28" fontSize="14">/.</text>
        {/* Row 2 */}
        <text x="19" y="54" fontSize="14">&lt;</text>
        <text x="44" y="54" fontSize="14">.</text>
        <text x="68" y="54" fontSize="14">&gt;</text>
        {/* Row 3 */}
        <text x="44" y="78" fontSize="14">/</text>
        <text x="68" y="78" fontSize="14">.</text>
        {/* Row 4 */}
        <text x="21" y="100" fontSize="12">||</text>
        <text x="43" y="100" fontSize="14">.</text>
        <text x="66" y="100" fontSize="14">/</text>
        <text x="88" y="100" fontSize="14">.</text>
      </g>
    </svg>
  )
}

/* ─── Icon only ───────────────────────────────────────────────────── */

type SvgProps = React.SVGAttributes<SVGSVGElement> & {
  size?: number
}

export function TrellisIcon({ size = 40, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      {...props}
    >
      {/* Background circle — split dark/light */}
      <clipPath id="trellis-icon-clip">
        <circle cx="60" cy="60" r="56" />
      </clipPath>
      <g clipPath="url(#trellis-icon-clip)">
        <rect x="0" y="0" width="60" height="120" fill={brand.navyDark} />
        <rect x="60" y="0" width="60" height="120" fill={brand.blueMid} />
      </g>
      <circle cx="60" cy="60" r="56" stroke={brand.navyDark} strokeWidth="1.5" fill="none" />

      {/* Lattice grid */}
      <g stroke={brand.white} strokeWidth="4" strokeLinecap="round">
        <line x1="16" y1="36" x2="104" y2="36" />
        <line x1="16" y1="60" x2="104" y2="60" />
        <line x1="16" y1="84" x2="104" y2="84" />
        <line x1="36" y1="12" x2="36" y2="108" />
        <line x1="60" y1="12" x2="60" y2="108" />
        <line x1="84" y1="12" x2="84" y2="108" />
      </g>

      {/* Intersection nodes */}
      <g fill={brand.white}>
        <rect x="33" y="33" width="6" height="6" rx="1" />
        <rect x="57" y="33" width="6" height="6" rx="1" />
        <rect x="81" y="33" width="6" height="6" rx="1" />
        <rect x="33" y="57" width="6" height="6" rx="1" />
        <rect x="57" y="57" width="6" height="6" rx="1" />
        <rect x="81" y="57" width="6" height="6" rx="1" />
        <rect x="33" y="81" width="6" height="6" rx="1" />
        <rect x="57" y="81" width="6" height="6" rx="1" />
        <rect x="81" y="81" width="6" height="6" rx="1" />
      </g>

      {/* Code symbols */}
      <g fontFamily="'Segoe UI', system-ui, monospace" fontWeight="700" fill={brand.olive}>
        <text x="21" y="30" fontSize="14">&lt;</text>
        <text x="44" y="30" fontSize="14">-</text>
        <text x="66" y="28" fontSize="14">/.</text>
        <text x="19" y="54" fontSize="14">&lt;</text>
        <text x="44" y="54" fontSize="14">.</text>
        <text x="68" y="54" fontSize="14">&gt;</text>
        <text x="44" y="78" fontSize="14">/</text>
        <text x="68" y="78" fontSize="14">.</text>
        <text x="21" y="100" fontSize="12">||</text>
        <text x="43" y="100" fontSize="14">.</text>
        <text x="66" y="100" fontSize="14">/</text>
        <text x="88" y="100" fontSize="14">.</text>
      </g>
    </svg>
  )
}

/* ─── Stacked (icon + text below) ─────────────────────────────────── */

export function TrellisStacked({
  size = 200,
  ...props
}: SvgProps) {
  const iconSize = size * 0.65
  const totalHeight = size * 0.95
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 240"
      width={size}
      height={totalHeight * 1.2}
      fill="none"
      {...props}
    >
      {/* Icon centered */}
      <g transform="translate(40, 0) scale(1)">
        <clipPath id="trellis-stacked-clip">
          <circle cx="60" cy="60" r="56" />
        </clipPath>
        <g clipPath="url(#trellis-stacked-clip)">
          <rect x="0" y="0" width="60" height="120" fill={brand.navyDark} />
          <rect x="60" y="0" width="60" height="120" fill={brand.blueMid} />
        </g>
        <circle cx="60" cy="60" r="56" stroke={brand.navyDark} strokeWidth="1.5" fill="none" />

        <g stroke={brand.white} strokeWidth="4" strokeLinecap="round">
          <line x1="16" y1="36" x2="104" y2="36" />
          <line x1="16" y1="60" x2="104" y2="60" />
          <line x1="16" y1="84" x2="104" y2="84" />
          <line x1="36" y1="12" x2="36" y2="108" />
          <line x1="60" y1="12" x2="60" y2="108" />
          <line x1="84" y1="12" x2="84" y2="108" />
        </g>
        <g fill={brand.white}>
          <rect x="33" y="33" width="6" height="6" rx="1" />
          <rect x="57" y="33" width="6" height="6" rx="1" />
          <rect x="81" y="33" width="6" height="6" rx="1" />
          <rect x="33" y="57" width="6" height="6" rx="1" />
          <rect x="57" y="57" width="6" height="6" rx="1" />
          <rect x="81" y="57" width="6" height="6" rx="1" />
          <rect x="33" y="81" width="6" height="6" rx="1" />
          <rect x="57" y="81" width="6" height="6" rx="1" />
          <rect x="81" y="81" width="6" height="6" rx="1" />
        </g>
        <g fontFamily="'Segoe UI', system-ui, monospace" fontWeight="700" fill={brand.olive}>
          <text x="21" y="30" fontSize="14">&lt;</text>
          <text x="44" y="30" fontSize="14">-</text>
          <text x="66" y="28" fontSize="14">/.</text>
          <text x="19" y="54" fontSize="14">&lt;</text>
          <text x="44" y="54" fontSize="14">.</text>
          <text x="68" y="54" fontSize="14">&gt;</text>
          <text x="44" y="78" fontSize="14">/</text>
          <text x="68" y="78" fontSize="14">.</text>
          <text x="21" y="100" fontSize="12">||</text>
          <text x="43" y="100" fontSize="14">.</text>
          <text x="66" y="100" fontSize="14">/</text>
          <text x="88" y="100" fontSize="14">.</text>
        </g>
      </g>

      {/* "Trellis" wordmark */}
      <text
        x="100"
        y="155"
        textAnchor="middle"
        fontFamily="'Segoe UI', 'SF Pro Display', system-ui, sans-serif"
        fontSize="40"
        fontWeight="700"
        fill="currentColor"
      >
        Trellis
      </text>

      {/* Subtitle */}
      <text
        x="100"
        y="175"
        textAnchor="middle"
        fontFamily="'Segoe UI', 'SF Pro Display', system-ui, sans-serif"
        fontSize="14"
        fontWeight="400"
        letterSpacing="1.5"
        fill="currentColor"
        opacity="0.6"
      >
        docs-as-code
      </text>
    </svg>
  )
}

/* ─── Horizontal (icon + text right) ──────────────────────────────── */

export function TrellisHorizontal({
  height = 40,
  showTagline = false,
  ...props
}: SvgProps & { height?: number; showTagline?: boolean }) {
  const vbWidth = showTagline ? 290 : 220
  const vbHeight = 60
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      height={height}
      width={height * (vbWidth / vbHeight)}
      fill="none"
      {...props}
    >
      {/* Icon (scaled to 50×50, centered in 60 height) */}
      <g transform="translate(2, 5) scale(0.42)">
        <clipPath id="trellis-horiz-clip">
          <circle cx="60" cy="60" r="56" />
        </clipPath>
        <g clipPath="url(#trellis-horiz-clip)">
          <rect x="0" y="0" width="60" height="120" fill={brand.navyDark} />
          <rect x="60" y="0" width="60" height="120" fill={brand.blueMid} />
        </g>
        <circle cx="60" cy="60" r="56" stroke={brand.navyDark} strokeWidth="2" fill="none" />

        <g stroke={brand.white} strokeWidth="5" strokeLinecap="round">
          <line x1="16" y1="36" x2="104" y2="36" />
          <line x1="16" y1="60" x2="104" y2="60" />
          <line x1="16" y1="84" x2="104" y2="84" />
          <line x1="36" y1="12" x2="36" y2="108" />
          <line x1="60" y1="12" x2="60" y2="108" />
          <line x1="84" y1="12" x2="84" y2="108" />
        </g>
        <g fill={brand.white}>
          <rect x="32" y="32" width="8" height="8" rx="1.5" />
          <rect x="56" y="32" width="8" height="8" rx="1.5" />
          <rect x="80" y="32" width="8" height="8" rx="1.5" />
          <rect x="32" y="56" width="8" height="8" rx="1.5" />
          <rect x="56" y="56" width="8" height="8" rx="1.5" />
          <rect x="80" y="56" width="8" height="8" rx="1.5" />
          <rect x="32" y="80" width="8" height="8" rx="1.5" />
          <rect x="56" y="80" width="8" height="8" rx="1.5" />
          <rect x="80" y="80" width="8" height="8" rx="1.5" />
        </g>
        <g fontFamily="'Segoe UI', system-ui, monospace" fontWeight="700" fill={brand.olive}>
          <text x="21" y="30" fontSize="16">&lt;</text>
          <text x="44" y="30" fontSize="16">-</text>
          <text x="66" y="28" fontSize="16">/.</text>
          <text x="19" y="54" fontSize="16">&lt;</text>
          <text x="44" y="54" fontSize="16">.</text>
          <text x="68" y="54" fontSize="16">&gt;</text>
          <text x="44" y="78" fontSize="16">/</text>
          <text x="68" y="78" fontSize="16">.</text>
          <text x="21" y="100" fontSize="14">||</text>
          <text x="43" y="100" fontSize="16">.</text>
          <text x="66" y="100" fontSize="16">/</text>
          <text x="88" y="100" fontSize="16">.</text>
        </g>
      </g>

      {/* Wordmark */}
      <text
        x="62"
        y={showTagline ? '32' : '40'}
        fontFamily="'Segoe UI', 'SF Pro Display', system-ui, sans-serif"
        fontSize="32"
        fontWeight="700"
        fill="currentColor"
      >
        Trellis
      </text>

      {/* Optional tagline */}
      {showTagline && (
        <text
          x="63"
          y="48"
          fontFamily="'Segoe UI', 'SF Pro Display', system-ui, sans-serif"
          fontSize="11"
          fontWeight="400"
          letterSpacing="1.5"
          fill="currentColor"
          opacity="0.6"
        >
          docs-as-code
        </text>
      )}
    </svg>
  )
}

/* ─── Wordmark only (no icon) ─────────────────────────────────────── */

export function TrellisWordmark({
  height = 32,
  showTagline = false,
  ...props
}: SvgProps & { height?: number; showTagline?: boolean }) {
  const vbWidth = showTagline ? 200 : 140
  const vbHeight = showTagline ? 52 : 36
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      height={height}
      width={height * (vbWidth / vbHeight)}
      fill="none"
      {...props}
    >
      <text
        x="0"
        y={showTagline ? '28' : '28'}
        fontFamily="'Segoe UI', 'SF Pro Display', system-ui, sans-serif"
        fontSize="34"
        fontWeight="700"
        fill="currentColor"
      >
        Trellis
      </text>

      {showTagline && (
        <text
          x="1"
          y="46"
          fontFamily="'Segoe UI', 'SF Pro Display', system-ui, sans-serif"
          fontSize="12"
          fontWeight="400"
          letterSpacing="1.5"
          fill="currentColor"
          opacity="0.6"
        >
          docs-as-code
        </text>
      )}
    </svg>
  )
}

/* ─── Favicon / small mark (simplified for 32×32) ─────────────────── */

export function TrellisFavicon({ size = 32, ...props }: SvgProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      {...props}
    >
      <clipPath id="trellis-fav-clip">
        <circle cx="16" cy="16" r="15" />
      </clipPath>
      <g clipPath="url(#trellis-fav-clip)">
        <rect x="0" y="0" width="16" height="32" fill={brand.navyDark} />
        <rect x="16" y="0" width="16" height="32" fill={brand.blueMid} />
      </g>
      <circle cx="16" cy="16" r="15" stroke={brand.navyDark} strokeWidth="0.5" fill="none" />

      {/* Simplified grid */}
      <g stroke={brand.white} strokeWidth="1.5" strokeLinecap="round">
        <line x1="4" y1="10" x2="28" y2="10" />
        <line x1="4" y1="16" x2="28" y2="16" />
        <line x1="4" y1="22" x2="28" y2="22" />
        <line x1="10" y1="3" x2="10" y2="29" />
        <line x1="16" y1="3" x2="16" y2="29" />
        <line x1="22" y1="3" x2="22" y2="29" />
      </g>

      {/* Code symbol accents */}
      <g fontFamily="monospace" fontWeight="700" fill={brand.olive}>
        <text x="5" y="9" fontSize="5">&lt;</text>
        <text x="17" y="9" fontSize="5">/</text>
        <text x="5" y="15" fontSize="5">&lt;</text>
        <text x="17" y="15" fontSize="5">&gt;</text>
        <text x="11" y="21" fontSize="5">.</text>
        <text x="23" y="21" fontSize="5">.</text>
      </g>
    </svg>
  )
}
