import React, { useState, useEffect, useRef } from 'react';
import Icon from './Icon';
import { searchCities } from '../api/events';

const CityPickerModal = ({ isOpen, onClose, onSelect, currentCity }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState([]);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSources([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSources([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchCities(query);
        setResults(data.cities || []);
        setSources(data.sources || []);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="app-sheet-overlay" onClick={onClose}>
      <div className="app-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="app-sheet-head">
          <h2>Выберите город</h2>
          <button onClick={onClose}>
            <Icon name="close" size={22} />
          </button>
        </div>

        <input
          className="city-search"
          placeholder="Начните вводить название..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '12px',
            border: '1px solid #e3e9f0',
            background: '#f7f9fc',
            marginBottom: '12px',
            fontSize: '14px',
            outline: 'none'
          }}
        />

        {loading && (
          <p style={{ textAlign: 'center', color: '#8190a3', padding: '12px' }}>
            Ищем города...
          </p>
        )}

        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <p style={{ textAlign: 'center', color: '#8190a3', padding: '12px' }}>
            Ничего не найдено
          </p>
        )}

        <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
          {results.map((city, index) => (
            <button
              className={`city-option ${
                currentCity === city.name ? 'active' : ''
              }`}
              key={`${city.name}-${index}`}
              onClick={() => {
                onSelect(city);
                onClose();
              }}
            >
              <span>
                {city.name}
                {city.country && (
                  <small
                    style={{
                      display: 'block',
                      color: '#8190a3',
                      fontSize: '11px'
                    }}
                  >
                    {city.country}
                  </small>
                )}
              </span>
              <span>{currentCity === city.name ? '✓' : ''}</span>
            </button>
          ))}
        </div>

        {sources.length > 0 && (
          <p
            style={{
              textAlign: 'center',
              fontSize: '11px',
              color: '#b0b8c4',
              marginTop: '8px'
            }}
          >
            Источники: {sources.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
};

export default CityPickerModal;