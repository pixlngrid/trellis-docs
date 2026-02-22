'use client'

import { useState, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { ThumbsUp, ThumbsDown, X } from 'lucide-react'
import { siteConfig } from '@/config/site'

const FeedbackType = { LIKE: 'like', DISLIKE: 'dislike' } as const

const LikeOptions: Record<string, string> = {
  ACCURATE: 'Accurately describes the platform',
  RESOLVE_ISSUE: 'Helped me resolve an issue',
  EASY_TO_FOLLOW: 'Easy to follow and comprehend',
  CLEAR_CODE_SAMPLES: 'Code samples were clear',
  ADOPT_PLATFORM: 'Convinced me to adopt the platform',
  POSITIVE_ANOTHER_REASON: 'Provide details',
}

const DislikeOptions: Record<string, string> = {
  INACCURATE: "Doesn't accurately describe the platform",
  NOT_FOUND: "Couldn't find what I was looking for",
  MISSING_INFO: 'Missing important information',
  HARD_TO_UNDERSTAND: 'Hard to understand',
  COMPLICATED: 'Too complicated or unclear',
  CODE_ERRORS: 'Code sample errors',
  NEGATIVE_ANOTHER_REASON: 'Provide details',
}

function getBaseUrl() {
  if (typeof window === 'undefined') return '/api/feedback'
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3002/api/feedback'
  }
  return '/api/feedback'
}

async function submitFeedback(payload: any) {
  const url = `${getBaseUrl()}/submit`
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new Error(`Server responded with ${response.status}`)
  return response.json()
}

export function Feedback() {
  const pathname = usePathname()
  const [feedbackType, setFeedbackType] = useState<string | null>(null)
  const [feedbackOptions, setFeedbackOptions] = useState<string[]>([])
  const [textData, setTextData] = useState('')
  const [thankYou, setThankYou] = useState(false)
  const [error, setError] = useState(false)

  const options = useMemo(() => {
    if (feedbackType === FeedbackType.LIKE) return LikeOptions
    if (feedbackType === FeedbackType.DISLIKE) return DislikeOptions
    return {}
  }, [feedbackType])

  const handleChange = (key: string, checked: boolean) => {
    setFeedbackOptions((prev) =>
      checked ? [...prev, key] : prev.filter((e) => e !== key)
    )
  }

  const handleSubmit = async () => {
    try {
      await submitFeedback({
        page: pathname,
        type: feedbackType,
        options: feedbackOptions,
        comment: textData.trim(),
      })
      setFeedbackType(null)
      setFeedbackOptions([])
      setTextData('')
      setThankYou(true)
    } catch {
      setFeedbackType(null)
      setError(true)
    }
  }

  const closeModal = () => {
    setFeedbackType(null)
    setFeedbackOptions([])
    setTextData('')
  }

  return (
    <div className="mt-8">
      <h4 className="text-base font-semibold mb-2">Was this page helpful?</h4>
      <div className="flex gap-2">
        <button
          className="p-2 rounded-md hover:bg-[var(--muted)]"
          onClick={() => setFeedbackType(FeedbackType.LIKE)}
          aria-label="Yes"
        >
          <ThumbsUp size={20} className="text-[var(--color-utility-green-100)]" />
        </button>
        <button
          className="p-2 rounded-md hover:bg-[var(--muted)]"
          onClick={() => setFeedbackType(FeedbackType.DISLIKE)}
          aria-label="No"
        >
          <ThumbsDown size={20} className="text-[var(--color-utility-red-100)]" />
        </button>
      </div>

      {/* Feedback modal */}
      {feedbackType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-[var(--card)] text-[var(--card-foreground)] rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-3 right-3 p-1 rounded hover:bg-[var(--muted)]"
              onClick={closeModal}
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-center mb-4">
              {feedbackType === FeedbackType.LIKE ? 'What did you like?' : 'What went wrong?'}
            </h3>

            <div className="space-y-2">
              {Object.entries(options).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={feedbackOptions.includes(key)}
                    onChange={(e) => handleChange(key, e.target.checked)}
                    className="rounded accent-[var(--primary)]"
                  />
                  {label}
                </label>
              ))}
            </div>

            {feedbackOptions.some((o) => o.endsWith('ANOTHER_REASON')) && (
              <textarea
                className="mt-3 w-full p-2 text-sm border rounded-md bg-[var(--background)] text-[var(--foreground)] resize-y"
                rows={4}
                value={textData}
                onChange={(e) => setTextData(e.target.value)}
                placeholder="Please provide details"
              />
            )}

            <div className="flex justify-center mt-4">
              <button
                className="px-4 py-2 text-sm font-medium rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90"
                onClick={handleSubmit}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thank you modal */}
      {thankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-[var(--card)] text-[var(--card-foreground)] rounded-lg shadow-lg p-6 w-72 text-center">
            <button
              className="absolute top-3 right-3 p-1 rounded hover:bg-[var(--muted)]"
              onClick={() => setThankYou(false)}
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold mb-2">Thank you for your feedback!</h3>
            <p className="text-sm">It helps us improve our technical content and user experience.</p>
          </div>
        </div>
      )}

      {/* Error modal */}
      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-[var(--card)] text-[var(--card-foreground)] rounded-lg shadow-lg p-6 w-72 text-center">
            <button
              className="absolute top-3 right-3 p-1 rounded hover:bg-[var(--muted)]"
              onClick={() => setError(false)}
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold mb-2">Oops!</h3>
            <p className="text-sm mb-2">There was an issue submitting your feedback.</p>
            <p className="text-sm">
              Try again or{' '}
              <a
                href={`${siteConfig.repoUrl}/issues/new?title=Issue submitting feedback`}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--primary)]"
              >
                report the issue
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
