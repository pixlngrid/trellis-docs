import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { getAllBlogPosts, getBlogPostBySlug } from '@/lib/content'
import { mdxComponents } from '@/components/docs/mdx'
import { Navbar } from '@/components/docs/navbar'
import { Footer } from '@/components/docs/footer'

export async function generateStaticParams() {
  const posts = await getAllBlogPosts()
  return posts.map((post) => ({ slug: post.meta.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) return { title: 'Not Found' }
  return { title: post.meta.title, description: post.meta.description }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-8" style={{ marginTop: 'var(--navbar-height)' }}>
        <article className="prose">
          <h1>{post.meta.title}</h1>
          <div className="text-sm text-[var(--muted-foreground)] mb-8">
            {post.meta.date}
            {post.meta.authors?.map((a) => ` · ${a.name}`)}
          </div>
          <MDXRemote
            source={post.content}
            components={mdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
                rehypePlugins: [rehypeSlug],
              },
            }}
          />
        </article>
      </main>
      <Footer />
    </div>
  )
}
