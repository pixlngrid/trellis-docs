import { siteConfig } from './site'

const resourceItems = [
  ...((siteConfig as any).releaseNotes?.enabled ? [{ label: 'Release Notes', href: '/release-notes/' }] : []),
  ...((siteConfig as any).blog?.enabled ? [{ label: 'Blog', href: '/blog/' }] : []),
  { label: 'FAQs', href: '/faq/' },
  { label: 'Glossary', href: '/components/glossary/' },
]

export const navItems = [
  { label: 'Overview', href: '/overview/' },
  { label: 'Guides', href: '/guides/writing-docs/' },
  ...(resourceItems.length > 0
    ? [{ label: 'Resources', items: resourceItems }]
    : []),
]

export const footerConfig = {
  copyright: `© ${new Date().getFullYear()} Trellis by Pixl'n Grid`,
  poweredBy: 'Powered by Next.js',
}
