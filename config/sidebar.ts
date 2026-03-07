export type SidebarItem =
  | { type: 'doc'; id: string; label?: string }
  | { type: 'category'; label: string; link?: string; collapsed?: boolean; items: SidebarItem[] }
  | { type: 'link'; label: string; href: string }
  | { type: 'api'; id: string; label?: string }
  | { type: 'html'; value: string }


export const mainSidebar: SidebarItem[] = [
  { type: 'doc', id: 'introduction', label: 'Introduction' },
  { type: 'doc', id: 'features', label: 'Features' },
  { type: 'doc', id: 'getting-started' },
  {
    type: 'category',
    label: 'Guides',
    collapsed: false,
    items: [
      { type: 'doc', id: 'guides/docs', label: 'Docs' },
      { type: 'doc', id: 'guides/blog', label: 'Blog' },
      {
        type: 'category',
        label: 'Markdown Features',
        link: 'guides/markdown/index',
        collapsed: true,
        items: [
          { type: 'doc', id: 'guides/markdown/mdx-and-react', label: 'MDX and React' },
          { type: 'doc', id: 'guides/markdown/tabs', label: 'Tabs' },
          { type: 'doc', id: 'guides/markdown/code-blocks', label: 'Code Blocks' },
          { type: 'doc', id: 'guides/markdown/admonitions', label: 'Admonitions' },
          { type: 'doc', id: 'guides/markdown/headings', label: 'Headings' },
          { type: 'doc', id: 'guides/markdown/links', label: 'Links' },
          { type: 'doc', id: 'guides/markdown/head-metadata', label: 'Head Metadata' },
        ],
      },

      {
        type: 'category',
        label: 'Components',
        link: 'guides/components/index',
        collapsed: true,
        items: [
          { type: 'doc', id: 'guides/components/doc-card-list', label: 'DocCardList' },
          { type: 'doc', id: 'guides/components/glossary', label: 'Glossary' },
          { type: 'doc', id: 'guides/components/feedback', label: 'Feedback' },
          { type: 'doc', id: 'guides/components/flipping-card', label: 'FlippingCard' },
        ],
      },
      { type: 'doc', id: 'guides/style-and-layout', label: 'Style and Layout' },
      { type: 'doc', id: 'guides/search', label: 'Search' },
      { type: 'doc', id: 'guides/site-configuration', label: 'Site Configuration' },
      { type: 'doc', id: 'guides/content-audit', label: 'Content Audit' },
      { type: 'doc', id: 'guides/deployment', label: 'Deployment' },
      { type: 'doc', id: 'guides/i18n', label: 'Internationalization' },
      { type: 'doc', id: 'guides/whats-next', label: "What's Next?" },
    ],
  },
  {
    type: 'category',
    label: 'Advanced Guides',
    link: 'advanced/index',
    collapsed: true,
    items: [
      { type: 'doc', id: 'advanced/architecture', label: 'Architecture' },
      { type: 'doc', id: 'advanced/routing', label: 'Routing' },
      { type: 'doc', id: 'advanced/static-site-generation', label: 'Static Site Generation' },
      { type: 'doc', id: 'advanced/client-architecture', label: 'Client Architecture' },
      { type: 'doc', id: 'advanced/api-docs', label: 'API Documentation' },
      { type: 'doc', id: 'advanced/versioning', label: 'Versioning' },
    ],
  },
  { type: 'doc', id: 'upgrading' },
  { type: 'doc', id: 'migrating-from-docusaurus', label: 'Migrating from Docusaurus' },
  {
    type: 'category',
    label: 'Troubleshooting',
    link: 'troubleshooting/index',
    collapsed: true,
    items: [
      { type: 'doc', id: 'troubleshooting/build-errors', label: 'Build Errors' },
      { type: 'doc', id: 'troubleshooting/content-errors', label: 'Content & Rendering Errors' },
    ],
  },
  {
    type: 'category',
    label: 'API Reference',
    collapsed: true,
    items: [
      { type: 'api', id: 'petstore', label: 'Petstore API' },
      { type: 'api', id: 'auth', label: 'Movie API' },
    ],
  },
]
