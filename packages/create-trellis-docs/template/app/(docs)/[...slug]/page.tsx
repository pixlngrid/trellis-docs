import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import rehypeSlug from 'rehype-slug'
import { getAllDocSlugs, getDocBySlug } from '@/lib/content'
import { extractToc } from '@/lib/toc'
import { mdxComponents } from '@/components/docs/mdx'
import { TableOfContents, MobileTableOfContents } from '@/components/docs/toc'
import { Breadcrumbs } from '@/components/docs/breadcrumbs'
import { remarkCallout } from '@/lib/remark-callout'
import { siteConfig } from '@/config/site'
import { docVariables } from '@/config/variables'

export async function generateStaticParams() {
  const slugs = await getAllDocSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  try {
    const { meta } = await getDocBySlug(slug)
    return {
      title: meta.title,
      description: meta.description,
    }
  } catch {
    return { title: 'Not Found' }
  }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params

  let doc
  try {
    doc = await getDocBySlug(slug)
  } catch {
    notFound()
  }

  const toc = extractToc(doc.content)

  return (
    <div className="flex">
      <article className="flex-1 min-w-0 px-6 py-8 lg:px-12 max-w-[900px]">
        <Breadcrumbs slug={slug} title={doc.meta.title} />

        <h1 className="text-3xl font-bold tracking-tight mb-2">{doc.meta.title}</h1>

        {doc.meta.last_update && (
          <div className="text-sm text-[var(--muted-foreground)] mb-4">
            Last updated: {doc.meta.last_update.date}
            {siteConfig.lastUpdated.showAuthor && doc.meta.last_update.author && ` by ${doc.meta.last_update.author}`}
          </div>
        )}

        {!doc.meta.hide_table_of_contents && toc.length > 0 && (
          <MobileTableOfContents items={toc} />
        )}

        <div className="prose">
          <MDXRemote
            source={doc.content}
            components={mdxComponents}
            options={{
              scope: { vars: docVariables },
              mdxOptions: {
                remarkPlugins: [remarkGfm, remarkDirective, remarkCallout],
                rehypePlugins: [rehypeSlug],
              },
            }}
          />
        </div>
      </article>

      {!doc.meta.hide_table_of_contents && toc.length > 0 && (
        <aside className="hidden xl:block w-64 shrink-0">
          <TableOfContents items={toc} />
        </aside>
      )}
    </div>
  )
}
