// scripts/build-reltable.js
//
// Builds public/reltable.json from content/reltable.yml.
// The reltable is opt-in — if the file does not exist, this script
// emits an empty index and exits cleanly so builds keep working.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');
const RELTABLE_FILE = path.join(ROOT, 'content/reltable.yml');
const OUT_FILE = path.join(ROOT, 'public/reltable.json');

const COLUMNS = ['overview', 'concept', 'task', 'reference', 'troubleshooting'];

// Load site config for i18n/versioning awareness (mirrors build-faq-index.js)
let siteConfig = {};
try {
  const configRaw = fs.readFileSync(path.join(ROOT, 'config/site.ts'), 'utf-8');
  siteConfig.i18nEnabled = /i18n:\s*\{[^}]*enabled:\s*true/s.test(configRaw);
  siteConfig.versioningEnabled = /versioning:\s*\{[^}]*enabled:\s*true/s.test(configRaw);
  const localeMatch = configRaw.match(/defaultLocale:\s*['"]([^'"]+)['"]/);
  siteConfig.defaultLocale = localeMatch ? localeMatch[1] : 'en';

  if (siteConfig.i18nEnabled) {
    const codeMatches = [...configRaw.matchAll(/code:\s*['"]([^'"]+)['"]/g)];
    siteConfig.locales = codeMatches.map((m) => m[1]);
  } else {
    siteConfig.locales = [siteConfig.defaultLocale];
  }
} catch {
  siteConfig = {
    i18nEnabled: false,
    versioningEnabled: false,
    defaultLocale: 'en',
    locales: ['en'],
  };
}

let versions = [];
try {
  if (siteConfig.versioningEnabled) {
    versions = JSON.parse(fs.readFileSync(path.join(ROOT, 'versions.json'), 'utf-8'));
  }
} catch { /* no versions file */ }

function getDocsDir(locale, version) {
  const isDefault = locale === siteConfig.defaultLocale;
  const isCurrent = version === 'current';

  if (isDefault && isCurrent) return path.join(ROOT, 'content/docs');
  if (isDefault && !isCurrent) return path.join(ROOT, 'versioned_docs', version);
  if (!isDefault && isCurrent) return path.join(ROOT, 'content/i18n', locale, 'docs');
  return path.join(ROOT, 'content/i18n', locale, 'versioned_docs', version);
}

function buildUrlPrefix(locale, version) {
  const parts = [];
  if (locale !== siteConfig.defaultLocale) parts.push(locale);
  if (version !== 'current') parts.push(version);
  return parts.length > 0 ? '/' + parts.join('/') : '';
}

function normalizeSlug(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('/') ? trimmed : '/' + trimmed;
}

function resolveSlugToFile(docsDir, slug) {
  // slug is "/foo/bar" — try {docsDir}/foo/bar.mdx then /foo/bar/index.mdx (and .md)
  const rel = slug.replace(/^\/+/, '');
  const candidates = [
    path.join(docsDir, rel + '.mdx'),
    path.join(docsDir, rel + '.md'),
    path.join(docsDir, rel, 'index.mdx'),
    path.join(docsDir, rel, 'index.md'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function readTitle(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(raw);
    return data.title || null;
  } catch {
    return null;
  }
}

function cellToSlugs(cell) {
  if (cell == null) return [];
  const list = Array.isArray(cell) ? cell : [cell];
  return list.map(normalizeSlug).filter(Boolean);
}

// Load reltable.yml (opt-in — missing file is fine)
let reltable = [];
if (fs.existsSync(RELTABLE_FILE)) {
  try {
    const raw = fs.readFileSync(RELTABLE_FILE, 'utf-8');
    const parsed = yaml.load(raw);
    reltable = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`[reltable] Failed to parse ${RELTABLE_FILE}: ${err.message}`);
    reltable = [];
  }
}

function buildIndexForDir(docsDir, urlPrefix) {
  const perSlug = {};
  const warnings = [];

  for (const family of reltable) {
    if (!family || !Array.isArray(family.rows)) continue;
    const familyName = family.family || '';

    for (const row of family.rows) {
      if (!row || typeof row !== 'object') continue;

      // Gather slugs per column for this row
      const rowByColumn = {};
      const rowAllSlugs = [];
      for (const col of COLUMNS) {
        const slugs = cellToSlugs(row[col]);
        rowByColumn[col] = slugs;
        rowAllSlugs.push(...slugs);
      }

      // Resolve titles once per slug appearing in this row
      const titles = {};
      for (const slug of rowAllSlugs) {
        if (titles[slug] !== undefined) continue;
        const file = resolveSlugToFile(docsDir, slug);
        if (!file) {
          warnings.push(`  ${slug} (in family "${familyName}")`);
          titles[slug] = null;
          continue;
        }
        titles[slug] = readTitle(file) || slug.split('/').pop();
      }

      // For each slug in the row, record siblings grouped by column
      for (const slug of rowAllSlugs) {
        if (!titles[slug]) continue; // skip unresolved — nothing to link to

        if (!perSlug[slug]) {
          perSlug[slug] = {
            families: [],
            overview: [],
            concept: [],
            task: [],
            reference: [],
            troubleshooting: [],
          };
        }
        if (familyName && !perSlug[slug].families.includes(familyName)) {
          perSlug[slug].families.push(familyName);
        }

        for (const col of COLUMNS) {
          for (const siblingSlug of rowByColumn[col]) {
            if (siblingSlug === slug) continue;
            if (!titles[siblingSlug]) continue;
            const permalink = `${urlPrefix}${siblingSlug}`;
            // de-dupe by permalink
            if (perSlug[slug][col].some((x) => x.permalink === permalink)) continue;
            perSlug[slug][col].push({
              slug: siblingSlug,
              title: titles[siblingSlug],
              permalink,
            });
          }
        }
      }
    }
  }

  return { perSlug, warnings };
}

const allVersions = ['current', ...versions];
const allLocales = siteConfig.locales;
const fullIndex = {};
const allWarnings = [];
let totalEntries = 0;

for (const locale of allLocales) {
  for (const version of allVersions) {
    const docsDir = getDocsDir(locale, version);
    if (!fs.existsSync(docsDir)) continue;

    const urlPrefix = buildUrlPrefix(locale, version);
    const { perSlug, warnings } = buildIndexForDir(docsDir, urlPrefix);

    const entryCount = Object.keys(perSlug).length;
    if (entryCount > 0) {
      fullIndex[`${locale}:${version}`] = perSlug;
      totalEntries += entryCount;
    }
    if (warnings.length > 0) {
      allWarnings.push(`[${locale}:${version}] unresolved slugs:`);
      allWarnings.push(...warnings);
    }
  }
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(fullIndex, null, 2));

const indexCount = Object.keys(fullIndex).length;
console.log(`Reltable built: ${totalEntries} entries across ${indexCount} index(es)`);
if (allWarnings.length > 0) {
  console.warn('[reltable] warnings:');
  for (const w of allWarnings) console.warn(w);
}
