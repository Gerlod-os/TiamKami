import { useEffect, useState } from "react";
import { BRAND } from "../config/branding.js";
import { safeGet, safeSet } from "../utils/storage.js";

// Кэш: статус 5 минут, аватар 24 часа (ОБЩИЙ с TwitchWidgetInHero)
const STATUS_TTL = 5 * 60 * 1000;
const AVATAR_TTL = 24 * 60 * 60 * 1000;

export default function TwitchHeaderWidget() {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;

    // Слушаем сброс кэша из FxPanel
    const onCacheReset = () => {
      if (!cancelled) setState({ loading: true });
    };
    window.addEventListener("tk-twitch-cache-reset", onCacheReset);

    const load = async () => {
      // Аватарка: раз в сутки (общий кэш)
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

      // Статус: раз в 5 минут (общий кэш)
      let live = false;
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
            live =
              text.trim() !== "" && text.trim().toLowerCase() !== "offline";
            safeSet("tk_status", live ? "live" : "offline");
            safeSet("tk_status_time", String(Date.now()));
          }
        } catch { /* показываем заглушку */ }
      }

      if (!cancelled) setState({ loading: false, live, avatar });
    };

    load();
    return () => {
      cancelled = true;
      window.removeEventListener("tk-twitch-cache-reset", onCacheReset);
    };
  }, []);

  const { loading, live, avatar } = state;

  return (
    <a
      href={BRAND.links.twitch}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 hover:scale-110 transition-transform duration-200"
      aria-label="Twitch канал"
      title={live ? "Сейчас в эфире!" : "Twitch канал"}
    >
      {/* Аватарка 28x28 */}
      {avatar ? (
        <img
          src={avatar}
          alt=""
          className="w-7 h-7 rounded-full border border-[var(--accent-purple)]/30"
          loading="lazy"
        />
      ) : (
        <div
          className="w-7 h-7 rounded-full bg-[var(--accent-purple)]/30 flex items-center justify-center text-sm"
          aria-hidden="true"
        >
          🎮
        </div>
      )}
      {/* Индикатор */}
      <span
        className={`w-2 h-2 rounded-full ${
          loading
            ? "bg-white/30"
            : live
              ? "bg-red-500 animate-pulse"
              : "bg-white/30"
        }`}
        aria-hidden="true"
      />
    </a>
  );
}
