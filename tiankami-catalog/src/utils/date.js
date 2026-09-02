/**
 * Парсит русскую дату DD.MM.YYYY в объект Date.
 * Возвращает null, если строка пустая или невалидная.
 */
export function parseRuDate(dateStr) {
  if (!dateStr || !dateStr.trim()) return null;
  const parts = dateStr.trim().split('.');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) return null;
  const d = new Date(`${year}-${month}-${day}`);
  return isNaN(d.getTime()) ? null : d;
}
