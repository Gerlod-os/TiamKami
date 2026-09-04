import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";
import {
  normalizeGames,
  normalizeCollections,
  extractLinksFromCopyRow,
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

const { GAMES_SHEET_NAME, GAMES_URL, COLLECTIONS_URL, SCHEDULE_URL, COPY_SPREADSHEET_ID } =
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
      const parsed = extractLinksFromCopyRow(row);
      if (parsed) {
        linksByTitle[parsed.title] = parsed.entry;
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

  // Расписание — CSV с заголовками
  try {
    const response = await fetch(SCHEDULE_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${SCHEDULE_URL}`);
    const text = await response.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    const schedule = parsed.data
      .filter((r) => r.date && r.game)
      .map((r) => {
        // Конвертируем YYYY-MM-DD → DD.MM.YYYY
        const date = r.date.trim();
        const ruDate = date.match(/^\d{4}-\d{2}-\d{2}$/)
          ? (() => { const [y, m, d] = date.split("-"); return `${d}.${m}.${y}`; })()
          : date;
        return {
          date: ruDate,
          time: (r.time || "").trim(),
          game: r.game.trim(),
          streamLink: (r.streamLink || "").trim(),
        };
      })
      .sort((a, b) => {
        const da = parseDateRu(a.date);
        const db = parseDateRu(b.date);
        return da - db;
      });
    fs.writeFileSync(
      path.join(dataDir, "schedule.json"),
      JSON.stringify(schedule, null, 2),
      "utf-8",
    );
    console.log(`Сохранено ${schedule.length} стримов в schedule.json`);
  } catch (err) {
    console.error("Ошибка загрузки расписания:", err.message);
    process.exitCode = 1;
  }
}

/** Парсит дату DD.MM.YYYY или YYYY-MM-DD в Date для сортировки. */
function parseDateRu(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return new Date(9999, 0);
  const s = dateStr.trim();

  // DD.MM.YYYY
  const ruMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ruMatch) {
    const [_, day, month, year] = ruMatch;
    return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
  }

  // YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [_, year, month, day] = isoMatch;
    return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
  }

  return new Date(9999, 0);
}

sync().catch(console.error);
