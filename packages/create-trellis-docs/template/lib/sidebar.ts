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

    if (item.type === 'api') {
      return {
        type: 'doc',
        label: item.label || titleFromId(item.id),
        href: `${urlPrefix}/api/${item.id}/`,
      }
    }

    if (item.type === 'link') {
      return {
        type: 'doc',
        label: item.label,
        href: item.href,
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

