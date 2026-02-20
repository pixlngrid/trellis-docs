# Trellis

A production-ready documentation framework built on [Docusaurus 3](https://docusaurus.io/). Trellis provides an opinionated baseline with theme enhancements, a design token system, bundled plugins, and reusable components — so you can focus on writing content, not configuring tooling.

**[Live Site](https://trellis.pixlngrid.com)**

## Features

| Feature | Vanilla Docusaurus | Trellis |
|---|---|---|
| Last-updated display | Bottom of page | Top of page |
| Heading anchors | Hash link | Copy-to-clipboard |
| Tab sync | localStorage | URL query params (shareable) |
| Tab style | Underline | Pill |
| Admonition icons | Emoji | Custom SVG |
| Default color mode | Light | Dark |
| Search | External service (Algolia) | Built-in client-side (Fuse.js) |
| Design tokens | Manual CSS | JSON-to-CSS pipeline |
| Image lightbox | Not included | Built-in |
| FAQ auto-indexer | Not included | Built-in |
| URL redirects | Not included | JSON-based |
| "Suggest an Edit" link | Not included | Pre-filled GitHub issue |

### Bundled Plugins

- **Smart Search** — Build-time indexing with Fuse.js, no external service required
- **FAQ Index** — Auto-generates a searchable FAQ page from `###` headings
- **Redirects** — JSON-based URL redirect management
- **Image Lightbox** — Click-to-zoom on any markdown image
- **Mermaid Pan/Zoom** — Pan and zoom for Mermaid diagrams

### Reusable Components

- **Glossary** — Searchable, alphabetically sorted glossary from a JSON data file
- **FaqTableOfContents** — Searchable FAQ list integrated with the FAQ index plugin
- **Feedback** — Embeddable page-level feedback widget
- **FlippingCard** — Interactive flip cards for quizzes or feature showcases
- **CustomSearch** — Modal search UI powered by Fuse.js

### Design Token System

Define your brand in `design-tokens.json` and the build step generates CSS custom properties automatically. Token categories include colors (neutral, brand, utility, accent), spacing, border radius, border width, and typography.

## Quick Start

### Scaffold a New Project

```bash
npm create trellis-docs@latest my-docs
```

Options:

```
--skip-install              Skip dependency installation
--package-manager <pm>      npm | yarn | pnpm (default: yarn)
```

### Develop from this Repository

```bash
git clone https://github.com/pixlngrid/trellis.git
cd trellis
yarn install
yarn start
```

The dev server runs on [http://localhost:3001](http://localhost:3001).

## Scripts

| Script | Description |
|---|---|
| `yarn start` | Start dev server on port 3001 |
| `yarn build` | Build for production |
| `yarn serve` | Serve the production build |
| `yarn clear` | Clear Docusaurus cache |
| `yarn build-tokens` | Regenerate CSS from `design-tokens.json` |

> `start` and `build` run `build-tokens` automatically before launching Docusaurus.

## Project Structure

```
trellis/
├── docs/                     # Documentation content (MDX)
├── blog/                     # Release notes
├── src/
│   ├── components/           # Reusable React components
│   ├── css/
│   │   ├── tokens.css        # Generated — do not edit
│   │   └── custom.css        # Theme overrides using token variables
│   ├── data/                 # JSON data files (glossary, etc.)
│   ├── pages/                # Custom pages (homepage)
│   └── theme/                # Ejected Docusaurus theme components
├── packages/
│   ├── create-trellis-docs/  # CLI scaffolder
│   ├── faq-index-plugin/     # FAQ indexing plugin
│   └── redirects-plugin/     # Redirect management plugin
├── scripts/
│   └── build-tokens.js       # Design token → CSS builder
├── static/                   # Static assets
├── design-tokens.json        # Design system definitions
├── docusaurus.config.js      # Site configuration
├── sidebars.js               # Sidebar navigation
└── redirects.json            # URL redirect definitions
```

## Who Is Trellis For

- **Technical writers** wanting polished docs without front-end configuration
- **Platform teams** building internal developer portals
- **Open-source projects** needing more than vanilla Docusaurus
- **Anyone** who'd rather write content than tweak tooling

## Requirements

- Node.js 18+
- Yarn 1.22+ (or npm/pnpm via the CLI scaffolder)

## License

[MIT](LICENSE)
