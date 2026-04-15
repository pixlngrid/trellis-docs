#!/usr/bin/env node
/**
 * Wrap bare-element selectors in CSS modules with `:global(...)` so they
 * pass Next.js's strict CSS module rules.
 *
 * Next.js rejects:
 *
 *     Transforming CSS failed
 *     Selector "h3" is not pure. Pure selectors must contain at least one
 *     local class or id.
 *
 * because CSS modules require every top-level selector to include `.class`
 * or `#id` — otherwise the style would leak globally without the mangling
 * that makes CSS modules safe.
 *
 * Docusaurus's CSS module loader was more permissive, so migrated `.module.css`
 * files commonly contain rules like `h3 { margin: 0; }` at the top level.
 * This script rewrites each such selector to `:global(h3)`, which preserves
 * the existing (globally-leaking) behavior and unblocks the build.
 *
 * :global() is a mechanical fix, not a good long-term answer. For each file
 * the script touches, consider refactoring to scope the styles under a
 * containing class:
 *
 *     :global(h3) { ... }           → .root h3 { ... }        (then use .root on the wrapping element)
 *
 * Skipped:
 *   - Selectors that already contain `.`, `#`, `:global`, or `&`
 *   - Inner rules of `@keyframes` blocks (those selectors are percentages)
 *   - `@import`, `@charset`, and other at-statements
 *
 * Usage:
 *   node scripts/fix-css-modules.js [root-dir] [--write] [--dry-run]
 *
 * Defaults to scanning components/custom/migrated/ relative to the cwd.
 * Only `.module.css` files are processed — plain `.css` files are skipped
 * because they don't go through the CSS module loader.
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
    else if (/\.module\.css$/.test(entry.name)) files.push(full);
  }
  return files;
}

// Split a comma-separated selector list, respecting nested parentheses
// (attribute selectors, :not(), :is(), etc.).
function splitSelectorList(str) {
  const out = [];
  let current = '';
  let parens = 0;
  for (const ch of str) {
    if (ch === '(') parens++;
    else if (ch === ')') parens--;
    if (ch === ',' && parens === 0) {
      out.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.length > 0) out.push(current);
  return out;
}

// Return true if the selector already contains a class, id, or :global wrapper
// — meaning CSS modules will accept it as-is.
function isPureForCssModules(selector) {
  const trimmed = selector.trim();
  if (!trimmed) return true;
  if (/[.#]/.test(trimmed)) return true;
  if (/:global\s*\(/.test(trimmed)) return true;
  if (trimmed.startsWith('&')) return true; // nesting reference
  return false;
}

function wrapSelectorList(selectorStr) {
  const parts = splitSelectorList(selectorStr);
  let wrappedAny = false;
  const out = parts.map((part) => {
    if (isPureForCssModules(part)) return part;
    // Extract leading trivia (whitespace + block comments) and trailing
    // whitespace so comments land OUTSIDE :global(...) rather than inside
    // it. Keeps output readable and avoids parser surprises.
    const leadingMatch = part.match(/^(?:\s|\/\*[\s\S]*?\*\/)*/);
    const leading = leadingMatch ? leadingMatch[0] : '';
    const trailingMatch = part.match(/\s*$/);
    const trailing = trailingMatch ? trailingMatch[0] : '';
    const inner = part.slice(leading.length, part.length - trailing.length);
    if (!inner) return part; // nothing but trivia — don't wrap
    wrappedAny = true;
    return `${leading}:global(${inner})${trailing}`;
  });
  return { text: out.join(','), wrapped: wrappedAny };
}

