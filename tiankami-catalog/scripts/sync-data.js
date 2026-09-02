import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";
import {
  normalizeGames,
  normalizeCollections,
  extractHyperlinkParts,
  isUrl,
  extractSteamAppId,
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

const { SPREADSHEET_ID, GAMES_SHEET_NAME, GAMES_URL, COLLECTIONS_URL } =
  await import("../src/config/dataSources.js");

// Для серверных запросов (sync) нужен ОТДЕЛЬНЫЙ ключ без Websites-ограничения:
// браузерный ключ с ограничением по рефереру всегда даёт 403 из Node.
// Серверный ключ хранится в .env и никогда не попадает в клиентский бандл.
const SERVER_SHEETS_API_KEY = process.env.SHEETS_API_KEY_SERVER || "";
const SHEETS_URL = (range) =>
  `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(`${GAMES_SHEET_NAME}!${range}`)}?key=${SERVER_SHEETS_API_KEY}&valueRenderOption=FORMULA`;

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

/**
 * Достаёт steamAppId из гиперссылок через Sheets API (ссылка вшита
 * в название игры и теряется при TSV-экспорте). Ровно 1 запрос за
 * запуск — правило PROJECT_BRIEF п.7.
 * Обложка и ссылка на Steam строятся из appid на лету (runtime).
 * YouTube/МИ-ссылки здесь НЕ достаём: их проверка авторства (noembed)
 * допустима только в браузере посетителя.
 */
async function enrichFromSheetsApi(games) {
  if (!SERVER_SHEETS_API_KEY) {
    console.log(
      "Sheets API пропущен: нет SHEETS_API_KEY_SERVER в .env (см. README)",
    );
    return games;
  }
  try {
    // API может быть недоступен из некоторых сетей (DPI) — таймаут + 2 повтора,
    // чтобы sync никогда не зависал. Без успеха — просто работаем без appid.
    let response = null;
    for (let attempt = 0; attempt < 3 && !response; attempt++) {
      try {
        response = await fetch(SHEETS_URL("A:Z"), {
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        if (attempt === 2) throw new Error("нет связи с sheets.googleapis.com");
      }
    }
    if (!response.ok) throw new Error(`Sheets API: ${response.status}`);
    const json = await response.json();
    const rows = json.values || [];

    const steamByTitle = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] || [];
      // Ячейки могут быть не строками (числа, bool) — приводим к строке
      const title = (row.find((c) => String(c ?? "").trim()) || "")
        .toString()
        .trim();
      if (!title) continue;
      for (const cell of row) {
        const { url } = extractHyperlinkParts(String(cell ?? ""));
        if (
          isUrl(url) &&
          /steampowered\.com/i.test(url) &&
          !steamByTitle[title]
        ) {
          steamByTitle[title] = url;
        }
      }
    }

    let added = 0;
    const enriched = games.map((g) => {
      const appId = extractSteamAppId(steamByTitle[g.title] || "");
      if (!appId) return g;
      added++;
      return { ...g, steamAppId: appId };
    });
    console.log(`Steam appid: ${added} из ${games.length} игр`);
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
