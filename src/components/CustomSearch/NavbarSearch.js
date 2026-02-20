// src/components/CustomSearch/NavbarSearch.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useHistory } from '@docusaurus/router';
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

let Fuse = null;
if (ExecutionEnvironment.canUseDOM) {
  import('fuse.js').then(module => {
    Fuse = module.default;
  }).catch(err => {
    console.warn('Error loading Fuse.js:', err);
  });
}
import styles from './styles.module.css';

const fuseOptions = {
  includeScore: true,
  threshold: 0.4,
  minMatchCharLength: 2,
  keys: [
    { name: 'keywords', weight: 0.7 },
    { name: 'title', weight: 0.5 },
    { name: 'description', weight: 0.3 }
  ]
};

function NavbarSearch() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchIndex, setSearchIndex] = useState([]);
  const [fuse, setFuse] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const history = useHistory();

  useEffect(() => {
    const loadSearchIndex = async () => {
      try {
        const response = await fetch('/searchIndex.json');
        if (!response.ok) throw new Error('Failed to load search index');
        const data = await response.json();

        const processedData = data.map(item => ({
          ...item,
          keywords: Array.isArray(item.keywords)
            ? item.keywords.map(k => k?.toLowerCase()?.trim()).filter(Boolean)
            : [],
        }));

        setSearchIndex(processedData);
        setFuse(new Fuse(processedData, fuseOptions));
      } catch (error) {
        console.error('Error loading search index:', error);
      }
    };

    loadSearchIndex();

    // Click outside handler
    const handleClickOutside = (event) => {
      // Check if the click is on the theme toggle or its children
      if (event.target.closest('.navbar__items--right')) {
        return;
      }

      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          !event.target.closest('.navbar-search-container')) {
        setIsExpanded(false);
        setSearchTerm('');
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = useCallback((value) => {
    if (!value?.trim() || !fuse) {
      setSearchResults([]);
      return;
    }

    try {
      const results = fuse.search(value.trim());
      const processedResults = Array.from(
        new Map(results.map(result => [result.item.id, result.item])).values()
      );
      setSearchResults(processedResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  }, [fuse]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    performSearch(value);
  }, [performSearch]);

  const navigateToPage = (url) => {
    setIsExpanded(false);
    setSearchTerm('');
    setSearchResults([]);
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    history.replace(formattedUrl);
  };

  const formatDate = (lastUpdate) => {
    if (!lastUpdate) return null;
    try {
      const dateStr = typeof lastUpdate === 'string'
        ? lastUpdate
        : lastUpdate.date || lastUpdate.lastUpdatedAt;

      if (!dateStr) return null;

      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : {
        date: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        author: typeof lastUpdate === 'object' ? lastUpdate.author : null
      };
    } catch (error) {
      return null;
    }
  };

  const handleSearchIconClick = (e) => {
    e.preventDefault();
    if (isExpanded && !searchTerm) {
      setIsExpanded(false);
      // Remove focus from the input field without selecting nearby elements
      inputRef.current?.blur();
    } else {
      setIsExpanded(true);
      // Add a slight delay to ensure smooth transition before focusing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className={styles.searchContainer}>
      <div className={`${styles.searchWrapper} navbar-search-container ${isExpanded ? styles.expanded : ''}`}>
        <SearchOutlined
          className={styles.searchIcon}
          onClick={handleSearchIconClick}
        />
        <Input
          ref={inputRef}
          placeholder="Search documentation..."
          value={searchTerm}
          onChange={handleSearchChange}
          className={`${styles.searchInput} ${isExpanded ? styles.visible : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && searchResults.length > 0) {
              navigateToPage(searchResults[0].url);
            } else if (e.key === 'Escape') {
              setIsExpanded(false);
              setSearchTerm('');
              setSearchResults([]);
            }
          }}
        />
      </div>

      {isExpanded && searchTerm && (
        <div className={styles.dropdownResults} ref={dropdownRef}>
          <div className={styles.resultCount}>
            {searchResults.length === 0 ? 'No results found' :
             `Found ${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`}
          </div>
          {searchResults.map((item) => (
            <div
              key={item.id}
              className={styles.resultItem}
              onClick={() => navigateToPage(item.url)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigateToPage(item.url);
                }
              }}
              tabIndex={0}
              role="button"
            >
              <div className={styles.resultTitle}>{item.title}</div>
              <div className={styles.resultDescription}>{item.description}</div>
              {item.last_update && (
                <div className={styles.resultMeta}>
                  {formatDate(item.last_update)?.date &&
                    `Last updated: ${formatDate(item.last_update).date}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NavbarSearch;
