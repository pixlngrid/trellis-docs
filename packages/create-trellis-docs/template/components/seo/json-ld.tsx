import { siteConfig } from '@/config/site'

interface JsonLdProps {
  type: 'WebSite' | 'Article' | 'BreadcrumbList'
  data?: Record<string, unknown>
}

export function JsonLd({ type, data = {} }: JsonLdProps) {
  const baseUrl = siteConfig.url

  let schema: Record<string, unknown>

  switch (type) {
    case 'WebSite':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: siteConfig.title,
        description: siteConfig.tagline,
        url: baseUrl,
        publisher: {
          '@type': 'Organization',
          name: siteConfig.organizationName,
        },
        ...data,
      }
      break
    case 'Article':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        publisher: {
          '@type': 'Organization',
          name: siteConfig.organizationName,
        },
        ...data,
      }
      break
    case 'BreadcrumbList':
      schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        ...data,
      }
      break
    default:
      schema = { '@context': 'https://schema.org', ...data }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
