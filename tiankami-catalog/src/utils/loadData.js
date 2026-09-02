import Papa from "papaparse";
import {
  GAMES_URL,
  COLLECTIONS_URL,
  SHEETS_API_KEY,
  SHEETS_API_VALUES_URL,
} from "../config/dataSources.js";
import { BRAND } from "../config/branding.js";
import localGames from "../data/games.json";
import localCollections from "../data/collections.json";
import {
  normalizeGames,
  normalizeCollections,
  extractUrlFromFormula,
  isUrl,
  isYouTubeUrl,
  extractSteamAppId,
  steamHeaderUrl,
} from "./normalize.js";

/* ─────────── Кэш (ключ привязан к URL: смена таблицы сбрасывает кэш сама) ─────────── */

function hashUrl(url) {
  let h = 5381;
  for (let i = 0; i < url.length; i++)
    h = ((h << 5) + h + url.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const CACHE_KEY = `tiankami_games_v3_${hashUrl(GAMES_URL)}`;
const CACHE_TIME_KEY = `${CACHE_KEY}_time`;
const COLLECTIONS_CACHE_KEY = `tiankami_collections_v3_${hashUrl(COLLECTIONS_URL)}`;
const COLLECTIONS_CACHE_TIME_KEY = `${COLLECTIONS_CACHE_KEY}_time`;
const LINKS_CACHE_KEY = `tiankami_links_v3_${hashUrl(GAMES_URL)}`;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // TTL кэша: 6 часов
const REVALIDATE_INTERVAL = 15 * 60 * 1000; // сверка с таблицей не чаще раза в 15 минут

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

/* ─────────── Состояние в памяти (мгновенный источник) ─────────── */

let memoryGames = null;
let memoryCollections = null;
let lastGamesCheck = 0;
let lastCollectionsCheck = 0;
let gamesRevalidating = false;
let collectionsRevalidating = false;

/* ─────────── Валидация кэша ─────────── */

function isValidGamesCache(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) && parsed.length > 0 && parsed[0].title;
  } catch {
    return false;
  }
}

function isValidCollectionsCache(jsonStr) {
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) && parsed.length > 0;
  } catch {
    return false;
  }
}

/* ─────────── Загрузка с сервера ─────────── */

async function fetchRows(url, delimiter) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
  const text = await response.text();
  return Papa.parse(text, { delimiter, header: false, skipEmptyLines: false })
    .data;
}

/* ─────────── Гиперссылки через Sheets API (опционально) ─────────── */

/**
 * Достаёт гиперссылки из таблицы (YouTube-плейлисты, выпуски МИ, Steam).
 * Работает только если задан SHEETS_API_KEY. Без ключа — тихо пропускаем.
 * Формулы =HYPERLINK("url";"текст") читаем через valueRenderOption=FORMULA.
 */
async function fetchHyperlinks() {
  if (!SHEETS_API_KEY) return null;

  // Кэш ссылок на сутки — не дёргаем API на каждый чих
  const cached = safeGet(LINKS_CACHE_KEY);
  const cachedTime = safeGet(`${LINKS_CACHE_KEY}_time`);
  if (
    cached &&
    cachedTime &&
    Date.now() - parseInt(cachedTime) < CACHE_DURATION
  ) {
    try {
      return JSON.parse(cached);
    } catch {
      /* перезагрузим */
    }
  }

  try {
    const response = await fetch(SHEETS_API_VALUES_URL("A:Z"));
    if (!response.ok) throw new Error(`Sheets API: ${response.status}`);
    const json = await response.json();
    const rows = json.values || [];

    const links = {}; // title -> { youtube, miVideo, steam }
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      // Название — первая непустая ячейка строки (в master-таблице это колонка A)
      const title = (row.find((c) => (c || "").trim()) || "").trim();
      if (!title) continue;

      const entry = {};
      for (const cell of row) {
        const url = extractUrlFromFormula(cell);
        if (!isUrl(url)) continue;
        if (isYouTubeUrl(url) && !entry.youtube) entry.youtube = url;
        if (/steampowered\.com/i.test(url) && !entry.steam) entry.steam = url;
      }
      if (Object.keys(entry).length > 0) links[title] = entry;
    }

    safeSet(LINKS_CACHE_KEY, JSON.stringify(links));
    safeSet(`${LINKS_CACHE_KEY}_time`, String(Date.now()));
    return links;
  } catch (error) {
    console.warn("Не удалось получить гиперссылки из Sheets API.", error);
    return null;
  }
}

/**
 * Обогащает игры ссылками и обложками:
 *  - YouTube-плейлисты / МИ: только ссылки с канала стримера (по имени автора);
 *  - Steam: обложка с CDN по appid из ссылки в таблице.
 * Проверка автора канала делается через бесплатный noembed (без ключей),
 * результат кэшируется в localStorage.
 */
