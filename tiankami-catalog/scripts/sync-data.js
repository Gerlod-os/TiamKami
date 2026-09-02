import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";
import { GAMES_URL, COLLECTIONS_URL } from "../src/config/dataSources.js";
import {
  normalizeGames,
  normalizeCollections,
} from "../src/utils/normalize.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "src", "data");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

async function fetchAndParse(url, delimiter = "	") {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const text = await response.text();
  return Papa.parse(text, {
    delimiter,
    header: false,
    skipEmptyLines: false,
  }).data;
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
    const collectionsRows = await fetchAndParse(COLLECTIONS_URL, ",");
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
