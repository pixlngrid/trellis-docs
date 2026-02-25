---
title: Getting Started with Documentation
description: A practical guide to writing your first docs page, organizing content, and configuring your site.
date: 2026-01-15
category: Tutorial
authors:
  - name: Jane Doe
    role: Technical Writer
---

Good documentation starts with a clear structure. In this guide, we'll walk through creating your first page, organizing your sidebar, and customizing your site.

{/* truncate */}

## Create Your First Page

Add a Markdown file to `content/docs/`. The filename determines the URL — for example, `content/docs/guides/setup.mdx` becomes `/guides/setup/`.

Every page needs a `title` in its frontmatter:

```yaml
---
title: Setup Guide
description: How to set up your development environment.
---
```

## Organize the Sidebar

Open `config/sidebar.ts` and add your page to the navigation:

```ts
{
  type: 'category',
  label: 'Guides',
  items: [
    { type: 'doc', id: 'guides/setup' },
  ],
}
```

The `id` field matches the file path under `content/docs/` without the extension.

## Next Steps

- Read the [Content Authoring](/guides/content-authoring/) guide for frontmatter options
- Explore [Writing Docs](/guides/writing-docs/) for code blocks, tabs, and admonitions
- Customize your branding with [Design Tokens](/design-tokens/customizing/)
