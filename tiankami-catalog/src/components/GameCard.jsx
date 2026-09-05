import { useState, useCallback, memo } from "react";
import { FaStar, FaSteam, FaCheckCircle, FaSkull, FaSearch, FaClock, FaPlay, FaTrophy } from "react-icons/fa";
import { isUrl } from "../utils/normalize.js";
import { trackEvent } from "./YandexMetrika";

// Пастельные цвета для чипсов жанров
const genreColors = [
  "bg-[var(--accent-pink)] text-[var(--bg-primary)]",
  "bg-[var(--accent-purple)] text-[var(--bg-primary)]",
  "bg-[var(--accent-cyan)] text-[var(--bg-primary)]",
  "bg-[var(--accent-mint)] text-[var(--bg-primary)]",
];

// Иконки статусов (единый справочник с GameDetails)
const statusIcons = {
  "Пройдено": { icon: <FaCheckCircle />, color: "text-green-400", bg: "bg-green-400/20" },
  "Дропнуто": { icon: <FaSkull />, color: "text-red-400", bg: "bg-red-400/20" },
  "Обзор": { icon: <FaSearch />, color: "text-blue-400", bg: "bg-blue-400/20" },
  "Жду релиза": { icon: <FaClock />, color: "text-yellow-400", bg: "bg-yellow-400/20" },
  "В процессе": { icon: <FaPlay />, color: "text-purple-400", bg: "bg-purple-400/20" },
};

function GameCardInner({ game, onClick, onQuickView }) {
  const [imageError, setImageError] = useState(false);

  const handleClick = useCallback(() => {
    trackEvent("Просмотр игры", { title: game.title });
    onClick();
  }, [game.title, onClick]);

  const handleQuickView = useCallback(() => {
    trackEvent("Быстрый просмотр", { title: game.title });
    if (onQuickView) onQuickView();
  }, [game.title, onQuickView]);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  const hasValidImage = isUrl(game.image) && !imageError;
  const genres = (game.genre || "").split(",").map((g) => g.trim()).filter(Boolean);
  const isPerfectRating = game.rating === 10;
  const status = game.status || "";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`${game.title}, ${game.genre || "жанр не указан"}, оценка ${game.rating || "неизвестно"} из 10`}
      className="group bg-gradient-to-br from-[var(--bg-secondary)] to-[var(--bg-primary)] rounded-2xl overflow-hidden border border-white/5 hover:border-[var(--accent-purple)]/30 cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_-10px_var(--accent-purple-alpha)], hover:shadow-[0_0_30px_var(--accent-purple)/0.3] w-full min-w-0"
    >
      {/* Обложка */}
      <div className="relative h-52 sm:h-64 overflow-hidden bg-gradient-to-br from-white/5 to-white/10">
        {hasValidImage ? (
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={handleError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl" aria-hidden="true">🎮</span>
          </div>
        )}

        {/* Затемнение снизу */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Бейдж рейтинга */}
        {game.rating && (
          <div
            className={`absolute top-3 right-3 flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-bold text-xl shadow-lg pointer-events-none transition-transform group-hover:scale-105 ${
              isPerfectRating
                ? "bg-gradient-to-r from-yellow-300 to-amber-500 text-amber-950 shadow-amber-500/30 border-2 border-yellow-400/50 animate-pulse"
                : "bg-[var(--accent-purple)] text-[var(--bg-primary)] shadow-black/20"
            }`}
            aria-label={`Рейтинг: ${game.rating}/10`}
          >
            <FaStar className={isPerfectRating ? "text-amber-950" : "text-[var(--bg-primary)]"} />
            {game.rating}
          </div>
        )}

        {/* МИ бейдж */}
        {game.hasMI && game.hasMI.toLowerCase() === "true" && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-[#121212] px-3 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-amber-500/30 flex items-center gap-1 pointer-events-none">
            <FaTrophy className="text-[10px]" />
            МИ
          </div>
        )}

        {/* Затемнение с кнопкой быстрого просмотра */}
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleQuickView();
            }}
            className="px-6 py-2.5 border-2 border-[var(--accent-pink)] text-[var(--accent-pink)] font-bold rounded-full hover:bg-[var(--accent-pink)] hover:text-[var(--bg-primary)] transition-all pointer-events-auto hover:scale-105 shadow-lg shadow-[var(--accent-pink)]/20"
          >
            Быстрый просмотр
          </button>
        </div>
      </div>

      {/* Контент */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Название */}
        <h3
          className="font-heading text-lg text-white font-bold truncate"
          title={game.title}
        >
          {game.title}
        </h3>

        {/* Жанры-чипсы */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {genres.slice(0, 3).map((genre, index) => (
              <span
                key={genre}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:brightness-110 ${genreColors[index % genreColors.length]}`}
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Сеттинг и особенности */}
        {(game.setting || game.features) && (
          <div className="flex flex-wrap gap-1.5">
            {game.setting && (
              <span className="text-[10px] bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] px-2 py-1 rounded-full">
                🌍 {game.setting}
              </span>
            )}
            {game.features &&
              game.features.split(",").filter((f) => f.trim()).slice(0, 2).map((feature, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] px-2 py-1 rounded-full"
                >
                  ⚡ {feature.trim()}
                </span>
              ))}
          </div>
        )}

        {/* Spacer to push footer to bottom */}
        <div className="flex-1" />

        {/* Steam + часы и статус */}
        <div className="flex items-center gap-3 pt-2 mt-1 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-white/60">
            <FaSteam className="text-lg" />
            <span className="text-sm">{game.hours || "—"} ч</span>
          </div>
          {status && statusIcons[status] && (
            <div className={`flex items-center gap-2 ml-auto text-sm ${statusIcons[status].color}`}>
              <span className={`w-6 h-6 rounded-full ${statusIcons[status].bg} flex items-center justify-center`}>
                {statusIcons[status].icon}
              </span>
              <span className="font-medium">{status}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const GameCard = memo(GameCardInner);
GameCard.displayName = "GameCard";
export default GameCard;