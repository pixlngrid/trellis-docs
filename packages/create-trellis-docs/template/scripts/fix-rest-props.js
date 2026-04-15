#!/usr/bin/env node
/**
 * Fix invalid rest-syntax in generated TypeScript interfaces.
 *
 * Earlier versions of migrate-docusaurus.js pushed rest params (`...rest`)
 * from the source's destructuring pattern directly into the generated
 * `interface FooProps { ... }` body, producing invalid TypeScript:
 *
 *   interface TypographyProps {
 *     children: React.ReactNode;
 *     ...props: Record<string, any>;   ← invalid syntax
 *   }
 *
 * TypeScript interfaces don't allow rest syntax. The equivalent is an
 * index signature. This script finds every line of the form
 *   ...ident: Type;
 * inside interface bodies and replaces it with
 *   [key: string]: any;
 *
 * Usage:
 *   node scripts/fix-rest-props.js [root-dir] [--write] [--dry-run]
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
    else if (/\.tsx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

// Matches lines like:   ...props: Record<string, any>;
//                       ...rest: any;
// Captures the indent so we preserve formatting.
const REST_PROP_LINE = /^([ \t]*)\.\.\.(\w+)\s*:\s*[^;\n]+;?\s*$/gm;

function fix(content) {
  let count = 0;
  const updated = content.replace(REST_PROP_LINE, (_, indent) => {
    count++;
    return `${indent}[key: string]: any;`;
  });
  return { count, content: updated };
}

const files = walk(rootDir);
let fixedFiles = 0;
let skipped = 0;
let totalLines = 0;

console.log(`${dryRun ? '[dry-run] ' : ''}scanning ${files.length} file(s) under ${path.relative(process.cwd(), rootDir) || '.'}...`);

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const { count, content } = fix(original);

  if (count === 0) {
    skipped++;
    continue;
  }

  const rel = path.relative(process.cwd(), file);
  if (dryRun) {
    console.log(`  [dry-run] would fix ${count} line(s) in ${rel}`);
  } else {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  fixed ${count} line(s) in ${rel}`);
  }
  fixedFiles++;
  totalLines += count;
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${fixedFiles} file(s) ${dryRun ? 'need' : 'were'} fixed (${totalLines} line(s) total), ${skipped} correct.`);
if (dryRun && fixedFiles > 0) {
  console.log(`\nRe-run with --write to apply the fixes.`);
}
