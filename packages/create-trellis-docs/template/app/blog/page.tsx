import Link from 'next/link'
import { getAllBlogPosts } from '@/lib/content'
import { Navbar } from '@/components/docs/navbar'
import { Footer } from '@/components/docs/footer'

export const metadata = {
  title: 'Release Notes',
}

export default async function BlogIndex() {
  const posts = await getAllBlogPosts()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-8" style={{ marginTop: 'var(--navbar-height)' }}>
        <h1 className="text-3xl font-bold mb-8">Release Notes</h1>
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.meta.slug} className="border-b pb-6">
              <Link
                href={`/blog/${post.meta.slug}/`}
                className="text-xl font-semibold text-[var(--primary)] hover:underline no-underline"
              >
                {post.meta.title}
              </Link>
              <div className="text-sm text-[var(--muted-foreground)] mt-1">
                {post.meta.date}
                {post.meta.authors?.map((a) => ` · ${a.name}`)}
              </div>
              {post.meta.description && (
                <p className="text-sm text-[var(--muted-foreground)] mt-2">
                  {post.meta.description}
                </p>
              )}
            </article>
          ))}
          {posts.length === 0 && (
            <p className="text-[var(--muted-foreground)]">No posts yet.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
