import { useState, useCallback, useMemo, memo } from "react";
import {
  FaStar,
  FaSteam,
  FaCheckCircle,
  FaSkull,
  FaSearch,
  FaClock,
  FaPlay,
  FaTrophy,
} from "react-icons/fa";
import { isUrl, steamCoverUrl, steamHeaderUrl } from "../utils/normalize.js";
import { trackEvent } from "../utils/metrika.js";

// Цветовой индикатор жанра (цветная точка) — для быстрого визуального считывания
const genreDot = (genre) => {
  const g = genre.toLowerCase();
  if (/(экшен|action|боевик|шутер|shooter)/.test(g)) return "bg-red-400";
  if (/(rpg|рпг|рогалик|рогал|rpg-lite)/.test(g))
    return "bg-[var(--accent-purple)]";
  if (/(стратег|strategy|тактич|tactical)/.test(g)) return "bg-blue-400";
  if (/(хоррор|horror|ужас)/.test(g)) return "bg-red-800";
  if (/(платформ|platform)/.test(g)) return "bg-[var(--accent-cyan)]";
  if (/(головолом|puzzle|паззл)/.test(g)) return "bg-[var(--accent-mint)]";
  if (/(симулятор|simulation|simulator)/.test(g)) return "bg-orange-400";
  return "bg-gray-400";
};

// Иконка сеттинга по ключевым словам
const settingIcon = (s) => {
  const str = s.toLowerCase();
  if (/(фэнтези|fantasy|маги|средневеков)/.test(str)) return "⚔️";
  if (/(космос|sci|space|научн|киберпанк)/.test(str)) return "🚀";
  if (/(земл|реал|современ|war)/.test(str)) return "🌍";
  if (/(хоррор|ужас|мисти|тёмн)/.test(str)) return "🕯️";
  return "🌍";
};

// Иконки статусов (единый справочник с GameDetails)
const statusIcons = {
  Пройдено: {
    icon: <FaCheckCircle />,
    color: "text-green-400",
    bg: "bg-green-400/20",
  },
  Дропнуто: { icon: <FaSkull />, color: "text-red-400", bg: "bg-red-400/20" },
  Обзор: { icon: <FaSearch />, color: "text-blue-400", bg: "bg-blue-400/20" },
  "Жду релиза": {
    icon: <FaClock />,
    color: "text-yellow-400",
    bg: "bg-yellow-400/20",
  },
  "В процессе": {
    icon: <FaPlay />,
    color: "text-purple-400",
    bg: "bg-purple-400/20",
  },
};

