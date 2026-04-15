#!/usr/bin/env node
/**
 * Fix broken relative imports that point at the old Docusaurus `docs/`
 * directory.
 *
 * Docusaurus components in `src/components/` commonly reference assets
 * in the sibling `docs/` tree via relative paths:
 *
 *   import Circle1 from '../../../docs/contributor-guide/images/1-circle.svg';
 *
 * After migration, the component moves to `components/custom/migrated/`
 * and docs content moves to `content/docs/` — so the relative hop no
 * longer resolves:
 *
 *   Module not found: Can't resolve '../../../docs/contributor-guide/images/1-circle.svg'
 *
 * This script finds those broken imports and rewrites them to use the
 * Trellis `@/` alias pointing at `content/docs/`. If the target file
 * doesn't actually exist under `content/docs/`, the import is left alone
 * and a warning is printed so you can resolve it by hand.
 *
 * Usage:
 *   node scripts/fix-docs-imports.js [root-dir] [--write] [--dry-run]
 *
 * Defaults to scanning components/custom/migrated/ relative to the cwd.
 * Runs in dry-run mode unless --write is passed.
 *
 * Note on SVG imports: Next.js does NOT turn `import Foo from './x.svg'`
 * into a React component by default. If your migrated code uses the SVG
 * as a JSX element (`<Circle1 />`), you'll need to either install SVGR
 * (@svgr/webpack) or refactor to use the SVG as a URL with <img src={...} />.
 * This script only fixes the path — not the component-vs-URL semantics.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const write = args.includes('--write');
const dryRun = args.includes('--dry-run') || !write;
const positional = args.filter((a) => !a.startsWith('--'));
const rootDir = path.resolve(positional[0] || 'components/custom/migrated');
const projectRoot = process.cwd();
const contentDocs = path.join(projectRoot, 'content', 'docs');

if (!fs.existsSync(rootDir)) {
  console.error(`Directory not found: ${rootDir}`);
  process.exit(1);
}

if (!fs.existsSync(contentDocs)) {
  console.warn(`Warning: ${contentDocs} does not exist — path-existence checks will fail.`);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

// Match a full `import <binding> from '...docs/...'` statement so we can
// detect the import name (needed for the SVG-as-component warning) along
// with the path to rewrite. The binding group captures `Name`, `{ A, B }`,
// or `* as Ns`; it's used only for reporting.
//   - Relative form:  ../../../docs/foo (any number of `../` hops)
//   - Alias form:     @site/docs/foo
const DOCS_IMPORT = /(^\s*import\s+)(\*\s+as\s+\w+|\{[^}]*\}|[A-Za-z_$][\w$]*)(\s+from\s+['"])((?:\.\.\/)+docs\/[^'"]+|@site\/docs\/[^'"]+)(['"])/gm;

function extractDocsSuffix(importPath) {
  // Everything after the last `/docs/` segment.
  const idx = importPath.lastIndexOf('/docs/');
  if (idx === -1) return null;
  return importPath.slice(idx + '/docs/'.length);
}

function fix(content, filePath) {
  let count = 0;
  const missing = [];
  const rewritten = [];
  const svgAsComponent = [];

  const updated = content.replace(DOCS_IMPORT, (match, importKw, binding, fromKw, importPath, quote) => {
    const suffix = extractDocsSuffix(importPath);
    if (!suffix) return match;

    // Check that the target actually exists in content/docs/
    const target = path.join(contentDocs, suffix);
    if (!fs.existsSync(target)) {
      missing.push({ file: filePath, importPath, expected: path.relative(projectRoot, target) });
      return match;
    }

    count++;
    const newPath = `@/content/docs/${suffix}`;
    rewritten.push({ from: importPath, to: newPath });

    // Flag default SVG imports that look like they'll be used as components.
    // `import Foo from 'path.svg'` + PascalCase binding usually means SVGR
    // was in play upstream. Next.js default config yields a URL string here.
    if (/\.svg$/i.test(importPath) && /^[A-Z]/.test(binding)) {
      svgAsComponent.push(binding);
    }

    return `${importKw}${binding}${fromKw}${newPath}${quote}`;
  });

  return { count, content: updated, missing, rewritten, svgAsComponent };
}

const files = walk(rootDir);
let fixedFiles = 0;
let totalRewrites = 0;
const allMissing = [];
const svgWarnings = new Set();

console.log(`${dryRun ? '[dry-run] ' : ''}scanning ${files.length} file(s) under ${path.relative(projectRoot, rootDir) || '.'}...`);

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const { count, content, missing, rewritten, svgAsComponent } = fix(original, file);

  if (missing.length > 0) allMissing.push(...missing);

  if (count === 0) continue;

  const rel = path.relative(projectRoot, file);
  if (dryRun) {
    console.log(`  [dry-run] would rewrite ${count} import(s) in ${rel}`);
    for (const r of rewritten) console.log(`              ${r.from} → ${r.to}`);
  } else {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  rewrote ${count} import(s) in ${rel}`);
    for (const r of rewritten) console.log(`           ${r.from} → ${r.to}`);
  }

  for (const name of svgAsComponent) svgWarnings.add(`${rel}: <${name} />`);

  fixedFiles++;
  totalRewrites += count;
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${fixedFiles} file(s) ${dryRun ? 'need' : 'were'} updated (${totalRewrites} import(s) total).`);

if (allMissing.length > 0) {
  console.log(`\nUnresolved imports (target not found under content/docs/):`);
  for (const m of allMissing) {
    console.log(`  ${path.relative(projectRoot, m.file)}`);
    console.log(`    ${m.importPath}`);
    console.log(`    (expected: ${m.expected})`);
  }
  console.log(`\nThese were left unchanged — resolve manually.`);
}

if (svgWarnings.size > 0) {
  console.log(`\nSVG-as-component usage detected:`);
  for (const w of svgWarnings) console.log(`  ${w}`);
  console.log(`\nNext.js default config returns a URL string for \`import X from './x.svg'\`, not a`);
  console.log(`React component. JSX usage like <Circle1 /> will fail at render time. To fix either:`);
  console.log(`  (a) Install @svgr/webpack and configure it (SVG → React component), or`);
  console.log(`  (b) Refactor to <img src={Circle1} /> or <Image src={Circle1} />.`);
}

if (dryRun && fixedFiles > 0) {
  console.log(`\nRe-run with --write to apply the fixes.`);
}
