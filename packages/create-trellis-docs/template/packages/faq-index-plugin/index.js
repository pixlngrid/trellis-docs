// packages/faq-index-plugin/index.js

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const PLUGIN_NAME = 'docusaurus-plugin-faq-index';

module.exports = function faqIndexPlugin(context, options) {
  const opts = options || {};
  const faqDir = path.resolve(context.siteDir, opts.faqDir || 'docs/faq');
  const basePermalink = opts.basePermalink || '/faq';

  return {
    name: PLUGIN_NAME,

    async loadContent() {
      if (!fs.existsSync(faqDir)) {
        console.warn(`[${PLUGIN_NAME}] FAQ directory not found: ${faqDir}`);
        return [];
      }

      const files = fs
        .readdirSync(faqDir)
        .filter((f) => /\.(mdx?)$/.test(f) && f !== 'index.mdx' && f !== 'index.md');

      const topics = [];

      for (const file of files) {
        const filePath = path.join(faqDir, file);

        let raw;
        try {
          raw = fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
          console.warn(`[${PLUGIN_NAME}] Could not read ${filePath}:`, err.message);
          continue;
        }

        const { data: frontmatter, content } = matter(raw);

        const slug = file.replace(/\.mdx?$/, '');
        const title =
          frontmatter.title ||
          slug
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());

        // Extract questions from ### headings
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
          permalink: `${basePermalink}/${slug}`,
          questions,
        });
      }

      topics.sort((a, b) => a.title.localeCompare(b.title));
      return topics;
    },

    async contentLoaded({ content, actions }) {
      const { setGlobalData } = actions;
      setGlobalData({ topics: content || [] });
    },
  };
};