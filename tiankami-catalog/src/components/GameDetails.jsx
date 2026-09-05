import { FaClock, FaCalendarAlt, FaGamepad, FaInfoCircle, FaCommentDots, FaStar } from "react-icons/fa";

// Тематические иконки статусов (единый справочник с GameCard)
const statusIcons = {
  Пройдено: <span aria-hidden="true">👑</span>,
  Дропнуто: <span aria-hidden="true">💀</span>,
  Обзор: <span aria-hidden="true">🔍</span>,
  "Жду релиза": <span aria-hidden="true">⏳</span>,
  "В процессе": <span aria-hidden="true">⚔️</span>,
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-2">
    {icon && <span className="shrink-0">{icon}</span>}
    <span>
      <span className="text-white/50">{label}:</span>{" "}
      <span className="text-white/80">{value}</span>
    </span>
  </div>
);

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
          <FaInfoCircle className="text-[var(--accent-purple)]" />
          Основная информация
        </h3>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <InfoRow
            icon={<FaGamepad className="text-accent-purple shrink-0" />}
            label="Жанр"
            value={genre}
          />
          <InfoRow
            icon={<FaGamepad className="text-[var(--accent-purple)] shrink-0" />}
            label="Сложность"
            value={complexity !== "—" ? `${complexity}/10` : "—"}
          />
          <InfoRow
            icon={<FaCalendarAlt className="text-[var(--accent-cyan)] shrink-0" />}
            label="Дата выхода"
            value={releaseDate}
          />
          <InfoRow
            label="Статус"
            value={
              <span>
                {statusIcons[status]} {status}
              </span>
            }
          />
        </div>
      </div>

      {/* Детали */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="font-heading text-xl mb-4 text-white flex items-center gap-2">
          <FaGamepad className="text-[var(--accent-purple)]" />
          Детали
        </h3>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <InfoRow
            icon={<FaStar className="text-yellow-400 shrink-0" />}
            label="Оценка"
            value={rating !== "—" ? `${rating}/10` : "—"}
          />
          <InfoRow
            icon={<FaClock className="text-white/60 shrink-0" />}
            label="Наиграно"
            value={`${hours} ч`}
          />
          <InfoRow
            icon={<FaCalendarAlt className="text-[var(--accent-cyan)] shrink-0" />}
            label="Когда играл"
            value={playedDate}
          />
          <InfoRow
            label="Прогресс"
            value={`${progress}%`}
          />
        </div>
      </div>

      {/* Сеттинг */}
      {setting !== "—" && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="font-heading text-lg mb-3 text-white flex items-center gap-2">
            <FaGamepad className="text-[var(--accent-purple)]" />
            Сеттинг
          </h3>
          <div className="text-white/80 text-sm">{setting}</div>
        </div>
      )}

      {/* Особенности */}
      {features && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="font-heading text-lg mb-3 text-white flex items-center gap-2">
            <FaGamepad className="text-[var(--accent-purple)]" />
            Особенности
          </h3>
          <div className="flex flex-wrap gap-2">
            {features.split(",").filter((f) => f.trim()).map((f, i) => (
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

      {/* Примечания */}
      {game.notes && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="font-heading text-lg mb-3 text-white flex items-center gap-2">
            <FaCommentDots className="text-[var(--accent-purple)]" />
            Примечания
          </h3>
          <p className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
            {game.notes}
          </p>
        </div>
      )}

    </div>
  );
};

export default GameDetails;
