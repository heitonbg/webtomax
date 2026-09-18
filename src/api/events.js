import { MOCK_EVENTS } from '../data/mockEvents';

// ============================================
// ЛОКАЛЬНЫЙ СЕРВЕР
// ============================================
const API = 'http://localhost:3001';

// Отключаем моки — работаем с реальным сервером
const USE_MOCK = false;

let localEvents = [...MOCK_EVENTS];

// ============================================
// ХЕЛПЕР: базовый fetch
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

  return res.json();
};

// ============================================
// GET все события
// ============================================
export const fetchEvents = async (filters = {}) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return localEvents;
  }

  const params = new URLSearchParams(filters).toString();
  const path = params ? `/api/events?${params}` : '/api/events';
  return apiFetch(path);
};

// ============================================
// POST создать событие
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
// POST присоединиться
// ============================================
export const joinEvent = async (eventId, userId) => {
  if (USE_MOCK) {
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
// POST жалоба
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
// GET health-check
// ============================================
export const checkHealth = async () => {
  try {
    return await apiFetch('/health');
  } catch (e) {
    console.warn('Server health check failed:', e.message);
    return { status: 'error', message: e.message };
  }
};
