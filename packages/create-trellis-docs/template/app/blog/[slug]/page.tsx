import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/content'
import { mdxComponents } from '@/components/docs/mdx'
import { Navbar } from '@/components/docs/navbar'
import { Footer } from '@/components/docs/footer'
import { BlogSidebar } from '@/components/blog/blog-sidebar'
import { docVariables } from '@/config/variables'

export async function generateStaticParams() {
  const posts = await getAllBlogPosts()
  if (posts.length === 0) return [{ slug: '_placeholder' }]
  return posts.map((post) => ({ slug: post.meta.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return { title: 'Not Found' }
  return { title: post.meta.title, description: post.meta.description }
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  const allPosts = await getAllBlogPosts()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1" style={{ marginTop: 'var(--navbar-height)' }}>
        <BlogSidebar posts={allPosts} currentSlug={slug} />
        <main className="flex-1 min-w-0 max-w-3xl px-6 py-8">
          <article className="prose">
            <h1>{post.meta.title}</h1>
            <div className="text-sm text-[var(--muted-foreground)] mb-8">
              {formatDate(post.meta.date)}
              {post.meta.authors?.map((a) => ` · ${a.name}`)}
            </div>
            <MDXRemote
              source={post.content}
              components={mdxComponents}
              options={{
                scope: { vars: docVariables },
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [rehypeSlug],
                },
              }}
            />
          </article>
        </main>
      </div>
      <Footer />
    </div>
  )
}
