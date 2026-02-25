'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface ImageLightboxProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  alt?: string
  title?: string
}

export function ImageLightbox({ src, alt, title, ...props }: ImageLightboxProps) {
  const [open, setOpen] = useState(false)

  if (!src) return null

  // Prepend basePath for absolute paths so images resolve in subdirectory deployments
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const resolvedSrc = basePath && src.startsWith('/') ? `${basePath}${src}` : src

  // Parse width from title: ![alt](src "50%") or ![alt](src "400px") or ![alt](src "width=75%")
  let customWidth: string | undefined
  let displayTitle: string | undefined = title
  if (title) {
    const widthMatch = title.match(/^(?:width=)?(\d+(?:px|%))$/)
    if (widthMatch) {
      customWidth = widthMatch[1]
      displayTitle = undefined
    }
  }

  const style: React.CSSProperties = customWidth
    ? { width: customWidth, maxWidth: customWidth }
    : {}

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={alt || ''}
        title={displayTitle}
        {...props}
        className="cursor-zoom-in border border-[var(--border)] rounded-[5px] h-auto mt-4"
        style={style}
        onClick={() => setOpen(true)}
      />

      {open && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 cursor-zoom-out"
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X size={24} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolvedSrc}
            alt={alt || ''}
            className="max-h-[90vh] max-w-[90vw] object-contain border-none rounded-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
