import React, { createContext, useState, useContext } from 'react';

const SearchContext = createContext<any>(null);

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <SearchContext.Provider value={{ visible, setVisible }}>
      {children}
    </SearchContext.Provider>
  );
};