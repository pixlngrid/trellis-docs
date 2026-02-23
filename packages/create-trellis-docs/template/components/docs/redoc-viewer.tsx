'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

interface RedocViewerProps {
  specUrl: string
  options?: Record<string, unknown>
}

export function RedocViewer({ specUrl, options = {} }: RedocViewerProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [RedocStandalone, setRedocStandalone] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    import('redoc')
      .then((mod) => {
        setRedocStandalone(() => mod.RedocStandalone)
      })
      .catch((err) => {
        console.error('Failed to load Redoc:', err)
        setError('Failed to load API documentation viewer.')
      })
  }, [])

  if (!mounted || !RedocStandalone) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[var(--muted-foreground)]">
          {error || 'Loading API documentation...'}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  const isDark = resolvedTheme === 'dark'

  const redocTheme = {
    colors: {
      primary: {
        main: isDark ? '#93c5fd' : '#2563eb',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      http: {
        get: '#22c55e',
        post: '#3b82f6',
        put: '#f59e0b',
        delete: '#ef4444',
        patch: '#a855f7',
      },
    },
    typography: {
      fontFamily: 'inherit',
      fontSize: '16px',
      headings: {
        fontFamily: 'inherit',
      },
      code: {
        fontSize: '14px',
      },
    },
    sidebar: {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      textColor: isDark ? '#f1f5f9' : '#0f172a',
      activeTextColor: isDark ? '#93c5fd' : '#2563eb',
    },
    rightPanel: {
      backgroundColor: isDark ? '#0f172a' : '#1e293b',
      textColor: '#f1f5f9',
    },
    schema: {
      nestedBackground: isDark ? '#1e293b' : '#f8fafc',
    },
  }

  return (
    <div className="redoc-container" key={resolvedTheme}>
      <RedocStandalone
        specUrl={specUrl}
        options={{
          theme: redocTheme,
          scrollYOffset: 56,
          hideDownloadButton: false,
          nativeScrollbars: true,
          ...options,
        }}
      />
    </div>
  )
}
