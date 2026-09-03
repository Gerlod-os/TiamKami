import { useEffect, useState, useRef } from "react";
import { FaCog, FaVolumeUp, FaMousePointer, FaPalette } from "react-icons/fa";
import { safeGet, safeSet } from "../utils/storage.js";

// Секретная панелька: звуки, кастомный курсор и переключатель тем. По умолчанию выключено.
// Состояние хранится в localStorage. Звуки — короткие синтезированные
// бипы через Web Audio API (ноль файлов, ноль запросов, ноль веса).

const SOUND_KEY = "tk_fx_sound";
const CURSOR_KEY = "tk_fx_cursor";
const THEME_KEY = "tk_theme";
const THEMES = [
  { id: "neon", name: "Neon", desc: "Тёмный неон (как на старом)" },
  { id: "pastel", name: "Pastel", desc: "Пастельный мягкий" },
];

// Глобальные хуки для звука: любой компонент может вызвать window.__tkBeep('hover'|'click')
function ensureAudioHooks(onEnabledChange) {
  if (window.__tkBeep) return;
  let ctx = null;
  window.__tkBeep = (type) => {
    if (safeGet(SOUND_KEY) !== "on") return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "click") {
        osc.frequency.value = 520;
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else {
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.02, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      }
    } catch {
      /* аудио недоступно */
    }
  };
  if (onEnabledChange)
    window.__tkFxCursor = () => safeGet(CURSOR_KEY) === "on";
}

export default function FxPanel() {
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(() => safeGet(SOUND_KEY) === "on");
  const [cursor, setCursor] = useState(() => safeGet(CURSOR_KEY) === "on");
  const [theme, setTheme] = useState(() => safeGet(THEME_KEY) || "neon");
  const panelRef = useRef(null);

  // Применяем тему при изменении
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    safeSet(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    ensureAudioHooks();
  }, []);

  // Применяем кастомный курсор к body
  useEffect(() => {
    document.body.style.cursor = cursor
      ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M4 2l16 8-7 2-3 7z' fill='%23FFB6C1' stroke='%23C9A0DC' stroke-width='1.5'/%3E%3C/svg%3E\") 4 2, auto"
      : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [cursor]);

  // Звуки ховера на карточках и кнопках (делегирование, без перегруза)
  useEffect(() => {
    if (!sound) return;
    const handler = (e) => {
      const t = e.target.closest('a, button, [role="button"]');
      if (t) window.__tkBeep?.("hover");
    };
    document.addEventListener("mouseover", handler);
    return () => document.removeEventListener("mouseover", handler);
  }, [sound]);

  // Клик-звук
  useEffect(() => {
    if (!sound) return;
    const handler = (e) => {
      if (e.target.closest('a, button, [role="button"]'))
        window.__tkBeep?.("click");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sound]);

  // Закрытие по Escape и клику вне панели
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const toggle = (which) => {
    if (which === "sound") {
      const next = !sound;
      setSound(next);
      safeSet(SOUND_KEY, next ? "on" : "off");
      if (next) window.__tkBeep?.("click");
    } else if (which === "cursor") {
      const next = !cursor;
      setCursor(next);
      safeSet(CURSOR_KEY, next ? "on" : "off");
    } else if (which === "theme") {
      // Переключаем на следующую тему
      const currentIndex = THEMES.findIndex((t) => t.id === theme);
      const nextIndex = (currentIndex + 1) % THEMES.length;
      setTheme(THEMES[nextIndex].id);
      window.__tkBeep?.("click");
    }
  };

  const resetTwitchCache = () => {
    if (window.__tkResetTwitchCache) {
      window.__tkResetTwitchCache();
    }
  };

  return (
    <div ref={panelRef} className="fixed bottom-4 right-4 z-[90]">
      {open && (
        <div className="mb-2 bg-bg-dark border border-accent-purple/40 rounded-xl p-3 shadow-glow-purple w-52 text-sm space-y-1">
          <p className="text-white/50 text-xs mb-2">Секретные настройки</p>
          <button
            onClick={() => toggle("sound")}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${sound ? "text-accent-pink bg-accent-pink/10" : "text-white/70 hover:bg-white/5"}`}
          >
            <FaVolumeUp /> Звуки {sound ? "вкл" : "выкл"}
          </button>
          <button
            onClick={() => toggle("cursor")}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${cursor ? "text-accent-purple bg-accent-purple/10" : "text-white/70 hover:bg-white/5"}`}
          >
            <FaMousePointer /> Курсор {cursor ? "вкл" : "выкл"}
          </button>
          <button
            onClick={() => toggle("theme")}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-white/70 hover:bg-white/5 hover:text-accent-pink"
          >
            <FaPalette /> Тема: {THEMES.find((t) => t.id === theme)?.name}
          </button>
          <button
            onClick={resetTwitchCache}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors text-white/70 hover:bg-white/5 hover:text-accent-blue"
          >
            🔄 Сброс Twitch кэша
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Секретные настройки"
        data-tip="✨ Секретка"
        role="button"
        className="w-10 h-10 rounded-full bg-bg-dark/80 border border-white/10 text-white/30 hover:text-accent-pink hover:border-accent-pink/50 transition-all flex items-center justify-center"
      >
        <FaCog />
      </button>
    </div>
  );
}
