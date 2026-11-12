import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { cn, debounce } from '@/lib/utils';

export interface SearchInputProps {
  value?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value = '',
  onSearch,
  placeholder = 'Search jewellery, earrings, necklaces...',
  className,
}: SearchInputProps) {
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const debounced = debounce((text: string) => {
      onSearch(text);
    }, 300);
    debounced(query);
  }, [query, onSearch]);

  return (
    <div className={cn('relative w-full', className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/40 focus:border-brand-gold focus:bg-white transition-all shadow-inner"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            onSearch('');
          }}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
