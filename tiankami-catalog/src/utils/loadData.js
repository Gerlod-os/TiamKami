import Papa from "papaparse";
import {
  GAMES_URL,
  COLLECTIONS_URL,
  SHEETS_API_KEY,
  SHEETS_API_VALUES_URL,
  COPY_SPREADSHEET_ID,
  COPY_SHEETS_API_VALUES_URL,
  SPREADSHEET_ID,
} from "../config/dataSources.js";
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
import { safeGet, safeSet } from "./storage.js";

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
const CACHE_DURATION = 6 * 60 * 60 * 1000; // TTL кэша: 6 часов
const REVALIDATE_INTERVAL = 15 * 60 * 1000; // сверка с таблицей не чаще раза в 15 минут



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

/* ─────────── Парсинг гиперссылок из строк таблицы ─────────── */

/**
 * Парсит одну строку Google Sheets и собирает { youtube, miVideo, steam }.
 * Название игры берётся из колонки C (индекс 2).
 * В Оригинал это формула =HYPERLINK("url";"label"), в Копии — просто текст.
 * В Копии YouTube и МИ находятся в отдельных колонках (V=21, W=22),
 * используем индекс колонки как первичный маркер, label — как fallback.
 */
function parseLinksFromRow(row) {
  // Название игры — колонка C (индекс 2).
  let rawTitle = (row[2] || "").toString().trim();
  let title = rawTitle;
  if (rawTitle.startsWith("=HYPERLINK")) {
    const m = rawTitle.match(/^=HYPERLINK\(\s*"([^"]+)"\s*[;,]\s*"([^"]*)"/i);
    if (m) title = m[2] || m[1]; // label или url
  }
  if (!title) return null;

  const entry = {};
  row.forEach((cell, colIdx) => {
    const { url } = extractHyperlinkParts(String(cell ?? ""));
    if (!isUrl(url)) return;

    if (/steampowered\.com/i.test(url)) {
      entry.steam = url;
    } else if (isYouTubeUrl(url)) {
      // Индекс колонки — приоритетнее label
      if (colIdx === 22) {
        entry.miVideo = url;       // колонка W — МИ
      } else if (colIdx === 21) {
        entry.youtube = url;       // колонка V — YouTube
      } else if (!entry.miVideo) {
        entry.miVideo = url;       // fallback — первая YouTube-ссылка
      } else if (!entry.youtube) {
        entry.youtube = url;       // fallback — вторая
      }
    }
  });

  if (Object.keys(entry).length === 0) return null;
  return { title, entry };
}

/* ─────────── Публичное API ─────────── */

/**
 * Игры. Стратегия «сначала свои данные, потом сверка»:
 *  1. Мгновенно отдаёт данные из памяти / localStorage / локального JSON (с обложками).
 *  2. В фоне сверяет с Оригинал (TSV) и Копия (ссылки).
 *  3. Если Оригинал отличается (добавили игру, изменили статус) — обновляет только изменения.
 *  4. Если в Оригинал новой игры нет — оставляем как есть.
 */
export async function fetchGames({ onUpdate } = {}) {
  if (!memoryGames) {
    const cached = tryLoadCache(CACHE_KEY, CACHE_TIME_KEY, isValidGamesCache);
    memoryGames = cached || enrichFromLocalJson(localGames);
  }
  revalidateGames(onUpdate);
  return memoryGames;
}

/**
 * Проверяет, изменились ли данные игры (кроме steamAppId/image/steamUrl).
 * Пустые строки и undefined считаются одинаковыми.
 */
function isGameDataChanged(oldGame, newGame) {
  const fields = [
    "genre",
    "features",
    "setting",
    "complexity",
    "hours",
    "status",
    "progress",
    "rating",
    "releaseDate",
    "playedDate",
    "notes",
    "youtube",
    "hasMI",
    "miVideo",
  ];
  return fields.some((f) => {
    const a = oldGame[f] || "";
    const b = newGame[f] || "";
    return a !== b;
  });
}

async function revalidateGames(onUpdate) {
  if (gamesRevalidating) return;
  if (Date.now() - lastGamesCheck < REVALIDATE_INTERVAL) return;
  gamesRevalidating = true;
  lastGamesCheck = Date.now();
  try {
    // 1. Загружаем Оригинал (TSV) — базовые данные (название, жанр, статус и т.д.)
    const rows = await fetchRows(GAMES_URL, "	");
    let freshFromSheets = normalizeGames(rows);
    if (freshFromSheets.length === 0) return;

    // 2. Загружаем Копию — ссылки (steamAppId, youtube, miVideo)
    let copyLinks = {};
    if (SHEETS_API_KEY && COPY_SPREADSHEET_ID !== SPREADSHEET_ID) {
      try {
        const response = await fetch(COPY_SHEETS_API_VALUES_URL("A:Z"));
        if (response.ok) {
          const json = await response.json();
          const copyRows = json.values || [];
          for (let i = 1; i < copyRows.length; i++) {
            const parsed = parseLinksFromRow(copyRows[i]);
            if (parsed) copyLinks[parsed.title] = parsed.entry;
          }
        }
      } catch (e) {
        console.warn(
          "Не удалось загрузить Копию для ссылок, пробуем Оригинал (fallback)...",
          e,
        );
      }
    }

    // 3. Fallback: если Копия не загрузилась — читаем ссылки из Оригинала (формулы =HYPERLINK)
    if (Object.keys(copyLinks).length === 0 && SHEETS_API_KEY) {
      try {
        const response = await fetch(SHEETS_API_VALUES_URL("A:Z"));
        if (response.ok) {
          const json = await response.json();
          const origRows = json.values || [];
          for (let i = 1; i < origRows.length; i++) {
            const parsed = parseLinksFromRow(origRows[i]);
            if (parsed) copyLinks[parsed.title] = parsed.entry;
          }
        }
      } catch (fallbackError) {
        console.warn(
          "Fallback из Оригинала тоже не удался, игры будут без ссылок.",
          fallbackError,
        );
      }
    }

    // 4. Merge: данные из Оригинал + ссылки из Копия (или fallback)
    freshFromSheets = freshFromSheets.map((g) => {
      const links = copyLinks[g.title];
      const next = { ...g };

      if (links) {
        const appId = links.steam ? extractSteamAppId(links.steam) : null;
        if (appId) {
          next.steamAppId = appId;
          next.image = steamHeaderUrl(appId);
          next.steamUrl = `https://store.steampowered.com/app/${appId}/`;
        }
        if (links.youtube) next.youtube = links.youtube;
        if (links.miVideo) next.miVideo = links.miVideo;
      }

      return next;
    });

    // 4. Обновляем memoryGames: добавляем новые, обновляем изменённые, сохраняем обложки
    const oldByTitle = {};
    memoryGames.forEach((m) => (oldByTitle[m.title.toLowerCase()] = m));

    const updatedGames = [];

    freshFromSheets.forEach((newGame) => {
      const oldGame = oldByTitle[newGame.title.toLowerCase()];
      if (oldGame) {
        // Игра уже есть — обновляем только если данные изменились
        if (isGameDataChanged(oldGame, newGame)) {
          // Сохраняем обложку из старой версии (она уже есть в oldGame.image)
          updatedGames.push({
            ...newGame,
            image: oldGame.image || newGame.image,
            steamUrl: oldGame.steamUrl || newGame.steamUrl,
            steamAppId: oldGame.steamAppId || newGame.steamAppId,
          });
        } else {
          updatedGames.push(oldGame);
        }
      } else {
        // Новая игра — добавляем
        updatedGames.push(newGame);
      }
    });

    // 5. Удаляем игры, которых нет в Оригинал (опционально)
    const freshTitles = new Set(
      freshFromSheets.map((g) => g.title.toLowerCase()),
    );
    const keptGames = updatedGames.filter((g) =>
      freshTitles.has(g.title.toLowerCase()),
    );

    if (JSON.stringify(keptGames) !== JSON.stringify(memoryGames)) {
      memoryGames = keptGames;
      safeSet(CACHE_KEY, JSON.stringify(keptGames));
      safeSet(CACHE_TIME_KEY, String(Date.now()));
      onUpdate?.(keptGames);
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
  } catch {}
  memoryGames = null;
  memoryCollections = null;
  lastGamesCheck = 0;
  lastCollectionsCheck = 0;
}
