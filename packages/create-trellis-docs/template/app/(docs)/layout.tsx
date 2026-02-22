import { Navbar } from '@/components/docs/navbar'
import { Sidebar } from '@/components/docs/sidebar'
import { Footer } from '@/components/docs/footer'

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1" style={{ marginTop: 'var(--navbar-height)' }}>
        <Sidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}
