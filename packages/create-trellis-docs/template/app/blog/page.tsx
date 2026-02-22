import Link from 'next/link'
import { getAllBlogPosts } from '@/lib/content'
import { Navbar } from '@/components/docs/navbar'
import { Footer } from '@/components/docs/footer'
import { BlogSidebar } from '@/components/blog/blog-sidebar'

export const metadata = {
  title: 'Blog',
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function BlogIndex() {
  const posts = await getAllBlogPosts()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1" style={{ marginTop: 'var(--navbar-height)' }}>
        <BlogSidebar posts={posts} />
        <main className="flex-1 min-w-0 max-w-3xl px-6 py-8">
          <h1 className="text-3xl font-bold mb-8">Blog</h1>
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
                  {formatDate(post.meta.date)}
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
      </div>
      <Footer />
    </div>
  )
}
