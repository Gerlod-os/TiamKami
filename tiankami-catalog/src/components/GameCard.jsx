import { useState, useCallback } from "react";
import { FaStar, FaClock, FaSteam } from "react-icons/fa";
import { isUrl } from "../utils/normalize.js";

const genreColors = [
  "bg-pink-300/30 text-pink-200",
  "bg-purple-300/30 text-purple-200",
  "bg-blue-300/30 text-blue-200",
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
      className="group bg-white/5 rounded-2xl overflow-hidden border border-white/10 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-white/20"
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
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Затемнение с кнопкой быстрого просмотра */}
        <div
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onQuickView) onQuickView();
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-medium transition transform hover:scale-105"
          >
            👁️ Быстрый просмотр
          </button>
        </div>

        {/* Бейдж рейтинга */}
        <div
          className={`absolute top-3 right-3 flex items-center justify-center w-12 h-12 rounded-xl font-heading font-bold text-lg shadow-lg ${
            isPerfectRating
              ? "bg-gradient-to-br from-yellow-300 to-amber-500 text-amber-950"
              : "bg-black/50 backdrop-blur-sm text-white"
          }`}
          aria-label={`Рейтинг: ${game.rating || "—"}/10`}
        >
          {game.rating || "—"}
        </div>
      </div>

      {/* Контент */}
      <div className="p-4 flex flex-col gap-3">
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

        {/* Steam + часы */}
        <div className="mt-auto flex items-center gap-3 pt-2 border-t border-white/10">
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
