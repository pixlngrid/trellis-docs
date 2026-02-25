import Link from 'next/link'
import { Clock, Tag } from 'lucide-react'
import { getPostVisuals, formatBlogDate, estimateReadTime, getInitials } from '@/lib/blog-utils'
import { BlogCardPattern } from '@/components/blog/blog-card-pattern'
import { AnimatedPostGrid } from '@/components/blog/animated-post-grid'
import { SubscribeCTA } from '@/components/shared/ctas'
import type { BlogIndexLayoutProps } from './types'

export function ModernBlogIndex({ posts }: BlogIndexLayoutProps) {
  const featuredPost = posts.find((p) => p.meta.featured) || posts[0]
  const gridPosts = posts.filter((p) => p !== featuredPost)

  return (
    <>
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Blog</h1>
        <p className="text-[var(--muted-foreground)] mt-2">
          Insights, tutorials, and updates
        </p>
      </div>

      {posts.length === 0 && (
        <div className="max-w-6xl mx-auto px-6 pb-12">
          <p className="text-[var(--muted-foreground)]">No posts yet.</p>
        </div>
      )}

      {/* Featured Post */}
      {featuredPost && <FeaturedHero post={featuredPost} />}

      {/* Post Grid */}
      {gridPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold text-[var(--foreground)] mb-8">Latest Posts</h2>
          <AnimatedPostGrid>
            {gridPosts.map((post) => (
              <BlogPostCard key={post.meta.slug} post={post} />
            ))}
          </AnimatedPostGrid>
        </section>
      )}

      {/* Subscribe CTA */}
      {posts.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 pb-12">
          <SubscribeCTA />
        </section>
      )}
    </>
  )
}

function FeaturedHero({ post }: { post: { meta: import('@/lib/content').BlogMeta; content: string; excerpt: string } }) {
  const { gradient, badgeClass } = getPostVisuals(post.meta)
  const readTime = estimateReadTime(post.content)

  return (
    <section className="max-w-6xl mx-auto px-6 pb-8">
      <Link
        href={`/blog/${post.meta.slug}/`}
        className="block bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden hover:shadow-xl transition-shadow no-underline group"
      >
        <div className="grid md:grid-cols-2 gap-0">
          {/* Gradient visual */}
          <div className={`relative bg-gradient-to-br ${gradient} p-12 flex items-center justify-center min-h-[280px]`}>
            <BlogCardPattern />
          </div>
          {/* Content */}
          <div className="p-8 md:p-12 flex flex-col justify-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold rounded-full w-fit mb-4">
              <Tag size={12} />
              Featured
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-4 group-hover:text-[var(--primary)] transition-colors">
              {post.meta.title}
            </h2>
            {post.meta.description && (
              <p className="text-[var(--muted-foreground)] leading-relaxed mb-6">
                {post.meta.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-[var(--muted-foreground)]">
              {post.meta.authors?.[0] && (
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                    {getInitials(post.meta.authors[0].name)}
                  </div>
                  <span>{post.meta.authors[0].name}</span>
                </div>
              )}
              <span>{formatBlogDate(post.meta.date)}</span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {readTime} min read
              </span>
            </div>
          </div>
        </div>
      </Link>
    </section>
  )
}

function BlogPostCard({ post }: { post: { meta: import('@/lib/content').BlogMeta; content: string; excerpt: string } }) {
  const { gradient, badgeClass } = getPostVisuals(post.meta)
  const readTime = estimateReadTime(post.content)

  return (
    <Link
      href={`/blog/${post.meta.slug}/`}
      className="block bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-xl transition-all no-underline group"
    >
      <div className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <BlogCardPattern />
      </div>
      <div className="p-6">
        {post.meta.category && (
          <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded mb-3 ${badgeClass}`}>
            {post.meta.category}
          </span>
        )}
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-2 group-hover:text-[var(--primary)] transition-colors">
          {post.meta.title}
        </h3>
        {post.meta.description && (
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-4 line-clamp-2">
            {post.meta.description}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
          {post.meta.authors?.[0] && (
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 bg-gradient-to-br from-[var(--muted-foreground)] to-[var(--foreground)] rounded-full flex items-center justify-center text-[var(--background)] text-[10px] font-bold">
                {getInitials(post.meta.authors[0].name)}
              </div>
              <span>{post.meta.authors[0].name}</span>
            </div>
          )}
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {readTime} min read
          </span>
        </div>
      </div>
    </Link>
  )
}
