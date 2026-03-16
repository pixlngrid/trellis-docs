import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { siteConfig } from '@/config/site'
import { GoogleAnalytics } from '@/components/analytics/google-analytics'
import { JsonLd } from '@/components/seo/json-ld'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.tagline,
  icons: { icon: { url: siteConfig.favicon, type: 'image/svg+xml' } },
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: 'website',
    siteName: siteConfig.title,
    title: siteConfig.title,
    description: siteConfig.tagline,
    url: siteConfig.url,
    ...(siteConfig.seo?.ogImage && {
      images: [{ url: siteConfig.seo.ogImage, width: 1200, height: 630 }],
    }),
  },
  twitter: {
    card: siteConfig.seo?.twitterCardType || 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.tagline,
    ...(siteConfig.seo?.twitterHandle && {
      creator: siteConfig.seo.twitterHandle,
    }),
    ...(siteConfig.seo?.ogImage && {
      images: [siteConfig.seo.ogImage],
    }),
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme={siteConfig.colorMode.defaultMode}
          enableSystem={siteConfig.colorMode.respectPrefersColorScheme}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <GoogleAnalytics />
        <JsonLd type="WebSite" />
      </body>
    </html>
  )
}
