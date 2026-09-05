import { useEffect, useState } from "react";
import { BRAND } from "../config/branding.js";
import { safeGet, safeSet } from "../utils/storage.js";

const STATUS_TTL = 5 * 60 * 1000;
const AVATAR_TTL = 24 * 60 * 60 * 1000;

// Глобальный сброс кэша Twitch (вызывается из FxPanel)
window.__tkResetTwitchCache = () => {
  safeSet("tk_status", "offline");
  safeSet("tk_status_time", "0");
  safeSet("tk_avatar", "");
  safeSet("tk_avatar_time", "0");
  window.dispatchEvent(new Event("tk-twitch-cache-reset"));
};

export default function TwitchWidgetInHero() {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;

    // Слушаем сброс кэша из FxPanel
    const onCacheReset = () => {
      if (!cancelled) setState({ loading: true });
    };
    window.addEventListener("tk-twitch-cache-reset", onCacheReset);

    const load = async () => {
      let avatar = safeGet("tk_avatar");
      const avatarTime = parseInt(safeGet("tk_avatar_time") || "0");
      if (!avatar || Date.now() - avatarTime > AVATAR_TTL) {
        try {
          const res = await fetch(
            `https://decapi.me/twitch/avatar/${BRAND.twitchLogin}`,
            { signal: AbortSignal.timeout(8000) },
          );
          if (res.ok) {
            const url = (await res.text()).trim();
            if (url.startsWith("http")) {
              avatar = url;
              safeSet("tk_avatar", url);
              safeSet("tk_avatar_time", String(Date.now()));
            }
          }
        } catch { /* остаёмся с заглушкой */ }
      }

      let live = false, title = "";
      const statusTime = parseInt(safeGet("tk_status_time") || "0");
      const cachedStatus = safeGet("tk_status");
      if (cachedStatus !== null && Date.now() - statusTime < STATUS_TTL) {
        live = cachedStatus === "live";
      } else {
        try {
          const res = await fetch(
            `https://decapi.me/twitch/status/${BRAND.twitchLogin}`,
            { signal: AbortSignal.timeout(8000) },
          );
          if (res.ok) {
            const text = await res.text();
            live = text.trim() !== "" && text.trim().toLowerCase() !== "offline";
            title = live ? text.trim() : "";
            safeSet("tk_status", live ? "live" : "offline");
            safeSet("tk_status_time", String(Date.now()));
          }
        } catch { /* показываем заглушку */ }
      }

      if (!cancelled) setState({ loading: false, live, title, avatar });
    };

    load();
    return () => {
      cancelled = true;
      window.removeEventListener("tk-twitch-cache-reset", onCacheReset);
    };
  }, []);

  const { loading, live, title, avatar } = state;

  return (
    <div className="flex items-center gap-3">
      {/* Аватарка */}
      <div className="relative shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={BRAND.name}
            className="w-10 h-10 rounded-full border-2 border-[var(--accent-purple)]/50"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[var(--accent-purple)]/30 flex items-center justify-center text-lg">
            🎮
          </div>
        )}
        {live && (
          <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[9px] font-bold px-1 py-0.5 rounded-md uppercase">
            Live
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-white/60 text-xs">Twitch</p>
        {loading ? (
          <p className="text-white/50 text-xs">Проверяем…</p>
        ) : live ? (
          <>
            <p className="text-white text-sm font-heading truncate max-w-[200px]" title={title}>
              {title || "В эфире!"}
            </p>
            <a
              href={BRAND.links.twitch}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-pink)] hover:text-white text-xs transition-colors inline-block mt-0.5"
            >
              Смотреть →
            </a>
          </>
        ) : (
          <>
            <p className="text-white/70 text-xs">Канал оффлайн</p>
            <a
              href={BRAND.links.twitch}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-[var(--accent-pink)] text-xs transition-colors inline-block mt-0.5"
            >
              Заглянуть →
            </a>
          </>
        )}
      </div>
    </div>
  );
}
