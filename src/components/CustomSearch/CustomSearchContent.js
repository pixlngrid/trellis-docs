// src/components/CustomSearch/CustomSearchContent.js
import React, { useState, useEffect } from 'react';
import { Input, List } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useHistory } from '@docusaurus/router';
import Fuse from 'fuse.js';
import styles from './styles.module.css';

const { Search } = Input;

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

function CustomSearchContent({ onClose, initialSearchTerm = '' }) {
  const [searchIndex, setSearchIndex] = useState([]);
  const [fuse, setFuse] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const history = useHistory();

  useEffect(() => {
    loadSearchIndex();
  }, []);

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
      setLoading(false);
    } catch (error) {
      console.error('Error loading search index:', error);
      setLoading(false);
    }
  };

  const performSearch = (value) => {
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
  };

  const handleSearchSubmit = (value) => {
    performSearch(value);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const navigateToPage = (url) => {
    onClose();
    history.push(url);
  };

  const formatDate = (lastUpdate) => {
    if (!lastUpdate?.date) return null;
    try {
      const [month, day, year] = lastUpdate.date.split('/').map(num => parseInt(num, 10));
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : {
        date: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    } catch (error) {
      return null;
    }
  };

  return (
    <div className={styles.searchModalContent}>
      <Search
        placeholder="Search documentation..."
        onSearch={handleSearchSubmit}
        value={searchTerm}
        onChange={handleSearchChange}
        className={styles.searchInput}
        loading={loading}
        prefix={<SearchOutlined />}
        allowClear
      />

      <div className={styles.searchResults}>
        {searchResults.length > 0 ? (
          <List
            className={styles.searchResultsList}
            itemLayout="vertical"
            size="small"
            pagination={{
              pageSize: 5,
              size: "small"
            }}
            dataSource={searchResults}
            renderItem={(item) => (
              <List.Item key={item.id} className={styles.searchResultItem}>
                <List.Item.Meta
                  title={
                    <a
                      onClick={() => navigateToPage(item.url)}
                      className={styles.searchResultTitle}
                      role="button"
                      tabIndex={0}
                    >
                      {item.title}
                    </a>
                  }
                  description={
                    <>
                      <div className={styles.searchResultDescription}>
                        {item.description}
                      </div>
                      {formatDate(item.last_update) && (
                        <div className={styles.searchResultDate}>
                          Last updated: {formatDate(item.last_update).date}
                        </div>
                      )}
                    </>
                  }
                />
              </List.Item>
            )}
          />
        ) : searchTerm ? (
          <div className={styles.searchNoResults}>
            No results found for "{searchTerm}"
          </div>
        ) : (
          <div className={styles.searchInstructions}>
            Enter your search terms to find documentation
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomSearchContent;
