import { FaClock, FaCalendarAlt, FaYoutube, FaGamepad, FaSteam, FaVideo, FaInfoCircle, FaCog, FaCommentDots } from "react-icons/fa";
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
  const features = game.features;
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
      {/* Основная информация */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="font-heading text-xl mb-4 text-white flex items-center gap-2">
          <FaInfoCircle className="text-purple-400" />
          Основная информация
        </h3>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FaGamepad className="text-accent-purple shrink-0" />
            <span>
              <span className="text-white/50">Жанр:</span>{" "}
              <span className="text-white/80">{genre}</span>
            </span>
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

      {/* Детали */}
      <div className="space-y-4">
        {/* Сеттинг */}
        {setting !== "—" && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="font-heading text-lg mb-3 text-white flex items-center gap-2">
              <FaCog className="text-purple-400" />
              Сеттинг
            </h3>
            <div className="text-white/80 text-sm">{setting}</div>
          </div>
        )}

        {/* Особенности */}
        {features && (
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="font-heading text-lg mb-3 text-white flex items-center gap-2">
              <FaCog className="text-purple-400" />
              Особенности
            </h3>
            <div className="flex flex-wrap gap-2">
              {features.split(",").map((f, i) => (
                <span
                  key={i}
                  className="text-xs bg-green-400/20 text-green-200 px-3 py-1.5 rounded-full border border-green-400/20"
                >
                  {f.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Примечания */}
      {game.notes && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="font-heading text-lg mb-3 text-white flex items-center gap-2">
            <FaCommentDots className="text-purple-400" />
            Примечания
          </h3>
          <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
            {game.notes}
          </p>
        </div>
      )}

      {/* Ссылки — стильные кнопки */}
      <div className="flex flex-wrap gap-3">
        {isUrl(game.youtube) && (
          <a
            href={game.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-red-600/20 hover:shadow-red-600/40 hover:-translate-y-0.5"
          >
            <FaYoutube size={16} />
            YouTube прохождение
          </a>
        )}

        {isUrl(game.steamUrl) && (
          <a
            href={game.steamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1b2838]/80 hover:bg-[#1b2838] text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-black/30 hover:shadow-black/50 hover:-translate-y-0.5 border border-white/10"
          >
            <FaSteam size={16} />
            Steam
          </a>
        )}

        {game.hasMI && game.hasMI.toLowerCase() === "true" && (
          isUrl(game.miVideo) ? (
            <a
              key="mi"
              href={game.miVideo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-600/20 hover:shadow-purple-600/40 hover:-translate-y-0.5"
            >
              <FaVideo size={16} />
              Смотреть выпуск МИ
            </a>
          ) : (
            <span
              key="mi"
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600/30 text-purple-300 rounded-xl font-medium text-sm border border-purple-500/30"
            >
              <FaVideo size={16} />
              Был проведён МИ
            </span>
          )
        )}
      </div>
    </div>
  );
};

export default GameDetails;
