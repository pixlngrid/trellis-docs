'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, Moon, Sun, Search, X, ChevronDown } from 'lucide-react'
import { useTheme } from 'next-themes'
import { siteConfig } from '@/config/site'
import { navItems } from '@/config/navigation'
import { cn } from '@/lib/utils'
import { SearchDialog } from '@/components/docs/search/search-dialog'

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b bg-[var(--background)]"
        style={{ height: 'var(--navbar-height)' }}
      >
        <div className="flex h-full items-center px-4 lg:px-6">
          {/* Mobile hamburger */}
          <button
            className="mr-4 lg:hidden p-2 rounded-md hover:bg-[var(--muted)]"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Logo + title */}
          <Link href="/" className="flex items-center gap-2 mr-6 text-[var(--foreground)] no-underline">
            <img
              src="/img/trellis-mark.svg"
              alt="Trellis Logo"
              className="h-[39px] w-auto"
            />
            <span className="text-lg font-semibold">{siteConfig.title}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 ml-auto">
            {navItems.map((item) =>
              'items' in item ? (
                <div key={item.label} className="relative">
                  <button
                    className={cn(
                      'flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      'hover:bg-[var(--muted)] text-[var(--foreground)]'
                    )}
                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                    onBlur={() => setTimeout(() => setOpenDropdown(null), 150)}
                  >
                    {item.label}
                    <ChevronDown size={14} />
                  </button>
                  {openDropdown === item.label && (
                    <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-[var(--popover)] shadow-lg py-1 z-50">
                      {item.items?.map((sub) => (
                        <Link
                          key={sub.label}
                          href={sub.href}
                          className="block px-4 py-2 text-sm text-[var(--popover-foreground)] hover:bg-[var(--muted)] no-underline"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setOpenDropdown(null)}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 text-sm font-medium rounded-md transition-colors no-underline',
                    pathname.startsWith(item.href)
                      ? 'text-[var(--primary)]'
                      : 'text-[var(--foreground)] hover:bg-[var(--muted)]'
                  )}
                >
                  {item.label}
                </Link>
              )
            )}

            {/* Search */}
            <button
              className="p-2 rounded-md hover:bg-[var(--muted)] ml-2"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            {/* Theme toggle */}
            <button
              className="p-2 rounded-md hover:bg-[var(--muted)]"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              <Sun size={18} className="hidden dark:block" />
              <Moon size={18} className="block dark:hidden" />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ top: 'var(--navbar-height)' }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <nav className="relative w-72 h-full bg-[var(--background)] border-r overflow-y-auto p-4">
            {navItems.map((item) =>
              'items' in item ? (
                <div key={item.label} className="mb-2">
                  <div className="px-3 py-2 text-sm font-semibold text-[var(--muted-foreground)]">
                    {item.label}
                  </div>
                  {item.items?.map((sub) => (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      className="block px-3 py-2 pl-6 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-md no-underline"
                      onClick={() => setMobileOpen(false)}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)] rounded-md no-underline"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}

            <div className="flex items-center gap-2 mt-4 px-3">
              <button
                className="p-2 rounded-md hover:bg-[var(--muted)]"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={18} />
              </button>
              <button
                className="p-2 rounded-md hover:bg-[var(--muted)]"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Sun size={18} className="hidden dark:block" />
                <Moon size={18} className="block dark:hidden" />
              </button>
            </div>
          </nav>
        </div>
      )}

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  )
}
