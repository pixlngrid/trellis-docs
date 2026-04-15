#!/usr/bin/env node
/**
 * Fix `'use client';` directives in migrated components.
 *
 * Handles two failure modes:
 *
 *   (a) MISPLACED — earlier migrations inserted the directive AFTER the
 *       React import. Next.js rejects that with "The 'use client' directive
 *       must be placed before other expressions." The directive is moved
 *       to the correct position.
 *
 *   (b) MISSING — TypeScript component sources skipped the migration's
 *       JS-only auto-typer, so the directive was never added at all. Files
 *       that use hooks (useState, useEffect, useRef, etc.) or browser APIs
 *       get the directive inserted at the top, after any leading JSDoc.
 *
 * In both cases, the directive ends up at the first non-comment position,
 * before any imports — the only placement Next.js accepts.
 *
 * Usage:
 *   node scripts/fix-use-client.js [root-dir] [--write] [--dry-run]
 *
 * Defaults to scanning components/custom/migrated/ relative to the cwd.
 * Runs in dry-run mode unless --write is passed.
 *
 * Examples:
 *   node scripts/fix-use-client.js                          # dry-run scan
 *   node scripts/fix-use-client.js --write                  # fix in place
 *   node scripts/fix-use-client.js components/custom --write
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
    else if (/\.tsx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

// Match a standalone `'use client';` or `"use client";` line (optional semicolon).
const USE_CLIENT_LINE = /^[ \t]*['"]use client['"];?[ \t]*\r?\n?/m;

// Features that require the file to be a Client Component in Next.js App Router.
// Detects:
//   - Any `useXxx(` call — covers React built-ins (useState, useEffect),
//     library hooks (useMediaQuery from MUI, useForm from react-hook-form),
//     and project-local custom hooks
//   - Direct browser API access: window., document., navigator.,
//     localStorage., sessionStorage.
const CLIENT_FEATURE_RE = /\buse[A-Z]\w*\s*\(|\b(?:window|document|navigator|localStorage|sessionStorage)\./;

function fix(content) {
  const leadingComment = content.match(/^(\s*(?:\/\*[\s\S]*?\*\/\s*)*)/);
  const correctIdx = leadingComment ? leadingComment[0].length : 0;

  const existing = content.match(USE_CLIENT_LINE);

  if (existing) {
    // Case A: directive is present — check if it's at the correct position.
    const directiveIdx = existing.index;
    const between = content.slice(correctIdx, directiveIdx);
    if (/^\s*$/.test(between)) {
      // Already correctly placed.
      return { changed: false, reason: null, content };
    }
    // Misplaced: remove, then re-insert at the correct spot.
    const without = content.slice(0, directiveIdx) + content.slice(directiveIdx + existing[0].length);
    const fixed = without.slice(0, correctIdx) + "'use client';\n\n" + without.slice(correctIdx);
    return { changed: true, reason: 'moved', content: fixed };
  }

  // Case B: directive is missing. Only add it if the file actually uses
  // client-only features — otherwise the file can legitimately be a Server
  // Component and we shouldn't touch it.
  if (!CLIENT_FEATURE_RE.test(content)) {
    return { changed: false, reason: null, content };
  }
  const fixed = content.slice(0, correctIdx) + "'use client';\n\n" + content.slice(correctIdx);
  return { changed: true, reason: 'added', content: fixed };
}

const files = walk(rootDir);
let fixedCount = 0;
let skipped = 0;

console.log(`${dryRun ? '[dry-run] ' : ''}scanning ${files.length} file(s) under ${path.relative(process.cwd(), rootDir) || '.'}...`);

let addedCount = 0;
let movedCount = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const { changed, reason, content } = fix(original);

  if (!changed) {
    skipped++;
    continue;
  }

  const rel = path.relative(process.cwd(), file);
  const action = reason === 'added' ? 'add directive' : 'move directive';
  if (dryRun) {
    console.log(`  [dry-run] would ${action}: ${rel}`);
  } else {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  ${reason === 'added' ? 'added' : 'moved'} directive in: ${rel}`);
  }
  if (reason === 'added') addedCount++;
  else movedCount++;
  fixedCount++;
}

const parts = [];
if (addedCount > 0) parts.push(`${addedCount} added`);
if (movedCount > 0) parts.push(`${movedCount} moved`);
const breakdown = parts.length > 0 ? ` (${parts.join(', ')})` : '';
console.log(`\n${dryRun ? '[dry-run] ' : ''}${fixedCount} file(s) ${dryRun ? 'need' : 'were'} fixed${breakdown}, ${skipped} already correct.`);
if (dryRun && fixedCount > 0) {
  console.log(`\nRe-run with --write to apply the fixes.`);
}
