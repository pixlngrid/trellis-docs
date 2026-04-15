#!/usr/bin/env node
/**
 * Rename `.ts` files that actually contain JSX to `.tsx`.
 *
 * Earlier versions of migrate-docusaurus.js had a faulty JSX detector that
 * could miss JSX when the source file contained apostrophes inside double-
 * quoted strings (common for English contractions or CSS values like
 * `"'DM Sans', sans-serif"`). Affected files ended up as `.ts`, which
 * SWC/Next.js then fails to parse:
 *
 *   Expected '>', got 'ident'
 *   ...alchemy-landing-page.ts:83:8
 *     <div style={{ display: 'flex', ... }}>
 *
 * This script walks the target directory and, for every `.ts` file that
 * contains JSX, renames it to `.tsx` in place. Import statements elsewhere
 * don't need updating — Next.js resolves extensionless imports against
 * both `.ts` and `.tsx` via the project's tsconfig.
 *
 * Usage:
 *   node scripts/fix-jsx-extension.js [root-dir] [--write] [--dry-run]
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
    // Only plain .ts files (skip .tsx, .d.ts)
    else if (/\.ts$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) files.push(full);
  }
  return files;
}

// Robust JSX detection: strip comments only (not strings, which can hide JSX
// when apostrophes nest inside double-quoted strings). Look for unambiguous
// JSX shapes:
//   - closing tag:        </div> or </Foo>
//   - PascalCase usage:   <Button ... or <Icon />
//   - return/arrow JSX:   return < or => < or => (<
function containsJsx(content) {
  const stripped = content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
  if (/<\/[a-zA-Z][a-zA-Z0-9.]*\s*>/.test(stripped)) return true;
  if (/<[A-Z][A-Za-z0-9.]*[\s/>]/.test(stripped)) return true;
  if (/(?:return|=>)\s*\(?\s*<[a-zA-Z]/.test(stripped)) return true;
  return false;
}

const files = walk(rootDir);
let renamedCount = 0;
let skipped = 0;

console.log(`${dryRun ? '[dry-run] ' : ''}scanning ${files.length} .ts file(s) under ${path.relative(process.cwd(), rootDir) || '.'}...`);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (!containsJsx(content)) {
    skipped++;
    continue;
  }

  const newPath = file.replace(/\.ts$/, '.tsx');
  const rel = path.relative(process.cwd(), file);
  const newRel = path.relative(process.cwd(), newPath);

  if (fs.existsSync(newPath)) {
    console.warn(`  [skip] ${rel} contains JSX but ${newRel} already exists`);
    continue;
  }

  if (dryRun) {
    console.log(`  [dry-run] would rename: ${rel} → ${newRel}`);
  } else {
    fs.renameSync(file, newPath);
    console.log(`  renamed: ${rel} → ${newRel}`);
  }
  renamedCount++;
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${renamedCount} file(s) ${dryRun ? 'need' : 'were'} renamed, ${skipped} correct as .ts.`);
if (dryRun && renamedCount > 0) {
  console.log(`\nRe-run with --write to apply the renames.`);
}
