import Link from 'next/link'
import { getAllReleaseNotes } from '@/lib/content'
import { Navbar } from '@/components/docs/navbar'
import { Footer } from '@/components/docs/footer'

export const metadata = {
  title: 'Release Notes',
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function ReleaseNotesIndex() {
  const notes = await getAllReleaseNotes()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-8" style={{ marginTop: 'var(--navbar-height)' }}>
        <h1 className="text-3xl font-bold mb-8">Release Notes</h1>
        <div className="space-y-6">
          {notes.map((note) => (
            <article key={note.meta.slug} className="border rounded-lg p-5 hover:border-[var(--primary)] transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href={`/release-notes/${note.meta.slug}/`}
                  className="no-underline"
                >
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-[var(--primary)] text-[var(--primary-foreground)]">
                    {note.meta.title}
                  </span>
                </Link>
                <span className="text-sm text-[var(--muted-foreground)]">
                  {formatDate(note.meta.date)}
                </span>
              </div>
              {note.meta.description && (
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {note.meta.description}
                </p>
              )}
            </article>
          ))}
          {notes.length === 0 && (
            <p className="text-[var(--muted-foreground)]">No release notes yet.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
