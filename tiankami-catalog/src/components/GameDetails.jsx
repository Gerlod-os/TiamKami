import { useState, useMemo } from "react";
import { FaClock, FaCalendarAlt, FaYoutube, FaGamepad } from "react-icons/fa";
import { isUrl } from "../utils/normalize.js";
import { getImageSources } from "../utils/imageFallback.js";

// Тематические иконки статусов (единый справочник с GameCard)
const statusIcons = {
  Пройдено: <span aria-hidden="true">👑</span>,
  Дропнуто: <span aria-hidden="true">💀</span>,
  Обзор: <span aria-hidden="true">🔍</span>,
  "Жду релиза": <span aria-hidden="true">⏳</span>,
  "В процессе": <span aria-hidden="true">⚔️</span>,
};

const GameDetails = ({ game }) => {
  // Вычисляем массив источников один раз при рендере
  const imageSources = useMemo(() => getImageSources(game), [game]);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

  // Если текущий индекс выходит за пределы массива, показываем заглушку
  const hasValidImage = currentSourceIndex < imageSources.length;
  const currentImageSrc = hasValidImage ? imageSources[currentSourceIndex] : null;
  
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <div className="h-56 bg-gradient-to-br from-accent-purple/20 to-accent-pink/20 rounded-xl flex items-center justify-center mb-4 overflow-hidden relative">
          {hasValidImage && currentImageSrc.startsWith('data:image/svg') ? (
            // Если это SVG-заглушка, рендерим сразу без попытки загрузки
            <img
              src={currentImageSrc}
              alt={game.title}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : hasValidImage ? (
            // Если это URL, пробуем загрузить с обработкой ошибок
            <img
              src={currentImageSrc}
              alt={game.title}
              className="w-full h-full object-cover rounded-xl"
              onError={() => {
                // Пробуем следующий источник
                if (currentSourceIndex < imageSources.length - 1) {
                  setCurrentSourceIndex(prev => prev + 1);
                }
              }}
            />
          ) : (
            // Фоллбэк на случай полной неудачи
            <span className="text-6xl">🎮</span>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <FaGamepad className="text-accent-purple" />
            <span className="text-white/70">Жанр:</span> {game.genre}
          </div>
          <div>
            <span className="text-white/70">Особенности:</span> {game.features}
          </div>
          <div>
            <span className="text-white/70">Сеттинг:</span> {game.setting}
          </div>
          <div>
            <span className="text-white/70">Оценка:</span>{" "}
            {game.rating ? `${game.rating}/10` : "—"}
          </div>
          <div>
            <span className="text-white/70">Сложность:</span>{" "}
            {game.complexity ? `${game.complexity}/10` : "—"}
          </div>
          <div className="flex items-center gap-2">
            <FaClock className="text-white/60" />
            <span className="text-white/70">Наиграно:</span> {game.hours} ч
          </div>
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="text-accent-blue" />
            <span className="text-white/70">Дата выхода:</span>{" "}
            {game.releaseDate}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/70">Когда играл:</span>{" "}
            {game.playedDate}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/70">Статус:</span>{" "}
            {statusIcons[game.status]} {game.status}
          </div>
          <div>
            <span className="text-white/70">Прогресс:</span> {game.progress}%
          </div>
        </div>
      </div>

      <div>
        <div className="bg-white/5 rounded-xl p-4 mb-4">
          <h3 className="font-heading text-lg mb-2">Примечания</h3>
          <p className="text-white/80 whitespace-pre-wrap">
            {game.notes || "—"}
          </p>
        </div>

        {isUrl(game.youtube) && (
          <a
            href={game.youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent-pink hover:text-white transition-colors mb-4"
          >
            <FaYoutube /> YouTube прохождение
          </a>
        )}

        {isUrl(game.steamUrl) && (
          <a
            href={game.steamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-accent-blue hover:text-white transition-colors mb-4"
          >
            🎮 Страница в Steam
          </a>
        )}

        {game.hasMI && game.hasMI.toLowerCase() === "true" && (
          <div className="bg-white/5 rounded-xl p-4 mb-4">
            <h3 className="font-heading text-lg mb-2">
              Многопользовательский интерактив (МИ)
            </h3>
            {isUrl(game.miVideo) ? (
              <a
                href={game.miVideo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-purple hover:text-white transition-colors"
              >
                Смотреть выпуск МИ
              </a>
            ) : (
              <p className="text-white/70">Был проведён МИ.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameDetails;
