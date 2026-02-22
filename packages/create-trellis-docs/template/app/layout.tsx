import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { siteConfig } from '@/config/site'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.title}`,
  },
  description: siteConfig.tagline,
  icons: { icon: siteConfig.favicon },
  openGraph: {
    description: `${siteConfig.title} — an opinionated docs framework by PixlnGrid.`,
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
      </body>
    </html>
  )
}
