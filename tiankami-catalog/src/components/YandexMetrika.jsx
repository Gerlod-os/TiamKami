import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Яндекс.Метрика — внедряет скрипт и отслеживает переходы по страницам.
 * Метрика подключена через Vercel (домен tiankami.vercel.app).
 * ID метрики: 112105255
 */

/**
 * Отправляет событие в Яндекс.Метрику.
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

export default function YandexMetrika() {
  const location = useLocation();

  useEffect(() => {
    // Внедряем скрипт Метрики
    window.yaCounter112105255 = window.yaCounter112105255 || [];
    window.yaCounter112105255.push(function () {
      yaCounter112105255.hit(location.pathname);
    });
  }, [location.pathname]);

  // Этот компонент ничего не рендерит — только отслеживает переходы
  return null;
}