// Transform a CSS file: wrap any top-level bare-element selector in :global().
// Tracks @keyframes (whose inner "selectors" are percentages) and nested at-rules
// so we don't mangle unrelated content.
function fix(css) {
  let out = '';
  let i = 0;
  let depth = 0;
  let inKeyframes = false;
  let keyframesEnterDepth = -1;
  let wrappedCount = 0;

  while (i < css.length) {
    // Copy comments through
    if (css[i] === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) { out += css.slice(i); break; }
      out += css.slice(i, end + 2);
      i = end + 2;
      continue;
    }

    // Copy strings through (url("..."), content: "...", etc.)
    if (css[i] === '"' || css[i] === "'") {
      const q = css[i];
      let j = i + 1;
      while (j < css.length) {
        if (css[j] === '\\') { j += 2; continue; }
        if (css[j] === q) { j++; break; }
        j++;
      }
      out += css.slice(i, j);
      i = j;
      continue;
    }

    // Close brace
    if (css[i] === '}') {
      depth--;
      if (inKeyframes && depth === keyframesEnterDepth) {
        inKeyframes = false;
        keyframesEnterDepth = -1;
      }
      out += '}';
      i++;
      continue;
    }

    // Inside @keyframes body — percentages/from/to are not subject to the
    // "pure selector" rule. Copy characters through unchanged, but track
    // `{` so depth stays in sync and we exit keyframes only at its real
    // closing brace (the matching `}` handler above decrements depth).
    if (inKeyframes) {
      if (css[i] === '{') depth++;
      out += css[i];
      i++;
      continue;
    }

    // Look ahead to the next '{' or ';' at this nesting level, skipping
    // parenthesized content so attribute selectors and :not() are safe.
    let j = i;
    let parens = 0;
    while (j < css.length) {
      const c = css[j];
      if (c === '(') parens++;
      else if (c === ')') parens--;
      else if (c === '/' && css[j + 1] === '*') {
        const end = css.indexOf('*/', j + 2);
        j = end === -1 ? css.length : end + 2;
        continue;
      } else if ((c === '"' || c === "'") && parens === 0) {
        const q = c; j++;
        while (j < css.length) {
          if (css[j] === '\\') { j += 2; continue; }
          if (css[j] === q) { j++; break; }
          j++;
        }
        continue;
      } else if (parens === 0 && (c === '{' || c === '}' || c === ';')) {
        break;
      }
      j++;
    }

    if (j >= css.length) { out += css.slice(i); break; }

    const term = css[j];
    const segment = css.slice(i, j);

    if (term !== '{') {
      // Statement terminator (; for at-rules like @import) or stray closer.
      out += segment + term;
      i = j + 1;
      continue;
    }

    // Strip leading whitespace AND leading block comments so at-rule
    // detection works even when a comment precedes the rule (e.g.
    // `/* Mobile responsive */ @media (...)`). Only leading content matters
    // here — the emitted segment is always the original text.
    const stripLeading = (s) => s.replace(/^(?:\s|\/\*[\s\S]*?\*\/)*/, '');
    const firstNonTrivia = stripLeading(segment);

    if (/^@(-\w+-)?keyframes\b/.test(firstNonTrivia)) {
      out += segment + '{';
      depth++;
      inKeyframes = true;
      keyframesEnterDepth = depth - 1;
      i = j + 1;
      continue;
    }

    if (firstNonTrivia.startsWith('@')) {
      // @media, @supports, @layer, etc. — body is regular rules, pass through.
      out += segment + '{';
      depth++;
      i = j + 1;
      continue;
    }

    // Regular rule — wrap pure-element selectors.
    const { text, wrapped } = wrapSelectorList(segment);
    if (wrapped) wrappedCount++;
    out += text + '{';
    depth++;
    i = j + 1;
  }

  return { content: out, wrappedCount };
}

const files = walk(rootDir);
let fixedFiles = 0;
let skipped = 0;
let totalWraps = 0;

console.log(`${dryRun ? '[dry-run] ' : ''}scanning ${files.length} .module.css file(s) under ${path.relative(process.cwd(), rootDir) || '.'}...`);

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const { content, wrappedCount } = fix(original);

  if (wrappedCount === 0) {
    skipped++;
    continue;
  }

  const rel = path.relative(process.cwd(), file);
  if (dryRun) {
    console.log(`  [dry-run] would wrap ${wrappedCount} selector(s) in ${rel}`);
  } else {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`  wrapped ${wrappedCount} selector(s) in ${rel}`);
  }
  fixedFiles++;
  totalWraps += wrappedCount;
}

console.log(`\n${dryRun ? '[dry-run] ' : ''}${fixedFiles} file(s) ${dryRun ? 'need' : 'were'} fixed (${totalWraps} selector(s) wrapped), ${skipped} already correct.`);

if (fixedFiles > 0) {
  console.log(`\nNote: \`:global(h3)\` preserves the original behavior of leaking styles into the`);
  console.log(`global stylesheet. That matches Docusaurus, but it's not ideal under CSS modules.`);
  console.log(`For long-term correctness, refactor each wrapped rule to nest under a containing`);
  console.log(`class — e.g. \`.root h3 { ... }\` with \`<div className={styles.root}>\` as the wrapper.`);
}

if (dryRun && fixedFiles > 0) {
  console.log(`\nRe-run with --write to apply the fixes.`);
}
