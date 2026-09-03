/**
 * Парсит русскую дату DD.MM.YYYY в объект Date.
 * Возвращает null, если строка пустая или невалидная.
 * Учитывает UTC, чтобы избежать сдвига из-за часового пояса.
 */
export function parseRuDate(dateStr) {
  if (!dateStr || !dateStr.trim()) return null;
  const parts = dateStr.trim().split('.');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  if (!day || !month || !year || day.length !== 2 || month.length !== 2 || year.length !== 4) return null;
  
  const dayNum = parseInt(day, 10);
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  // Проверка диапазонов
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) return null;
  
  // Создаём дату в UTC, чтобы избежать сдвига часового пояса
  const d = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
  
  // Проверяем, что дата валидна (JavaScript автоматически корректирует invalid даты)
  if (isNaN(d.getTime())) return null;
  if (d.getUTCDate() !== dayNum || d.getUTCMonth() !== monthNum - 1 || d.getUTCFullYear() !== yearNum) return null;
  
  return d;
}
