'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveSidebar, type ResolvedSidebarItem } from '@/lib/sidebar'
import { useDocContext } from '@/lib/doc-context'

const defaultSidebarItems = resolveSidebar()

function SidebarCategory({ item }: { item: ResolvedSidebarItem }) {
  const pathname = usePathname()
  const isSelfActive = item.href && pathname === item.href
  const isChildActive = item.items?.some(
    (child) => child.href && pathname === child.href
  )
  const [open, setOpen] = useState(!item.collapsed || !!isChildActive || !!isSelfActive)

  return (
    <div className="mb-0.5">
      <div className="flex items-center">
        {item.href ? (
          <Link
            href={item.href}
            className={cn(
              'flex-1 px-3 py-1.5 text-sm font-semibold rounded-md no-underline',
              'tracking-wide',
              isSelfActive
                ? 'text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            )}
          >
            {item.label}
          </Link>
        ) : (
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              'flex-1 text-left px-3 py-1.5 text-sm font-semibold rounded-md',
              'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
              'tracking-wide'
            )}
          >
            {item.label}
          </button>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <ChevronDown
            size={14}
            className={cn('transition-transform', open ? '' : '-rotate-90')}
          />
        </button>
      </div>
      {open && item.items && (
        <ul className="ml-3 pl-3 border-l border-[var(--border)]">
          {item.items.map((child) => (
            <SidebarItem key={child.href || child.label} item={child} />
          ))}
        </ul>
      )}
    </div>
  )
}

function SidebarLink({ item }: { item: ResolvedSidebarItem }) {
  const pathname = usePathname()
  const isActive = item.href && pathname === item.href

  return (
    <li>
      <Link
        href={item.href || '#'}
        className={cn(
          'block px-3 py-1.5 text-sm rounded-md no-underline relative transition-colors',
          isActive
            ? 'text-[var(--foreground)] font-semibold'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        )}
      >
        {item.label}
        {isActive && (
          <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-sm bg-[var(--primary)]" />
        )}
      </Link>
    </li>
  )
}

function SidebarItem({ item }: { item: ResolvedSidebarItem }) {
  if (item.type === 'category') return <SidebarCategory item={item} />
  return <SidebarLink item={item} />
}

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { urlPrefix } = useDocContext()
  const sidebarItems = urlPrefix
    ? resolveSidebar(undefined, urlPrefix)
    : defaultSidebarItems

  return (
    <div className="hidden lg:flex relative shrink-0">
      {/* Sidebar content */}
      <aside
        className={cn(
          'border-r overflow-y-auto sticky transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-0 overflow-hidden border-r-0' : ''
        )}
        style={{
          width: collapsed ? 0 : 'var(--sidebar-width)',
          top: 'var(--navbar-height)',
          height: 'calc(100vh - var(--navbar-height))',
        }}
      >
        <nav className="p-4 whitespace-nowrap" style={{ width: 'var(--sidebar-width)' }}>
          <ul className="space-y-0.5">
            {sidebarItems.map((item) => (
              <SidebarItem key={item.href || item.label} item={item} />
            ))}
          </ul>
        </nav>
      </aside>

      {/* Collapsed rail with toggle */}
      <div
        className={cn(
          'sticky flex flex-col items-end border-r transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-4' : 'w-0 overflow-hidden border-r-0'
        )}
        style={{
          top: 'var(--navbar-height)',
          height: 'calc(100vh - var(--navbar-height))',
        }}
      >
        <button
          onClick={onToggle}
          className={cn(
            'mt-3 -mr-3 flex items-center justify-center',
            'w-6 h-6 rounded-full border bg-[var(--background)] text-[var(--muted-foreground)]',
            'hover:text-[var(--foreground)] hover:border-[var(--foreground)] shadow-sm',
            'transition-colors'
          )}
          aria-label="Expand sidebar"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Collapse chevron (shown when expanded) */}
      {!collapsed && (
        <button
          onClick={onToggle}
          className={cn(
            'absolute -right-3 top-3 z-10 flex items-center justify-center',
            'w-6 h-6 rounded-full border bg-[var(--background)] text-[var(--muted-foreground)]',
            'hover:text-[var(--foreground)] hover:border-[var(--foreground)] shadow-sm',
            'transition-colors'
          )}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={14} />
        </button>
      )}
    </div>
  )
}
