import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'

const ADMONITION_TYPES = 'note|tip|info|caution|danger|warning'
const FENCE_SPLIT = /(````[\s\S]*?````|```[\s\S]*?```)/g

/**
 * Dedent over-indented admonition interiors so remark-directive parses them
 * when they're nested inside lists. Docusaurus permits this pattern:
 *
 *     1. Step one.
 *
 *        :::tip Inside a list
 *         - bullet                   ← content column > opener column
 *           ![img](...)
 *        :::
 *
 * remark-directive requires the interior to start at the SAME column as the
 * `:::type` opener. We scan for that mismatch, compute how much extra indent
 * the interior has, and shave that amount off each non-blank interior line.
 * The opener and closer are left untouched so the surrounding list structure
 * keeps its indentation context.
 */
function dedentAdmonitionBlocks(content: string): string {
  const lines = content.split('\n')
  // In a template literal, `\\b` becomes the backspace char, not regex `\b`.
  // We need `\\\\b` here so the constructed RegExp gets `\b` (word boundary).
  const openerRe = new RegExp(`^([ \\t]*):::(?:${ADMONITION_TYPES})\\\\b`)
  const closerRe = /^([ \t]*):::[ \t]*$/
  const out: string[] = []
  let i = 0

  while (i < lines.length) {
    const m = lines[i].match(openerRe)
    if (!m) { out.push(lines[i]); i++; continue }

    const openerIndent = m[1].length

    // Find the matching closer at the same indent (or less — tolerate
    // projects that dedent the closer too). Skip nested openers conservatively.
    let j = i + 1
    let closerIdx = -1
    let depth = 1
    while (j < lines.length) {
      if (openerRe.test(lines[j])) depth++
      else if (closerRe.test(lines[j])) {
        depth--
        if (depth === 0) { closerIdx = j; break }
      }
      j++
    }
    if (closerIdx === -1) { out.push(lines[i]); i++; continue }

    // Find the minimum non-blank interior indent.
    let minIndent = Infinity
    for (let k = i + 1; k < closerIdx; k++) {
      const ln = lines[k]
      if (!ln.trim()) continue
      const mm = ln.match(/^([ \t]*)\S/)
      if (mm) minIndent = Math.min(minIndent, mm[1].length)
    }

    const dedent = minIndent === Infinity ? 0 : Math.max(0, minIndent - openerIndent)

    out.push(lines[i])
    for (let k = i + 1; k < closerIdx; k++) {
      const ln = lines[k]
      out.push(!ln.trim() || ln.length <= dedent ? ln : ln.slice(dedent))
    }
    out.push(lines[closerIdx])
    i = closerIdx + 1
  }

  return out.join('\n')
}

/**
 * Preprocess admonition titles from Docusaurus space syntax to remark-directive
 * bracket syntax, and dedent list-nested admonition bodies so remark-directive
 * recognizes them.
 *
 *   :::tip Custom Title   →   :::tip[Custom Title]
 */
export function preprocessAdmonitions(content: string): string {
  const re = new RegExp(`^([ \\t]*)(:::(?:${ADMONITION_TYPES}))[ \\t]+(?![\\[{])(.+)$`, 'gm')
  const parts = content.split(FENCE_SPLIT)
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 !== 0) continue // skip code blocks
    parts[i] = dedentAdmonitionBlocks(parts[i])
    parts[i] = parts[i].replace(re, '$1$2[$3]')
  }
  return parts.join('')
}

/**
 * Remark plugin to transform Docusaurus-style admonitions (:::tip, :::note, etc.)
 * into JSX <Callout> components.
 *
 * Input:  :::tip[Optional Title]
 *         Some content
 *         :::
 *
 * Output: <Callout type="tip" title="Optional Title">
 *         Some content
 *         </Callout>
 */
export const remarkCallout: Plugin = () => {
  return (tree: any) => {
    visit(tree, 'containerDirective', (node: any) => {
      const types = ['note', 'tip', 'info', 'caution', 'danger', 'warning']
      if (!types.includes(node.name)) return

      const data = node.data || (node.data = {})
      const attributes = node.attributes || {}

      // Get title from [title] syntax or attributes
      const title = node.children?.[0]?.type === 'paragraph' &&
        node.children[0].data?.directiveLabel
        ? node.children[0].children.map((c: any) => c.value || '').join('')
        : attributes.title || ''

      data.hName = 'Callout'
      data.hProperties = {
        type: node.name,
        title: title || undefined,
      }

      // Remove the directive label paragraph if present
      if (node.children?.[0]?.data?.directiveLabel) {
        node.children = node.children.slice(1)
      }
    })
  }
}
