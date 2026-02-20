// src/components/CustomSearch/SearchContext.js
import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <SearchContext.Provider value={{ isModalOpen, setIsModalOpen }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useModalSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useModalSearch must be used within a SearchProvider');
  }
  return {
    isSearchModalOpen: context.isModalOpen,
    openSearchModal: () => context.setIsModalOpen(true),
    closeSearchModal: () => context.setIsModalOpen(false)
  };
}
