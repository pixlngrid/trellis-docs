'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { resolveSidebar, type ResolvedSidebarItem } from '@/lib/sidebar'
import { useDocContext } from '@/lib/doc-context'

const defaultSidebarItems = resolveSidebar()

// Accordion context — only one top-level category open at a time
const AccordionContext = createContext<{
  openId: string | null
  toggle: (id: string) => void
}>({ openId: null, toggle: () => {} })

function SidebarCategory({ item }: { item: ResolvedSidebarItem }) {
  const pathname = usePathname()
  const { openId, toggle } = useContext(AccordionContext)
  const isSelfActive = item.href && pathname === item.href
  const categoryId = item.href || item.label
  const open = openId === categoryId

  const handleToggle = useCallback(() => {
    toggle(categoryId)
  }, [categoryId, toggle])

  return (
    <div className="mb-0.5">
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center w-full text-left px-3 py-1.5 text-sm font-semibold rounded-md',
          'tracking-wide cursor-pointer',
          isSelfActive
            ? 'text-[var(--foreground)]'
            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
        )}
      >
        <span className="flex-1">{item.label}</span>
        <ChevronDown
          size={14}
          className={cn('transition-transform shrink-0 ml-1', open ? '' : '-rotate-90')}
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

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

/** Find which top-level category (by id) contains the current pathname. */
function findActiveCategory(
  items: ResolvedSidebarItem[],
  pathname: string
): string | null {
  for (const item of items) {
    if (item.type !== 'category') continue
    const id = item.href || item.label
    if (item.href && pathname === item.href) return id
    if (
      item.items?.some(
        (child) =>
          (child.href && pathname === child.href) ||
          (child.type === 'category' &&
            child.items?.some((gc) => gc.href && pathname === gc.href))
      )
    )
      return id
  }
  return null
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { urlPrefix } = useDocContext()
  const pathname = usePathname()
  const sidebarItems = urlPrefix
    ? resolveSidebar(undefined, urlPrefix)
    : defaultSidebarItems

  const activeCategory = findActiveCategory(sidebarItems, pathname)
  const [openId, setOpenId] = useState<string | null>(activeCategory)

  // Sync open category when user navigates to a page in a different category
  useEffect(() => {
    if (activeCategory && activeCategory !== openId) {
      setOpenId(activeCategory)
    }
  }, [activeCategory]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(
    (id: string) => setOpenId((prev) => (prev === id ? null : id)),
    []
  )

  return (
    <AccordionContext.Provider value={{ openId, toggle }}>
    <div className="hidden lg:flex relative shrink-0">
      {/* Sidebar content */}
      <aside
        className={cn(
          'border-r overflow-y-auto overflow-x-hidden sticky transition-[width] duration-200 ease-in-out',
          collapsed ? 'w-0 overflow-hidden border-r-0' : ''
        )}
        style={{
          width: collapsed ? 0 : 'var(--sidebar-width)',
          top: 'var(--navbar-height)',
          height: 'calc(100vh - var(--navbar-height))',
        }}
      >
        <nav className="p-4" style={{ width: 'var(--sidebar-width)' }}>
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

      {/* Collapse chevron (shown when expanded) — sticky so it doesn't scroll away on long pages */}
      {!collapsed && (
        <div
          className="sticky z-10"
          style={{
            top: 'var(--navbar-height)',
            height: 0,
          }}
        >
          <button
            onClick={onToggle}
            className={cn(
              'absolute -right-3 top-3 flex items-center justify-center',
              'w-6 h-6 rounded-full border bg-[var(--background)] text-[var(--muted-foreground)]',
              'hover:text-[var(--foreground)] hover:border-[var(--foreground)] shadow-sm',
              'transition-colors'
            )}
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      )}
    </div>
    </AccordionContext.Provider>
  )
}
