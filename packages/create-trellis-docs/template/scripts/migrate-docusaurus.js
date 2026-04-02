// scripts/migrate-docusaurus.js
// Migrates content and sidebar from a Docusaurus project to Trellis.
//
// Usage:
//   node scripts/migrate-docusaurus.js <path-to-docusaurus-project> [--force] [--dry-run]

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const TARGET_DOCS = path.join(ROOT, 'content', 'docs');
const TARGET_SIDEBAR = path.join(ROOT, 'config', 'sidebar.ts');

// Docusaurus-only frontmatter fields that have no Trellis equivalent
const DOCUSAURUS_ONLY_FIELDS = [
  'sidebar_position',
  'sidebar_label',
  'id',
  'slug',
  'displayed_sidebar',
  'pagination_label',
  'pagination_next',
  'pagination_prev',
  'custom_edit_url',
  'parse_number_prefixes',
  'hide_title',
];

// ── Sidebar position map ─────────────────────────────────────────
// Built from source Docusaurus frontmatter before stripping.
// Keyed by cleaned doc ID (e.g., 'guides/writing-docs').
const sidebarPositions = new Map(); // id → { position?: number, label?: string }
// Category positions from _category_.json, keyed by cleaned relDir.
const categoryPositions = new Map(); // relDir → { position?: number, label?: string }

// ── Report accumulator ───────────────────────────────────────────
const report = {
  copied: [],
  skipped: [],
  assetsCopied: [],
  warnings: [],
  errors: [],
  frontmatterStripped: new Map(),
  commentsConverted: 0,
  renamed: [],
  prefixesStripped: [],
  sidebarGenerated: false,
  variableSuggestions: [],
  customComponentsUsed: new Map(), // componentName → [relPath, ...]
  staticAssetsCopied: 0,
  staticAssetsSkipped: 0,
};

// ── CLI ──────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = { force: false, dryRun: false };
  let docusaurusPath = null;

  for (const arg of args) {
    if (arg === '--force') flags.force = true;
    else if (arg === '--dry-run') flags.dryRun = true;
    else if (!arg.startsWith('--')) docusaurusPath = arg;
  }

  if (!docusaurusPath) {
    console.log('Usage: node scripts/migrate-docusaurus.js <path-to-docusaurus-project> [--force] [--dry-run]');
    console.log('');
    console.log('Options:');
    console.log('  --force     Overwrite existing files in content/docs/');
    console.log('  --dry-run   Preview changes without writing files');
    process.exit(1);
  }

  const resolved = path.resolve(docusaurusPath);
  if (!fs.existsSync(resolved)) {
    console.error(`Error: Path does not exist: ${resolved}`);
    process.exit(1);
  }

  return { docusaurusPath: resolved, ...flags };
}

// ── File discovery ───────────────────────────────────────────────
function findDocsDir(projectPath) {
  const docsDir = path.join(projectPath, 'docs');
  if (fs.existsSync(docsDir) && fs.statSync(docsDir).isDirectory()) return docsDir;
  // Some projects keep docs at root — check for .md/.mdx files
  const entries = fs.readdirSync(projectPath);
  const hasMd = entries.some((e) => /\.mdx?$/.test(e));
  return hasMd ? projectPath : null;
}

function discoverFiles(docsDir) {
  const mdFiles = [];
  const categoryFiles = [];
  const assetFiles = [];

  function walk(dir, rel) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = path.join(dir, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;

      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;

      if (entry.isDirectory()) {
        walk(absPath, relPath);
      } else if (entry.name === '_category_.json' || entry.name === '_category_.yml') {
        categoryFiles.push({ absPath, relDir: rel || '' });
      } else if (/\.mdx?$/.test(entry.name)) {
        mdFiles.push({ absPath, relPath });
      } else {
        // Non-markdown assets (images, PDFs, etc.)
        assetFiles.push({ absPath, relPath });
      }
    }
  }

  walk(docsDir, '');
  return { mdFiles, categoryFiles, assetFiles };
}

// ── Path transforms ──────────────────────────────────────────────
function stripPrefixesFromPath(relPath) {
  return relPath
    .split('/')
    .map((segment) => {
      const ext = path.extname(segment);
      const base = path.basename(segment, ext);
      const stripped = base.replace(/^\d+-/, '');
      return stripped + ext;
    })
    .join('/');
}

function ensureMdxExtension(filename) {
  if (filename.endsWith('.md') && !filename.endsWith('.mdx')) {
    return filename.replace(/\.md$/, '.mdx');
  }
  return filename;
}

function normaliseReadme(relPath) {
  // README.md → index.mdx in each directory
  return relPath.replace(/README\.mdx?$/i, 'index.mdx');
}

// ── Frontmatter transform ────────────────────────────────────────
function transformFrontmatter(data, relPath) {
  const cleaned = { ...data };
  const stripped = [];

  // Warn if slug is being removed (URL structure will change)
  if (cleaned.slug) {
    report.warnings.push(`${relPath}: Had custom slug "${cleaned.slug}" — URL will change after migration`);
  }

  for (const field of DOCUSAURUS_ONLY_FIELDS) {
    if (field in cleaned) {
      stripped.push(field);
      delete cleaned[field];
    }
  }

  // Map tags → keywords
  if (cleaned.tags) {
    const tagValues = (Array.isArray(cleaned.tags) ? cleaned.tags : [cleaned.tags]).map((t) =>
      typeof t === 'string' ? t : t.label || String(t),
    );
    if (cleaned.keywords) {
      cleaned.keywords = [...new Set([...cleaned.keywords, ...tagValues])];
    } else {
      cleaned.keywords = tagValues;
    }
    delete cleaned.tags;
  }

  return { cleaned, stripped };
}

