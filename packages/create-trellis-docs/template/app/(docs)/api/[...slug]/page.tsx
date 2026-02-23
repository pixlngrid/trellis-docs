import { notFound } from 'next/navigation'
import { getAllApiSlugs, getApiSpecMeta } from '@/lib/api-content'
import { siteConfig } from '@/config/site'
import { getVersions } from '@/lib/versions'
import { parseSlug, buildUrlPrefix } from '@/lib/route-context'
import { DocContextWrapper } from '../../[...slug]/doc-context-wrapper'
import { RedocViewer } from '@/components/docs/redoc-viewer'

export async function generateStaticParams() {
  if (!siteConfig.apiDocs?.enabled) return []

  const { i18n, versioning } = siteConfig
  const defaultLocale = i18n?.defaultLocale || 'en'
  const locales = i18n?.enabled ? i18n.locales.map((l) => l.code) : [defaultLocale]
  const versions = versioning?.enabled
    ? ['current', ...(await getVersions())]
    : ['current']

  const allParams: { slug: string[] }[] = []

  for (const locale of locales) {
    for (const version of versions) {
      const apiSlugs = getAllApiSlugs(version)
      for (const apiSlug of apiSlugs) {
        const prefix: string[] = []
        if (locale !== defaultLocale) prefix.push(locale)
        if (version !== 'current') prefix.push(version)
        allParams.push({ slug: [...prefix, apiSlug] })
      }
    }
  }

  return allParams
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug: rawSlug } = await params
  const ctx = await parseSlug(rawSlug)
  const apiSlug = ctx.slug[0]
  if (!apiSlug) return { title: 'API Not Found' }

  const meta = getApiSpecMeta(apiSlug, ctx.version)
  if (!meta) return { title: 'API Not Found' }

  return {
    title: `${meta.title} — API Reference`,
    description: meta.description,
  }
}

export default async function ApiDocPage({ params }: { params: Promise<{ slug: string[] }> }) {
  if (!siteConfig.apiDocs?.enabled) notFound()

  const { slug: rawSlug } = await params
  const ctx = await parseSlug(rawSlug)
  const apiSlug = ctx.slug[0]
  if (!apiSlug) notFound()

  const meta = getApiSpecMeta(apiSlug, ctx.version)
  if (!meta) notFound()

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const specUrl = `${basePath}/api-specs/${meta.specFile}`
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
      <div className="flex-1 min-w-0">
        <RedocViewer
          specUrl={specUrl}
          options={siteConfig.apiDocs.redocOptions || {}}
        />
      </div>
    </DocContextWrapper>
  )
}
