import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'

const DOCS_DIR = path.join(process.cwd(), 'content/docs')
const BLOG_DIR = path.join(process.cwd(), 'content/blog')

export interface DocMeta {
  title: string
  description?: string
  keywords?: string[]
  last_update?: { date: string; author: string }
  hide_table_of_contents?: boolean
  slug: string
}

export interface DocEntry {
  meta: DocMeta
  content: string
  filePath: string
}

async function getFilesRecursive(dir: string, base = ''): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      files.push(...await getFilesRecursive(path.join(dir, entry.name), rel))
    } else if (/\.mdx?$/.test(entry.name)) {
      files.push(rel)
    }
  }

  return files
}

function fileToSlug(file: string): string[] {
  return file
    .replace(/\.mdx?$/, '')
    .replace(/\/index$/, '')
    .split('/')
    .filter(Boolean)
}

export async function getAllDocSlugs(): Promise<string[][]> {
  const files = await getFilesRecursive(DOCS_DIR)
  return files.map(fileToSlug)
}

export async function getDocBySlug(slug: string[]): Promise<DocEntry> {
  const slugPath = slug.join('/')

  // Try exact file match, then index file
  const candidates = [
    path.join(DOCS_DIR, `${slugPath}.mdx`),
    path.join(DOCS_DIR, `${slugPath}.md`),
    path.join(DOCS_DIR, `${slugPath}/index.mdx`),
    path.join(DOCS_DIR, `${slugPath}/index.md`),
  ]

  let filePath: string | null = null
  for (const candidate of candidates) {
    try {
      await fs.access(candidate)
      filePath = candidate
      break
    } catch {
      continue
    }
  }

  if (!filePath) {
    throw new Error(`Doc not found: ${slugPath}`)
  }

  const raw = await fs.readFile(filePath, 'utf-8')
  const { data, content } = matter(raw)

  return {
    meta: {
      title: data.title || slug[slug.length - 1],
      description: data.description,
      keywords: data.keywords,
      last_update: data.last_update,
      hide_table_of_contents: data.hide_table_of_contents,
      slug: '/' + slugPath,
    },
    content,
    filePath,
  }
}

export async function getAllDocsMeta(): Promise<DocMeta[]> {
  const files = await getFilesRecursive(DOCS_DIR)
  const metas: DocMeta[] = []

  for (const file of files) {
    const raw = await fs.readFile(path.join(DOCS_DIR, file), 'utf-8')
    const { data } = matter(raw)
    const slugArr = fileToSlug(file)
    metas.push({
      title: data.title || slugArr[slugArr.length - 1],
      description: data.description,
      keywords: data.keywords,
      last_update: data.last_update,
      slug: '/' + slugArr.join('/'),
    })
  }

  return metas
}

// Blog content loading

export interface BlogMeta {
  title: string
  description?: string
  slug: string
  date: string
  authors?: Array<{ name: string }>
}

export interface BlogEntry {
  meta: BlogMeta
  content: string
  excerpt: string
}

export async function getAllBlogPosts(): Promise<BlogEntry[]> {
  let files: string[]
  try {
    files = (await fs.readdir(BLOG_DIR)).filter((f) => /\.mdx?$/.test(f))
  } catch {
    return []
  }

  const posts: BlogEntry[] = []

  for (const file of files) {
    const raw = await fs.readFile(path.join(BLOG_DIR, file), 'utf-8')
    const { data, content } = matter(raw)

    // Parse date from filename: YYYY-MM-DD-slug.md
    const match = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.mdx?$/)
    const date = match ? match[1] : data.date || ''
    const fileSlug = match ? match[2] : file.replace(/\.mdx?$/, '')

    // Handle {/* truncate */} marker (MDX comment syntax)
    const parts = content.split(/\{\/\*\s*truncate\s*\*\/\}/)
    const excerpt = parts[0].trim()

    posts.push({
      meta: {
        title: data.title || fileSlug,
        description: data.description,
        slug: data.slug || fileSlug,
        date,
        authors: data.authors,
      },
      content,
      excerpt,
    })
  }

  return posts.sort((a, b) => b.meta.date.localeCompare(a.meta.date))
}

export async function getBlogPostBySlug(slug: string): Promise<BlogEntry | null> {
  const posts = await getAllBlogPosts()
  return posts.find((p) => p.meta.slug === slug) || null
}