// ── Content body transform ───────────────────────────────────────
function transformContent(content, relPath, customComponentNames) {
  const changes = [];

  // Split content into alternating [prose, codeBlock, prose, codeBlock, ...]
  // segments. We track fences line-by-line to correctly handle ```, ~~~,
  // 4+ backtick fences, indented fences, and fences inside code blocks.
  const lines = content.split('\n');
  const segments = []; // { type: 'prose'|'code', text: string }
  let fenceChar = null;
  let fenceLen = 0;
  let segStart = 0;

  for (let idx = 0; idx < lines.length; idx++) {
    const trimmed = lines[idx].trimStart();
    if (!fenceChar) {
      const m = trimmed.match(/^(`{3,}|~{3,})/);
      if (m) {
        if (idx > segStart) segments.push({ type: 'prose', text: lines.slice(segStart, idx).join('\n') });
        fenceChar = m[1][0];
        fenceLen = m[1].length;
        segStart = idx;
      }
    } else {
      const m = trimmed.match(/^(`{3,}|~{3,})\s*$/);
      if (m && m[1][0] === fenceChar && m[1].length >= fenceLen) {
        segments.push({ type: 'code', text: lines.slice(segStart, idx + 1).join('\n') });
        fenceChar = null;
        fenceLen = 0;
        segStart = idx + 1;
      }
    }
  }
  // Remaining content (prose, or an unclosed fence treated as prose)
  if (segStart < lines.length) {
    segments.push({ type: fenceChar ? 'code' : 'prose', text: lines.slice(segStart).join('\n') });
  }

  // Apply transforms only to prose segments
  for (const seg of segments) {
    if (seg.type !== 'prose') continue;
    let text = seg.text;

    // 1. Strip @theme imports
    const themeImportRe = /^import\s+.*?\s+from\s+['"]@theme\/[^'"]+['"];?\s*\n?/gm;
    const themeMatches = text.match(themeImportRe);
    if (themeMatches) {
      changes.push(`Stripped ${themeMatches.length} @theme import(s)`);
      text = text.replace(themeImportRe, '');
    }

    // 2. Strip @site imports
    const siteImportRe = /^import\s+.*?\s+from\s+['"]@site\/[^'"]+['"];?\s*\n?/gm;
    const siteMatches = text.match(siteImportRe);
    if (siteMatches) {
      changes.push(`Stripped ${siteMatches.length} @site import(s)`);
      report.warnings.push(`${relPath}: Stripped ${siteMatches.length} @site import(s) — verify no custom components are missing`);
      text = text.replace(siteImportRe, '');
    }

    // 2b. Strip @docusaurus imports
    const docusaurusImportRe = /^import\s+.*?\s+from\s+['"]@docusaurus\/[^'"]+['"];?\s*\n?/gm;
    const docusaurusMatches = text.match(docusaurusImportRe);
    if (docusaurusMatches) {
      changes.push(`Stripped ${docusaurusMatches.length} @docusaurus import(s)`);
      text = text.replace(docusaurusImportRe, '');
    }

    // 3. HTML comments → MDX comments (<!-- ... --> → {/* ... */})
    const htmlCommentRe = /<!--([\s\S]*?)-->/g;
    let commentCount = 0;
    text = text.replace(htmlCommentRe, (_, inner) => {
      commentCount++;
      return `{/*${inner}*/}`;
    });
    if (commentCount > 0) {
      changes.push(`Converted ${commentCount} HTML comment(s) to MDX`);
      report.commentsConverted += commentCount;
    }

    // 4. Transform require() image calls to static URL strings.
    //    MDX (next-mdx-remote) blocks all require() calls for security.
    //    Docusaurus: require('@site/static/img/foo.png').default
    //    Trellis:    '/img/foo.png'
    let requireCount = 0;
    // @site/static/PATH → '/PATH'
    text = text.replace(
      /require\(['"]@site\/static\/([^'"]+)['"]\)(?:\.default)?/g,
      (_, p) => { requireCount++; return `'/${p}'`; }
    );
    // Relative path containing /static/PATH → '/PATH'
    text = text.replace(
      /require\(['"][^'"]*\/static\/([^'"]+)['"]\)(?:\.default)?/g,
      (_, p) => { requireCount++; return `'/${p}'`; }
    );
    if (requireCount > 0) {
      changes.push(`Converted ${requireCount} require() path(s) to static URL(s)`);
    }
    // Warn about any require() calls that couldn't be auto-converted
    const remainingRequires = (text.match(/require\s*\(/g) || []).length;
    if (remainingRequires > 0) {
      report.warnings.push(
        `${relPath}: ${remainingRequires} require() call(s) could not be automatically converted — ` +
        `MDX does not allow require(). Rewrite as static image paths or Next.js <Image> imports.`
      );
    }

    seg.text = text;
  }

  let result = segments.map((s) => s.text).join('\n');

  // 4. Clean up excessive blank lines from import removal
  result = result.replace(/\n{3,}/g, '\n\n');

  // 5. Warn about <CodeBlock> JSX usage
  if (result.includes('<CodeBlock')) {
    report.warnings.push(`${relPath}: Contains <CodeBlock> component — convert to fenced code blocks manually`);
  }

  // 6. Convert relative MDX imports to @include directives.
  //    Docusaurus: import Foo from './_foo.mdx'; ... <Foo />
  //    Trellis:    @include ./_foo.mdx
  const mdxImportRe = /^import\s+(\w+)\s+from\s+['"]([^'"]*\.mdx?)['"];?\s*$/gm;
  const mdxImports = new Map(); // componentName -> path
  let mdxMatch;
  while ((mdxMatch = mdxImportRe.exec(result)) !== null) {
    mdxImports.set(mdxMatch[1], mdxMatch[2]);
  }

  if (mdxImports.size > 0) {
    // Remove the import lines
    result = result.replace(mdxImportRe, '');

    // Replace <ComponentName /> (self-closing, with or without props) and
    // <ComponentName>...</ComponentName> (block form, single or multiline)
    // with @include directives.
    for (const [name, importPath] of mdxImports) {
      // Self-closing with optional props: <Foo /> or <Foo prop="x" />
      const selfClosingRe = new RegExp(`^[ \\t]*<${name}(?:\\s[^>]*)?\\s*/>[ \\t]*$`, 'gm');
      result = result.replace(selfClosingRe, `@include ${importPath}`);

      // Block form with optional props and any content (including multiline):
      // <Foo> ... </Foo>  or  <Foo prop="x">...</Foo>
      const blockRe = new RegExp(`^[ \\t]*<${name}(?:\\s[^>]*)?>[\\s\\S]*?</${name}>[ \\t]*$`, 'gm');
      result = result.replace(blockRe, `@include ${importPath}`);
    }

    // Warn if any component names from MDX imports still appear in the output
    // (means a usage pattern the regexes above didn't catch)
    for (const [name, importPath] of mdxImports) {
      if (new RegExp(`<${name}[\\s/>]`).test(result)) {
        report.warnings.push(
          `${relPath}: <${name}> usage could not be auto-converted to @include ${importPath} — convert manually`
        );
      }
    }

    changes.push(`Converted ${mdxImports.size} MDX import(s) to @include directive(s)`);
  }

  // 7. Warn about other remaining imports
  const remaining = (result.match(/^import\s+.+$/gm) || []).filter((line) => !(/\.mdx?['"]/.test(line)));
  if (remaining.length > 0) {
    report.warnings.push(`${relPath}: ${remaining.length} non-Docusaurus import(s) preserved — verify they work in Trellis`);
  }

  // 8. Detect custom component usage (PascalCase JSX tags that match components
  //    found in the Docusaurus project's src/components or src/theme directories).
  if (customComponentNames && customComponentNames.size > 0) {
    for (const [compName, meta] of customComponentNames) {
      if (new RegExp(`<${compName}[\\s/>]`).test(result)) {
        if (!report.customComponentsUsed.has(compName)) {
          report.customComponentsUsed.set(compName, { files: [], isJs: meta.isJs, srcPath: meta.srcPath });
        }
        report.customComponentsUsed.get(compName).files.push(relPath);
      }
    }
  }

  return { content: result, changes };
}

// ── Process a single markdown file ───────────────────────────────
function processFile(srcPath, relPath, force, dryRun, customComponentNames) {
  // Path transforms
  let cleanedPath = normaliseReadme(relPath);
  cleanedPath = stripPrefixesFromPath(cleanedPath);
  const mdxPath = ensureMdxExtension(cleanedPath);
  const targetPath = path.join(TARGET_DOCS, mdxPath);

  if (dryRun) {
    console.log(`  [dry-run] ${relPath} -> ${mdxPath}`);
    report.copied.push({ from: relPath, to: mdxPath, changes: ['(dry-run)'] });
    return;
  }

  if (!force && fs.existsSync(targetPath)) {
    report.skipped.push(mdxPath);
    return;
  }

  const raw = fs.readFileSync(srcPath, 'utf-8');
  const { data, content } = matter(raw);

  const { cleaned, stripped } = transformFrontmatter(data, mdxPath);
  for (const field of stripped) {
    report.frontmatterStripped.set(field, (report.frontmatterStripped.get(field) || 0) + 1);
  }

  const { content: transformedContent, changes } = transformContent(content, mdxPath, customComponentNames);

  const output = matter.stringify(transformedContent, cleaned);

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, output);

  report.copied.push({ from: relPath, to: mdxPath, changes });

  if (relPath !== mdxPath) {
    const origBase = relPath.replace(/\.mdx?$/, '');
    const newBase = mdxPath.replace(/\.mdx?$/, '');
    if (origBase !== newBase) {
      report.prefixesStripped.push({ from: relPath, to: mdxPath });
    }
    if (/\.md$/.test(relPath) && !/\.mdx$/.test(relPath)) {
      report.renamed.push({ from: relPath, to: mdxPath });
    }
  }
}

// ── Copy non-markdown assets ─────────────────────────────────────
function copyAsset(srcPath, relPath, force, dryRun) {
  const cleanedPath = stripPrefixesFromPath(relPath);
  const targetPath = path.join(TARGET_DOCS, cleanedPath);

  if (dryRun) {
    console.log(`  [dry-run] asset: ${relPath} -> ${cleanedPath}`);
    return;
  }

  if (!force && fs.existsSync(targetPath)) return;

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(srcPath, targetPath);
  report.assetsCopied.push(cleanedPath);
}

// ── Copy static assets (static/img/ → public/img/) ──────────────
// Docusaurus serves files from static/ at the site root. Trellis uses
// Next.js public/ for the same purpose. This function recursively copies
// the contents of static/ into public/, preserving directory structure.
function copyStaticAssets(projectPath, force, dryRun) {
  const staticDir = path.join(projectPath, 'static');
  const publicDir = path.join(ROOT, 'public');

  if (!fs.existsSync(staticDir)) return;

  const files = [];

  function walk(dir, rel) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const absPath = path.join(dir, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walk(absPath, relPath);
      } else {
        files.push({ absPath, relPath });
      }
    }
  }

  walk(staticDir, '');

  if (files.length === 0) return;

  console.log(`\n  Copying static assets (${files.length} file(s)) from static/ to public/...`);
  let copied = 0;
  let skipped = 0;

  for (const file of files) {
    const targetPath = path.join(publicDir, file.relPath);

    if (dryRun) {
      console.log(`  [dry-run] static: ${file.relPath} -> public/${file.relPath}`);
      copied++;
      continue;
    }

    if (!force && fs.existsSync(targetPath)) {
      skipped++;
      continue;
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(file.absPath, targetPath);
    copied++;
  }

  report.staticAssetsCopied = copied;
  report.staticAssetsSkipped = skipped;

  if (copied > 0) console.log(`  Copied ${copied} static asset(s) to public/`);
  if (skipped > 0) console.log(`  Skipped ${skipped} static asset(s) (already exist — use --force to overwrite)`);
}

// ── Sidebar: load Docusaurus config ──────────────────────────────
function loadDocusaurusSidebar(projectPath) {
  const candidates = ['sidebars.js', 'sidebars.cjs', 'sidebars.json'];

  for (const candidate of candidates) {
    const fullPath = path.join(projectPath, candidate);
    if (!fs.existsSync(fullPath)) continue;

    if (candidate.endsWith('.json')) {
      try {
        return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
      } catch (err) {
        report.warnings.push(`Could not parse ${candidate}: ${err.message}`);
        return null;
      }
    }

    try {
      // Clear require cache so we get a fresh load
      delete require.cache[require.resolve(fullPath)];
      return require(fullPath);
    } catch (err) {
      report.warnings.push(`Could not load ${candidate}: ${err.message}. Will generate sidebar from filesystem.`);
      return null;
    }
  }

  // Try TypeScript sidebar as plain-data fallback
  const tsPath = path.join(projectPath, 'sidebars.ts');
  if (fs.existsSync(tsPath)) {
    return parseTypeScriptSidebar(tsPath);
  }

  report.warnings.push('No sidebars file found. Will generate sidebar from filesystem.');
  return null;
}

function parseTypeScriptSidebar(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const cleaned = raw
    .replace(/import\s+.*?;\n/g, '')
    .replace(/export\s+default\s+/, 'module.exports = ')
    .replace(/:\s*SidebarsConfig/g, '')
    .replace(/\bsatisfies\b[^;]*/g, '')
    .replace(/\bas\s+const\b/g, '');

  try {
    const fn = new Function('module', 'exports', 'require', cleaned);
    const mod = { exports: {} };
    fn(mod, mod.exports, require);
    return mod.exports;
  } catch (err) {
    report.warnings.push(`Could not parse TypeScript sidebar: ${err.message}. Will generate from filesystem.`);
    return null;
  }
}

// ── Sidebar: convert items ───────────────────────────────────────
function convertSidebarItem(item, categoryMeta) {
  if (typeof item === 'string') {
    return { type: 'doc', id: stripPrefixesFromPath(item) };
  }

  if (!item || typeof item !== 'object') return null;

  if (item.type === 'doc' || (!item.type && item.id)) {
    const result = { type: 'doc', id: stripPrefixesFromPath(item.id) };
    if (item.label) result.label = item.label;
    return result;
  }

  if (item.type === 'category') {
    const children = (item.items || []).map((child) => convertSidebarItem(child, categoryMeta)).flat().filter(Boolean);

    const result = {
      type: 'category',
      label: item.label,
      collapsed: item.collapsed !== false,
      items: children,
    };

    if (item.link) {
      if (item.link.type === 'doc') {
        result.link = stripPrefixesFromPath(item.link.id);
      } else if (item.link.type === 'generated-index') {
        // Try to derive an index path from the category label
        const dirName = item.label.toLowerCase().replace(/\s+/g, '-');
        result.link = `${dirName}/index`;
      }
    }

    return result;
  }

  if (item.type === 'autogenerated') {
    const dirName = item.dirName || '.';
    const items = buildSidebarFromFilesystem(dirName);
    // Return items directly (they're already an array)
    return items;
  }

  if (item.type === 'link') {
    report.warnings.push(`External sidebar link skipped: ${item.label} -> ${item.href}`);
    return null;
  }

  return null;
}

// ── Sidebar position scanning ────────────────────────────────────
// Reads sidebar_position and sidebar_label from Docusaurus source
// files BEFORE migration strips them. Call once before Phase 1.
function scanSidebarPositions(docsDir) {
  function walk(dir, rel) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const absPath = path.join(dir, entry.name);
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        walk(absPath, relPath);
      } else if (/\.mdx?$/.test(entry.name)) {
        try {
          const raw = fs.readFileSync(absPath, 'utf-8');
          const { data } = matter(raw);
          if (data.sidebar_position != null || data.sidebar_label) {
            // Key by the cleaned ID (stripped prefixes, no extension)
            let cleanedPath = normaliseReadme(relPath);
            cleanedPath = stripPrefixesFromPath(cleanedPath);
            const id = ensureMdxExtension(cleanedPath).replace(/\.mdx?$/, '');
            const entry = {};
            if (data.sidebar_position != null) entry.position = Number(data.sidebar_position);
            if (data.sidebar_label) entry.label = data.sidebar_label;
            sidebarPositions.set(id, entry);
          }
        } catch { /* skip unreadable */ }
      }
    }
  }
  walk(docsDir, '');
}

