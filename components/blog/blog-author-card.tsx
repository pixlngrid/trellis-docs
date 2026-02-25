import { getInitials } from '@/lib/blog-utils'

interface BlogAuthorCardProps {
  authors: Array<{ name: string; role?: string }>
  gradient: string
}

export function BlogAuthorCard({ authors, gradient }: BlogAuthorCardProps) {
  if (!authors || authors.length === 0) return null

  return (
    <div className="max-w-3xl mx-auto px-6 mt-16 mb-12">
      <div className="p-8 bg-[var(--card)] rounded-2xl border border-[var(--border)]">
        {authors.map((author, i) => (
          <div key={i} className={`flex items-start gap-4 ${i > 0 ? 'mt-6 pt-6 border-t border-[var(--border)]' : ''}`}>
            <div
              className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0`}
            >
              {getInitials(author.name)}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                Written by
              </p>
              <h3 className="text-lg font-bold text-[var(--foreground)]">{author.name}</h3>
              {author.role && (
                <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{author.role}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
