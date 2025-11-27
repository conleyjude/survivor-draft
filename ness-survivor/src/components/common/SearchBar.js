import React, { useState, useCallback } from 'react';
import '../styles/SearchBar.css';

/**
 * SearchBar Component
 * Advanced search with debouncing and suggestions
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onSearch - Callback with search query
 * @param {string} [props.placeholder="Search..."] - Input placeholder
 * @param {string} [props.searchType="general"] - Type of search
 * @param {number} [props.debounceMs=300] - Debounce delay in ms
 * @param {Array} [props.suggestions] - Array of suggestion objects {id, label, category}
 * @param {Function} [props.onSuggestionSelect] - Callback when suggestion selected
 * @returns {JSX.Element}
 */
const SearchBar = ({
  onSearch,
  placeholder = 'Search...',
  searchType = 'general',
  debounceMs = 300,
  suggestions = [],
  onSuggestionSelect,
}) => {
  const [query, setQuery] = useState('');
  const [debouncedTimeout, setDebouncedTimeout] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setQuery(value);

      // Clear previous timeout
      if (debouncedTimeout) {
        clearTimeout(debouncedTimeout);
      }

      // Filter suggestions
      if (value.trim() && suggestions.length > 0) {
        const filtered = suggestions.filter((s) =>
          s.label.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredSuggestions(filtered);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }

      // Debounce search callback
      const timeout = setTimeout(() => {
        onSearch(value);
      }, debounceMs);

      setDebouncedTimeout(timeout);
    },
    [debouncedTimeout, debounceMs, onSearch, suggestions]
  );

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.label);
    setShowSuggestions(false);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestions(false);
    onSearch('');
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          aria-label={`Search by ${searchType}`}
        />
        {query && (
          <button
            className="search-clear-btn"
            onClick={handleClear}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {filteredSuggestions.slice(0, 8).map((suggestion, idx) => (
            <div
              key={`${suggestion.id}-${idx}`}
              className="suggestion-item"
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
            >
              <span className="suggestion-category">{suggestion.category}</span>
              <span className="suggestion-label">{suggestion.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
