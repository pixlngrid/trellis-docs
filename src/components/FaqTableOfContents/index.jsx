import React, { useState, useMemo, useCallback } from 'react';
import Link from '@docusaurus/Link';
import useGlobalData from '@docusaurus/useGlobalData';
import styles from './styles.module.css';

/**
 * Retrieves FAQ topics from the faq-index-plugin's global data.
 * Returns an empty array if the plugin data is unavailable.
 */
function useFaqTopics(pluginId) {
  try {
    const globalData = useGlobalData();
    const pluginData = globalData?.[pluginId]?.default;
    return pluginData?.topics || [];
  } catch {
    return [];
  }
}

/**
 * Searchable FAQ table of contents for Docusaurus.
 *
 * Reads the FAQ index produced by faq-index-plugin and renders a
 * filterable list of every question, grouped by topic file.
 *
 * @param {Object} props
 * @param {string} [props.pluginId='docusaurus-plugin-faq-index'] - Plugin name to look up in global data.
 * @param {string} [props.searchPlaceholder='Search FAQs...'] - Placeholder for the search input.
 * @param {string} [props.title] - Optional heading above the TOC.
 */
export default function FaqTableOfContents({
  pluginId = 'docusaurus-plugin-faq-index',
  searchPlaceholder = 'Search FAQs...',
  title,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const topics = useFaqTopics(pluginId);

  // Total question count
  const totalQuestions = useMemo(
    () => topics.reduce((sum, t) => sum + t.questions.length, 0),
    [topics],
  );

  // Filter topics and questions by search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return topics;

    const query = searchQuery.toLowerCase();
    return topics
      .map((topic) => {
        const topicMatches = topic.title.toLowerCase().includes(query);
        const matchingQuestions = topic.questions.filter((q) =>
          q.text.toLowerCase().includes(query),
        );

        if (topicMatches) return topic;
        if (matchingQuestions.length > 0) {
          return { ...topic, questions: matchingQuestions };
        }
        return null;
      })
      .filter(Boolean);
  }, [topics, searchQuery]);

  const filteredQuestionCount = useMemo(
    () => filtered.reduce((sum, t) => sum + t.questions.length, 0),
    [filtered],
  );

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setSearchQuery('');
  }, []);

  if (topics.length === 0) {
    return (
      <div className={styles.faqToc}>
        <p className={styles.emptyState}>
          No FAQ topics found. Verify that the{' '}
          <code>faq-index-plugin</code> is registered in{' '}
          <code>docusaurus.config.js</code> and that <code>docs/faq/</code>{' '}
          contains <code>.mdx</code> files with <code>###</code> question
          headings.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.faqToc}>
      {title && <h2 className={styles.title}>{title}</h2>}

      {/* Search input */}
      <div className={styles.searchContainer}>
        <svg
          className={styles.searchIcon}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={handleSearchChange}
          aria-label="Search FAQ entries"
        />
        {searchQuery && (
          <button
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear search"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {/* Result count */}
      {searchQuery && (
        <p className={styles.resultCount}>
          {filteredQuestionCount} of {totalQuestions}{' '}
          {totalQuestions === 1 ? 'question' : 'questions'} match
        </p>
      )}

      {/* FAQ list */}
      {filtered.length === 0 ? (
        <p className={styles.noResults}>
          No FAQs match "<strong>{searchQuery}</strong>". Try a different search
          term.
        </p>
      ) : (
        filtered.map((topic) => (
          <div key={topic.slug} className={styles.topicGroup}>
            <h2 className={styles.topicHeading}>
                {topic.title}
              <span className={styles.questionCount}>
                {topic.questions.length}
              </span>
            </h2>
            {topic.description && (
              <p className={styles.topicDescription}>{topic.description}</p>
            )}
            <ul className={styles.questionList}>
              {topic.questions.map((q) => (
                <li key={q.anchor} className={styles.questionItem}>
                  <Link
                    to={`${topic.permalink}#${q.anchor}`}
                    className={styles.questionLink}
                  >
                    {q.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
