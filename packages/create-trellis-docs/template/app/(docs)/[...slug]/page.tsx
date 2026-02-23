import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import rehypeSlug from 'rehype-slug'
import { getDocBySlug } from '@/lib/content'
import { extractToc } from '@/lib/toc'
import { mdxComponents } from '@/components/docs/mdx'
import { TableOfContents, MobileTableOfContents } from '@/components/docs/toc'
import { Breadcrumbs } from '@/components/docs/breadcrumbs'
import { remarkCallout } from '@/lib/remark-callout'
import { siteConfig } from '@/config/site'
import { docVariables } from '@/config/variables'
import { parseSlug, buildUrlPrefix } from '@/lib/route-context'
import { generateAllParams } from '@/lib/static-params'
import { getVersions } from '@/lib/versions'
import { DocContextWrapper } from './doc-context-wrapper'
import { FallbackBanner } from '@/components/docs/fallback-banner'
import { LocaleHtmlAttrs } from '@/components/docs/locale-html-attrs'

export async function generateStaticParams() {
  return generateAllParams()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: rawSlug } = await params
  const ctx = await parseSlug(rawSlug)

  try {
    const { meta } = await getDocBySlug(ctx.slug, ctx.locale, ctx.version)

    const metadata: Record<string, unknown> = {
      title: meta.title,
      description: meta.description,
    }

    // Add hreflang alternates when i18n is enabled
    if (siteConfig.i18n?.enabled && siteConfig.i18n.locales.length > 1) {
      const defaultLocale = siteConfig.i18n.defaultLocale || 'en'
      const baseUrl = siteConfig.url
      const docPath = ctx.slug.join('/')
      const versionPrefix = ctx.version !== 'current' ? `/${ctx.version}` : ''

      metadata.alternates = {
        canonical: `${baseUrl}${versionPrefix}/${docPath}/`,
        languages: Object.fromEntries(
          siteConfig.i18n.locales.map((l) => {
            const localePrefix = l.code !== defaultLocale ? `/${l.code}` : ''
            return [l.code, `${baseUrl}${localePrefix}${versionPrefix}/${docPath}/`]
          })
        ),
      }
    }

    return metadata
  } catch {
    return { title: 'Not Found' }
  }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: rawSlug } = await params
  const ctx = await parseSlug(rawSlug)

  let doc
  try {
    doc = await getDocBySlug(ctx.slug, ctx.locale, ctx.version)
  } catch {
    notFound()
  }

  const toc = extractToc(doc.content)
  const urlPrefix = buildUrlPrefix(ctx.locale, ctx.version)
  const versions = await getVersions()
  const locales = siteConfig.i18n?.enabled ? siteConfig.i18n.locales : []

  return (
    <DocContextWrapper
      locale={ctx.locale}
      version={ctx.version}
      urlPrefix={urlPrefix}
      versions={versions}
      locales={locales}
    >
      <LocaleHtmlAttrs />
      <div className="flex">
        <article className="flex-1 min-w-0 px-6 py-8 lg:px-12 max-w-[900px]">
          <Breadcrumbs slug={ctx.slug} title={doc.meta.title} />

          {doc.isFallback && <FallbackBanner locale={ctx.locale} />}

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
    </DocContextWrapper>
  )
}
