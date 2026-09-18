import React, { useState } from 'react';
import { moderateContent, validateAddress, moderateUrl } from '../utils/contentModeration';

const CreateEventForm = ({ onCreate, onCancel, userId, userName }) => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    date: '',
    time: '',
    format: 'Офлайн',
    address: '',
    district: '',
    limit: '',
    description: '',
    image: '',
    lat: null,
    lng: null
  });

  const [errors, setErrors] = useState({});
  const [publicPlaceConfirmed, setPublicPlaceConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    const titleCheck = moderateContent(formData.title);
    if (!titleCheck.isClean) newErrors.title = titleCheck.reason;

    const descCheck = moderateContent(formData.description);
    if (!descCheck.isClean) newErrors.description = descCheck.reason;

    if (formData.format === 'Офлайн') {
      const addrCheck = validateAddress(formData.address);
      if (!addrCheck.isClean) newErrors.address = addrCheck.reason;
    }

    if (formData.image) {
      const urlCheck = moderateUrl(formData.image);
      if (!urlCheck.isClean) newErrors.image = urlCheck.reason;
    }

    if (!formData.title.trim()) newErrors.title = 'Введите название';
    if (!formData.category) newErrors.category = 'Выберите категорию';
    if (!formData.date) newErrors.date = 'Укажите дату';
    if (!formData.time) newErrors.time = 'Укажите время';
    if (formData.format === 'Офлайн' && !formData.address.trim())
      newErrors.address = 'Укажите место';
    if (!publicPlaceConfirmed)
      newErrors.publicPlace = 'Подтвердите, что встреча в общественном месте';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const newEvent = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      price: 'Бесплатно',
      date: `${formData.date}, ${formData.time}`,
      time: formData.time,
      format: formData.format,
      address: formData.format === 'Онлайн' ? 'Онлайн' : formData.address,
      district: formData.format === 'Онлайн' ? 'Онлайн' : formData.district || formData.address,
      maxParticipants: parseInt(formData.limit) || 50,
      participants: 1,
      image:
        formData.image ||
        'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
      lat: formData.lat || 55.796,
      lng: formData.lng || 49.108,
      distance: '0.0 км',
      rating: 0,
      reviewsCount: 0,
      organizer: { id: userId, name: userName || 'Вы', avatar: '👤' }
    };

    try {
      await onCreate(newEvent);
    } catch (e) {
      setErrors({ submit: e.message || 'Ошибка создания события' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-form">
      <h2>Создать событие</h2>
      <p className="form-subtitle">Делитесь идеями. Собирайте людей. Делайте город ярче!</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Название события *</label>
          <input
            className={`form-input ${errors.title ? 'error' : ''}`}
            name="title"
            placeholder="Например, Футбол 5x5, нужны игроки"
            value={formData.title}
            onChange={handleChange}
          />
          {errors.title && <p className="error-text">⚠️ {errors.title}</p>}
        </div>

        <div className="form-group">
          <label>Категория *</label>
          <select
            className={`form-input ${errors.category ? 'error' : ''}`}
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="">Выберите категорию</option>
            <option value="Спорт">Спорт</option>
            <option value="Культура">Культура</option>
            <option value="Настольные игры">Настольные игры</option>
            <option value="Кино">Кино</option>
            <option value="Прогулка">Прогулка</option>
            <option value="Другое">Другое</option>
          </select>
          {errors.category && <p className="error-text">⚠️ {errors.category}</p>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Дата *</label>
            <input
              className={`form-input ${errors.date ? 'error' : ''}`}
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
            {errors.date && <p className="error-text">⚠️ {errors.date}</p>}
          </div>
          <div className="form-group">
            <label>Время *</label>
            <input
              className={`form-input ${errors.time ? 'error' : ''}`}
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
            />
            {errors.time && <p className="error-text">⚠️ {errors.time}</p>}
          </div>
        </div>

        <div className="form-group">
          <label>Формат</label>
          <div className="format-toggle">
            {['Офлайн', 'Онлайн'].map((f) => (
              <button
                key={f}
                type="button"
                className={formData.format === f ? 'active' : ''}
                onClick={() => setFormData({ ...formData, format: f })}
              >
                {f === 'Офлайн' ? '👥 Офлайн' : '💻 Онлайн'}
              </button>
            ))}
          </div>
        </div>

        {formData.format === 'Офлайн' && (
          <>
            <div className="form-group">
              <label>Место проведения *</label>
              <input
                className={`form-input ${errors.address ? 'error' : ''}`}
                name="address"
                placeholder="Например, парк Горького, спортплощадка"
                value={formData.address}
                onChange={handleChange}
              />
              {errors.address && <p className="error-text">⚠️ {errors.address}</p>}
              <p className="hint-text">
                💡 Указывайте общественные места: парки, кафе, спортплощадки
              </p>
            </div>

            <div className="form-group">
              <label>Район (публичный)</label>
              <input
                className="form-input"
                name="district"
                placeholder="Например, Вахитовский район"
                value={formData.district}
                onChange={handleChange}
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label>Лимит участников</label>
          <input
            className="form-input"
            type="number"
            name="limit"
            placeholder="Например, 10"
            value={formData.limit}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Описание</label>
          <textarea
            className={`form-input ${errors.description ? 'error' : ''}`}
            name="description"
            rows="4"
            placeholder="Расскажите подробнее: что будет, для кого, какая атмосфера?"
            value={formData.description}
            onChange={handleChange}
            maxLength={1000}
          ></textarea>
          <p className="char-counter">{formData.description.length}/1000</p>
          {errors.description && <p className="error-text">⚠️ {errors.description}</p>}
        </div>

        <div className="form-group">
          <label>Ссылка на картинку (опционально)</label>
          <input
            className={`form-input ${errors.image ? 'error' : ''}`}
            name="image"
            placeholder="https://..."
            value={formData.image}
            onChange={handleChange}
          />
          {errors.image && <p className="error-text">⚠️ {errors.image}</p>}
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="publicPlace"
            checked={publicPlaceConfirmed}
            onChange={(e) => setPublicPlaceConfirmed(e.target.checked)}
          />
          <label htmlFor="publicPlace">
            Я подтверждаю, что мероприятие проходит в общественном месте и не нарушает закон
          </label>
        </div>
        {errors.publicPlace && <p className="error-text">⚠️ {errors.publicPlace}</p>}

        {errors.submit && <p className="error-text submit-error">⚠️ {errors.submit}</p>}

        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? 'Создаём...' : 'Создать событие'}
        </button>
        <button type="button" className="secondary-btn" onClick={onCancel}>
          Отмена
        </button>
      </form>
    </div>
  );
};

export default CreateEventForm;