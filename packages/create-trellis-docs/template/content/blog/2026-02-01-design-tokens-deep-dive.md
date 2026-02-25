---
title: Design Tokens Deep Dive
description: How the design token pipeline works — from JSON definitions to generated CSS custom properties.
date: 2026-02-01
category: Engineering
authors:
  - name: Alex Rivera
    role: Frontend Engineer
---

Design tokens are the single source of truth for your site's visual identity. This post explains how they flow from a JSON file to the CSS that styles your docs.

{/* truncate */}

## The Pipeline

The build process reads `design-tokens.json` and generates `app/tokens.css` containing a Tailwind v4 `@theme` block. This happens automatically before every build and dev server start.

```
design-tokens.json → build-tokens.js → app/tokens.css
```

## Token Structure

Tokens are organized into categories:

```json
{
  "colors": {
    "primary": "#6366f1",
    "primary-foreground": "#ffffff"
  },
  "spacing": {
    "navbar-height": "64px"
  },
  "typography": {
    "font-family": "Inter, sans-serif"
  }
}
```

Each token becomes a CSS custom property — for example, `colors.primary` generates `--primary: #6366f1`.

## Customizing Tokens

Edit `design-tokens.json` and run `npm run build-tokens` to regenerate the CSS. The dev server watches for changes automatically.

See the [Customizing Design Tokens](/design-tokens/customizing/) guide for the full list of available tokens.