function scanCategoryPositions(categoryFiles) {
  for (const catFile of categoryFiles) {
    if (!catFile.absPath.endsWith('.json')) continue;
    try {
      const data = JSON.parse(fs.readFileSync(catFile.absPath, 'utf-8'));
      const cleanedDir = stripPrefixesFromPath(catFile.relDir);
      const entry = {};
      if (data.position != null) entry.position = Number(data.position);
      if (data.label) entry.label = data.label;
      if (entry.position != null || entry.label) {
        categoryPositions.set(cleanedDir, entry);
      }
    } catch { /* skip */ }
  }
}

// ── Sidebar: autogenerate from filesystem ────────────────────────
function buildSidebarFromFilesystem(dirName) {
  const baseDir = dirName === '.' ? TARGET_DOCS : path.join(TARGET_DOCS, dirName);

  if (!fs.existsSync(baseDir)) return [];

  const items = [];
  const entries = fs.readdirSync(baseDir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;

    if (entry.isDirectory()) {
      const subDir = dirName === '.' ? entry.name : `${dirName}/${entry.name}`;
      const subItems = buildSidebarFromFilesystem(subDir);

      const indexPath = path.join(baseDir, entry.name, 'index.mdx');
      const hasIndex = fs.existsSync(indexPath);

      // Use _category_.json label, then sidebar_label from index, then titleCase
      const catMeta = categoryPositions.get(subDir);
      const indexMeta = sidebarPositions.get(`${subDir}/index`);
      const label = (catMeta && catMeta.label) || (indexMeta && indexMeta.label) || getCategoryLabel(path.join(baseDir, entry.name)) || titleCase(entry.name);

      // Position: _category_.json position takes precedence, then index sidebar_position
      const position = (catMeta && catMeta.position != null) ? catMeta.position
        : (indexMeta && indexMeta.position != null) ? indexMeta.position
        : Infinity;

      const category = {
        type: 'category',
        label,
        collapsed: true,
        _position: position,
        items: subItems.filter((si) => {
          // Don't list the index as a child item
          if (si.type === 'doc') {
            const parts = si.id.split('/');
            return parts[parts.length - 1] !== 'index';
          }
          return true;
        }),
      };

      if (hasIndex) {
        category.link = `${subDir}/index`;
      }

      items.push(category);
    } else if (/\.mdx?$/.test(entry.name) && !/^index\.mdx?$/.test(entry.name)) {
      const id = path
        .join(dirName === '.' ? '' : dirName, entry.name.replace(/\.mdx?$/, ''))
        .replace(/\\/g, '/');
      const meta = sidebarPositions.get(id);
      const item = { type: 'doc', id };
      if (meta && meta.label) item.label = meta.label;
      item._position = (meta && meta.position != null) ? meta.position : Infinity;
      items.push(item);
    }
  }

  // Sort by sidebar_position (items without a position go to the end, preserving alpha order)
  items.sort((a, b) => {
    const pa = a._position ?? Infinity;
    const pb = b._position ?? Infinity;
    if (pa !== pb) return pa - pb;
    // Tie-break: alphabetical by label or id
    const la = a.label || a.id || '';
    const lb = b.label || b.id || '';
    return la.localeCompare(lb);
  });

  // Clean up the temporary _position field before serialization
  for (const item of items) delete item._position;

  return items;
}

