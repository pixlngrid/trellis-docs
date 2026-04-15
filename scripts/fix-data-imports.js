#!/usr/bin/env node
/**
 * Restore imports of `@site/src/data/*` that the migration script commented
 * out, and copy the referenced data files from the Docusaurus project into
 * Trellis `data/migrated/`.
 *
 * Docusaurus components commonly import local JSON/data files:
 *
 *   import infrastructureData from '@site/src/data/infrastructureData.json';
 *
 * The migration script left these as:
 *
 *   // [migration] TODO: rewrite this import for Trellis
 *   // import infrastructureData from '@site/src/data/infrastructureData.json';
 *
 * which means any component using the data throws:
 *
 *   ReferenceError: infrastructureData is not defined
 *
 * This script:
 *   1. Scans migrated components for commented-out `@site/src/data/*` imports
 *      (and any live `@site/src/data/*` specifiers that slipped through)
 *   2. Copies each referenced file from <docusaurus>/src/data/ into
 *      <trellis>/data/migrated/
 *   3. Rewrites each import line to point at `@/data/migrated/<filename>`,
 *      restoring a working import
 *
 * Usage:
 *   node scripts/fix-data-imports.js <docusaurus-project-path> [root-dir] [--write] [--dry-run]
 *
 * The Docusaurus path is required so we can find and copy the data files.
 * `root-dir` defaults to components/custom/migrated/.
 * Runs in dry-run mode unless --write is passed.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const write = args.includes('--write');
const dryRun = args.includes('--dry-run') || !write;
const positional = args.filter((a) => !a.startsWith('--'));

if (positional.length < 1) {
  console.error('Usage: node scripts/fix-data-imports.js <docusaurus-project-path> [root-dir] [--write]');
  process.exit(1);
}

const docusaurusPath = path.resolve(positional[0]);
const rootDir = path.resolve(positional[1] || 'components/custom/migrated');
const projectRoot = process.cwd();
const docusaurusDataDir = path.join(docusaurusPath, 'src', 'data');
const trellisDataDir = path.join(projectRoot, 'data', 'migrated');

if (!fs.existsSync(docusaurusPath)) {
  console.error(`Docusaurus project not found: ${docusaurusPath}`);
  process.exit(1);
}
if (!fs.existsSync(rootDir)) {
  console.error(`Migrated components directory not found: ${rootDir}`);
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

// Match both the migration's commented-out form and any live imports that
// still reference the Docusaurus data alias.
//   Commented:  // [migration] TODO: rewrite this import for Trellis
//               // import Foo from '@site/src/data/foo.json';
//   Live:       import Foo from '@site/src/data/foo.json';
const COMMENTED_BLOCK_RE = /^[ \t]*\/\/\s*\[migration\]\s*TODO:[^\n]*\n[ \t]*\/\/\s*(import\s+[^'"\n]+\s+from\s+['"]@site\/src\/data\/[^'"]+['"];?)\s*$/gm;
const LIVE_IMPORT_RE = /^[ \t]*import\s+[^'"\n]+\s+from\s+['"](@site\/src\/data\/[^'"]+)['"];?\s*$/gm;
const DATA_PATH_RE = /@site\/src\/data\/([^'"]+)/;

function rewriteImportLine(importStmt) {
  return importStmt.replace(
    /@site\/src\/data\/([^'"]+)/,
    (_, p) => `@/data/migrated/${p}`
  );
}

const files = walk(rootDir);
const referencedDataFiles = new Set();
const rewritesPerFile = new Map(); // absPath → updated content
const warnings = [];

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  let updated = original;
  let touched = false;

  // Commented-out form — uncomment and rewrite.
  updated = updated.replace(COMMENTED_BLOCK_RE, (_, importStmt) => {
    const m = importStmt.match(DATA_PATH_RE);
    if (!m) return importStmt;
    referencedDataFiles.add(m[1]);
    touched = true;
    return rewriteImportLine(importStmt);
  });

  // Live @site/src/data/ imports — rewrite path in place.
  updated = updated.replace(LIVE_IMPORT_RE, (line) => {
    const m = line.match(DATA_PATH_RE);
    if (!m) return line;
    referencedDataFiles.add(m[1]);
    touched = true;
    return rewriteImportLine(line);
  });

  if (touched) rewritesPerFile.set(file, updated);
}

console.log(`${dryRun ? '[dry-run] ' : ''}scanned ${files.length} component file(s)`);
console.log(`  Found ${rewritesPerFile.size} file(s) with data-import references`);
console.log(`  Found ${referencedDataFiles.size} distinct data file(s) to copy:`);
for (const f of [...referencedDataFiles].sort()) console.log(`    ${f}`);

// Copy data files from Docusaurus project.
let copied = 0;
let missing = 0;
for (const relPath of referencedDataFiles) {
  const src = path.join(docusaurusDataDir, relPath);
  const dest = path.join(trellisDataDir, relPath);

  if (!fs.existsSync(src)) {
    warnings.push(`Data file not found in Docusaurus source: src/data/${relPath}`);
    missing++;
    continue;
  }

  if (dryRun) {
    console.log(`  [dry-run] would copy: src/data/${relPath} → data/migrated/${relPath}`);
    copied++;
    continue;
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`  copied: data/migrated/${relPath}`);
  copied++;
}

// Apply import rewrites to component files.
for (const [file, updated] of rewritesPerFile) {
  const rel = path.relative(projectRoot, file);
  if (dryRun) {
    console.log(`  [dry-run] would rewrite imports in ${rel}`);
  } else {
    fs.writeFileSync(file, updated, 'utf8');
    console.log(`  rewrote imports in ${rel}`);
  }
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${copied} file(s) ${dryRun ? 'would be' : 'were'} copied, ${rewritesPerFile.size} component(s) ${dryRun ? 'need' : 'were'} updated.`);

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const w of warnings) console.log(`  ${w}`);
}

if (dryRun && (rewritesPerFile.size > 0 || copied > 0)) {
  console.log('\nRe-run with --write to apply.');
}
