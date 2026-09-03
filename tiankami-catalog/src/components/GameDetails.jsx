import { FaClock, FaCalendarAlt, FaYoutube, FaGamepad } from "react-icons/fa";
import { isUrl } from "../utils/normalize.js";

// Тематические иконки статусов (единый справочник с GameCard)
const statusIcons = {
  Пройдено: <span aria-hidden="true">👑</span>,
  Дропнуто: <span aria-hidden="true">💀</span>,
  Обзор: <span aria-hidden="true">🔍</span>,
  "Жду релиза": <span aria-hidden="true">⏳</span>,
  "В процессе": <span aria-hidden="true">⚔️</span>,
};

const GameDetails = ({ game }) => {
  const genre = game.genre || "—";
  const features = game.features || "—";
  const setting = game.setting || "—";
  const rating = game.rating || "—";
  const complexity = game.complexity || "—";
  const hours = game.hours || "—";
  const releaseDate = game.releaseDate || "—";
  const playedDate = game.playedDate || "—";
  const status = game.status || "—";
  const progress = game.progress || "—";

  return (
    <div className="space-y-6">
      {/* Левая колонка: метаданные */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="font-heading text-xl mb-4 text-white">Информация об игре</h3>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FaGamepad className="text-accent-purple shrink-0" />
            <span>
              <span className="text-white/50">Жанр:</span>{" "}
              <span className="text-white/80">{genre}</span>
            </span>
          </div>
          <div>
            <span className="text-white/50">Особенности:</span>{" "}
            <span className="text-white/80">{features}</span>
          </div>
          <div>
            <span className="text-white/50">Сеттинг:</span>{" "}
            <span className="text-white/80">{setting}</span>
          </div>
          <div>
            <span className="text-white/50">Оценка:</span>{" "}
            <span className="text-white/80">
              {rating !== "—" ? `${rating}/10` : "—"}
            </span>
          </div>
          <div>
            <span className="text-white/50">Сложность:</span>{" "}
            <span className="text-white/80">
              {complexity !== "—" ? `${complexity}/10` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FaClock className="text-white/60 shrink-0" />
            <span>
              <span className="text-white/50">Наиграно:</span>{" "}
              <span className="text-white/80">{hours} ч</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-accent-blue shrink-0" />
            <span>
              <span className="text-white/50">Дата выхода:</span>{" "}
              <span className="text-white/80">{releaseDate}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/50">Когда играл:</span>{" "}
            <span className="text-white/80">{playedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/50">Статус:</span>{" "}
            <span className="text-white/80">
              {statusIcons[status]} {status}
            </span>
          </div>
          <div>
            <span className="text-white/50">Прогресс:</span>{" "}
            <span className="text-white/80">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Примечания */}
      {game.notes && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="font-heading text-lg mb-3 text-white">Примечания</h3>
          <p className="text-white/80 whitespace-pre-wrap">{game.notes}</p>
        </div>
      )}

      {/* Ссылки */}
      <div className="flex flex-wrap gap-4">
        {isUrl(game.youtube) && (
          <a
            href={game.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent-pink hover:text-white transition-colors"
          >
            <FaYoutube /> YouTube прохождение
          </a>
        )}

        {isUrl(game.steamUrl) && (
          <a
            href={game.steamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent-blue hover:text-white transition-colors"
          >
            🎮 Страница в Steam
          </a>
        )}

        {game.hasMI && game.hasMI.toLowerCase() === "true" && (
          isUrl(game.miVideo) ? (
            <a
              key="mi"
              href={game.miVideo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-accent-purple hover:text-white transition-colors"
            >
              🎬 Смотреть выпуск МИ
            </a>
          ) : (
            <span key="mi" className="text-white/70">
              Был проведён МИ.
            </span>
          )
        )}
      </div>
    </div>
  );
};

export default GameDetails;
