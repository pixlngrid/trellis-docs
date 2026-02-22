import { codeToHtml } from 'shiki'

interface CodeBlockProps {
  children?: string
  className?: string
}

export async function CodeBlock({ children, className }: CodeBlockProps) {
  if (!children) return null

  const lang = className?.replace('language-', '') || 'text'

  // Handle mermaid code blocks specially
  if (lang === 'mermaid') {
    return <MermaidBlock code={children.trim()} />
  }

  const html = await codeToHtml(children.trim(), {
    lang,
    themes: {
      light: 'github-light',
      dark: 'dracula',
    },
  })

  return (
    <div
      className="[&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto [&>pre]:text-sm"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function MermaidBlock({ code }: { code: string }) {
  // Mermaid is rendered client-side, pass the code as a data attribute
  return <MermaidRenderer chart={code} />
}

// Client component for mermaid, imported dynamically
import { MermaidRenderer } from './mermaid'
