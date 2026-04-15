#!/usr/bin/env node
/**
 * Fix broken Docusaurus CSS `@import` statements in migrated components.
 *
 * Docusaurus projects commonly import shared token/variable files from each
 * CSS module (e.g. `@import '../../css/tokens.css';`). Those paths no longer
 * resolve after migration to Trellis — Trellis loads design tokens globally
 * via `app/tokens.css` (imported from `app/globals.css`), so per-component
 * imports are unnecessary and break the build:
 *
 *   Syntax error: tailwindcss: ...module.css Can't resolve '../../css/tokens.css'
 *
 * This script finds every `.css` / `.module.css` file under the target
 * directory and comments out `@import` statements that reference Docusaurus
 * token/variable files. The original line is preserved as a comment with a
 * TODO marker so you can port any `var(--...)` references manually if needed.
 *
 * Usage:
 *   node scripts/fix-css-imports.js [root-dir] [--write] [--dry-run]
 *
 * Defaults to scanning components/custom/migrated/ relative to the cwd.
 * Runs in dry-run mode unless --write is passed.
 *
 * Examples:
 *   node scripts/fix-css-imports.js                          # dry-run scan
 *   node scripts/fix-css-imports.js --write                  # fix in place
 *   node scripts/fix-css-imports.js components/custom --write
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
    else if (/\.css$/.test(entry.name)) files.push(full);
  }
  return files;
}

// Docusaurus paths we know don't resolve after migration:
//   ../../css/tokens.css, ../css/tokens.css, @site/src/css/*, ~/css/*
// We conservatively target files named tokens.css, custom.css, or variables.css,
// since those are the canonical Docusaurus shared stylesheets.
const DOCUSAURUS_TOKEN_IMPORT = /^(\s*)@import\s+(?:url\(\s*)?['"]([^'"]*(?:tokens|custom|variables)\.css)['"]\s*\)?\s*;?\s*$/gm;
const SITE_ALIAS_IMPORT = /^(\s*)@import\s+(?:url\(\s*)?['"](@site\/[^'"]+|~[^'"]*)['"]\s*\)?\s*;?\s*$/gm;

function fix(content, filePath) {
  let changed = false;
  const rels = [];

  const replace = (re) => {
    content = content.replace(re, (line, indent, importPath) => {
      changed = true;
      rels.push(importPath);
      return `${indent}/* [migration] Removed Docusaurus import — tokens are loaded globally in Trellis via app/tokens.css. */\n${indent}/* ${line.trim()} */`;
    });
  };

  replace(DOCUSAURUS_TOKEN_IMPORT);
  replace(SITE_ALIAS_IMPORT);

  return { changed, content, removedImports: rels };
}

const files = walk(rootDir);
let fixedCount = 0;
let skipped = 0;
const perFile = [];

console.log(`${dryRun ? '[dry-run] ' : ''}scanning ${files.length} CSS file(s) under ${path.relative(process.cwd(), rootDir) || '.'}...`);

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const { changed, content, removedImports } = fix(original, file);

  if (!changed) {
    skipped++;
    continue;
  }

  const rel = path.relative(process.cwd(), file);
  perFile.push({ rel, removedImports });

  if (dryRun) {
    console.log(`  [dry-run] would fix: ${rel}`);
    for (const imp of removedImports) console.log(`              removes: @import '${imp}'`);
  } else {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  fixed: ${rel}`);
    for (const imp of removedImports) console.log(`         removed: @import '${imp}'`);
  }
  fixedCount++;
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${fixedCount} file(s) ${dryRun ? 'need' : 'were'} fixed, ${skipped} already correct.`);

if (fixedCount > 0) {
  console.log('\nNote: If the migrated CSS referenced Docusaurus variables like var(--ifm-color-primary),');
  console.log('you will need to rename those to Trellis token names. See app/tokens.css for available tokens.');
}

if (dryRun && fixedCount > 0) {
  console.log(`\nRe-run with --write to apply the fixes.`);
}
