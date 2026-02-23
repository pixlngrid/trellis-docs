import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

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

    return { href, label, isLast }
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
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-[var(--foreground)] no-underline text-[var(--muted-foreground)]"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
