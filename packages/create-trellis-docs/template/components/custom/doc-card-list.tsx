import { mainSidebar, SidebarItem } from '@/config/sidebar'
import * as sidebarConfig from '@/config/sidebar'
import { getAllDocsMeta, DocMeta } from '@/lib/content'
import { DocCard } from './doc-card'

// Collect every sidebar registered in config/sidebar.ts. Checks the
// `sidebars` registry first (multi-sidebar projects) and falls back to the
// legacy single-export `mainSidebar` for projects on older configs.
function getAllRegisteredSidebars(): SidebarItem[][] {
  const registry = (sidebarConfig as Record<string, unknown>).sidebars as
    | Record<string, SidebarItem[]>
    | undefined
  if (registry) return Object.values(registry)
  return [mainSidebar]
}

interface DocCardListItem {
  title: string
  description?: string
  href: string
}

interface DocCardListProps {
  /** Explicit list of card items. Takes priority over `category`. */
  items?: DocCardListItem[]
  /** Sidebar category label (case-insensitive). Resolves child docs automatically. */
  category?: string
}

function findCategory(
  nodes: SidebarItem[],
  label: string
): Extract<SidebarItem, { type: 'category' }> | null {
  const target = label.toLowerCase()
  for (const node of nodes) {
    if (node.type === 'category') {
      if (node.label.toLowerCase() === target) return node
      const found = findCategory(node.items, label)
      if (found) return found
    }
  }
  return null
}

function resolveCards(
  sidebarItems: SidebarItem[],
  allMeta: DocMeta[]
): DocCardListItem[] {
  const cards: DocCardListItem[] = []

  for (const item of sidebarItems) {
    if (item.type === 'doc') {
      const slug = item.id.replace(/\/index$/, '')
      const meta = allMeta.find((m) => m.slug === '/' + slug)
      cards.push({
        title: item.label || meta?.title || slug.split('/').pop() || slug,
        description: meta?.description,
        href: '/' + slug + '/',
      })
    } else if (item.type === 'category' && item.link) {
      const slug = item.link.replace(/\/index$/, '')
      const meta = allMeta.find((m) => m.slug === '/' + slug)
      cards.push({
        title: item.label || meta?.title || item.label,
        description: meta?.description,
        href: '/' + slug + '/',
      })
    }
  }

  return cards
}

export async function DocCardList({ items, category }: DocCardListProps) {
  let cards: DocCardListItem[]

  if (items) {
    cards = items
  } else if (category) {
    const allMeta = await getAllDocsMeta()
    // Search every registered sidebar — the category may live in a
    // non-main sidebar (e.g., contributing guide, software templates).
    let node: ReturnType<typeof findCategory> = null
    for (const sb of getAllRegisteredSidebars()) {
      node = findCategory(sb, category)
      if (node) break
    }
    cards = node ? resolveCards(node.items, allMeta) : []
  } else {
    cards = []
  }

  if (cards.length === 0) return null

  return (
    <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
      {cards.map((card) => (
        <DocCard key={card.href} {...card} />
      ))}
    </div>
  )
}
