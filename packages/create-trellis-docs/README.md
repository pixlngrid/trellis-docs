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

## Migrating from Docusaurus

New projects include a migration script that converts Docusaurus content, sidebar, and MDX imports into Trellis format:

```bash
cd my-docs
node scripts/migrate-docusaurus.js /path/to/docusaurus-project
```

Run with `--dry-run` to preview changes without writing files, or `--force` to overwrite existing content. See the [Content Authoring guide](https://trellis-docs.dev/guides/content-authoring/) for details on `@include` partials and other features.

## Requirements

- Node.js 18+

## Troubleshooting

### `Cannot find module '../lightningcss.win32-x64-msvc.node'`

This error occurs when npm skips platform-specific native dependencies during installation. It's typically caused by a global `.npmrc` that overrides the `os` setting (e.g., `os = "linux"` on a Windows machine).

**Fix:** reinstall with the correct platform flag:

```bash
# Windows
npm install --os=win32

# macOS (Intel/Apple Silicon)
npm install --os=darwin

# Linux
npm install --os=linux
```

To check if your global `.npmrc` is the cause:

```bash
npm config get os
```

If it returns a value that doesn't match your actual OS, that's the problem. You can either remove the `os` line from your global `.npmrc` (`~/.npmrc`) or continue using the `--os` flag when installing.

### `EPERM: operation not permitted, scandir '.next/trace'`

This is a Windows file-locking issue unrelated to Trellis. Close any running `next dev` processes, delete the `.next` folder, and rebuild:

```bash
rm -rf .next
npm run build
```
