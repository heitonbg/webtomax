import { MOCK_EVENTS } from '../data/mockEvents.js';
import { isEventOwner } from '../utils/eventOwnership.js';

// Адрес бэкенда
// Для локальной разработки — http://localhost:3001
// Для прода — замените на адрес туннеля (Tuna/ngrok) или деплоя (Amvera/Railway)
const API = 'http://localhost:3001';

// Использовать ли mock-данные, если сервер недоступен
const USE_MOCK = import.meta.env?.VITE_USE_MOCK === 'true';

let localEvents = [...MOCK_EVENTS];

// ============================================
// Базовый fetch с обработкой ошибок
// ============================================
const apiFetch = async (path, options = {}) => {
  const url = `${API}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    let errorMessage = `Ошибка ${res.status}`;
    try {
      const err = await res.json();
      errorMessage = err.error || errorMessage;
    } catch (e) {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return res.status === 204 ? { success: true } : res.json();
};

// ============================================
// Поиск городов (DaData + Nominatim)
// ============================================
export const searchCities = async (query) => {
  if (!query || query.trim().length < 2) {
    return { cities: [], sources: [] };
  }

  try {
    const params = new URLSearchParams({ q: query });
    return await apiFetch(`/api/cities/search?${params}`);
  } catch (e) {
    console.warn('City search failed:', e.message);
    return { cities: [], sources: [] };
  }
};

// ============================================
// Обратное геокодирование (координаты → адрес)
// ============================================
export const reverseGeocode = async (lat, lng) => {
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng)
  });
  return apiFetch(`/api/cities/reverse?${params}`);
};

// ============================================
// События
// ============================================
export const fetchEvents = async ({ city = 'Казань' } = {}) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return localEvents;
  }

  try {
    const params = new URLSearchParams({ city });
    return await apiFetch(`/api/events?${params}`);
  } catch (e) {
    console.warn('⚠️  Сервер недоступен, используем mock:', e.message);
    return localEvents;
  }
};

export const createEvent = async (eventData) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    const newEvent = {
      ...eventData,
      id: Date.now(),
      participants: 1,
      rating: 0,
      reviewsCount: 0,
      createdAt: new Date().toISOString()
    };
    localEvents = [newEvent, ...localEvents];
    return newEvent;
  }

  return apiFetch('/api/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
};

export const joinEvent = async (eventId, userId) => {
  if (USE_MOCK) {
    if (isEventOwner(localEvents.find((e) => e.id === eventId), userId)) {
      throw new Error('Организатор не может записаться на своё событие');
    }
    await new Promise((r) => setTimeout(r, 100));
    localEvents = localEvents.map((e) =>
      e.id === eventId ? { ...e, participants: e.participants + 1 } : e
    );
    return { success: true };
  }
  return apiFetch(`/api/events/${eventId}/join`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
};

export const leaveEvent = async (eventId, userId) => {
  if (USE_MOCK) {
    if (isEventOwner(localEvents.find((e) => e.id === eventId), userId)) {
      throw new Error('Организатор не может отказаться от своего события');
    }
    await new Promise((r) => setTimeout(r, 100));
    localEvents = localEvents.map((e) =>
      e.id === eventId
        ? { ...e, participants: Math.max(0, e.participants - 1) }
        : e
    );
    return { success: true };
  }
  return apiFetch(`/api/events/${eventId}/leave`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
};

export const deleteEvent = async (eventId, userId) => {
  if (USE_MOCK) {
    const event = localEvents.find((e) => e.id === eventId);
    if (!event) throw new Error('Событие уже удалено');
    if (!isEventOwner(event, userId)) {
      throw new Error('Удалить событие может только организатор');
    }
    localEvents = localEvents.filter((e) => e.id !== eventId);
    return { success: true };
  }
  return apiFetch(`/api/events/${eventId}`, {
    method: 'DELETE',
    body: JSON.stringify({ userId })
  });
};

export const reportEvent = async (eventId, reason, reporterId) => {
  if (USE_MOCK) {
    console.log('[Report]', { eventId, reason, reporterId });
    return { success: true };
  }
  return apiFetch('/api/reports', {
    method: 'POST',
    body: JSON.stringify({ eventId, reason, reporterId })
  });
};

export const checkHealth = async () => {
  try {
    return await apiFetch('/health');
  } catch (e) {
    console.warn('Health check failed:', e.message);
    return { status: 'error', message: e.message };
  }
};

// ============================================
// Загрузка фотографий на сервер
// ============================================
export const uploadPhotos = async (files) => {
  if (!files || !files.length) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));

  const res = await fetch(`${API}/api/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error('Не удалось загрузить фотографии');
  }

  const data = await res.json();
  return data.urls || [];
};

// ============================================
// Полный URL для картинок с сервера
// ============================================
export const resolveImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${API}${path}`;
};