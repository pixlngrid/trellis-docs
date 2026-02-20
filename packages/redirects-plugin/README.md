# Redirects Plugin for Docusaurus

A Docusaurus 3.x plugin that handles URL redirects by generating static HTML redirect pages during the build process.

## Features

- 🔄 Create client-side redirects using meta refresh and JavaScript
- 📁 Support for multiple redirect configuration sources
- 🎯 Handles both file-based (`/path.html`) and directory-based (`/path/index.html`) redirects
- 🔍 Auto-detection of redirect configuration files
- ⚡ Zero runtime overhead - generates static HTML files

## Installation

This is a local plugin included in the project. No separate installation needed.

## Configuration

Add the plugin to your `docusaurus.config.js`:

```javascript
module.exports = {
  plugins: [
    [
      './packages/redirects-plugin',
      {
        // Optional: specify redirects directly in config
        redirects: [
          {
            from: '/old-page',
            to: '/new-page',
            type: 301 // optional, defaults to 301
          }
        ],
        // Optional: specify a custom redirects file location
        redirectsFile: 'config/redirects.json'
      }
    ]
  ]
};
```

## Redirect Configuration Sources

The plugin loads redirects from multiple sources in this order:

### 1. Plugin Options

Define redirects directly in `docusaurus.config.js`:

```javascript
{
  redirects: [
    { from: '/old', to: '/new' },
    { from: '/legacy/path', to: '/modern/path', type: 302 }
  ]
}
```

### 2. Custom File Location

Specify a custom file path:

```javascript
{
  redirectsFile: 'config/my-redirects.json'
}
```

### 3. Auto-Detection

If no `redirectsFile` is specified, the plugin automatically looks for:

- `redirects.json` (project root)
- `config/redirects.json`
- `src/redirects.json`

## Redirects File Format

Create a `redirects.json` file:

```json
[
  {
    "from": "/old-docs/getting-started",
    "to": "/docs/introduction"
  },
  {
    "from": "/api-v1",
    "to": "/api/v2",
    "type": 302
  },
  {
    "from": "/blog/old-post",
    "to": "https://external-site.com/new-post"
  }
]
```

## Redirect Object Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `from` | string | Yes | - | Source path to redirect from |
| `to` | string | Yes | - | Destination URL or path |
| `type` | number | No | 301 | HTTP redirect status code |

## How It Works

1. During the build process, the plugin reads all configured redirects
2. For each redirect, it generates HTML files with:
   - Meta refresh tag for immediate redirect
   - JavaScript fallback for better compatibility
   - Canonical link tag for SEO
3. Creates both `/path.html` and `/path/index.html` for maximum compatibility

## Generated HTML Example

For a redirect from `/old` to `/new`, the plugin generates:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=/new">
    <link rel="canonical" href="/new" />
    <title>Redirecting...</title>
  </head>
  <body>
    <p>Redirecting to <a href="/new">/new</a>...</p>
    <script>
      window.location.href = '/new';
    </script>
  </body>
</html>
```

## Path Normalization

- Leading slashes are added if missing
- Trailing slashes are removed for consistency
- Hash fragments are preserved
- External URLs (starting with `http`) are supported

## Debugging

The plugin logs its activity during the build:

```
Loaded 5 redirects from config
Auto-detected and loaded 10 redirects from redirects.json
Processing 15 redirects...
Created redirect: /old → /new (301)
```

## Common Use Cases

- Maintaining URLs after site restructuring
- Redirecting from legacy documentation versions
- Creating short URLs for marketing campaigns
- Handling moved or renamed pages
- Redirecting to external resources

## Limitations

- Redirects only work for paths that don't correspond to actual files
- Server-side redirects are more efficient but require server configuration
- Meta refresh redirects may not preserve HTTP referrer information

## Troubleshooting

**Redirects not working:**

- Check that the source path doesn't conflict with an existing page
- Verify the JSON file is valid (use a JSON validator)
- Check build logs for error messages

**Invalid redirect warnings:**

- Ensure both `from` and `to` fields are present
- Check for typos in field names

## License

MIT
