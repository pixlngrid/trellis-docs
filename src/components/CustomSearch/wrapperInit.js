// src/components/CustomSearch/wrapperInit.js
import React from 'react';
import { SearchProvider } from './SearchContext';

const wrapRootElement = ({ element }) => (
  <SearchProvider>
    {element}
  </SearchProvider>
);

export default wrapRootElement;
