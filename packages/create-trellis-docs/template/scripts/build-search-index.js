// scripts/build-search-index.js
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'content/docs');
const OUT_FILE = path.join(ROOT, 'public/searchIndex.json');
const EXCLUDED_PREFIXES = ['_'];
const EXCLUDED_FOLDERS = ['includes', '_includes'];

// Load doc variables for resolving {vars.xxx} in headings
let docVars = {};
try {
  const varsRaw = fs.readFileSync(path.join(ROOT, 'config/variables.ts'), 'utf-8');
  const varMatches = [...varsRaw.matchAll(/(\w+):\s*['"]([^'"]*)['"]/g)];
  for (const m of varMatches) docVars[m[1]] = m[2];
} catch { /* variables file is optional */ }

function resolveVars(text) {
  return text.replace(/\{vars\.(\w+)\}/g, (_, key) => docVars[key] ?? '');
}

// Load site config to check i18n/versioning settings
let siteConfig = {};
try {
  // Try to read the compiled config, fall back to defaults
  const configPath = path.join(ROOT, 'config/site.ts');
  const configRaw = fs.readFileSync(configPath, 'utf-8');
  // Simple extraction of i18n and versioning enabled flags
  siteConfig.i18nEnabled = /i18n:\s*\{[^}]*enabled:\s*true/s.test(configRaw);
  siteConfig.versioningEnabled = /versioning:\s*\{[^}]*enabled:\s*true/s.test(configRaw);

  // Extract default locale
  const localeMatch = configRaw.match(/defaultLocale:\s*['"]([^'"]+)['"]/);
  siteConfig.defaultLocale = localeMatch ? localeMatch[1] : 'en';

  // Extract locale codes
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

// Load versions
let versions = [];
try {
  if (siteConfig.versioningEnabled) {
    versions = JSON.parse(fs.readFileSync(path.join(ROOT, 'versions.json'), 'utf-8'));
  }
} catch {
  // No versions file
}

function getContentDir(locale, version) {
  const isDefault = locale === siteConfig.defaultLocale;
  const isCurrent = version === 'current';

  if (isDefault && isCurrent) return DOCS_DIR;
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

function getFiles(dir, base = '') {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (EXCLUDED_FOLDERS.includes(entry.name)) continue;
    if (EXCLUDED_PREFIXES.some((p) => entry.name.startsWith(p))) continue;

    const rel = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files.push(...getFiles(path.join(dir, entry.name), rel));
    } else if (/\.mdx?$/.test(entry.name)) {
      files.push(rel);
    }
  }

  return files;
}

function extractSections(content) {
  const sections = [];
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  let match;
  let lastIndex = 0;
  let lastHeading = null;

  while ((match = headingRegex.exec(content)) !== null) {
    if (lastHeading) {
      const sectionContent = content.slice(lastIndex, match.index).trim();
      sections.push({
        id: lastHeading.id,
        heading: lastHeading.text,
        level: lastHeading.level,
        content: sectionContent.replace(/[#*`\[\]()]/g, '').slice(0, 500),
      });
    }

    const text = resolveVars(
      match[2].trim()
        .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    );

    const id = text.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    lastHeading = { text, id, level: match[1].length };
    lastIndex = match.index + match[0].length;
  }

  if (lastHeading) {
    const sectionContent = content.slice(lastIndex).trim();
    sections.push({
      id: lastHeading.id,
      heading: lastHeading.text,
      level: lastHeading.level,
      content: sectionContent.replace(/[#*`\[\]()]/g, '').slice(0, 500),
    });
  }

  return sections;
}

function indexDir(dir, urlPrefix) {
  const files = getFiles(dir);
  const entries = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf-8');
    const { data, content } = matter(raw);

    // Skip draft pages
    if (data.draft === true) continue;

    const slug = file.replace(/\.mdx?$/, '').replace(/\/index$/, '');
    const url = `${urlPrefix}/${slug}/`;

    const sections = extractSections(content);
    const plainContent = content
      .replace(/^---[\s\S]*?---/, '')
      .replace(/[#*`\[\]()]/g, '')
      .slice(0, 1000);

    entries.push({
      id: slug.replace(/\//g, '-'),
      title: data.title || slug.split('/').pop(),
      description: data.description || '',
      keywords: data.keywords || [],
      last_update: data.last_update || null,
      url,
      content: plainContent,
      sections: sections.map((s) => ({
        ...s,
        url: `${url}#${s.id}`,
      })),
    });
  }

  return entries;
}

// Build the index
const allVersions = ['current', ...versions];
const allLocales = siteConfig.locales;
const fullIndex = {};
let totalDocs = 0;

for (const locale of allLocales) {
  for (const version of allVersions) {
    const dir = getContentDir(locale, version);
    if (!fs.existsSync(dir)) continue;

    const urlPrefix = buildUrlPrefix(locale, version);
    const key = `${locale}:${version}`;
    const entries = indexDir(dir, urlPrefix);

    if (entries.length > 0) {
      fullIndex[key] = entries;
      totalDocs += entries.length;
    }
  }
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(fullIndex, null, 2));

const keys = Object.keys(fullIndex);
console.log(`Search index built: ${totalDocs} documents across ${keys.length} index(es) [${keys.join(', ')}]`);
