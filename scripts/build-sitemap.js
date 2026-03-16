// scripts/build-sitemap.js
// Generates public/sitemap.xml and public/robots.txt at build time.
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.join(__dirname, '..');
const DOCS_DIR = path.join(ROOT, 'content/docs');
const BLOG_DIR = path.join(ROOT, 'content/blog');
const RELEASE_NOTES_DIR = path.join(ROOT, 'content/release-notes');
const SITEMAP_OUT = path.join(ROOT, 'public/sitemap.xml');
const ROBOTS_OUT = path.join(ROOT, 'public/robots.txt');

// Read site URL from config
let siteUrl = 'https://example.com';
let blogEnabled = true;
let releaseNotesEnabled = true;
try {
  const configRaw = fs.readFileSync(path.join(ROOT, 'config/site.ts'), 'utf-8');
  const urlMatch = configRaw.match(/url:\s*['"]([^'"]+)['"]/);
  if (urlMatch) siteUrl = urlMatch[1].replace(/\/$/, '');
  blogEnabled = !/blog:\s*\{[^}]*enabled:\s*false/s.test(configRaw);
  releaseNotesEnabled = !/releaseNotes:\s*\{[^}]*enabled:\s*false/s.test(configRaw);
} catch { /* use defaults */ }

function getFilesRecursive(dir, base = '') {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...getFilesRecursive(path.join(dir, entry.name), rel));
    } else if (/\.mdx?$/.test(entry.name)) {
      files.push(rel);
    }
  }
  return files;
}

function fileToSlug(file) {
  return file.replace(/\.mdx?$/, '').replace(/\/index$/, '');
}

function getLastMod(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.mtime.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Normalize dates to YYYY-MM-DD (handles MM/DD/YYYY, YYYY-MM-DD, Date objects)
function normalizeDate(date) {
  if (!date) return null;
  const str = date instanceof Date ? date.toISOString().split('T')[0] : String(date).split('T')[0];
  // MM/DD/YYYY → YYYY-MM-DD
  const slashMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) return `${slashMatch[3]}-${slashMatch[1]}-${slashMatch[2]}`;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Try parsing as Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  return null;
}

// Collect all URLs
const urls = [];
const today = new Date().toISOString().split('T')[0];

// Landing page
urls.push({ loc: `${siteUrl}/`, lastmod: today, priority: '1.0', changefreq: 'weekly' });

// Doc pages
const docFiles = getFilesRecursive(DOCS_DIR);
for (const file of docFiles) {
  const filePath = path.join(DOCS_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(raw);
  if (data.draft === true) continue;
  const slug = fileToSlug(file);
  urls.push({
    loc: `${siteUrl}/${slug}/`,
    lastmod: normalizeDate(data.last_update?.date) || getLastMod(filePath),
    priority: '0.8',
    changefreq: 'weekly',
  });
}

// Blog posts
if (blogEnabled && fs.existsSync(BLOG_DIR)) {
  const blogFiles = fs.readdirSync(BLOG_DIR).filter(f => /\.mdx?$/.test(f));
  // Blog index
  urls.push({ loc: `${siteUrl}/blog/`, lastmod: today, priority: '0.7', changefreq: 'weekly' });
  for (const file of blogFiles) {
    const filePath = path.join(BLOG_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(raw);
    const match = file.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.mdx?$/);
    const slug = match ? match[2] : file.replace(/\.mdx?$/, '');
    const date = match ? match[1] : data.date || today;
    urls.push({
      loc: `${siteUrl}/blog/${data.slug || slug}/`,
      lastmod: date,
      priority: '0.6',
      changefreq: 'monthly',
    });
  }
}

// Release notes
if (releaseNotesEnabled && fs.existsSync(RELEASE_NOTES_DIR)) {
  const rnFiles = fs.readdirSync(RELEASE_NOTES_DIR).filter(f => /\.mdx?$/.test(f));
  // Release notes index
  urls.push({ loc: `${siteUrl}/release-notes/`, lastmod: today, priority: '0.6', changefreq: 'weekly' });
  for (const file of rnFiles) {
    const filePath = path.join(RELEASE_NOTES_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data } = matter(raw);
    const slug = file.replace(/\.mdx?$/, '');
    const date = normalizeDate(data.date) || today;
    urls.push({
      loc: `${siteUrl}/release-notes/${slug}/`,
      lastmod: date,
      priority: '0.5',
      changefreq: 'monthly',
    });
  }
}

// Generate sitemap XML
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(SITEMAP_OUT, xml, 'utf-8');
console.log(`✓ Sitemap generated with ${urls.length} URLs → public/sitemap.xml`);

// Generate robots.txt
const robots = `User-agent: *
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

fs.writeFileSync(ROBOTS_OUT, robots, 'utf-8');
console.log('✓ robots.txt generated → public/robots.txt');
