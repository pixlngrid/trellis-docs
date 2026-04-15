#!/usr/bin/env node
/**
 * Convert Docusaurus-style <img> JSX tags to Trellis markdown image syntax.
 *
 * Transforms:
 *   <img
 *     id="uielement4"
 *     src={require('./images/foo.png').default}
 *     alt="Alt text"
 *   />
 *
 * Into:
 *   ![Alt text](./images/foo.png)
 *
 * Also handles:
 *   - src as string literal: src="./images/foo.png"
 *   - width/height → title attribute: ![alt](src "width=200px")
 *   - self-closing and paired <img></img>
 *   - Drops: id, className, style, and other unsupported JSX attrs
 *
 * Usage:
 *   node scripts/convert-img-tags.js <file-or-glob> [--write] [--dry-run]
 *
 * Examples:
 *   node scripts/convert-img-tags.js content/docs/my-page.mdx --write
 *   node scripts/convert-img-tags.js "content/docs/**\/*.mdx" --dry-run
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const write = args.includes('--write');
const dryRun = args.includes('--dry-run') || !write;
const targets = args.filter((a) => !a.startsWith('--'));

if (targets.length === 0) {
  console.error('Usage: node scripts/convert-img-tags.js <file-or-glob> [--write]');
  process.exit(1);
}

/** Parse a JSX attribute string into a map. Handles key="val", key={expr}, key='val'. */
function parseAttrs(attrString) {
  const attrs = {};
  const re = /(\w[\w-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
  let m;
  while ((m = re.exec(attrString)) !== null) {
    const [, key, dq, sq, expr] = m;
    attrs[key] = { value: dq ?? sq ?? expr, isExpr: expr !== undefined };
  }
  return attrs;
}

/** Extract a path from `require('...').default` or `require("...")`. */
function extractRequirePath(expr) {
  const m = expr.match(/require\(\s*['"]([^'"]+)['"]\s*\)(?:\.default)?/);
  return m ? m[1] : null;
}

/** Convert a single <img .../> or <img ...></img> match to markdown. */
function convertImgTag(tagSource) {
  const attrMatch = tagSource.match(/^<img\b([\s\S]*?)\/?>(?:<\/img>)?$/);
  if (!attrMatch) return null;

  const attrs = parseAttrs(attrMatch[1]);

  let src = null;
  if (attrs.src) {
    src = attrs.src.isExpr ? extractRequirePath(attrs.src.value) : attrs.src.value;
  }
  if (!src) return null;

  const alt = attrs.alt?.value ?? '';

  // Optional width/height → title attribute (Trellis convention)
  const titleParts = [];
  if (attrs.width) titleParts.push(`width=${attrs.width.value}`);
  if (attrs.height) titleParts.push(`height=${attrs.height.value}`);
  const title = titleParts.length ? ` "${titleParts.join(' ')}"` : '';

  return `![${alt}](${src}${title})`;
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');

  // Match <img ... /> (self-closing) or <img ...></img>, across multiple lines.
  const imgRe = /<img\b[\s\S]*?(?:\/>|<\/img>)/g;

  let count = 0;
  const updated = original.replace(imgRe, (match) => {
    const md = convertImgTag(match);
    if (md === null) {
      console.warn(`  [skip] Could not convert in ${filePath}:\n    ${match.replace(/\n/g, '\n    ')}`);
      return match;
    }
    count++;
    return md;
  });

  if (count === 0) {
    console.log(`  no <img> tags found: ${filePath}`);
    return;
  }

  if (dryRun) {
    console.log(`  [dry-run] would convert ${count} <img> tag(s) in ${filePath}`);
  } else {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`  converted ${count} <img> tag(s) in ${filePath}`);
  }
}

function expandTargets(patterns) {
  const files = [];
  for (const p of patterns) {
    if (p.includes('*')) {
      // Defer glob expansion to shell; if shell didn't expand, warn.
      console.warn(`  [warn] glob not expanded by shell: ${p}. Pass explicit file paths or use a shell that supports globbing.`);
      continue;
    }
    const abs = path.resolve(p);
    if (!fs.existsSync(abs)) {
      console.warn(`  [warn] file not found: ${p}`);
      continue;
    }
    files.push(abs);
  }
  return files;
}

const files = expandTargets(targets);
console.log(`${dryRun ? '[dry-run] ' : ''}processing ${files.length} file(s)...`);
files.forEach(processFile);