export async function enrichGamesWithLinks(games) {
  const links = await fetchHyperlinks();
  if (!links) return games;

  // Кэш проверок авторства YouTube-ссылок
  let authorCache = {};
  try {
    authorCache = JSON.parse(safeGet("tiankami_yt_authors") || "{}");
  } catch {}

  const checkAuthor = async (url) => {
    if (authorCache[url] !== undefined) return authorCache[url];
    try {
      const res = await fetch(
        `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
      );
      const json = await res.json();
      const ok =
        json.author_name &&
        json.author_name
          .toLowerCase()
          .includes(BRAND.youtubeChannelName.toLowerCase());
      authorCache[url] = ok;
      return ok;
    } catch {
      return true; // при сбое проверки не отрезаем ссылку
    }
  };

  // Собираем уникальные YouTube-ссылки, которых нет в кэше
  const uniqueUrls = new Set();
  games.forEach((g) => {
    const l = links[g.title];
    if (
      l?.youtube &&
      isYouTubeUrl(l.youtube) &&
      authorCache[l.youtube] === undefined
    ) {
      uniqueUrls.add(l.youtube);
    }
  });

  // Проверяем параллельно, не больше 8 одновременно
  const urls = [...uniqueUrls];
  let idx = 0;
  const workers = Array.from({ length: Math.min(8, urls.length) }, async () => {
    while (idx < urls.length) {
      const u = urls[idx++];
      await checkAuthor(u);
    }
  });
  await Promise.all(workers);
  safeSet("tiankami_yt_authors", JSON.stringify(authorCache));

  // Применяем
  return games.map((g) => {
    const l = links[g.title];
    if (!l) return g;
    const next = { ...g };
    if (l.youtube && isYouTubeUrl(l.youtube) && authorCache[l.youtube]) {
      next.youtube = l.youtube;
    }
    if (l.steam) {
      const appId = extractSteamAppId(l.steam);
      if (appId) next.image = steamHeaderUrl(appId);
    }
    return next;
  });
}

/* ─────────── Публичное API ─────────── */

/**
 * Игры. Стратегия «сначала свои данные, потом сверка»:
 *  1. Мгновенно отдаёт данные из памяти / localStorage / локального JSON.
 *  2. В фоне сверяет с мастер-таблицей (не чаще раза в 15 минут).
 *  3. Если таблица отличается — обновляет кэш и вызывает onUpdate(свежие),
 *     интерфейс перерисовывается без перезагрузки.
 */
export async function fetchGames({ onUpdate } = {}) {
  if (!memoryGames) {
    memoryGames =
      tryLoadCache(CACHE_KEY, CACHE_TIME_KEY, isValidGamesCache) || localGames;
  }
  revalidateGames(onUpdate);
  return memoryGames;
}

async function revalidateGames(onUpdate) {
  if (gamesRevalidating) return;
  if (Date.now() - lastGamesCheck < REVALIDATE_INTERVAL) return;
  gamesRevalidating = true;
  lastGamesCheck = Date.now();
  try {
    const rows = await fetchRows(GAMES_URL, "	");
    let fresh = normalizeGames(rows);
    if (fresh.length === 0) return;
    fresh = await enrichGamesWithLinks(fresh);
    if (JSON.stringify(fresh) !== JSON.stringify(memoryGames)) {
      memoryGames = fresh;
      safeSet(CACHE_KEY, JSON.stringify(fresh));
      safeSet(CACHE_TIME_KEY, String(Date.now()));
      onUpdate?.(fresh);
    }
  } catch (error) {
    console.warn(
      "Фоновая сверка игр не удалась, показываю локальные данные.",
      error,
    );
  } finally {
    gamesRevalidating = false;
  }
}

/** Подборки — та же стратегия. */
export async function fetchCollections({ onUpdate } = {}) {
  if (!memoryCollections) {
    memoryCollections =
      tryLoadCache(
        COLLECTIONS_CACHE_KEY,
        COLLECTIONS_CACHE_TIME_KEY,
        isValidCollectionsCache,
      ) || localCollections;
  }
  revalidateCollections(onUpdate);
  return memoryCollections;
}

async function revalidateCollections(onUpdate) {
  if (collectionsRevalidating) return;
  if (Date.now() - lastCollectionsCheck < REVALIDATE_INTERVAL) return;
  collectionsRevalidating = true;
  lastCollectionsCheck = Date.now();
  try {
    const rows = await fetchRows(COLLECTIONS_URL, ",");
    const fresh = normalizeCollections(rows);
    if (fresh.length === 0) return;
    if (JSON.stringify(fresh) !== JSON.stringify(memoryCollections)) {
      memoryCollections = fresh;
      safeSet(COLLECTIONS_CACHE_KEY, JSON.stringify(fresh));
      safeSet(COLLECTIONS_CACHE_TIME_KEY, String(Date.now()));
      onUpdate?.(fresh);
    }
  } catch (error) {
    console.warn(
      "Фоновая сверка подборок не удалась, показываю локальные данные.",
      error,
    );
  } finally {
    collectionsRevalidating = false;
  }
}

function tryLoadCache(cacheKey, timeKey, validator) {
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

/** Полный сброс кэша (кнопка «Обновить данные»). */
export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
    localStorage.removeItem(COLLECTIONS_CACHE_KEY);
    localStorage.removeItem(COLLECTIONS_CACHE_TIME_KEY);
    localStorage.removeItem(LINKS_CACHE_KEY);
    localStorage.removeItem(`${LINKS_CACHE_KEY}_time`);
  } catch {}
  memoryGames = null;
  memoryCollections = null;
  lastGamesCheck = 0;
  lastCollectionsCheck = 0;
  memoryGames = null;
  memoryCollections = null;
  lastGamesCheck = 0;
  lastCollectionsCheck = 0;
}