function GameCardInner({ game, onClick, onQuickView }) {
  // Двухуровневый fallback обложек:
  // 1) вертикальная Steam 600x900 (library_600x900.jpg),
  // 2) горизонтальная header.jpg / game.image,
  // 3) кастомная заглушка, если обе не загрузились.
  const coverCandidates = useMemo(() => {
    const list = [];
    if (game.steamAppId) {
      list.push(steamCoverUrl(game.steamAppId));
      list.push(
        isUrl(game.image) ? game.image : steamHeaderUrl(game.steamAppId),
      );
    } else if (isUrl(game.image)) {
      list.push(game.image);
    }
    return list;
  }, [game]);
  const [failedCount, setFailedCount] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleClick = useCallback(() => {
    trackEvent("Просмотр игры", { title: game.title });
    onClick();
  }, [game.title, onClick]);

  const handleQuickView = useCallback(() => {
    trackEvent("Быстрый просмотр", { title: game.title });
    if (onQuickView) onQuickView();
  }, [game.title, onQuickView]);

  // При ошибке текущего источника переходим к следующему кандидату.
  const handleError = useCallback(() => {
    setFailedCount((c) => c + 1);
  }, []);

  const hasValidImage = failedCount < coverCandidates.length;
  const coverSrc = coverCandidates[failedCount];
  const genres = (game.genre || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const isPerfectRating = game.rating === 10;
  const status = game.status || "";

  // Цветовая кодировка оценки: 8-10 зелёный, 5-7 жёлтый, 1-4 красный; 10/10 — золото
  const ratingClass = isPerfectRating
    ? "bg-gradient-to-r from-yellow-300 to-amber-500 text-amber-950 border-2 border-yellow-400/50 animate-pulse shadow-[0_0_22px_rgba(255,215,0,0.55)]"
    : game.rating >= 8
      ? "bg-[#50C878] text-white shadow-[0_4px_14px_rgba(80,200,120,0.45)]"
      : game.rating >= 5
        ? "bg-[#FFD700] text-[#121212] shadow-[0_4px_14px_rgba(255,215,0,0.45)]"
        : "bg-[#CD5C5C] text-white shadow-[0_4px_14px_rgba(205,92,92,0.45)]";

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
      className="group relative flex flex-col bg-[var(--bg-secondary)] rounded-xl overflow-hidden border border-white/5 hover:border-[var(--accent-purple)]/30 cursor-pointer transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 hover:scale-[1.02] shadow-lg hover:shadow-2xl hover:shadow-[var(--accent-purple)]/25 w-full min-w-0"
    >
      {/* Обложка — портрет 2:3 */}
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-t-xl bg-[var(--bg-primary)]">
        {hasValidImage ? (
          <img
            src={coverSrc}
            alt={game.title}
            className={`absolute inset-0 w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-opacity duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={handleError}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
            <span
              className="text-[64px] leading-none opacity-30"
              aria-hidden="true"
            >
              🎮
            </span>
            <span className="text-xs text-white/40 px-2 text-center">
              Обложка недоступна
            </span>
          </div>
        )}

        {/* Бейдж рейтинга (правый верхний угол) */}
        {game.rating && (
          <div
            className={`absolute top-3 right-3 flex items-center gap-1.5 px-4 py-2 rounded-full font-heading font-bold text-lg shadow-lg pointer-events-none transition-transform duration-300 group-hover:scale-105 ${ratingClass}`}
            aria-label={`Рейтинг: ${game.rating}/10`}
          >
            <FaStar />
            {game.rating}
          </div>
        )}

        {/* МИ бейдж (левый верхний угол) — золотой, 3D, с анимацией */}
        {game.hasMI && game.hasMI.toLowerCase() === "true" && (
          <div className="absolute top-3 left-3 bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#FF8C00] text-[#121212] px-3 py-1.5 rounded-full text-xs font-bold shadow-[inset_0_1px_2px_rgba(255,255,255,0.55),0_4px_12px_rgba(255,215,0,0.4)] flex items-center gap-1 pointer-events-none transition-all duration-300 group-hover:brightness-110 group-hover:scale-105 group-hover:animate-mi-sway">
            <FaTrophy className="text-[10px]" />
            МИ
          </div>
        )}

        {/* Затемнение снизу — появляется при наведении */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Кнопка «Быстрый просмотр» — только при hover, внизу */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleQuickView();
          }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-2 px-6 py-2.5 border-2 border-[var(--accent-pink)] text-[var(--accent-pink)] font-bold rounded-full hover:bg-[var(--accent-pink)] hover:text-[var(--bg-primary)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] opacity-0 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105 shadow-lg shadow-[var(--accent-pink)]/20 z-10"
        >
          Быстрый просмотр
        </button>
      </div>

      {/* Контент */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Название */}
        <h3
          className="font-heading text-lg text-white font-bold truncate transition-colors duration-300 group-hover:text-[var(--accent-purple)]"
          title={game.title}
        >
          {game.title}
        </h3>

        {/* Жанры-чипсы (с цветным индикатором) */}
        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2 overflow-hidden max-h-8">
            {genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 border border-white/10"
              >
                <span
                  className={`w-2 h-2 rounded-full ${genreDot(genre)}`}
                  aria-hidden="true"
                />
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Сеттинг и особенности (мелкие теги, максимум 2+1) */}
        {(game.setting || game.features) && (
          <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-5">
            {game.setting && (
              <span className="text-[10px] bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] px-2 py-1 rounded-full">
                {settingIcon(game.setting)} {game.setting}
              </span>
            )}
            {game.features &&
              game.features
                .split(",")
                .filter((f) => f.trim())
                .slice(0, 2)
                .map((feature, i) => (
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

        {/* Нижняя строка: Steam + часы (крупно) и статус справа */}
        <div className="flex items-center gap-3 pt-2 mt-1 border-t border-white/10">
          <FaSteam
            className="text-white/50 text-sm flex-shrink-0"
            title="Steam"
            aria-hidden="true"
          />
          <span className="flex items-center gap-1.5 text-white/70">
            <FaClock className="text-sm" />
            <span className="text-base font-bold leading-none">
              {game.hours || "—"} ч
            </span>
          </span>
          {status && statusIcons[status] && (
            <div
              className={`flex items-center gap-2 ml-auto text-sm ${statusIcons[status].color}`}
            >
              <span
                className={`w-6 h-6 rounded-full ${statusIcons[status].bg} flex items-center justify-center`}
              >
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
