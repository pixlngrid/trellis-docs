'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveSidebar, type ResolvedSidebarItem } from '@/lib/sidebar'

const sidebarItems = resolveSidebar()

function SidebarCategory({ item }: { item: ResolvedSidebarItem }) {
  const pathname = usePathname()
  const isChildActive = item.items?.some(
    (child) => child.href && pathname === child.href
  )
  const [open, setOpen] = useState(!item.collapsed || isChildActive)

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-between w-full px-3 py-1.5 text-sm font-semibold rounded-md',
          'text-[var(--muted-foreground)] hover:text-[var(--foreground)]',
          'tracking-wide'
        )}
      >
        {item.label}
        <ChevronDown
          size={14}
          className={cn('transition-transform', open ? '' : '-rotate-90')}
        />
      </button>
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

export function Sidebar() {
  return (
    <aside
      className="hidden lg:block shrink-0 border-r overflow-y-auto sticky"
      style={{
        width: 'var(--sidebar-width)',
        top: 'var(--navbar-height)',
        height: 'calc(100vh - var(--navbar-height))',
      }}
    >
      <nav className="p-4">
        <ul className="space-y-0.5">
          {sidebarItems.map((item) => (
            <SidebarItem key={item.href || item.label} item={item} />
          ))}
        </ul>
      </nav>
    </aside>
  )
}
