// src/components/CustomSearch/CustomSearch.js
import React, { useState, useEffect } from 'react';
import { useHistory } from '@docusaurus/router';
import { Input, Modal, List } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import Fuse from 'fuse.js';
import styles from './styles.module.css';

const { Search } = Input;

const fuseOptions = {
  includeScore: true,
  threshold: 0.4,
  minMatchCharLength: 2,
  keys: [
    {
      name: 'keywords',
      weight: 0.7
    },
    {
      name: 'title',
      weight: 0.5
    },
    {
      name: 'description',
      weight: 0.3
    }
  ]
};

function CustomSearch() {
  const [searchIndex, setSearchIndex] = useState([]);
  const [fuse, setFuse] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const history = useHistory();

  const handleClear = () => {
    setSearchTerm('');
    setSearchResults([]);
    setModalVisible(false);
  };

  const handleModalClose = () => {
    handleClear();
  };

  useEffect(() => {
    async function loadSearchIndex() {
      try {
        const response = await fetch('/searchIndex.json');
        if (!response.ok) throw new Error(`Failed to load search index: ${response.statusText}`);
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
    }

    loadSearchIndex();
  }, []);

  const performSearch = (value) => {
    if (!value.trim() || !fuse) {
      setSearchResults([]);
      return;
    }

    try {
      const results = fuse.search(value.trim());
      const processedResults = Array.from(
        new Map(
          results.map(result => [result.item.id, result.item])
        ).values()
      );

      setSearchResults(processedResults);
      setModalVisible(true);
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
    setModalVisible(false);
    setSearchTerm('');
    history.push(url);
  };

  const formatDate = (lastUpdate) => {
    if (!lastUpdate) return null;

    try {
      // Handle both string and object formats
      const dateStr = typeof lastUpdate === 'string'
        ? lastUpdate
        : lastUpdate.date || lastUpdate.lastUpdatedAt;

      if (!dateStr) return null;

      // Parse the date string
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;

      return {
        date: date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        author: typeof lastUpdate === 'object' ? lastUpdate.author : null
      };
    } catch (error) {
      console.error('Date formatting error:', error);
      return null;
    }
  };

  const renderLastUpdate = (item) => {
    const lastUpdateData = item.last_update || item.lastUpdatedAt;
    const formattedDate = formatDate(lastUpdateData);

    if (!formattedDate) return null;

    return (
      <div className={styles.searchResultMeta}>
        <span className={styles.searchResultDate}>
          Last updated: {formattedDate.date}
        </span>
      </div>
    );
  };

  const renderTitle = (item) => (
    <a
      onClick={() => navigateToPage(item.url)}
      className={styles.searchResultTitle}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          navigateToPage(item.url);
        }
      }}
    >
      {item.title}
    </a>
  );

  return (
    <div className={styles.searchWrapper}>
      <Search
        placeholder="Search documentation..."
        onSearch={handleSearchSubmit}
        value={searchTerm}
        onChange={handleSearchChange}
        className={styles.searchInput}
        loading={loading}
        prefix={<SearchOutlined />}
        allowClear={true}
        onClear={handleClear}
      />

      <Modal
        title={`Search Results${searchResults.length ? ` (${searchResults.length})` : ''}`}
        open={modalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        className={styles.searchModal}
        destroyOnClose
      >
        <div className={styles.searchModalContent}>
          {searchResults.length > 0 ? (
            <List
              className={styles.searchResultsList}
              itemLayout="vertical"
              size="small"
              pagination={{
                pageSize: 5,
                className: styles.searchPagination,
                size: "small"
              }}
              dataSource={searchResults}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  className={styles.searchResultItem}
                >
                  <List.Item.Meta
                    title={renderTitle(item)}
                    description={
                      <div className={styles.searchResultContent}>
                        <div className={styles.searchResultDescription}>
                          {item.description}
                        </div>
                        {renderLastUpdate(item)}
                      </div>
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
      </Modal>
    </div>
  );
}

export default CustomSearch;
