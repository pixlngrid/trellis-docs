export type SidebarItem =
  | { type: 'doc'; id: string; label?: string }
  | { type: 'category'; label: string; collapsed?: boolean; items: SidebarItem[] }
  | { type: 'link'; label: string; href: string }

export const mainSidebar: SidebarItem[] = [
  { type: 'doc', id: 'getting-started', label: 'Getting Started' },
  {
    type: 'category',
    label: 'Guides',
    collapsed: false,
    items: [
      { type: 'doc', id: 'guides/writing-docs', label: 'Writing Documentation' },
    ],
  },
]
