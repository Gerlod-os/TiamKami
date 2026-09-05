import useTwitchStatus from "../hooks/useTwitchStatus.js";
import { BRAND } from "../config/branding.js";

export default function TwitchHeaderWidget() {
  const { loading, live, avatar } = useTwitchStatus();

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
