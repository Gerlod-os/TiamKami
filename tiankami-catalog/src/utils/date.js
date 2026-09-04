/**
 * Парсит русскую дату DD.MM.YYYY или ISO дату YYYY-MM-DD в объект Date.
 * Возвращает null, если строка пустая или невалидная.
 * Учитывает UTC, чтобы избежать сдвига из-за часового пояса.
 */
export function parseRuDate(dateStr) {
  if (!dateStr || !dateStr.trim()) return null;
  const s = dateStr.trim();

  // Формат DD.MM.YYYY
  const ruMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ruMatch) {
    const [_, day, month, year] = ruMatch;
    return createSafeDate(parseInt(year), parseInt(month), parseInt(day));
  }

  // Формат YYYY-MM-DD (HTML date input)
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [_, year, month, day] = isoMatch;
    return createSafeDate(parseInt(year), parseInt(month), parseInt(day));
  }

  return null;
}

/** Создаёт дату в UTC с проверкой валидности. */
function createSafeDate(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(d.getTime())) return null;
  if (d.getUTCDate() !== day || d.getUTCMonth() !== month - 1 || d.getUTCFullYear() !== year) return null;
  return d;
}
