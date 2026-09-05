/**
 * Отправляет событие в Яндекс.Метрику.
 * Вынесено в отдельный модуль, чтобы файл компонента YandexMetrika.jsx
 * экспортировал только компонент (требование fast-refresh).
 * @param {string} eventName — название события
 * @param {object} [params={}] — параметры события
 */
export function trackEvent(eventName, params = {}) {
  if (typeof window.yaCounter112105255 === "undefined") {
    console.warn("[Metrika] Счётчик ещё не загружен:", eventName);
    return;
  }
  window.yaCounter112105255.push(function () {
    yaCounter112105255.hit(eventName, params);
  });
  console.log("[Metrika] Event:", eventName, params);
}
