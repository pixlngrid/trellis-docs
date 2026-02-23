import { Navbar } from '@/components/docs/navbar'
import { Footer } from '@/components/docs/footer'

export const metadata = {
  title: 'About',
  description: 'About Trellis — who built it, why it exists, and how it compares to other docs frameworks.',
}

const checkmark = '✓'
const cross = '✗'
const partial = '◐'

const comparisonRows = [
  { feature: 'Static export', trellis: checkmark, docusaurus: checkmark, nextra: checkmark, starlight: checkmark, gitbook: cross },
  { feature: 'MDX support', trellis: checkmark, docusaurus: checkmark, nextra: checkmark, starlight: checkmark, gitbook: cross },
  { feature: 'Reusable variables in content', trellis: checkmark, docusaurus: cross, nextra: cross, starlight: cross, gitbook: checkmark },
  { feature: 'Custom components in content', trellis: checkmark, docusaurus: checkmark, nextra: checkmark, starlight: checkmark, gitbook: cross },
  { feature: 'Built-in search (no Algolia)', trellis: checkmark, docusaurus: cross, nextra: checkmark, starlight: checkmark, gitbook: checkmark },
  { feature: 'Design token pipeline', trellis: checkmark, docusaurus: cross, nextra: cross, starlight: partial, gitbook: cross },
  { feature: 'Dark mode out of the box', trellis: checkmark, docusaurus: checkmark, nextra: checkmark, starlight: checkmark, gitbook: checkmark },
  { feature: 'Self-hosted / deploy anywhere', trellis: checkmark, docusaurus: checkmark, nextra: checkmark, starlight: checkmark, gitbook: cross },
  { feature: 'CLI scaffolding', trellis: checkmark, docusaurus: checkmark, nextra: partial, starlight: checkmark, gitbook: cross },
  { feature: 'TypeScript config', trellis: checkmark, docusaurus: checkmark, nextra: checkmark, starlight: checkmark, gitbook: cross },
  { feature: 'Blog support', trellis: checkmark, docusaurus: checkmark, nextra: checkmark, starlight: partial, gitbook: cross },
  { feature: 'i18n / localization', trellis: checkmark, docusaurus: checkmark, nextra: partial, starlight: checkmark, gitbook: partial },
  { feature: 'Documentation versioning', trellis: checkmark, docusaurus: checkmark, nextra: cross, starlight: partial, gitbook: partial },
  { feature: 'Audience role tagging', trellis: checkmark, docusaurus: cross, nextra: cross, starlight: cross, gitbook: cross },
  { feature: 'Content audit export', trellis: checkmark, docusaurus: cross, nextra: cross, starlight: cross, gitbook: partial },
  { feature: 'Free & open source', trellis: checkmark, docusaurus: checkmark, nextra: checkmark, starlight: checkmark, gitbook: cross },
]

function CellColor({ value }: { value: string }) {
  const color =
    value === checkmark
      ? 'text-green-500'
      : value === cross
        ? 'text-red-400'
        : 'text-yellow-500'
  return <span className={`font-bold ${color}`}>{value}</span>
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12" style={{ marginTop: 'var(--navbar-height)' }}>

        {/* Who built it */}
        <section className="mb-16">
          <h1 className="text-3xl font-bold mb-6">About Trellis</h1>
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-3">Who built it</h2>
            <p className="text-[var(--muted-foreground)] leading-relaxed">
              Trellis was created by <strong className="text-[var(--foreground)]">Patricia McPhee</strong>, a technical writer with 30 years in tech. She has documented APIs, SDKs, and developer platforms at Microsoft, Amazon, Facebook/Oculus, GE Healthcare, LivePerson, Beyond Identity, and Expedia Group. Her specialties are developer documentation, docs-as-code workflows, and information architecture.
            </p>
            <p className="text-[var(--muted-foreground)] leading-relaxed mt-4">
              Trellis exists because every docs framework she used was missing something. Docusaurus doesn&apos;t support reusable variables. Nextra has no design token system. Starlight is tied to Astro. GitBook locks you into a paid platform. Trellis combines the best ideas from all of them into a single, self-hosted framework built on Next.js — the React framework most teams already know.
            </p>
          </div>
        </section>

        {/* Why Trellis */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Why Trellis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-lg border">
              <h3 className="font-semibold mb-2">Variables in content</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Define product names, versions, and terms once. Use them on every page. Rename a product? Change one file.
              </p>
            </div>
            <div className="p-5 rounded-lg border">
              <h3 className="font-semibold mb-2">Your components, your way</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Drop in React components per-page or register them globally. No swizzling, no ejecting, no magic.
              </p>
            </div>
            <div className="p-5 rounded-lg border">
              <h3 className="font-semibold mb-2">Own your output</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Static HTML export. Deploy to any host. No vendor lock-in, no runtime server, no SaaS subscription.
              </p>
            </div>
            <div className="p-5 rounded-lg border">
              <h3 className="font-semibold mb-2">Built by a writer, not a framework team</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Every default reflects 30 years of documentation experience. Last-updated dates at the top, not buried. Heading anchors that copy on click. Search that works without Algolia.
              </p>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-2">Framework comparison</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-6">
            How Trellis stacks up against the most popular docs-as-code frameworks.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-[var(--border)]">
                  <th className="text-left py-3 pr-4 font-semibold">Feature</th>
                  <th className="text-center py-3 px-3 font-semibold text-[var(--primary)]">Trellis</th>
                  <th className="text-center py-3 px-3 font-semibold">Docusaurus</th>
                  <th className="text-center py-3 px-3 font-semibold">Nextra</th>
                  <th className="text-center py-3 px-3 font-semibold">Starlight</th>
                  <th className="text-center py-3 px-3 font-semibold">GitBook</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.feature} className="border-b border-[var(--border)]">
                    <td className="py-2.5 pr-4 text-[var(--foreground)]">{row.feature}</td>
                    <td className="py-2.5 px-3 text-center"><CellColor value={row.trellis} /></td>
                    <td className="py-2.5 px-3 text-center"><CellColor value={row.docusaurus} /></td>
                    <td className="py-2.5 px-3 text-center"><CellColor value={row.nextra} /></td>
                    <td className="py-2.5 px-3 text-center"><CellColor value={row.starlight} /></td>
                    <td className="py-2.5 px-3 text-center"><CellColor value={row.gitbook} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-3">
            {checkmark} = included &nbsp; {partial} = partial / plugin required &nbsp; {cross} = not available
          </p>
        </section>

        {/* Tech stack */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Tech stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              { label: 'Framework', value: 'Next.js 15' },
              { label: 'Styling', value: 'Tailwind CSS v4' },
              { label: 'Components', value: 'shadcn/ui' },
              { label: 'MDX', value: 'next-mdx-remote v5' },
              { label: 'Search', value: 'Fuse.js' },
              { label: 'Syntax', value: 'Shiki' },
              { label: 'Diagrams', value: 'Mermaid' },
              { label: 'Output', value: 'Static HTML' },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-lg">
                <div className="text-xs text-[var(--muted-foreground)]">{item.label}</div>
                <div className="font-medium mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
