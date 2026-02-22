import { codeToHtml } from 'shiki'
import {
  transformerMetaHighlight,
  transformerNotationHighlight,
  transformerNotationDiff,
  transformerNotationFocus,
} from '@shikijs/transformers'
import { CopyButton } from './copy-button'
import { MermaidRenderer } from './mermaid'

interface CodeBlockProps {
  children?: string
  className?: string
  meta?: string
}

export async function CodeBlock({ children, className, meta }: CodeBlockProps) {
  if (!children) return null

  const lang = className?.replace('language-', '') || 'text'

  // Handle mermaid code blocks specially
  if (lang === 'mermaid') {
    return <MermaidBlock code={children.trim()} />
  }

  const code = children.trim()

  const html = await codeToHtml(code, {
    lang,
    meta: { __raw: meta },
    themes: {
      light: 'github-light',
      dark: 'dracula',
    },
    transformers: [
      transformerMetaHighlight(),
      transformerNotationHighlight(),
      transformerNotationDiff(),
      transformerNotationFocus(),
    ],
  })

  return (
    <div className="group relative">
      <div
        className="shiki-wrapper [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:text-sm [&>pre]:border [&>pre]:border-[var(--border)]"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <CopyButton code={code} />
    </div>
  )
}

function MermaidBlock({ code }: { code: string }) {
  return <MermaidRenderer chart={code} />
}
