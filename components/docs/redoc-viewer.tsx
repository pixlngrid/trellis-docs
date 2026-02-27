'use client'

import { useEffect, useState, useRef } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Patch hardcoded light-mode colors in ReDoc styled-components for dark mode.
  // ReDoc bakes some colors (e.g. server URL box: background:#fff, code labels:
  // color:#e53935) into styled-components whose class names are random hashes,
  // so normal CSS overrides can't reach them. We post-patch the DOM instead.
  useEffect(() => {
    const container = containerRef.current
    if (!container || resolvedTheme !== 'dark') return

    const patchDarkMode = () => {
      // Server URL boxes — styled <div> with background:#fff, display:inline, white-space:nowrap
      container.querySelectorAll<HTMLElement>('div').forEach((el) => {
        if (el.dataset.darkPatched) return
        const s = window.getComputedStyle(el)
        if (
          s.backgroundColor === 'rgb(255, 255, 255)' &&
          s.display === 'inline' &&
          s.whiteSpace === 'nowrap'
        ) {
          el.style.setProperty('background-color', '#334155', 'important')
          el.style.setProperty('color', '#f1f5f9', 'important')
          el.dataset.darkPatched = '1'
        }
      })

      // Code/label elements with hardcoded red (#e53935 → rgb(229,57,53))
      container.querySelectorAll<HTMLElement>('code, span').forEach((el) => {
        if (el.dataset.darkPatched) return
        const s = window.getComputedStyle(el)
        if (s.color === 'rgb(229, 57, 53)') {
          el.style.setProperty('color', '#93c5fd', 'important')
          el.dataset.darkPatched = '1'
        }
      })
    }

    let timer: ReturnType<typeof setTimeout>
    const observer = new MutationObserver(() => {
      clearTimeout(timer)
      timer = setTimeout(patchDarkMode, 200)
    })

    observer.observe(container, { childList: true, subtree: true })
    const initialTimer = setTimeout(patchDarkMode, 500)

    return () => {
      observer.disconnect()
      clearTimeout(timer)
      clearTimeout(initialTimer)
    }
  }, [resolvedTheme])

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
      gray: {
        50: isDark ? '#1e293b' : '#FAFAFA',
        100: isDark ? '#334155' : '#F5F5F5',
      },
      text: {
        primary: isDark ? '#f1f5f9' : '#0f172a',
        secondary: isDark ? '#cbd5e1' : '#64748b',
      },
      border: {
        dark: isDark ? 'rgba(241, 245, 249, 0.15)' : 'rgba(0, 0, 0, 0.1)',
        light: isDark ? '#1e293b' : '#ffffff',
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
        color: isDark ? '#93c5fd' : '#e53935',
        backgroundColor: isDark ? 'rgba(241, 245, 249, 0.07)' : 'rgba(38, 50, 56, 0.05)',
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
    <div className="redoc-container" key={resolvedTheme} ref={containerRef}>
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
