import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import matter from 'gray-matter'

const INCLUDE_RE = /^@include\s+(.+)$/gm
const MAX_DEPTH = 5

/**
 * Resolve `@include path/to/_partial.mdx` directives in MDX content.
 *
 * Reads the referenced file, strips its frontmatter, and inlines the
 * content in place of the directive.  Nested includes are supported up
 * to a depth of 5.
 *
 * @param content  Raw MDX string (frontmatter already stripped)
 * @param dirPath  Absolute directory of the file containing the directives
 * @param depth    Current recursion depth (internal)
 */
export async function resolveIncludes(
  content: string,
  dirPath: string,
  depth = 0,
): Promise<string> {
  if (depth >= MAX_DEPTH) return content

  const matches = [...content.matchAll(INCLUDE_RE)]
  if (matches.length === 0) return content

  let result = content

  // Process in reverse so replacement indices stay valid
  for (const match of matches.reverse()) {
    const includePath = match[1].trim()
    const absPath = path.resolve(dirPath, includePath)

    let partialContent: string
    try {
      const raw = await fs.readFile(absPath, 'utf-8')
      const { content: body } = matter(raw)
      // Recursively resolve nested includes relative to the partial's directory
      partialContent = await resolveIncludes(body, path.dirname(absPath), depth + 1)
    } catch {
      throw new Error(
        `Include not found: "${includePath}" (resolved to ${absPath})`,
      )
    }

    const start = match.index!
    const end = start + match[0].length
    result = result.slice(0, start) + partialContent.trim() + result.slice(end)
  }

  return result
}

/**
 * Synchronous version for use in build scripts (CommonJS).
 */
export function resolveIncludesSync(
  content: string,
  dirPath: string,
  depth = 0,
): string {
  if (depth >= MAX_DEPTH) return content

  return content.replace(INCLUDE_RE, (_match, rawPath: string) => {
    const includePath = rawPath.trim()
    const absPath = path.resolve(dirPath, includePath)

    if (!fsSync.existsSync(absPath)) {
      throw new Error(
        `Include not found: "${includePath}" (resolved to ${absPath})`,
      )
    }

    const raw = fsSync.readFileSync(absPath, 'utf-8')
    const { content: body } = matter(raw)
    return resolveIncludesSync(body.trim(), path.dirname(absPath), depth + 1)
  })
}
