'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

type TopicType = 'overview' | 'concept' | 'task' | 'reference' | 'troubleshooting'

interface RelatedItem {
  slug: string
  title: string
  permalink: string
}

interface RelatedEntry {
  families: string[]
  overview: RelatedItem[]
  concept: RelatedItem[]
  task: RelatedItem[]
  reference: RelatedItem[]
  troubleshooting: RelatedItem[]
}

type Reltable = Record<string, Record<string, RelatedEntry>>

const TYPE_ORDER: TopicType[] = ['overview', 'concept', 'task', 'reference', 'troubleshooting']

const TYPE_LABELS: Record<TopicType, string> = {
  overview: 'Overview',
  concept: 'Concepts',
  task: 'Tasks',
  reference: 'Reference',
  troubleshooting: 'Troubleshooting',
}

function stripPrefix(pathname: string): string {
  // Normalize: strip trailing slash, strip basePath if any, collapse to "/a/b"
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  let p = pathname
  if (base && p.startsWith(base)) p = p.slice(base.length)
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  return p || '/'
}

export function RelatedTopics({
  title = 'Related topics',
  slug: slugProp,
  showTypes,
}: {
  title?: string
  slug?: string
  showTypes?: TopicType[]
}) {
  const pathname = usePathname()
  const [data, setData] = useState<Reltable | null>(null)

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ''}/reltable.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => setData(d || {}))
      .catch(() => setData({}))
  }, [])

  const entry = useMemo(() => {
    if (!data) return null
    const currentPath = stripPrefix(pathname || '/')
    const lookupSlug = slugProp || currentPath

    // Try each index (locale:version) — prefer one whose urlPrefix matches
    // the current path. Fall back to first match on the bare slug.
    for (const key of Object.keys(data)) {
      const [locale, version] = key.split(':')
      const parts = []
      if (locale && locale !== 'en') parts.push(locale)
      if (version && version !== 'current') parts.push(version)
      const prefix = parts.length ? '/' + parts.join('/') : ''

      if (prefix && currentPath.startsWith(prefix + '/')) {
        const bare = currentPath.slice(prefix.length)
        if (data[key][bare]) return data[key][bare]
      } else if (!prefix && data[key][lookupSlug]) {
        return data[key][lookupSlug]
      }
    }
    return null
  }, [data, pathname, slugProp])

  if (!entry) return null

  const types = (showTypes && showTypes.length ? showTypes : TYPE_ORDER).filter(
    (t) => entry[t] && entry[t].length > 0
  )

  if (types.length === 0) return null

  return (
    <section className="not-prose mt-10 pt-6 border-t border-(--border)" aria-label="Related topics">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        {types.map((t) => (
          <div key={t}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-foreground)] mb-2">
              {TYPE_LABELS[t]}
            </h3>
            <ul className="space-y-1">
              {entry[t].map((item) => (
                <li key={item.permalink}>
                  <Link
                    href={item.permalink}
                    className="text-sm text-[var(--primary)] hover:underline no-underline"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
