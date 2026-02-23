export const navItems = [
  { label: 'Overview', href: '/overview/' },
  { label: 'Guides', href: '/guides/writing-docs/' },
  {
    label: 'Resources',
    items: [
      { label: 'Release Notes', href: '/release-notes/' },
      { label: 'Blog', href: '/blog/' },
      { label: 'FAQs', href: '/faq/' },
      { label: 'Glossary', href: '/components/glossary/' },
    ],
  },
]

export const footerConfig = {
  copyright: `© ${new Date().getFullYear()} Trellis by Pixl'n Grid`,
  poweredBy: 'Powered by Next.js',
}
