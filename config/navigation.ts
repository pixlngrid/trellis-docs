import { siteConfig } from './site'

const resourceItems = [
  ...((siteConfig as any).releaseNotes?.enabled ? [{ label: 'Release Notes', href: '/release-notes/' }] : []),
  ...((siteConfig as any).blog?.enabled ? [{ label: 'Blog', href: '/blog/' }] : []),
  { label: 'Roadmap', href: '/roadmap/' },
  { label: 'FAQs', href: '/faq/' },
  { label: 'Glossary', href: '/guides/components/glossary/' },
]

export const navItems = [
  { label: 'Introduction', href: '/introduction/' },
  { label: 'Guides', href: '/guides/docs/' },
  ...(resourceItems.length > 0
    ? [{ label: 'Resources', items: resourceItems }]
    : []),
]

export const footerConfig = {
  copyright: `© ${new Date().getFullYear()} Trellis by Pixl'n Grid`,
  poweredBy: 'Powered by Next.js',
}
