export type SidebarItem =
  | { type: 'doc'; id: string; label?: string }
  | { type: 'category'; label: string; link?: string; collapsed?: boolean; items: SidebarItem[] }
  | { type: 'api'; id: string; label?: string }

export const mainSidebar: SidebarItem[] = [
  { type: 'doc', id: 'getting-started' },
  {
    type: 'category',
    label: 'Overview',
    link: 'overview/index',
    collapsed: false,
    items: [
      { type: 'doc', id: 'overview/trellis-vs-nextjs' },
      { type: 'doc', id: 'overview/architecture' },
    ],
  },
  {
    type: 'category',
    label: 'Theme',
    link: 'theme/index',
    collapsed: true,
    items: [
      { type: 'doc', id: 'theme/last-updated' },
      { type: 'doc', id: 'theme/heading-anchors' },
      { type: 'doc', id: 'theme/tabs' },
      { type: 'doc', id: 'theme/admonitions' },
    ],
  },
  {
    type: 'category',
    label: 'Plugins',
    link: 'plugins/index',
    collapsed: true,
    items: [
      { type: 'doc', id: 'plugins/smart-search' },
      { type: 'doc', id: 'plugins/faq-index' },
      { type: 'doc', id: 'plugins/api-docs', label: 'API Documentation' },
      { type: 'doc', id: 'plugins/redirects' },
    ],
  },
  {
    type: 'category',
    label: 'Design Tokens',
    link: 'design-tokens/index',
    collapsed: true,
    items: [
      { type: 'doc', id: 'design-tokens/customizing' },
    ],
  },
  {
    type: 'category',
    label: 'Components',
    link: 'components/index',
    collapsed: true,
    items: [
      { type: 'doc', id: 'components/glossary' },
      { type: 'doc', id: 'components/feedback' },
      { type: 'doc', id: 'components/flipping-card' },
    ],
  },
  {
    type: 'category',
    label: 'Guides',
    collapsed: true,
    items: [
      { type: 'doc', id: 'guides/site-configuration', label: 'Site Configuration' },
      { type: 'doc', id: 'guides/content-authoring' },
      { type: 'doc', id: 'guides/writing-docs' },
      { type: 'doc', id: 'guides/using-components' },
      { type: 'doc', id: 'guides/i18n' },
      { type: 'doc', id: 'guides/versioning' },
      { type: 'doc', id: 'guides/deployment' },
    ],
  },
  {
    type: 'category',
    label: 'API Reference',
    collapsed: false,
    items: [
      { type: 'api', id: 'petstore', label: 'Petstore API' },
    ],
  },
]
