import Papa from 'papaparse';
import { GAMES_URL, COLLECTIONS_URL } from '../config/dataSources.js';
import localGames from '../data/games.json';
import localCollections from '../data/collections.json';
import { normalizeGames, normalizeCollections } from './normalize.js';

const CACHE_KEY = 'tiankami_games_v1';
const CACHE_TIME_KEY = 'tiankami_cache_time_v1';
const CACHE_DURATION = 4 * 60 * 60 * 1000;
const COLLECTIONS_CACHE_KEY = 'tiankami_collections_v1';
const COLLECTIONS_CACHE_TIME_KEY = 'tiankami_collections_time_v1';
const COLLECTIONS_CACHE_DURATION = 4 * 60 * 60 * 1000;

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

let gamesPromise = null;
let collectionsPromise = null;

function isValidGamesCache(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) && parsed.length > 0 && parsed[0].title;
  } catch { return false; }
}

function isValidCollectionsCache(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch { return false; }
}

async function fetchFromServer(url, normalizer) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  const text = await response.text();
  const result = Papa.parse(text, { delimiter: '\t', header: false, skipEmptyLines: false });
  return normalizer(result.data);
}

function tryLoadCache(cacheKey, timeKey, duration, validator) {
  const cached = safeGet(cacheKey);
  const cachedTime = safeGet(timeKey);
  if (cached && cachedTime && validator(cached) && (Date.now() - parseInt(cachedTime) < duration)) {
    return JSON.parse(cached);
  }
  return null;
}

export async function fetchGames() {
  if (gamesPromise) return gamesPromise;

  gamesPromise = (async () => {
    try {
      const cached = tryLoadCache(CACHE_KEY, CACHE_TIME_KEY, CACHE_DURATION, isValidGamesCache);
      if (cached) return cached;

      const data = await fetchFromServer(GAMES_URL, normalizeGames);
      if (data.length > 0) {
        safeSet(CACHE_KEY, JSON.stringify(data));
        safeSet(CACHE_TIME_KEY, String(Date.now()));
        return data;
      }
    } catch (error) {
      console.warn('Не удалось загрузить игры с сервера, использую кэш или локальные данные.', error);
    }

    const cached = safeGet(CACHE_KEY);
    if (cached && isValidGamesCache(cached)) return JSON.parse(cached);
    return localGames;
  })();

  setTimeout(() => { gamesPromise = null; }, CACHE_DURATION);
  return gamesPromise;
}

export async function fetchCollections() {
  if (collectionsPromise) return collectionsPromise;

  collectionsPromise = (async () => {
    try {
      const cached = tryLoadCache(COLLECTIONS_CACHE_KEY, COLLECTIONS_CACHE_TIME_KEY, COLLECTIONS_CACHE_DURATION, isValidCollectionsCache);
      if (cached) return cached;

      const data = await fetchFromServer(COLLECTIONS_URL, normalizeCollections);
      if (data.length > 0) {
        safeSet(COLLECTIONS_CACHE_KEY, JSON.stringify(data));
        safeSet(COLLECTIONS_CACHE_TIME_KEY, String(Date.now()));
        return data;
      }
    } catch (error) {
      console.warn('Не удалось загрузить подборки с сервера, использую кэш или локальные данные.', error);
    }

    const cached = safeGet(COLLECTIONS_CACHE_KEY);
    if (cached && isValidCollectionsCache(cached)) return JSON.parse(cached);
    return localCollections;
  })();

  setTimeout(() => { collectionsPromise = null; }, COLLECTIONS_CACHE_DURATION);
  return collectionsPromise;
}

export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
    localStorage.removeItem(COLLECTIONS_CACHE_KEY);
    localStorage.removeItem(COLLECTIONS_CACHE_TIME_KEY);
  } catch {}
  gamesPromise = null;
  collectionsPromise = null;
}
