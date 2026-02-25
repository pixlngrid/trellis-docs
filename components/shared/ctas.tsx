import { siteConfig } from '@/config/site'
import { Bell } from 'lucide-react'

function resolveHref(value: string): { href: string; isEmail: boolean } {
  if (value.startsWith('mailto:')) return { href: value, isEmail: true }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { href: `mailto:${value}`, isEmail: true }
  return { href: value, isEmail: false }
}

export function SubscribeCTA() {
  if (!siteConfig.subscribeUrl) return null

  const { href, isEmail } = resolveHref(siteConfig.subscribeUrl)

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 md:p-12 text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <Bell className="text-blue-400" size={20} />
        <h3 className="text-xl font-bold text-white m-0">Never Miss an Update</h3>
      </div>
      <p className="text-slate-300 mb-6 max-w-md mx-auto">
        Get notified when we ship new features and improvements. Subscribe to our release notes.
      </p>
      <a
        href={href}
        {...(!isEmail && { target: '_blank', rel: 'noopener noreferrer' })}
        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors no-underline"
      >
        Subscribe
      </a>
    </div>
  )
}

export function FeedbackCTA() {
  const hasAnyLink = siteConfig.feedbackUrl || siteConfig.repoUrl
  if (!hasAnyLink) return null

  return (
    <div className="bg-[var(--muted)] border border-[var(--border)] rounded-xl p-8 text-center">
      <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">What do you think?</h3>
      <p className="text-[var(--muted-foreground)] mb-6">
        We&apos;d love to hear your feedback on this release. Let us know what you think!
      </p>
      <div className="flex items-center justify-center gap-3">
        {siteConfig.feedbackUrl && (() => {
          const { href, isEmail } = resolveHref(siteConfig.feedbackUrl)
          return (
            <a
              href={isEmail ? `${href}?subject=Release Feedback` : href}
              {...(!isEmail && { target: '_blank', rel: 'noopener noreferrer' })}
              className="px-5 py-2.5 bg-[var(--primary)] hover:opacity-90 text-[var(--primary-foreground)] font-medium rounded-lg transition-opacity no-underline"
            >
              Share Feedback
            </a>
          )
        })()}
        {siteConfig.repoUrl && (
          <a
            href={`${siteConfig.repoUrl}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 border border-[var(--border)] hover:bg-[var(--card)] text-[var(--foreground)] font-medium rounded-lg transition-colors no-underline"
          >
            Report an Issue
          </a>
        )}
      </div>
    </div>
  )
}
