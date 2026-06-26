"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface SearchContextValue {
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;
}

const SearchContext = createContext<SearchContextValue>({
  searchOpen: false,
  setSearchOpen: () => {},
  toggleSearch: () => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  const toggleSearch = useCallback(() => {
    setSearchOpen((v) => !v);
  }, []);

  return (
    <SearchContext.Provider value={{ searchOpen, setSearchOpen, toggleSearch }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}
