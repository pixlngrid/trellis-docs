import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { mainSidebar, type SidebarItem } from '@/config/sidebar'

/** Collect all routable slugs (with leading slash) from the sidebar config. */
function collectSlugs(items: SidebarItem[]): Set<string> {
  const slugs = new Set<string>()
  for (const item of items) {
    if (item.type === 'doc') slugs.add('/' + item.id.replace(/\/index$/, '') + '/')
    if (item.type === 'api') slugs.add('/api/' + item.id + '/')
    if (item.type === 'category') {
      if (item.link) slugs.add('/' + item.link.replace(/\/index$/, '') + '/')
      collectSlugs(item.items).forEach((s) => slugs.add(s))
    }
  }
  return slugs
}

const routableSlugs = collectSlugs(mainSidebar)

interface BreadcrumbsProps {
  slug: string[]
  title: string
}

export function Breadcrumbs({ slug, title }: BreadcrumbsProps) {
  const crumbs = slug.map((segment, i) => {
    const href = '/' + slug.slice(0, i + 1).join('/') + '/'
    const isLast = i === slug.length - 1
    const label = isLast
      ? title
      : segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    const isRoutable = routableSlugs.has(href)

    return { href, label, isLast, isRoutable }
  })

  return (
    <nav className="flex items-center gap-1 text-sm text-[var(--muted-foreground)] mb-6">
      <Link href="/" className="hover:text-[var(--foreground)] no-underline">
        Home
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight size={12} />
          {crumb.isLast ? (
            <span className="text-[var(--foreground)]">{crumb.label}</span>
          ) : crumb.isRoutable ? (
            <Link
              href={crumb.href}
              className="hover:text-[var(--foreground)] no-underline text-[var(--muted-foreground)]"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-[var(--muted-foreground)]">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
