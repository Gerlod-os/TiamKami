/**
 * Единый нормализатор данных. Импортируется и в loadData.js (runtime),
 * и в scripts/sync-data.js (build-time), чтобы исключить рассинхрон.
 */

import { slugify, uniqueSlug } from "./slugify.js";

// Единый справочник статусов. Владелец таблицы пишет «Жду релиз»,
// сайт приводит к «Жду релиза» — сверка посимвольно не ломается.
const STATUS_ALIASES = {
  "жду релиз": "Жду релиза",
  "жду релиза": "Жду релиза",
  "жду": "Жду релиза",
  "не начал": "Не начал",
  "в паузе": "В паузе",
  пройдено: "Пройдено",
  дропнуто: "Дропнуто",
  обзор: "Обзор",
  "в процессе": "В процессе",
};

export function normalizeStatus(raw) {
  const s = (raw || "").trim();
  const normalized = STATUS_ALIASES[s.toLowerCase()];
  if (normalized) return normalized;
  // Если не нашли — приводим к нормальному регистру (первая буква заглавная)
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Нормализует одну строку из TSV (без заголовка) в объект игры.
 * @param {string[]} row — массив значений строки
 * @param {number[]} colIndex — маппинг [title, image, genre, ...]
 * @returns {object|null}
 */
export function normalizeGameRow(row, colIndex) {
  if (!row) return null;

  const title = (row[colIndex.title] || "").trim();
  if (!title) return null;

  return {
    title,
    image: (row[colIndex.image] || "").trim(),
    genre: (row[colIndex.genre] || "").trim(),
    features: (row[colIndex.features] || "").trim(),
    setting: (row[colIndex.setting] || "").trim(),
    complexity: (row[colIndex.complexity] || "").trim(),
    hours: (row[colIndex.hours] || "").trim(),
    status: normalizeStatus(row[colIndex.status]),
    progress: (row[colIndex.progress] || "").trim(),
    rating: (row[colIndex.rating] || "").trim(),
    releaseDate: (row[colIndex.releaseDate] || "").trim(),
    playedDate: (row[colIndex.playedDate] || "").trim(),
    notes: (row[colIndex.notes] || "").trim(),
    youtube: (row[colIndex.youtube] || "").trim(),
    hasMI: (row[colIndex.hasMI] || "").trim(),
    miVideo: (row[colIndex.miVideo] || "").trim(),
  };
}

/**
 * Вычисляет индексы колонок из строки заголовков.
 * @param {string[]} headerRow
 * @param {string[]} [firstDataRow] — первая строка данных (уточняет поиск колонки названия)
 */
export function buildColIndex(headerRow, firstDataRow) {
  const idx = {};
  headerRow.forEach((cell, i) => {
    const key = (cell || "").trim();
    if (key) idx[key] = i;
  });

  // Название: сначала ищем явный заголовок "Название" (из колонки B/C),
  // потом эвристика — пустой заголовок с данными.
  let titleIdx = -1;
  let titleWasShifted = false;
  // 1. Явный заголовок
  if (idx["Название"] !== undefined) {
    titleIdx = idx["Название"];
    // В Google Sheets заголовок "Название" объединён с ячейкой картинки
    // (merged cells). Заголовок в колонке B, данные — в колонке C.
    // Проверяем: если в колонке заголовка данные пустые — сдвигаем на +1.
    if (
      firstDataRow &&
      firstDataRow[titleIdx] !== undefined &&
      !firstDataRow[titleIdx].trim()
    ) {
      titleIdx++;
      titleWasShifted = true;
    }
  } else {
    // 2. Эвристика: колонка с пустым заголовком, в которой есть данные.
    // Пропускаем колонку с картинкой — там URL или =IMAGE, а не название.
    for (let i = 0; i < headerRow.length; i++) {
      const headerEmpty = !headerRow[i] || !headerRow[i].trim();
      const dataExists =
        firstDataRow && firstDataRow[i] && firstDataRow[i].trim() !== "";
      if (headerEmpty && dataExists) {
        const firstData = firstDataRow[i].trim();
        // Картинка: URL или формула =IMAGE — пропускаем
        if (/^https?:\/\//i.test(firstData) || /^=IMAGE/i.test(firstData)) continue;
        titleIdx = i;
        break;
      }
    }
  }
  if (titleIdx === -1) titleIdx = 2; // fallback

  // Картинка: если заголовок "Название" найден явно и сдвинут на +1
  // (merged cells), то картинка за 2 колонки до названия.
  // Иначе — за 1 колонку.
  const imageIdx = titleWasShifted && titleIdx > 1
    ? titleIdx - 2
    : titleIdx > 0
      ? titleIdx - 1
      : -1;

  return {
    title: titleIdx,
    image: imageIdx,
    genre: idx["Жанр"] ?? -1,
    features: idx["Особенности"] ?? -1,
    setting: idx["Сеттинг"] ?? -1,
    complexity: idx["Сложность"] ?? -1,
    hours: idx["Наиграно (часы)"] ?? -1,
    status: idx["Статус"] ?? -1,
    progress: idx["Прогресс (%)"] ?? -1,
    rating: idx["Оценка (?/10)"] ?? -1,
    releaseDate: idx["Дата выхода"] ?? -1,
    playedDate: idx["Когда играл"] ?? -1,
    notes: idx["Примечания"] ?? -1,
    youtube: idx["YouTube прохождение"] ?? -1,
    hasMI: idx["Проводил МИ"] ?? -1,
    miVideo: idx["Выпуск МИ"] ?? -1,
  };
}

/**
 * Нормализует массив строк TSV с играми.
 * @param {string[][]} rows
 * @returns {object[]}
 */
export function normalizeGames(rows) {
  if (!rows || rows.length < 2) return [];

  const headerRow = rows[0];
  const colIndex = buildColIndex(headerRow, rows[1]);

  const games = [];
  for (let i = 1; i < rows.length; i++) {
    const game = normalizeGameRow(rows[i], colIndex);
    if (game) games.push(game);
  }

  // Сортировка по названию
  games.sort((a, b) => a.title.localeCompare(b.title, "ru"));

  // Генерируем уникальные слаги
  const usedSlugs = new Set();

  const finalGames = games.map((game) => {
    const baseSlug = slugify(game.title);
    const slug = uniqueSlug(baseSlug, usedSlugs);
    usedSlugs.add(slug);
    return { ...game, slug };
  });

  return finalGames;
}

/**
 * Нормализует массив строк (CSV/TSV) с подборками.
 *
 * В листе колонки «гуляют» от строки к строке (ручной ввод, объединённые
 * ячейки), поэтому колоночная статистика ненадёжна. Алгоритм построчный:
 * для каждой подборки сканируем своё окно колонок, игра = текстовая ячейка,
 * ранг = ближайшее число правее в той же строке.
 */
export function normalizeCollections(rows) {
  if (!rows || rows.length < 2) return [];

  const headerRow = rows[0];
  const isNumeric = (s) => /^\d+([.,]\d+)?$/.test((s || "").trim());

  // Ширина окна подборки: от заголовка до +5 (следующий блок начинается на +4,
  // но его игры — на +6, поэтому +5 не задевает чужие игры)
  const WINDOW_SIZE = 5;
  // Диапазон поиска ранга: числа правее игры (в той же строке, до +4 колонок)
  const RANK_RANGE = 4;

  // Индексы заголовков подборок
  const titleIndices = [];
  headerRow.forEach((cell, idx) => {
    if (cell && cell.trim() !== "") titleIndices.push(idx);
  });

  const collections = [];
  // Генерируем уникальные слаги для подборок
  const usedSlugs = new Set();

  titleIndices.forEach((titleIdx) => {
    const name = headerRow[titleIdx].trim();
    if (!name) return;

    // Окно подборки: от колонки заголовка до +WINDOW_SIZE
    const minCol = titleIdx;
    const maxCol = titleIdx + WINDOW_SIZE;

    // Описание: текст в первой строке данных в колонке заголовка
    let description = "";
    const underTitle = ((rows[1] || [])[titleIdx] || "").trim();
    if (underTitle && !isNumeric(underTitle)) description = underTitle;

    const games = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      // Игра: первая текстовая ячейка в окне (в первой строке данных
      // колонку заголовка пропускаем — там описание)
      let gameCol = -1;
      for (let c = minCol; c <= maxCol; c++) {
        const v = (row[c] || "").trim();
        if (!v || isNumeric(v)) continue;
        if (i === 1 && c === titleIdx) continue; // это описание
        gameCol = c;
        break;
      }
      if (gameCol === -1) continue;

      // Ранг: ближайшее число правее игры (в той же строке, до +RANK_RANGE колонок)
      let rank = "";
      for (let c = gameCol + 1; c <= gameCol + RANK_RANGE; c++) {
        const v = (row[c] || "").trim();
        if (v && isNumeric(v)) {
          rank = v;
          break;
        }
      }

      games.push({ name: (row[gameCol] || "").trim(), rank });
    }

    if (games.length === 0) return;
    // «ЗОЛОТОЙ СПИСОК» — без рангов намеренно (решение владельца):
    // числа в таблице для него — позиции, а не рейтинги. Гасим всегда.
    if (/золотой список/i.test(name)) {
      games.forEach((g) => (g.rank = ""));
    }

    // Генерируем уникальный slug
    const baseSlug = slugify(name);
    const slug = uniqueSlug(baseSlug, usedSlugs);
    usedSlugs.add(slug);

    collections.push({ name, slug, description, games });
  });

  return collections;
}

/**
 * Проверяет, является ли строка валидной ссылкой.
 */
export function isUrl(value) {
  const s = (value || "").trim();
  return /^https?:\/\//i.test(s);
}

/**
 * Достаёт URL и подпись из формулы гиперссылки Google Sheets.
 * =HYPERLINK("https://...";"текст") → { url: "https://...", label: "текст" }
 * Обычный текст возвращается как есть (потом отфильтруется isUrl).
 */
export function extractHyperlinkParts(cell) {
  const s = (cell || "").trim();
  const m = s.match(/^=HYPERLINK\(\s*"([^"]+)"\s*[;,]\s*"([^"]*)"/i);
  if (m) return { url: m[1], label: m[2] };
  return { url: s, label: "" };
}

/**
 * Проверяет, что ссылка ведёт на YouTube.
 */
export function isYouTubeUrl(url) {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(url || "");
}

/**
 * Извлекает appid из ссылки на Steam.
 * https://store.steampowered.com/app/632360/Risk_of_Rain_2/ → "632360"
 */
export function extractSteamAppId(url) {
  const m = (url || "").match(/store\.steampowered\.com\/app\/(\d+)/i);
  return m ? m[1] : null;
}

/**
 * Извлекает URL из ячейки: plain URL или =HYPERLINK("url","label").
 */
function extractUrlFromCell(cell) {
  const s = (cell || "").toString().trim();
  if (!s) return null;
  // HYPERLINK-формула
  const m = s.match(/^=HYPERLINK\(\s*"([^"]+)"\s*[;,]/i);
  if (m) return m[1];
  // Plain URL
  if (s.startsWith("http")) return s;
  return null;
}

/**
 * Извлекает Steam-ссылки из строки таблицы (колонки C:W в Копии).
 * C=0 (название), U=18 (Steam), V=19 (YouTube), W=20 (МИ).
 * Возвращает объект { title, entry } где entry = { steamAppId, youtube, miVideo }.
 */
export function extractLinksFromCopyRow(row) {
  const title = (row[0] || "").toString().trim();
  if (!title) return null;

  const entry = {};

  // Steam — колонка U (индекс 18 в C:W)
  const steamUrl = extractUrlFromCell(row[18]);
  if (steamUrl) {
    const appId = extractSteamAppId(steamUrl);
    if (appId) entry.steamAppId = appId;
  }

  // YouTube — колонка V (индекс 19 в C:W)
  const ytUrl = extractUrlFromCell(row[19]);
  if (ytUrl) entry.youtube = ytUrl;

  // МИ — колонка W (индекс 20 в C:W)
  const miUrl = extractUrlFromCell(row[20]);
  if (miUrl) entry.miVideo = miUrl;

  return entry.steamAppId || entry.youtube || entry.miVideo
    ? { title, entry }
    : null;
}

/**
 * CDN-обложка Steam по appid (бесплатно, без ключей).
 */
export function steamHeaderUrl(appId) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}

/**
 * Портретная обложка Steam высокого разрешения (600×900).
 * Используется в карточках, модалке и подсказках поиска — где нужен вертикальный кадр.
 */
export function steamCoverUrl(appId) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;
}