function getCategoryLabel(dirPath) {
  for (const name of ['_category_.json', '_category_.yml']) {
    const catFile = path.join(dirPath, name);
    if (fs.existsSync(catFile) && name.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(catFile, 'utf-8'));
        return data.label || null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function titleCase(str) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Sidebar: generate Trellis config file ────────────────────────
function generateSidebarFile(items) {
  const header = [
    "export type SidebarItem =",
    "  | { type: 'doc'; id: string; label?: string }",
    "  | { type: 'category'; label: string; link?: string; collapsed?: boolean; items: SidebarItem[] }",
    "  | { type: 'link'; label: string; href: string }",
    "  | { type: 'api'; id: string; label?: string }",
    "  | { type: 'html'; value: string }",
    "",
    "",
  ].join('\n');

  function escapeStr(s) {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  function serializeItem(item, indent) {
    const pad = ' '.repeat(indent);

    if (item.type === 'doc') {
      const parts = [`type: 'doc'`, `id: '${escapeStr(item.id)}'`];
      if (item.label) parts.push(`label: '${escapeStr(item.label)}'`);
      return `${pad}{ ${parts.join(', ')} },`;
    }

    if (item.type === 'category') {
      let result = `${pad}{\n`;
      result += `${pad}  type: 'category',\n`;
      result += `${pad}  label: '${escapeStr(item.label)}',\n`;
      if (item.link) result += `${pad}  link: '${escapeStr(item.link)}',\n`;
      result += `${pad}  collapsed: ${item.collapsed ?? true},\n`;
      result += `${pad}  items: [\n`;
      for (const child of item.items) {
        result += serializeItem(child, indent + 4) + '\n';
      }
      result += `${pad}  ],\n`;
      result += `${pad}},`;
      return result;
    }

    return '';
  }

  let body = 'export const mainSidebar: SidebarItem[] = [\n';
  for (const item of items) {
    body += serializeItem(item, 2) + '\n';
  }
  body += ']\n';

  return header + body;
}

// ── Variable suggestions ─────────────────────────────────────────
function suggestVariables() {
  const candidates = new Map();

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (/\.mdx?$/.test(entry.name)) {
        try {
          const { content } = matter(fs.readFileSync(abs, 'utf-8'));

          // Version strings
          const versions = content.match(/\bv?\d+\.\d+\.\d+\b/g) || [];
          for (const v of versions) candidates.set(v, (candidates.get(v) || 0) + 1);

          // Capitalised multi-word phrases (potential product names)
          const phrases = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g) || [];
          for (const p of phrases) candidates.set(p, (candidates.get(p) || 0) + 1);

          // Repeated URLs
          const urls = content.match(/https?:\/\/[^\s)>"']+/g) || [];
          for (const u of urls) candidates.set(u, (candidates.get(u) || 0) + 1);
        } catch {
          /* skip unreadable files */
        }
      }
    }
  }

  walk(TARGET_DOCS);

  const suggestions = [];
  for (const [value, count] of candidates) {
    if (count < 3) continue;
    const key = /^https?:\/\//.test(value)
      ? 'url_' +
        value
          .replace(/https?:\/\//, '')
          .replace(/[^\w]/g, '_')
          .slice(0, 30)
      : value
          .toLowerCase()
          .replace(/[^\w]+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
    suggestions.push({ key, value, count });
  }

  suggestions.sort((a, b) => b.count - a.count);
  return suggestions;
}

// ── Scan custom components ────────────────────────────────────────
// Walks src/components/ in the Docusaurus project and returns
// a Map of PascalCase component names → { srcPath, isJs } metadata.
// isJs=true means the source is .js/.jsx and will need TypeScript type
// annotations added before it compiles under Trellis's strict tsconfig.
// Note: src/theme/ (Docusaurus swizzle overrides) is intentionally excluded —
// Trellis has its own built-in equivalents for all swizzleable components.
function scanCustomComponents(projectPath) {
  // Map<name, { srcPath: string, isJs: boolean }>
  const components = new Map();
  const dirsToScan = [
    path.join(projectPath, 'src', 'components'),
  ];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // PascalCase directory name = component folder (e.g. Button/index.tsx → Button)
        // Determine JS vs TS from the index file inside the folder.
        if (/^[A-Z]/.test(entry.name)) {
          const tsIndex = path.join(full, 'index.tsx');
          const jsIndex = path.join(full, 'index.jsx');
          const srcPath = fs.existsSync(tsIndex) ? tsIndex : fs.existsSync(jsIndex) ? jsIndex : full;
          const isJs = srcPath.endsWith('.jsx') || srcPath.endsWith('.js');
          if (!components.has(entry.name)) components.set(entry.name, { srcPath, isJs });
        }
        walk(full);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        const baseName = path.basename(entry.name, path.extname(entry.name));
        const isJs = entry.name.endsWith('.jsx') || entry.name.endsWith('.js');
        // PascalCase file name = component — index files handled by parent dir above
        if (/^[A-Z]/.test(baseName) && baseName !== 'Index' && !components.has(baseName)) {
          components.set(baseName, { srcPath: full, isJs });
        }
      }
    }
  }

  for (const dir of dirsToScan) walk(dir);
  return components;
}

