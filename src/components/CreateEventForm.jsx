import React, { useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { moderateContent, validateAddress, moderateUrl } from '../utils/contentModeration';
import { uploadPhotos, resolveImageUrl } from '../api/events';
import Icon from './Icon';

const CATEGORIES = ['Настольные игры', 'Спорт', 'Культура', 'Кино', 'Прогулка', 'Музыка', 'Другое'];

const CITY_CENTERS = {
  'Казань': { lat: 55.796, lng: 49.108 },
  'Москва': { lat: 55.7558, lng: 37.6176 },
  'Санкт-Петербург': { lat: 59.9343, lng: 30.3351 },
  'Новосибирск': { lat: 55.0084, lng: 82.9357 },
  'Екатеринбург': { lat: 56.8389, lng: 60.6057 },
  'Нижний Новгород': { lat: 56.3269, lng: 44.0059 }
};

const ADDRESS_SUGGESTIONS = [
  { city: 'Казань', address: 'г. Казань, ул. Ленина, 101', district: 'Вахитовский район', lat: 55.792, lng: 49.12 },
  { city: 'Казань', address: 'г. Казань, ул. Кремлёвская, 35', district: 'Вахитовский район', lat: 55.798, lng: 49.106 },
  { city: 'Казань', address: 'г. Казань, Петербургская улица, 1', district: 'Вахитовский район', lat: 55.785, lng: 49.124 },
  { city: 'Казань', address: 'г. Казань, Горкинско-Ометьевский лес', district: 'Советский район', lat: 55.82, lng: 49.12 },
  { city: 'Москва', address: 'г. Москва, ул. Тверская, 12', district: 'Тверской район', lat: 55.761, lng: 37.609 },
  { city: 'Москва', address: 'г. Москва, парк Горького', district: 'Якиманка', lat: 55.729, lng: 37.601 },
  { city: 'Санкт-Петербург', address: 'г. Санкт-Петербург, Невский проспект, 28', district: 'Центральный район', lat: 59.936, lng: 30.325 },
  { city: 'Санкт-Петербург', address: 'г. Санкт-Петербург, Новая Голландия', district: 'Адмиралтейский район', lat: 59.929, lng: 30.289 },
  { city: 'Новосибирск', address: 'г. Новосибирск, Красный проспект, 25', district: 'Центральный район', lat: 55.028, lng: 82.921 },
  { city: 'Екатеринбург', address: 'г. Екатеринбург, ул. Ленина, 24', district: 'Ленинский район', lat: 56.838, lng: 60.603 }
];

const pickerPin = L.divIcon({
  className: 'picker-pin-wrap',
  html: '<div class="picker-pin-dot"></div>',
  iconSize: [28, 38],
  iconAnchor: [14, 38]
});

function PointSelector({ point, onSelect }) {
  useMapEvents({ click: (event) => onSelect(event.latlng) });
  return point ? <Marker position={[point.lat, point.lng]} icon={pickerPin} /> : null;
}

const DURATION_OPTIONS = [
  '30 минут',
  '1 час',
  '1.5 часа',
  '2 часа',
  '3 часа',
  '4 часа',
  'Пол дня',
  'Весь день'
];

const CreateEventForm = ({ onCreate, onCancel, userId, userName, city = 'Казань' }) => {
  const center = CITY_CENTERS[city] || CITY_CENTERS['Казань'];
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    date: '',
    time: '',
    duration: '2 часа',
    format: 'Офлайн',
    price: 'Бесплатно',
    address: '',
    district: '',
    limit: '',
    description: '',
    images: [],
    lat: center.lat,
    lng: center.lng
  });
  const [errors, setErrors] = useState({});
  const [publicPlaceConfirmed, setPublicPlaceConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [draftPoint, setDraftPoint] = useState(null);
  const fileInputRef = useRef(null);

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const chooseSuggestion = (suggestion) => {
    setFormData((prev) => ({ ...prev, ...suggestion }));
    setDraftPoint({ lat: suggestion.lat, lng: suggestion.lng });
    setShowMapPicker(true);
    setShowSuggestions(false);
  };

  const chooseImage = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, 5);
    if (!files.length) return;

    if (files.some((file) => !file.type.startsWith('image/'))) {
      setErrors((prev) => ({ ...prev, image: 'Выберите файл изображения' }));
      return;
    }

    setUploading(true);
    try {
      const urls = await uploadPhotos(files);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...urls].slice(0, 5)
      }));
      setErrors((prev) => ({ ...prev, image: null }));
    } catch (e) {
      setErrors((prev) => ({ ...prev, image: e.message }));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const nextErrors = {};
    const titleCheck = moderateContent(formData.title);
    const descriptionCheck = moderateContent(formData.description);
    if (!titleCheck.isClean) nextErrors.title = titleCheck.reason;
    if (!descriptionCheck.isClean) nextErrors.description = descriptionCheck.reason;
    if (!formData.title.trim()) nextErrors.title = 'Введите название';
    if (!formData.category) nextErrors.category = 'Выберите категорию';
    if (!formData.date) nextErrors.date = 'Укажите дату';
    if (!formData.time) nextErrors.time = 'Укажите время';
    if (formData.format === 'Офлайн') {
      if (!formData.address.trim()) nextErrors.address = 'Укажите место';
      else {
        const addressCheck = validateAddress(formData.address);
        if (!addressCheck.isClean) nextErrors.address = addressCheck.reason;
      }
    }
    if (formData.images[0] && !formData.images[0].startsWith('data:')) {
      const imageCheck = moderateUrl(formData.images[0]);
      if (!imageCheck.isClean) nextErrors.image = imageCheck.reason;
    }
    if (!publicPlaceConfirmed) {
      nextErrors.publicPlace = 'Подтвердите, что встреча проходит в общественном месте';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onCreate({
        ...formData,
        date: `${formData.date}, ${formData.time}`,
        address: formData.format === 'Онлайн' ? 'Онлайн' : formData.address,
        district:
          formData.format === 'Онлайн'
            ? 'Онлайн'
            : formData.district || formData.address,
        maxParticipants: Number.parseInt(formData.limit, 10) || 50,
        participants: 1,
        distance: '0.0 км',
        rating: 0,
        reviewsCount: 0,
        city,
        image:
          formData.images[0] ||
          'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80',
        images: formData.images.length ? formData.images : undefined,
        organizer: { id: userId, name: userName || 'Вы' }
      });
    } catch (error) {
      setErrors({ submit: error.message || 'Не удалось создать событие' });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmPoint = () => {
    if (!draftPoint) return;
    setFormData((prev) => ({
      ...prev,
      lat: draftPoint.lat,
      lng: draftPoint.lng,
      address: prev.address || `Точка на карте, ${city}`,
      district: prev.district || city
    }));
    setShowMapPicker(false);
  };

  return (
    <div className="create-form-v2">
      <div className="create-header">
        <button className="back-btn" onClick={onCancel} aria-label="Назад">
          <Icon name="arrowLeft" size={23} />
        </button>
        <div>
          <h1>Создать событие</h1>
          <p className="create-subtitle">
            Делитесь идеями. Собирайте людей. Делайте город ярче.
          </p>
        </div>
      </div>

      <form onSubmit={submit}>
        {/* Название */}
        <div className="form-group">
          <label>Название события</label>
          <div className={`input-with-icon ${errors.title ? 'error' : ''}`}>
            <span className="input-icon"><Icon name="edit" size={21} /></span>
            <input
              value={formData.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Например, вечер настолок в «Смене»"
            />
          </div>
          {errors.title && <p className="error-text">{errors.title}</p>}
        </div>

        {/* Категория */}
        <div className="form-group">
          <label>Категория</label>
          <div className={`input-with-icon select-wrapper ${errors.category ? 'error' : ''}`}>
            <span className="input-icon"><Icon name="grid" size={21} /></span>
            <select
              value={formData.category}
              onChange={(e) => setField('category', e.target.value)}
            >
              <option value="">Выберите категорию</option>
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
            <Icon name="chevronDown" className="select-chevron" size={18} />
          </div>
          {errors.category && <p className="error-text">{errors.category}</p>}
        </div>

        {/* Дата и время */}
        <div className="form-row-2">
          <div className="form-group">
            <label>Дата</label>
            <div className={`input-with-icon ${errors.date ? 'error' : ''}`}>
              <span className="input-icon"><Icon name="calendar" size={21} /></span>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setField('date', e.target.value)}
              />
            </div>
            {errors.date && <p className="error-text">{errors.date}</p>}
          </div>
          <div className="form-group">
            <label>Время</label>
            <div className={`input-with-icon ${errors.time ? 'error' : ''}`}>
              <span className="input-icon"><Icon name="clock" size={21} /></span>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setField('time', e.target.value)}
              />
            </div>
            {errors.time && <p className="error-text">{errors.time}</p>}
          </div>
        </div>

        {/* Продолжительность */}
        <div className="form-group">
          <label>Продолжительность</label>
          <div className={`input-with-icon select-wrapper`}>
            <span className="input-icon"><Icon name="clock" size={21} /></span>
            <select
              value={formData.duration}
              onChange={(e) => setField('duration', e.target.value)}
            >
              {DURATION_OPTIONS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <Icon name="chevronDown" className="select-chevron" size={18} />
          </div>
        </div>

        {/* Формат */}
        <div className="form-group">
          <label>Формат</label>
          <div className="format-segmented">
            <button
              type="button"
              className={formData.format === 'Офлайн' ? 'active' : ''}
              onClick={() => setField('format', 'Офлайн')}
            >
              <Icon name="people" size={21} />Офлайн
            </button>
            <button
              type="button"
              className={formData.format === 'Онлайн' ? 'active' : ''}
              onClick={() => setField('format', 'Онлайн')}
            >
              <Icon name="monitor" size={21} />Онлайн
            </button>
          </div>
        </div>

        {/* Место */}
        {formData.format === 'Офлайн' && (
          <div className="form-group">
            <label>Место проведения</label>
            <div className={`address-control input-with-icon ${errors.address ? 'error' : ''}`}>
              <span className="input-icon"><Icon name="pin" size={21} /></span>
              <input
                value={formData.address}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
                onChange={(e) => {
                  setField('address', e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Начните вводить адрес"
              />
              {showSuggestions && (
                <div className="address-suggestions">
                  {ADDRESS_SUGGESTIONS.filter(
                    (item) =>
                      item.city === city &&
                      item.address.toLowerCase().includes(formData.address.toLowerCase())
                  ).map((item) => (
                    <button
                      type="button"
                      key={item.address}
                      onMouseDown={() => chooseSuggestion(item)}
                    >
                      <Icon name="pin" size={17} />
                      <span>
                        {item.address}
                        <small>{item.district}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.address && <p className="error-text">{errors.address}</p>}

            <button
              type="button"
              className="map-picker-btn map-picker-full"
              onClick={() => {
                setDraftPoint((point) => point || { lat: formData.lat, lng: formData.lng });
                setShowMapPicker((value) => !value);
              }}
            >
              <Icon name="map" size={21} />
              {showMapPicker ? 'Скрыть карту' : 'Указать на карте'}
            </button>

            {showMapPicker && (
              <div className="inline-location-picker">
                <div className="picker-map">
                  <MapContainer
                    key={`${draftPoint?.lat || formData.lat}-${draftPoint?.lng || formData.lng}`}
                    center={[draftPoint?.lat || formData.lat, draftPoint?.lng || formData.lng]}
                    zoom={14}
                    scrollWheelZoom
                  >
                    <TileLayer
                      attribution="&copy; OpenStreetMap"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <PointSelector point={draftPoint} onSelect={setDraftPoint} />
                  </MapContainer>
                </div>
                <button
                  type="button"
                  className="confirm-map-point"
                  disabled={!draftPoint}
                  onClick={confirmPoint}
                >
                  Готово, сохранить точку
                </button>
              </div>
            )}
            <p className="hint-text-with-icon">
              Выберите адрес из подсказки или нажмите на нужное место на карте.
            </p>
          </div>
        )}

        {/* Лимит */}
        <div className="form-group">
          <label>Лимит участников</label>
          <div className="limit-row">
            <div className="input-with-icon">
              <span className="input-icon"><Icon name="people" size={21} /></span>
              <input
                type="number"
                value={formData.limit}
                onChange={(e) => setField('limit', e.target.value)}
                placeholder="Например, 20"
              />
            </div>
            <span className="limit-hint">
              Оставьте пустым,
              <br />
              если нет ограничений
            </span>
          </div>
        </div>

        {/* Фото */}
        <div className="form-group">
          <label>Фотографии события</label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={chooseImage}
          />
          <div className="image-upload-row">
            <div className="image-preview-strip">
              {formData.images.length ? (
                formData.images.map((image, index) => (
                  <div className="image-preview-item" key={`${image}-${index}`}>
                    <img src={resolveImageUrl(image)} alt={`Фото ${index + 1}`} />
                    <button type="button" onClick={() => removeImage(index)}>
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="image-placeholder">
                  <Icon name="map" size={25} />
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                className="upload-image-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Загрузка...' : 'Добавить фотографии'}
              </button>
              <p>До 5 фото, PNG/JPG/WEBP/GIF</p>
            </div>
          </div>
          {errors.image && <p className="error-text">{errors.image}</p>}
        </div>

        {/* Описание */}
        <div className="form-group">
          <label>Описание</label>
          <div className={`textarea-with-icon ${errors.description ? 'error' : ''}`}>
            <span className="textarea-icon"><Icon name="edit" size={21} /></span>
            <textarea
              rows="5"
              maxLength={1000}
              value={formData.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Расскажите подробнее о событии: что будет и какая атмосфера?"
            />
          </div>
          <p className="char-counter">{formData.description.length}/1000</p>
          {errors.description && <p className="error-text">{errors.description}</p>}
        </div>

        {/* Стоимость */}
        <div className="form-group">
          <label>Стоимость</label>
          <div className="format-segmented">
            {['Бесплатно', 'Платно'].map((price) => (
              <button
                type="button"
                key={price}
                className={formData.price === price ? 'active' : ''}
                onClick={() => setField('price', price)}
              >
                {price}
              </button>
            ))}
          </div>
        </div>

        <div className="checkbox-group">
          <input
            type="checkbox"
            id="publicPlace"
            checked={publicPlaceConfirmed}
            onChange={(e) => setPublicPlaceConfirmed(e.target.checked)}
          />
          <label htmlFor="publicPlace">
            Подтверждаю, что мероприятие проходит в общественном месте
          </label>
        </div>
        {errors.publicPlace && <p className="error-text">{errors.publicPlace}</p>}
        {errors.submit && <p className="error-text submit-error">{errors.submit}</p>}

        <button type="submit" className="submit-btn-v2" disabled={submitting || uploading}>
          {submitting ? 'Создаём...' : 'Создать событие'}
        </button>
      </form>
    </div>
  );
};

export default CreateEventForm;