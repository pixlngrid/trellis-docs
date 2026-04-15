#!/usr/bin/env node
/**
 * Rewrite Docusaurus `useColorMode` → next-themes `useTheme` in migrated
 * components.
 *
 * Docusaurus ships a dark-mode hook at `@docusaurus/theme-common`:
 *
 *   import { useColorMode } from '@docusaurus/theme-common';
 *   const { colorMode, setColorMode } = useColorMode();
 *
 * The migration script strips the import as "@docusaurus import removed",
 * which leaves dangling references like `useColorMode is not defined` or
 * `colorMode is not defined` at runtime.
 *
 * Trellis uses next-themes (already a Trellis runtime dep) for the same
 * job. Field names differ slightly:
 *
 *   Docusaurus           →  next-themes
 *   ---------------------------------------------
 *   useColorMode()       →  useTheme()
 *   { colorMode }        →  { resolvedTheme: colorMode }
 *   { setColorMode }     →  { setTheme: setColorMode }
 *
 * Using the `resolvedTheme: colorMode` alias lets the rest of the file —
 * `colorMode === 'dark'`, etc. — keep working without per-site edits.
 *
 * This script:
 *   1. Finds every call to `useColorMode(`
 *   2. Rewrites the destructuring pattern to pull from `useTheme()` with
 *      aliases that preserve the original variable names
 *   3. Adds `import { useTheme } from 'next-themes'` if not already present
 *   4. Removes any lingering `// [migration] @docusaurus import removed`
 *      comment line for theme-common imports that would now be confusing
 *
 * Usage:
 *   node scripts/fix-theme-hooks.js [root-dir] [--write] [--dry-run]
 *
 * Defaults to scanning components/custom/migrated/ relative to the cwd.
 * Runs in dry-run mode unless --write is passed.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const write = args.includes('--write');
const dryRun = args.includes('--dry-run') || !write;
const positional = args.filter((a) => !a.startsWith('--'));
const rootDir = path.resolve(positional[0] || 'components/custom/migrated');

if (!fs.existsSync(rootDir)) {
  console.error(`Directory not found: ${rootDir}`);
  process.exit(1);
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

// Rewrites in order:
//   const { colorMode, setColorMode } = useColorMode()
//     → const { resolvedTheme: colorMode, setTheme: setColorMode } = useTheme()
//   const { colorMode } = useColorMode()
//     → const { resolvedTheme: colorMode } = useTheme()
//   const { setColorMode } = useColorMode()
//     → const { setTheme: setColorMode } = useTheme()
// Any remaining useColorMode() call shapes get left alone with a warning.
function rewriteThemeHook(content) {
  let rewrites = 0;
  const warnings = [];

  // Destructuring of both
  content = content.replace(
    /const\s*\{\s*colorMode\s*,\s*setColorMode\s*\}\s*=\s*useColorMode\s*\(\s*\)/g,
    () => { rewrites++; return 'const { resolvedTheme: colorMode, setTheme: setColorMode } = useTheme()'; }
  );
  // Reversed order
  content = content.replace(
    /const\s*\{\s*setColorMode\s*,\s*colorMode\s*\}\s*=\s*useColorMode\s*\(\s*\)/g,
    () => { rewrites++; return 'const { setTheme: setColorMode, resolvedTheme: colorMode } = useTheme()'; }
  );
  // colorMode only
  content = content.replace(
    /const\s*\{\s*colorMode\s*\}\s*=\s*useColorMode\s*\(\s*\)/g,
    () => { rewrites++; return 'const { resolvedTheme: colorMode } = useTheme()'; }
  );
  // setColorMode only
  content = content.replace(
    /const\s*\{\s*setColorMode\s*\}\s*=\s*useColorMode\s*\(\s*\)/g,
    () => { rewrites++; return 'const { setTheme: setColorMode } = useTheme()'; }
  );

  // Anything else that still says useColorMode — flag for manual review.
  const remaining = content.match(/\buseColorMode\s*\(/g);
  if (remaining) {
    warnings.push(`${remaining.length} useColorMode() call(s) with unrecognized shape — rewrite manually`);
  }

  return { content, rewrites, warnings };
}

function ensureUseThemeImport(content) {
  // Skip if already imported
  if (/^\s*import\s+\{[^}]*\buseTheme\b[^}]*\}\s+from\s+['"]next-themes['"]/m.test(content)) {
    return { content, added: false };
  }

  // Strip any lingering migration placeholder for theme-common so we don't
  // end up with both a placeholder and a new import in the same file.
  content = content.replace(
    /^\s*\/\/\s*\[migration\][^\n]*@docusaurus[^\n]*theme-common[^\n]*\n/gm,
    ''
  );
  content = content.replace(
    /^\s*\/\/\s*\[migration\][^\n]*@docusaurus import removed[^\n]*\n(?=\s*const\s*\{[^}]*\}\s*=\s*useTheme)/gm,
    ''
  );

  // Insert after leading block comments and any existing imports. Safest:
  // put it after the first React import, otherwise at the top.
  const reactImportMatch = content.match(/^import\s+React[^\n]*\n/m);
  if (reactImportMatch) {
    const idx = content.indexOf(reactImportMatch[0]) + reactImportMatch[0].length;
    content = content.slice(0, idx) + "import { useTheme } from 'next-themes';\n" + content.slice(idx);
    return { content, added: true };
  }

  // Fall back: after any leading comment block, before everything else.
  const leading = content.match(/^(\s*(?:\/\*[\s\S]*?\*\/\s*)*)/);
  const insertIdx = leading ? leading[0].length : 0;
  content = content.slice(0, insertIdx) + "import { useTheme } from 'next-themes';\n" + content.slice(insertIdx);
  return { content, added: true };
}

const files = walk(rootDir);
let fixedFiles = 0;
let totalRewrites = 0;
const allWarnings = [];

console.log(`${dryRun ? '[dry-run] ' : ''}scanning ${files.length} file(s) under ${path.relative(process.cwd(), rootDir) || '.'}...`);

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  if (!/\buseColorMode\s*\(/.test(original)) continue;

  const { content: rewritten, rewrites, warnings } = rewriteThemeHook(original);
  const { content: final, added } = ensureUseThemeImport(rewritten);

  const rel = path.relative(process.cwd(), file);
  if (rewrites === 0 && !added) {
    // File references useColorMode but we couldn't confidently rewrite it.
    for (const w of warnings) allWarnings.push(`${rel}: ${w}`);
    continue;
  }

  if (dryRun) {
    console.log(`  [dry-run] would rewrite ${rewrites} call(s) in ${rel}${added ? ' (+ add useTheme import)' : ''}`);
  } else {
    fs.writeFileSync(file, final, 'utf8');
    console.log(`  rewrote ${rewrites} call(s) in ${rel}${added ? ' (+ added useTheme import)' : ''}`);
  }
  for (const w of warnings) allWarnings.push(`${rel}: ${w}`);

  fixedFiles++;
  totalRewrites += rewrites;
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${fixedFiles} file(s) ${dryRun ? 'need' : 'were'} updated (${totalRewrites} call(s) total).`);

if (allWarnings.length > 0) {
  console.log('\nWarnings:');
  for (const w of allWarnings) console.log(`  ${w}`);
}

if (dryRun && fixedFiles > 0) {
  console.log(`\nRe-run with --write to apply the fixes.`);
}

if (fixedFiles > 0 && !dryRun) {
  console.log(`\nNote: next-themes is already a Trellis runtime dependency — no install needed.`);
}
