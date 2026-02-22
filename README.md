# Trellis

A production-ready documentation framework built on [Next.js 15](https://nextjs.org/), [Tailwind CSS v4](https://tailwindcss.com/), and [shadcn/ui](https://ui.shadcn.com/). Trellis provides an opinionated baseline with custom theme components, a design token system, built-in search, and reusable components — so you can focus on writing content, not configuring tooling.

## Features

| Feature | Description |
|---|---|
| Heading anchors | Copy-to-clipboard link |
| Tab sync | URL query params (shareable) |
| Tab style | Pill |
| Admonition icons | Custom SVG |
| Default color mode | Dark |
| Search | Built-in client-side (Fuse.js, Cmd+K) |
| Design tokens | JSON-to-CSS pipeline with Tailwind v4 `@theme` integration |
| Image lightbox | Click-to-zoom on any image |
| FAQ auto-indexer | Searchable FAQ page from `###` headings |
| URL redirects | JSON-based static redirects |
| Mermaid diagrams | Pan and zoom support |
| Syntax highlighting | Shiki with dual light/dark themes |
| Static export | Deployable anywhere |

### Reusable Components

- **Glossary** — Searchable, alphabetically sorted glossary from a JSON data file
- **FaqTableOfContents** — Searchable FAQ list integrated with the FAQ index
- **Feedback** — Embeddable page-level feedback widget
- **FlippingCard** — Interactive flip cards for quizzes or feature showcases
- **Search** — Modal search UI powered by Fuse.js (Cmd+K)

### Design Token System

Define your brand in `design-tokens.json` and the build step generates CSS custom properties that integrate directly with Tailwind v4's `@theme` directive. Token categories include colors (neutral, brand, utility, accent), spacing, border radius, border width, and typography.

## Quick Start

### Scaffold a New Project

```bash
npx create-trellis-docs my-docs
```

Options:

```
--skip-install              Skip dependency installation
--package-manager <pm>      npm | yarn | pnpm (default: npm)
```

### Develop from this Repository

```bash
git clone https://github.com/pixlngrid/trellis.git
cd trellis
npm install
npm run dev
```

The dev server runs on [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production (static export to `out/`) |
| `npm run start` | Serve the production build |
| `npm run build-tokens` | Regenerate CSS from `design-tokens.json` |

> `dev` and `build` run `build-tokens` automatically before launching Next.js.

## Project Structure

```
trellis/
├── app/
│   ├── layout.tsx              # Root layout (ThemeProvider, fonts)
│   ├── page.tsx                # Homepage
│   ├── globals.css             # Tailwind imports + theme tokens
│   ├── tokens.css              # Generated — do not edit
│   ├── (docs)/
│   │   ├── layout.tsx          # Docs layout (navbar, sidebar, footer)
│   │   └── [...slug]/page.tsx  # Catch-all MDX renderer
│   └── blog/
│       ├── page.tsx            # Blog index
│       └── [slug]/page.tsx     # Blog post
├── components/
│   ├── docs/                   # Layout: navbar, sidebar, footer, breadcrumbs, toc
│   │   ├── mdx/                # MDX: callout, heading, tabs, code-block, mermaid, lightbox
│   │   └── search/             # Search dialog
│   └── custom/                 # Glossary, feedback, flipping-card, faq-toc
├── config/
│   ├── site.ts                 # Site configuration
│   ├── sidebar.ts              # Sidebar navigation
│   └── navigation.ts           # Navbar/footer links
├── content/
│   ├── docs/                   # Documentation content (MDX)
│   └── blog/                   # Blog posts
├── lib/                        # Utilities: MDX loading, TOC, sidebar, remark plugins
├── scripts/
│   ├── build-tokens.js         # design-tokens.json → app/tokens.css
│   ├── build-search-index.js   # content/docs/ → public/searchIndex.json
│   └── build-faq-index.js      # content/docs/faq/ → public/faqIndex.json
├── data/
│   └── glossary.json           # Glossary data
├── public/img/                 # Static images
├── packages/
│   └── create-trellis-docs/    # CLI scaffolder (npx create-trellis-docs)
├── design-tokens.json          # Design system definitions
├── redirects.json              # URL redirect definitions
├── next.config.mjs             # Next.js configuration
├── postcss.config.mjs          # PostCSS (Tailwind v4)
└── tsconfig.json               # TypeScript configuration
```

## Tech Stack

- **Framework**: Next.js 15 (App Router, static export)
- **Styling**: Tailwind CSS v4 with `@theme` directive
- **Components**: Radix UI primitives (via shadcn/ui patterns)
- **MDX**: next-mdx-remote v5 (RSC compatible)
- **Syntax Highlighting**: Shiki (build-time, dual themes)
- **Search**: Fuse.js (client-side fuzzy search)
- **Icons**: Lucide React
- **Theming**: next-themes (dark/light with system detection)

## Requirements

- Node.js 18+

## License

[MIT](LICENSE)
