import { MOCK_EVENTS } from '../data/mockEvents.js';
import { isEventOwner } from '../utils/eventOwnership.js';

const API = import.meta.env?.VITE_API_URL || 'http://localhost:3001';
const USE_MOCK = import.meta.env?.VITE_USE_MOCK !== 'false';

let localEvents = [...MOCK_EVENTS];
const localJoins = new Map(); // eventId -> Set(userId)

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  if (!res.ok) {
    let errorMessage = `Ошибка ${res.status}`;
    try { errorMessage = (await res.json()).error || errorMessage; } catch {}
    throw new Error(errorMessage);
  }
  return res.status === 204 ? { success: true } : res.json();
};

export const fetchEvents = async (filters = {}) => {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return localEvents;
  }
  const params = new URLSearchParams(filters).toString();
  return apiFetch(params ? `/api/events?${params}` : '/api/events');
};

export const fetchJoinedIds = async (userId) => {
  if (USE_MOCK) {
    const ids = [];
    for (const [eventId, users] of localJoins.entries()) {
      if (users.has(String(userId))) ids.push(eventId);
    }
    return ids;
  }
  const data = await apiFetch(`/api/events/joined?userId=${encodeURIComponent(userId)}`);
  return data.eventIds || [];
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
  return apiFetch('/api/events', { method: 'POST', body: JSON.stringify(eventData) });
};

export const updateEvent = async (eventId, eventData, userId) => {
  if (USE_MOCK) {
    const current = localEvents.find((e) => e.id === eventId);
    if (!current) throw new Error('Событие не найдено');
    if (!isEventOwner(current, userId)) throw new Error('Редактировать может только организатор');
    await new Promise((r) => setTimeout(r, 150));
    const updated = { ...current, ...eventData, id: eventId };
    localEvents = localEvents.map((e) => (e.id === eventId ? updated : e));
    return updated;
  }
  return apiFetch(`/api/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify({ ...eventData, userId })
  });
};

export const joinEvent = async (eventId, userId) => {
  if (USE_MOCK) {
    const event = localEvents.find((e) => e.id === eventId);
    if (!event) throw new Error('Событие не найдено');
    if (isEventOwner(event, userId)) throw new Error('Организатор не может записаться на своё событие');
    if (event.maxParticipants && event.participants >= event.maxParticipants) {
      throw new Error('Мест больше нет');
    }
    if (!localJoins.has(eventId)) localJoins.set(eventId, new Set());
    if (localJoins.get(eventId).has(String(userId))) throw new Error('Вы уже участвуете');
    await new Promise((r) => setTimeout(r, 100));
    localJoins.get(eventId).add(String(userId));
    localEvents = localEvents.map((e) =>
      e.id === eventId ? { ...e, participants: e.participants + 1 } : e
    );
    const updated = localEvents.find((e) => e.id === eventId);
    return { success: true, participants: updated.participants };
  }
  return apiFetch(`/api/events/${eventId}/join`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
};

export const leaveEvent = async (eventId, userId) => {
  if (USE_MOCK) {
    const event = localEvents.find((e) => e.id === eventId);
    if (!event) throw new Error('Событие не найдено');
    if (isEventOwner(event, userId)) throw new Error('Организатор не может отказаться от своего события');
    if (!localJoins.get(eventId)?.has(String(userId))) throw new Error('Вы не участвуете');
    await new Promise((r) => setTimeout(r, 100));
    localJoins.get(eventId).delete(String(userId));
    localEvents = localEvents.map((e) =>
      e.id === eventId ? { ...e, participants: Math.max(0, e.participants - 1) } : e
    );
    const updated = localEvents.find((e) => e.id === eventId);
    return { success: true, participants: updated.participants };
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
    if (!isEventOwner(event, userId)) throw new Error('Удалить событие может только организатор');
    localEvents = localEvents.filter((e) => e.id !== eventId);
    localJoins.delete(eventId);
    return { success: true };
  }
  return apiFetch(`/api/events/${eventId}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE'
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

export const uploadImages = async (files) => {
  if (USE_MOCK) {
    return Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.readAsDataURL(file);
          })
      )
    );
  }
  const fd = new FormData();
  files.forEach((f) => fd.append('photos', f));
  const res = await fetch(`${API}/api/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Не удалось загрузить фото');
  const data = await res.json();
  return (data.urls || []).map((u) => `${API}${u}`);
};

export const checkHealth = async () => {
  try { return await apiFetch('/health'); }
  catch (e) { return { status: 'error', message: e.message }; }
};