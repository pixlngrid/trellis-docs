'use client'

import { useState } from 'react'
import { Check, Copy, WrapText } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CodeBlockClient({ html, code }: { html: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const [wrapped, setWrapped] = useState(true)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="group relative">
      <div
        className={cn(
          'shiki-wrapper [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:text-sm [&>pre]:border [&>pre]:border-[var(--border)]',
          wrapped
            ? '[&>pre]:whitespace-pre-wrap [&>pre]:overflow-wrap-anywhere'
            : '[&>pre]:overflow-x-auto'
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setWrapped(!wrapped)}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            wrapped
              ? 'bg-[var(--primary)]/20 text-[var(--primary)]'
              : 'bg-[var(--muted)]/80 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
          )}
          aria-label={wrapped ? 'Disable word wrap' : 'Enable word wrap'}
        >
          <WrapText size={14} />
        </button>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md bg-[var(--muted)]/80 hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  )
}
