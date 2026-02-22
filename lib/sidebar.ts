import { mainSidebar, type SidebarItem } from '@/config/sidebar'

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

export function resolveSidebar(docTitles?: Record<string, string>): ResolvedSidebarItem[] {
  function resolve(item: SidebarItem): ResolvedSidebarItem {
    if (item.type === 'doc') {
      const slug = item.id.replace(/\/index$/, '')
      return {
        type: 'doc',
        label: item.label || docTitles?.[item.id] || titleFromId(item.id),
        href: `/${slug}/`,
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
      resolved.href = `/${slug}/`
    }
    return resolved
  }

  return mainSidebar.map(resolve)
}
