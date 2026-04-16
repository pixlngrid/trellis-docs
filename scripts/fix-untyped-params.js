#!/usr/bin/env node
/**
 * Add `: any` annotations to untyped arrow-function parameters.
 *
 * Docusaurus components are commonly JavaScript, where untyped callbacks
 * are fine. After migration they land in Trellis's strict TypeScript setup
 * and any implicit `any` fails the build:
 *
 *   Type error: Parameter 'text' implicitly has an 'any' type.
 *   > const handleCopy = useCallback((text, label) => {
 *
 * The migration's built-in auto-typer only covers component-level props
 * and well-known event handlers. This script handles the long tail —
 * every `(params) => ...` arrow function whose params lack type
 * annotations gets `: any` added to each parameter. Works for useCallback,
 * useMemo, array methods (.map, .filter, .reduce), event handler bodies,
 * and helper closures.
 *
 * Deliberately narrow: `: any` is the safest unblocking annotation.
 * Once the code compiles, tighten types manually where it matters.
 *
 * Usage:
 *   node scripts/fix-untyped-params.js [root-dir] [--write] [--dry-run]
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

// Split a parameter list on commas, respecting nested brackets/parens/braces.
function splitParams(str) {
  const out = [];
  let current = '';
  let depth = 0;
  for (const ch of str) {
    if (ch === '(' || ch === '[' || ch === '{' || ch === '<') depth++;
    else if (ch === ')' || ch === ']' || ch === '}' || ch === '>') depth--;
    if (ch === ',' && depth === 0) { out.push(current); current = ''; }
    else current += ch;
  }
  if (current.length > 0) out.push(current);
  return out;
}

// Type a single parameter. Returns the parameter as it should appear in
// the output — unchanged if it's already typed, annotated with `: any`
// otherwise. Handles defaults (`x = 0`) and rest (`...rest`).
function typeParam(param) {
  const trimmed = param.trim();
  if (!trimmed) return param;

  // Already has a type annotation — leave alone.
  if (/:\s*[^,=]/.test(trimmed)) return param;

  const leading = param.match(/^\s*/)[0];
  const trailing = param.match(/\s*$/)[0];
  const body = param.slice(leading.length, param.length - trailing.length);

  // Rest param: `...name` → `...name: any[]`
  if (body.startsWith('...')) {
    return `${leading}${body}: any[]${trailing}`;
  }

  // Default value: `name = expr` → `name: any = expr`
  // Split on the FIRST = at depth 0 (respecting brackets).
  let depth = 0;
  let eqIdx = -1;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '(' || ch === '[' || ch === '{' || ch === '<') depth++;
    else if (ch === ')' || ch === ']' || ch === '}' || ch === '>') depth--;
    else if (ch === '=' && depth === 0 && body[i + 1] !== '=' && body[i - 1] !== '=') {
      eqIdx = i;
      break;
    }
  }
  if (eqIdx !== -1) {
    const name = body.slice(0, eqIdx).trimEnd();
    const rest = body.slice(eqIdx);
    return `${leading}${name}: any ${rest.trimStart()}${trailing}`;
  }

  return `${leading}${body}: any${trailing}`;
}

// Match arrow functions of the form `(params) =>` where params contain no
// nested parens. Covers the vast majority of real-world callbacks — nested
// function calls inside params (rare) would need a full parser.
const ARROW_RE = /\(([^()]*)\)\s*=>/g;

function fix(content) {
  let count = 0;
  const updated = content.replace(ARROW_RE, (match, params) => {
    if (!params.trim()) return match; // zero-param arrow, nothing to do

    const parts = splitParams(params);
    const anyUntyped = parts.some((p) => {
      const t = p.trim();
      return t.length > 0 && !/:\s*[^,=]/.test(t);
    });
    if (!anyUntyped) return match;

    const rebuilt = parts.map(typeParam).join(',');
    if (rebuilt === params) return match;
    count++;
    return `(${rebuilt}) =>`;
  });
  return { content: updated, count };
}

const files = walk(rootDir);
let fixedFiles = 0;
let totalRewrites = 0;

console.log(`${dryRun ? '[dry-run] ' : ''}scanning ${files.length} .ts/.tsx file(s) under ${path.relative(process.cwd(), rootDir) || '.'}...`);

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const { content, count } = fix(original);
  if (count === 0) continue;

  const rel = path.relative(process.cwd(), file);
  if (dryRun) console.log(`  [dry-run] would type ${count} arrow(s) in ${rel}`);
  else { fs.writeFileSync(file, content, 'utf8'); console.log(`  typed ${count} arrow(s) in ${rel}`); }
  fixedFiles++;
  totalRewrites += count;
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${fixedFiles} file(s) ${dryRun ? 'need' : 'were'} updated (${totalRewrites} arrow(s) total).`);
if (dryRun && fixedFiles > 0) console.log('\nRe-run with --write to apply.');
