export const siteConfig = {
  title: 'Trellis',
  tagline: 'Docs Framework',
  url: 'https://trellis-docs.io',
  baseUrl: '/',
  favicon: '/img/favicon.svg',

  // Logo configuration
  // To use your own logo, replace these paths with your image files in public/img/
  // or set to null and provide a custom component via logo.component
  logo: {
    // Navbar icon (small, ~32px). Path relative to public/, or null to hide.
    navbar: '/img/trellis-navbar-logo.svg',
    // Landing page hero logo. Path relative to public/, or null to hide.
    hero: '/img/trellis-hero-logo.svg',
    // Alt text for accessibility
    alt: 'Trellis Logo',
    // Set to true to use the built-in Trellis SVG components instead of image files.
    // When true, the image paths above are ignored.
    useBuiltIn: true,
  },
  organizationName: 'pixlngrid',
  projectName: 'trellis',
  repoUrl: 'https://github.com/pixlngrid/trellis',
  editBaseUrl: 'https://github.com/pixlngrid/trellis/edit/main',
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

  // Documentation versioning — set enabled: true to activate
  versioning: {
    enabled: false,
    currentLabel: 'Latest',
  },
}
