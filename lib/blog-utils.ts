import type { BlogMeta } from './content'

const CATEGORY_GRADIENTS: Record<string, { gradient: string; badge: string }> = {
  Engineering: {
    gradient: 'from-violet-500 to-purple-600',
    badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  Product: {
    gradient: 'from-blue-500 to-cyan-500',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  Design: {
    gradient: 'from-pink-500 to-rose-500',
    badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  },
  Tutorial: {
    gradient: 'from-emerald-500 to-teal-500',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  Announcement: {
    gradient: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  Writing: {
    gradient: 'from-indigo-500 to-blue-600',
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  },
}

const FALLBACK_GRADIENTS = [
  'from-slate-500 to-slate-700',
  'from-indigo-500 to-blue-600',
  'from-teal-500 to-cyan-600',
  'from-fuchsia-500 to-purple-600',
]

export function getPostVisuals(meta: BlogMeta): { gradient: string; badgeClass: string } {
  if (meta.category && CATEGORY_GRADIENTS[meta.category]) {
    return {
      gradient: CATEGORY_GRADIENTS[meta.category].gradient,
      badgeClass: CATEGORY_GRADIENTS[meta.category].badge,
    }
  }
  const hash = meta.slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return {
    gradient: FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length],
    badgeClass: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
  }
}

export function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 230))
}

export function formatBlogDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
