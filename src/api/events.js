import { MOCK_EVENTS } from '../data/mockEvents.js';
import { isEventOwner } from '../utils/eventOwnership.js';

// ============================================
// АДРЕС СЕРВЕРА
// ============================================
// В dev — локальный сервер
// В production (Vercel) — публичный туннель (Tuna / Railway / ngrok)
const API = import.meta.env.DEV
  ? 'http://localhost:3001'
  : 'https://296zvc-46-180-170-120.ru.tuna.am';

// Использовать моки ТОЛЬКО если явно включено
const USE_MOCK = import.meta.env?.VITE_USE_MOCK === 'true';

// Локальные моковые данные (для оффлайн-режима)
let localEvents = [...MOCK_EVENTS];

// ============================================
// ОБЩИЙ ЗАГОЛОВОК ДЛЯ ВСЕХ ЗАПРОСОВ
// ============================================
// tuna-skip-browser-warning — отключает HTML-предупреждение Tuna,
// которое вставляет свою страницу вместо API-ответа.
const commonHeaders = {
  'Content-Type': 'application/json',
  'tuna-skip-browser-warning': 'true'
};

// ============================================
// ХЕЛПЕР: базовый fetch
// ============================================
const apiFetch = async (path, options = {}) => {
  const url = `${API}${path}`;
  const res = await fetch(url, {
    headers: {
      ...commonHeaders,
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
// GET /api/events — список событий
// city — slug KudaGo ('msk', 'kzn', 'spb', ...)
// source — 'all' | 'local' | 'kudago'
// ============================================
export const fetchEvents = async ({ city = 'kzn', source = 'all' } = {}) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return localEvents;
  }

  try {
    const params = new URLSearchParams({ city, source });
    const data = await apiFetch(`/api/events?${params}`);
    console.log('📡 fetchEvents:', data.length, 'событий для', city);
    return data;
  } catch (e) {
    console.warn('⚠️  Сервер недоступен, используем mock:', e.message);
    return localEvents;
  }
};

// ============================================
// POST /api/events — создать событие
// ============================================
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

// ============================================
// POST /api/events/:id/join — присоединиться
// ============================================
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

// ============================================
// POST /api/events/:id/leave — отказаться
// ============================================
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

// ============================================
// DELETE /api/events/:id — удалить событие
// ============================================
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

// ============================================
// POST /api/reports — отправить жалобу
// ============================================
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

// ============================================
// GET /health — проверка статуса сервера
// ============================================
export const checkHealth = async () => {
  try {
    return await apiFetch('/health');
  } catch (e) {
    console.warn('Health check failed:', e.message);
    return { status: 'error', message: e.message };
  }
};

// ============================================
// POST /api/upload — загрузка фотографий
// @param {File[]} files
// @returns {Promise<string[]>} — массив URL
// ============================================
export const uploadPhotos = async (files) => {
  if (!files || !files.length) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));

  const res = await fetch(`${API}/api/upload`, {
    method: 'POST',
    // ⚠️ Content-Type НЕ указываем — браузер сам выставит multipart/form-data
    // с правильным boundary.
    headers: {
      'tuna-skip-browser-warning': 'true'
    },
    body: formData
  });

  if (!res.ok) {
    throw new Error('Не удалось загрузить фотографии');
  }

  const data = await res.json();
  return data.urls || [];
};

// ============================================
// Возвращает полный URL картинки
// Нужно для отображения фото, загруженных на сервер (path = /uploads/xxx.jpg)
// ============================================
export const resolveImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  return `${API}${path}`;
};
