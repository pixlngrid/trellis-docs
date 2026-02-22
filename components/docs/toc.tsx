'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type { TocItem } from '@/lib/toc'

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [items])

  return (
    <div className="sticky py-8 pr-4" style={{ top: 'var(--navbar-height)' }}>
      <p className="text-sm font-bold mb-3 pl-4">On this page</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                'block text-[13px] no-underline py-0.5 relative transition-colors',
                item.level === 2 ? 'pl-4' : item.level === 3 ? 'pl-7' : 'pl-10',
                activeId === item.id
                  ? 'text-[var(--primary)] font-medium'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              )}
            >
              {activeId === item.id && (
                <span className="absolute left-0 top-0 w-[3px] h-full rounded-sm bg-[var(--primary)]" />
              )}
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
