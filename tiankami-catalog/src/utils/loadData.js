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
  extractHyperlinkParts,
  isUrl,
  isYouTubeUrl,
  extractSteamAppId,
  steamHeaderUrl,
} from "./normalize.js";

/* ─────────── Обогащение игр из локального JSON ─────────── */

/**
 * Добавляет обложки и Steam-ссылки из steamAppId, уже записанных в games.json.
 */
function enrichFromLocalJson(games) {
  return games.map((g) => {
    if (!g.steamAppId) return g;
    return {
      ...g,
      image: steamHeaderUrl(g.steamAppId),
      steamUrl: `https://store.steampowered.com/app/${g.steamAppId}/`,
    };
  });
}

/* ─────────── Кэш (ключ привязан к URL: смена таблицы сбрасывает кэш сама) ─────────── */

function hashUrl(url) {
  let h = 5381;
  for (let i = 0; i < url.length; i++)
    h = ((h << 5) + h + url.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const CACHE_KEY = `tiankami_games_v4_${hashUrl(GAMES_URL)}`;
const CACHE_TIME_KEY = `${CACHE_KEY}_time`;
const COLLECTIONS_CACHE_KEY = `tiankami_collections_v4_${hashUrl(COLLECTIONS_URL)}`;
const COLLECTIONS_CACHE_TIME_KEY = `${COLLECTIONS_CACHE_KEY}_time`;
const LINKS_CACHE_KEY = `tiankami_links_v4_${hashUrl(GAMES_URL)}`;
const NOEMBED_LIMIT = 20; // жёсткий лимит проверок авторства за сессию
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
      // Ячейки могут быть не строками (числа, bool) — приводим к строке
      const title = (row.find((c) => String(c ?? "").trim()) || "")
        .toString()
        .trim();
      if (!title) continue;

      const entry = {};
      for (const cell of row) {
        const { url, label } = extractHyperlinkParts(String(cell ?? ""));
        if (!isUrl(url)) continue;
        if (isYouTubeUrl(url)) {
          // У игры бывает две YouTube-ссылки: плейлист прохождения и выпуск МИ.
          // Различаем по подписи в таблице (колонки «гуляют», подпись надёжнее).
          if (/ми|выпуск/i.test(label) ? !entry.miVideo : !entry.youtube) {
            entry[/ми|выпуск/i.test(label) ? "miVideo" : "youtube"] = url;
          }
        }
        if (/steampowered\.com/i.test(url)) {
          if (!entry.steam) entry.steam = url;
        }
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

  // Собираем уникальные YouTube-ссылки (плейлисты + МИ), которых нет в кэше
  const uniqueUrls = new Set();
  games.forEach((g) => {
    const l = links[g.title];
    [l?.youtube, l?.miVideo].forEach((u) => {
      if (u && isYouTubeUrl(u) && authorCache[u] === undefined) {
        uniqueUrls.add(u);
      }
    });
  });

  // Жёсткий лимит проверок за сессию (правило PROJECT_BRIEF п.7):
  // непроверенные ссылки в этот заход не показываем, попадут в следующий.
  const urls = [...uniqueUrls].slice(0, NOEMBED_LIMIT);
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
    const appId = l ? extractSteamAppId(l.steam || "") : null;
    const steamAppId = g.steamAppId || appId; // из sync-JSON или из таблицы
    const next = { ...g };
    if (steamAppId) {
      next.image = steamHeaderUrl(steamAppId); // обложка строится из appid
      next.steamUrl = `https://store.steampowered.com/app/${steamAppId}/`;
    }
    if (l?.youtube && isYouTubeUrl(l.youtube) && authorCache[l.youtube]) {
      next.youtube = l.youtube;
    }
    if (l?.miVideo && isYouTubeUrl(l.miVideo) && authorCache[l.miVideo]) {
      next.miVideo = l.miVideo;
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
    const cached = tryLoadCache(CACHE_KEY, CACHE_TIME_KEY, isValidGamesCache);
    memoryGames = cached || enrichFromLocalJson(localGames);
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
}
