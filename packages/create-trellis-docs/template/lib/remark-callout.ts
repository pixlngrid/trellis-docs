import { visit } from 'unist-util-visit'
import type { Plugin } from 'unified'

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
