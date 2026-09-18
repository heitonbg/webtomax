import React, { useState } from 'react';

const FiltersModal = ({ onClose, onApply, initialFilters }) => {
  const [filters, setFilters] = useState(
    initialFilters || {
      time: 'Сейчас',
      distance: 'до 1 км',
      category: [],
      format: 'Офлайн',
      price: 'Бесплатно',
      pushkinCard: false
    }
  );

  const toggleCategory = (cat) => {
    setFilters((prev) => ({
      ...prev,
      category: prev.category.includes(cat)
        ? prev.category.filter((c) => c !== cat)
        : [...prev.category, cat]
    }));
  };

  const handleReset = () => {
    setFilters({
      time: 'Сейчас',
      distance: 'до 1 км',
      category: [],
      format: 'Офлайн',
      price: 'Бесплатно',
      pushkinCard: false
    });
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Фильтры</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="filter-group">
          <label>Когда</label>
          <div className="chips-row">
            {['Сейчас', 'Сегодня', 'Завтра'].map((t) => (
              <button
                key={t}
                className={`chip ${filters.time === t ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, time: t })}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Расстояние</label>
          <div className="chips-row">
            {['до 1 км', 'до 3 км', 'до 5 км'].map((d) => (
              <button
                key={d}
                className={`chip ${filters.distance === d ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, distance: d })}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Категория</label>
          <div className="chips-row">
            {['Спорт', 'Культура', 'Настольные игры', 'Кино'].map((c) => (
              <button
                key={c}
                className={`chip ${filters.category.includes(c) ? 'active' : ''}`}
                onClick={() => toggleCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Формат</label>
          <div className="chips-row">
            {['Онлайн', 'Офлайн'].map((f) => (
              <button
                key={f}
                className={`chip ${filters.format === f ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, format: f })}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Стоимость</label>
          <div className="chips-row">
            {['Бесплатно', 'Платно'].map((p) => (
              <button
                key={p}
                className={`chip ${filters.price === p ? 'active' : ''}`}
                onClick={() => setFilters({ ...filters, price: p })}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="pushkin-toggle">
          <span>Пушкинская карта</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={filters.pushkinCard}
              onChange={() => setFilters({ ...filters, pushkinCard: !filters.pushkinCard })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="modal-actions">
          <button className="reset-btn" onClick={handleReset}>Сбросить</button>
          <button className="apply-btn" onClick={handleApply}>Применить</button>
        </div>
      </div>
    </div>
  );
};

export default FiltersModal;