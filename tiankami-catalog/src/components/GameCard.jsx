import { FaStar, FaClock } from "react-icons/fa";
import { isUrl } from "../utils/normalize.js";

// Тематические иконки статусов в духе рогаликов
const statusIcons = {
  Пройдено: <span aria-hidden="true">👑</span>,
  Дропнуто: <span aria-hidden="true">💀</span>,
  Обзор: <span aria-hidden="true">🔍</span>,
  "Жду релиза": <span aria-hidden="true">⏳</span>,
  "В процессе": <span aria-hidden="true">⚔️</span>,
};

const GameCard = ({ game, onClick }) => {
  const statusIcon = statusIcons[game.status] || null;

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
      className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 hover:border-accent-purple/50 hover:shadow-glow-purple hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer"
    >
      <div className="h-40 bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 flex items-center justify-center">
        {isUrl(game.image) ? (
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl" aria-hidden="true">
            🎮
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3
          className="font-heading text-lg text-white truncate"
          title={game.title}
        >
          {game.title}
        </h3>
        <p className="text-sm text-white/60 mt-1 truncate">
          {game.genre || "—"}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div
            className="flex items-center gap-1"
            data-tip={`Оценка: ${game.rating || "—"}/10`}
          >
            <FaStar className="text-yellow-400" />
            <span className="font-bold text-lg">{game.rating || "—"}</span>
          </div>
          <div
            className="flex items-center gap-1"
            data-tip={`Наиграно часов: ${game.hours || "—"}`}
          >
            <FaClock className="text-white/50" />
            <span className="text-sm text-white/70">{game.hours || "—"} ч</span>
          </div>
          <div data-tip={game.status || "Статус неизвестен"}>{statusIcon}</div>
        </div>
      </div>
    </div>
  );
};

export default GameCard;
