# FAQ Index Plugin for Docusaurus

A Docusaurus 3.x local plugin that scans `/docs/faq/*.mdx` at build time, extracts questions from `###` headings, and exposes the full FAQ index via `setGlobalData`. Designed to work with the `FaqTableOfContents` component.

## Features

- 🔍 Auto-discovery of FAQ files in `docs/faq/`
- 📋 Extracts questions from `###` headings with frontmatter parsing
- 🔗 Generates deep-link anchors matching Docusaurus conventions
- 📦 Exposes data via `useGlobalData` for client-side components

## Installation

This is a local plugin included in the project under `packages/`. No separate installation is needed, but ensure `gray-matter` is available:

```bash
cd packages/faq-index-plugin
yarn install
```

## Configuration

Add the plugin to `docusaurus.config.js`:

```javascript
module.exports = {
  plugins: [
    [
      './packages/faq-index-plugin',
      {
        faqDir: 'docs/faq',        // path relative to site root
        basePermalink: '/faq',     // base URL path for FAQ pages
      },
    ],
  ],
};
```

## Plugin options

| Option          | Type     | Default      | Description                                      |
|-----------------|----------|--------------|--------------------------------------------------|
| `faqDir`        | `string` | `'docs/faq'` | Path to the FAQ folder relative to the site root. |
| `basePermalink` | `string` | `'/faq'`     | Base permalink for generated FAQ links.           |

## How it works

1. At build time, the plugin reads every `.mdx` and `.md` file in the configured FAQ directory (excluding `index.mdx` and `index.md`).
2. It parses each file's frontmatter for `title` and `description` using `gray-matter`.
3. It extracts question text from every `###` heading, stripping bold, italic, inline code, and link formatting.
4. The full index is sorted alphabetically by topic title and exposed via Docusaurus `setGlobalData`.
5. The `FaqTableOfContents` component reads this data at runtime using `useGlobalData`.

## Expected FAQ file format

Each topic file should use `###` headings for questions:

```mdx
---
title: Secrets
description: Managing secrets, vaults, and credential rotation.
---

# Secrets

### How do I add a secret to my application?

Answer content here...

### How do I rotate a secret?

Answer content here...
```

## Anchor generation

The plugin generates anchors from heading text using the same convention as Docusaurus: lowercase, special characters stripped, spaces replaced with hyphens. Deep links align automatically with Docusaurus-rendered anchors unless you use custom heading IDs (e.g., `### My heading {#custom-id}`).

## File structure

```
your-docusaurus-project/
├── docs/
│   └── faq/
│       ├── index.mdx
│       ├── authentication-permissions.mdx
│       ├── database-infrastructure.mdx
│       └── secrets.mdx
├── packages/
│   └── faq-index-plugin/
│       ├── package.json
│       ├── index.js
│       └── README.md
├── src/
│   └── components/
│       └── FaqTableOfContents/
│           ├── index.jsx
│           └── styles.module.css
└── docusaurus.config.js
```

## License

MIT
