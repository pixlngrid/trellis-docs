'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface ImageLightboxProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string
  alt?: string
}

export function ImageLightbox({ src, alt, ...props }: ImageLightboxProps) {
  const [open, setOpen] = useState(false)

  if (!src) return null

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || ''}
        {...props}
        className="cursor-zoom-in border border-[var(--border)] rounded-[5px] max-w-[60%] h-auto mt-4"
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
            src={src}
            alt={alt || ''}
            className="max-h-[90vh] max-w-[90vw] object-contain border-none rounded-none"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