/**
 * Извлекает все уникальные сеттинги из списка игр.
 */
export function getAllSettings(games) {
  const settings = new Set();
  games.forEach((game) => {
    if (game.setting) settings.add(game.setting.trim());
  });
  return [...settings].sort();
}

/**
 * Извлекает все уникальные особенности из списка игр.
 * Особенности в поле features разделены запятыми.
 */
export function getAllFeatures(games) {
  const features = new Set();
  games.forEach((game) => {
    if (game.features) {
      game.features.split(",").forEach((f) => {
        const trimmed = f.trim();
        if (trimmed) features.add(trimmed);
      });
    }
  });
  return [...features].sort();
}

/**
 * Извлекает уникальные жанры и годы из списка игр.
 * Кэшируется вместе с играми, чтобы не пересчитывать при каждой ревалидации.
 */
export function getGameMetadata(games) {
  const genres = new Set();
  const years = new Set();

  games.forEach((game) => {
    (game.genre || "").split(",").forEach((g) => {
      const trimmed = g.trim();
      if (trimmed) genres.add(trimmed);
    });
    const match = (game.releaseDate || "").match(/\d{4}/);
    if (match) years.add(match[0]);
  });

  return {
    genres: [...genres].sort(),
    years: [...years].sort(),
  };
}
