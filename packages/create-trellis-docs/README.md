# create-trellis-docs

Scaffold a new documentation site powered by [Trellis Docs](https://github.com/pixlngrid/trellis-docs) — an opinionated docs framework built on Next.js, Tailwind CSS v4, and shadcn/ui.

## Usage

```bash
npx create-trellis-docs my-docs
```

You'll be prompted for a site title, tagline, URL, and optional GitHub repo URL. The scaffolder creates a ready-to-run project with all Trellis features included.

## Options

```
create-trellis-docs [project-name]

Options:
  -s, --skip-install              Skip dependency installation
  -p, --package-manager <pm>      npm | yarn | pnpm (default: npm)
  -V, --version                   Output version number
  -h, --help                      Display help
```

## What You Get

- **Next.js 15** App Router with static export
- **Tailwind CSS v4** with design token integration
- **MDX content pipeline** with syntax highlighting (Shiki), callouts, tabs, and more
- **Built-in search** powered by Fuse.js (Cmd+K)
- **Dark/light mode** with system preference detection
- **Design token system** — define your brand in JSON, get CSS and Tailwind utilities
- Starter documentation content to get you going

## Requirements

- Node.js 18+
