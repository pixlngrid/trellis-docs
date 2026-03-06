export interface AuthorProfile {
  name: string
  role?: string
  bio?: string
  img?: string
  url?: string
}

/**
 * Central author profiles. Blog posts can reference authors by key
 * (e.g. `authors: [janedoe]`) instead of repeating inline objects.
 *
 * Inline objects in frontmatter override fields from the config.
 */
export const authors: Record<string, AuthorProfile> = {
  janedoe: {
    name: 'Jane Doe',
    role: 'Technical Writer',
    bio: 'Jane is a technical writer who loves making complex topics accessible.',
  },
}