// ── Trellis built-in equivalents for common Docusaurus components ──
// These components already exist in Trellis — no need to copy them.
const TRELLIS_BUILTINS = new Map([
  ['Tabs', { import: null, note: 'Built-in Trellis <Tabs>/<TabItem> — works as-is' }],
  ['TabItem', { import: null, note: 'Built-in Trellis <TabItem> — works as-is' }],
  ['Admonition', { import: null, note: 'Use Trellis :::note/:::tip/:::warning admonition syntax instead' }],
  ['CodeBlock', { import: null, note: 'Use fenced code blocks (```) instead' }],
  ['Details', { import: null, note: 'Use standard HTML <details>/<summary> — works in MDX' }],
  ['TOCInline', { import: null, note: 'Trellis generates table of contents automatically' }],
  ['DocCardList', { import: null, note: 'Built-in Trellis <DocCardList> — works as-is' }],
  ['DocCard', { import: null, note: 'Built-in Trellis <DocCard> — works as-is' }],
  ['Callout', { import: null, note: 'Built-in Trellis <Callout> — works as-is' }],
  ['FlippingCard', { import: null, note: 'Built-in Trellis <FlippingCard> — works as-is' }],
  ['Glossary', { import: null, note: 'Built-in Trellis <Glossary> — works as-is' }],
  ['Feedback', { import: null, note: 'Built-in Trellis <Feedback> — works as-is' }],
  ['FaqTableOfContents', { import: null, note: 'Built-in Trellis <FaqTableOfContents> — works as-is' }],
  ['Tooltip', { import: null, note: 'Built-in Trellis <Tooltip> — works as-is' }],
  ['Chip', { import: null, note: 'Built-in Trellis <Chip> — works as-is' }],
]);

// ── Copy custom components to Trellis ─────────────────────────────
// Copies component files from src/components/ into components/custom/migrated/,
// rewrites Docusaurus-specific imports, renames .jsx→.tsx / .js→.ts,
// and registers used components in the MDX component map.
const TARGET_COMPONENTS = path.join(ROOT, 'components', 'custom', 'migrated');
const MDX_INDEX = path.join(ROOT, 'components', 'docs', 'mdx', 'index.tsx');

function copyCustomComponents(customComponentNames, usedComponents, force, dryRun) {
  const copied = [];
  const skippedBuiltins = [];

  for (const [compName] of usedComponents) {
    // Skip components that have Trellis built-in equivalents
    if (TRELLIS_BUILTINS.has(compName)) {
      skippedBuiltins.push({ name: compName, note: TRELLIS_BUILTINS.get(compName).note });
      continue;
    }

    // Find the full component info from the scan
    const compInfo = customComponentNames.get(compName);
    if (!compInfo) continue;

    const srcPath = compInfo.srcPath;
    const isDir = fs.statSync(srcPath).isDirectory();

    if (isDir) {
      // Copy the entire component directory
      const destDir = path.join(TARGET_COMPONENTS, toKebabCase(compName));
      if (!dryRun) copyComponentDir(srcPath, destDir, force);
      copied.push({ name: compName, dest: destDir, isDir: true, isJs: compInfo.isJs });
    } else {
      // Copy single file, rename .jsx→.tsx / .js→.tsx (if JSX) or .js→.ts
      const ext = path.extname(srcPath);
      let newExt = ext === '.jsx' ? '.tsx' : ext === '.js' ? '.ts' : ext;
      // Check if .js file actually contains JSX — needs .tsx not .ts
      if (ext === '.js') {
        const srcContent = fs.readFileSync(srcPath, 'utf-8');
        if (containsJsx(srcContent)) newExt = '.tsx';
      }
      const destFile = path.join(TARGET_COMPONENTS, toKebabCase(compName) + newExt);
      if (!dryRun) copySingleComponent(srcPath, destFile, force);
      copied.push({ name: compName, dest: destFile, isDir: false, isJs: compInfo.isJs });
    }
  }

  // Register copied components in MDX index
  if (!dryRun && copied.length > 0) {
    registerMdxComponents(copied);
  }

  return { copied, skippedBuiltins };
}

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function copySingleComponent(srcPath, destPath, force) {
  if (!force && fs.existsSync(destPath)) return;
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  let content = fs.readFileSync(srcPath, 'utf-8');
  const isJs = /\.(jsx?|js)$/.test(srcPath);
  content = rewriteDocusaurusImports(content);
  if (isJs) content = addTypeAnnotations(content);
  // Fix extension if content has JSX but dest is .ts (not .tsx)
  if (destPath.endsWith('.ts') && !destPath.endsWith('.tsx') && containsJsx(content)) {
    destPath = destPath.replace(/\.ts$/, '.tsx');
  }
  fs.writeFileSync(destPath, content);
}

function copyComponentDir(srcDir, destDir, force) {
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const srcPath = path.join(srcDir, entry.name);
    let destName = renameExtension(entry.name);
    let destPath = path.join(destDir, destName);

    if (entry.isDirectory()) {
      copyComponentDir(srcPath, destPath, force);
    } else {
      if (!force && fs.existsSync(destPath)) continue;
      let content = fs.readFileSync(srcPath, 'utf-8');
      const isJs = /\.(jsx?|js)$/.test(entry.name);
      if (/\.(tsx?|jsx?|css)$/.test(entry.name)) {
        content = rewriteDocusaurusImports(content);
      }
      if (isJs) content = addTypeAnnotations(content);
      // Fix extension if content has JSX but dest is .ts (not .tsx)
      if (destPath.endsWith('.ts') && !destPath.endsWith('.tsx') && containsJsx(content)) {
        destPath = destPath.replace(/\.ts$/, '.tsx');
      }
      fs.writeFileSync(destPath, content);
    }
  }
}

function renameExtension(filename) {
  return filename
    .replace(/\.jsx$/, '.tsx')
    .replace(/\.js$/, '.ts');
}

