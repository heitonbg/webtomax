// src/utils/citySearch.js
import RAW_CITIES from '../data/russianCities.json';
import { getRegionName } from '../data/ruRegions';

// ============================================
// НОРМАЛИЗАЦИЯ
// ============================================
const normalize = (str) =>
  String(str || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]/g, '');

// Обогащаем города сразу — добавляем regionName
const CITIES = RAW_CITIES.map((c) => ({
  ...c,
  regionName: getRegionName(c.region),
}));

// ============================================
// ИНДЕКСЫ
// ============================================
const byFirstLetter = new Map();   // 'к' → [...]
const byPrefix2 = new Map();       // 'ка' → [...]
const byExactName = new Map();     // 'казань' → [...]

// Топ-60 городов по населению — для пустого запроса
const TOP_CITIES = [...CITIES]
  .sort((a, b) => (b.population || 0) - (a.population || 0))
  .slice(0, 60);

(function buildIndexes() {
  for (const city of CITIES) {
    const norm = normalize(city.name);
    if (!norm) continue;

    const first = norm[0];
    if (!byFirstLetter.has(first)) byFirstLetter.set(first, []);
    byFirstLetter.get(first).push(city);

    if (norm.length >= 2) {
      const p2 = norm.slice(0, 2);
      if (!byPrefix2.has(p2)) byPrefix2.set(p2, []);
      byPrefix2.get(p2).push(city);
    }

    if (!byExactName.has(norm)) byExactName.set(norm, []);
    byExactName.get(norm).push(city);
  }
})();

// ============================================
// ПОИСК
// ============================================
export function searchCities(query, limit = 50) {
  const q = normalize(query);
  if (!q) return TOP_CITIES.slice(0, limit);

  let pool;
  if (q.length === 1) {
    pool = byFirstLetter.get(q[0]) || [];
  } else {
    pool = byPrefix2.get(q.slice(0, 2)) || [];
  }

  const results = [];

  for (const city of pool) {
    const name = normalize(city.name);
    if (!name.includes(q)) continue;

    let score = 0;
    if (name === q) score = 10000;
    else if (name.startsWith(q)) score = 5000;
    else score = 1000 - name.indexOf(q);

    score += Math.log10((city.population || 0) + 1) * 100;

    if (city.type === 'столица') score += 500;
    else if (city.type === 'город') score += 200;
    else if (city.type === 'пгт') score += 50;

    results.push({ city, score });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit).map((r) => r.city);
}

export function findCityByName(name) {
  const n = normalize(name);
  const list = byExactName.get(n);
  if (!list || !list.length) return null;
  return [...list].sort((a, b) => (b.population || 0) - (a.population || 0))[0];
}

export function getTopCities(limit = 20) {
  return TOP_CITIES.slice(0, limit);
}

export function getAllCities() {
  return CITIES;
}

// Для отладки
export function getCityCount() {
  return CITIES.length;
}