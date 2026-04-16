import { docVariables } from './variables'

export const siteConfig = {
  title: 'Trellis Docs',
  version: `v${docVariables.version}`,
  tagline: 'A Docs-as-Code Framework',
  url: 'https://pixlngrid.github.io/trellis-docs',
  baseUrl: '/',
  favicon: '/img/favicon.svg',

  // Logo configuration. Replace these with your own brand assets in
  // public/img/. Set a field to null to hide that logo.
  logo: {
    navbar: '/img/trellis-icon.svg',       // small icon next to the title
    hero: '/img/trellis-stacked.svg',      // landing-page hero image (optional)
    alt: 'Trellis Logo',
  },
  organizationName: 'Pixl\'n Grid Studios',
  projectName: 'trellis-docs',
  repoUrl: 'https://github.com/pixlngrid/trellis-docs',
  editBaseUrl: 'https://github.com/pixlngrid/trellis-docs/edit/main',
  lastUpdated: {
    showAuthor: false,
  },
  colorMode: {
    defaultMode: 'dark' as const,
    respectPrefersColorScheme: true,
  },
  search: {
    excludedFolders: ['includes', '_includes'],
    excludedPrefixes: ['_'],
    weights: {
      title: 1.0,
      'sections.heading': 1.0,
      keywords: 0.8,
      description: 0.6,
      'sections.content': 0.5,
      content: 0.4,
    },
  },
  faq: {
    faqDir: 'content/docs/faq',
    basePermalink: '/faq',
  },

  // Subscribe CTA — shown on blog index & release notes when enabled
  subscribe: {
    enabled: false,
    url: 'https://trellis-docs.io/api/subscribe', // external URL to subscription form (e.g., Mailchimp, Buttondown, ConvertKit)
  },

  // Blog — set enabled: false to disable /blog routes and hide nav link
  blog: {
    enabled: true,
    layout: 'modern' as 'modern' | 'minimal',
  },

  // Release notes — set enabled: false to disable /release-notes routes and hide nav link
  releaseNotes: {
    enabled: true,
    layout: 'modern' as 'modern' | 'changelog',
  },

  // OpenAPI / API documentation — set enabled: true and place specs in content/api/
  apiDocs: {
    enabled: true,
    specDir: 'content/api',
    routeBasePath: 'api',
    redocOptions: {} as Record<string, unknown>,
  },

  // Internationalization — set enabled: true and add locales to activate
  i18n: {
    enabled: false,
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', dir: 'ltr' as const },
    ],
  },

  // Google Analytics — set enabled: true and add your GA4 measurement ID
  analytics: {
    enabled: false,
    googleAnalyticsId: '', // e.g. 'G-XXXXXXXXXX'
  },

  // SEO defaults — used for Open Graph, Twitter Cards, and structured data
  seo: {
    ogImage: '/img/og-default.png', // default Open Graph image (1200x630 recommended)
    twitterHandle: '', // e.g. '@yourhandle'
    twitterCardType: 'summary_large_image' as 'summary' | 'summary_large_image',
  },

  // Documentation versioning — set enabled: true to activate
  versioning: {
    enabled: false,
    currentLabel: 'Latest',
  },
}
