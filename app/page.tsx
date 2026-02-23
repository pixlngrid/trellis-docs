import Link from 'next/link'
import Image from 'next/image'
import { siteConfig } from '@/config/site'
import { Navbar } from '@/components/docs/navbar'
import { Footer } from '@/components/docs/footer'
import { TrellisStacked } from '@/components/brand/trellis-logo'
import { FeatureCards } from '@/components/landing/feature-cards'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1" style={{ marginTop: 'var(--navbar-height)' }}>
        {/* Hero */}
        <div className="max-w-3xl mx-auto text-center py-16 px-4">
          <div className="flex justify-center">
            {siteConfig.logo.useBuiltIn ? (
              <TrellisStacked size={300} />
            ) : siteConfig.logo.hero ? (
              <Image
                src={siteConfig.logo.hero}
                alt={siteConfig.logo.alt}
                width={300}
                height={300}
                className="h-44 w-auto"
              />
            ) : null}
          </div>
          <p className="text-xl text-[var(--muted-foreground)] mb-3">
            The docs framework that scales with your product.
          </p>
          <p className="text-base text-[var(--muted-foreground)] mb-8">
            Built on Next.js. Variables, custom components, smart search, and static export — everything Docusaurus doesn&apos;t give you.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/getting-started/"
              className="px-6 py-3 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] font-medium hover:opacity-90 no-underline"
            >
              Get Started
            </Link>
            <Link
              href="/overview/"
              className="px-6 py-3 rounded-lg border font-medium hover:bg-[var(--muted)] no-underline text-[var(--foreground)]"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="max-w-5xl mx-auto px-4 pb-20">
          <FeatureCards />
        </div>
      </main>
      <Footer />
    </div>
  )
}
