/**
 * ИСТОЧНИКИ ДАННЫХ.
 *
 * Как сменить таблицу: замени SPREADSHEET_ID на ID новой таблицы
 * (это часть URL между /d/ и /edit). Листы ищутся автоматически:
 *  - лист игр: по gid (GAMES_GID)
 *  - лист подборок: по имени (COLLECTIONS_SHEET_NAME)
 * Подробная инструкция — в README.md.
 */

// ID мастер-таблицы (оригинал, доступ только на чтение — этого достаточно)
export const SPREADSHEET_ID = "16-b4LC_n2g1pq2fVGkUJyRsq9xklzlRpIwVH5Gv3C4U";

// Название листа с играми (точно как в таблице). Указываем по имени,
// а не по gid, чтобы Sheets API гарантированно читал нужный лист:
// первым в таблице идёт «Статистика», а не игры.
export const GAMES_SHEET_NAME = "Все рогалики";

// gid листа с играми (для экспорта TSV)
export const GAMES_GID = "0";

// Имя листа с подборками (точно как в таблице)
export const COLLECTIONS_SHEET_NAME = "Подборки от Тиана";

/**
 * Google Sheets API ключ (опционально).
 * Нужен ТОЛЬКО для вытаскивания гиперссылок (YouTube-плейлисты, выпуски МИ,
 * Steam-ссылки), которые теряются при обычном экспорте TSV.
 * Без ключа сайт полностью работает, но ссылки будут текстом из таблицы.
 * Как получить ключ — README.md, раздел «API-ключ Google (ссылки и обложки)».
 * После создания ключа ограничь его: только Sheets API + домен сайта.
 */
export const SHEETS_API_KEY =
  (typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_SHEETS_API_KEY) ||
  // В чистом Node (sync-скрипт) import.meta.env нет — берём из process.env
  // (sync-data.js сам парсит .env, т.к. Vite его туда не подкладывает).
  (typeof process !== "undefined" && process.env?.VITE_SHEETS_API_KEY) ||
  "";

// Прямые URL для обычной загрузки (работают без ключа)
export const GAMES_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=tsv&gid=${GAMES_GID}`;
export const COLLECTIONS_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(COLLECTIONS_SHEET_NAME)}`;

// URL для Sheets API (достаём формулы гиперссылок — строго с листа игр)
export const SHEETS_API_VALUES_URL = (range) =>
  `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(`${GAMES_SHEET_NAME}!${range}`)}?key=${SHEETS_API_KEY}&valueRenderOption=FORMULA`;
