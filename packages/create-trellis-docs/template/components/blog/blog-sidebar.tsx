import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { BlogMeta } from '@/lib/content'

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface BlogSidebarProps {
  posts: { meta: BlogMeta }[]
  currentSlug?: string
}

export function BlogSidebar({ posts, currentSlug }: BlogSidebarProps) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav
        className="sticky overflow-y-auto p-4"
        style={{
          top: 'var(--navbar-height)',
          height: 'calc(100vh - var(--navbar-height))',
        }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3 px-3">
          Recent Posts
        </h2>
        <ul className="space-y-1">
          {posts.map((post) => {
            const isActive = currentSlug === post.meta.slug
            return (
              <li key={post.meta.slug}>
                <Link
                  href={`/blog/${post.meta.slug}/`}
                  className={cn(
                    'block px-3 py-2 rounded-md no-underline transition-colors',
                    isActive
                      ? 'text-[var(--foreground)] font-semibold bg-[var(--muted)]'
                      : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                  )}
                >
                  <span className="block text-sm leading-snug">{post.meta.title}</span>
                  <span className="block text-xs text-[var(--muted-foreground)] mt-0.5">
                    {formatDate(post.meta.date)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