// Check if content contains JSX syntax (HTML-like tags)
function containsJsx(content) {
  // Strip strings and comments first to avoid false positives
  const stripped = content
    .replace(/\/\/.*$/gm, '')           // single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')   // multi-line comments
    .replace(/'(?:[^'\\]|\\.)*'/g, '')  // single-quoted strings
    .replace(/"(?:[^"\\]|\\.)*"/g, '')  // double-quoted strings
    .replace(/`(?:[^`\\]|\\.)*`/g, ''); // template literals
  // Look for JSX: <Component or <div or <svg etc.
  return /<[a-zA-Z][a-zA-Z0-9.]*[\s/>]/.test(stripped);
}

function rewriteDocusaurusImports(content) {
  // Remove @theme/ imports (Trellis has built-in equivalents)
  content = content.replace(/^import\s+.*?\s+from\s+['"]@theme\/[^'"]+['"];?\s*$/gm, '// [migration] @theme import removed — use Trellis built-in equivalent');

  // Remove @docusaurus/ imports (Docusaurus-specific hooks and utilities)
  content = content.replace(/^import\s+.*?\s+from\s+['"]@docusaurus\/[^'"]+['"];?\s*$/gm, '// [migration] @docusaurus import removed — no Trellis equivalent');

  // Rewrite @site/src/components/ → relative path within components/custom/migrated/
  content = content.replace(
    /from\s+['"]@site\/src\/components\/([^'"]+)['"]/g,
    (_, p) => `from './${p}'`
  );

  // Remove other @site/ imports with a warning comment
  content = content.replace(
    /^(import\s+.*?\s+from\s+['"]@site\/(?!src\/components)[^'"]+['"];?)$/gm,
    '// [migration] TODO: rewrite this import for Trellis\n// $1'
  );

  // Rewrite CSS module imports from .module.css to work with Next.js
  // (Next.js supports CSS modules natively, so the import pattern is the same)

  // Ensure React import exists when the file contains JSX.
  // Docusaurus .jsx files rely on the automatic JSX runtime and often omit
  // the React import. After renaming to .tsx, TypeScript needs it to resolve
  // JSX intrinsic elements (e.g., <svg>, <div>).
  const hasJsx = /<[a-zA-Z][\s\S]*?>/.test(content);
  const hasReactImport = /^import\s+React[\s,]/m.test(content) || /from\s+['"]react['"]/m.test(content);
  if (hasJsx && !hasReactImport) {
    content = 'import React from \'react\';\n' + content;
  }

  return content;
}

// ── Auto-type JavaScript components for strict TypeScript ────────
// Docusaurus defaults to JavaScript, so most custom components are .js/.jsx.
// After renaming to .tsx/.ts, TypeScript strict mode rejects untyped props.
// This function infers prop types from destructuring patterns and adds
// interfaces and annotations so the component compiles without manual edits.
function addTypeAnnotations(content) {
  // ── 1. Type destructured props in function components ──────
  // Matches: function Foo({ bar, baz }) or const Foo = ({ bar, baz }) =>
  // Does NOT touch functions that already have TypeScript annotations (: or as)
  content = content.replace(
    /^((?:export\s+)?(?:(?:function\s+([A-Z]\w*))|(?:(?:const|let|var)\s+([A-Z]\w*)\s*=\s*(?:React\.memo\s*\(\s*)?(?:React\.forwardRef\s*\(\s*)?)))\s*\(\s*\{([^}]*)\}\s*\)/gm,
    (match, _prefix, funcName, varName, propsBody) => {
      // Skip if already typed (contains : or as keyword for types)
      if (/:\s*\{/.test(match) || /\bProps\b/.test(match)) return match;

      const compName = funcName || varName;
      if (!compName) return match;

      const props = parsePropsFromDestructuring(propsBody);
      if (props.length === 0) return match;

      const interfaceName = `${compName}Props`;
      const interfaceBody = props.map((p) => `  ${p.name}${p.hasDefault ? '?' : ''}: ${p.type};`).join('\n');
      const interfaceBlock = `interface ${interfaceName} {\n${interfaceBody}\n}\n\n`;

      // Replace the destructured params with typed version
      const typed = match.replace(
        `{ ${propsBody} }`,
        `{ ${propsBody} }: ${interfaceName}`
      );

      return interfaceBlock + typed;
    }
  );

  // ── 2. Type single-param props (not destructured) ──────────
  // Matches: function Foo(props) or const Foo = (props) =>
  content = content.replace(
    /^((?:export\s+)?(?:function\s+([A-Z]\w*)|(?:const|let|var)\s+([A-Z]\w*)\s*=\s*(?:React\.memo\s*\(\s*)?(?:React\.forwardRef\s*\(\s*)?))\s*\(\s*(\w+)\s*\)/gm,
    (match, _prefix, funcName, varName, paramName) => {
      if (/:\s*\w/.test(match) || paramName === 'props' && /Props\b/.test(match)) return match;
      if (!/^[a-z]/.test(paramName)) return match; // Skip if not a simple param name

      const compName = funcName || varName;
      if (!compName) return match;

      return match.replace(`(${paramName})`, `(${paramName}: Record<string, any>)`);
    }
  );

  // ── 3. Type useState calls that TypeScript can't infer ─────
  // useState(null) → useState<T | null>(null) — without this, TS infers `null` only
  content = content.replace(
    /useState\(\s*null\s*\)/g,
    () => 'useState<any>(null)'
  );
  // useState([]) → useState<any[]>([])
  content = content.replace(
    /useState\(\s*\[\s*\]\s*\)/g,
    () => 'useState<any[]>([])'
  );
  // useState({}) → useState<Record<string, any>>({})
  content = content.replace(
    /useState\(\s*\{\s*\}\s*\)/g,
    () => 'useState<Record<string, any>>({})'
  );

  // ── 4. Type event handler parameters ───────────────────────
  // (e) => or (event) => in onChange, onClick, onSubmit, etc.
  content = content.replace(
    /on(?:Change|Click|Submit|Input|Focus|Blur|KeyDown|KeyUp|KeyPress|Mouse\w+|Touch\w+)\s*=\s*\{?\s*(?:\(\s*(\w+)\s*\)|(\w+))\s*=>/g,
    (match, parenParam, bareParam) => {
      const param = parenParam || bareParam;
      if (!param || /:\s*\w/.test(match)) return match;
      if (parenParam) {
        return match.replace(`(${param})`, `(${param}: React.SyntheticEvent)`);
      }
      return match.replace(`${param} =>`, `(${param}: React.SyntheticEvent) =>`);
    }
  );

  // ── 5. Add 'use client' if the component uses hooks or browser APIs ──
  const usesClientFeatures = /\b(useState|useEffect|useRef|useCallback|useMemo|useContext|useReducer|useLayoutEffect|window\.|document\.|navigator\.)\b/.test(content);
  const hasUseClient = /^['"]use client['"];?\s*$/m.test(content);
  if (usesClientFeatures && !hasUseClient) {
    // Insert after React import if present, otherwise at the very top
    const reactImportMatch = content.match(/^import\s+React\b[^\n]*\n/m);
    if (reactImportMatch) {
      const insertIdx = content.indexOf(reactImportMatch[0]) + reactImportMatch[0].length;
      content = content.slice(0, insertIdx) + "'use client';\n" + content.slice(insertIdx);
    } else {
      content = "'use client';\n" + content;
    }
  }

  return content;
}

// Parse prop names and infer types from destructuring pattern.
// Input: "bar, baz = 'hello', count = 0, items = [], onClick, children"
// Returns: [{ name, type, hasDefault }]
function parsePropsFromDestructuring(propsBody) {
  const props = [];
  // Split on commas, but respect nested braces/brackets/parens
  const parts = splitProps(propsBody.trim());

  for (const raw of parts) {
    const part = raw.trim();
    if (!part) continue;

    // Handle rest params: ...rest
    if (part.startsWith('...')) {
      props.push({ name: part, type: 'Record<string, any>', hasDefault: false });
      continue;
    }

    // Handle renamed props: original: renamed or nested destructuring: { a, b }
    // Skip nested destructuring — too complex to auto-type
    if (part.includes('{') || part.includes('[')) continue;

    // Split on = for default values
    const eqIdx = part.indexOf('=');
    const hasDefault = eqIdx !== -1;
    const name = (hasDefault ? part.slice(0, eqIdx) : part).trim().replace(/:\s*\w+$/, '').trim();
    const defaultValue = hasDefault ? part.slice(eqIdx + 1).trim() : null;

    if (!name || /[^a-zA-Z0-9_$]/.test(name)) continue;

    const type = inferTypeFromPropName(name, defaultValue);
    props.push({ name, type, hasDefault });
  }

  return props;
}

// Split "a, b = [1,2], c = {x: 1}, d" respecting brackets
function splitProps(str) {
  const result = [];
  let current = '';
  let depth = 0;

  for (const ch of str) {
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;

    if (ch === ',' && depth === 0) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) result.push(current);
  return result;
}

// Infer a TypeScript type from the prop name and default value
function inferTypeFromPropName(name, defaultValue) {
  // Infer from default value first (most reliable)
  if (defaultValue != null) {
    const dv = defaultValue.trim();
    if (dv === 'true' || dv === 'false') return 'boolean';
    if (dv === 'null') return 'any';
    if (dv === 'undefined') return 'any';
    if (/^['"`]/.test(dv)) return 'string';
    if (/^-?\d+(\.\d+)?$/.test(dv)) return 'number';
    if (/^\[/.test(dv)) return 'any[]';
    if (/^\{/.test(dv)) return 'Record<string, any>';
    if (/^\(/.test(dv) || /=>/.test(dv)) return '(...args: any[]) => any';
  }

  // Infer from naming conventions
  const lower = name.toLowerCase();

  // children is always React.ReactNode
  if (name === 'children') return 'React.ReactNode';

  // className, style
  if (name === 'className') return 'string';
  if (name === 'style') return 'React.CSSProperties';
  if (name === 'id') return 'string';

  // Boolean-like names
  if (/^(is|has|can|should|show|hide|with|no|enable|disable|visible|active|open|closed|checked|disabled|required|loading|selected|expanded|collapsed|readonly|readOnly)/.test(name)) {
    return 'boolean';
  }

  // Event handlers
  if (/^on[A-Z]/.test(name)) return '(...args: any[]) => void';

  // Render props
  if (/^render[A-Z]/.test(name) || name === 'component') return 'React.ComponentType<any>';

  // Common string-like names
  if (/^(title|label|name|description|placeholder|text|message|alt|src|href|url|path|value|type|variant|size|color|icon|tag|role)$/i.test(lower)) {
    return 'string';
  }

  // Plural names are likely arrays
  if (/s$/.test(name) && !/^(class|this|css|status|radius|alias|focus|progress)$/i.test(name)) {
    return 'any[]';
  }

  // Count/index/number-like names
  if (/^(count|index|length|max|min|limit|offset|page|total|width|height|size|depth|level|step|timeout|delay|duration|interval|columns|rows)$/i.test(lower)) {
    return 'number';
  }

  // Default fallback
  return 'any';
}

function registerMdxComponents(copiedComponents) {
  if (!fs.existsSync(MDX_INDEX)) {
    report.warnings.push('Could not find components/docs/mdx/index.tsx — skipping MDX registration');
    return;
  }

  let content = fs.readFileSync(MDX_INDEX, 'utf-8');

  // Filter out components already imported or registered in the MDX index
  const newImportLines = [];
  const newRegistrations = [];

  for (const comp of copiedComponents) {
    // Skip if already imported or registered
    if (content.includes(`import { ${comp.name} }`) || content.includes(`import ${comp.name} `)) {
      report.warnings.push(`${comp.name}: Already registered in MDX component map — skipping duplicate registration`);
      continue;
    }

    const kebab = toKebabCase(comp.name);
    const importPath = `@/components/custom/migrated/${kebab}`;

    newImportLines.push(`import { ${comp.name} } from '${importPath}'`);
    newRegistrations.push(`  ${comp.name},`);
  }

  if (newImportLines.length === 0) {
    return;
  }

  // Insert imports before the first blank line after existing imports
  const lastImportIdx = content.lastIndexOf('\nimport ');
  const nextNewline = content.indexOf('\n', lastImportIdx + 1);
  const insertPos = content.indexOf('\n', nextNewline + 1);

  content = content.slice(0, insertPos) +
    '\n// Migrated Docusaurus components\n' +
    newImportLines.join('\n') +
    content.slice(insertPos);

  // Insert component registrations before the closing } of mdxComponents
  const closingBrace = content.lastIndexOf('}');
  content = content.slice(0, closingBrace) +
    '  // Migrated Docusaurus components\n' +
    newRegistrations.join('\n') + '\n' +
    content.slice(closingBrace);

  fs.writeFileSync(MDX_INDEX, content);
}

// ── Migration report ─────────────────────────────────────────────
function printReport() {
  console.log('\n');
  console.log('========================================');
  console.log('       MIGRATION REPORT');
  console.log('========================================');

  console.log(`\nFiles migrated:  ${report.copied.length}`);
  console.log(`Files skipped:   ${report.skipped.length}`);
  if (report.assetsCopied.length > 0) {
    console.log(`Assets copied:   ${report.assetsCopied.length} (from docs/)`);
  }
  if (report.staticAssetsCopied > 0) {
    console.log(`Static assets:   ${report.staticAssetsCopied} (from static/ → public/)`);
  }
  console.log(`Errors:          ${report.errors.length}`);
  console.log(`Warnings:        ${report.warnings.length}`);

  if (report.frontmatterStripped.size > 0) {
    console.log('\nFrontmatter fields stripped:');
    for (const [field, count] of report.frontmatterStripped) {
      console.log(`  ${field}: ${count} file(s)`);
    }
  }

  if (report.commentsConverted > 0) {
    console.log(`\nHTML comments converted to MDX: ${report.commentsConverted}`);
  }

  if (report.renamed.length > 0) {
    console.log(`\nFiles renamed (.md -> .mdx): ${report.renamed.length}`);
  }

  if (report.prefixesStripped.length > 0) {
    console.log(`\nNumbered prefixes stripped: ${report.prefixesStripped.length}`);
    for (const { from, to } of report.prefixesStripped.slice(0, 10)) {
      console.log(`  ${from} -> ${to}`);
    }
    if (report.prefixesStripped.length > 10) {
      console.log(`  ... and ${report.prefixesStripped.length - 10} more`);
    }
  }

  if (report.sidebarGenerated) {
    console.log('\nSidebar: Generated config/sidebar.ts');
  }

  if (report.componentsCopied && report.componentsCopied.length > 0) {
    console.log('\nCustom components copied to components/custom/migrated/:');
    for (const comp of report.componentsCopied) {
      const suffix = comp.isJs ? ' ⚠ needs TypeScript type annotations (strict mode)' : '';
      console.log(`  ${comp.name} → ${path.relative(ROOT, comp.dest)}${suffix}`);
    }
    console.log('  Registered in components/docs/mdx/index.tsx');
  }

  if (report.componentsSkippedBuiltins && report.componentsSkippedBuiltins.length > 0) {
    console.log('\nComponents with Trellis built-in equivalents (not copied):');
    for (const { name, note } of report.componentsSkippedBuiltins) {
      console.log(`  ${name}: ${note}`);
    }
  }

  // Components that were detected in content but NOT found in src/components/
  if (report.customComponentsUsed.size > 0) {
    const notCopied = [...report.customComponentsUsed].filter(([name]) => {
      const wasCopied = report.componentsCopied && report.componentsCopied.some((c) => c.name === name);
      const wasSkipped = report.componentsSkippedBuiltins && report.componentsSkippedBuiltins.some((c) => c.name === name);
      return !wasCopied && !wasSkipped;
    });
    if (notCopied.length > 0) {
      console.log('\nCustom components used in content but not found in src/components/:');
      for (const [compName, meta] of notCopied) {
        console.log(`  <${compName}> — ${meta.files.length} file(s)`);
        for (const f of meta.files) console.log(`    ${f}`);
      }
    }
  }

  if (report.variableSuggestions.length > 0) {
    console.log('\nSuggested variables for config/variables.ts:');
    console.log('(These repeated values could be replaced with {vars.xxx})');
    for (const { key, value, count } of report.variableSuggestions.slice(0, 15)) {
      console.log(`  ${key}: '${value}' (found ${count} times)`);
    }
  }

  if (report.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const w of report.warnings) {
      console.log(`  - ${w}`);
    }
  }

  if (report.errors.length > 0) {
    console.log('\nErrors:');
    for (const { file, error } of report.errors) {
      console.log(`  ${file}: ${error}`);
    }
  }

  console.log('\nNext steps:');
  let step = 1;
  console.log(`  ${step++}. Review migrated files in content/docs/`);
  console.log(`  ${step++}. Review generated config/sidebar.ts`);
  console.log(`  ${step++}. Run "npm run build" to verify the build succeeds`);
  console.log(`  ${step++}. Check any warnings above and fix manually if needed`);
  if (report.componentsCopied && report.componentsCopied.length > 0) {
    const hasJs = report.componentsCopied.some((c) => c.isJs);
    console.log(`  ${step++}. Review copied components in components/custom/migrated/`);
    console.log('     - Check that @theme/@site imports were rewritten correctly');
    console.log('     - Verify component props and APIs work with Trellis');
    if (hasJs) {
      console.log('     - Add TypeScript type annotations to renamed .js/.jsx files');
      console.log('       (Trellis tsconfig enforces strict mode)');
    }
  }
  if (report.variableSuggestions.length > 0) {
    console.log(`  ${step++}. Consider adding suggested variables to config/variables.ts`);
  }
}

