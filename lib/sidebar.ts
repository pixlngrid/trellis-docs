import { mainSidebar, type SidebarItem } from '@/config/sidebar'

export type { SidebarItem }

export interface ResolvedSidebarItem {
  type: 'doc' | 'category'
  label: string
  href?: string
  collapsed?: boolean
  items?: ResolvedSidebarItem[]
}

function titleFromId(id: string): string {
  const last = id.split('/').pop() || id
  return last === 'index'
    ? id.split('/').slice(-2, -1)[0] || 'Index'
    : last.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function resolveSidebar(
  docTitles?: Record<string, string>,
  urlPrefix = '',
  sidebarItems?: SidebarItem[]
): ResolvedSidebarItem[] {
  const items = sidebarItems || mainSidebar

  function resolve(item: SidebarItem): ResolvedSidebarItem {
    if (item.type === 'doc') {
      const slug = item.id.replace(/\/index$/, '')
      return {
        type: 'doc',
        label: item.label || docTitles?.[item.id] || titleFromId(item.id),
        href: `${urlPrefix}/${slug}/`,
      }
    }

    const resolved: ResolvedSidebarItem = {
      type: 'category',
      label: item.label,
      collapsed: item.collapsed,
      items: item.items.map(resolve),
    }
    if (item.link) {
      const slug = item.link.replace(/\/index$/, '')
      resolved.href = `${urlPrefix}/${slug}/`
    }
    return resolved
  }

  return items.map(resolve)
}

// Versioned sidebar map — populated at build time via dynamic imports
const versionedSidebarCache = new Map<string, SidebarItem[]>()

export async function getSidebarForVersion(version: string): Promise<SidebarItem[]> {
  if (version === 'current') return mainSidebar
  if (versionedSidebarCache.has(version)) return versionedSidebarCache.get(version)!

  try {
    // Dynamic import of versioned sidebar
    const mod = await import(`@/versioned_sidebars/${version}`)
    const items = mod.mainSidebar || mod.default
    versionedSidebarCache.set(version, items)
    return items
  } catch {
    // Fall back to current sidebar if versioned one doesn't exist
    return mainSidebar
  }
}
