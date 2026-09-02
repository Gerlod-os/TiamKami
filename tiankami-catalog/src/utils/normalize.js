/**
 * Единый нормализатор данных. Импортируется и в loadData.js (runtime),
 * и в scripts/sync-data.js (build-time), чтобы исключить рассинхрон.
 */

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
    status: (row[colIndex.status] || "").trim(),
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
 * Вычисляет индексы колонок из строки заголовков TSV.
 * @param {string[]} headerRow
 * @returns {object}
 */
export function buildColIndex(headerRow) {
  const idx = {};
  headerRow.forEach((cell, i) => {
    const key = (cell || "").trim();
    if (key) idx[key] = i;
  });

  // Название: первая колонка, где в заголовке пусто, а в первой строке данных — нет
  let titleIdx = -1;
  // Fallback: колонка с пустым заголовком
  for (let i = 0; i < headerRow.length; i++) {
    if (!headerRow[i] || !headerRow[i].trim()) {
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
  const colIndex = buildColIndex(headerRow);

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
 * Нормализует массив строк TSV с подборками.
 * @param {string[][]} rows
 * @returns {object[]}
 */
export function normalizeCollections(rows) {
  if (!rows || rows.length < 2) return [];

  const headerRow = rows[0];
  const headerIndices = [];
  headerRow.forEach((cell, idx) => {
    if (cell && cell.trim() !== "") headerIndices.push(idx);
  });

  const collections = [];
  headerIndices.forEach((titleIdx, order) => {
    const name = headerRow[titleIdx].trim();
    if (!name) return;

    let gameIndex = titleIdx + 1;
    const secondRow = rows[1] || [];
    if (!secondRow[gameIndex] || secondRow[gameIndex].trim() === "") {
      gameIndex = titleIdx + 2;
    }
    const rankIndex = gameIndex + 1;

    const games = [];
    let description = "";
    // Описание берётся из ячейки под названием (только для первой подборки)
    if (
      order === 0 &&
      secondRow[titleIdx] &&
      secondRow[titleIdx].trim() !== ""
    ) {
      description = secondRow[titleIdx].trim();
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const gameName = (row[gameIndex] || "").trim();
      if (gameName !== "") {
        const rank = (row[rankIndex] || "").trim();
        games.push({ name: gameName, rank });
      }
    }

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