// ── Main ─────────────────────────────────────────────────────────
function main() {
  const { docusaurusPath, force, dryRun } = parseArgs();

  console.log('Docusaurus -> Trellis Migration');
  console.log('================================');
  console.log(`Source: ${docusaurusPath}`);
  console.log(`Target: ${TARGET_DOCS}`);
  if (force) console.log('Mode: --force (overwriting existing files)');
  if (dryRun) console.log('Mode: --dry-run (no files will be written)');
  console.log('');

  // ── Phase 0: Scan custom components ─────────────────────────
  console.log('Phase 0: Scanning for custom components...');
  const customComponentNames = scanCustomComponents(docusaurusPath);
  if (customComponentNames.size > 0) {
    const jsCount = [...customComponentNames.values()].filter((m) => m.isJs).length;
    const tsCount = customComponentNames.size - jsCount;
    const parts = [];
    if (tsCount > 0) parts.push(`${tsCount} TypeScript`);
    if (jsCount > 0) parts.push(`${jsCount} JavaScript`);
    console.log(`  Found ${customComponentNames.size} custom component(s) (${parts.join(', ')}): ${[...customComponentNames.keys()].sort().join(', ')}`);
    if (jsCount > 0) {
      console.log('  Note: JavaScript components must be renamed to .tsx/.ts and typed before they');
      console.log('  compile under Trellis (strict TypeScript). See report for source file paths.');
    }
  } else {
    console.log('  No custom components found in src/components/');
  }

  // ── Phase 1: Content files ──────────────────────────────────
  const docsDir = findDocsDir(docusaurusPath);
  if (!docsDir) {
    console.error('Error: Could not find a docs/ directory in the Docusaurus project.');
    process.exit(1);
  }
  console.log(`Found docs at: ${docsDir}`);

  const { mdFiles, categoryFiles, assetFiles } = discoverFiles(docsDir);
  console.log(`\nPhase 1: Migrating content files...`);
  console.log(`  Found ${mdFiles.length} markdown file(s), ${categoryFiles.length} category file(s), ${assetFiles.length} asset(s)`);

  // Scan sidebar_position / sidebar_label from source files before stripping
  scanSidebarPositions(docsDir);
  scanCategoryPositions(categoryFiles);
  if (sidebarPositions.size > 0 || categoryPositions.size > 0) {
    console.log(`  Found ${sidebarPositions.size} sidebar position(s) and ${categoryPositions.size} category position(s)`);
  }

  // Build category metadata map for sidebar generation
  const categoryMeta = {};
  for (const catFile of categoryFiles) {
    if (catFile.absPath.endsWith('.json')) {
      try {
        categoryMeta[catFile.relDir] = JSON.parse(fs.readFileSync(catFile.absPath, 'utf-8'));
      } catch {
        /* skip */
      }
    }
  }

  for (const file of mdFiles) {
    try {
      processFile(file.absPath, file.relPath, force, dryRun, customComponentNames);
    } catch (err) {
      report.errors.push({ file: file.relPath, error: err.message });
      console.error(`  Error: ${file.relPath}: ${err.message}`);
    }
  }

  // Copy assets found alongside docs (images etc.)
  for (const file of assetFiles) {
    try {
      copyAsset(file.absPath, file.relPath, force, dryRun);
    } catch (err) {
      report.errors.push({ file: file.relPath, error: err.message });
    }
  }

  // ── Phase 1b: Copy static assets ───────────────────────────
  // Docusaurus stores images in static/img/ — copy to public/img/
  copyStaticAssets(docusaurusPath, force, dryRun);

  // ── Phase 2: Sidebar conversion ─────────────────────────────
  console.log('\nPhase 2: Converting sidebar...');
  const sidebarData = loadDocusaurusSidebar(docusaurusPath);

  let convertedItems = [];

  if (sidebarData && typeof sidebarData === 'object') {
    const keys = Object.keys(sidebarData);
    if (keys.length > 0) {
      const sidebarKey = keys[0];
      const rawItems = Array.isArray(sidebarData[sidebarKey]) ? sidebarData[sidebarKey] : [];
      console.log(`  Converting sidebar "${sidebarKey}" (${rawItems.length} top-level item(s))`);

      for (const item of rawItems) {
        const converted = convertSidebarItem(item, categoryMeta);
        if (Array.isArray(converted)) {
          // Autogenerated returns an array
          convertedItems.push(...converted);
        } else if (converted) {
          convertedItems.push(converted);
        }
      }
    }
  }

  if (convertedItems.length === 0) {
    console.log('  No sidebar items converted. Generating from filesystem...');
    convertedItems = buildSidebarFromFilesystem('.');
  }

  if (convertedItems.length > 0) {
    if (!dryRun) {
      if (fs.existsSync(TARGET_SIDEBAR)) {
        const backupPath = TARGET_SIDEBAR.replace('.ts', '.backup.ts');
        fs.copyFileSync(TARGET_SIDEBAR, backupPath);
        console.log(`  Backed up existing sidebar to ${path.basename(backupPath)}`);
      }

      const sidebarContent = generateSidebarFile(convertedItems);
      fs.writeFileSync(TARGET_SIDEBAR, sidebarContent);
      report.sidebarGenerated = true;
      console.log(`  Sidebar written to config/sidebar.ts (${convertedItems.length} top-level items)`);
    } else {
      console.log(`  [dry-run] Would write sidebar with ${convertedItems.length} top-level items`);
    }
  }

  // ── Phase 3: Copy custom components ──────────────────────────
  if (report.customComponentsUsed.size > 0) {
    console.log('\nPhase 3: Copying custom components...');
    const { copied: copiedComps, skippedBuiltins } = copyCustomComponents(
      customComponentNames, report.customComponentsUsed, force, dryRun
    );
    report.componentsCopied = copiedComps;
    report.componentsSkippedBuiltins = skippedBuiltins;

    if (copiedComps.length > 0) {
      console.log(`  Copied ${copiedComps.length} component(s) to components/custom/migrated/`);
      for (const comp of copiedComps) {
        const suffix = comp.isJs ? ' (JS → TS rename — add type annotations)' : '';
        console.log(`    ${comp.name}${suffix}`);
      }
    }
    if (skippedBuiltins.length > 0) {
      console.log(`  Skipped ${skippedBuiltins.length} component(s) with Trellis built-in equivalents:`);
      for (const { name, note } of skippedBuiltins) {
        console.log(`    ${name}: ${note}`);
      }
    }
    if (!dryRun && copiedComps.length > 0) {
      console.log('  Registered components in components/docs/mdx/index.tsx');
    }
  }

  // ── Phase 4: Variable suggestions ───────────────────────────
  if (!dryRun && report.copied.length > 0) {
    console.log('\nPhase 4: Scanning for variable candidates...');
    report.variableSuggestions = suggestVariables();
    if (report.variableSuggestions.length > 0) {
      console.log(`  Found ${report.variableSuggestions.length} candidate(s)`);
    } else {
      console.log('  No repeated strings found');
    }
  }

  // ── Report ──────────────────────────────────────────────────
  printReport();
}

main();
