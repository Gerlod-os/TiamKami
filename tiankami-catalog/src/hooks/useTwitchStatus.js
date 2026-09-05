import { useEffect, useState } from "react";
import { BRAND } from "../config/branding.js";
import { safeGet, safeSet } from "../utils/storage.js";

const STATUS_TTL = 5 * 60 * 1000;
const AVATAR_TTL = 24 * 60 * 60 * 1000;

export default function useTwitchStatus() {
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let cancelled = false;

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
      let title = "";
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

  const refresh = () => setState({ loading: true });

  return { ...state, refresh };
}
