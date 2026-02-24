import Link from 'next/link'
import { siteConfig } from '@/config/site'
import { Navbar } from '@/components/docs/navbar'
import { Footer } from '@/components/docs/footer'

const TRELLIS_DOCS = 'https://pixlngrid.github.io/trellis-docs'

const features = [
  {
    title: 'Theme Enhancements',
    icon: '✨',
    description: 'Last-updated at top, heading copy-to-clipboard, pill-style tabs, and custom admonition icons.',
    link: `${TRELLIS_DOCS}/theme/`,
  },
  {
    title: 'Smart Search',
    icon: '🔍',
    description: 'Build-time indexing with Fuse.js for fast, client-side fuzzy search. No external service needed.',
    link: `${TRELLIS_DOCS}/plugins/smart-search/`,
  },
  {
    title: 'Design Tokens',
    icon: '🎨',
    description: 'JSON-to-CSS pipeline. Define your brand in one file, regenerate all variables automatically.',
    link: `${TRELLIS_DOCS}/design-tokens/`,
  },
  {
    title: 'Bundled Plugins',
    icon: '🔌',
    description: 'FAQ indexer, redirects, image lightbox, and Mermaid pan/zoom — configured and ready to go.',
    link: `${TRELLIS_DOCS}/plugins/`,
  },
  {
    title: 'Reusable Components',
    icon: '🧩',
    description: 'Glossary, feedback widget, flipping cards, and custom search UI for your MDX pages.',
    link: `${TRELLIS_DOCS}/components/`,
  },
  {
    title: 'Mermaid Diagrams',
    icon: '📈',
    description: 'Built-in Mermaid rendering with pan and zoom. Just write fenced code blocks.',
    link: `${TRELLIS_DOCS}/guides/writing-docs/`,
  },
]

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1" style={{ marginTop: 'var(--navbar-height)' }}>
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center py-20 px-4">
          <h1 className="text-5xl font-bold mb-4">{siteConfig.title}</h1>
          <p className="text-xl text-[var(--muted-foreground)] mb-8">
            An opinionated docs framework built on Next.js.
            <br />
            Structure for your content to grow on.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/getting-started/"
              className="px-6 py-3 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 no-underline"
            >
              Get Started
            </Link>
            <a
              href={`${TRELLIS_DOCS}/overview/`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg border font-medium hover:bg-[var(--muted)] no-underline text-[var(--foreground)]"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <a
                key={feature.title}
                href={feature.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-6 rounded-lg border hover:border-[var(--primary)] hover:shadow-[0_2px_12px_rgba(124,58,237,0.15)] transition-all no-underline text-[var(--foreground)]"
              >
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)]">
                  {feature.description}
                </p>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
