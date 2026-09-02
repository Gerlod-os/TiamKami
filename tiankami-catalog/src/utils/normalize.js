/**
 * Единый нормализатор данных. Импортируется и в loadData.js (runtime),
 * и в scripts/sync-data.js (build-time), чтобы исключить рассинхрон.
 */

// Единый справочник статусов. Владелец таблицы пишет «Жду релиз»,
// сайт приводит к «Жду релиза» — сверка посимвольно не ломается.
const STATUS_ALIASES = {
  "жду релиз": "Жду релиза",
  "жду релиза": "Жду релиза",
  пройдено: "Пройдено",
  дропнуто: "Дропнуто",
  обзор: "Обзор",
};

export function normalizeStatus(raw) {
  const s = (raw || "").trim();
  return STATUS_ALIASES[s.toLowerCase()] || s;
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

  // Название: колонка с пустым заголовком, в которой есть данные
  let titleIdx = -1;
  for (let i = 0; i < headerRow.length; i++) {
    const headerEmpty = !headerRow[i] || !headerRow[i].trim();
    const dataExists =
      firstDataRow && firstDataRow[i] && firstDataRow[i].trim() !== "";
    if (headerEmpty && dataExists) {
      titleIdx = i;
      break;
    }
  }
  if (titleIdx === -1) titleIdx = 2; // fallback

  return {
    title: titleIdx,
    image: titleIdx + 1, // колонка сразу после названия
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
  return games;
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

  // Индексы заголовков подборок
  const titleIndices = [];
  headerRow.forEach((cell, idx) => {
    if (cell && cell.trim() !== "") titleIndices.push(idx);
  });

  const collections = [];
  titleIndices.forEach((titleIdx) => {
    const name = headerRow[titleIdx].trim();
    if (!name) return;

    // Окно подборки: от колонки заголовка до +5 (следующий блок начинается
    // на +4, но его игры — на +6, поэтому +5 не задевает чужие игры)
    const minCol = titleIdx;
    const maxCol = titleIdx + 5;

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

      // Ранг: ближайшее число правее игры (в той же строке, до +4 колонок)
      let rank = "";
      for (let c = gameCol + 1; c <= gameCol + 4; c++) {
        const v = (row[c] || "").trim();
        if (v && isNumeric(v)) {
          rank = v;
          break;
        }
      }

      games.push({ name: (row[gameCol] || "").trim(), rank });
    }

    if (games.length === 0) return;
    collections.push({ name, description, games });
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
 * Достаёт URL из формулы гиперссылки Google Sheets.
 * =HYPERLINK("https://...";"текст") → "https://..."
 * Обычный текст возвращается как есть (потом отфильтруется isUrl).
 */
export function extractUrlFromFormula(cell) {
  const s = (cell || "").trim();
  const m = s.match(/^=HYPERLINK\(\s*"([^"]+)"/i);
  return m ? m[1] : s;
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
 * CDN-обложка Steam по appid (бесплатно, без ключей).
 */
export function steamHeaderUrl(appId) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg`;
}
