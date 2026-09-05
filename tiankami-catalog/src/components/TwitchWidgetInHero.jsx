import useTwitchStatus from "../hooks/useTwitchStatus.js";
import { BRAND } from "../config/branding.js";
import { safeGet, safeSet } from "../utils/storage.js";

// Глобальный сброс кэша Twitch (вызывается из FxPanel)
window.__tkResetTwitchCache = () => {
  safeSet("tk_status", "offline");
  safeSet("tk_status_time", "0");
  safeSet("tk_avatar", "");
  safeSet("tk_avatar_time", "0");
  window.dispatchEvent(new Event("tk-twitch-cache-reset"));
};

export default function TwitchWidgetInHero() {
  const { loading, live, title, avatar } = useTwitchStatus();

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
