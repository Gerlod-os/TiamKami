import {
  FaClock,
  FaCalendarAlt,
  FaGamepad,
  FaInfoCircle,
  FaCommentDots,
  FaStar,
  FaTrophy,
} from "react-icons/fa";
import { isUrl } from "../utils/normalize.js";
import { trackEvent } from "../utils/metrika.js";

// 3D золотой кубок «Мастер Игорь» (турнир МИ)
const MICupIcon = () => (
  <svg
    viewBox="0 0 64 64"
    className="w-16 h-16 md:w-20 md:h-20 animate-pulse shrink-0"
    style={{ filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.35))" }}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="miGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE066" />
        <stop offset="45%" stopColor="#FFC93C" />
        <stop offset="100%" stopColor="#FFB300" />
      </linearGradient>
    </defs>
    {/* Чаша */}
    <path
      d="M12 8h40v8c0 8.837-7.163 16-16 16h-8c-8.837 0-16-7.163-16-16V8z"
      fill="url(#miGold)"
      stroke="#B8860B"
      strokeWidth="2"
    />
    {/* Ножка */}
    <rect x="24" y="32" width="16" height="7" fill="url(#miGold)" />
    {/* Подставка */}
    <rect x="18" y="39" width="28" height="6" rx="1" fill="url(#miGold)" />
    <rect x="14" y="45" width="36" height="4" rx="1" fill="#B8860B" />
    {/* Блик */}
    <ellipse cx="23" cy="16" rx="4" ry="7" fill="rgba(255,255,255,0.45)" />
  </svg>
);

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

  const hasMI =
    game.miVideo &&
    isUrl(game.miVideo) &&
    (game.hasMI || "").toLowerCase() === "true";

  return (
    <div className="space-y-6">
      {/* Кубок МИ — заметный блок с турниром */}
      {hasMI && (
        <div className="p-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 rounded-2xl border-2 border-yellow-500/30">
          <div className="flex items-start gap-4">
            <MICupIcon />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-yellow-400 mb-2">
                Мастер Игорь — турнир МИ
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                Эта игра участвовала в турнире МИ! Смотрите выпуск с участием
                стримера.
              </p>
              <a
                href={game.miVideo}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("Клик МИ", { title: game.title })}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-xl hover:from-yellow-400 hover:to-orange-400 transition-all shadow-lg hover:shadow-yellow-500/50"
              >
                <FaTrophy />
                Смотреть выпуск МИ
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Основная информация */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="font-heading text-xl mb-4 text-white flex items-center gap-2">
          <FaInfoCircle className="text-[var(--accent-purple)]" />
          Основная информация
        </h3>

        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <InfoRow
            icon={
              <FaGamepad className="text-[var(--accent-purple)] shrink-0" />
            }
            label="Жанр"
            value={genre}
          />
          <InfoRow
            icon={
              <FaGamepad className="text-[var(--accent-purple)] shrink-0" />
            }
            label="Сложность"
            value={complexity !== "—" ? `${complexity}/10` : "—"}
          />
          <InfoRow
            icon={
              <FaCalendarAlt className="text-[var(--accent-cyan)] shrink-0" />
            }
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
            icon={
              <FaCalendarAlt className="text-[var(--accent-cyan)] shrink-0" />
            }
            label="Когда играл"
            value={playedDate}
          />
          <InfoRow label="Прогресс" value={`${progress}%`} />
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
            {features
              .split(",")
              .filter((f) => f.trim())
              .map((f, i) => (
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
