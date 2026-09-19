import React from 'react';
import Icon from './Icon';

const SearchBar = ({ value, onChange, onOpenFilters }) => {
  return (
    <div className="search-bar">
      <span className="search-icon"><Icon name="search" size={22} /></span>
      <input
        type="text"
        placeholder="Что хотите поделать?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button className="filter-btn" onClick={onOpenFilters} aria-label="Фильтры">
        <Icon name="sliders" size={23} />
      </button>
    </div>
  );
};

export default SearchBar;
