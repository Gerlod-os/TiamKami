import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";
import {
  normalizeGames,
  normalizeCollections,
} from "../src/utils/normalize.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env читает только Vite (import.meta.env) — в чистом Node его нет.
// Парсим ДО импорта конфига: статические import'ы в ESM поднимаются вверх
// и выполнились бы раньше этого кода, поэтому конфиг импортируем динамически.
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.+)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

const { GAMES_SHEET_NAME, GAMES_URL, COLLECTIONS_URL, COPY_SPREADSHEET_ID } =
  await import("../src/config/dataSources.js");

const SERVER_SHEETS_API_KEY = process.env.SHEETS_API_KEY_SERVER || "";

// КОПИЯ таблицы: там Apps Script заполнил Steam/YouTube/МИ ссылки
const COPY_SHEETS_URL = (range) =>
  `https://sheets.googleapis.com/v4/spreadsheets/${COPY_SPREADSHEET_ID}/values/${encodeURIComponent(`${GAMES_SHEET_NAME}!${range}`)}?key=${SERVER_SHEETS_API_KEY}&valueRenderOption=UNFORMATTED_VALUE`;

const dataDir = path.join(__dirname, "..", "src", "data");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

async function fetchAndParse(url, delimiter = "\t") {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  const text = await response.text();
  return Papa.parse(text, {
    delimiter,
    header: false,
    skipEmptyLines: false,
  }).data;
}

/**
 * Достаёт Steam/YouTube/МИ из КОПИИ таблицы.
 * ЧИТАЕТ колонки C:W — название + Steam + YouTube + МИ.
 * Сопоставляет по названию из колонки C.
 */
async function enrichFromSheetsApi(games) {
  if (!SERVER_SHEETS_API_KEY) {
    console.log(
      "Sheets API пропущен: нет SHEETS_API_KEY_SERVER в .env (см. README)",
    );
    return games;
  }
  try {
    let response = null;
    for (let attempt = 0; attempt < 3 && !response; attempt++) {
      try {
        response = await fetch(COPY_SHEETS_URL("C:W"), {
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        if (attempt === 2) throw new Error("нет связи с sheets.googleapis.com");
      }
    }
    if (!response.ok) throw new Error(`Sheets API: ${response.status}`);
    const json = await response.json();
    const rows = json.values || [];

    const linksByTitle = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      // C:W: C=0 (название), U=18 (Steam), V=19 (YouTube), W=20 (МИ)
      const title = (row[0] || "").toString().trim();
      if (!title) continue;

      const steamUrl = (row[18] || "").toString().trim();
      const ytUrl = (row[19] || "").toString().trim();
      const miUrl = (row[20] || "").toString().trim();

      const entry = {};
      const steamMatch = steamUrl.match(/store\.steampowered\.com\/app\/(\d+)/i);
      if (steamMatch) {
        entry.steamAppId = steamMatch[1];
      }
      if (ytUrl && ytUrl.startsWith("http")) {
        entry.youtube = ytUrl;
      }
      if (miUrl && miUrl.startsWith("http")) {
        entry.miVideo = miUrl;
      }

      if (Object.keys(entry).length > 0) {
        linksByTitle[title] = entry;
      }
    }

    let added = 0;
    const enriched = games.map((g) => {
      const link = linksByTitle[g.title];
      if (!link) return g;
      added++;
      return { ...g, ...link };
    });

    console.log(`Сопоставлено: ${added} из ${games.length} игр`);
    return enriched;
  } catch (err) {
    console.warn("Sheets API пропущен:", err.message);
    return games;
  }
}

async function sync() {
  ensureDataDir();
  console.log("Скачивание данных с Google Sheets...");

  try {
    const gamesRows = await fetchAndParse(GAMES_URL);
    let games = normalizeGames(gamesRows);
    games = await enrichFromSheetsApi(games);
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
