import { useState, useCallback } from "react";
import { FaStar, FaSteam } from "react-icons/fa";
import { isUrl } from "../utils/normalize.js";

const genreColors = [
  "bg-pink-400/25 text-pink-200 border border-pink-400/20",
  "bg-purple-400/25 text-purple-200 border border-purple-400/20",
  "bg-blue-400/25 text-blue-200 border border-blue-400/20",
  "bg-green-400/25 text-green-200 border border-green-400/20",
];

const GameCard = ({ game, onClick, onQuickView }) => {
  const [imageError, setImageError] = useState(false);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  const hasValidImage = isUrl(game.image) && !imageError;
  const genres = (game.genre || "").split(",").map((g) => g.trim()).filter(Boolean);
  const isPerfectRating = game.rating === 10;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`${game.title}, ${game.genre || "жанр не указан"}, оценка ${game.rating || "неизвестно"} из 10`}
      className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 hover:border-white/20 w-full min-w-0"
    >
      {/* Обложка */}
      <div className="relative h-52 overflow-hidden bg-gradient-to-br from-white/5 to-white/10">
        {hasValidImage ? (
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover"
            onError={handleError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl" aria-hidden="true">🎮</span>
          </div>
        )}

        {/* Затемнение снизу */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Бейдж рейтинга — ДО оверлея, чтобы быть поверх */}
        <div
          className={`absolute top-3 right-3 flex items-center justify-center w-14 h-14 rounded-2xl font-heading font-bold text-xl shadow-xl pointer-events-none ${
            isPerfectRating
              ? "bg-gradient-to-br from-yellow-300 to-amber-500 text-amber-950 shadow-amber-500/30"
              : "bg-black/60 backdrop-blur-md text-white shadow-black/40"
          }`}
          aria-label={`Рейтинг: ${game.rating || "—"}/10`}
        >
          {game.rating || "—"}
        </div>

        {/* Затемнение с кнопкой быстрого просмотра — ПОСЛЕ бейджа, чтобы покрывать */}
        <div
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickView) onQuickView();
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition transform hover:scale-105 pointer-events-auto"
          >
            👁️ Быстрый просмотр
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
                className={`px-3 py-1 rounded-full text-xs font-medium ${genreColors[index % genreColors.length]}`}
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
              <span className="text-[10px] bg-purple-400/20 text-purple-200 px-2 py-1 rounded-full border border-purple-400/20">
                🌍 {game.setting}
              </span>
            )}
            {game.features &&
              game.features.split(",").slice(0, 2).map((feature, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-blue-400/20 text-blue-200 px-2 py-1 rounded-full border border-blue-400/20"
                >
                  ⚡ {feature.trim()}
                </span>
              ))}
          </div>
        )}

        {/* Spacer to push footer to bottom */}
        <div className="flex-1" />

        {/* Steam + часы */}
        <div className="flex items-center gap-3 pt-2 mt-1 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-white/60">
            <FaSteam className="text-lg" />
            <span className="text-sm">{game.hours || "—"} ч</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <FaStar
              className={`text-sm ${isPerfectRating ? "text-yellow-400" : "text-yellow-400/50"}`}
            />
            <span className="text-sm text-white/60">
              {game.rating || "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
