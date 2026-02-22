export type SidebarItem =
  | { type: 'doc'; id: string; label?: string }
  | { type: 'category'; label: string; collapsed?: boolean; items: SidebarItem[] }

export const mainSidebar: SidebarItem[] = [
  { type: 'doc', id: 'getting-started' },
  {
    type: 'category',
    label: 'Overview',
    collapsed: false,
    items: [
      { type: 'doc', id: 'overview/index', label: 'What is Trellis?' },
      { type: 'doc', id: 'overview/trellis-vs-nextjs' },
      { type: 'doc', id: 'overview/architecture' },
    ],
  },
  {
    type: 'category',
    label: 'Theme',
    collapsed: true,
    items: [
      { type: 'doc', id: 'theme/index', label: 'Theme Overview' },
      { type: 'doc', id: 'theme/last-updated' },
      { type: 'doc', id: 'theme/heading-anchors' },
      { type: 'doc', id: 'theme/tabs' },
      { type: 'doc', id: 'theme/admonitions' },
    ],
  },
  {
    type: 'category',
    label: 'Plugins',
    collapsed: true,
    items: [
      { type: 'doc', id: 'plugins/index', label: 'Plugins Overview' },
      { type: 'doc', id: 'plugins/smart-search' },
      { type: 'doc', id: 'plugins/faq-index' },
      { type: 'doc', id: 'plugins/redirects' },
    ],
  },
  {
    type: 'category',
    label: 'Design Tokens',
    collapsed: true,
    items: [
      { type: 'doc', id: 'design-tokens/index', label: 'Design Tokens' },
      { type: 'doc', id: 'design-tokens/customizing' },
    ],
  },
  {
    type: 'category',
    label: 'Components',
    collapsed: true,
    items: [
      { type: 'doc', id: 'components/index', label: 'Components Overview' },
      { type: 'doc', id: 'components/glossary' },
      { type: 'doc', id: 'components/feedback' },
    ],
  },
  {
    type: 'category',
    label: 'Guides',
    collapsed: true,
    items: [
      { type: 'doc', id: 'guides/content-authoring' },
      { type: 'doc', id: 'guides/writing-docs' },
      { type: 'doc', id: 'guides/using-components' },
      { type: 'doc', id: 'guides/deployment' },
    ],
  },
]
