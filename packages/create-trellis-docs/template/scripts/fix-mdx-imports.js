#!/usr/bin/env node
/**
 * Fix import form in components/docs/mdx/index.tsx for migrated components.
 *
 * Earlier versions of migrate-docusaurus.js always emitted
 *
 *   import { ComponentName } from '@/components/custom/migrated/name'
 *
 * regardless of how the target file actually exports its component. For
 * components that use `export default` (common in Docusaurus, rare in
 * Trellis/shadcn), this produces:
 *
 *   Export AlchemysFoundation doesn't exist in target module
 *   Did you mean to import default?
 *
 * This script reads each import line in the MDX index, resolves the target
 * file, detects whether it exports the component as a named or default
 * export, and rewrites the import accordingly.
 *
 * Usage:
 *   node scripts/fix-mdx-imports.js [mdx-index-path] [--write] [--dry-run]
 *
 * Defaults to components/docs/mdx/index.tsx relative to the cwd.
 * Runs in dry-run mode unless --write is passed.
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const write = args.includes('--write');
const dryRun = args.includes('--dry-run') || !write;
const positional = args.filter((a) => !a.startsWith('--'));
const mdxIndexPath = path.resolve(positional[0] || 'components/docs/mdx/index.tsx');
const projectRoot = process.cwd();

if (!fs.existsSync(mdxIndexPath)) {
  console.error(`File not found: ${mdxIndexPath}`);
  process.exit(1);
}

// Resolve an `@/...` alias to an absolute file path. Tries .tsx, .ts,
// /index.tsx, /index.ts in order.
function resolveAliasImport(aliasPath) {
  if (!aliasPath.startsWith('@/')) return null;
  const base = path.join(projectRoot, aliasPath.slice(2));
  const candidates = [
    base + '.tsx', base + '.ts',
    path.join(base, 'index.tsx'), path.join(base, 'index.ts'),
    base + '.jsx', base + '.js',
  ];
  return candidates.find((c) => fs.existsSync(c)) || null;
}

// Determine what `name` is in the target module: 'named', 'default', 'both',
// or 'missing'. We look for each form individually so we can pick the safest
// rewrite when both exist.
function classifyExport(content, name) {
  // Strip comments so regex doesn't trip on `// export default ...` etc.
  const stripped = content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');

  const nameRe = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const hasNamed =
    new RegExp(`^\\s*export\\s+(?:async\\s+)?(?:function|const|let|var|class|interface|type|enum)\\s+${nameRe}\\b`, 'm').test(stripped) ||
    new RegExp(`^\\s*export\\s*\\{[^}]*\\b${nameRe}\\b[^}]*\\}`, 'm').test(stripped) ||
    new RegExp(`^\\s*export\\s*\\{[^}]*\\bas\\s+${nameRe}\\b[^}]*\\}`, 'm').test(stripped);

  // Default export detection — several syntactic forms.
  const hasDefault =
    /^\s*export\s+default\s+/m.test(stripped) ||
    /^\s*export\s*\{[^}]*\bdefault\b[^}]*\}/m.test(stripped);

  if (hasNamed && hasDefault) return 'both';
  if (hasNamed) return 'named';
  if (hasDefault) return 'default';
  return 'missing';
}

const original = fs.readFileSync(mdxIndexPath, 'utf8');

// Match `import { Name } from '@/...'` lines (single named import only —
// more complex forms like `import { A, B }` from one module are rare in the
// generated MDX index and we leave them alone to be safe).
const IMPORT_RE = /^(\s*)import\s+\{\s*([A-Za-z_$][\w$]*)\s*\}\s+from\s+(['"])(@\/components\/custom\/migrated\/[^'"]+)\3(\s*;?\s*)$/gm;

const rewrites = [];
const warnings = [];

const updated = original.replace(IMPORT_RE, (line, indent, name, quote, importPath, trailing) => {
  const target = resolveAliasImport(importPath);
  if (!target) {
    warnings.push(`${name}: could not resolve ${importPath} to a file`);
    return line;
  }

  let content;
  try { content = fs.readFileSync(target, 'utf8'); } catch {
    warnings.push(`${name}: could not read ${path.relative(projectRoot, target)}`);
    return line;
  }

  const kind = classifyExport(content, name);

  if (kind === 'named' || kind === 'both') {
    // Named export exists — line is correct as-is.
    return line;
  }

  if (kind === 'default') {
    const rewritten = `${indent}import ${name} from ${quote}${importPath}${quote}${trailing}`;
    rewrites.push({ name, target: path.relative(projectRoot, target), from: 'named', to: 'default' });
    return rewritten;
  }

  warnings.push(`${name}: no matching export found in ${path.relative(projectRoot, target)}`);
  return line;
});

if (rewrites.length === 0 && warnings.length === 0) {
  console.log(`${dryRun ? '[dry-run] ' : ''}no import fixes needed in ${path.relative(projectRoot, mdxIndexPath)}`);
} else {
  console.log(`${dryRun ? '[dry-run] ' : ''}${path.relative(projectRoot, mdxIndexPath)}:`);
  for (const r of rewrites) {
    console.log(`  ${dryRun ? 'would rewrite' : 'rewrote'}: import { ${r.name} } → import ${r.name}  (${r.target})`);
  }
  for (const w of warnings) {
    console.log(`  [warn] ${w}`);
  }
}

if (!dryRun && rewrites.length > 0) {
  fs.writeFileSync(mdxIndexPath, updated, 'utf8');
  console.log(`\n${rewrites.length} import(s) rewritten.`);
} else if (dryRun && rewrites.length > 0) {
  console.log(`\nRe-run with --write to apply ${rewrites.length} change(s).`);
}
