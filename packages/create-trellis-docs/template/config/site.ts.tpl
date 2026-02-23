export const siteConfig = {
  title: '{{projectName}}',
  tagline: '{{tagline}}',
  url: '{{siteUrl}}',
  baseUrl: '/',
  favicon: '/img/favicon.svg',
  organizationName: '',
  projectName: '{{projectSlug}}',
  repoUrl: '{{repoUrl}}',
  editBaseUrl: '{{repoUrl}}/edit/main',
  logo: {
    navbar: '/img/favicon.svg',
    hero: null,
    alt: '{{projectName}} Logo',
    useBuiltIn: true,
  },
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

  // OpenAPI / API documentation — set enabled: true and place specs in content/api/
  apiDocs: {
    enabled: false,
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

  // Documentation versioning — set enabled: true to activate
  versioning: {
    enabled: false,
    currentLabel: 'Latest',
  },
}
