import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";
import { GAMES_URL, COLLECTIONS_URL } from "../src/config/dataSources.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "src", "data");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

async function fetchAndParse(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const text = await response.text();
  return Papa.parse(text, {
    delimiter: "\t",
    header: false,
    skipEmptyLines: false,
  }).data;
}

function normalizeGames(rows) {
  // Предполагаем, что первая строка – заголовки, но мы парсим без заголовков,
  // поэтому пропускаем первую строку и используем известные индексы
  const games = [];
  if (rows.length < 2) return games;
  const header = rows[0];
  // Определяем индексы на основе заголовков
  const idx = {};
  header.forEach((cell, i) => {
    if (cell && cell.trim() !== "") {
      idx[cell.trim()] = i;
    }
  });
  // Название игры находится в пустой колонке? В нашем случае это колонка с индексом, который не имеет заголовка,
  // но из структуры ранее мы знаем, что название в колонке с индексом 2 (если считать с 0).
  // Для надёжности найдём колонку, где в первой строке данных есть непустое значение, а в заголовке пусто.
  const firstDataRow = rows[1];
  let titleIdx = -1;
  for (let i = 0; i < firstDataRow.length; i++) {
    if (firstDataRow[i] && firstDataRow[i].trim() !== "" && !header[i]) {
      titleIdx = i;
      break;
    }
  }
  if (titleIdx === -1) {
    // fallback: используем индекс 2 (как было ранее)
    titleIdx = 2;
  }
  // Остальные индексы по заголовкам
  const genreIdx = idx["Жанр"] ?? -1;
  const featuresIdx = idx["Особенности"] ?? -1;
  const settingIdx = idx["Сеттинг"] ?? -1;
  const complexityIdx = idx["Сложность"] ?? -1;
  const hoursIdx = idx["Наиграно (часы)"] ?? -1;
  const statusIdx = idx["Статус"] ?? -1;
  const progressIdx = idx["Прогресс (%)"] ?? -1;
  const ratingIdx = idx["Оценка (?/10)"] ?? -1;
  const releaseDateIdx = idx["Дата выхода"] ?? -1;
  const playedDateIdx = idx["Когда играл"] ?? -1;
  const notesIdx = idx["Примечания"] ?? -1;
  const youtubeIdx = idx["YouTube прохождение"] ?? -1;
  const hasMIIdx = idx["Проводил МИ"] ?? -1;
  const miVideoIdx = idx["Выпуск МИ"] ?? -1;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const title = row[titleIdx] ? row[titleIdx].trim() : "";
    if (!title) continue;
    games.push({
      title,
      image: "", // обычно изображение не экспортируется, оставим пустым
      genre: genreIdx >= 0 ? row[genreIdx] || "" : "",
      features: featuresIdx >= 0 ? row[featuresIdx] || "" : "",
      setting: settingIdx >= 0 ? row[settingIdx] || "" : "",
      complexity: complexityIdx >= 0 ? row[complexityIdx] || "" : "",
      hours: hoursIdx >= 0 ? row[hoursIdx] || "" : "",
      status: statusIdx >= 0 ? row[statusIdx] || "" : "",
      progress: progressIdx >= 0 ? row[progressIdx] || "" : "",
      rating: ratingIdx >= 0 ? row[ratingIdx] || "" : "",
      releaseDate: releaseDateIdx >= 0 ? row[releaseDateIdx] || "" : "",
      playedDate: playedDateIdx >= 0 ? row[playedDateIdx] || "" : "",
      notes: notesIdx >= 0 ? row[notesIdx] || "" : "",
      youtube: youtubeIdx >= 0 ? row[youtubeIdx] || "" : "",
      hasMI: hasMIIdx >= 0 ? row[hasMIIdx] || "" : "",
      miVideo: miVideoIdx >= 0 ? row[miVideoIdx] || "" : "",
    });
  }
  // Сортировка по названию
  games.sort((a, b) => a.title.localeCompare(b.title, "ru"));
  return games;
}

function normalizeCollections(rows) {
  if (rows.length < 2) return [];
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
    if (
      order === 0 &&
      secondRow[titleIdx] &&
      secondRow[titleIdx].trim() !== ""
    ) {
      description = secondRow[titleIdx].trim();
    }
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const gameName = row[gameIndex] ? row[gameIndex].trim() : "";
      if (gameName !== "") {
        const rank = row[rankIndex] ? row[rankIndex].trim() : "";
        games.push({ name: gameName, rank });
      }
    }
    collections.push({ name, description, games });
  });
  return collections;
}

async function sync() {
  ensureDataDir();
  console.log("Скачивание данных с Google Sheets...");

  try {
    const gamesRows = await fetchAndParse(GAMES_URL);
    const games = normalizeGames(gamesRows);
    fs.writeFileSync(
      path.join(dataDir, "games.json"),
      JSON.stringify(games, null, 2),
      "utf-8",
    );
    console.log(`Сохранено ${games.length} игр в games.json`);
  } catch (err) {
    console.error("Ошибка загрузки игр:", err.message);
    process.exitCode = 1;
  }

  try {
    const collectionsRows = await fetchAndParse(COLLECTIONS_URL);
    const collections = normalizeCollections(collectionsRows);
    fs.writeFileSync(
      path.join(dataDir, "collections.json"),
      JSON.stringify(collections, null, 2),
      "utf-8",
    );
    console.log(`Сохранено ${collections.length} подборок в collections.json`);
  } catch (err) {
    console.error("Ошибка загрузки подборок:", err.message);
    process.exitCode = 1;
  }
}

sync();
