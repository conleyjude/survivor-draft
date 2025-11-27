import React, { useState } from 'react';
import '../styles/FilterPanel.css';

/**
 * FilterPanel Component
 * Multi-criteria filtering interface
 * 
 * @component
 * @param {Object} props
 * @param {Array} props.filters - Array of filter objects {id, label, options, type}
 * @param {Function} props.onFilterChange - Callback with selected filters
 * @param {Object} [props.initialFilters={}] - Initial filter values
 * @returns {JSX.Element}
 */
const FilterPanel = ({ filters, onFilterChange, initialFilters = {} }) => {
  const [selectedFilters, setSelectedFilters] = useState(initialFilters);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (filterId, value) => {
    const updated = {
      ...selectedFilters,
      [filterId]: value === selectedFilters[filterId] ? null : value,
    };
    setSelectedFilters(updated);
    onFilterChange(updated);
  };

  const handleReset = () => {
    setSelectedFilters({});
    onFilterChange({});
  };

  const activeFilterCount = Object.values(selectedFilters).filter(Boolean).length;

  return (
    <div className="filter-panel">
      <button
        className="filter-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="filter-icon">⚙️</span>
        Filters
        {activeFilterCount > 0 && (
          <span className="filter-badge">{activeFilterCount}</span>
        )}
      </button>

      {isExpanded && (
        <div className="filter-content">
          {filters.map((filter) => (
            <div key={filter.id} className="filter-group">
              <label className="filter-label">{filter.label}</label>
              <div className="filter-options">
                {filter.type === 'checkbox' ? (
                  filter.options.map((option) => (
                    <label key={option.value} className="filter-option">
                      <input
                        type="checkbox"
                        checked={selectedFilters[filter.id] === option.value}
                        onChange={() =>
                          handleFilterChange(filter.id, option.value)
                        }
                      />
                      <span>{option.label}</span>
                    </label>
                  ))
                ) : (
                  <select
                    value={selectedFilters[filter.id] || ''}
                    onChange={(e) =>
                      handleFilterChange(filter.id, e.target.value)
                    }
                    className="filter-select"
                  >
                    <option value="">All</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}

          {activeFilterCount > 0 && (
            <button className="filter-reset" onClick={handleReset}>
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
