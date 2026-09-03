/**
 * Утилита stale-while-revalidate для фоновой сверки данных.
 * Используется в loadData.js для игр и подборок.
 */

import { safeGet, safeSet } from "./storage.js";

const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 часов
const REVALIDATE_INTERVAL = 15 * 60 * 1000; // 15 минут

/**
 * Создаёт SWR-хранилище для конкретного ключа.
 * @param {string} key — уникальный ключ (например "games" или "collections")
 * @returns {object}
 */
function createSwrStore(key) {
  return {
    memory: null,
    lastCheck: 0,
    revalidating: false,

    get cacheKey() {
      return `tk_cache_${key}`;
    },
    get cacheTimeKey() {
      return `tk_cache_${key}_time`;
    },
  };
}

/**
 * Проверяет валидность кэша.
 */
function isValidCache(cacheKey, timeKey, validator) {
  const cached = safeGet(cacheKey);
  const cachedTime = safeGet(timeKey);
  if (
    cached &&
    cachedTime &&
    validator(cached) &&
    Date.now() - parseInt(cachedTime) < CACHE_DURATION
  ) {
    return JSON.parse(cached);
  }
  return null;
}

/**
 * Запускает фоновую ревалидацию.
 * @param {object} store — SWR-хранилище
 * @param {string} cacheKey
 * @param {string} timeKey
 * @param {Function} validator — функция валидации кэша
 * @param {Function} fetcher — асинхронная функция, возвращающая свежие данные
 * @param {Function} onUpdate — колбак при обновлении
 * @returns {Promise<void>}
 */
export async function swrRevalidate(
  store,
  cacheKey,
  timeKey,
  validator,
  fetcher,
  onUpdate,
) {
  if (store.revalidating) return;
  if (Date.now() - store.lastCheck < REVALIDATE_INTERVAL) return;

  store.revalidating = true;
  store.lastCheck = Date.now();

  try {
    const fresh = await fetcher();
    if (!fresh) return;

    // Если данные изменились — обновляем
    const changed = !JSON.stringify(fresh) === !JSON.stringify(store.memory);
    if (changed || !store.memory) {
      store.memory = fresh;
      safeSet(cacheKey, JSON.stringify(fresh));
      safeSet(timeKey, String(Date.now()));
      onUpdate?.(fresh);
    }
  } catch (error) {
    console.warn(`SWR revalidate failed for ${cacheKey}:`, error);
  } finally {
    store.revalidating = false;
  }
}

/**
 * Создаёт SWR-хук для загрузки данных.
 * @param {Function} fetcher — асинхронная функция загрузки
 * @param {string} cacheKey
 * @param {string} timeKey
 * @param {Function} validator
 * @returns {Function} — асинхронная функция с { onUpdate }
 */
export function createSwrLoader(fetcher, cacheKey, timeKey, validator) {
  const store = createSwrStore(cacheKey);

  return async function swrFetch({ onUpdate } = {}) {
    if (!store.memory) {
      const cached = isValidCache(cacheKey, timeKey, validator);
      store.memory = cached;
    }
    swrRevalidate(store, cacheKey, timeKey, validator, fetcher, onUpdate);
    return store.memory;
  };
}
