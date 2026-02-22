// scripts/build-faq-index.js
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const FAQ_DIR = path.join(__dirname, '../content/docs/faq');
const OUT_FILE = path.join(__dirname, '../public/faqIndex.json');
const BASE_PERMALINK = '/faq';

if (!fs.existsSync(FAQ_DIR)) {
  console.log('FAQ directory not found, creating empty index');
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, '[]');
  process.exit(0);
}

const files = fs
  .readdirSync(FAQ_DIR)
  .filter((f) => /\.mdx?$/.test(f) && f !== 'index.mdx' && f !== 'index.md');

const topics = [];

for (const file of files) {
  const filePath = path.join(FAQ_DIR, file);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(raw);

  const slug = file.replace(/\.mdx?$/, '');
  const title =
    frontmatter.title ||
    slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Extract ### headings as questions
  const h3Regex = /^###\s+(.+)$/gm;
  const questions = [];
  let match;

  while ((match = h3Regex.exec(content)) !== null) {
    let questionText = match[1]
      .trim()
      .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    if (questionText) {
      const anchor = questionText
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      questions.push({ text: questionText, anchor });
    }
  }

  topics.push({
    slug,
    title,
    description: frontmatter.description || '',
    permalink: `${BASE_PERMALINK}/${slug}`,
    questions,
  });
}

topics.sort((a, b) => a.title.localeCompare(b.title));

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(topics, null, 2));
console.log(`FAQ index built: ${topics.length} topics, ${topics.reduce((s, t) => s + t.questions.length, 0)} questions`);
