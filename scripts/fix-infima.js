#!/usr/bin/env node
/**
 * Convert Docusaurus Infima CSS classes to Tailwind v4 / shadcn equivalents.
 *
 * Docusaurus ships a CSS framework called Infima (container/grid/card/
 * spacing/text utilities) that's loaded globally. Migrated content often
 * contains markup like:
 *
 *   <div class="container-fluid">
 *     <div class="row">
 *       <div class="col col--6">
 *         <div class="card margin-top--sm margin-bottom--sm">
 *           <div class="card__header"><h3>Before</h3></div>
 *           <div class="card__body"><p>...</p></div>
 *         </div>
 *       </div>
 *       ...
 *     </div>
 *   </div>
 *
 * Trellis doesn't bundle Infima, so those class names have no effect and
 * the layout breaks. This script rewrites known Infima tokens to Tailwind
 * utility classes in-place across MDX and component files. Unknown tokens
 * are preserved so project-specific classes (e.g., `.before`, `.no-pointer`)
 * survive — you'll still need to restyle those by hand.
 *
 * Usage:
 *   node scripts/fix-infima.js [root-dir] [--write] [--dry-run] [--also-jsx]
 *
 * Defaults to scanning content/docs/ for .mdx/.md files.
 * Pass --also-jsx to additionally scan components/custom/migrated/ for
 * className="..." attributes in migrated component JSX.
 *
 * Runs in dry-run mode unless --write is passed.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const write = args.includes('--write');
const dryRun = args.includes('--dry-run') || !write;
const alsoJsx = args.includes('--also-jsx');
const positional = args.filter((a) => !a.startsWith('--'));
const rootDir = path.resolve(positional[0] || 'content/docs');
const jsxDir = path.resolve('components/custom/migrated');

if (!fs.existsSync(rootDir)) {
  console.error(`Directory not found: ${rootDir}`);
  process.exit(1);
}

// ── Infima token → Tailwind mapping ─────────────────────────────
// Spacing scale matches Infima's five-step scale (none/xs/sm/md/lg/xl).
const SPACING_SCALE = { none: '0', xs: '1', sm: '2', md: '4', lg: '6', xl: '8' };
const SPACING_PROPS = {
  'margin': 'm', 'margin-top': 'mt', 'margin-bottom': 'mb',
  'margin-left': 'ml', 'margin-right': 'mr',
  'margin-vert': 'my', 'margin-horiz': 'mx',
  'padding': 'p', 'padding-top': 'pt', 'padding-bottom': 'pb',
  'padding-left': 'pl', 'padding-right': 'pr',
  'padding-vert': 'py', 'padding-horiz': 'px',
};

// Static mappings. Infima → space-separated Tailwind utilities.
const STATIC_MAP = new Map([
  // Layout containers
  ['container', 'container mx-auto px-4'],
  ['container-fluid', 'w-full px-4'],
  ['row', 'grid grid-cols-12 gap-4'],

  // Card — mirrors shadcn Card look with Tailwind tokens
  ['card', 'rounded-lg border border-border bg-card text-card-foreground shadow-sm'],
  ['card__header', 'p-4 border-b border-border'],
  ['card__body', 'p-4'],
  ['card__footer', 'p-4 border-t border-border'],
  ['card__image', 'w-full'],

  // Text alignment + transform
  ['text--left', 'text-left'],
  ['text--center', 'text-center'],
  ['text--right', 'text-right'],
  ['text--justify', 'text-justify'],
  ['text--truncate', 'truncate'],
  ['text--break', 'break-words'],
  ['text--no-decoration', 'no-underline'],
  ['text--italic', 'italic'],
  ['text--bold', 'font-bold'],
  ['text--normal', 'font-normal'],
  ['text--uppercase', 'uppercase'],
  ['text--lowercase', 'lowercase'],
  ['text--capitalize', 'capitalize'],

  // Semantic colors (shadcn-style, with dark-mode variants for status hues)
  ['text--primary', 'text-primary'],
  ['text--secondary', 'text-secondary-foreground'],
  ['text--success', 'text-green-600 dark:text-green-400'],
  ['text--info', 'text-blue-600 dark:text-blue-400'],
  ['text--warning', 'text-yellow-600 dark:text-yellow-400'],
  ['text--danger', 'text-red-600 dark:text-red-400'],
  ['text--muted', 'text-muted-foreground'],

  // Buttons — Docusaurus has `button button--primary button--lg`. Map to a
  // sensible Tailwind-y default; users will usually want shadcn <Button>.
  ['button', 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors'],
  ['button--primary', 'bg-primary text-primary-foreground hover:bg-primary/90'],
  ['button--secondary', 'bg-secondary text-secondary-foreground hover:bg-secondary/80'],
  ['button--outline', 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground'],
  ['button--block', 'w-full'],
  ['button--sm', 'h-9 text-xs px-3'],
  ['button--lg', 'h-11 px-8'],

  // Pills/badges
  ['badge', 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold'],
  ['badge--primary', 'border-transparent bg-primary text-primary-foreground'],
  ['badge--secondary', 'border-transparent bg-secondary text-secondary-foreground'],
  ['badge--success', 'border-transparent bg-green-600 text-white'],
  ['badge--warning', 'border-transparent bg-yellow-600 text-white'],
  ['badge--danger', 'border-transparent bg-red-600 text-white'],

  // Avatar
  ['avatar', 'flex items-center gap-2'],
  ['avatar__photo', 'h-10 w-10 rounded-full'],
  ['avatar__intro', 'flex flex-col'],
  ['avatar__name', 'font-semibold'],
  ['avatar__subtitle', 'text-sm text-muted-foreground'],
]);

// Generate all spacing utility mappings from SPACING_PROPS × SPACING_SCALE.
for (const [infimaProp, twProp] of Object.entries(SPACING_PROPS)) {
  for (const [sizeName, twSize] of Object.entries(SPACING_SCALE)) {
    STATIC_MAP.set(`${infimaProp}--${sizeName}`, `${twProp}-${twSize}`);
  }
}

// Generate column width mappings. `col--N` where N is 1–12.
//   Infima: col col--6  →  half-width (mobile: full, desktop: 6/12)
//   We output: col-span-12 md:col-span-N so rows stack on small screens.
function colClass(n) {
  return `col-span-12 md:col-span-${n}`;
}

// ── Token-level rewriter ────────────────────────────────────────
function rewriteClassList(classList) {
  const tokens = classList.split(/\s+/).filter(Boolean);
  const out = [];
  let hasColSize = false;
  const unknownInfima = [];

  // First pass: collect whether a specific col--N size is present; if yes,
  // the bare `col` token is redundant (we emit col-span- directly).
  for (const t of tokens) {
    if (/^col--\d+$/.test(t)) hasColSize = true;
  }

  for (const t of tokens) {
    // col--N → col-span-12 md:col-span-N
    const colMatch = t.match(/^col--(\d+)$/);
    if (colMatch) {
      const n = Number(colMatch[1]);
      if (n >= 1 && n <= 12) { out.push(colClass(n)); continue; }
    }
    // col--offset-N → md:col-start-{N+1}
    const offsetMatch = t.match(/^col--offset-(\d+)$/);
    if (offsetMatch) {
      const n = Number(offsetMatch[1]);
      if (n >= 0 && n <= 11) { out.push(`md:col-start-${n + 1}`); continue; }
    }
    // Bare `col` with no explicit size → full-width
    if (t === 'col') {
      if (!hasColSize) out.push('flex-1');
      continue;
    }

    const mapped = STATIC_MAP.get(t);
    if (mapped !== undefined) {
      out.push(mapped);
      continue;
    }

    // Unknown token — preserve it. Track Infima-looking leftovers so we
    // can surface them for manual review.
    if (/--/.test(t) || /^card__/.test(t)) unknownInfima.push(t);
    out.push(t);
  }

  return { text: out.join(' '), unknownInfima };
}

// ── File-level rewriter ─────────────────────────────────────────
// Matches class="..." or className="..." (single or double quoted).
const CLASS_ATTR_RE = /\b(class|className)=(["'])([^"'\n]*)\2/g;

function fixFile(content) {
  let count = 0;
  const allUnknown = new Set();

  const updated = content.replace(CLASS_ATTR_RE, (match, attr, quote, value) => {
    // Pre-filter: is there any Infima-looking token? Used only as a perf
    // gate — no word boundaries because Infima uses BEM-style separators
    // like `card__header` where `_` is a word char and `\bcard\b` misses.
    if (!/(?:\bcol(?:\s|--|$)|\brow\b|card__|\bcard\b|container|text--|\bmargin|\bpadding|button--|\bbadge|\bavatar\b)/.test(value)) {
      return match;
    }
    const { text, unknownInfima } = rewriteClassList(value);
    for (const u of unknownInfima) allUnknown.add(u);
    if (text === value) return match;
    count++;
    return `${attr}=${quote}${text}${quote}`;
  });

  return { content: updated, count, unknownInfima: [...allUnknown] };
}

// ── Walk + process ──────────────────────────────────────────────
function walk(dir, extRe, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, extRe, files);
    else if (extRe.test(entry.name)) files.push(full);
  }
  return files;
}

const mdxFiles = walk(rootDir, /\.(mdx?|html)$/);
const jsxFiles = alsoJsx && fs.existsSync(jsxDir) ? walk(jsxDir, /\.(tsx?|jsx?)$/) : [];
const files = [...mdxFiles, ...jsxFiles];

console.log(`${dryRun ? '[dry-run] ' : ''}scanning ${files.length} file(s) (${mdxFiles.length} content, ${jsxFiles.length} JSX)...`);

let changedFiles = 0;
let totalRewrites = 0;
const unknownByFile = new Map();

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const { content, count, unknownInfima } = fixFile(original);
  if (count === 0) continue;

  const rel = path.relative(process.cwd(), file);
  if (dryRun) {
    console.log(`  [dry-run] would rewrite ${count} class attribute(s) in ${rel}`);
  } else {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  rewrote ${count} class attribute(s) in ${rel}`);
  }
  if (unknownInfima.length > 0) unknownByFile.set(rel, unknownInfima);

  changedFiles++;
  totalRewrites += count;
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${changedFiles} file(s) ${dryRun ? 'need' : 'were'} updated (${totalRewrites} attribute(s) total).`);

if (unknownByFile.size > 0) {
  console.log('\nUnmapped Infima-looking tokens (preserved as-is — restyle manually):');
  for (const [rel, tokens] of unknownByFile) {
    const unique = [...new Set(tokens)];
    console.log(`  ${rel}`);
    for (const t of unique) console.log(`    ${t}`);
  }
}

if (dryRun && changedFiles > 0) {
  console.log('\nRe-run with --write to apply.');
}
