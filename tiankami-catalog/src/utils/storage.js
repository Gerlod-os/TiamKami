/**
 * Безопасная работа с localStorage.
 * Обёртки с try/catch — если localStorage недоступен (инкогнито, квота),
 * функции не ломают приложение.
 */

export function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage недоступен — молча игнорируем
  }
}
