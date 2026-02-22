// scripts/build-search-index.js
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const DOCS_DIR = path.join(__dirname, '../content/docs');
const OUT_FILE = path.join(__dirname, '../public/searchIndex.json');
const EXCLUDED_PREFIXES = ['_'];
const EXCLUDED_FOLDERS = ['includes', '_includes'];

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

    const text = match[2].trim()
      .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

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

const files = getFiles(DOCS_DIR);
const index = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(DOCS_DIR, file), 'utf-8');
  const { data, content } = matter(raw);

  const slug = file.replace(/\.mdx?$/, '').replace(/\/index$/, '');
  const url = `/${slug}/`;

  const sections = extractSections(content);
  const plainContent = content
    .replace(/^---[\s\S]*?---/, '')
    .replace(/[#*`\[\]()]/g, '')
    .slice(0, 1000);

  index.push({
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

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(index, null, 2));
console.log(`Search index built: ${index.length} documents`);
