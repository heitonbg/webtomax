import { MOCK_EVENTS } from '../data/mockEvents';

// Флаг: используем локальные моки или реальный API
const USE_MOCK = true;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let localEvents = [...MOCK_EVENTS];

export const fetchEvents = async (filters = {}) => {
  if (USE_MOCK) {
    // Имитация сети
    await new Promise((r) => setTimeout(r, 150));
    return localEvents;
  }
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_URL}/events?${params}`);
  if (!res.ok) throw new Error('Ошибка загрузки событий');
  return res.json();
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
  const res = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Ошибка создания события');
  }
  return res.json();
};

export const joinEvent = async (eventId, userId) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 100));
    localEvents = localEvents.map((e) =>
      e.id === eventId ? { ...e, participants: e.participants + 1 } : e
    );
    return { success: true };
  }
  const res = await fetch(`${API_URL}/events/${eventId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) throw new Error('Ошибка присоединения');
  return res.json();
};

export const reportEvent = async (eventId, reason, reporterId) => {
  if (USE_MOCK) {
    console.log('[Report]', { eventId, reason, reporterId });
    return { success: true };
  }
  const res = await fetch(`${API_URL}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventId, reason, reporterId })
  });
  return res.json();
};
